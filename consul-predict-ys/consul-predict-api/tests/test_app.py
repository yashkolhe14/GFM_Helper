"""
test_app.py — FastAPI endpoint tests for consul-predict-api.
"""

import json
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class _MockMsg:
    content = json.dumps({
        "ai_adjustment": 8, "reason": "Spike detected",
        "recommendation": "Investigate CI", "confidence": 0.9,
    })


class _MockChoice:
    message = _MockMsg()


class _MockUsage:
    prompt_tokens = 40
    completion_tokens = 25
    total_tokens = 65


class _MockResponse:
    choices = [_MockChoice()]
    usage = _MockUsage()


class _MockCompletions:
    @staticmethod
    def create(**kwargs):
        return _MockResponse()


class _MockChat:
    completions = _MockCompletions()


class _MockOpenAI:
    chat = _MockChat()


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(
        "src.agent._get_openai_client",
        lambda: (_MockOpenAI(), "gpt-4o", "api_key"),
    )
    from src.app import app
    return TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "consul-predict-api"


class TestPredictEndpoint:
    def test_valid_high_risk_request(self, client):
        resp = client.post("/api/predictive-risk", json={
            "ci": "production-db-01", "criticality": "critical",
            "mock_snowflake_data": {"frequency_24h": 10, "frequency_7d": 14},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["ci"] == "production-db-01"
        assert data["risk_level"] in ("High", "Medium", "Low")
        assert 0 <= data["risk_score"] <= 100

    def test_valid_low_risk_request(self, client):
        resp = client.post("/api/predictive-risk", json={
            "ci": "idle-backup-server", "criticality": "low",
            "mock_snowflake_data": {"frequency_24h": 0, "frequency_7d": 0},
        })
        assert resp.status_code == 200
        assert resp.json()["risk_level"] == "Low"

    def test_missing_ci_returns_422(self, client):
        resp = client.post("/api/predictive-risk", json={"criticality": "high"})
        assert resp.status_code == 422

    def test_empty_ci_returns_422(self, client):
        resp = client.post("/api/predictive-risk", json={"ci": "  "})
        assert resp.status_code == 422

    def test_invalid_mode_returns_422(self, client):
        resp = client.post("/api/predictive-risk", json={
            "ci": "server-01", "mode": "invalid_mode",
        })
        assert resp.status_code == 422

    def test_deterministic_mode_skips_ai(self, client):
        resp = client.post("/api/predictive-risk", json={
            "ci": "server-01", "mode": "deterministic",
            "mock_snowflake_data": {"frequency_24h": 10, "frequency_7d": 20},
        })
        assert resp.status_code == 200
        assert resp.json()["mode"] == "deterministic-only"

    def test_all_required_fields_present(self, client):
        resp = client.post("/api/predictive-risk", json={
            "ci": "test-ci",
            "mock_snowflake_data": {"frequency_24h": 3, "frequency_7d": 10},
        })
        assert resp.status_code == 200
        data = resp.json()
        for field in ["status", "ci", "risk_score", "risk_level",
                      "reason", "recommended_action", "mode", "evaluated_at"]:
            assert field in data, f"Missing field: {field}"

    def test_hybrid_mode_includes_ai_fields(self, client):
        resp = client.post("/api/predictive-risk", json={
            "ci": "busy-server", "criticality": "high",
            "mock_snowflake_data": {"frequency_24h": 9, "frequency_7d": 14},
        })
        data = resp.json()
        assert data["ai_adjustment"] is not None
        assert data["confidence"] is not None

    def test_snowflake_fallback_still_returns_result(self, client, monkeypatch):
        monkeypatch.setattr(
            "src.agent._get_sf_source_conn",
            lambda: (_ for _ in ()).throw(RuntimeError("DB down")),
        )
        resp = client.post("/api/predictive-risk", json={"ci": "server-x"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
