"""Stage 2 & 3: Verified Equation Registry, Parametric Domain Solvers, and Safe SymPy Executor."""

from __future__ import annotations

import math
import re
from typing import Any, Dict, List, Optional

import numpy as np
import scipy.integrate as integrate
import scipy.optimize as opt
import sympy as sp
from sympy.parsing.sympy_parser import (
    convert_xor,
    parse_expr,
    standard_transformations,
)

from .units import convert_to_si, normalize_symbol

G_STD = 9.80665
R_GAS = 8.314462618

EQUATION_REGISTRY_PROMPT = """VERIFIED CHEMICAL ENGINEERING EQUATION REGISTRY (use these exact forms):
1. Pipe Flow & Pumping (use ASCII symbol `vel` for fluid velocity, NEVER `nu`):
   - Cross-sectional area: A = pi * D**2 / 4
   - Mean velocity: vel = Q / A
   - Reynolds number: Re = rho * vel * D / mu  (or vel * D / nu if kinematic viscosity nu is given)
   - Laminar (Re < 2300): f = 64 / Re
   - Turbulent (Re >= 2300) Colebrook-White: 1/sqrt(f) = -2*log10(eps/(3.7*D) + 2.51/(Re*sqrt(f)))
   - Darcy-Weisbach frictional head loss: h_f = f * (L / D) * (vel**2 / (2 * g))
   - Total dynamic head (ALWAYS include elevation delta_z AND pressure delta_P if given):
     H_total = delta_z + delta_P / (rho * g) + h_f
   - Hydraulic power: P_hyd = rho * g * Q * H_total  [W];  Shaft power: P_shaft = P_hyd / eta  [W]
2. Heat Exchanger (LMTD Method):
   - Energy balance: Q_dot = m_h * Cp_h * (T_h_in - T_h_out) = m_c * Cp_c * (T_c_out - T_c_in)
   - Counterflow: dT1 = T_h_in - T_c_out, dT2 = T_h_out - T_c_in, LMTD = (dT1 - dT2) / ln(dT1 / dT2)
   - Co-current (parallel) feasibility: FEASIBLE iff T_h_in > T_c_in AND T_h_out > T_c_out (NO temperature cross).
     If feasible: dT1_cc = T_h_in - T_c_in, dT2_cc = T_h_out - T_c_out, LMTD_cc = (dT1_cc - dT2_cc) / ln(dT1_cc / dT2_cc)
   - Required area: A = Q_dot / (U * F * LMTD)
3. Non-Ideal Binary VLE (Modified Raoult's Law + 1- or 2-Suffix Margules + Lever Rule):
   - ln(gamma1) = (1 - x1)**2 * (A12 + 2*(A21 - A12)*x1)
   - ln(gamma2) = x1**2 * (A21 + 2*(A12 - A21)*(1 - x1))
   - Modified Raoult's Law: y1 * P = x1 * gamma1 * P1_sat,  (1 - y1) * P = (1 - x1) * gamma2 * P2_sat
   - Total pressure constraint: x1 * gamma1 * P1_sat + (1 - x1) * gamma2 * P2_sat = P_total
   - Isothermal flash Lever Rule: V_over_F = (z1 - x1) / (y1 - x1),  L_over_F = 1 - V_over_F
   - Conservation check: z1 = (1 - V_over_F)*x1 + V_over_F*y1
4. Ideal Reactors (Isothermal Liquid-Phase):
   - CSTR: V = F_A0 * X_A / (-r_A_exit)  (for 1st-order: V = Q * X_A / (k * (1 - X_A)))
   - PFR:  V = F_A0 * integral(dX_A / (-r_A), 0, X_A)  (for 1st-order: V = -(Q / k) * ln(1 - X_A))
5. Advanced SciPy/SymPy Step Kinds (delegate coupled systems, integrals, and ODEs directly to Python):
   - Coupled algebraic/nonlinear system:
     {"kind": "system", "equations": [{"lhs": "...", "rhs": "..."}, ...], "solve_for": ["x1", "x2"], "guesses": [0.5, 0.5], "units": {"x1": "...", "x2": "..."}, "label": "..."}
   - Definite integral (e.g., PFR volume, Cp(T) enthalpy):
     {"kind": "integral", "symbol": "V_pfr", "integrand": "v0 / (k * (1 - X))", "var": "X", "lower": 0, "upper": 0.9, "unit": "L", "label": "..."}
   - Coupled ODE integration (e.g., batch/PFR consecutive reactions, transient balances):
     {"kind": "ode", "indep": "t", "dep": ["CA", "CB"], "rhs": ["-k1 * CA", "k1 * CA - k2 * CB"], "span": [0, 10], "y0": [1.0, 0.0], "outputs": ["CA_final", "CB_final"], "units": {"CA_final": "mol/L", "CB_final": "mol/L"}, "label": "..."}"""


# ─── Parametric Verified Domain Solvers ──────────────────────────────────────


def solve_pipe_flow_system(
    Q_m3s: float,
    D_m: float,
    L_m: float,
    rho: float,
    mu: float,
    eps_m: float = 0.0,
    delta_z_m: float = 0.0,
    delta_P_pa: float = 0.0,
    eta: float = 1.0,
) -> Dict[str, Any]:
    """General parametric pipe flow & pump power solver using exact Colebrook-White (brentq)."""
    if Q_m3s <= 0 or D_m <= 0 or L_m < 0 or rho <= 0 or mu <= 0 or eta <= 0:
        raise ValueError("Pipe flow parameters Q, D, rho, mu, eta must be positive and L >= 0.")

    A_m2 = math.pi * (D_m ** 2) / 4.0
    vel_ms = Q_m3s / A_m2
    Re = (rho * vel_ms * D_m) / mu

    if Re < 2300.0:
        f = 64.0 / Re
        flow_regime = "Laminar"
    else:
        flow_regime = "Turbulent" if Re >= 4000.0 else "Transitional"

        def _colebrook_res(f_val: float) -> float:
            s = math.sqrt(f_val)
            return (1.0 / s) + 2.0 * math.log10((eps_m / (3.7 * D_m)) + (2.51 / (Re * s)))

        try:
            f = float(opt.brentq(_colebrook_res, 1e-6, 0.5, xtol=1e-12, rtol=1e-12))
        except ValueError:
            # Fallback to Swamee-Jain explicit approximation if extreme roughness
            f = 0.25 / (math.log10((eps_m / (3.7 * D_m)) + (5.74 / (Re ** 0.9))) ** 2)

    h_f_m = f * (L_m / D_m) * (vel_ms ** 2) / (2.0 * G_STD)
    pressure_head_m = delta_P_pa / (rho * G_STD)
    H_total_m = delta_z_m + pressure_head_m + h_f_m
    P_hyd_w = rho * G_STD * Q_m3s * H_total_m
    P_hyd_kw = P_hyd_w / 1000.0
    P_shaft_kw = P_hyd_kw / eta

    return {
        "A_m2": A_m2,
        "vel_ms": vel_ms,
        "Re": Re,
        "flow_regime": flow_regime,
        "f": f,
        "h_f_m": h_f_m,
        "delta_z_m": delta_z_m,
        "pressure_head_m": pressure_head_m,
        "H_total_m": H_total_m,
        "P_hyd_kw": P_hyd_kw,
        "P_shaft_kw": P_shaft_kw,
        "delta_P_friction_pa": rho * G_STD * h_f_m,
    }


def _compute_lmtd(dT1: float, dT2: float) -> Optional[float]:
    if dT1 <= 0.0 or dT2 <= 0.0:
        return None
    if abs(dT1 - dT2) < 1e-9:
        return dT1
    return (dT1 - dT2) / math.log(dT1 / dT2)


def solve_heat_exchanger_system(
    m_h: Optional[float] = None,
    Cp_h_JkgK: Optional[float] = None,
    T_h_in_K: Optional[float] = None,
    T_h_out_K: Optional[float] = None,
    m_c: Optional[float] = None,
    Cp_c_JkgK: Optional[float] = None,
    T_c_in_K: Optional[float] = None,
    T_c_out_K: Optional[float] = None,
    U_Wm2K: Optional[float] = None,
    F: float = 1.0,
    flow: str = "counterflow",
    Q_dot_W: Optional[float] = None,
) -> Dict[str, Any]:
    """General parametric heat exchanger solver (energy balance, counterflow & co-current LMTD, area)."""
    # 1. Resolve Q_dot_W from whichever side is fully specified
    if Q_dot_W is None:
        if None not in (m_h, Cp_h_JkgK, T_h_in_K, T_h_out_K):
            Q_dot_W = float(m_h) * float(Cp_h_JkgK) * (float(T_h_in_K) - float(T_h_out_K))
        elif None not in (m_c, Cp_c_JkgK, T_c_in_K, T_c_out_K):
            Q_dot_W = float(m_c) * float(Cp_c_JkgK) * (float(T_c_out_K) - float(T_c_in_K))

    # 2. Solve the remaining unknown on either side using Q_dot_W
    if Q_dot_W is not None:
        if m_h is None and None not in (Cp_h_JkgK, T_h_in_K, T_h_out_K) and T_h_in_K != T_h_out_K:
            m_h = Q_dot_W / (float(Cp_h_JkgK) * (float(T_h_in_K) - float(T_h_out_K)))
        if m_c is None and None not in (Cp_c_JkgK, T_c_in_K, T_c_out_K) and T_c_out_K != T_c_in_K:
            m_c = Q_dot_W / (float(Cp_c_JkgK) * (float(T_c_out_K) - float(T_c_in_K)))
        if T_h_out_K is None and None not in (m_h, Cp_h_JkgK, T_h_in_K) and m_h and Cp_h_JkgK:
            T_h_out_K = float(T_h_in_K) - Q_dot_W / (float(m_h) * float(Cp_h_JkgK))
        if T_c_out_K is None and None not in (m_c, Cp_c_JkgK, T_c_in_K) and m_c and Cp_c_JkgK:
            T_c_out_K = float(T_c_in_K) + Q_dot_W / (float(m_c) * float(Cp_c_JkgK))

    if None in (T_h_in_K, T_h_out_K, T_c_in_K, T_c_out_K):
        raise ValueError("Insufficient temperature/flow data to determine all four terminal temperatures.")

    dT1_cf = float(T_h_in_K) - float(T_c_out_K)
    dT2_cf = float(T_h_out_K) - float(T_c_in_K)
    counterflow_feasible = (dT1_cf > 0.0) and (dT2_cf > 0.0)
    lmtd_cf = _compute_lmtd(dT1_cf, dT2_cf)

    dT1_cc = float(T_h_in_K) - float(T_c_in_K)
    dT2_cc = float(T_h_out_K) - float(T_c_out_K)
    cocurrent_feasible = (float(T_h_in_K) > float(T_c_in_K)) and (float(T_h_out_K) > float(T_c_out_K))
    lmtd_cc = _compute_lmtd(dT1_cc, dT2_cc)

    flow_norm = (flow or "counterflow").lower().strip()
    active_lmtd = lmtd_cc if flow_norm in ("cocurrent", "co-current", "parallel") else lmtd_cf

    area_m2: Optional[float] = None
    area_cocurrent_m2: Optional[float] = None
    if Q_dot_W is not None and U_Wm2K is not None and U_Wm2K > 0 and F > 0:
        if active_lmtd is not None and active_lmtd > 0:
            area_m2 = Q_dot_W / (U_Wm2K * F * active_lmtd)
        if lmtd_cc is not None and lmtd_cc > 0:
            area_cocurrent_m2 = Q_dot_W / (U_Wm2K * F * lmtd_cc)

    # Energy balance residual if both sides are known
    energy_residual = 0.0
    if None not in (m_h, Cp_h_JkgK, m_c, Cp_c_JkgK):
        q_h = float(m_h) * float(Cp_h_JkgK) * (float(T_h_in_K) - float(T_h_out_K))
        q_c = float(m_c) * float(Cp_c_JkgK) * (float(T_c_out_K) - float(T_c_in_K))
        energy_residual = abs(q_h - q_c) / max(abs(q_h), abs(q_c), 1e-9)

    return {
        "Q_dot_W": Q_dot_W,
        "Q_dot_kW": (Q_dot_W / 1000.0) if Q_dot_W is not None else None,
        "m_h": m_h,
        "m_c": m_c,
        "T_h_in_K": T_h_in_K,
        "T_h_out_K": T_h_out_K,
        "T_c_in_K": T_c_in_K,
        "T_c_out_K": T_c_out_K,
        "dT1_counterflow_K": dT1_cf,
        "dT2_counterflow_K": dT2_cf,
        "LMTD_counterflow_K": lmtd_cf,
        "counterflow_feasible": counterflow_feasible,
        "dT1_cocurrent_K": dT1_cc,
        "dT2_cocurrent_K": dT2_cc,
        "LMTD_cocurrent_K": lmtd_cc,
        "cocurrent_feasible": cocurrent_feasible,
        "LMTD_K": active_lmtd,
        "A_m2": area_m2,
        "A_cocurrent_m2": area_cocurrent_m2,
        "energy_balance_residual": energy_residual,
    }


def solve_vle_margules_flash(
    z1: float,
    P_total: float,
    P1_sat: float,
    P2_sat: float,
    A12: float,
    A21: Optional[float] = None,
) -> Dict[str, Any]:
    """Solve isothermal binary VLE flash using Modified Raoult's Law + 1- or 2-suffix Margules."""
    if not (0.0 <= z1 <= 1.0):
        raise ValueError(f"Feed mole fraction z1={z1} must be in [0, 1].")
    if P_total <= 0 or P1_sat <= 0 or P2_sat <= 0:
        raise ValueError("Pressures P_total, P1_sat, P2_sat must be strictly positive.")

    a21 = float(A12 if A21 is None else A21)
    a12 = float(A12)

    def _gammas(x1: float) -> tuple[float, float]:
        x2 = 1.0 - x1
        g1 = math.exp((x2 ** 2) * (a12 + 2.0 * (a21 - a12) * x1))
        g2 = math.exp((x1 ** 2) * (a21 + 2.0 * (a12 - a21) * x2))
        return g1, g2

    def _p_residual(x1: float) -> float:
        g1, g2 = _gammas(x1)
        return x1 * g1 * P1_sat + (1.0 - x1) * g2 * P2_sat - P_total

    # Scan [0, 1] on a fine grid to bracket all roots (handles non-ideal azeotropes cleanly)
    n_grid = 200
    grid = [i / n_grid for i in range(n_grid + 1)]
    vals = [_p_residual(x) for x in grid]

    roots: List[float] = []
    for i in range(n_grid):
        v0, v1 = vals[i], vals[i + 1]
        if abs(v0) < 1e-12:
            roots.append(grid[i])
        elif v0 * v1 < 0.0:
            r = float(opt.brentq(_p_residual, grid[i], grid[i + 1], xtol=1e-12, rtol=1e-12))
            roots.append(r)
    if abs(vals[-1]) < 1e-12:
        roots.append(1.0)

    if not roots:
        # Pure single-phase outside the entire P-x envelope
        p_max = max(v + P_total for v in vals)
        phase_status = "subcooled_liquid" if P_total > p_max else "superheated_vapor"
        vf = 0.0 if phase_status == "subcooled_liquid" else 1.0
        g1, g2 = _gammas(z1)
        return {
            "x1": z1,
            "x2": 1.0 - z1,
            "y1": z1,
            "y2": 1.0 - z1,
            "gamma1": g1,
            "gamma2": g2,
            "V_over_F": vf,
            "L_over_F": 1.0 - vf,
            "two_phase": False,
            "single_phase": True,
            "phase_status": phase_status,
            "mass_balance_residual": 0.0,
            "P_calc": z1 * g1 * P1_sat + (1.0 - z1) * g2 * P2_sat,
        }

    # Select the root that brackets z1 between x1 and y1 (if multiple due to azeotrope)
    chosen_x1 = roots[0]
    for r in roots:
        g1, _ = _gammas(r)
        y1_cand = r * g1 * P1_sat / P_total
        if min(r, y1_cand) - 1e-9 <= z1 <= max(r, y1_cand) + 1e-9:
            chosen_x1 = r
            break

    gamma1, gamma2 = _gammas(chosen_x1)
    y1 = chosen_x1 * gamma1 * P1_sat / P_total
    y2 = (1.0 - chosen_x1) * gamma2 * P2_sat / P_total
    P_calc = chosen_x1 * gamma1 * P1_sat + (1.0 - chosen_x1) * gamma2 * P2_sat

    denom = y1 - chosen_x1
    if abs(denom) < 1e-12:
        raw_vf = 0.0
    else:
        raw_vf = (z1 - chosen_x1) / denom

    two_phase = -1e-9 <= raw_vf <= 1.0 + 1e-9
    if two_phase:
        vf = max(0.0, min(1.0, raw_vf))
        phase_status = "two_phase"
        single_phase = False
        mass_balance_residual = abs(z1 - ((1.0 - vf) * chosen_x1 + vf * y1))
    else:
        single_phase = True
        vf = 0.0 if raw_vf < 0.0 else 1.0
        phase_status = "subcooled_liquid" if raw_vf < 0.0 else "superheated_vapor"
        mass_balance_residual = 0.0

    return {
        "x1": chosen_x1,
        "x2": 1.0 - chosen_x1,
        "y1": y1,
        "y2": y2,
        "gamma1": gamma1,
        "gamma2": gamma2,
        "V_over_F": vf,
        "L_over_F": 1.0 - vf,
        "two_phase": two_phase,
        "single_phase": single_phase,
        "phase_status": phase_status,
        "mass_balance_residual": mass_balance_residual,
        "P_calc": P_calc,
    }


# ─── Safe General SymPy Step Executor ────────────────────────────────────────

_UNSAFE_EXPR_PATTERN = re.compile(
    r"(__|\bimport\b|\beval\b|\bexec\b|\bopen\b|\blambda\b|\bgetattr\b|"
    r"\bsetattr\b|\bdelattr\b|\bglobals\b|\blocals\b|\bbuiltins\b|\bos\.|\bsys\.|;)",
    re.IGNORECASE,
)

_SAFE_SYMPY_FUNCTIONS: Dict[str, Any] = {
    "pi": sp.pi,
    "E": sp.E,
    "e": sp.E,
    "sqrt": sp.sqrt,
    "log": sp.log,
    "ln": sp.log,
    "log10": lambda x: sp.log(x, 10),
    "exp": sp.exp,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "abs": sp.Abs,
    "Abs": sp.Abs,
    "Min": sp.Min,
    "Max": sp.Max,
}

_TRANSFORMATIONS = standard_transformations + (convert_xor,)


def _sanitize_expr_str(expr_str: str) -> str:
    if not isinstance(expr_str, str) or not expr_str.strip():
        raise ValueError("Empty expression")
    if _UNSAFE_EXPR_PATTERN.search(expr_str):
        raise ValueError(f"Rejected unsafe expression: {expr_str!r}")
    cleaned = (
        expr_str.strip()
        .replace("^", "**")
        .replace("×", "*")
        .replace("·", "*")
        .replace("÷", "/")
        .replace("−", "-")
    )
    return cleaned


def _safe_parse_sympy(expr_str: str, local_dict: Dict[str, Any]) -> sp.Expr:
    cleaned = _sanitize_expr_str(expr_str)
    # global_dict={"Symbol": sp.Symbol, "Integer": sp.Integer, "Float": sp.Float, "Rational": sp.Rational}
    # prevents any __builtins__ access while letting parse_expr construct numbers/symbols safely.
    safe_globals = {
        "__builtins__": {},
        "Symbol": sp.Symbol,
        "Integer": sp.Integer,
        "Float": sp.Float,
        "Rational": sp.Rational,
    }
    return parse_expr(
        cleaned,
        local_dict=local_dict,
        global_dict=safe_globals,
        transformations=_TRANSFORMATIONS,
        evaluate=True,
    )


def _eval_scalar_expr(raw_val: Any, local_dict: Dict[str, Any]) -> float:
    """Safely evaluate a numeric literal or symbolic expression referencing known variables."""
    if isinstance(raw_val, (int, float)) and not isinstance(raw_val, bool):
        val = float(raw_val)
    elif isinstance(raw_val, str):
        parsed = _safe_parse_sympy(raw_val, local_dict)
        if parsed.free_symbols:
            raise ValueError(f"Unbound symbols in scalar expression: {sorted(str(s) for s in parsed.free_symbols)}")
        val = float(parsed.evalf())
    else:
        raise ValueError(f"Invalid scalar value: {raw_val!r}")
    if not math.isfinite(val):
        raise ValueError(f"Non-finite scalar value: {raw_val!r}")
    return val


def execute_sympy_steps(
    variables: List[Dict[str, Any]],
    steps: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Convert raw variables to SI and safely evaluate/solve sequential SymPy steps."""
    si_variables: Dict[str, Dict[str, Any]] = {}
    numeric_ns: Dict[str, float] = {
        "g": G_STD,
        "R": R_GAS,
    }
    computed: Dict[str, float] = {}
    step_results: List[Dict[str, Any]] = []
    errors: List[str] = []

    # 1. Deterministic SI conversion of all extracted variables
    for idx, var in enumerate(variables or []):
        if not isinstance(var, dict):
            continue
        raw_sym = str(var.get("symbol") or f"var_{idx + 1}")
        sym = normalize_symbol(raw_sym)
        try:
            raw_val = float(var["value"])
        except (KeyError, TypeError, ValueError):
            errors.append(f"Variable '{raw_sym}' has non-numeric value: {var.get('value')!r}")
            continue
        raw_unit = str(var.get("unit") or "")
        is_delta = bool(var.get("is_delta", False))
        si_val, si_unit = convert_to_si(raw_val, raw_unit, is_delta=is_delta)
        si_variables[sym] = {
            "raw_symbol": raw_sym,
            "raw_value": raw_val,
            "raw_unit": raw_unit,
            "si_value": si_val,
            "si_unit": si_unit,
        }
        numeric_ns[sym] = si_val

    # 2. Execute each symbolic expression or equation step
    for idx, step in enumerate(steps or []):
        if not isinstance(step, dict):
            continue

        label = str(step.get("label") or step.get("symbol") or f"Step {idx + 1}")
        unit = str(step.get("unit") or "")

        # Build whitelisted local_dict with current numeric values
        local_dict: Dict[str, Any] = dict(_SAFE_SYMPY_FUNCTIONS)
        for k, v in numeric_ns.items():
            local_dict[k] = sp.Float(v)

        kind = str(step.get("kind") or "").lower().strip()

        # Case 1: Coupled nonlinear/linear system {kind: "system", equations, solve_for, guesses?, units?, label?}
        if kind == "system":
            raw_eqs = step.get("equations")
            raw_solve_for = step.get("solve_for")
            units_map = step.get("units") if isinstance(step.get("units"), dict) else {}
            try:
                if not isinstance(raw_eqs, list) or not raw_eqs:
                    raise ValueError("System step requires a non-empty 'equations' list")
                if not isinstance(raw_solve_for, list) or not raw_solve_for:
                    raise ValueError("System step requires a non-empty 'solve_for' list")

                solve_syms = [normalize_symbol(str(s)) for s in raw_solve_for]
                unknown_syms = [sp.Symbol(s, real=True) for s in solve_syms]
                unknown_set = set(unknown_syms)

                sys_local = dict(local_dict)
                for s_name, s_obj in zip(solve_syms, unknown_syms):
                    sys_local[s_name] = s_obj

                residual_exprs: List[sp.Expr] = []
                eq_strs: List[str] = []
                for eq in raw_eqs:
                    if not isinstance(eq, dict) or not eq.get("lhs") or eq.get("rhs") is None:
                        raise ValueError("Each system equation must have 'lhs' and 'rhs'")
                    lhs_expr = _safe_parse_sympy(str(eq["lhs"]), sys_local)
                    rhs_expr = _safe_parse_sympy(str(eq["rhs"]), sys_local)
                    res_expr = lhs_expr - rhs_expr
                    extra_syms = res_expr.free_symbols - unknown_set
                    if extra_syms:
                        raise ValueError(f"Unbound symbols in system equation: {sorted(str(s) for s in extra_syms)}")
                    residual_exprs.append(res_expr)
                    eq_strs.append(f"{eq['lhs']} = {eq['rhs']}")

                raw_guesses = step.get("guesses")
                if isinstance(raw_guesses, (list, tuple)) and len(raw_guesses) == len(solve_syms):
                    x0 = np.array([_eval_scalar_expr(g, local_dict) for g in raw_guesses], dtype=float)
                else:
                    x0 = np.ones(len(solve_syms), dtype=float)

                fn = sp.lambdify(unknown_syms, residual_exprs, modules="numpy")

                def _sys_residual(vec: np.ndarray) -> np.ndarray:
                    out = fn(*[float(v) for v in vec])
                    return np.asarray(out, dtype=float).ravel()

                sol = opt.root(_sys_residual, x0, method="hybr")
                max_res = (
                    float(np.max(np.abs(_sys_residual(sol.x))))
                    if np.all(np.isfinite(sol.x))
                    else float("inf")
                )
                if (not sol.success) or (not np.all(np.isfinite(sol.x))) or max_res >= 1e-5:
                    sol_lm = opt.root(_sys_residual, x0, method="lm")
                    lm_res = (
                        float(np.max(np.abs(_sys_residual(sol_lm.x))))
                        if np.all(np.isfinite(sol_lm.x))
                        else float("inf")
                    )
                    if lm_res < max_res:
                        sol = sol_lm
                        max_res = lm_res

                if not np.all(np.isfinite(sol.x)) or max_res >= 1e-5:
                    raise ValueError(f"Coupled system did not converge (max residual={max_res:.3e})")

                joined_eqs = "; ".join(eq_strs)
                for raw_s, sym_name, val_raw in zip(raw_solve_for, solve_syms, sol.x):
                    val = float(val_raw)
                    numeric_ns[sym_name] = val
                    computed[sym_name] = val
                    u_str = str(units_map.get(str(raw_s)) or units_map.get(sym_name) or "")
                    step_results.append({
                        "symbol": sym_name,
                        "label": f"{label} ({sym_name})",
                        "expr": joined_eqs,
                        "value": val,
                        "unit": u_str,
                        "residual": max_res,
                        "status": "verified",
                    })
            except Exception as exc:
                errors.append(f"Step '{label}' (system) failed: {exc}")
                step_results.append({
                    "symbol": ",".join(str(s) for s in (raw_solve_for or [])) or f"system_{idx + 1}",
                    "label": label,
                    "expr": str(raw_eqs),
                    "value": None,
                    "unit": unit,
                    "status": f"error: {exc}",
                })
            continue

        # Case 2: Definite integral {kind: "integral", symbol, integrand, var, lower, upper, unit?, label?}
        if kind == "integral":
            target_sym = normalize_symbol(str(step.get("symbol") or f"step_{idx + 1}"))
            try:
                raw_integrand = step.get("integrand")
                if not raw_integrand:
                    raise ValueError("Integral step requires 'integrand'")
                var_name = normalize_symbol(str(step.get("var") or "x"))
                lower_val = _eval_scalar_expr(step.get("lower"), local_dict)
                upper_val = _eval_scalar_expr(step.get("upper"), local_dict)

                var_sym = sp.Symbol(var_name, real=True)
                integ_local = dict(local_dict)
                integ_local[var_name] = var_sym

                integrand_expr = _safe_parse_sympy(str(raw_integrand), integ_local)
                extra_syms = integrand_expr.free_symbols - {var_sym}
                if extra_syms:
                    raise ValueError(f"Unbound symbols in integrand: {sorted(str(s) for s in extra_syms)}")

                fn = sp.lambdify(var_sym, integrand_expr, modules=["numpy", "math"])
                val, _abs_err = integrate.quad(lambda x: float(fn(x)), lower_val, upper_val, limit=200)
                val = float(val)
                if not math.isfinite(val):
                    raise ValueError("Non-finite integral result")

                numeric_ns[target_sym] = val
                computed[target_sym] = val
                step_results.append({
                    "symbol": target_sym,
                    "label": label,
                    "expr": f"integral({raw_integrand}, {var_name}={lower_val}..{upper_val})",
                    "value": val,
                    "unit": unit,
                    "status": "verified",
                })
            except Exception as exc:
                errors.append(f"Step '{label}' (integral {target_sym}) failed: {exc}")
                step_results.append({
                    "symbol": target_sym,
                    "label": label,
                    "expr": str(step.get("integrand") or ""),
                    "value": None,
                    "unit": unit,
                    "status": f"error: {exc}",
                })
            continue

        # Case 3: Coupled ODE IVP {kind: "ode", indep, dep, rhs, span, y0, outputs?, units?, label?}
        if kind == "ode":
            dep_raw = step.get("dep")
            rhs_raw = step.get("rhs")
            units_map = step.get("units") if isinstance(step.get("units"), dict) else {}
            try:
                if not isinstance(dep_raw, list) or not dep_raw:
                    raise ValueError("ODE step requires a non-empty 'dep' list")
                if not isinstance(rhs_raw, list) or len(rhs_raw) != len(dep_raw):
                    raise ValueError("ODE step requires 'rhs' list matching length of 'dep'")
                span_raw = step.get("span")
                if not isinstance(span_raw, (list, tuple)) or len(span_raw) != 2:
                    raise ValueError("ODE step requires 'span' with [t0, tf]")
                y0_raw = step.get("y0")
                if not isinstance(y0_raw, (list, tuple)) or len(y0_raw) != len(dep_raw):
                    raise ValueError("ODE step requires 'y0' matching length of 'dep'")

                t0 = _eval_scalar_expr(span_raw[0], local_dict)
                tf = _eval_scalar_expr(span_raw[1], local_dict)
                if t0 == tf:
                    raise ValueError("ODE 'span' start and end must be distinct")
                y0_vals = [_eval_scalar_expr(v, local_dict) for v in y0_raw]

                indep_name = normalize_symbol(str(step.get("indep") or "t"))
                indep_sym = sp.Symbol(indep_name, real=True)
                dep_names = [normalize_symbol(str(d)) for d in dep_raw]
                dep_syms = [sp.Symbol(d, real=True) for d in dep_names]
                allowed_syms = {indep_sym} | set(dep_syms)

                ode_local = dict(local_dict)
                ode_local[indep_name] = indep_sym
                for d_name, d_sym in zip(dep_names, dep_syms):
                    ode_local[d_name] = d_sym

                rhs_exprs: List[sp.Expr] = []
                for expr_s in rhs_raw:
                    parsed_rhs = _safe_parse_sympy(str(expr_s), ode_local)
                    extra_syms = parsed_rhs.free_symbols - allowed_syms
                    if extra_syms:
                        raise ValueError(f"Unbound symbols in ODE rhs: {sorted(str(s) for s in extra_syms)}")
                    rhs_exprs.append(parsed_rhs)

                rhs_fn = sp.lambdify([indep_sym, *dep_syms], rhs_exprs, modules="numpy")

                def _ode_rhs(t_val: float, y_vec: np.ndarray) -> np.ndarray:
                    out = rhs_fn(float(t_val), *[float(v) for v in y_vec])
                    return np.asarray(out, dtype=float).ravel()

                max_step = max(abs(tf - t0) / 50.0, 1e-6)
                sol = integrate.solve_ivp(
                    _ode_rhs,
                    (t0, tf),
                    y0_vals,
                    method="RK45",
                    rtol=1e-7,
                    atol=1e-9,
                    max_step=max_step,
                )
                if (not sol.success) or sol.y.shape[1] == 0 or (not np.all(np.isfinite(sol.y[:, -1]))):
                    raise ValueError(f"ODE integration failed: {sol.message}")

                outputs_raw = step.get("outputs")
                if isinstance(outputs_raw, list) and len(outputs_raw) == len(dep_names):
                    out_syms = [normalize_symbol(str(o)) for o in outputs_raw]
                else:
                    out_syms = [f"{d}_final" for d in dep_names]

                for idx_d, (d_name, out_sym) in enumerate(zip(dep_names, out_syms)):
                    val = float(sol.y[idx_d, -1])
                    numeric_ns[out_sym] = val
                    computed[out_sym] = val
                    raw_out_key = str(outputs_raw[idx_d]) if isinstance(outputs_raw, list) and idx_d < len(outputs_raw) else out_sym
                    u_str = str(units_map.get(raw_out_key) or units_map.get(out_sym) or "")
                    step_results.append({
                        "symbol": out_sym,
                        "label": f"{label} ({out_sym})",
                        "expr": f"d{d_name}/d{indep_name} = {rhs_raw[idx_d]} on [{t0}, {tf}]",
                        "value": val,
                        "unit": u_str,
                        "status": "verified",
                    })
            except Exception as exc:
                errors.append(f"Step '{label}' (ode) failed: {exc}")
                step_results.append({
                    "symbol": ",".join(str(d) for d in (dep_raw or [])) or f"ode_{idx + 1}",
                    "label": label,
                    "expr": str(rhs_raw),
                    "value": None,
                    "unit": unit,
                    "status": f"error: {exc}",
                })
            continue

        # Case A: Equation solving {lhs, rhs, solve_for, guess?, bracket?}
        if step.get("lhs") and step.get("rhs") and step.get("solve_for"):
            solve_sym = normalize_symbol(str(step["solve_for"]))
            unknown = sp.Symbol(solve_sym, real=True)
            local_dict[solve_sym] = unknown
            try:
                lhs_expr = _safe_parse_sympy(str(step["lhs"]), local_dict)
                rhs_expr = _safe_parse_sympy(str(step["rhs"]), local_dict)
                residual_expr = lhs_expr - rhs_expr

                extra_syms = residual_expr.free_symbols - {unknown}
                if extra_syms:
                    raise ValueError(f"Unbound symbols in equation: {sorted(str(s) for s in extra_syms)}")

                bracket = step.get("bracket")
                if isinstance(bracket, (list, tuple)) and len(bracket) == 2:
                    a, b = float(bracket[0]), float(bracket[1])
                    fn = sp.lambdify(unknown, residual_expr, modules=["math"])
                    val = float(opt.brentq(lambda x: float(fn(x)), a, b, xtol=1e-12))
                else:
                    guess = float(step.get("guess", 0.02))
                    sol = sp.nsolve(residual_expr, unknown, guess)
                    val = float(sol.evalf())

                if not math.isfinite(val):
                    raise ValueError("Non-finite root")

                numeric_ns[solve_sym] = val
                computed[solve_sym] = val
                step_results.append({
                    "symbol": solve_sym,
                    "label": label,
                    "expr": f"{step['lhs']} = {step['rhs']}",
                    "value": val,
                    "unit": unit,
                    "status": "verified",
                })
            except Exception as exc:
                errors.append(f"Step '{label}' (solve {solve_sym}) failed: {exc}")
                step_results.append({
                    "symbol": solve_sym,
                    "label": label,
                    "expr": f"{step.get('lhs')} = {step.get('rhs')}",
                    "value": None,
                    "unit": unit,
                    "status": f"error: {exc}",
                })
            continue

        # Case B: Direct algebraic expression {symbol, expr, label?, unit?}
        raw_expr = step.get("expr")
        if not raw_expr:
            continue
        target_sym = normalize_symbol(str(step.get("symbol") or f"step_{idx + 1}"))
        try:
            parsed = _safe_parse_sympy(str(raw_expr), local_dict)
            if parsed.free_symbols:
                raise ValueError(f"Unbound symbols: {sorted(str(s) for s in parsed.free_symbols)}")
            val = float(parsed.evalf())
            if not math.isfinite(val):
                raise ValueError("Non-finite result")
            numeric_ns[target_sym] = val
            computed[target_sym] = val
            step_results.append({
                "symbol": target_sym,
                "label": label,
                "expr": str(raw_expr),
                "value": val,
                "unit": unit,
                "status": "verified",
            })
        except Exception as exc:
            errors.append(f"Step '{label}' ({target_sym}) failed: {exc}")
            step_results.append({
                "symbol": target_sym,
                "label": label,
                "expr": str(raw_expr),
                "value": None,
                "unit": unit,
                "status": f"error: {exc}",
            })

    verified = len(computed) > 0 and len(errors) == 0
    return {
        "si_variables": si_variables,
        "computed": computed,
        "step_results": step_results,
        "verified": verified,
        "errors": errors,
    }
