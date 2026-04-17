"""
app.py — ConsulPredict snow-sync core functions.

Syncs ServiceNow incidents into ITSM_DB.INCIDENT_ANALYTICS.INCIDENT_HISTORY.
Called by main.py (Container App Job).
"""

import datetime
import logging
import os
import sys

import httpx

try:
    import snowflake.connector
except ImportError:  # pragma: no cover
    snowflake = None  # type: ignore

for _rel in ["..", "../.."]:
    _p = os.path.abspath(os.path.join(os.path.dirname(__file__), _rel))
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from shared.keyvault import get_secret  # noqa: E402
except Exception:  # pragma: no cover
    def get_secret(name):  # type: ignore
        val = os.getenv(name.replace("-", "_").upper())
        if not val:
            raise RuntimeError(f"Secret not found: {name}")
        return val

logger = logging.getLogger(__name__)

_SF_ACCOUNT_DEFAULT = "BI24418.central-india.azure"
_SF_WAREHOUSE_DEFAULT = "COMPUTE_WH"
_SF_DATABASE = "ITSM_DB"
_SF_SCHEMA = "INCIDENT_ANALYTICS"
_SF_TABLE = "INCIDENT_HISTORY"


def fetch_incidents(date: str) -> list:
    """Fetch incidents from ServiceNow updated after the given date."""
    base_url = get_secret("consul-predict-servicenow-baseurl")
    username = get_secret("consul-predict-servicenow-username")
    password = get_secret("consul-predict-servicenow-password")

    url = f"{base_url}/api/now/table/incident"
    params = {
        "sysparm_query": f"sys_updated_on>={date}",
        "sysparm_fields": (
            "sys_id,number,short_description,cmdb_ci,cmdb_ci.name,"
            "priority,category,opened_at,resolved_at,state,assignment_group"
        ),
        "sysparm_limit": "1000",
    }
    try:
        response = httpx.get(url, params=params, auth=(username, password), timeout=30.0)
        response.raise_for_status()
        return response.json().get("result", [])
    except httpx.HTTPError as exc:
        logger.error("ServiceNow fetch error: %s", exc)
        return []


def enrich_incident(incident: dict) -> dict:
    """Enrich raw ServiceNow incident with computed analytics fields."""
    enriched = dict(incident)

    opened = incident.get("opened_at")
    resolved = incident.get("resolved_at")

    if opened and resolved:
        try:
            fmt = "%Y-%m-%d %H:%M:%S"
            delta = (
                datetime.datetime.strptime(resolved, fmt)
                - datetime.datetime.strptime(opened, fmt)
            )
            enriched["resolution_time_minutes"] = int(delta.total_seconds() / 60)
        except Exception:
            enriched["resolution_time_minutes"] = None
    else:
        enriched["resolution_time_minutes"] = None

    sla_limits = {1: 240, 2: 480, 3: 1440}
    priority = incident.get("priority")
    res_time = enriched.get("resolution_time_minutes")

    if priority and res_time is not None:
        limit = sla_limits.get(int(priority))
        enriched["sla_breached"] = res_time > limit if limit else False
    else:
        enriched["sla_breached"] = False

    if opened:
        try:
            dt = datetime.datetime.strptime(opened, "%Y-%m-%d %H:%M:%S")
            enriched["day_of_week"] = dt.strftime("%A")
            enriched["hour_of_day"] = dt.hour
        except Exception:
            enriched["day_of_week"] = None
            enriched["hour_of_day"] = None
    else:
        enriched["day_of_week"] = None
        enriched["hour_of_day"] = None

    cmdb_ci = incident.get("cmdb_ci")
    if isinstance(cmdb_ci, dict):
        enriched["ci_id"] = cmdb_ci.get("value") or cmdb_ci.get("display_value")
        ci_name = incident.get("cmdb_ci.name", {})
        enriched["ci_name"] = ci_name.get("display_value", "") if isinstance(ci_name, dict) else ""
    else:
        enriched["ci_id"] = cmdb_ci or "UNKNOWN"
        enriched["ci_name"] = ""

    enriched["sync_date"] = datetime.datetime.now(
        datetime.timezone.utc
    ).strftime("%Y-%m-%d %H:%M:%S")
    return enriched


def get_snowflake_connection():
    if snowflake is None:
        raise RuntimeError("snowflake-connector-python not installed")
    return snowflake.connector.connect(
        account=(get_secret("consul-predict-snowflake-account") or _SF_ACCOUNT_DEFAULT),  # noqa: W503
        user=get_secret("consul-predict-snowflake-user"),
        password=get_secret("consul-predict-snowflake-password"),
        warehouse=get_secret("consul-predict-snowflake-warehouse") or _SF_WAREHOUSE_DEFAULT,
        database=_SF_DATABASE,
        schema=_SF_SCHEMA,
    )


def ensure_table(cursor) -> None:
    """Create INCIDENT_HISTORY if it does not exist (idempotent)."""
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {_SF_TABLE} (
            sys_id                  STRING        NOT NULL,
            incident_id             STRING,
            ci_id                   STRING,
            ci_name                 STRING,
            short_description       STRING,
            category                STRING,
            priority                INTEGER,
            state                   STRING,
            assignment_group        STRING,
            opened_at               TIMESTAMP_NTZ,
            resolved_at             TIMESTAMP_NTZ,
            resolution_time_minutes INTEGER,
            sla_breached            BOOLEAN,
            day_of_week             STRING,
            hour_of_day             INTEGER,
            sync_date               TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
    """)


def write_incidents_to_snowflake(incidents: list) -> int:
    """MERGE enriched incidents into INCIDENT_HISTORY. Returns rows written."""
    if not incidents:
        return 0
    conn = get_snowflake_connection()
    cursor = conn.cursor()
    written = 0
    try:
        ensure_table(cursor)
        for inc in incidents:
            try:
                cursor.execute(
                    f"""
                    MERGE INTO {_SF_TABLE} AS target
                    USING (SELECT %s AS sys_id) AS source
                    ON target.sys_id = source.sys_id
                    WHEN MATCHED THEN UPDATE SET
                        incident_id = %s, ci_id = %s, ci_name = %s,
                        short_description = %s, category = %s, priority = %s,
                        state = %s, assignment_group = %s,
                        opened_at = %s::TIMESTAMP_NTZ, resolved_at = %s::TIMESTAMP_NTZ,
                        resolution_time_minutes = %s, sla_breached = %s,
                        day_of_week = %s, hour_of_day = %s, sync_date = %s::TIMESTAMP_NTZ
                    WHEN NOT MATCHED THEN INSERT (
                        sys_id, incident_id, ci_id, ci_name, short_description,
                        category, priority, state, assignment_group,
                        opened_at, resolved_at, resolution_time_minutes, sla_breached,
                        day_of_week, hour_of_day, sync_date
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s::TIMESTAMP_NTZ, %s::TIMESTAMP_NTZ,
                        %s, %s, %s, %s, %s::TIMESTAMP_NTZ
                    )
                    """,
                    (
                        inc.get("sys_id"),
                        inc.get("number"), inc.get("ci_id"), inc.get("ci_name", ""),
                        inc.get("short_description", ""), inc.get("category", ""),
                        int(inc.get("priority", 3)), str(inc.get("state", "")),
                        inc.get("assignment_group", ""),
                        inc.get("opened_at"), inc.get("resolved_at"),
                        inc.get("resolution_time_minutes"), inc.get("sla_breached", False),
                        inc.get("day_of_week"), inc.get("hour_of_day"),
                        inc.get("sync_date"),
                        inc.get("sys_id"),
                        inc.get("number"), inc.get("ci_id"), inc.get("ci_name", ""),
                        inc.get("short_description", ""), inc.get("category", ""),
                        int(inc.get("priority", 3)), str(inc.get("state", "")),
                        inc.get("assignment_group", ""),
                        inc.get("opened_at"), inc.get("resolved_at"),
                        inc.get("resolution_time_minutes"), inc.get("sla_breached", False),
                        inc.get("day_of_week"), inc.get("hour_of_day"),
                        inc.get("sync_date"),
                    ),
                )
                written += 1
            except Exception as exc:
                logger.error("Failed to merge %s: %s", inc.get("sys_id"), exc)
        conn.commit()
        logger.info("Synced %d incidents to %s", written, _SF_TABLE)
    finally:
        cursor.close()
        conn.close()
    return written


def refresh_agg_view(conn=None) -> None:
    """Refresh CI_INCIDENT_AGG view — used by consul-predict-api (Task 5)."""
    close_after = False
    if conn is None:
        conn = get_snowflake_connection()
        close_after = True
    try:
        with conn.cursor() as cur:
            cur.execute(f"""
                CREATE OR REPLACE VIEW CI_INCIDENT_AGG AS
                SELECT
                    ci_id,
                    COUNT(CASE WHEN opened_at >= DATEADD(hour, -24, CURRENT_TIMESTAMP())
                               THEN 1 END) AS frequency_24h,
                    COUNT(CASE WHEN opened_at >= DATEADD(day, -7, CURRENT_TIMESTAMP())
                               THEN 1 END) AS frequency_7d,
                    AVG(resolution_time_minutes) AS avg_resolution_time,
                    MAX(opened_at) AS last_incident_at
                FROM {_SF_TABLE}
                GROUP BY ci_id
            """)
        conn.commit()
        logger.info("CI_INCIDENT_AGG view refreshed")
    finally:
        if close_after:
            conn.close()
