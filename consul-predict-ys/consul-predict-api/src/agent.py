"""
agent.py — ConsulPredict prediction pipeline (LangGraph).

Implements Tasks 5-10 and 14 (Week 2-3, Yash Kolhe):
  Task 5  — Snowflake data fetch  (ITSM_DB.INCIDENT_ANALYTICS.INCIDENT_HISTORY)
  Task 6  — Feature engineering   (spike, trend, criticality normalisation)
  Task 7  — Deterministic scoring (F×0.5 + S×0.3 + C×0.2)
  Task 8  — AI evaluation         (Azure OpenAI + guardrails)
  Task 9  — Final hybrid risk     (deterministic + AI adjustment)
  Task 10 — API orchestration     (called from app.py)
  Task 14 — Prediction logging    (CONSUL_PREDICT.PUBLIC.PREDICTION_LOG)

Snowflake (same account as it-ops-copilot):
  Account  : BI24418.central-india.azure
  Warehouse: COMPUTE_WH
  Source   : ITSM_DB.INCIDENT_ANALYTICS.INCIDENT_HISTORY
  Log      : CONSUL_PREDICT.PUBLIC.PREDICTION_LOG

All secrets from Azure Key Vault (kv-consulevent-dev) via shared.keyvault,
or environment variables for local dev.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional, TypedDict

try:
    import snowflake.connector
except ImportError:  # pragma: no cover
    snowflake = None  # type: ignore

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

try:
    from azure.identity import DefaultAzureCredential, get_bearer_token_provider
except Exception:  # pragma: no cover
    DefaultAzureCredential = None  # type: ignore
    get_bearer_token_provider = None  # type: ignore

try:
    from langgraph.graph import END, StateGraph
except Exception:  # pragma: no cover
    END = "__end__"

    class _FallbackGraph:  # type: ignore
        def __init__(self, nodes, edges, entry):
            self._nodes = nodes
            self._edges = edges
            self._entry = entry

        def invoke(self, state):
            current = self._entry
            while current != END:
                state = self._nodes[current](state)
                current = self._edges.get(current, END)
            return state

    class StateGraph:  # type: ignore
        def __init__(self, _):
            self._nodes: dict = {}
            self._edges: dict = {}
            self._entry: Optional[str] = None

        def add_node(self, name, fn):
            self._nodes[name] = fn

        def set_entry_point(self, name):
            self._entry = name

        def add_edge(self, src, dst):
            self._edges[src] = dst

        def compile(self):
            return _FallbackGraph(self._nodes, self._edges, self._entry)


# Shared Key Vault — works in Docker (.. = /app/) and local dev (../.. = consul-predict/)
for _rel in ["..", "../.."]:
    _p = os.path.abspath(os.path.join(os.path.dirname(__file__), _rel))
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from shared.keyvault import get_secret as _kv_get_secret
except Exception:  # pragma: no cover
    _kv_get_secret = None  # type: ignore

logger = logging.getLogger(__name__)

# =============================================================================
# Constants
# =============================================================================
_SF_ACCOUNT_DEFAULT = "BI24418.central-india.azure"
_SF_WAREHOUSE_DEFAULT = "COMPUTE_WH"
_SF_SRC_DB = "ITSM_DB"
_SF_SRC_SCHEMA = "INCIDENT_ANALYTICS"
_SF_SRC_TABLE = "INCIDENT_HISTORY"
_SF_LOG_DB = "CONSUL_PREDICT"
_SF_LOG_SCHEMA = "PUBLIC"
_SF_LOG_TABLE_DEFAULT = "PREDICTION_LOG"


# =============================================================================
# LangGraph state
# =============================================================================
class PredictionState(TypedDict):
    request: dict
    validated_request: Optional[dict]
    snowflake_data: Optional[dict]
    features: Optional[dict]
    deterministic: Optional[dict]
    ai_output: Optional[dict]
    final_result: Optional[dict]
    log_result: Optional[dict]
    error: Optional[dict]


# =============================================================================
# Helpers
# =============================================================================
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_int(v: Any, default: int = 0) -> int:
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def _to_float(v: Any, default: float = 0.0) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _clamp_score(v: float) -> float:
    return _clamp(v, 0.0, 100.0)


def _clamp_ai_adj(v: float) -> float:
    """Cap AI adjustment to ±15 (Task 8 guardrail)."""
    return _clamp(v, -15.0, 15.0)


def _risk_level(score: float, thresholds: Optional[dict] = None) -> str:
    t = thresholds or {}
    high = t.get("high", 80)
    medium = t.get("medium", 50)
    if score >= high:
        return "High"
    if score >= medium:
        return "Medium"
    return "Low"


def _env_or_secret(env: str, secret: Optional[str] = None,
                   default: Optional[str] = None) -> Optional[str]:
    """Read from env first; fall back to Azure Key Vault."""
    value = os.getenv(env)
    if value:
        return value
    if secret and _kv_get_secret is not None:
        try:
            return _kv_get_secret(secret)
        except Exception as exc:
            logger.debug("Key Vault lookup failed for %s: %s", secret, exc)
    return default


def _normalise_criticality(value: Any) -> float:
    """Normalise criticality to 0-100 scale."""
    if value is None:
        return 50.0
    if isinstance(value, str):
        mapping = {
            "low": 25.0, "medium": 50.0, "high": 75.0, "critical": 100.0,
            "tier1": 100.0, "tier2": 75.0, "tier3": 50.0, "tier4": 25.0,
        }
        key = value.strip().lower().replace(" ", "")
        if key in mapping:
            return mapping[key]
        try:
            value = float(value)
        except ValueError:
            return 50.0
    num = float(value)
    if 0.0 <= num <= 1.0:
        return num * 100.0
    if 1.0 < num <= 5.0:
        return {1.0: 100.0, 2.0: 75.0, 3.0: 50.0, 4.0: 25.0, 5.0: 10.0}.get(num, 50.0)
    return _clamp_score(num)


def _normalise_azure_url(endpoint: str) -> str:
    endpoint = endpoint.strip().rstrip("/")
    if endpoint.endswith("/openai/v1"):
        return endpoint + "/"
    if endpoint.endswith(".openai.azure.com"):
        return endpoint + "/openai/v1/"
    if "/openai/v1" in endpoint:
        return endpoint if endpoint.endswith("/") else endpoint + "/"
    return endpoint + "/openai/v1/"


def _extract_json(text: str) -> dict:
    text = text.strip()
    if not text:
        raise ValueError("Empty AI response")
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    s, e = text.find("{"), text.rfind("}")
    if s == -1 or e <= s:
        raise ValueError("No JSON object in AI response")
    parsed = json.loads(text[s:e + 1])
    if not isinstance(parsed, dict):
        raise ValueError("AI JSON is not an object")
    return parsed


def _load_thresholds() -> dict:
    """Load risk thresholds from config/thresholds.json (Task 11)."""
    paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "config", "thresholds.json"),
        os.path.join(os.path.dirname(__file__), "config", "thresholds.json"),
        "/app/config/thresholds.json",
    ]
    for p in paths:
        try:
            with open(p) as f:
                return json.load(f)
        except Exception:
            continue
    logger.warning("thresholds.json not found — using defaults")
    return {"high": 80, "medium": 50, "low": 0}


# =============================================================================
# Snowflake connections
# =============================================================================
def _get_sf_source_conn():
    """Connect to ITSM_DB.INCIDENT_ANALYTICS — source of incident history."""
    if snowflake is None:
        raise RuntimeError("snowflake-connector-python not installed")
    account = _env_or_secret("SNOWFLAKE_ACCOUNT", "consul-predict-snowflake-account", _SF_ACCOUNT_DEFAULT)
    user = _env_or_secret("SNOWFLAKE_USER", "consul-predict-snowflake-user")
    password = _env_or_secret("SNOWFLAKE_PASSWORD", "consul-predict-snowflake-password")
    warehouse = _env_or_secret("SNOWFLAKE_WAREHOUSE", "consul-predict-snowflake-warehouse", _SF_WAREHOUSE_DEFAULT)
    if not all([account, user, password]):
        raise RuntimeError("Snowflake source credentials incomplete")
    return snowflake.connector.connect(
        account=account, user=user, password=password,
        warehouse=warehouse, database=_SF_SRC_DB, schema=_SF_SRC_SCHEMA,
    )


def _get_sf_log_conn():
    """Connect to CONSUL_PREDICT.PUBLIC — prediction log target."""
    if snowflake is None:
        raise RuntimeError("snowflake-connector-python not installed")
    account = _env_or_secret("SNOWFLAKE_ACCOUNT", "consul-predict-snowflake-account", _SF_ACCOUNT_DEFAULT)
    user = _env_or_secret("SNOWFLAKE_USER", "consul-predict-snowflake-user")
    password = _env_or_secret("SNOWFLAKE_PASSWORD", "consul-predict-snowflake-password")
    warehouse = _env_or_secret("SNOWFLAKE_WAREHOUSE", "consul-predict-snowflake-warehouse", _SF_WAREHOUSE_DEFAULT)
    if not all([account, user, password]):
        raise RuntimeError("Snowflake log credentials incomplete")
    return snowflake.connector.connect(
        account=account, user=user, password=password,
        warehouse=warehouse, database=_SF_LOG_DB, schema=_SF_LOG_SCHEMA,
    )


def _get_openai_client():
    if OpenAI is None:
        raise RuntimeError("openai package not installed")
    endpoint = _env_or_secret("AZURE_OPENAI_ENDPOINT", "consul-predict-openai-endpoint")
    deployment = _env_or_secret("AZURE_OPENAI_DEPLOYMENT", "consul-predict-openai-deployment", "gpt-4o")
    api_key = _env_or_secret("AZURE_OPENAI_API_KEY", "consul-predict-openai-apikey")
    if not endpoint:
        raise RuntimeError("Azure OpenAI endpoint not configured")
    base_url = _normalise_azure_url(endpoint)
    if api_key:
        return OpenAI(base_url=base_url, api_key=api_key), deployment, "api_key"
    if DefaultAzureCredential is None:
        raise RuntimeError("azure-identity unavailable for Entra ID auth")
    token_provider = get_bearer_token_provider(
        DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
    )
    return OpenAI(base_url=base_url, api_key=token_provider), deployment, "entra_id"


# =============================================================================
# Node 1 — Validate request  (Task 10)
# =============================================================================
def validate_request(state: PredictionState) -> PredictionState:
    """Validate incoming payload. Require ci/ci_id/configuration_item."""
    req = dict(state.get("request") or {})
    ci = req.get("ci") or req.get("ci_id") or req.get("configuration_item")
    if not ci or not str(ci).strip():
        state["error"] = {"status": "error", "message": "Missing required field: ci"}
        return state
    state["validated_request"] = {
        "request_id": req.get("request_id") or str(uuid.uuid4()),
        "timestamp": _now_iso(),
        "ci": str(ci).strip(),
        "criticality": req.get("criticality"),
        "mode": (req.get("mode") or "hybrid").lower(),
        "metadata": dict(req.get("metadata") or {}),
        "mock_snowflake_data": req.get("mock_snowflake_data"),
    }
    return state


# =============================================================================
# Node 2 — Snowflake data fetch  (Task 5)
# =============================================================================
def fetch_ci_incident_data(state: PredictionState) -> PredictionState:
    """
    Task 5 — Query ITSM_DB.INCIDENT_ANALYTICS.INCIDENT_HISTORY.

    Returns frequency_24h, frequency_7d, avg_resolution_time for the CI.
    Falls back to zeros gracefully — pipeline never crashes on DB errors.
    """
    if state.get("error"):
        return state

    validated = state["validated_request"]
    ci = validated["ci"]

    # Dev/test override — bypass live Snowflake
    mock = validated.get("mock_snowflake_data")
    if isinstance(mock, dict):
        state["snowflake_data"] = {
            "ci": ci,
            "frequency_24h": _to_int(mock.get("frequency_24h")),
            "frequency_7d": _to_int(mock.get("frequency_7d")),
            "avg_resolution_time": _to_float(mock.get("avg_resolution_time")),
            "source": "mock",
        }
        return state

    try:
        conn = _get_sf_source_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    SELECT
                        ci_id,
                        COUNT(CASE WHEN opened_at >= DATEADD(hour, -24, CURRENT_TIMESTAMP())
                                   THEN 1 END)                                   AS frequency_24h,
                        COUNT(CASE WHEN opened_at >= DATEADD(day,  -7,  CURRENT_TIMESTAMP())
                                   THEN 1 END)                                   AS frequency_7d,
                        AVG(DATEDIFF('minute', opened_at, resolved_at))          AS avg_resolution_time
                    FROM {_SF_SRC_DB}.{_SF_SRC_SCHEMA}.{_SF_SRC_TABLE}
                    WHERE ci_id = %s
                    GROUP BY ci_id
                    """,
                    (ci,),
                )
                row = cur.fetchone()
            if row:
                state["snowflake_data"] = {
                    "ci": row[0], "frequency_24h": _to_int(row[1]),
                    "frequency_7d": _to_int(row[2]),
                    "avg_resolution_time": _to_float(row[3]), "source": "snowflake",
                }
            else:
                logger.info("No Snowflake rows for CI %s — using zero baseline", ci)
                state["snowflake_data"] = {
                    "ci": ci, "frequency_24h": 0, "frequency_7d": 0,
                    "avg_resolution_time": 0.0, "source": "snowflake_empty",
                }
        finally:
            conn.close()
    except Exception as exc:
        logger.warning("Snowflake fetch failed for %s: %s — using zero baseline", ci, exc)
        state["snowflake_data"] = {
            "ci": ci, "frequency_24h": 0, "frequency_7d": 0,
            "avg_resolution_time": 0.0, "fetch_error": str(exc), "source": "fallback",
        }
    return state


# =============================================================================
# Node 3 — Feature engineering  (Task 6)
# =============================================================================
def generate_features(state: PredictionState) -> PredictionState:
    """
    Task 6 — Convert raw Snowflake data into prediction-ready features.

    Derives:
      spike    — 1 if 24h count exceeds 1.5× daily average
      trend    — increasing | stable | decreasing
      criticality_norm — normalised to 0-100
    """
    if state.get("error"):
        return state

    sf = state.get("snowflake_data") or {}
    validated = state["validated_request"]

    freq_24h = _to_int(sf.get("frequency_24h"))
    freq_7d = _to_int(sf.get("frequency_7d"))
    avg_res = _to_float(sf.get("avg_resolution_time"))

    avg_daily = freq_7d / 7.0 if freq_7d > 0 else 0.0

    # Spike detection
    if avg_daily > 0 and freq_24h > avg_daily * 1.5:
        spike = 1
    elif avg_daily == 0 and freq_24h > 5:
        spike = 1
    else:
        spike = 0

    # Trend
    if freq_24h > avg_daily:
        trend = "increasing"
    elif avg_daily > 0 and freq_24h < avg_daily * 0.5:
        trend = "decreasing"
    else:
        trend = "stable"

    criticality_norm = _normalise_criticality(validated.get("criticality"))

    state["features"] = {
        "ci": validated["ci"],
        "frequency_24h": freq_24h,
        "frequency_7d": freq_7d,
        "avg_resolution_time": avg_res,
        "avg_daily": round(avg_daily, 2),
        "spike": spike,
        "trend": trend,
        "criticality_raw": validated.get("criticality"),
        "criticality_norm": criticality_norm,
    }
    return state


# =============================================================================
# Node 4 — Deterministic scoring  (Task 7)
# =============================================================================
def calculate_deterministic_score(state: PredictionState) -> PredictionState:
    """
    Task 7 — Rule-based baseline scoring.

    Formula: score = (freq_score × 0.5) + (spike_score × 0.3) + (crit_score × 0.2)
    All components normalised to 0-100 before weighting.
    Weights are configurable via config/thresholds.json (Task 11 integration point).
    """
    if state.get("error"):
        return state

    ft = state["features"]
    thresholds = _load_thresholds()
    weights = thresholds.get("scoring_weights", {"frequency": 0.5, "spike": 0.3, "criticality": 0.2})

    w_freq = weights.get("frequency", 0.5)
    w_spike = weights.get("spike", 0.3)
    w_crit = weights.get("criticality", 0.2)

    freq_score = _clamp_score(ft["frequency_24h"] * 10.0)  # 10 incidents/24h → 100
    spike_score = ft["spike"] * 100.0                      # 0 or 100
    crit_score = ft["criticality_norm"]                    # already 0-100

    raw = (freq_score * w_freq) + (spike_score * w_spike) + (crit_score * w_crit)
    normalised = _clamp_score(raw)

    state["deterministic"] = {
        "freq_score": round(freq_score, 2),
        "spike_score": round(spike_score, 2),
        "crit_score": round(crit_score, 2),
        "raw_score": round(raw, 2),
        "normalized_score": round(normalised, 2),
        "weights": {"frequency": w_freq, "spike": w_spike, "criticality": w_crit},
    }
    return state


# =============================================================================
# Node 5 — Conditional AI gate  (Task 10 cost optimisation)
# =============================================================================
def should_call_ai(state: PredictionState) -> PredictionState:
    """
    Gate LLM invocation based on risk signals.
    Only triggers AI when warranted — reduces cost by skipping low-risk CIs.
    """
    if state.get("error"):
        return state

    ft = state["features"]
    det = state["deterministic"]
    mode = state["validated_request"].get("mode", "hybrid")
    thresholds = _load_thresholds()
    trigger = thresholds.get("ai_trigger", {})

    det_score = det.get("normalized_score", 0.0)
    min_score = trigger.get("min_det_score", 50)

    if mode == "deterministic":
        ft["_call_ai"] = False
        ft["_skip_reason"] = "deterministic mode — AI skipped by request"
    elif det_score >= min_score:
        ft["_call_ai"] = True
        ft["_skip_reason"] = None
    elif trigger.get("on_spike", True) and ft.get("spike") == 1:
        ft["_call_ai"] = True
        ft["_skip_reason"] = None
    elif trigger.get("on_increasing_trend", True) and ft.get("trend") == "increasing":
        ft["_call_ai"] = True
        ft["_skip_reason"] = None
    else:
        ft["_call_ai"] = False
        ft["_skip_reason"] = "low risk — AI skipped for cost efficiency"

    state["features"] = ft
    return state


# =============================================================================
# Node 6 — AI evaluation  (Task 8)
# =============================================================================
_SYSTEM_PROMPT = (
    "You are an AI infrastructure risk evaluator.\n"
    "Analyse incident patterns for a Configuration Item and return a JSON risk assessment.\n"
    "Reply with valid JSON ONLY — no markdown, no text outside the JSON object."
)

_USER_PROMPT = (
    "Evaluate infrastructure risk for CI: {ci}\n\n"
    "Incident metrics:\n"
    "  frequency_24h:          {frequency_24h}  (incidents in last 24 hours)\n"
    "  frequency_7d:           {frequency_7d}   (incidents in last 7 days)\n"
    "  spike_detected:         {spike}\n"
    "  trend:                  {trend}\n"
    "  avg_resolution_minutes: {avg_resolution_time}\n"
    "  criticality_score:      {criticality_norm}/100\n"
    "  deterministic_baseline: {deterministic_score}/100\n\n"
    "Return JSON with exactly these fields:\n"
    '{{\n'
    '  "ai_adjustment": <number -15 to +15>,\n'
    '  "reason": "<concise explanation>",\n'
    '  "recommendation": "<specific actionable step>",\n'
    '  "confidence": <float 0.0-1.0>\n'
    '}}'
)


def evaluate_ai(state: PredictionState) -> PredictionState:
    """
    Task 8 — LLM-based risk enhancement.

    Guardrails:
      - ai_adjustment clamped to ±15
      - confidence < 0.6 → adjustment forced to 0
      - Any LLM failure → deterministic-only fallback (pipeline never crashes)
      - LLM token usage tracked for cost metrics (Task 4 W4)
    """
    if state.get("error"):
        return state

    ft = state["features"]
    det = state["deterministic"]
    thresholds = _load_thresholds()
    conf_threshold = thresholds.get("ai_confidence_threshold", 0.6)

    if not ft.get("_call_ai", False):
        state["ai_output"] = {
            "ai_adjustment": 0.0,
            "reason": ft.get("_skip_reason", "AI skipped"),
            "recommendation": "Monitor CI — no immediate action required.",
            "confidence": 1.0,
            "skipped": True,
        }
        return state

    prompt = _USER_PROMPT.format(
        ci=ft.get("ci", "unknown"),
        frequency_24h=ft.get("frequency_24h", 0),
        frequency_7d=ft.get("frequency_7d", 0),
        spike=ft.get("spike", 0),
        trend=ft.get("trend", "stable"),
        avg_resolution_time=round(ft.get("avg_resolution_time", 0), 1),
        criticality_norm=round(ft.get("criticality_norm", 50.0), 1),
        deterministic_score=det.get("normalized_score", 0.0),
    )

    try:
        client, deployment, auth_type = _get_openai_client()
        logger.info("Calling Azure OpenAI (%s) for CI %s", auth_type, ft.get("ci"))

        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=300,
        )

        raw = response.choices[0].message.content or ""
        parsed = _extract_json(raw)

        ai_adj = _to_float(parsed.get("ai_adjustment", 0))
        confidence = _to_float(parsed.get("confidence", 1.0))
        reason = str(parsed.get("reason", ""))
        recommendation = str(parsed.get("recommendation", "Review CI."))

        # Guardrail 1: clamp adjustment
        ai_adj = _clamp_ai_adj(ai_adj)

        # Guardrail 2: low confidence → ignore AI adjustment
        if confidence < conf_threshold:
            logger.info("AI confidence %.2f < %.2f — ignoring adjustment for %s",
                        confidence, conf_threshold, ft.get("ci"))
            ai_adj = 0.0
            reason = f"[Low confidence {confidence:.2f}] {reason}"

        ai_out: dict = {
            "ai_adjustment": round(ai_adj, 2),
            "reason": reason,
            "recommendation": recommendation,
            "confidence": round(confidence, 3),
            "skipped": False,
        }

        # Track token usage for cost metrics (W4)
        if hasattr(response, "usage") and response.usage:
            ai_out["usage"] = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

        state["ai_output"] = ai_out

    except Exception as exc:
        logger.warning("AI evaluation failed for CI %s: %s — fallback applied", ft.get("ci"), exc)
        state["ai_output"] = {
            "ai_adjustment": 0.0,
            "reason": f"AI unavailable — deterministic-only mode applied. ({exc})",
            "recommendation": "Manual review recommended.",
            "confidence": 0.5,
            "skipped": True,
            "error": str(exc),
        }
    return state


# =============================================================================
# Node 7 — Final hybrid risk calculation  (Task 9)
# =============================================================================
def calculate_final_risk(state: PredictionState) -> PredictionState:
    """
    Task 9 — Combine deterministic + AI adjustment into final risk score.

    final_score = clamp(deterministic_score + ai_adjustment, 0, 100)
    mode        = 'hybrid' | 'deterministic-only'
    """
    if state.get("error"):
        return state

    det = state["deterministic"]
    ai = state["ai_output"]
    ft = state["features"]
    validated = state["validated_request"]
    thresholds = _load_thresholds()

    det_score = _to_float(det.get("normalized_score", 0.0))
    ai_adj = _to_float(ai.get("ai_adjustment", 0.0))
    confidence = _to_float(ai.get("confidence", 1.0))
    ai_skipped = ai.get("skipped", False)

    mode = "deterministic-only" if (ai_skipped or ai_adj == 0.0) else "hybrid"

    final_score = _clamp_score(det_score + ai_adj)
    level = _risk_level(final_score, thresholds)

    state["final_result"] = {
        "status": "ok",
        "service": "consul-predict-api",
        "request_id": validated.get("request_id"),
        "ci": ft.get("ci"),
        "risk_score": round(final_score, 1),
        "risk_level": level,
        "deterministic_score": round(det_score, 2),
        "ai_adjustment": round(ai_adj, 2),
        "confidence": round(confidence, 3),
        "reason": ai.get("reason", "Based on incident frequency pattern."),
        "recommended_action": ai.get("recommendation", "Investigate CI."),
        "trend": ft.get("trend"),
        "spike": ft.get("spike"),
        "mode": mode,
        "evaluated_at": _now_iso(),
    }

    if ai.get("usage"):
        state["final_result"]["llm_usage"] = ai["usage"]

    return state


# =============================================================================
# Node 8 — Prediction logging to Snowflake  (Task 14 / W2)
# =============================================================================
def log_prediction(state: PredictionState) -> PredictionState:
    """
    Task 14 — Write prediction result to CONSUL_PREDICT.PUBLIC.PREDICTION_LOG.

    Table auto-created on first run (idempotent).
    Non-fatal — pipeline returns result even if logging fails.
    """
    if state.get("error"):
        return state

    result = state.get("final_result")
    if not result:
        state["log_result"] = {"status": "skipped", "reason": "no result to log"}
        return state

    log_table = _env_or_secret("CONSUL_PREDICT_LOG_TABLE", "consul-predict-log-table", _SF_LOG_TABLE_DEFAULT)

    try:
        conn = _get_sf_log_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {log_table} (
                        id                  STRING        NOT NULL,
                        ci                  STRING,
                        risk_score          FLOAT,
                        risk_level          STRING,
                        deterministic_score FLOAT,
                        ai_adjustment       FLOAT,
                        confidence          FLOAT,
                        reason              STRING,
                        recommended_action  STRING,
                        trend               STRING,
                        spike               INTEGER,
                        mode                STRING,
                        payload             VARIANT,
                        created_at          TIMESTAMP_TZ  DEFAULT CURRENT_TIMESTAMP()
                    )
                    """
                )
                cur.execute(
                    f"""
                    INSERT INTO {log_table} (
                        id, ci, risk_score, risk_level, deterministic_score,
                        ai_adjustment, confidence, reason, recommended_action,
                        trend, spike, mode, payload
                    )
                    SELECT %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, PARSE_JSON(%s)
                    """,
                    (
                        str(uuid.uuid4()),
                        result.get("ci"),
                        result.get("risk_score"),
                        result.get("risk_level"),
                        result.get("deterministic_score"),
                        result.get("ai_adjustment"),
                        result.get("confidence"),
                        result.get("reason"),
                        result.get("recommended_action"),
                        result.get("trend"),
                        result.get("spike"),
                        result.get("mode"),
                        json.dumps(result),
                    ),
                )
            conn.commit()
        finally:
            conn.close()

        state["log_result"] = {"status": "logged", "table": log_table}
        logger.info("Prediction logged to %s for CI %s", log_table, result.get("ci"))

    except Exception as exc:
        logger.warning("Prediction logging failed (non-fatal): %s", exc)
        state["log_result"] = {"status": "skipped", "reason": str(exc), "table": log_table}

    if state.get("final_result"):
        state["final_result"]["logging"] = state["log_result"]

    return state


# =============================================================================
# Node 9 — Error response
# =============================================================================
def build_error_response(state: PredictionState) -> PredictionState:
    if not state.get("error"):
        return state
    state["final_result"] = {
        "status": "error",
        "service": "consul-predict-api",
        "risk_score": 0,
        "risk_level": "Unknown",
        "reason": state["error"].get("message", "Unknown error"),
        "recommended_action": "Check request payload and retry.",
        "confidence": 0.0,
        "mode": "error",
        "evaluated_at": _now_iso(),
    }
    return state


# =============================================================================
# Graph builder
# =============================================================================
def build_prediction_graph():
    """
    Assemble the full 9-node LangGraph pipeline.

    Flow:
        validate_request
         → fetch_ci_incident_data   (Task 5 — Snowflake)
         → generate_features        (Task 6 — spike, trend, criticality)
         → calculate_deterministic_score  (Task 7 — baseline formula)
         → should_call_ai           (Task 10 — cost gate)
         → evaluate_ai              (Task 8 — LLM + guardrails)
         → calculate_final_risk     (Task 9 — hybrid decision)
         → log_prediction           (Task 14 — Snowflake log)
         → build_error_response
         → END
    """
    g = StateGraph(PredictionState)
    g.add_node("validate_request", validate_request)
    g.add_node("fetch_ci_incident_data", fetch_ci_incident_data)
    g.add_node("generate_features", generate_features)
    g.add_node("calculate_deterministic_score", calculate_deterministic_score)
    g.add_node("should_call_ai", should_call_ai)
    g.add_node("evaluate_ai", evaluate_ai)
    g.add_node("calculate_final_risk", calculate_final_risk)
    g.add_node("log_prediction", log_prediction)
    g.add_node("build_error_response", build_error_response)
    g.set_entry_point("validate_request")
    g.add_edge("validate_request", "fetch_ci_incident_data")
    g.add_edge("fetch_ci_incident_data", "generate_features")
    g.add_edge("generate_features", "calculate_deterministic_score")
    g.add_edge("calculate_deterministic_score", "should_call_ai")
    g.add_edge("should_call_ai", "evaluate_ai")
    g.add_edge("evaluate_ai", "calculate_final_risk")
    g.add_edge("calculate_final_risk", "log_prediction")
    g.add_edge("log_prediction", "build_error_response")
    g.add_edge("build_error_response", END)
    return g.compile()


# =============================================================================
# Public entry point — called by app.py
# =============================================================================
def run_prediction(request_body: dict) -> dict:
    """Run the full prediction pipeline and return final_result."""
    graph = build_prediction_graph()
    final_state = graph.invoke({
        "request": request_body,
        "validated_request": None,
        "snowflake_data": None,
        "features": None,
        "deterministic": None,
        "ai_output": None,
        "final_result": None,
        "log_result": None,
        "error": None,
    })
    return final_state.get("final_result") or {
        "status": "error", "message": "Pipeline returned no result",
    }


# Expose individual nodes for import in tests
__all__: List[str] = [
    "run_prediction", "build_prediction_graph",
    "validate_request", "fetch_ci_incident_data", "generate_features",
    "calculate_deterministic_score", "should_call_ai", "evaluate_ai",
    "calculate_final_risk", "log_prediction", "build_error_response",
    "_clamp_score", "_clamp_ai_adj", "_risk_level", "_normalise_criticality",
    "PredictionState",
]
