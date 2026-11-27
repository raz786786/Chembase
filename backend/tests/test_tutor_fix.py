"""Regression tests for ChemBase Pro AI Chemical Engineering Tutor fixes."""

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.database import Base, get_db  # noqa: E402
from app.main import _RATE_BUCKETS, app  # noqa: E402
from app.models import AIProviderConnection  # noqa: E402
from app.providers.crypto import encrypt_api_key  # noqa: E402
from app.tutor_engine import (  # noqa: E402
    BuiltinEngineeringSolvers,
    MissingInfoDetector,
    MultiAISolverOrchestrator,
    ProblemFingerprinter,
)


@pytest.fixture()
def tutor_client_and_db(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("CHEMBASE_MASTER_KEY", "test-tutor-master-key-2026")

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    _RATE_BUCKETS.clear()
    ProblemFingerprinter._cache.clear()

    with TestClient(app) as tc:
        yield tc, TestingSessionLocal

    app.dependency_overrides.clear()
    _RATE_BUCKETS.clear()
    ProblemFingerprinter._cache.clear()


# ── 1. BuiltinEngineeringSolvers Exact-Match Guards ──────────────────────────


def test_custom_pump_power_not_hijacked_by_builtin_solver():
    custom_problem = (
        "Calculate the pump power required to move water at Q = 0.2 m³/s "
        "through a D = 20 cm diameter commercial steel pipe of length L = 50 m "
        "with elevation rise 8 m and pump efficiency 80%."
    )
    result = BuiltinEngineeringSolvers.try_solve(custom_problem, "Fluid Mechanics")
    assert result is None


def test_exact_builtin_pump_power_still_resolves_deterministically():
    exact_example = (
        "Water at 20°C (density 998 kg/m³, viscosity 1.002e-3 Pa·s) flows at 0.05 m³/s "
        "through a 200 m long, 10 cm diameter commercial steel pipe (roughness ε = 0.045 mm). "
        "The outlet is 15 m above the inlet and both are open to atmosphere. "
        "Calculate the pump power required in kW, assuming a pump efficiency of 70%."
    )
    result = BuiltinEngineeringSolvers.try_solve(exact_example, "Fluid Mechanics")
    assert result is not None
    gruca, val, unit, meta = result
    assert unit == "kW"
    assert val > 0
    assert "0.05" in " ".join(gruca.given)


def test_other_custom_problems_not_hijacked():
    custom_cases = [
        ("A heat exchanger using LMTD heats 5 kg/s of water from 25°C to 80°C with U = 450 W/m²·K.", "Heat Transfer"),
        ("A first-order reaction A -> B in a CSTR has k = 0.12 min⁻¹ and feed 25 L/min at 1.5 mol/L for 75% conversion.", "Reaction Engineering"),
        ("Ammonia diffuses through a stagnant 2 cm air film at 30°C with diffusivity 2.5e-5 m²/s.", "Mass Transfer"),
        ("Find the volume of 12 kg of nitrogen ideal gas at 350 K and 1.5 MPa.", "Thermodynamics"),
        ("A distillation column separates 2500 kg/h of ethanol and water feed with 30 wt% ethanol.", "Separation Processes"),
    ]
    for prob, subj in custom_cases:
        assert BuiltinEngineeringSolvers.try_solve(prob, subj) is None


# ── 2. MissingInfoDetector Conceptual vs Underspecified Checks ───────────────


def test_conceptual_question_not_blocked_by_missing_info_detector():
    problem = "Explain how LMTD works in a counterflow heat exchanger"
    has_missing, items = MissingInfoDetector.check_missing_info(problem, "Heat Transfer")
    assert has_missing is False
    assert items == []


def test_numerical_question_with_zero_digits_is_flagged():
    problem = "Calculate the pump power required for a water pipe"
    has_missing, items = MissingInfoDetector.check_missing_info(problem, "Fluid Mechanics")
    assert has_missing is True
    assert len(items) >= 1


def test_numerical_question_with_digits_is_not_falsely_blocked():
    problem = "Calculate the pump power for Q = 0.2 m³/s, D = 20 cm, L = 50 m"
    has_missing, items = MissingInfoDetector.check_missing_info(problem, "Fluid Mechanics")
    assert has_missing is False
    assert items == []


# ── 3. Robust JSON Extraction ────────────────────────────────────────────────


def test_extract_json_handles_think_tags_fences_prose_and_trailing_commas():
    raw = """<think>Let me compute this carefully.</think>
Here is the structured GRUCA solution:
```json
{
  "given": ["Q = 0.2 m³/s", "D = 0.20 m",],
  "required": ["Pump power in kW"],
  "assumptions": ["Steady state"],
  "equations": ["P = rho * g * Q * H / eta"],
  "calculations": ["Step 1: v = 6.366 m/s"],
  "units": ["[W] -> [kW]"],
  "answer": "Pump Power = 42.5 kW",
  "numeric_value": 42.5,
  "unit_str": "kW",
  "summary": "Custom pump power solved.",
}
```
Hope that helps!"""
    parsed = MultiAISolverOrchestrator._extract_json(raw)
    assert parsed is not None
    assert parsed["numeric_value"] == 42.5
    assert parsed["unit_str"] == "kW"
    assert parsed["answer"] == "Pump Power = 42.5 kW"


# ── 4. POST /api/tutor/solve with DB AIProviderConnection ────────────────────


def test_tutor_solve_uses_enabled_db_provider_connection_for_custom_problem(tutor_client_and_db):
    client, SessionLocal = tutor_client_and_db

    # Seed an enabled AIProviderConnection in the test DB
    db = SessionLocal()
    try:
        conn = AIProviderConnection(
            provider_id="openai",
            display_name="OpenAI",
            protocol="openai_compatible",
            base_url="https://api.openai.com/v1",
            encrypted_api_key=encrypt_api_key("sk-test-tutor-key-1234567890"),
            key_masked="sk-t••••••••••••7890",
            is_enabled=True,
            is_valid=True,
            synced_models=["gpt-4o-mini"],
            custom_models=[],
            disabled_models=[],
        )
        db.add(conn)
        db.commit()
    finally:
        db.close()

    custom_gruca_payload = {
        "given": ["Q = 0.2 m³/s", "D = 20 cm = 0.20 m", "L = 50 m"],
        "required": ["Required pump brake power in kW"],
        "assumptions": ["Steady incompressible water flow at 20°C", "Pump efficiency 80%"],
        "equations": ["v = 4Q / (pi * D^2)", "h_f = f * (L/D) * (v^2 / 2g)", "P = rho * g * Q * H / eta"],
        "calculations": [
            "Step 1: A = pi * 0.20^2 / 4 = 0.03142 m², v = 0.2 / 0.03142 = 6.366 m/s",
            "Step 2: P_shaft = 38.4 kW",
        ],
        "units": ["[kg/m³]·[m/s²]·[m³/s]·[m] = [W] = 10⁻³ [kW]"],
        "answer": "Required Pump Power = 38.4 kW",
        "numeric_value": 38.4,
        "unit_str": "kW",
        "summary": "Pumping 0.2 m³/s through a 20 cm, 50 m pipe requires 38.4 kW.",
    }

    mock_chat = AsyncMock(
        return_value={
            "ok": True,
            "text": json.dumps(custom_gruca_payload),
            "model": "gpt-4o-mini",
            "status_code": 200,
            "latency_ms": 120,
            "error": None,
        }
    )

    with patch("app.tutor_engine.chat_completion", new=mock_chat):
        resp = client.post(
            "/api/tutor/solve",
            json={
                "problem": "Calculate the pump power for water with Q = 0.2 m³/s, D = 20 cm, L = 50 m, elevation 8 m, efficiency 80%.",
                "subject": "Fluid Mechanics",
                "difficulty": "Intermediate",
                "active_providers": [],
                "api_keys": {},
            },
        )

    assert resp.status_code == 200
    body = resp.json()
    assert mock_chat.await_count == 1
    call_kwargs = mock_chat.await_args.kwargs
    assert call_kwargs["model_id"] == "gpt-4o-mini"
    assert call_kwargs["api_key"] == "sk-test-tutor-key-1234567890"
    assert call_kwargs["messages"][0]["role"] == "system"
    assert call_kwargs["messages"][1]["role"] == "user"

    assert body["gruca"]["answer"] == "Required Pump Power = 38.4 kW"
    assert "Q = 0.2 m³/s" in body["gruca"]["given"]
    assert body["audit"]["calculation_engine_verified"] is False
    assert len(body["audit"]["solvers_checked"]) == 1
    assert "OpenAI" in body["audit"]["solvers_checked"][0]["solver"]
    assert body["audit"]["solvers_checked"][0]["value"] == "38.4"


def test_tutor_solve_conceptual_question_with_null_numeric_value(tutor_client_and_db):
    client, SessionLocal = tutor_client_and_db

    db = SessionLocal()
    try:
        conn = AIProviderConnection(
            provider_id="openai",
            display_name="OpenAI",
            protocol="openai_compatible",
            base_url="https://api.openai.com/v1",
            encrypted_api_key=encrypt_api_key("sk-test-conceptual-key-12345"),
            key_masked="sk-t••••••••••••2345",
            is_enabled=True,
            is_valid=True,
            synced_models=["gpt-4o-mini"],
            custom_models=[],
            disabled_models=[],
        )
        db.add(conn)
        db.commit()
    finally:
        db.close()

    conceptual_payload = {
        "given": ["Counterflow heat exchanger configuration"],
        "required": ["Explanation of Log Mean Temperature Difference (LMTD)"],
        "assumptions": ["Steady-state, constant U and Cp, no heat loss"],
        "equations": ["LMTD = (ΔT1 - ΔT2) / ln(ΔT1 / ΔT2)", "Q = U * A * LMTD"],
        "calculations": ["Counterflow maintains a more uniform ΔT along the exchanger length than cocurrent flow."],
        "units": ["LMTD has dimensions of temperature difference [K] or [°C]"],
        "answer": "LMTD is the logarithmic average of the terminal temperature differences between hot and cold streams.",
        "numeric_value": None,
        "unit_str": "",
        "summary": "Explains counterflow LMTD definition and thermal driving force advantage.",
    }

    mock_chat = AsyncMock(
        return_value={
            "ok": True,
            "text": json.dumps(conceptual_payload),
            "model": "gpt-4o-mini",
            "status_code": 200,
            "latency_ms": 95,
            "error": None,
        }
    )

    with patch("app.tutor_engine.chat_completion", new=mock_chat):
        resp = client.post(
            "/api/tutor/solve",
            json={
                "problem": "Explain how LMTD works in a counterflow heat exchanger",
                "subject": "Heat Transfer",
                "difficulty": "Basic",
                "active_providers": ["openai:gpt-4o-mini"],
                "api_keys": {},
            },
        )

    assert resp.status_code == 200
    body = resp.json()
    assert "logarithmic average" in body["gruca"]["answer"]
    assert len(body["audit"]["solvers_checked"]) == 1
    assert body["audit"]["sanity_checked"] is True


def test_tutor_solve_returns_honest_message_when_no_provider_connected(tutor_client_and_db):
    client, _ = tutor_client_and_db

    resp = client.post(
        "/api/tutor/solve",
        json={
            "problem": "Calculate the pump power for water with Q = 0.2 m³/s, D = 20 cm, L = 50 m.",
            "subject": "Fluid Mechanics",
            "difficulty": "Intermediate",
            "active_providers": [],
            "api_keys": {},
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert "No AI provider is currently connected" in body["gruca"]["answer"]
    assert body["audit"]["solvers_checked"] == []
    assert body["audit"]["calculation_engine_verified"] is False
