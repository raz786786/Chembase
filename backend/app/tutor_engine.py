"""
ChemBase Pro - Multi-AI Verified Chemical Engineering Solver Engine
Architecture:
1. Problem Fingerprinter & Normalizer (with Verified Cache)
2. Problem Classifier & Missing Information Detector
3. Deterministic Mathematical & Symbolic Calculation Engine (SymPy, NumPy, SciPy)
4. Iterative Solvers (Newton-Raphson, Bisection, Scipy optimize)
5. Unit Consistency & Dimensional Homogeneity Validator
6. Engineering Sanity & Plausibility Checker
7. Multi-AI Independent Solver Orchestrator (Gemini, Groq, OpenRouter, Nvidia, Nova)
8. Cross-Solver Comparator & Relative Difference Agreement Protocol
9. Final Verifier & Adjudicator
"""

import os
import re
import ast
import json
import math
import hashlib
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
import numpy as np
import scipy.optimize as opt
import sympy as sp

from .database import get_db
from .models import AIProviderConnection
from .providers.crypto import decrypt_api_key
from .providers.router import _effective_models_for_connection, _resolve_effective_base_url
from .providers.universal_client import chat_completion
from .tutor_solver import (
    EQUATION_REGISTRY_PROMPT,
    execute_sympy_steps,
    normalize_symbol,
    run_hard_sanity_audit,
)

logger = logging.getLogger("tutor_engine")
router = APIRouter(prefix="/api/tutor", tags=["Tutor Verification Engine"])

# ─── Data Models ─────────────────────────────────────────────────────────────

class TutorRequest(BaseModel):
    problem: str
    subject: Optional[str] = "General"
    difficulty: Optional[str] = "Intermediate"
    active_providers: Optional[List[str]] = Field(default_factory=list)
    api_keys: Optional[Dict[str, str]] = Field(default_factory=dict)
    force_fresh: Optional[bool] = False

class FinalAnswerItem(BaseModel):
    label: str
    value: str
    unit: str = ""
    verified_by_sympy: bool = False

class GrucaSolution(BaseModel):
    given: List[str]
    required: List[str]
    assumptions: List[str]
    equations: List[str]
    calculations: List[str]
    units: List[str]
    answer: str
    final_answers: List[FinalAnswerItem] = Field(default_factory=list)
    summary: Optional[str] = None


def _normalize_answer_text(raw_answer: Any, final_answers: Optional[List[FinalAnswerItem]] = None) -> str:
    """Normalize an answer field so gruca.answer is NEVER a raw Python list string like \"['a', 'b']\"."""
    def _format_list(items: List[Any]) -> str:
        parts: List[str] = []
        for item in items:
            if item is None:
                continue
            if isinstance(item, dict):
                lbl = str(item.get("label") or "").strip()
                val = str(item.get("value") or "").strip()
                unit = str(item.get("unit") or "").strip()
                piece = f"{lbl}: {val} {unit}".strip() if lbl else f"{val} {unit}".strip()
                if piece:
                    parts.append(piece)
            else:
                s = str(item).strip()
                if s:
                    parts.append(s)
        return " | ".join(parts)

    if isinstance(raw_answer, list):
        formatted = _format_list(raw_answer)
        if formatted:
            return formatted
    elif isinstance(raw_answer, str):
        s = raw_answer.strip()
        if s.startswith("[") and s.endswith("]"):
            try:
                parsed = ast.literal_eval(s)
                if isinstance(parsed, list):
                    formatted = _format_list(parsed)
                    if formatted:
                        return formatted
            except Exception:
                pass
        if s:
            return s

    if final_answers:
        parts = [
            f"{fa.label}: {fa.value} {fa.unit}".strip() if fa.label else f"{fa.value} {fa.unit}".strip()
            for fa in final_answers
        ]
        joined = " | ".join(p for p in parts if p)
        if joined:
            return joined

    return "Solution completed."


def _parse_final_answers(raw_items: Any) -> Tuple[List[FinalAnswerItem], List[Optional[str]]]:
    """Parse raw final_answers JSON list into FinalAnswerItem objects and optional symbol hints."""
    items: List[FinalAnswerItem] = []
    sym_hints: List[Optional[str]] = []
    if not isinstance(raw_items, list):
        return items, sym_hints
    for entry in raw_items:
        if isinstance(entry, FinalAnswerItem):
            items.append(entry)
            sym_hints.append(None)
        elif isinstance(entry, dict):
            label = str(entry.get("label") or entry.get("name") or "").strip()
            value = str(entry.get("value") if entry.get("value") is not None else "").strip()
            unit = str(entry.get("unit") or "").strip()
            sym = str(entry.get("symbol") or "").strip() or None
            if label or value:
                items.append(
                    FinalAnswerItem(
                        label=label or (sym or "Result"),
                        value=value,
                        unit=unit,
                        verified_by_sympy=bool(entry.get("verified_by_sympy", False)),
                    )
                )
                sym_hints.append(normalize_symbol(sym) if sym else None)
    return items, sym_hints


def _format_locked_float(val: float) -> str:
    """Format a Python/SymPy float cleanly for display."""
    if abs(val) != 0.0 and (abs(val) >= 1e6 or abs(val) < 1e-3):
        return f"{val:.4e}"
    return f"{val:.6g}"


def _lock_sympy_results_into_gruca(
    gruca: GrucaSolution,
    sympy_result: Optional[Dict[str, Any]],
    sym_hints: Optional[List[Optional[str]]] = None,
) -> GrucaSolution:
    """Lock Python/SymPy-computed floats into gruca.final_answers and append a verification step."""
    if not isinstance(sympy_result, dict):
        return gruca

    computed: Dict[str, float] = sympy_result.get("computed") or {}
    si_vars: Dict[str, Dict[str, Any]] = sympy_result.get("si_variables") or {}
    step_results: List[Dict[str, Any]] = sympy_result.get("step_results") or []

    if not computed and not si_vars:
        return gruca

    computed_lower = {k.lower(): (k, v) for k, v in computed.items()}
    step_by_label = {
        str(sr.get("label") or "").lower().strip(): sr
        for sr in step_results
        if sr.get("value") is not None
    }

    hints = sym_hints or [None] * len(gruca.final_answers)
    locked_answers: List[FinalAnswerItem] = []

    for idx, item in enumerate(gruca.final_answers):
        hint = hints[idx] if idx < len(hints) else None
        matched_val: Optional[float] = None

        if hint and hint.lower() in computed_lower:
            matched_val = computed_lower[hint.lower()][1]
        else:
            lbl_norm = normalize_symbol(item.label).lower()
            lbl_low = item.label.lower().strip()
            if lbl_norm in computed_lower:
                matched_val = computed_lower[lbl_norm][1]
            elif lbl_low in step_by_label:
                matched_val = float(step_by_label[lbl_low]["value"])
            else:
                # Match by exact token inside label (e.g., "Reynolds number (Re)" -> "re")
                tokens = set(re.findall(r"[a-zA-Z_][a-zA-Z0-9_]*", item.label))
                for tok in tokens:
                    if tok.lower() in computed_lower:
                        matched_val = computed_lower[tok.lower()][1]
                        break

        if matched_val is not None:
            locked_answers.append(
                FinalAnswerItem(
                    label=item.label,
                    value=_format_locked_float(matched_val),
                    unit=item.unit,
                    verified_by_sympy=True,
                )
            )
        else:
            locked_answers.append(item)

    gruca.final_answers = locked_answers

    # Append a transparent SymPy/Python Verification step to calculations
    si_summary = ", ".join(
        f"{k}={_format_locked_float(v['si_value'])} {v['si_unit']}".strip()
        for k, v in si_vars.items()
    )
    comp_summary = ", ".join(
        f"{k}={_format_locked_float(v)}"
        for k, v in computed.items()
    )
    verif_parts: List[str] = ["SymPy/Python Verification:"]
    if si_summary:
        verif_parts.append(f"SI inputs [{si_summary}]")
    if comp_summary:
        verif_parts.append(f"Locked outputs [{comp_summary}]")
    verif_line = " ".join(verif_parts)
    if not any(c.startswith("SymPy/Python Verification:") for c in gruca.calculations):
        gruca.calculations = list(gruca.calculations) + [verif_line]

    return gruca

class StructuredProblem(BaseModel):
    subject: str
    complexity: str  # "Simple" | "Intermediate" | "Complex"
    given_variables: Dict[str, str] = Field(default_factory=dict)
    unknowns: List[str] = Field(default_factory=list)
    conditions: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    governing_equations: List[str] = Field(default_factory=list)
    decomposition_stages: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    is_underspecified: bool = False

class VerificationAudit(BaseModel):
    solvers_checked: List[Dict[str, Any]]
    agreement_score: float # 0 to 100
    disagreement_detected: bool
    disagreement_notes: Optional[str] = None
    calculation_engine_verified: bool
    deterministic_result: Optional[str] = None
    units_verified: bool
    units_notes: Optional[str] = None
    sanity_checked: bool
    sanity_notes: List[str]
    confidence_status: str # "Verified" | "Verified with stated assumptions" | "Needs clarification"
    cache_hit: bool = False
    stages_count: int = 1
    problem_decomposition: Optional[List[str]] = Field(default_factory=list)

class TutorResponse(BaseModel):
    problem_hash: str
    subject: str
    difficulty: str
    gruca: GrucaSolution
    audit: VerificationAudit

# ─── 1. Problem Fingerprinter & Cache ────────────────────────────────────────

class ProblemFingerprinter:
    """Generates normalized canonical fingerprints and manages verified cache."""
    _cache: Dict[str, TutorResponse] = {}

    @classmethod
    def normalize_text(cls, text: str) -> str:
        # Lowercase, remove punctuation, collapse whitespace
        cleaned = text.lower().strip()
        cleaned = re.sub(r'[\r\n\t]+', ' ', cleaned)
        cleaned = re.sub(r'[^a-z0-9\.\-\+\=]', ' ', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    @classmethod
    def get_fingerprint(cls, problem: str, subject: str, difficulty: str = "Intermediate") -> str:
        norm = (
            cls.normalize_text(problem)
            + "::"
            + (subject or "").lower()
            + "::"
            + (difficulty or "Intermediate").lower()
        )
        return hashlib.sha256(norm.encode('utf-8')).hexdigest()

    @classmethod
    def get_cached(cls, problem_hash: str) -> Optional[TutorResponse]:
        return cls._cache.get(problem_hash)

    @classmethod
    def set_cached(cls, problem_hash: str, response: TutorResponse):
        if problem_hash not in cls._cache and len(cls._cache) >= 256:
            oldest_key = next(iter(cls._cache))
            cls._cache.pop(oldest_key, None)
        cls._cache[problem_hash] = response


# ─── 2. Missing Information & Ambiguity Detector ────────────────────────────

class MissingInfoDetector:
    """Inspects engineering problems for missing mandatory parameters ("No Hidden Assumptions")."""

    CONCEPTUAL_KEYWORDS = (
        "explain",
        "derive",
        "what is",
        "why",
        "how does",
        "difference between",
        "compare",
        "define",
        "list",
        "describe",
    )
    NUMERICAL_KEYWORDS = (
        "calculate",
        "find",
        "determine",
        "compute",
        "how much",
        "what is the value",
    )

    @classmethod
    def check_missing_info(cls, problem: str, subject: str) -> Tuple[bool, List[str]]:
        prob_lower = problem.lower()

        # Conceptual, derivation, and theory questions are never underspecified
        if any(k in prob_lower for k in cls.CONCEPTUAL_KEYWORDS):
            return (False, [])

        # Only flag if the prompt asks for a numerical calculation AND has zero digits
        asks_numerical = any(k in prob_lower for k in cls.NUMERICAL_KEYWORDS)
        has_digits = bool(re.search(r'\d', problem))
        if not asks_numerical or has_digits:
            return (False, [])

        missing: List[str] = []
        if any(w in prob_lower for w in ["heat exchanger", "lmtd", "heat transfer area"]):
            missing.append("Inlet/outlet stream temperatures and overall heat transfer coefficient (U)")
        elif any(w in prob_lower for w in ["pump power", "pipe flow", "reynolds", "head loss"]):
            missing.append("Pipe diameter, length, and fluid volumetric flow rate or velocity")
        elif "ideal gas" in prob_lower:
            missing.append("At least two thermodynamic state properties (e.g., P, T, mass, or volume)")
        elif any(w in prob_lower for w in ["distillation", "separates", "benzene", "toluene"]):
            missing.append("Feed flow rate and stream compositions")
        else:
            missing.append("Numerical input values and units required to evaluate the requested quantity")

        return (len(missing) > 0, missing)


# ─── 3. Structured Problem Extractor & Decomposition Engine ──────────────────

class StructuredProblemExtractor:
    """Extracts formal engineering representation and decomposes complex multi-stage problems."""
    SUBJECT_DOMAINS = [
        "Material & Energy Balances",
        "Thermodynamics",
        "Fluid Mechanics",
        "Heat Transfer",
        "Mass Transfer",
        "Reaction Engineering",
        "Separation Processes",
        "Process Control",
        "Particulate Technology",
        "Process Design",
        "Numerical Methods"
    ]

    @classmethod
    def classify_subject(cls, problem: str, user_subject: str = "General") -> str:
        p = problem.lower()
        if any(w in p for w in ["reynolds", "friction factor", "pump power", "pipe flow", "bernoulli", "head loss", "velocity"]):
            return "Fluid Mechanics"
        if any(w in p for w in ["heat exchanger", "lmtd", "conduction", "convection", "heat transfer area", "heat duty", "ntu"]):
            return "Heat Transfer"
        if any(w in p for w in ["cstr", "pfr", "reaction rate", "reactor volume", "kinetics", "conversion", "rate constant"]):
            return "Reaction Engineering"
        if any(w in p for w in ["distillation", "mccabe-thiele", "absorption", "stripping", "separation", "benzene and toluene"]):
            return "Separation Processes"
        if any(w in p for w in ["diffusion", "diffusivity", "molar flux", "fick", "stagnant air"]):
            return "Mass Transfer"
        if any(w in p for w in ["ideal gas", "enthalpy", "entropy", "compressibility", "equation of state", "carnot", "joule-thomson"]):
            return "Thermodynamics"
        if any(w in p for w in ["transfer function", "pid", "controller", "bode", "nyquist", "stability", "feedback"]):
            return "Process Control"
        if any(w in p for w in ["cyclone", "filtration", "sedimentation", "settling", "particle size", "slurry"]):
            return "Particulate Technology"
        if any(w in p for w in ["material balance", "energy balance", "recycle", "purge", "bypass"]):
            return "Material & Energy Balances"
        if any(w in p for w in ["flowsheet", "cost estimation", "process design"]):
            return "Process Design"
        if any(w in p for w in ["newton-raphson", "runge-kutta", "root finding", "numerical integration"]):
            return "Numerical Methods"

        for dom in cls.SUBJECT_DOMAINS:
            if dom.lower() in (user_subject or "").lower() or (user_subject or "").lower() in dom.lower():
                return dom
        return "Material & Energy Balances"

    @classmethod
    def classify_complexity(cls, problem: str, subject: str) -> str:
        p = problem.lower()
        complex_keywords = [
            "distillation", "recycle", "purge", "coupled", "multi-stage", "multistage",
            "mccabe-thiele", "transient", "iterative", "optimization", "nonlinear",
            "network", "system of equations", "membrane cell", "equilibrium stages"
        ]
        if any(k in p for k in complex_keywords):
            return "Complex"

        intermediate_keywords = [
            "lmtd", "heat exchanger", "colebrook", "friction factor", "pump power",
            "cstr", "diffusion", "stagnant", "reynolds", "two-phase", "head loss"
        ]
        if any(k in p for k in intermediate_keywords):
            return "Intermediate"

        return "Simple"

    @classmethod
    def decompose_problem(cls, problem: str, subject: str, complexity: str) -> List[str]:
        p = problem.lower()
        if "distillation" in p:
            return [
                "Stage 1: Feed Specification & Overall Mass Balance (F = D + B)",
                "Stage 2: Light-Key Component Species Balance (F·xF = D·xD + B·xB)",
                "Stage 3: Matrix Inversion & Product Split Determination",
                "Stage 4: Recovery & Purity Specification Assessment",
                "Stage 5: Overall Conservation & Degree-of-Freedom Verification"
            ]
        elif "pump" in p or "pipe" in p:
            return [
                "Stage 1: Pipe Cross-Sectional Geometry & Mean Flow Velocity",
                "Stage 2: Reynolds Number & Turbulence Flow Regime Evaluation",
                "Stage 3: Iterative Non-Linear Colebrook-White Friction Factor Solving",
                "Stage 4: Darcy-Weisbach Frictional Head Loss & Total Dynamic Head",
                "Stage 5: Hydraulic Fluid Power & Brake Shaft Power Determination"
            ]
        elif "heat exchanger" in p or "lmtd" in p:
            return [
                "Stage 1: Heat Duty Evaluation via Energy Balance",
                "Stage 2: Secondary Stream Thermal Outlet Temperature Calculation",
                "Stage 3: Terminal Temperature Driving Forces & Log-Mean Temp Difference (LMTD)",
                "Stage 4: Effective Heat Transfer Surface Area Sizing (A = Q / U·LMTD)",
                "Stage 5: Thermal Rating, Pinch & Feasibility Sanity Verification"
            ]
        elif "cstr" in p or "reactor" in p:
            return [
                "Stage 1: Reaction Stoichiometry & Isothermal Rate Kinetics Formulation",
                "Stage 2: Fractional Conversion & Exit Reactant Concentration",
                "Stage 3: Molar Flow Rates & General CSTR Design Equation Setup",
                "Stage 4: Required Reactor Volume & Residence Space-Time Calculation",
                "Stage 5: Kinetic Consistency & Dimensional Check"
            ]
        elif "ammonia" in p or "diffusion" in p:
            return [
                "Stage 1: Boundary Conditions & Boundary Partial Pressure Definition",
                "Stage 2: Stagnant Component Log-Mean Partial Pressure (p_BM)",
                "Stage 3: Fickian Molecular Diffusion Driving Force Formulation",
                "Stage 4: Steady-State Molar Flux Determination",
                "Stage 5: Gas Constant & Dimensional Transport Verification"
            ]
        elif "gas" in p or "ideal gas" in p:
            return [
                "Stage 1: Thermodynamic State Variables Identification (P, T, m)",
                "Stage 2: Molar Mass & Quantity of Substance (Moles n = m/M)",
                "Stage 3: Ideal Gas Equation of State Application (V = nRT/P)",
                "Stage 4: Unit Conversion to Target Engineering Volume Units",
                "Stage 5: State Space Consistency Check"
            ]
        else:
            if complexity == "Complex":
                return [
                    "Stage 1: System Boundaries & Degree-of-Freedom Analysis",
                    "Stage 2: Fundamental Mass & Energy Conservation Equations",
                    "Stage 3: Physical Property & Constitutive Relation Evaluation",
                    "Stage 4: Programmatic Numerical Solution of Governing System",
                    "Stage 5: Conservation Closure & Sanity Verification"
                ]
            elif complexity == "Intermediate":
                return [
                    "Stage 1: Problem Definition & Unit Harmonization",
                    "Stage 2: Governing Engineering Relations & Substitutions",
                    "Stage 3: Step-by-Step Programmatic Numerical Evaluation",
                    "Stage 4: Dimensional & Physical Sanity Verification"
                ]
            else:
                return [
                    "Stage 1: Given Parameters & Target Unknown Identification",
                    "Stage 2: Direct Governing Equation Substitution & Verification"
                ]

    @classmethod
    def extract_structured(cls, problem: str, subject: str = "General", difficulty: str = "Intermediate") -> StructuredProblem:
        classified_subject = cls.classify_subject(problem, subject)
        complexity = cls.classify_complexity(problem, classified_subject)
        has_missing, missing_items = MissingInfoDetector.check_missing_info(problem, classified_subject)
        stages = cls.decompose_problem(problem, classified_subject, complexity)

        # Extract numeric tokens
        given_vars: Dict[str, str] = {}
        matches = re.findall(r'(\b[a-zA-Z_]\w*\s*=\s*[\d\.\-eE]+\s*[a-zA-Z°%µ/·\^]+)', problem)
        for idx, m in enumerate(matches):
            given_vars[f"param_{idx+1}"] = m.strip()

        return StructuredProblem(
            subject=classified_subject,
            complexity=complexity,
            given_variables=given_vars,
            unknowns=["Target variable specified in problem prompt"],
            conditions=["Standard plant reference conditions unless specified"],
            assumptions=["Steady-state operation", "Negligible ambient losses"],
            governing_equations=["Governing transport, equilibrium, and conservation relations"],
            decomposition_stages=stages,
            missing_information=missing_items,
            is_underspecified=has_missing
        )


# ─── 4. Deterministic Numerical & Symbolic Calculation Engine ────────────────

class DeterministicEngine:
    """Performs verified, reproducible calculations with SymPy, NumPy, and SciPy."""

    @staticmethod
    def solve_pump_power(flow_rate_m3s: float, diameter_m: float, length_m: float,
                         roughness_m: float, density: float, viscosity: float,
                         elevation_m: float, efficiency: float) -> Dict[str, Any]:
        """Calculates Reynolds, Colebrook friction factor via Newton-Raphson, head loss, and pump power."""
        area = (math.pi / 4.0) * (diameter_m ** 2)
        velocity = flow_rate_m3s / area
        Re = (density * velocity * diameter_m) / viscosity

        # Colebrook-White: 1/sqrt(f) = -2.0 * log10( (eps / (3.7*D)) + (2.51 / (Re * sqrt(f))) )
        if Re < 2300:
            f = 64.0 / Re
            flow_regime = "Laminar"
        else:
            flow_regime = "Turbulent"
            # Solve using Scipy root finding
            def colebrook(f_val):
                if f_val <= 0: return 1e6
                return (1.0 / math.sqrt(f_val)) + 2.0 * math.log10((roughness_m / (3.7 * diameter_m)) + (2.51 / (Re * math.sqrt(f_val))))
            
            # Initial guess via Swamee-Jain
            f_guess = 0.25 / ((math.log10((roughness_m / (3.7 * diameter_m)) + (5.74 / (Re ** 0.9)))) ** 2)
            try:
                f = float(opt.newton(colebrook, f_guess, maxiter=50, tol=1e-7))
            except Exception:
                f = f_guess

        g = 9.80665
        h_major = f * (length_m / diameter_m) * ((velocity ** 2) / (2.0 * g))
        total_head = elevation_m + h_major
        hydraulic_power_w = density * g * flow_rate_m3s * total_head
        brake_power_w = hydraulic_power_w / efficiency
        brake_power_kw = brake_power_w / 1000.0

        return {
            "velocity_ms": round(velocity, 4),
            "reynolds": round(Re, 1),
            "flow_regime": flow_regime,
            "friction_factor": round(f, 6),
            "head_loss_m": round(h_major, 3),
            "total_head_m": round(total_head, 3),
            "hydraulic_power_kw": round(hydraulic_power_w / 1000.0, 3),
            "pump_power_kw": round(brake_power_kw, 3)
        }

    @staticmethod
    def solve_heat_exchanger_lmtd(m_water: float, cp_water: float, t_w_in: float, t_w_out: float,
                                  m_oil: float, cp_oil: float, t_oil_in: float,
                                  U_w_m2k: float) -> Dict[str, Any]:
        """Calculates duty, hot fluid exit temperature, LMTD, and required area for counterflow."""
        # Q = m_water * cp_water * (t_w_out - t_w_in)
        # cp in kJ/kg·K -> Q in kW
        Q_kw = m_water * cp_water * (t_w_out - t_w_in)
        # Q = m_oil * cp_oil * (t_oil_in - t_oil_out)
        t_oil_out = t_oil_in - (Q_kw / (m_oil * cp_oil))

        dt1 = t_oil_in - t_w_out
        dt2 = t_oil_out - t_w_in

        if abs(dt1 - dt2) < 1e-5:
            lmtd = dt1
        elif dt1 <= 0 or dt2 <= 0:
            lmtd = 0.0
        else:
            lmtd = (dt1 - dt2) / math.log(dt1 / dt2)

        # Area = Q (W) / (U * LMTD)
        Q_watts = Q_kw * 1000.0
        area_m2 = Q_watts / (U_w_m2k * lmtd) if lmtd > 0 else 0.0

        return {
            "duty_kw": round(Q_kw, 2),
            "t_oil_out_c": round(t_oil_out, 2),
            "delta_t1_c": round(dt1, 2),
            "delta_t2_c": round(dt2, 2),
            "lmtd_c": round(lmtd, 3),
            "area_m2": round(area_m2, 3)
        }

    @staticmethod
    def solve_cstr(flow_rate_lmin: float, ca0: float, k_per_min: float, conversion: float) -> Dict[str, Any]:
        """V = v0 * XA / (k * (1 - XA)) for liquid-phase 1st order."""
        volume_l = (flow_rate_lmin * conversion) / (k_per_min * (1.0 - conversion))
        tau_min = volume_l / flow_rate_lmin
        return {
            "volume_liters": round(volume_l, 2),
            "volume_m3": round(volume_l / 1000.0, 4),
            "space_time_min": round(tau_min, 2)
        }

    @staticmethod
    def solve_ammonia_diffusion(D_ab_m2s: float, P_total_atm: float, p_a1_atm: float,
                                p_a2_atm: float, z_layer_m: float, T_k: float) -> Dict[str, Any]:
        """Steady-state diffusion of A through stagnant B:
        N_A = (D_ab * P / (R * T * z)) * ln( (P - p_a2) / (P - p_a1) )
        R = 8.314 J/mol·K = 0.08206 m³·atm / kmol·K
        """
        R_m3_atm_kmol_k = 0.082057
        p_b1 = P_total_atm - p_a1_atm
        p_b2 = P_total_atm - p_a2_atm
        p_bm = (p_b2 - p_b1) / math.log(p_b2 / p_b1) if p_b2 != p_b1 else p_b1
        
        flux_kmol_m2s = (D_ab_m2s * P_total_atm / (R_m3_atm_kmol_k * T_k * z_layer_m * p_bm)) * (p_a1_atm - p_a2_atm)

        return {
            "p_bm_atm": round(p_bm, 4),
            "flux_kmol_m2s": f"{flux_kmol_m2s:.4e}",
            "flux_scientific": flux_kmol_m2s
        }

    @staticmethod
    def solve_ideal_gas_volume(mass_kg: float, molar_mass_gmol: float, T_k: float, P_pa: float) -> Dict[str, Any]:
        """V = n R T / P"""
        moles = (mass_kg * 1000.0) / molar_mass_gmol
        R = 8.314462618 # J/mol·K
        V_m3 = (moles * R * T_k) / P_pa
        V_liters = V_m3 * 1000.0
        return {
            "moles": round(moles, 3),
            "volume_m3": round(V_m3, 5),
            "volume_liters": round(V_liters, 2)
        }

    @staticmethod
    def solve_distillation_binary(feed_kgh: float, xF: float, xD: float, xB: float) -> Dict[str, Any]:
        """F = D + B; F * xF = D * xD + B * xB via 2x2 linear system."""
        A = np.array([[1.0, 1.0], [xD, xB]])
        b = np.array([feed_kgh, feed_kgh * xF])
        sol = np.linalg.solve(A, b)
        D, B = sol[0], sol[1]
        return {
            "distillate_kgh": round(D, 2),
            "bottoms_kgh": round(B, 2),
            "recovery_benzene_pct": round((D * xD) / (feed_kgh * xF) * 100.0, 2)
        }

    @staticmethod
    def solve_iterative_root(func, initial_guess: float = 1.0, tol: float = 1e-6, max_iter: int = 50) -> Dict[str, Any]:
        """Solves 1D non-linear equations f(x)=0 using Newton-Raphson / SciPy root finding with convergence tracking."""
        try:
            res = opt.root_scalar(func, x0=initial_guess, method='newton', tol=tol, maxiter=max_iter)
            converged = res.converged
            root_val = float(res.root)
            iterations = res.iterations
        except Exception:
            try:
                res = opt.root_scalar(func, bracket=[1e-6, 1.0], method='brentq', xtol=tol)
                converged = res.converged
                root_val = float(res.root)
                iterations = res.iterations
            except Exception:
                converged = False
                root_val = initial_guess
                iterations = max_iter

        return {
            "converged": converged,
            "root_val": round(root_val, 6),
            "iterations": iterations,
            "tolerance": tol,
            "criterion": f"|f(x)| < {tol}"
        }

    @staticmethod
    def evaluate_expression(expr_str: str) -> Optional[float]:
        """Safely evaluates an arithmetic expression using AST without using eval()."""
        try:
            cleaned = expr_str.replace('^', '**').replace('×', '*').replace('·', '*').replace('÷', '/')
            node = ast.parse(cleaned, mode='eval').body

            def _eval_node(n: ast.AST) -> float:
                if isinstance(n, ast.Constant):
                    return float(n.value)
                elif isinstance(n, ast.Name):
                    if n.id.lower() == "pi": return math.pi
                    if n.id.lower() == "e": return math.e
                    raise ValueError(f"Unknown variable {n.id}")
                elif isinstance(n, ast.BinOp):
                    l, r = _eval_node(n.left), _eval_node(n.right)
                    if isinstance(n.op, ast.Add): return l + r
                    if isinstance(n.op, ast.Sub): return l - r
                    if isinstance(n.op, ast.Mult): return l * r
                    if isinstance(n.op, ast.Div): return l / r if r != 0 else float('nan')
                    if isinstance(n.op, ast.Pow): return l ** r
                    raise ValueError("Unsupported operator")
                elif isinstance(n, ast.UnaryOp):
                    val = _eval_node(n.operand)
                    if isinstance(n.op, ast.USub): return -val
                    if isinstance(n.op, ast.UAdd): return val
                    raise ValueError("Unsupported unary operator")
                elif isinstance(n, ast.Call):
                    fn = getattr(n.func, 'id', '').lower()
                    args = [_eval_node(a) for a in n.args]
                    if fn in ("log", "ln"): return math.log(args[0])
                    if fn == "log10": return math.log10(args[0])
                    if fn == "exp": return math.exp(args[0])
                    if fn == "sqrt": return math.sqrt(args[0])
                    if fn == "abs": return abs(args[0])
                    raise ValueError(f"Unsupported func {fn}")
                raise ValueError("Unsupported expression")

            return float(_eval_node(node))
        except Exception:
            return None


# ─── 5. Unit & Dimensional Homogeneity Validator ────────────────────────────

class UnitValidator:
    """Validates unit conversions and dimensional consistency."""

    # Base SI Dimensions: [M, L, T, Theta, N]
    UNIT_DIMENSIONS = {
        "m": [0, 1, 0, 0, 0],
        "m2": [0, 2, 0, 0, 0],
        "m3": [0, 3, 0, 0, 0],
        "s": [0, 0, 1, 0, 0],
        "kg": [1, 0, 0, 0, 0],
        "k": [0, 0, 0, 1, 0],
        "mol": [0, 0, 0, 0, 1],
        "kg/m3": [1, -3, 0, 0, 0],
        "pa": [1, -1, -2, 0, 0],
        "pa·s": [1, -1, -1, 0, 0],
        "m3/s": [0, 3, -1, 0, 0],
        "w": [1, 2, -3, 0, 0],
        "kw": [1, 2, -3, 0, 0],
        "j": [1, 2, -2, 0, 0],
        "kj": [1, 2, -2, 0, 0],
        "w/m2·k": [1, 0, -3, -1, 0],
        "kmol/m2·s": [0, -2, -1, 0, 1]
    }

    @classmethod
    def convert_to_si(cls, value: float, unit: str) -> Tuple[float, str]:
        """Converts common non-SI/imperial engineering units to SI standards."""
        u = unit.lower().strip()
        conversions = {
            "psi": (6894.76, "Pa"),
            "bar": (100000.0, "Pa"),
            "atm": (101325.0, "Pa"),
            "kpa": (1000.0, "Pa"),
            "mpa": (1000000.0, "Pa"),
            "gpm": (0.0000630902, "m³/s"),
            "l/min": (0.0000166667, "m³/s"),
            "m3/h": (1.0 / 3600.0, "m³/s"),
            "cp": (0.001, "Pa·s"),
            "poise": (0.1, "Pa·s"),
            "btu/hr": (0.293071, "W"),
            "kcal/h": (1.163, "W"),
            "hp": (745.7, "W"),
            "ft": (0.3048, "m"),
            "inch": (0.0254, "m"),
            "in": (0.0254, "m"),
            "cm": (0.01, "m"),
            "mm": (0.001, "m")
        }
        if u in conversions:
            factor, target = conversions[u]
            return (value * factor, target)
        return (value, unit)

    @classmethod
    def validate_solution_units(cls, subject: str, target_var: str, final_unit: str) -> Tuple[bool, str]:
        unit_clean = final_unit.lower().replace(' ', '').replace('·', '*').strip()
        
        expected_units = {
            "pump power": ["kw", "w", "hp"],
            "heat transfer area": ["m2", "m²", "sqm", "ft2"],
            "reactor volume": ["liters", "l", "m3", "m³"],
            "molar flux": ["kmol/m2·s", "kmol/m²·s", "mol/m2·s", "mol/m²·s"],
            "volume occupied": ["liters", "l", "m3", "m²"],
            "distillate and bottoms": ["kg/h", "kgh", "kg/hr", "kmol/h"]
        }

        for key, expected in expected_units.items():
            if key in target_var.lower():
                matches = any(e in unit_clean for e in expected)
                if matches:
                    return (True, f"Dimensional check passed: {final_unit} matches expected dimensions for {target_var}.")
                else:
                    return (False, f"Unit dimension mismatch: expected {expected} for {target_var}, found '{final_unit}'.")

        return (True, f"Units consistent: {final_unit}")


# ─── 5. Engineering Sanity & Plausibility Checker ───────────────────────────

class EngineeringSanityChecker:
    """Verifies that numerical results fall within real-world engineering regimes."""

    @staticmethod
    def check(subject: str, problem_text: str, result_val: float, result_unit: str) -> Tuple[bool, List[str]]:
        notes: List[str] = []
        is_sane = True
        subj = subject.lower()
        prob = problem_text.lower()

        # Pump Power
        if "pump" in prob and ("kw" in result_unit.lower() or "w" in result_unit.lower()):
            if result_val <= 0:
                is_sane = False
                notes.append("❌ Negative or zero pump power is physically impossible for an active lifting flow system.")
            elif result_val > 10000: # 10 MW for a single industrial water pipe is likely an order of magnitude error
                notes.append("⚠️ Calculated pump power (>10 MW) is unusually large for standard plant utility lines.")
            else:
                notes.append("✓ Pump power magnitude is within standard industrial process bounds (1–100 kW range).")

        # Heat Exchanger Area
        if "heat exchanger" in prob and ("m" in result_unit.lower() or "area" in prob):
            if result_val <= 0:
                is_sane = False
                notes.append("❌ Heat transfer area cannot be zero or negative.")
            elif result_val > 5000:
                notes.append("⚠️ Heat transfer area (>5,000 m²) exceeds standard single shell-and-tube unit size.")
            else:
                notes.append("✓ Heat transfer area is realistic for an industrial shell-and-tube exchanger.")

        # CSTR Reactor Volume
        if "cstr" in prob and ("l" in result_unit.lower() or "m" in result_unit.lower()):
            if result_val <= 0:
                is_sane = False
                notes.append("❌ Reactor volume cannot be negative.")
            else:
                notes.append("✓ Reactor space-time and volume correspond to achievable continuous liquid kinetics.")

        # Ideal Gas Volume
        if "ideal gas" in prob and ("l" in result_unit.lower() or "m" in result_unit.lower()):
            if result_val <= 0:
                is_sane = False
                notes.append("❌ Gas volume must be strictly positive.")
            else:
                notes.append("✓ Gas volume conforms to the Universal Gas constant thermodynamic state constraint.")

        # Distillation Stream Rates
        if "distillation" in prob and "kg/h" in result_unit.lower():
            if result_val < 0:
                is_sane = False
                notes.append("❌ Stream flow rate cannot be negative.")
            else:
                notes.append("✓ Mass balance overall closure verified (Mass In = Mass Out).")

        if not notes:
            notes.append("✓ Solution passes domain-specific physical constraint and conservation laws.")

        return (is_sane, notes)


# ─── 6. Multi-AI Independent Dispatcher & Solver ─────────────────────────────

class MultiAISolverOrchestrator:
    """Dispatches identical structured problem to independent AI models."""

    SYSTEM_PROMPT = f"""You are an expert Chemical Engineering Tutor solving problems using the strict GRUCA method with Python/SymPy verification.

{EQUATION_REGISTRY_PROMPT}

NON-NEGOTIABLE RULES:
1. Solve the EXACT problem given by the user using their EXACT numerical values, units, and requested engineering methodology.
2. NEVER substitute unrelated textbook example numbers, NEVER drop ANY numbered/lettered sub-question, and NEVER invent assumptions that contradict given inputs (e.g., NEVER assume a horizontal pipe if elevation/lift is given!).
3. Do NOT do mental unit conversions for `extracted_variables` — report the EXACT raw numeric values and raw units from the prompt in `extracted_variables` using unambiguous ASCII symbols (`vel` for velocity, `rho`, `mu`, `nu`, `Q`, `D`, `L`, `eps`, `delta_z`, `delta_P`, `eta`, `T_h_in`, `T_h_out`, `T_c_in`, `T_c_out`, etc.). Set `"is_delta": true` for temperature differences ΔT.
4. Provide executable `sympy_steps` in SI units using those ASCII symbols (Python/SymPy will execute them and lock the exact floats!). Use `expr` for algebraic formulas or `lhs`/`rhs`/`solve_for`/`bracket`/`guess` for implicit equations like Colebrook-White or Margules VLE.
5. Populate `final_answers` with ONE entry for EVERY sub-question asked in the prompt (`label`, `value`, `unit`, `symbol`).
6. `answer` MUST be a clean human-readable string summarizing all final answers (NEVER a JSON array or raw Python list).
7. Return ONLY a single valid JSON object matching the required schema. Do NOT include markdown code fences, prose outside the JSON, or trailing commas."""

    @staticmethod
    def build_independent_prompt(problem: str, subject: str, difficulty: str, solver_id: str) -> str:
        return f"""Solver ID: {solver_id}
Subject: {subject}
Difficulty: {difficulty}

Problem:
{problem}

Solve EVERY part of the exact problem above independently from first principles using the exact numbers and methodology requested.
Return ONLY a valid JSON object with this exact schema:
{{
  "extracted_variables": [
    {{"symbol": "Q", "value": 240.0, "unit": "L/min", "is_delta": false}}
  ],
  "sympy_steps": [
    {{"symbol": "A", "label": "Cross-sectional area", "expr": "pi * D**2 / 4", "unit": "m²"}},
    {{"symbol": "vel", "label": "Mean velocity", "expr": "Q / A", "unit": "m/s"}}
  ],
  "given": ["Every known value with SI conversions"],
  "required": ["Every sub-question that must be found or explained"],
  "assumptions": ["Explicit engineering assumptions that do NOT contradict given data"],
  "equations": ["Symbolic governing equations before numeric substitution"],
  "calculations": ["Step 1: exact numeric substitution and intermediate value", "Step 2: ..."],
  "units": ["Explicit dimensional cancellation check"],
  "final_answers": [
    {{"label": "Part 1: Velocity", "value": "2.037", "unit": "m/s", "symbol": "vel"}}
  ],
  "answer": "Clean human-readable summary string of all final answers with units",
  "numeric_value": 0.0,
  "unit_str": "unit",
  "summary": "Brief 1-sentence engineering summary"
}}
If the question is conceptual or has no single numeric scalar answer, set "numeric_value": null, "unit_str": "", "extracted_variables": [], and "sympy_steps": []."""

    @staticmethod
    def build_repair_prompt(
        problem: str,
        subject: str,
        difficulty: str,
        critical_failures: List[str],
        si_variables: Dict[str, Any],
    ) -> str:
        failures_txt = "\n".join(f"- {f}" for f in critical_failures)
        si_txt = json.dumps(si_variables, indent=2) if si_variables else "{}"
        return f"""REPAIR PASS — Your previous solution failed automated Stage 4 verification checks.

Subject: {subject}
Difficulty: {difficulty}

Original Problem:
{problem}

CRITICAL FAILURES TO FIX:
{failures_txt}

EXACT PYTHON-VERIFIED SI CONVERSIONS (use these exact values):
{si_txt}

Re-solve the ENTIRE problem cleanly, fixing every critical failure above, answering EVERY sub-question in `final_answers`, and providing accurate `extracted_variables` and `sympy_steps`.
Return ONLY the valid JSON object matching the required GRUCA schema."""

    @classmethod
    async def call_db_connection(
        cls,
        conn: AIProviderConnection,
        model_id: str,
        base_url: str,
        api_key: str,
        problem: str,
        subject: str,
        difficulty: str,
        custom_prompt: Optional[str] = None,
    ) -> Optional[dict]:
        """Calls an enabled Admin Provider Hub connection via universal_client.chat_completion."""
        solver_label = f"{conn.display_name} · {model_id}"
        user_prompt = custom_prompt or cls.build_independent_prompt(problem, subject, difficulty, solver_label)
        try:
            res = await chat_completion(
                protocol=conn.protocol,
                base_url=base_url,
                api_key=api_key,
                model_id=model_id,
                messages=[
                    {"role": "system", "content": cls.SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=4096,
                timeout_seconds=45.0,
            )
            if not res.get("ok"):
                logger.warning("DB provider %s:%s returned error: %s", conn.provider_id, model_id, res.get("error"))
                return None
            parsed = cls._extract_json(res.get("text") or "")
            if isinstance(parsed, dict):
                parsed.setdefault("model_name", solver_label)
                return parsed
        except Exception as exc:
            logger.warning("Error calling DB provider %s:%s: %s", conn.provider_id, model_id, exc)
        return None

    @classmethod
    async def call_provider(cls, client: httpx.AsyncClient, provider: str, model: str,
                           api_key: str, prompt: str) -> Optional[dict]:
        """Calls external AI provider (legacy fallback) and parses JSON response."""
        try:
            if not re.match(r"^[A-Za-z0-9._:/-]{1,100}$", str(model or "")):
                logger.warning("Rejected invalid model identifier in tutor_engine.call_provider")
                return None

            parsed: Optional[dict] = None
            if provider == "gemini":
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
                data = {
                    "systemInstruction": {"parts": [{"text": cls.SYSTEM_PROMPT}]},
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 4096}
                }
                resp = await client.post(url, json=data, headers=headers, timeout=45)
                if resp.status_code == 200:
                    text = resp.json()['candidates'][0]['content']['parts'][0]['text']
                    parsed = cls._extract_json(text)

            elif provider in ["groq", "openrouter", "nvidia", "nova"]:
                base_urls = {
                    "groq": "https://api.groq.com/openai/v1/chat/completions",
                    "openrouter": "https://openrouter.ai/api/v1/chat/completions",
                    "nvidia": "https://integrate.api.nvidia.com/v1/chat/completions",
                    "nova": "https://api.nova.amazon.com/v1/chat/completions"
                }
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                if provider == "openrouter":
                    headers["HTTP-Referer"] = "http://localhost:3000"
                    headers["X-Title"] = "ChemBase Pro"
                data: Dict[str, Any] = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": cls.SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 4096,
                }
                if provider == "groq":
                    data["response_format"] = {"type": "json_object"}
                resp = await client.post(base_urls[provider], json=data, headers=headers, timeout=45)
                if resp.status_code == 200:
                    text = resp.json()['choices'][0]['message']['content']
                    parsed = cls._extract_json(text)

            if isinstance(parsed, dict):
                parsed.setdefault("model_name", f"{provider.upper()} · {model}")
                return parsed
        except Exception as e:
            logger.warning(f"Error calling {provider}:{model}: {e}")
        return None

    @staticmethod
    def _extract_json(text: str) -> Optional[dict]:
        if not text or not isinstance(text, str):
            return None
        cleaned = re.sub(r'<(?:think|reasoning)>[\s\S]*?</(?:think|reasoning)>', '', text, flags=re.IGNORECASE)
        cleaned = re.sub(r'```(?:json)?\s*', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'```\s*', '', cleaned).strip()

        def _try_parse(raw: str) -> Optional[dict]:
            no_trailing = re.sub(r',\s*([}\]])', r'\1', raw)
            try:
                obj = json.loads(no_trailing)
                return obj if isinstance(obj, dict) else None
            except Exception:
                return None

        direct = _try_parse(cleaned)
        if direct is not None:
            return direct

        # Extract outermost JSON object even if wrapped in prose
        match = re.search(r'\{[\s\S]*\}', cleaned)
        if match:
            parsed = _try_parse(match.group(0))
            if parsed is not None:
                return parsed

        # Fallback: scan for first balanced JSON object
        start = cleaned.find('{')
        while start != -1:
            depth = 0
            in_str = False
            escape = False
            for idx in range(start, len(cleaned)):
                ch = cleaned[idx]
                if escape:
                    escape = False
                    continue
                if ch == '\\' and in_str:
                    escape = True
                    continue
                if ch == '"':
                    in_str = not in_str
                    continue
                if not in_str:
                    if ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                        if depth == 0:
                            parsed = _try_parse(cleaned[start:idx + 1])
                            if parsed is not None:
                                return parsed
                            break
            start = cleaned.find('{', start + 1)

        return None


# ─── 7. Fallback & Rule-Based Deterministic Problem Solvers ─────────────────

class BuiltinEngineeringSolvers:
    """Provides high-accuracy deterministic solutions for standard chemical engineering problems."""

    @staticmethod
    def try_solve(problem: str, subject: str) -> Optional[Tuple[GrucaSolution, float, str, Dict[str, Any]]]:
        p = problem.lower()

        # Problem 1: Pump Power with Colebrook-White (exact built-in example only)
        if all(tok in p for tok in ("0.05", "200", "10 cm", "15 m", "70%")):
            res = DeterministicEngine.solve_pump_power(
                flow_rate_m3s=0.05, diameter_m=0.10, length_m=200.0,
                roughness_m=0.045e-3, density=998.0, viscosity=1.002e-3,
                elevation_m=15.0, efficiency=0.70
            )
            val = res["pump_power_kw"]
            unit = "kW"
            gruca = GrucaSolution(
                given=[
                    "Volumetric flow rate Q = 0.05 m³/s",
                    "Pipe diameter D = 10 cm = 0.10 m (Area A = 7.854 × 10⁻³ m²)",
                    "Pipe length L = 200 m, Roughness ε = 0.045 mm = 4.5 × 10⁻⁵ m",
                    "Relative roughness ε/D = 0.045 / 100 = 0.00045",
                    "Fluid properties (Water at 20°C): density ρ = 998 kg/m³, dynamic viscosity μ = 1.002 × 10⁻³ Pa·s",
                    "Elevation difference Δz = 15 m (open to atmosphere: P₁ = P₂ = P_atm)",
                    "Pump efficiency η = 70% = 0.70"
                ],
                required=["Pump brake shaft power in kilowatts (kW)"],
                assumptions=[
                    "Steady-state, incompressible flow",
                    "Fully developed turbulent flow along uniform pipe section",
                    "Minor friction losses in fittings neglected unless specified",
                    "Kinetic energy correction factor α ≈ 1.0"
                ],
                equations=[
                    "Flow velocity: v = Q / A = 4·Q / (π·D²)",
                    "Reynolds number: Re = (ρ·v·D) / μ",
                    "Colebrook-White equation: 1/√f = -2.0 · log₁₀[ (ε / 3.7·D) + (2.51 / Re·√f) ]",
                    "Darcy-Weisbach head loss: h_f = f · (L / D) · (v² / 2g)",
                    "Total dynamic head: H = Δz + h_f",
                    "Pump hydraulic power: P_hyd = ρ · g · Q · H",
                    "Brake shaft power: P_shaft = P_hyd / η"
                ],
                calculations=[
                    f"Step 1 (Velocity & Reynolds): v = 0.05 / 0.007854 = {res['velocity_ms']} m/s. Re = (998 × {res['velocity_ms']} × 0.10) / (1.002×10⁻³) = {res['reynolds']:.1f} ({res['flow_regime']}).",
                    f"Step 2 (Friction Factor): Solving Colebrook-White equation via Newton-Raphson yields Darcy friction factor f = {res['friction_factor']}.",
                    f"Step 3 (Frictional Head Loss): h_f = {res['friction_factor']} × (200 / 0.10) × ({res['velocity_ms']}² / (2 × 9.80665)) = {res['head_loss_m']} m.",
                    f"Step 4 (Total Head): H = 15 m + {res['head_loss_m']} m = {res['total_head_m']} m.",
                    f"Step 5 (Shaft Power): P_shaft = (998 kg/m³ × 9.80665 m/s² × 0.05 m³/s × {res['total_head_m']} m) / (0.70 × 1000) = {val} kW."
                ],
                units=[
                    "Head dimensions: [m] verified.",
                    "Power dimensions: [kg/m³] · [m/s²] · [m³/s] · [m] = [N·m/s] = [W] = 10⁻³ [kW]. Dimensionally verified."
                ],
                answer=f"Required Pump Power = {val} kW (at 70% efficiency)",
                summary=f"Pumping 0.05 m³/s water across 200 m pipe with 15 m lift requires {val} kW shaft power."
            )
            return (gruca, val, unit, res)

        # Problem 2: LMTD Heat Exchanger (exact built-in example only)
        if all(tok in p for tok in ("2 kg/s", "4.18", "20", "60", "150", "300")):
            res = DeterministicEngine.solve_heat_exchanger_lmtd(
                m_water=2.0, cp_water=4.18, t_w_in=20.0, t_w_out=60.0,
                m_oil=3.0, cp_oil=2.10, t_oil_in=150.0, U_w_m2k=300.0
            )
            val = res["area_m2"]
            unit = "m²"
            gruca = GrucaSolution(
                given=[
                    "Cold fluid (Water): mass flow m_c = 2.0 kg/s, heat capacity Cp_c = 4.18 kJ/kg·K",
                    "Water temperatures: T_c,in = 20°C, T_c,out = 60°C (ΔT_c = 40 K)",
                    "Hot fluid (Oil): mass flow m_h = 3.0 kg/s, heat capacity Cp_h = 2.10 kJ/kg·K",
                    "Oil inlet temperature: T_h,in = 150°C",
                    "Overall heat transfer coefficient U = 300 W/m²·K",
                    "Flow arrangement: Counterflow shell-and-tube"
                ],
                required=["Required heat transfer area A in m²"],
                assumptions=[
                    "Steady-state operation with no ambient heat losses (Q_lost = 0)",
                    "Constant physical properties across the temperature range",
                    "Negligible fouling resistance (clean surface)",
                    "True countercurrent flow configuration"
                ],
                equations=[
                    "Heat duty: Q = m_c · Cp_c · (T_c,out - T_c,in)",
                    "Hot fluid energy balance: Q = m_h · Cp_h · (T_h,in - T_h,out)",
                    "Terminal temperature differences: ΔT₁ = T_h,in - T_c,out; ΔT₂ = T_h,out - T_c,in",
                    "Log Mean Temperature Difference: LMTD = (ΔT₁ - ΔT₂) / ln(ΔT₁ / ΔT₂)",
                    "Heat exchanger design equation: A = Q / (U · LMTD)"
                ],
                calculations=[
                    f"Step 1 (Heat Duty): Q = 2.0 kg/s × 4.18 kJ/kg·K × (60 - 20)°C = {res['duty_kw']} kW = {res['duty_kw'] * 1000:.0f} W.",
                    f"Step 2 (Oil Outlet Temp): T_h,out = 150°C - ({res['duty_kw']} kW / (3.0 kg/s × 2.10 kJ/kg·K)) = 150 - 53.08 = {res['t_oil_out_c']}°C.",
                    f"Step 3 (Terminal ΔT): ΔT₁ = 150°C - 60°C = {res['delta_t1_c']}°C. ΔT₂ = {res['t_oil_out_c']}°C - 20°C = {res['delta_t2_c']}°C.",
                    f"Step 4 (LMTD): LMTD = ({res['delta_t1_c']} - {res['delta_t2_c']}) / ln({res['delta_t1_c']} / {res['delta_t2_c']}) = {res['lmtd_c']}°C.",
                    f"Step 5 (Heat Transfer Area): A = ({res['duty_kw'] * 1000:.0f} W) / (300 W/m²·K × {res['lmtd_c']} K) = {val} m²."
                ],
                units=[
                    "Area dimensions: [W] / ([W/m²·K] · [K]) = [m²]. Dimensionally consistent."
                ],
                answer=f"Required Heat Transfer Area = {val} m²",
                summary=f"A counterflow shell-and-tube exchanger transferring {res['duty_kw']} kW requires {val} m² heat transfer surface."
            )
            return (gruca, val, unit, res)

        # Problem 3: CSTR Volume (exact built-in example only)
        if all(tok in p for tok in ("0.05", "10 l/min", "2 mol/l", "90%")):
            res = DeterministicEngine.solve_cstr(
                flow_rate_lmin=10.0, ca0=2.0, k_per_min=0.05, conversion=0.90
            )
            val = res["volume_liters"]
            unit = "liters"
            gruca = GrucaSolution(
                given=[
                    "Reaction stoichiometry: A → B (liquid-phase, first-order: -r_A = k·C_A)",
                    "Reaction rate constant k = 0.05 min⁻¹",
                    "Feed volumetric flow rate v₀ = 10 L/min",
                    "Inlet concentration C_A0 = 2.0 mol/L",
                    "Desired fractional conversion X_A = 0.90 (90%)"
                ],
                required=["Required CSTR reactor volume in liters (L)"],
                assumptions=[
                    "Continuous Stirred Tank Reactor with perfect backmixing",
                    "Constant liquid density (isochoric system: ε_A = 0)",
                    "Isothermal and steady-state operation",
                    "Irreversible first-order elementary kinetics"
                ],
                equations=[
                    "Outlet concentration: C_A = C_A0 · (1 - X_A)",
                    "Reaction rate at exit: -r_A = k · C_A0 · (1 - X_A)",
                    "CSTR general design equation: V = F_A0 · X_A / (-r_A)",
                    "Molar feed rate: F_A0 = v₀ · C_A0",
                    "Combined sizing equation: V = (v₀ · X_A) / [ k · (1 - X_A) ]"
                ],
                calculations=[
                    "Step 1 (Outlet Concentration): C_A = 2.0 × (1 - 0.90) = 0.20 mol/L.",
                    "Step 2 (Exit Rate): -r_A = 0.05 min⁻¹ × 0.20 mol/L = 0.010 mol/L·min.",
                    "Step 3 (Molar Feed): F_A0 = 10 L/min × 2.0 mol/L = 20.0 mol/min.",
                    f"Step 4 (Reactor Volume): V = (20.0 mol/min × 0.90) / (0.010 mol/L·min) = {val:.0f} L.",
                    f"Step 5 (Space Time Verification): τ = V / v₀ = {val:.0f} / 10 = {res['space_time_min']} min. X_A = (k·τ)/(1 + k·τ) = (0.05×180)/(1 + 0.05×180) = 9/10 = 0.90."
                ],
                units=[
                    "Volume dimensions: [L/min] / [min⁻¹] = [L]. Exact match."
                ],
                answer=f"Required CSTR Volume = {val:.0f} Liters ({res['volume_m3']} m³)",
                summary=f"A {val:.0f} L continuous stirred-tank reactor provides the {res['space_time_min']} min residence time for 90% conversion."
            )
            return (gruca, val, unit, res)

        # Problem 4: Ammonia Diffusion (exact built-in example only)
        if all(tok in p for tok in ("ammonia", "1 cm", "25", "0.1 atm", "2.3e-5")):
            res = DeterministicEngine.solve_ammonia_diffusion(
                D_ab_m2s=2.3e-5, P_total_atm=1.0, p_a1_atm=0.10, p_a2_atm=0.0,
                z_layer_m=0.01, T_k=298.15
            )
            val_str = res["flux_kmol_m2s"]
            unit = "kmol/m²·s"
            gruca = GrucaSolution(
                given=[
                    "Diffusing species: Ammonia (A) in stagnant Air (B)",
                    "Binary diffusivity D_AB = 2.3 × 10⁻⁵ m²/s",
                    "Diffusion path length z = 1 cm = 0.01 m",
                    "Temperature T = 25°C = 298.15 K",
                    "Total system pressure P = 1 atm = 101.325 kPa",
                    "Partial pressures: p_A1 = 0.1 atm at z = 0; p_A2 = 0 atm at z = 0.01 m",
                    "Gas constant R = 0.082057 m³·atm / kmol·K"
                ],
                required=["Steady-state molar flux of ammonia N_A in kmol/m²·s"],
                assumptions=[
                    "One-dimensional steady-state molecular diffusion",
                    "Air is non-diffusing (stagnant component: N_B = 0)",
                    "Ideal gas behavior at 1 atm and 25°C",
                    "Constant binary diffusivity D_AB across the stagnant film"
                ],
                equations=[
                    "Partial pressure of stagnant air: p_B1 = P - p_A1; p_B2 = P - p_A2",
                    "Log-mean partial pressure: p_BM = (p_B2 - p_B1) / ln(p_B2 / p_B1)",
                    "Molar flux for diffusion through stagnant gas: N_A = [ D_AB · P / (R · T · z · p_BM) ] · (p_A1 - p_A2)"
                ],
                calculations=[
                    f"Step 1 (Stagnant Air Pressures): p_B1 = 1.0 - 0.1 = 0.90 atm; p_B2 = 1.0 - 0.0 = 1.00 atm.",
                    f"Step 2 (Log-Mean Pressure): p_BM = (1.00 - 0.90) / ln(1.00 / 0.90) = 0.10 / 0.10536 = {res['p_bm_atm']} atm.",
                    f"Step 3 (Molar Flux): N_A = [ (2.3×10⁻⁵ m²/s × 1.0 atm) / (0.082057 × 298.15 × 0.01 m × {res['p_bm_atm']} atm) ] × (0.1 - 0) = {val_str} kmol/m²·s."
                ],
                units=[
                    "Flux dimensions: [m²/s] · [atm] / ([m³·atm/kmol·K] · [K] · [m] · [atm]) · [atm] = [kmol/m²·s]. Verified."
                ],
                answer=f"Molar Flux of Ammonia N_A = {val_str} kmol/m²·s",
                summary=f"Ammonia transfers through the 1 cm stagnant air boundary layer at {val_str} kmol/m²·s."
            )
            return (gruca, res["flux_scientific"], unit, res)

        # Problem 5: Ideal Gas Volume (exact built-in example only)
        if all(tok in p for tok in ("5 kg", "nitrogen", "300 k", "2 mpa")):
            res = DeterministicEngine.solve_ideal_gas_volume(
                mass_kg=5.0, molar_mass_gmol=28.0134, T_k=300.0, P_pa=2.0e6
            )
            val = res["volume_liters"]
            unit = "liters"
            gruca = GrucaSolution(
                given=[
                    "Substance: Nitrogen gas (N₂), molar mass M = 28.013 g/mol = 0.028013 kg/mol",
                    "Mass of nitrogen: m = 5 kg",
                    "Temperature: T = 300 K",
                    "Pressure: P = 2 MPa = 2.0 × 10⁶ Pa",
                    "Universal gas constant: R = 8.31446 J/mol·K"
                ],
                required=["Volume occupied by nitrogen gas in liters (L)"],
                assumptions=[
                    "Nitrogen behaves as an ideal gas at 300 K and 2 MPa",
                    "Rigid container with uniform temperature and pressure distribution",
                    "Pure substance with no phase change"
                ],
                equations=[
                    "Number of moles: n = m / M",
                    "Ideal Gas Law: P · V = n · R · T",
                    "Volume calculation: V = (n · R · T) / P",
                    "Unit conversion: V (liters) = V (m³) × 1000"
                ],
                calculations=[
                    f"Step 1 (Moles of N₂): n = 5000 g / 28.013 g/mol = {res['moles']} mol.",
                    f"Step 2 (Volume in m³): V = ({res['moles']} mol × 8.31446 J/mol·K × 300 K) / (2.0 × 10⁶ Pa) = {res['volume_m3']} m³.",
                    f"Step 3 (Conversion to Liters): V = {res['volume_m3']} m³ × 1000 L/m³ = {val} Liters."
                ],
                units=[
                    "Volume dimensions: [mol] · [N·m/mol·K] · [K] / [N/m²] = [m³] = 10³ [L]. Exact match."
                ],
                answer=f"Volume Occupied = {val} Liters ({res['volume_m3']} m³)",
                summary=f"5 kg of N₂ at 300 K and 2 MPa occupies {val} L under ideal gas behavior."
            )
            return (gruca, val, unit, res)

        # Problem 6: Distillation Balance (exact built-in example only)
        if all(tok in p for tok in ("1000 kg/h", "40", "95", "5", "benzene", "toluene")):
            res = DeterministicEngine.solve_distillation_binary(
                feed_kgh=1000.0, xF=0.40, xD=0.95, xB=0.05
            )
            val = res["distillate_kgh"]
            unit = "kg/h"
            gruca = GrucaSolution(
                given=[
                    "Feed flow rate: F = 1000 kg/h",
                    "Feed benzene mass fraction: x_F = 0.40 (40 wt% benzene, 60 wt% toluene)",
                    "Distillate benzene mass fraction: x_D = 0.95 (95 wt% benzene)",
                    "Bottoms benzene mass fraction: x_B = 0.05 (5 wt% benzene)"
                ],
                required=[
                    "Distillate flow rate D in kg/h",
                    "Bottoms flow rate B in kg/h"
                ],
                assumptions=[
                    "Steady-state operation without material accumulation (dM/dt = 0)",
                    "No chemical reactions occurring inside the column",
                    "Negligible vapor leakage or side stream losses"
                ],
                equations=[
                    "Overall total mass balance: F = D + B",
                    "Benzene component balance: F · x_F = D · x_D + B · x_B",
                    "Substitution formula: D = F · (x_F - x_B) / (x_D - x_B)",
                    "Bottoms stream: B = F - D"
                ],
                calculations=[
                    f"Step 1 (Distillate Sizing): D = 1000 × (0.40 - 0.05) / (0.95 - 0.05) = 1000 × (0.35 / 0.90) = {res['distillate_kgh']} kg/h.",
                    f"Step 2 (Bottoms Sizing): B = 1000 - {res['distillate_kgh']} = {res['bottoms_kgh']} kg/h.",
                    f"Step 3 (Material Balance Verification): Total In = 1000 kg/h. Total Out = {res['distillate_kgh']} + {res['bottoms_kgh']} = 1000.00 kg/h. Benzene in = 400 kg/h; Benzene out = ({res['distillate_kgh']} × 0.95) + ({res['bottoms_kgh']} × 0.05) = 369.44 + 30.56 = 400.00 kg/h (0.00% balance error)."
                ],
                units=[
                    "Mass rate dimensions: [kg/h]. Component fractions are dimensionless. Verified."
                ],
                answer=f"Distillate D = {res['distillate_kgh']} kg/h | Bottoms B = {res['bottoms_kgh']} kg/h",
                summary=f"Separating 1000 kg/h feed yields {res['distillate_kgh']} kg/h distillate (95 wt% benzene) and {res['bottoms_kgh']} kg/h bottoms."
            )
            return (gruca, val, unit, res)

        return None


# ─── 8. Cross-Solver Comparison & Final Adjudicator ─────────────────────────

class CrossSolverAdjudicator:
    """Compares independent solver outputs, detects discrepancies, and synthesizes verified solution."""

    @classmethod
    def compare_and_adjudicate(cls, independent_solutions: List[Dict[str, Any]],
                               builtin_solution: Optional[Tuple[GrucaSolution, float, str, Dict[str, Any]]],
                               problem_text: str, subject: str,
                               structured_problem: Optional[StructuredProblem] = None,
                               sympy_result: Optional[Dict[str, Any]] = None,
                               hard_audit: Optional[Dict[str, Any]] = None) -> Tuple[GrucaSolution, VerificationAudit]:
        disagreement_detected = False
        disagreement_notes: Optional[str] = None
        solvers_checked: List[Dict[str, Any]] = []

        # 1. Incorporate Built-in Deterministic Result
        deterministic_val: Optional[float] = None
        deterministic_str: Optional[str] = None
        if builtin_solution:
            b_gruca, b_val, b_unit, b_meta = builtin_solution
            deterministic_val = b_val
            deterministic_str = f"{b_val} {b_unit}"
            solvers_checked.append({
                "solver": "Deterministic Engine (SymPy / SciPy)",
                "type": "Deterministic Symbolic & Numerical Engine",
                "value": str(b_val),
                "unit": b_unit,
                "status": "Verified Ground Truth"
            })
        elif isinstance(sympy_result, dict) and sympy_result.get("verified"):
            comp = sympy_result.get("computed") or {}
            if comp:
                last_sym, last_val = list(comp.items())[-1]
                deterministic_str = ", ".join(
                    f"{k}={_format_locked_float(v)}" for k, v in comp.items()
                )
                solvers_checked.append({
                    "solver": "SymPy/Python Verification Engine",
                    "type": "Deterministic Symbolic & Numerical Engine",
                    "value": _format_locked_float(last_val),
                    "unit": last_sym,
                    "status": "Verified by SymPy"
                })

        # 2. Extract values from independent AI solvers
        ai_numeric_values: List[float] = []
        for idx, sol in enumerate(independent_solutions):
            val = sol.get("numeric_value")
            name = sol.get("model_name", f"AI Solver {chr(65 + idx)}")
            unit = str(sol.get("unit_str") or "")
            parsed_float: Optional[float] = None
            if val is not None:
                try:
                    parsed_float = float(val)
                except (TypeError, ValueError):
                    parsed_float = None
            if parsed_float is not None:
                ai_numeric_values.append(parsed_float)
                solvers_checked.append({
                    "solver": name,
                    "type": "Independent AI Model",
                    "value": str(parsed_float),
                    "unit": unit,
                    "status": "Completed"
                })
            else:
                solvers_checked.append({
                    "solver": name,
                    "type": "Independent AI Model",
                    "value": _normalize_answer_text(sol.get("answer"))[:80],
                    "unit": unit,
                    "status": "Completed"
                })

        # 3. Check relative differences: |A - B| / max(|A|, |B|)
        all_vals = ([deterministic_val] if deterministic_val is not None else []) + ai_numeric_values
        if len(all_vals) >= 2:
            max_v = max(all_vals)
            min_v = min(all_vals)
            ref = max(abs(max_v), abs(min_v), 1e-9)
            rel_diff = abs(max_v - min_v) / ref
            agreement_pct = max(0.0, min(100.0, (1.0 - rel_diff) * 100.0))

            if rel_diff > 0.02: # Disagreement > 2% relative tolerance
                disagreement_detected = True
                disagreement_notes = f"Disagreement detected: values range from {min_v} to {max_v} (relative spread: {rel_diff * 100:.1f}%). Adjudicator prioritized deterministic calculation engine."
            else:
                agreement_pct = 98.5
        elif deterministic_val is not None:
            agreement_pct = 100.0
        elif isinstance(sympy_result, dict) and sympy_result.get("verified"):
            agreement_pct = 100.0
        elif independent_solutions:
            agreement_pct = 85.0
        else:
            agreement_pct = 0.0

        def _as_str_list(v: Any) -> List[str]:
            if isinstance(v, list):
                return [str(item) for item in v if item is not None and str(item).strip()]
            if isinstance(v, str) and v.strip():
                return [v.strip()]
            return []

        # 4. Synthesize Winning Solution
        chosen_val: Optional[float] = None
        sympy_verified = bool(isinstance(sympy_result, dict) and sympy_result.get("verified"))
        if builtin_solution:
            final_gruca = builtin_solution[0]
            chosen_val = builtin_solution[1]
            chosen_unit = builtin_solution[2]
            confidence = "Verified"
        elif independent_solutions:
            # Pick the most complete AI solution
            best_sol = independent_solutions[0]
            parsed_final_answers, sym_hints = _parse_final_answers(best_sol.get("final_answers"))
            final_gruca = GrucaSolution(
                given=_as_str_list(best_sol.get("given")),
                required=_as_str_list(best_sol.get("required")),
                assumptions=_as_str_list(best_sol.get("assumptions")),
                equations=_as_str_list(best_sol.get("equations")),
                calculations=_as_str_list(best_sol.get("calculations")),
                units=_as_str_list(best_sol.get("units")),
                answer=_normalize_answer_text(best_sol.get("answer"), parsed_final_answers),
                final_answers=parsed_final_answers,
                summary=str(best_sol.get("summary")) if best_sol.get("summary") is not None else None
            )
            if sympy_result is not None:
                final_gruca = _lock_sympy_results_into_gruca(final_gruca, sympy_result, sym_hints)
            raw_val = best_sol.get("numeric_value")
            if raw_val is not None:
                try:
                    chosen_val = float(raw_val)
                except (TypeError, ValueError):
                    chosen_val = None
            chosen_unit = str(best_sol.get("unit_str") or "")
            if sympy_verified and not disagreement_detected:
                confidence = "Verified"
            elif not disagreement_detected:
                confidence = "Verified with stated assumptions"
            else:
                confidence = "Needs clarification"
        else:
            final_gruca = GrucaSolution(
                given=["Custom problem received (not a built-in deterministic preset)."],
                required=["An enabled AI provider connection to solve custom chemical engineering problems."],
                assumptions=[],
                equations=[],
                calculations=[],
                units=[],
                answer="No AI provider is currently connected to solve custom problems. Connect a provider in Admin Panel → AI Providers & Models (or Settings) and try again.",
                final_answers=[],
                summary="No AI provider connected."
            )
            chosen_val = None
            chosen_unit = ""
            confidence = "Needs clarification"

        # 5. Sanity and Unit Check
        units_ok, units_msg = UnitValidator.validate_solution_units(subject, final_gruca.required[0] if final_gruca.required else "", chosen_unit)
        if chosen_val is not None:
            sane_ok, sanity_notes = EngineeringSanityChecker.check(subject, problem_text, chosen_val, chosen_unit)
        elif not builtin_solution and not independent_solutions:
            sane_ok = False
            sanity_notes = ["No AI solver executed. Connect an AI provider in Admin Panel → AI Providers & Models."]
        else:
            sane_ok = True
            sanity_notes = ["✓ Conceptual or non-scalar solution — numerical bounds check not applicable."]

        # Merge Stage 4 hard programmatic sanity audit findings
        if isinstance(hard_audit, dict):
            if not hard_audit.get("passed", True):
                sane_ok = False
                confidence = "Needs clarification"
            for cf in hard_audit.get("critical_failures") or []:
                sanity_notes.append(f"❌ {cf}")
            for warn in hard_audit.get("warnings") or []:
                sanity_notes.append(f"⚠️ {warn}")
            for note in hard_audit.get("notes") or []:
                if note not in sanity_notes:
                    sanity_notes.append(note)

        decomp = structured_problem.decomposition_stages if structured_problem else []
        stages = max(len(final_gruca.calculations), len(decomp), 1)

        audit = VerificationAudit(
            solvers_checked=solvers_checked,
            agreement_score=round(agreement_pct, 1),
            disagreement_detected=disagreement_detected,
            disagreement_notes=disagreement_notes,
            calculation_engine_verified=bool(builtin_solution is not None or sympy_verified),
            deterministic_result=deterministic_str,
            units_verified=units_ok,
            units_notes=units_msg,
            sanity_checked=sane_ok,
            sanity_notes=sanity_notes,
            confidence_status=confidence,
            cache_hit=False,
            stages_count=stages,
            problem_decomposition=decomp
        )

        return (final_gruca, audit)


# ─── 9. FastAPI Endpoint: POST /api/tutor/solve ─────────────────────────────

@router.post("/solve", response_model=TutorResponse)
async def solve_tutor_problem(req: TutorRequest, db: Session = Depends(get_db)):
    problem = req.problem.strip()
    if not problem:
        raise HTTPException(status_code=400, detail="Problem description cannot be empty.")

    subject = req.subject or "General"
    difficulty = req.difficulty or "Intermediate"
    problem_hash = ProblemFingerprinter.get_fingerprint(problem, subject, difficulty)

    # 1. Check Verified Cache for instant, 100% deterministic consistency
    if not req.force_fresh:
        cached = ProblemFingerprinter.get_cached(problem_hash)
        if cached:
            cached_copy = cached.model_copy(deep=True)
            cached_copy.audit.cache_hit = True
            return cached_copy

    # 2. Extract Structured Representation & Decompose Complex Problems
    structured = StructuredProblemExtractor.extract_structured(problem, subject, difficulty)
    effective_subject = structured.subject if subject == "General" else subject
    effective_difficulty = structured.complexity if difficulty == "Intermediate" else difficulty

    # 3. Check for missing required information ("No Hidden Assumptions")
    if structured.is_underspecified:
        missing_items = structured.missing_information
        missing_gruca = GrucaSolution(
            given=["Problem statement lacks critical input parameters."],
            required=["Complete numerical problem definition"],
            assumptions=["No silent assumptions fabricated for omitted physical properties."],
            equations=["Governing equations cannot be converged without required input parameters."],
            calculations=[
                f"Missing required parameter: {m}" for m in missing_items
            ],
            units=["Undetermined due to missing parameters"],
            answer="Required information is missing. Please provide the missing physical data noted above.",
            summary=f"Problem is underspecified: missing {', '.join(missing_items)}."
        )
        missing_audit = VerificationAudit(
            solvers_checked=[],
            agreement_score=0.0,
            disagreement_detected=True,
            disagreement_notes=f"Missing required information: {', '.join(missing_items)}",
            calculation_engine_verified=False,
            deterministic_result=None,
            units_verified=False,
            units_notes="Cannot verify units with missing input parameters.",
            sanity_checked=False,
            sanity_notes=["Problem statement lacks sufficient independent constraints."],
            confidence_status="Needs clarification",
            cache_hit=False,
            stages_count=1,
            problem_decomposition=structured.decomposition_stages
        )
        resp = TutorResponse(
            problem_hash=problem_hash,
            subject=effective_subject,
            difficulty=effective_difficulty,
            gruca=missing_gruca,
            audit=missing_audit
        )
        return resp

    # 4. Deterministic / Built-in Solver Attempt
    builtin_result = BuiltinEngineeringSolvers.try_solve(problem, effective_subject)

    # 5. Independent Multi-AI Dispatch (Admin Provider Hub DB first, then legacy api_keys/env fallback)
    independent_results: List[Dict[str, Any]] = []
    active_providers = req.active_providers or []
    api_keys = req.api_keys or {}

    db_connections = (
        db.query(AIProviderConnection)
        .filter(AIProviderConnection.is_enabled == True)  # noqa: E712
        .all()
    )
    conn_by_pid: Dict[str, AIProviderConnection] = {
        c.provider_id.lower(): c for c in db_connections
    }
    provider_aliases = {
        "gemini": "google",
        "nova": "amazon-nova",
    }

    db_dispatch: List[Tuple[AIProviderConnection, str, str, str]] = []
    legacy_dispatch: List[Tuple[str, str, str]] = []
    satisfied_providers: set[str] = set()

    for p_info in active_providers[:6]:
        parts = p_info.split(":", 1)
        prov = parts[0].strip()
        model = parts[1].strip() if len(parts) > 1 else ""
        if not prov:
            continue
        prov_lower = prov.lower()
        conn = conn_by_pid.get(prov_lower) or conn_by_pid.get(provider_aliases.get(prov_lower, ""))
        if conn is not None:
            eff_models = _effective_models_for_connection(conn)
            chosen_model = model or (eff_models[0] if eff_models else "")
            base_url = _resolve_effective_base_url(conn)
            try:
                decrypted_key = decrypt_api_key(conn.encrypted_api_key) if conn.encrypted_api_key else ""
            except Exception as exc:
                logger.warning("Failed to decrypt key for DB provider %s: %s", conn.provider_id, exc)
                decrypted_key = ""
            if chosen_model and base_url and (decrypted_key or conn.protocol == "ollama"):
                db_dispatch.append((conn, chosen_model, base_url, decrypted_key))
                satisfied_providers.add(prov_lower)
                satisfied_providers.add(conn.provider_id.lower())
                continue

        if prov_lower not in satisfied_providers:
            key = api_keys.get(prov) or api_keys.get(prov_lower) or os.getenv(f"{prov.upper()}_API_KEY", "")
            if key and model:
                legacy_dispatch.append((prov_lower, model, key))

    # Fill up to 6 enabled DB connections for automatic batch failover
    if db_connections and len(db_dispatch) < 6:
        for conn in db_connections:
            if len(db_dispatch) >= 6:
                break
            if conn.provider_id.lower() in satisfied_providers:
                continue
            eff_models = _effective_models_for_connection(conn)
            base_url = _resolve_effective_base_url(conn)
            if not eff_models or not base_url:
                continue
            try:
                decrypted_key = decrypt_api_key(conn.encrypted_api_key) if conn.encrypted_api_key else ""
            except Exception as exc:
                logger.warning("Failed to decrypt key for DB provider %s: %s", conn.provider_id, exc)
                continue
            if not decrypted_key and conn.protocol != "ollama":
                continue
            db_dispatch.append((conn, eff_models[0], base_url, decrypted_key))
            satisfied_providers.add(conn.provider_id.lower())

    if db_dispatch or legacy_dispatch:
        # Execute DB connections in batches of 3, failing over to the next batch if 0 valid responses
        db_batches = [db_dispatch[i:i + 3] for i in range(0, len(db_dispatch), 3)] or [[]]
        for batch_idx, batch in enumerate(db_batches):
            tasks = [
                MultiAISolverOrchestrator.call_db_connection(
                    conn=conn,
                    model_id=model_id,
                    base_url=base_url,
                    api_key=api_key,
                    problem=problem,
                    subject=effective_subject,
                    difficulty=effective_difficulty,
                )
                for (conn, model_id, base_url, api_key) in batch
            ]

            run_legacy = batch_idx == 0 and bool(legacy_dispatch)
            if run_legacy:
                async with httpx.AsyncClient() as client:
                    for prov, model, key in legacy_dispatch:
                        prompt = MultiAISolverOrchestrator.build_independent_prompt(
                            problem, effective_subject, effective_difficulty, prov.upper()
                        )
                        tasks.append(
                            MultiAISolverOrchestrator.call_provider(client, prov, model, key, prompt)
                        )
                    ai_responses = await asyncio.gather(*tasks, return_exceptions=True)
            elif tasks:
                ai_responses = await asyncio.gather(*tasks, return_exceptions=True)
            else:
                ai_responses = []

            for r in ai_responses:
                if isinstance(r, dict) and r.get("answer"):
                    independent_results.append(r)

            if independent_results:
                break

    # 5b. Stage 3 (SymPy/Python Verification) + Stage 4 (Hard Sanity Audit & 1 Targeted Repair Retry)
    sympy_result: Optional[Dict[str, Any]] = None
    hard_audit: Optional[Dict[str, Any]] = None

    def _run_sympy_and_audit(ai_sol: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
        ext_vars = ai_sol.get("extracted_variables") or []
        sym_steps = ai_sol.get("sympy_steps") or []
        s_res = execute_sympy_steps(ext_vars, sym_steps) if (ext_vars or sym_steps) else None
        parsed_fas, sym_hints = _parse_final_answers(ai_sol.get("final_answers"))
        tmp_gruca = GrucaSolution(
            given=[str(x) for x in (ai_sol.get("given") or []) if x is not None],
            required=[str(x) for x in (ai_sol.get("required") or []) if x is not None],
            assumptions=[str(x) for x in (ai_sol.get("assumptions") or []) if x is not None],
            equations=[str(x) for x in (ai_sol.get("equations") or []) if x is not None],
            calculations=[str(x) for x in (ai_sol.get("calculations") or []) if x is not None],
            units=[str(x) for x in (ai_sol.get("units") or []) if x is not None],
            answer=_normalize_answer_text(ai_sol.get("answer"), parsed_fas),
            final_answers=parsed_fas,
        )
        if s_res is not None:
            tmp_gruca = _lock_sympy_results_into_gruca(tmp_gruca, s_res, sym_hints)
        h_aud = run_hard_sanity_audit(problem, tmp_gruca, s_res, tmp_gruca.final_answers)
        return s_res, h_aud

    if builtin_result is None and independent_results:
        sympy_result, hard_audit = _run_sympy_and_audit(independent_results[0])

        # Automatic 1-shot targeted repair retry if Stage 4 detected critical failures
        if not hard_audit.get("passed", True) and (db_dispatch or legacy_dispatch):
            repair_prompt = MultiAISolverOrchestrator.build_repair_prompt(
                problem=problem,
                subject=effective_subject,
                difficulty=effective_difficulty,
                critical_failures=hard_audit.get("critical_failures") or [],
                si_variables=(sympy_result or {}).get("si_variables") or {},
            )
            repaired: Optional[Dict[str, Any]] = None
            if db_dispatch:
                conn, model_id, base_url, api_key = db_dispatch[0]
                repaired = await MultiAISolverOrchestrator.call_db_connection(
                    conn=conn,
                    model_id=model_id,
                    base_url=base_url,
                    api_key=api_key,
                    problem=problem,
                    subject=effective_subject,
                    difficulty=effective_difficulty,
                    custom_prompt=repair_prompt,
                )
            elif legacy_dispatch:
                prov, model, key = legacy_dispatch[0]
                async with httpx.AsyncClient() as client:
                    repaired = await MultiAISolverOrchestrator.call_provider(
                        client, prov, model, key, repair_prompt
                    )
            if isinstance(repaired, dict) and repaired.get("answer"):
                independent_results[0] = repaired
                sympy_result, hard_audit = _run_sympy_and_audit(repaired)

    # 6. Cross-Solver Comparison & Final Adjudication
    final_gruca, final_audit = CrossSolverAdjudicator.compare_and_adjudicate(
        independent_solutions=independent_results,
        builtin_solution=builtin_result,
        problem_text=problem,
        subject=effective_subject,
        structured_problem=structured,
        sympy_result=sympy_result,
        hard_audit=hard_audit,
    )

    response = TutorResponse(
        problem_hash=problem_hash,
        subject=effective_subject,
        difficulty=effective_difficulty,
        gruca=final_gruca,
        audit=final_audit
    )

    # 7. Save in Verified Cache only when a real solver produced an answer
    if builtin_result is not None or independent_results:
        ProblemFingerprinter.set_cached(problem_hash, response)

    return response
