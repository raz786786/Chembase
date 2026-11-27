"""Comprehensive tests for the 4-Stage Python/SymPy Verification Pipeline."""

from __future__ import annotations

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
    FinalAnswerItem,
    GrucaSolution,
    ProblemFingerprinter,
    _normalize_answer_text,
)
from app.tutor_solver import (  # noqa: E402
    convert_to_si,
    count_prompt_subquestions,
    execute_sympy_steps,
    normalize_symbol,
    run_hard_sanity_audit,
    solve_heat_exchanger_system,
    solve_pipe_flow_system,
    solve_vle_margules_flash,
    verify_printed_arithmetic,
)


@pytest.fixture()
def tutor_client_and_db(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("CHEMBASE_MASTER_KEY", "test-sympy-pipeline-key-2026")

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


# ── 1. Stage 1: Deterministic SI Unit Converter & Symbol Normalizer ──────────


def test_unit_converter_exact_si_conversions():
    val, unit = convert_to_si(240.0, "L/min")
    assert val == pytest.approx(0.004, rel=1e-12)
    assert unit == "m³/s"

    val, unit = convert_to_si(50.0, "mm")
    assert val == pytest.approx(0.05, rel=1e-12)
    assert unit == "m"

    val, unit = convert_to_si(150.0, "kPa")
    assert val == pytest.approx(150000.0, rel=1e-12)
    assert unit == "Pa"

    val, unit = convert_to_si(140.0, "°C", is_delta=False)
    assert val == pytest.approx(413.15, rel=1e-12)
    assert unit == "K"

    val, unit = convert_to_si(30.0, "°C", is_delta=True)
    assert val == pytest.approx(30.0, rel=1e-12)
    assert unit == "K"

    val, unit = convert_to_si(0.55, "cP")
    assert val == pytest.approx(0.00055, rel=1e-12)
    assert unit == "Pa·s"

    val, unit = convert_to_si(4.18, "kJ/kg·K")
    assert val == pytest.approx(4180.0, rel=1e-12)
    assert unit == "J/kg·K"

    val, unit = convert_to_si(75.0, "%")
    assert val == pytest.approx(0.75, rel=1e-12)
    assert unit == "fraction"


def test_normalize_symbol_greek_and_velocity_vs_nu():
    assert normalize_symbol("μ") == "mu"
    assert normalize_symbol("ρ") == "rho"
    assert normalize_symbol("ν") == "nu"
    assert normalize_symbol("ε") == "eps"
    assert normalize_symbol("η") == "eta"
    assert normalize_symbol("Δz") == "delta_z"
    assert normalize_symbol("vel") == "vel"
    assert normalize_symbol("vel") != normalize_symbol("ν")


# ── 2. User Test #1: Margules + Modified Raoult's Law VLE Flash ──────────────


def test_vle_margules_flash_two_phase_and_mass_balance():
    # Binary non-ideal flash (e.g. ethanol-water-like 2-suffix Margules)
    res = solve_vle_margules_flash(
        z1=0.45,
        P_total=101.325,
        P1_sat=130.0,
        P2_sat=55.0,
        A12=1.2,
        A21=0.8,
    )
    assert res["two_phase"] is True
    assert res["single_phase"] is False
    assert 0.0 <= res["x1"] <= 1.0
    assert 0.0 <= res["y1"] <= 1.0
    assert 0.0 <= res["V_over_F"] <= 1.0
    assert res["y1"] + res["y2"] == pytest.approx(1.0, abs=1e-9)
    assert res["mass_balance_residual"] < 1e-9
    assert res["P_calc"] == pytest.approx(101.325, rel=1e-9)

    # 1-suffix Margules (A21 omitted -> A21 == A12)
    res_1s = solve_vle_margules_flash(
        z1=0.50,
        P_total=100.0,
        P1_sat=140.0,
        P2_sat=60.0,
        A12=0.6,
    )
    assert 0.0 <= res_1s["x1"] <= 1.0
    assert 0.0 <= res_1s["y1"] <= 1.0
    assert 0.0 <= res_1s["V_over_F"] <= 1.0
    assert res_1s["mass_balance_residual"] < 1e-9


# ── 3. User Test #2: Heat Exchanger LMTD + Co-current Feasibility ────────────


def test_heat_exchanger_lmtd_and_cocurrent_feasibility():
    t_h_in, _ = convert_to_si(140.0, "°C")
    t_h_out, _ = convert_to_si(60.0, "°C")
    t_c_in, _ = convert_to_si(20.0, "°C")
    t_c_out, _ = convert_to_si(50.0, "°C")
    cp_c, _ = convert_to_si(4.18, "kJ/kg·K")
    q_w, _ = convert_to_si(420.0, "kW")

    res = solve_heat_exchanger_system(
        T_h_in_K=t_h_in,
        T_h_out_K=t_h_out,
        T_c_in_K=t_c_in,
        T_c_out_K=t_c_out,
        Cp_c_JkgK=cp_c,
        Q_dot_W=q_w,
        U_Wm2K=500.0,
        flow="counterflow",
    )

    # Counterflow: dT1 = 140 - 50 = 90 K, dT2 = 60 - 20 = 40 K -> LMTD = 50 / ln(90/40) = 61.657 K
    assert res["LMTD_counterflow_K"] == pytest.approx(61.66, abs=0.02)
    assert res["LMTD_K"] == pytest.approx(61.66, abs=0.02)
    # Cold mass flow: 420000 / (4180 * 30) = 3.34928 kg/s (NOT 3.46!)
    assert res["m_c"] == pytest.approx(3.3493, abs=0.001)
    # Co-current IS feasible because T_h_out (60°C) > T_c_out (50°C)
    assert res["cocurrent_feasible"] is True
    assert res["dT1_cocurrent_K"] == pytest.approx(120.0, abs=1e-6)
    assert res["dT2_cocurrent_K"] == pytest.approx(10.0, abs=1e-6)
    assert res["A_m2"] > 0


# ── 4. User Test #3: 5-Part Pipe Flow & Pump Power ───────────────────────────


def test_five_part_pipe_flow_and_pump_power():
    Q, _ = convert_to_si(240.0, "L/min")
    D, _ = convert_to_si(50.0, "mm")
    delta_P, _ = convert_to_si(150.0, "kPa")

    res = solve_pipe_flow_system(
        Q_m3s=Q,
        D_m=D,
        L_m=120.0,
        rho=790.0,
        mu=0.00055,
        eps_m=0.045e-3,
        delta_z_m=18.0,
        delta_P_pa=delta_P,
        eta=0.75,
    )

    # Velocity = 0.004 / (pi * 0.05^2 / 4) = 2.03718 m/s (NOT 12.22!)
    assert res["vel_ms"] == pytest.approx(2.0372, abs=0.001)
    # Re = 790 * 2.03718 * 0.05 / 0.00055 = 146,307 (NOT 11,109!)
    assert res["Re"] == pytest.approx(146307.0, rel=1e-3)
    assert res["flow_regime"] == "Turbulent"
    assert 0.015 < res["f"] < 0.030
    # Total head must include elevation (18 m) + pressure head (~19.36 m) + friction head
    assert res["pressure_head_m"] == pytest.approx(150000.0 / (790.0 * 9.80665), rel=1e-6)
    assert res["H_total_m"] == pytest.approx(18.0 + res["pressure_head_m"] + res["h_f_m"], rel=1e-9)
    assert res["H_total_m"] > 18.0 + res["pressure_head_m"]
    assert res["P_shaft_kw"] == pytest.approx(res["P_hyd_kw"] / 0.75, rel=1e-9)
    assert res["P_shaft_kw"] > 0


# ── 5. Stage 3: Safe SymPy Step Executor & Security ──────────────────────────


def test_sympy_step_executor_converts_and_computes_and_blocks_unsafe():
    variables = [
        {"symbol": "Q", "value": 240.0, "unit": "L/min"},
        {"symbol": "D", "value": 50.0, "unit": "mm"},
        {"symbol": "rho", "value": 790.0, "unit": "kg/m3"},
        {"symbol": "mu", "value": 0.55, "unit": "cP"},
        {"symbol": "eps", "value": 0.045, "unit": "mm"},
    ]
    steps = [
        {"symbol": "A", "label": "Area", "expr": "pi * D**2 / 4", "unit": "m²"},
        {"symbol": "vel", "label": "Velocity", "expr": "Q / A", "unit": "m/s"},
        {"symbol": "Re", "label": "Reynolds", "expr": "rho * vel * D / mu", "unit": ""},
        {
            "solve_for": "f",
            "label": "Colebrook friction factor",
            "lhs": "1 / sqrt(f)",
            "rhs": "-2 * log10(eps / (3.7 * D) + 2.51 / (Re * sqrt(f)))",
            "bracket": [0.005, 0.1],
            "unit": "",
        },
    ]

    out = execute_sympy_steps(variables, steps)
    assert out["verified"] is True
    assert out["errors"] == []
    assert out["si_variables"]["Q"]["si_value"] == pytest.approx(0.004, rel=1e-12)
    assert out["computed"]["vel"] == pytest.approx(2.0372, abs=0.001)
    assert out["computed"]["Re"] == pytest.approx(146307.0, rel=1e-3)
    assert 0.015 < out["computed"]["f"] < 0.030

    # Security: unsafe expression must be rejected cleanly
    unsafe_out = execute_sympy_steps(
        variables=[],
        steps=[{"symbol": "x", "label": "Malicious", "expr": "__import__('os').system('echo hacked')"}],
    )
    assert unsafe_out["verified"] is False
    assert len(unsafe_out["errors"]) == 1
    assert "unsafe" in unsafe_out["errors"][0].lower()


# ── 6. Stage 4: Hard Programmatic Sanity Auditor ─────────────────────────────


def test_sanity_auditor_catches_dropped_parts_false_horizontal_arithmetic_and_velocity():
    five_part_prompt = (
        "Methanol flows at 240 L/min through a 50 mm pipe of length 120 m with an elevation lift of 18 m. "
        "Calculate: 1. Mean velocity 2. Reynolds number 3. Friction factor 4. Total head 5. Pump shaft power."
    )
    assert count_prompt_subquestions(five_part_prompt) == 5

    bad_gruca = GrucaSolution(
        given=["Q = 240 L/min"],
        required=["Find all 5 items"],
        assumptions=["Assume horizontal pipe with zero elevation change"],
        equations=["m_c = Q / (Cp * dT)"],
        calculations=[
            "Step 1: m_c = 420000 / (4180 * 30) = 3.46 kg/s",
        ],
        units=["m/s"],
        answer="Velocity = 12.22 m/s",
        final_answers=[
            FinalAnswerItem(label="Velocity", value="12.22", unit="m/s"),
            FinalAnswerItem(label="Reynolds", value="11109", unit=""),
        ],
    )
    sympy_res = {"computed": {"vel": 12.22}, "verified": True, "errors": []}

    arith_errs = verify_printed_arithmetic(bad_gruca.calculations)
    assert len(arith_errs) == 1
    assert "3.349" in arith_errs[0] or "3.34928" in arith_errs[0]

    audit = run_hard_sanity_audit(five_part_prompt, bad_gruca, sympy_res, bad_gruca.final_answers)
    assert audit["passed"] is False
    failures_blob = " ".join(audit["critical_failures"]).lower()
    warnings_blob = " ".join(audit["warnings"]).lower()
    assert "5 sub-questions" in failures_blob
    assert "horizontal" in failures_blob
    assert "arithmetic mismatch" in failures_blob
    assert "velocity" in warnings_blob and "12.22" in warnings_blob


# ── 7. Answer Normalization & End-to-End SymPy Locking + Repair Retry ────────


def test_answer_normalization_never_serializes_raw_python_list():
    fas = [
        FinalAnswerItem(label="Velocity", value="2.037", unit="m/s", verified_by_sympy=True),
        FinalAnswerItem(label="Reynolds", value="146307", unit="", verified_by_sympy=True),
    ]
    ans1 = _normalize_answer_text(["Velocity = 2.037 m/s", "Re = 146307"], fas)
    assert not ans1.startswith("[")
    assert "2.037" in ans1 and "146307" in ans1

    ans2 = _normalize_answer_text("['a', 'b']", fas)
    assert ans2 == "a | b"
    assert not ans2.startswith("[")


def test_end_to_end_sympy_float_locking_and_repair_retry(tutor_client_and_db):
    client, SessionLocal = tutor_client_and_db

    db = SessionLocal()
    try:
        conn = AIProviderConnection(
            provider_id="openai",
            display_name="OpenAI",
            protocol="openai_compatible",
            base_url="https://api.openai.com/v1",
            encrypted_api_key=encrypt_api_key("sk-test-sympy-e2e-123456"),
            key_masked="sk-t••••••••••••3456",
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

    # First AI attempt drops a sub-question & hallucinates wrong velocity (12.22 instead of 2.037)
    first_payload = {
        "extracted_variables": [
            {"symbol": "Q", "value": 240.0, "unit": "L/min"},
            {"symbol": "D", "value": 50.0, "unit": "mm"},
        ],
        "sympy_steps": [
            {"symbol": "A", "label": "Area", "expr": "pi * D**2 / 4", "unit": "m²"},
            {"symbol": "vel", "label": "Velocity", "expr": "Q / A", "unit": "m/s"},
        ],
        "given": ["Q = 240 L/min", "D = 50 mm"],
        "required": ["1. Area", "2. Velocity"],
        "assumptions": ["Steady incompressible flow"],
        "equations": ["A = pi*D^2/4", "vel = Q/A"],
        "calculations": ["Step 1: vel = 12.22 m/s"],
        "units": ["m/s"],
        "final_answers": [
            {"label": "Velocity", "value": "12.22", "unit": "m/s", "symbol": "vel"},
        ],
        "answer": ["Velocity = 12.22 m/s"],
        "numeric_value": 12.22,
        "unit_str": "m/s",
        "summary": "Initial flawed attempt.",
    }

    # Repair pass supplies both sub-questions (still intentionally wrong float in final_answers so SymPy locks it!)
    repaired_payload = {
        "extracted_variables": [
            {"symbol": "Q", "value": 240.0, "unit": "L/min"},
            {"symbol": "D", "value": 50.0, "unit": "mm"},
        ],
        "sympy_steps": [
            {"symbol": "A", "label": "Area", "expr": "pi * D**2 / 4", "unit": "m²"},
            {"symbol": "vel", "label": "Velocity", "expr": "Q / A", "unit": "m/s"},
        ],
        "given": ["Q = 240 L/min = 0.004 m³/s", "D = 50 mm = 0.05 m"],
        "required": ["1. Area", "2. Velocity"],
        "assumptions": ["Steady incompressible flow"],
        "equations": ["A = pi*D^2/4", "vel = Q/A"],
        "calculations": ["Step 1: A = 0.0019635 m²", "Step 2: vel = 2.037 m/s"],
        "units": ["m²", "m/s"],
        "final_answers": [
            {"label": "Area", "value": "0.002", "unit": "m²", "symbol": "A"},
            {"label": "Velocity", "value": "2.1", "unit": "m/s", "symbol": "vel"},
        ],
        "answer": ["Area = 0.0019635 m²", "Velocity = 2.037 m/s"],
        "numeric_value": 2.037,
        "unit_str": "m/s",
        "summary": "Repaired two-part pipe flow solution.",
    }

    mock_chat = AsyncMock(
        side_effect=[
            {"ok": True, "text": json.dumps(first_payload), "model": "gpt-4o-mini", "status_code": 200, "latency_ms": 100, "error": None},
            {"ok": True, "text": json.dumps(repaired_payload), "model": "gpt-4o-mini", "status_code": 200, "latency_ms": 110, "error": None},
        ]
    )

    with patch("app.tutor_engine.chat_completion", new=mock_chat):
        resp = client.post(
            "/api/tutor/solve",
            json={
                "problem": "Methanol flows at 240 L/min through a 50 mm pipe. Calculate: 1. Cross-sectional area 2. Mean flow velocity.",
                "subject": "Fluid Mechanics",
                "difficulty": "Intermediate",
                "active_providers": [],
                "api_keys": {},
            },
        )

    assert resp.status_code == 200
    assert mock_chat.await_count == 2  # Initial + 1 automatic targeted repair retry!
    body = resp.json()

    # Answer is normalized (never a raw Python list string)
    assert not body["gruca"]["answer"].startswith("[")

    # SymPy locked the exact floats into final_answers
    fas = body["gruca"]["final_answers"]
    assert len(fas) == 2
    assert fas[0]["verified_by_sympy"] is True
    assert float(fas[0]["value"]) == pytest.approx(0.0019635, rel=1e-3)
    assert fas[1]["verified_by_sympy"] is True
    assert float(fas[1]["value"]) == pytest.approx(2.03718, rel=1e-3)

    # Audit reflects honest SymPy verification
    assert body["audit"]["calculation_engine_verified"] is True
    assert body["audit"]["sanity_checked"] is True
    assert any("SymPy/Python Verification:" in c for c in body["gruca"]["calculations"])
