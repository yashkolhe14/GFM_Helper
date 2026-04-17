from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "consul-predict-kb-ingestion"


def test_predict_endpoint_accepts_post():
    response = client.post("/predict", json={"input": "test"})
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
