"""Tests for Advanced SciPy/SymPy Solvers (system, integral, ode) and NIST/Perry's Properties."""

import asyncio
import math
import httpx
import pytest

from app.tutor_solver import (
    antoine_psat_pa,
    build_verified_property_context,
    detect_property_context,
    execute_sympy_steps,
    fetch_pubchem_properties,
    get_air_properties,
    get_coolprop_properties,
    get_critical_properties,
    get_steam_properties,
    get_water_properties,
)
from app.tutor_solver import properties as props_module
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


# ─── 6. Multi-Tier Verified Property Engine (IAPWS-97, CoolProp, PubChem) ────


def test_iapws97_superheated_and_saturated_steam():
    # Superheated steam at 400 °C (673.15 K) and 20 bar (2.0 MPa)
    steam = get_steam_properties(T_K=673.15, P_Pa=2.0e6)
    assert steam is not None
    assert steam["source"] == "IAPWS-97 Verified"
    assert steam["h_kJkg"] == pytest.approx(3248.2, abs=5.0)
    assert steam["s_kJkgK"] == pytest.approx(7.129, abs=0.05)
    assert math.isfinite(steam["rho_kgm3"]) and steam["rho_kgm3"] > 0.0
    assert math.isfinite(steam["Cp_JkgK"]) and steam["Cp_JkgK"] > 1000.0
    assert math.isfinite(steam["mu_Pas"]) and steam["mu_Pas"] > 0.0
    assert math.isfinite(steam["k_WmK"]) and steam["k_WmK"] > 0.0

    # Saturated vapor at 1 atm
    sat_v = get_steam_properties(P_Pa=101325.0, x=1.0)
    assert sat_v is not None
    assert sat_v["source"] == "IAPWS-97 Verified"
    assert sat_v["h_kJkg"] == pytest.approx(2675.6, abs=5.0)


def test_coolprop_real_fluid_ammonia_and_co2():
    nh3 = get_coolprop_properties("ammonia", T_K=300.0, P_Pa=1.0e6)
    assert nh3 is not None
    assert nh3["source"] == "CoolProp EOS Verified"
    assert math.isfinite(nh3["rho_kgm3"]) and nh3["rho_kgm3"] > 0.0
    assert math.isfinite(nh3["Cp_JkgK"]) and nh3["Cp_JkgK"] > 0.0
    assert math.isfinite(nh3["Z"]) and 0.0 < nh3["Z"] < 2.0

    co2 = get_coolprop_properties("co2", T_K=310.0, P_Pa=8.0e6)
    assert co2 is not None
    assert co2["source"] == "CoolProp EOS Verified"
    assert math.isfinite(co2["rho_kgm3"]) and co2["rho_kgm3"] > 100.0
    assert math.isfinite(co2["Cp_JkgK"]) and co2["Cp_JkgK"] > 0.0
    assert math.isfinite(co2["Z"]) and 0.1 < co2["Z"] < 1.0

    assert get_coolprop_properties("not_a_real_coolprop_fluid", T_K=300.0, P_Pa=1e5) is None


def test_pubchem_fallback_mocked_and_timeout(monkeypatch):
    props_module._PUBCHEM_CACHE.clear()

    class _MockResponse:
        status_code = 200

        def json(self):
            return {
                "PropertyTable": {
                    "Properties": [
                        {
                            "CID": 7964,
                            "MolecularFormula": "C6H5Cl",
                            "MolecularWeight": "112.56",
                            "IUPACName": "chlorobenzene",
                        }
                    ]
                }
            }

    class _MockAsyncClientSuccess:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url):
            assert "chlorobenzene" in url.lower()
            return _MockResponse()

    monkeypatch.setattr(props_module.httpx, "AsyncClient", _MockAsyncClientSuccess)
    res = asyncio.run(fetch_pubchem_properties("chlorobenzene"))
    assert res is not None
    assert res["formula"] == "C6H5Cl"
    assert res["MW_gmol"] == pytest.approx(112.56, rel=1e-4)
    assert res["source"] == "PubChem Verified"

    # Graceful None on timeout (uncached compound)
    class _MockAsyncClientTimeout:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, url):
            raise httpx.TimeoutException("timed out")

    monkeypatch.setattr(props_module.httpx, "AsyncClient", _MockAsyncClientTimeout)
    res_timeout = asyncio.run(fetch_pubchem_properties("unobtanium_timeout_test"))
    assert res_timeout is None


def test_build_verified_property_context_steam_and_provenance(monkeypatch):
    # Prevent any live network call in unit test
    async def _no_net(name, timeout_s=4.0):
        return None

    monkeypatch.setattr(props_module, "fetch_pubchem_properties", _no_net)

    ctx = asyncio.run(
        build_verified_property_context("Superheated steam at 400°C and 20 bar enters a turbine.")
    )
    assert "[IAPWS-97 Verified]" in ctx
    assert "324" in ctx  # h ≈ 3248.23 kJ/kg

    # Verify Zero-Fabrication Provenance Rule in SYSTEM_PROMPT
    sys_prompt = MultiAISolverOrchestrator.SYSTEM_PROMPT
    assert "[Problem Input]" in sys_prompt
    assert "[IAPWS-97 Verified]" in sys_prompt
    assert "[CoolProp EOS Verified]" in sys_prompt
    assert "[NIST/Perry's Table]" in sys_prompt
    assert "[PubChem Verified]" in sys_prompt
    assert "[LLM Estimated — Verify]" in sys_prompt

