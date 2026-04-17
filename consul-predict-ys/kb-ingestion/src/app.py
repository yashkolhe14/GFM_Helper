from fastapi import FastAPI

app = FastAPI(title="ConsulPredict KB Ingestion", version="0.1.0")


@app.get("/")
def health():
    return {"status": "ok", "service": "consul-predict-kb-ingestion"}


@app.post("/ingest")
def ingest(body: dict):
    """
    Ingest incident / KB data (from Snowflake or other source)
    """

    ci_id = body.get("ci_id")
    incidents = body.get("incidents", [])

    return {
        "status": "ok",
        "message": "Ingestion successful (placeholder)",
        "ci_id": ci_id,
        "records_received": len(incidents)
    }


@app.post("/predict")
def predict(body: dict):
    return ingest(body)
