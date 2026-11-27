"""Tests for Advanced SciPy/SymPy Solvers (system, integral, ode) and NIST/Perry's Properties."""

import math
import pytest

from app.tutor_solver import (
    antoine_psat_pa,
    detect_property_context,
    execute_sympy_steps,
    get_air_properties,
    get_critical_properties,
    get_water_properties,
)
from app.tutor_engine import MultiAISolverOrchestrator


# ─── 1. NIST / Perry's Property Database Tests ──────────────────────────────


def test_water_properties_anchor_and_interpolation():
    w20 = get_water_properties(20.0)
    assert w20["rho_kgm3"] == pytest.approx(998.2, rel=1e-4)
    assert w20["mu_Pas"] == pytest.approx(1.002e-3, rel=1e-3)
    assert w20["Cp_JkgK"] == pytest.approx(4184.0, rel=1e-4)
    assert w20["k_WmK"] == pytest.approx(0.598, rel=1e-3)

    w80 = get_water_properties(80.0)
    assert w80["rho_kgm3"] == pytest.approx(971.8, rel=1e-4)
    assert w80["mu_Pas"] == pytest.approx(3.54e-4, rel=1e-3)
    assert w80["Cp_JkgK"] == pytest.approx(4196.0, rel=1e-4)
    assert w80["k_WmK"] == pytest.approx(0.670, rel=1e-3)
    assert w80["Pr"] == pytest.approx(2.22, rel=0.02)
    assert w80["Psat_Pa"] == pytest.approx(47373.0, rel=0.02)

    w100 = get_water_properties(100.0)
    assert w100["rho_kgm3"] == pytest.approx(958.4, rel=1e-4)
    assert w100["mu_Pas"] == pytest.approx(2.82e-4, rel=1e-3)
    assert w100["Cp_JkgK"] == pytest.approx(4216.0, rel=1e-4)
    assert w100["k_WmK"] == pytest.approx(0.679, rel=1e-3)

    # Clamping beyond [0, 100] °C should not raise and should clamp gracefully
    assert get_water_properties(-15.0) == get_water_properties(0.0)
    assert get_water_properties(150.0) == get_water_properties(100.0)


def test_air_properties_at_25C():
    air25 = get_air_properties(25.0)
    assert air25["rho_kgm3"] == pytest.approx(1.184, rel=0.01)
    assert air25["mu_Pas"] == pytest.approx(1.849e-5, rel=0.02)
    assert air25["Cp_JkgK"] == pytest.approx(1007.0, rel=0.01)
    assert air25["k_WmK"] == pytest.approx(0.0261, rel=0.02)
    assert air25["Pr"] == pytest.approx(0.713, rel=0.02)


def test_antoine_vapor_pressure_and_critical_properties():
    p_benzene = antoine_psat_pa("benzene", 80.1)
    assert p_benzene is not None
    assert p_benzene == pytest.approx(101325.0, rel=0.01)

    p_water = antoine_psat_pa("water", 100.0)
    assert p_water is not None
    assert p_water == pytest.approx(101325.0, rel=0.01)

    # Alias handling (hexane -> n-hexane)
    assert antoine_psat_pa("hexane", 68.7) == pytest.approx(101325.0, rel=0.02)
    assert antoine_psat_pa("nonexistent_species", 25.0) is None

    ch4 = get_critical_properties("methane")
    assert ch4 is not None
    assert ch4["MW_gmol"] == pytest.approx(16.043, rel=1e-3)
    assert ch4["Tc_K"] == pytest.approx(190.56, rel=1e-3)
    assert ch4["Pc_Pa"] == pytest.approx(4.599e6, rel=1e-3)
    assert ch4["omega"] == pytest.approx(0.0115, rel=0.05)


def test_detect_property_context_and_prompt_injection():
    ctx = detect_property_context("Water at 80°C flows through a pipe of diameter 0.1 m.")
    assert "Verified Reference Properties (NIST/Perry's):" in ctx
    assert "971.8" in ctx
    assert "4196" in ctx

    ctx_k = detect_property_context("Liquid water at 353.15 K enters a heat exchanger.")
    assert "971.8" in ctx_k

    ctx_air = detect_property_context("Air at 25°C flows over a flat plate.")
    assert "Dry Air" in ctx_air
    assert "1.184" in ctx_air

    ctx_empty = detect_property_context("Find the root of x^3 - 2*x - 5 = 0.")
    assert ctx_empty == ""

    prompt = MultiAISolverOrchestrator.build_independent_prompt(
        "Water at 80°C flows through a pipe", "Fluid Mechanics", "Intermediate", "test-solver"
    )
    assert "Verified Reference Properties (NIST/Perry's):" in prompt
    assert 'kind: "system"' in prompt
    assert 'kind: "integral"' in prompt
    assert 'kind: "ode"' in prompt


# ─── 2. Coupled System Solver (kind: "system") ──────────────────────────────


def test_sympy_executor_system_distillation_and_nonlinear():
    # Part A: 2x2 distillation mass balance (F = 1000 kg/h, xF = 0.40, xD = 0.95, xB = 0.05)
    res_lin = execute_sympy_steps(
        variables=[
            {"symbol": "F", "value": 1000.0, "unit": ""},
            {"symbol": "xF", "value": 0.40, "unit": ""},
            {"symbol": "xD", "value": 0.95, "unit": ""},
            {"symbol": "xB", "value": 0.05, "unit": ""},
        ],
        steps=[
            {
                "kind": "system",
                "label": "Binary distillation mass balance",
                "equations": [
                    {"lhs": "D + B", "rhs": "F"},
                    {"lhs": "D * xD + B * xB", "rhs": "F * xF"},
                ],
                "solve_for": ["D", "B"],
                "guesses": [500.0, 500.0],
                "units": {"D": "kg/h", "B": "kg/h"},
            }
        ],
    )
    assert res_lin["verified"] is True
    assert res_lin["errors"] == []
    assert res_lin["computed"]["D"] == pytest.approx(388.888889, rel=1e-5)
    assert res_lin["computed"]["B"] == pytest.approx(611.111111, rel=1e-5)

    # Part B: 2-variable nonlinear chemical equilibrium system
    # x^2 + y^2 = 1  and  exp(x) - y = 1.5
    res_nl = execute_sympy_steps(
        variables=[],
        steps=[
            {
                "kind": "system",
                "label": "Nonlinear equilibrium system",
                "equations": [
                    {"lhs": "x1**2 + x2**2", "rhs": "1"},
                    {"lhs": "exp(x1) - x2", "rhs": "1.5"},
                ],
                "solve_for": ["x1", "x2"],
                "guesses": [0.7, 0.7],
            }
        ],
    )
    assert res_nl["verified"] is True
    x1 = res_nl["computed"]["x1"]
    x2 = res_nl["computed"]["x2"]
    assert abs((x1**2 + x2**2) - 1.0) < 1e-6
    assert abs((math.exp(x1) - x2) - 1.5) < 1e-6


# ─── 3. Definite Integral Solver (kind: "integral") ─────────────────────────


def test_sympy_executor_integral_pfr_volume():
    # V = integral_0^0.9 (v0 / (k * (1 - X))) dX
    # With v0 = 10 L/min, k = 0.05 min^-1 -> V = (10 / 0.05) * (-ln(0.1)) = 200 * ln(10) = 460.5170186 L
    res = execute_sympy_steps(
        variables=[
            {"symbol": "v0", "value": 10.0, "unit": ""},
            {"symbol": "k", "value": 0.05, "unit": ""},
            {"symbol": "X_exit", "value": 0.9, "unit": ""},
        ],
        steps=[
            {
                "kind": "integral",
                "symbol": "V_pfr",
                "label": "PFR Volume",
                "integrand": "v0 / (k * (1 - X))",
                "var": "X",
                "lower": 0,
                "upper": "X_exit",
                "unit": "L",
            }
        ],
    )
    assert res["verified"] is True
    assert res["errors"] == []
    expected_v = (10.0 / 0.05) * (-math.log(1.0 - 0.9))
    assert res["computed"]["V_pfr"] == pytest.approx(expected_v, rel=1e-7)
    assert res["computed"]["V_pfr"] == pytest.approx(460.517, abs=1e-3)


# ─── 4. Coupled ODE Solver (kind: "ode") ────────────────────────────────────


def test_sympy_executor_ode_consecutive_batch_reactions():
    # A --k1--> B --k2--> C, k1=0.2, k2=0.1, CA0=1.0, CB0=0.0, t=0..5
    # Exact Bateman solution:
    # CA(5) = exp(-0.2 * 5) = exp(-1)
    # CB(5) = (k1 / (k2 - k1)) * CA0 * (exp(-k1*5) - exp(-k2*5)) = 2 * (exp(-0.5) - exp(-1))
    res = execute_sympy_steps(
        variables=[
            {"symbol": "k1", "value": 0.2, "unit": ""},
            {"symbol": "k2", "value": 0.1, "unit": ""},
        ],
        steps=[
            {
                "kind": "ode",
                "label": "Consecutive 1st-order batch reactions",
                "indep": "t",
                "dep": ["CA", "CB"],
                "rhs": ["-k1 * CA", "k1 * CA - k2 * CB"],
                "span": [0, 5],
                "y0": [1.0, 0.0],
                "outputs": ["CA_final", "CB_final"],
                "units": {"CA_final": "mol/L", "CB_final": "mol/L"},
            }
        ],
    )
    assert res["verified"] is True
    assert res["errors"] == []
    ca_exact = math.exp(-1.0)
    cb_exact = 2.0 * (math.exp(-0.5) - math.exp(-1.0))
    assert res["computed"]["CA_final"] == pytest.approx(ca_exact, rel=1e-5)
    assert res["computed"]["CB_final"] == pytest.approx(cb_exact, rel=1e-5)


# ─── 5. Security Rejection Tests ────────────────────────────────────────────


def test_security_rejects_unsafe_expressions_in_advanced_steps():
    payload = "__import__('os').system('echo hi')"

    res_sys = execute_sympy_steps(
        variables=[],
        steps=[
            {
                "kind": "system",
                "equations": [{"lhs": payload, "rhs": "0"}],
                "solve_for": ["x"],
                "guesses": [1.0],
            }
        ],
    )
    assert res_sys["verified"] is False
    assert any("Rejected unsafe expression" in e for e in res_sys["errors"])

    res_int = execute_sympy_steps(
        variables=[],
        steps=[
            {
                "kind": "integral",
                "symbol": "I",
                "integrand": payload,
                "var": "x",
                "lower": 0,
                "upper": 1,
            }
        ],
    )
    assert res_int["verified"] is False
    assert any("Rejected unsafe expression" in e for e in res_int["errors"])

    res_ode = execute_sympy_steps(
        variables=[],
        steps=[
            {
                "kind": "ode",
                "indep": "t",
                "dep": ["y"],
                "rhs": [payload],
                "span": [0, 1],
                "y0": [1.0],
            }
        ],
    )
    assert res_ode["verified"] is False
    assert any("Rejected unsafe expression" in e for e in res_ode["errors"])
