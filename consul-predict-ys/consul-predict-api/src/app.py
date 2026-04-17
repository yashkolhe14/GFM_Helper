"""
app.py — ConsulPredict API  (FastAPI entry point).

Endpoints:
  GET  /                      health check
  POST /api/predictive-risk   main prediction endpoint (Task 10)
  GET  /health/snowflake      Snowflake connectivity probe

Run locally:
  python src/app.py
Deploy:
  uvicorn src.app:app --host 0.0.0.0 --port 8000
"""

import logging
import os
import sys

import uvicorn
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from typing import Optional

for _rel in ["..", "../.."]:
    _p = os.path.abspath(os.path.join(os.path.dirname(__file__), _rel))
    if _p not in sys.path:
        sys.path.insert(0, _p)

from agent import run_prediction  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ConsulPredict API",
    version="1.0.0",
    description=(
        "Predictive incident risk engine. "
        "Combines deterministic scoring with Azure OpenAI to classify CI risk."
    ),
)


class PredictRequest(BaseModel):
    """Payload from ServiceNow Flow Designer."""
    ci: str = Field(..., description="Configuration Item identifier e.g. server-01")
    criticality: Optional[object] = Field(
        default="medium",
        description="low / medium / high / critical OR priority 1-5",
    )
    mode: Optional[str] = Field(
        default="hybrid",
        description="'hybrid' (default) or 'deterministic'",
    )
    mock_snowflake_data: Optional[dict] = Field(
        default=None,
        description="Optional mock for dev/test - bypasses live Snowflake",
    )

    @field_validator("ci")
    @classmethod
    def ci_not_empty(cls, v):
        if not v or not str(v).strip():
            raise ValueError("ci must not be empty")
        return str(v).strip()

    @field_validator("mode")
    @classmethod
    def mode_valid(cls, v):
        allowed = {"hybrid", "deterministic"}
        v = (v or "hybrid").lower()
        if v not in allowed:
            raise ValueError(f"mode must be one of {allowed}")
        return v


@app.get("/", summary="Health check")
def health():
    return {"status": "ok", "service": "consul-predict-api", "version": "1.0.0"}


@app.post(
    "/api/predictive-risk",
    summary="Predict CI risk (Task 10)",
    responses={
        200: {"description": "Risk prediction returned"},
        422: {"description": "Validation error"},
        500: {"description": "Internal server error"},
    },
)
def predict_risk(body: PredictRequest):
    """
    Main prediction endpoint - called by ServiceNow Flow Designer.

    Orchestrates Tasks 5-9 and logs to Snowflake (Task 14).
    """
    logger.info("Prediction request - CI: %s  mode: %s", body.ci, body.mode)
    try:
        result = run_prediction(body.model_dump())
    except Exception as exc:
        logger.exception("Unhandled pipeline error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"status": "error", "message": str(exc)},
        )

    if result.get("status") == "error":
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=result,
        )

    logger.info(
        "Prediction done - CI: %s  score: %s  level: %s  mode: %s",
        result.get("ci"), result.get("risk_score"),
        result.get("risk_level"), result.get("mode"),
    )
    return result


@app.get("/health/snowflake", summary="Snowflake connectivity probe")
def snowflake_health():
    """Quick connectivity test - run after deployment to verify Snowflake access."""
    try:
        from agent import _get_sf_source_conn
        conn = _get_sf_source_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT CURRENT_TIMESTAMP()")
            ts = cur.fetchone()[0]
        conn.close()
        return {"status": "ok", "snowflake_timestamp": str(ts)}
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "detail": str(exc)},
        )


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
