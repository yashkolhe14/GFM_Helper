"""
main.py — ConsulPredict snow-sync Container App Job entry point.

Syncs ServiceNow incidents into ITSM_DB.INCIDENT_ANALYTICS.INCIDENT_HISTORY
on a configurable schedule (default every 30 minutes).
"""

import datetime
import logging
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from app import (  # noqa: E402
    enrich_incident,
    fetch_incidents,
    refresh_agg_view,
    write_incidents_to_snowflake,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s - %(message)s",
)
logger = logging.getLogger("snow-sync")

SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES", "30"))
LOOKBACK_DAYS = int(os.getenv("LOOKBACK_DAYS", "7"))


def get_since_date() -> str:
    start = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=LOOKBACK_DAYS)
    return start.strftime("%Y-%m-%d %H:%M:%S")


def run_sync_cycle() -> dict:
    start = time.time()
    since = get_since_date()
    logger.info("Sync cycle starting — fetching incidents since %s", since)

    raw = fetch_incidents(since)
    logger.info("Fetched %d incidents from ServiceNow", len(raw))

    if not raw:
        logger.info("Nothing to sync — cycle complete")
        return {"fetched": 0, "written": 0, "errors": 0, "duration_seconds": 0}

    enriched, errors = [], 0
    for inc in raw:
        try:
            enriched.append(enrich_incident(inc))
        except Exception as exc:
            logger.warning("Enrichment failed for %s: %s", inc.get("sys_id"), exc)
            errors += 1

    written = write_incidents_to_snowflake(enriched)

    try:
        refresh_agg_view()
    except Exception as exc:
        logger.warning("View refresh failed: %s", exc)

    duration = round(time.time() - start, 2)
    summary = {
        "fetched": len(raw), "enriched": len(enriched),
        "written": written, "errors": errors,
        "duration_seconds": duration,
        "synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    logger.info("Sync complete: %s", summary)
    return summary


def main():
    logger.info("snow-sync started — interval=%dm lookback=%dd",
                SYNC_INTERVAL_MINUTES, LOOKBACK_DAYS)
    while True:
        try:
            run_sync_cycle()
        except Exception as exc:
            logger.exception("Sync cycle failed: %s", exc)
        logger.info("Sleeping %d minutes...", SYNC_INTERVAL_MINUTES)
        time.sleep(SYNC_INTERVAL_MINUTES * 60)


if __name__ == "__main__":
    main()
