"""
test_agent.py — Unit tests for ConsulPredict prediction pipeline.

Covers Tasks 5-10 and 14 (Yash Kolhe, Week 2-3).
All tests use mock data — no Snowflake or Azure OpenAI required.
"""

import json
import os
import sys


sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.agent import (  # noqa: E402
    PredictionState,
    _clamp_ai_adj,
    _clamp_score,
    _normalise_criticality,
    _risk_level,
    calculate_deterministic_score,
    calculate_final_risk,
    evaluate_ai,
    fetch_ci_incident_data,
    generate_features,
    run_prediction,
    should_call_ai,
    validate_request,
)


# =============================================================================
# Helpers
# =============================================================================
def _state(**kwargs) -> PredictionState:
    base: PredictionState = {
        "request": {}, "validated_request": None, "snowflake_data": None,
        "features": None, "deterministic": None, "ai_output": None,
        "final_result": None, "log_result": None, "error": None,
    }
    base.update(kwargs)
    return base


def _validated(ci="server-01", criticality="medium", mode="hybrid") -> PredictionState:
    s = _state(request={"ci": ci, "criticality": criticality, "mode": mode})
    return validate_request(s)


def _with_mock_sf(freq_24h, freq_7d, criticality="medium", ci="test-ci"):
    s = _state(request={
        "ci": ci, "criticality": criticality,
        "mock_snowflake_data": {"frequency_24h": freq_24h, "frequency_7d": freq_7d},
    })
    s = validate_request(s)
    return fetch_ci_incident_data(s)


def _run_to_det(freq_24h, freq_7d, criticality="medium"):
    s = _with_mock_sf(freq_24h, freq_7d, criticality)
    s = generate_features(s)
    return calculate_deterministic_score(s)


# =============================================================================
# Task 10: validate_request
# =============================================================================
class TestValidateRequest:
    def test_valid_ci(self):
        s = validate_request(_state(request={"ci": "server-01"}))
        assert s["error"] is None
        assert s["validated_request"]["ci"] == "server-01"

    def test_alias_ci_id(self):
        s = validate_request(_state(request={"ci_id": "db-02"}))
        assert s["validated_request"]["ci"] == "db-02"

    def test_alias_configuration_item(self):
        s = validate_request(_state(request={"configuration_item": "net-sw-01"}))
        assert s["error"] is None

    def test_missing_ci_sets_error(self):
        s = validate_request(_state(request={"criticality": "high"}))
        assert s["error"] is not None
        assert "ci" in s["error"]["message"].lower()

    def test_empty_ci_sets_error(self):
        s = validate_request(_state(request={"ci": "   "}))
        assert s["error"] is not None

    def test_default_mode_hybrid(self):
        s = validate_request(_state(request={"ci": "ci-1"}))
        assert s["validated_request"]["mode"] == "hybrid"

    def test_request_id_generated(self):
        s = validate_request(_state(request={"ci": "ci-1"}))
        assert s["validated_request"]["request_id"] is not None


# =============================================================================
# Task 5: fetch_ci_incident_data
# =============================================================================
class TestFetchCiIncidentData:
    def test_mock_data_used(self):
        s = _with_mock_sf(5, 20)
        assert s["snowflake_data"]["frequency_24h"] == 5
        assert s["snowflake_data"]["frequency_7d"] == 20
        assert s["snowflake_data"]["source"] == "mock"

    def test_error_state_passthrough(self):
        s = _state(error={"message": "earlier error"})
        s = fetch_ci_incident_data(s)
        assert s["snowflake_data"] is None

    def test_zero_frequencies(self):
        s = _with_mock_sf(0, 0)
        assert s["snowflake_data"]["frequency_24h"] == 0
        assert s["snowflake_data"]["frequency_7d"] == 0

    def test_snowflake_failure_fallback(self, monkeypatch):
        def _raise():
            raise RuntimeError("Connection refused")
        monkeypatch.setattr("src.agent._get_sf_source_conn", _raise)
        s = _validated()
        s = fetch_ci_incident_data(s)
        assert s["snowflake_data"]["source"] == "fallback"
        assert s["snowflake_data"]["frequency_24h"] == 0


# =============================================================================
# Task 6: generate_features
# =============================================================================
class TestGenerateFeatures:
    def test_spike_detected(self):
        s = generate_features(_with_mock_sf(10, 7))
        assert s["features"]["spike"] == 1
        assert s["features"]["trend"] == "increasing"

    def test_no_spike_normal(self):
        s = generate_features(_with_mock_sf(1, 7))
        assert s["features"]["spike"] == 0

    def test_trend_decreasing(self):
        s = generate_features(_with_mock_sf(0, 14))
        assert s["features"]["trend"] == "decreasing"

    def test_trend_stable(self):
        s = generate_features(_with_mock_sf(1, 7))
        assert s["features"]["trend"] == "stable"

    def test_criticality_critical(self):
        s = generate_features(_with_mock_sf(1, 7, "critical"))
        assert s["features"]["criticality_norm"] == 100.0

    def test_criticality_priority_1(self):
        s = generate_features(_with_mock_sf(1, 7, 1))
        assert s["features"]["criticality_norm"] == 100.0

    def test_zero_7d_no_division_error(self):
        s = generate_features(_with_mock_sf(3, 0))
        assert s["features"]["spike"] in (0, 1)

    def test_error_passthrough(self):
        s = _state(error={"message": "err"})
        s = generate_features(s)
        assert s["features"] is None


# =============================================================================
# Task 7: calculate_deterministic_score
# =============================================================================
class TestDeterministicScore:
    def test_low_risk_case(self):
        s = _run_to_det(1, 7, "low")
        assert s["deterministic"]["normalized_score"] < 50

    def test_high_risk_case(self):
        s = _run_to_det(10, 7, "critical")
        assert s["deterministic"]["normalized_score"] >= 50

    def test_score_not_above_100(self):
        s = _run_to_det(999, 999, "critical")
        assert s["deterministic"]["normalized_score"] <= 100.0

    def test_score_not_below_zero(self):
        s = _run_to_det(0, 0, "low")
        assert s["deterministic"]["normalized_score"] >= 0.0

    def test_weights_in_output(self):
        s = _run_to_det(1, 7)
        w = s["deterministic"]["weights"]
        assert w["frequency"] == 0.5
        assert w["spike"] == 0.3
        assert w["criticality"] == 0.2

    def test_error_passthrough(self):
        s = _state(error={"message": "err"})
        s = calculate_deterministic_score(s)
        assert s["deterministic"] is None


# =============================================================================
# Task 8: should_call_ai gate
# =============================================================================
def _ai_gate_state(spike, trend, det_score, mode="hybrid"):
    return _state(
        validated_request={
            "ci": "ci-1", "mode": mode, "request_id": "r1",
            "timestamp": "t", "criticality": None,
            "metadata": {}, "mock_snowflake_data": None,
        },
        features={
            "ci": "ci-1", "spike": spike, "trend": trend,
            "frequency_24h": 5, "frequency_7d": 10,
            "avg_resolution_time": 30, "criticality_norm": 50,
            "avg_daily": 1.43, "criticality_raw": "medium",
        },
        deterministic={"normalized_score": det_score},
    )


class TestShouldCallAI:
    def test_high_det_score_triggers(self):
        s = should_call_ai(_ai_gate_state(0, "stable", 70))
        assert s["features"]["_call_ai"] is True

    def test_spike_triggers(self):
        s = should_call_ai(_ai_gate_state(1, "stable", 20))
        assert s["features"]["_call_ai"] is True

    def test_increasing_trend_triggers(self):
        s = should_call_ai(_ai_gate_state(0, "increasing", 30))
        assert s["features"]["_call_ai"] is True

    def test_low_risk_skips_ai(self):
        s = should_call_ai(_ai_gate_state(0, "stable", 10))
        assert s["features"]["_call_ai"] is False

    def test_deterministic_mode_always_skips(self):
        s = should_call_ai(_ai_gate_state(1, "increasing", 90, mode="deterministic"))
        assert s["features"]["_call_ai"] is False


# =============================================================================
# Task 8: evaluate_ai
# =============================================================================
def _ai_state(call_ai=True, det_score=65, skip_reason=None):
    ft = {
        "ci": "ci-1", "spike": 1, "trend": "increasing",
        "frequency_24h": 8, "frequency_7d": 10,
        "avg_resolution_time": 60, "criticality_norm": 75,
        "avg_daily": 1.43, "criticality_raw": "high",
        "_call_ai": call_ai, "_skip_reason": skip_reason,
    }
    return _state(
        validated_request={
            "ci": "ci-1", "mode": "hybrid", "request_id": "r1",
            "timestamp": "t", "criticality": "high",
            "metadata": {}, "mock_snowflake_data": None,
        },
        features=ft,
        deterministic={"normalized_score": det_score},
    )


class TestEvaluateAI:
    def test_skipped_sets_zero_adjustment(self):
        s = evaluate_ai(_ai_state(call_ai=False, skip_reason="low risk"))
        assert s["ai_output"]["ai_adjustment"] == 0.0
        assert s["ai_output"]["skipped"] is True

    def test_skipped_has_recommendation(self):
        s = evaluate_ai(_ai_state(call_ai=False))
        assert "recommendation" in s["ai_output"]

    def test_api_failure_fallback(self, monkeypatch):
        def _raise():
            raise RuntimeError("Azure OpenAI unavailable")
        monkeypatch.setattr("src.agent._get_openai_client", _raise)
        s = evaluate_ai(_ai_state(call_ai=True))
        assert s["ai_output"]["ai_adjustment"] == 0.0
        assert s["ai_output"]["skipped"] is True
        assert "error" in s["ai_output"]

    def test_ai_response_parsed_correctly(self, monkeypatch):
        monkeypatch.setattr(
            "src.agent._get_openai_client",
            lambda: (_build_mock_client(adj=10, conf=0.9), "gpt-4o", "api_key"),
        )
        s = evaluate_ai(_ai_state(call_ai=True))
        assert s["ai_output"]["ai_adjustment"] == 10.0
        assert s["ai_output"]["confidence"] == 0.9
        assert s["ai_output"]["skipped"] is False

    def test_adjustment_clamped_to_15(self, monkeypatch):
        monkeypatch.setattr(
            "src.agent._get_openai_client",
            lambda: (_build_mock_client(adj=25, conf=0.9), "gpt-4o", "api_key"),
        )
        s = evaluate_ai(_ai_state(call_ai=True))
        assert s["ai_output"]["ai_adjustment"] == 15.0

    def test_low_confidence_zeroes_adjustment(self, monkeypatch):
        monkeypatch.setattr(
            "src.agent._get_openai_client",
            lambda: (_build_mock_client(adj=12, conf=0.3), "gpt-4o", "api_key"),
        )
        s = evaluate_ai(_ai_state(call_ai=True))
        assert s["ai_output"]["ai_adjustment"] == 0.0


# =============================================================================
# Task 9: calculate_final_risk
# =============================================================================
def _final_state(det_score, ai_adj, confidence=1.0, ai_skipped=False,
                 spike=1, trend="increasing"):
    return _state(
        validated_request={
            "ci": "ci-1", "mode": "hybrid", "request_id": "r1",
            "timestamp": "t", "criticality": "high",
            "metadata": {}, "mock_snowflake_data": None,
        },
        features={
            "ci": "ci-1", "spike": spike, "trend": trend,
            "frequency_24h": 5, "frequency_7d": 10,
            "avg_resolution_time": 30, "criticality_norm": 75,
            "avg_daily": 1.43, "criticality_raw": "high",
        },
        deterministic={"normalized_score": det_score},
        ai_output={
            "ai_adjustment": ai_adj, "confidence": confidence,
            "reason": "Test reason", "recommendation": "Test action",
            "skipped": ai_skipped,
        },
    )


class TestCalculateFinalRisk:
    def test_hybrid_score(self):
        s = calculate_final_risk(_final_state(60, 10))
        assert s["final_result"]["risk_score"] == 70.0
        assert s["final_result"]["mode"] == "hybrid"

    def test_score_capped_at_100(self):
        s = calculate_final_risk(_final_state(95, 15))
        assert s["final_result"]["risk_score"] == 100.0

    def test_score_floored_at_zero(self):
        s = calculate_final_risk(_final_state(5, -15))
        assert s["final_result"]["risk_score"] == 0.0

    def test_high_classification(self):
        s = calculate_final_risk(_final_state(75, 10))
        assert s["final_result"]["risk_level"] == "High"

    def test_medium_classification(self):
        s = calculate_final_risk(_final_state(55, 0))
        assert s["final_result"]["risk_level"] == "Medium"

    def test_low_classification(self):
        s = calculate_final_risk(_final_state(20, 0, ai_skipped=True))
        assert s["final_result"]["risk_level"] == "Low"

    def test_deterministic_only_mode(self):
        s = calculate_final_risk(_final_state(40, 0, ai_skipped=True))
        assert s["final_result"]["mode"] == "deterministic-only"

    def test_boundary_79_is_medium(self):
        s = calculate_final_risk(_final_state(79, 0))
        assert s["final_result"]["risk_level"] == "Medium"

    def test_boundary_80_is_high(self):
        s = calculate_final_risk(_final_state(80, 0))
        assert s["final_result"]["risk_level"] == "High"

    def test_boundary_49_is_low(self):
        s = calculate_final_risk(_final_state(49, 0))
        assert s["final_result"]["risk_level"] == "Low"

    def test_boundary_50_is_medium(self):
        s = calculate_final_risk(_final_state(50, 0))
        assert s["final_result"]["risk_level"] == "Medium"

    def test_all_required_fields_present(self):
        s = calculate_final_risk(_final_state(60, 5))
        r = s["final_result"]
        for f in ["risk_score", "risk_level", "reason", "recommended_action",
                  "mode", "confidence", "evaluated_at", "ci", "status"]:
            assert f in r, f"Missing field: {f}"


# =============================================================================
# Helpers
# =============================================================================
class TestHelpers:
    def test_clamp_score_max(self):
        assert _clamp_score(150.0) == 100.0

    def test_clamp_score_min(self):
        assert _clamp_score(-10.0) == 0.0

    def test_clamp_ai_adj_cap(self):
        assert _clamp_ai_adj(25.0) == 15.0
        assert _clamp_ai_adj(-25.0) == -15.0
        assert _clamp_ai_adj(10.0) == 10.0

    def test_risk_level_defaults(self):
        assert _risk_level(80.0) == "High"
        assert _risk_level(79.9) == "Medium"
        assert _risk_level(50.0) == "Medium"
        assert _risk_level(49.9) == "Low"

    def test_normalise_criticality_strings(self):
        assert _normalise_criticality("low") == 25.0
        assert _normalise_criticality("medium") == 50.0
        assert _normalise_criticality("high") == 75.0
        assert _normalise_criticality("critical") == 100.0

    def test_normalise_criticality_none(self):
        assert _normalise_criticality(None) == 50.0

    def test_normalise_criticality_priority_1(self):
        assert _normalise_criticality(1) == 100.0

    def test_normalise_criticality_priority_3(self):
        assert _normalise_criticality(3) == 50.0


# =============================================================================
# End-to-end pipeline tests
# =============================================================================
class TestEndToEndPipeline:
    def test_high_risk_full_pipeline(self, monkeypatch):
        monkeypatch.setattr(
            "src.agent._get_openai_client",
            lambda: (_build_mock_client(adj=12, conf=0.9), "gpt-4o", "api_key"),
        )
        result = run_prediction({
            "ci": "prod-db-01", "criticality": "critical",
            "mock_snowflake_data": {"frequency_24h": 10, "frequency_7d": 14},
        })
        assert result["status"] == "ok"
        assert result["risk_level"] == "High"
        assert result["ci"] == "prod-db-01"

    def test_low_risk_skips_ai(self):
        result = run_prediction({
            "ci": "idle-server", "criticality": "low",
            "mock_snowflake_data": {"frequency_24h": 0, "frequency_7d": 1},
        })
        assert result["status"] == "ok"
        assert result["risk_level"] == "Low"
        assert result["mode"] == "deterministic-only"

    def test_missing_ci_returns_error(self):
        result = run_prediction({"criticality": "high"})
        assert result["status"] == "error"

    def test_deterministic_mode_never_calls_ai(self, monkeypatch):
        called = []
        monkeypatch.setattr(
            "src.agent._get_openai_client",
            lambda: (called.append(True) or _build_mock_client(), "gpt-4o", "api_key"),
        )
        run_prediction({
            "ci": "server-x", "mode": "deterministic",
            "mock_snowflake_data": {"frequency_24h": 10, "frequency_7d": 20},
        })
        assert len(called) == 0

    def test_snowflake_log_failure_does_not_crash(self, monkeypatch):
        def _raise():
            raise RuntimeError("Log DB down")
        monkeypatch.setattr("src.agent._get_sf_log_conn", _raise)
        result = run_prediction({
            "ci": "server-z",
            "mock_snowflake_data": {"frequency_24h": 3, "frequency_7d": 7},
        })
        assert result["status"] == "ok"
        assert result["logging"]["status"] == "skipped"


# =============================================================================
# Mock factory
# =============================================================================
class _MockMsg:
    def __init__(self, adj, conf):
        self.content = json.dumps({
            "ai_adjustment": adj, "reason": "Mock AI reason",
            "recommendation": "Mock action", "confidence": conf,
        })


class _MockChoice:
    def __init__(self, adj, conf):
        self.message = _MockMsg(adj, conf)


class _MockUsage:
    prompt_tokens = 50
    completion_tokens = 30
    total_tokens = 80


class _MockResponse:
    def __init__(self, adj, conf):
        self.choices = [_MockChoice(adj, conf)]
        self.usage = _MockUsage()


class _MockCompletions:
    def __init__(self, adj, conf):
        self._adj = adj
        self._conf = conf

    def create(self, **kwargs):
        return _MockResponse(self._adj, self._conf)


class _MockChat:
    def __init__(self, adj, conf):
        self.completions = _MockCompletions(adj, conf)


class _MockOpenAI:
    def __init__(self, adj, conf):
        self.chat = _MockChat(adj, conf)


def _build_mock_client(adj=5, conf=0.85):
    return _MockOpenAI(adj, conf)
