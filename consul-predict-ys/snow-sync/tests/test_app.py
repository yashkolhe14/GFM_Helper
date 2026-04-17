"""
test_app.py — Unit tests for snow-sync enrichment and sync logic.
"""

import os
import sys
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))


@pytest.fixture(autouse=True)
def mock_keyvault(monkeypatch):
    monkeypatch.setattr("src.app.get_secret", lambda name: f"mock-{name}")


from src.app import enrich_incident, fetch_incidents  # noqa: E402


def _sample_inc(**kwargs):
    base = {
        "sys_id": "abc123", "number": "INC0001234",
        "short_description": "Server CPU high",
        "cmdb_ci": {"value": "CI00001", "display_value": "prod-server-01"},
        "priority": "1", "category": "hardware",
        "opened_at": "2024-01-15 09:00:00",
        "resolved_at": "2024-01-15 11:30:00",
        "state": "6", "assignment_group": "Platform Ops",
    }
    base.update(kwargs)
    return base


class TestEnrichIncident:
    def test_resolution_time_calculated(self):
        assert enrich_incident(_sample_inc())["resolution_time_minutes"] == 150

    def test_sla_breached_p1_over_4h(self):
        inc = _sample_inc(opened_at="2024-01-15 09:00:00", resolved_at="2024-01-15 14:00:00")
        assert enrich_incident(inc)["sla_breached"] is True

    def test_sla_not_breached_p1_under_4h(self):
        inc = _sample_inc(opened_at="2024-01-15 09:00:00", resolved_at="2024-01-15 11:30:00")
        assert enrich_incident(inc)["sla_breached"] is False

    def test_day_of_week_extracted(self):
        assert enrich_incident(_sample_inc(opened_at="2024-01-15 09:00:00"))["day_of_week"] == "Monday"

    def test_hour_of_day_extracted(self):
        assert enrich_incident(_sample_inc(opened_at="2024-01-15 14:30:00"))["hour_of_day"] == 14

    def test_ci_id_from_dict(self):
        assert enrich_incident(_sample_inc())["ci_id"] == "CI00001"

    def test_ci_id_from_string(self):
        assert enrich_incident(_sample_inc(cmdb_ci="CI00002"))["ci_id"] == "CI00002"

    def test_no_resolved_at_gives_none(self):
        assert enrich_incident(_sample_inc(resolved_at=None))["resolution_time_minutes"] is None

    def test_sync_date_added(self):
        assert enrich_incident(_sample_inc())["sync_date"] is not None

    def test_missing_priority_no_sla_breach(self):
        assert enrich_incident(_sample_inc(priority=None))["sla_breached"] is False

    def test_sla_p2_over_8h_breached(self):
        inc = _sample_inc(
            priority="2",
            opened_at="2024-01-15 09:00:00",
            resolved_at="2024-01-15 18:30:00",
        )
        assert enrich_incident(inc)["sla_breached"] is True

    def test_sla_p3_under_24h_not_breached(self):
        inc = _sample_inc(
            priority="3",
            opened_at="2024-01-15 09:00:00",
            resolved_at="2024-01-15 20:00:00",
        )
        assert enrich_incident(inc)["sla_breached"] is False


class TestFetchIncidents:
    def test_http_error_returns_empty(self, monkeypatch):
        import httpx

        def _raise(*a, **kw):
            raise httpx.HTTPError("Connection refused")

        monkeypatch.setattr("src.app.httpx.get", _raise)
        assert fetch_incidents("2024-01-01 00:00:00") == []

    def test_successful_fetch(self, monkeypatch):
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "result": [
                {"sys_id": "a1", "number": "INC0001"},
                {"sys_id": "a2", "number": "INC0002"},
            ]
        }
        monkeypatch.setattr("src.app.httpx.get", lambda *a, **kw: mock_resp)
        result = fetch_incidents("2024-01-01 00:00:00")
        assert len(result) == 2
        assert result[0]["number"] == "INC0001"
