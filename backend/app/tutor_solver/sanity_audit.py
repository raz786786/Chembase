"""Stage 4: Hard Programmatic Engineering Sanity & Verification Auditor."""

from __future__ import annotations

import ast
import math
import re
from typing import Any, Dict, List, Optional


# ─── Sub-Question Counter ────────────────────────────────────────────────────


def count_prompt_subquestions(problem: str) -> int:
    """Count distinct numbered or lettered sub-questions in the user's problem statement.

    Recognizes patterns such as:
    - `1. ... 2. ... 3. ...`
    - `(1) ... (2) ...` or `1) ... 2) ...`
    - `(a) ... (b) ...` or `a) ... b) ...`
    Avoids false positives on decimal numbers like `0.2` or `1.5`.
    """
    if not problem or not isinstance(problem, str):
        return 1

    # Numbered sub-questions: start of string, newline, semicolon, or whitespace followed by `1.` / `(1)` / `1)`
    # Negative lookahead `(?!\d)` prevents matching `1.5` as `1.`
    num_matches = re.findall(
        r"(?:^|[\n\r;:]|\s)(?:\((\d{1,2})\)|(\d{1,2})[.)])(?=\s+[A-Za-z(])",
        problem,
    )
    distinct_nums = {int(m[0] or m[1]) for m in num_matches if (m[0] or m[1])}
    # Keep only sequential-like indices (1..20)
    distinct_nums = {n for n in distinct_nums if 1 <= n <= 20}

    # Lettered sub-questions: `(a)` or `a)` followed by space and word
    let_matches = re.findall(
        r"(?:^|[\n\r;:]|\s)(?:\(([a-h])\)|([a-h])\))(?=\s+[A-Za-z])",
        problem,
        flags=re.IGNORECASE,
    )
    distinct_lets = {(m[0] or m[1]).lower() for m in let_matches if (m[0] or m[1])}

    best = 1
    if len(distinct_nums) >= 2:
        best = max(best, len(distinct_nums))
    if len(distinct_lets) >= 2:
        best = max(best, len(distinct_lets))
    return best


# ─── Printed Arithmetic Verifier ─────────────────────────────────────────────

_ALLOWED_FUNCS = {"log", "ln", "log10", "exp", "sqrt", "abs"}
_ALLOWED_CONSTS = {"pi", "e"}


def _safe_eval_arithmetic(expr_str: str) -> Optional[float]:
    """Safely evaluate a pure numeric arithmetic expression using Python AST."""
    cleaned = (
        expr_str.strip()
        .replace("^", "**")
        .replace("×", "*")
        .replace("·", "*")
        .replace("÷", "/")
        .replace("−", "-")
    )
    if not cleaned:
        return None
    # Must contain at least one operator so plain numbers aren't re-evaluated against themselves
    if not re.search(r"[+\-*/]", cleaned):
        return None
    try:
        tree = ast.parse(cleaned, mode="eval").body
    except SyntaxError:
        return None

    def _eval(node: ast.AST) -> float:
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        if isinstance(node, ast.Name):
            name = node.id.lower()
            if name == "pi":
                return math.pi
            if name == "e":
                return math.e
            raise ValueError(f"Unknown symbol {node.id}")
        if isinstance(node, ast.BinOp):
            l, r = _eval(node.left), _eval(node.right)
            if isinstance(node.op, ast.Add):
                return l + r
            if isinstance(node.op, ast.Sub):
                return l - r
            if isinstance(node.op, ast.Mult):
                return l * r
            if isinstance(node.op, ast.Div):
                if r == 0:
                    raise ZeroDivisionError()
                return l / r
            if isinstance(node.op, ast.Pow):
                return l ** r
            raise ValueError("Unsupported op")
        if isinstance(node, ast.UnaryOp):
            v = _eval(node.operand)
            if isinstance(node.op, ast.USub):
                return -v
            if isinstance(node.op, ast.UAdd):
                return v
            raise ValueError("Unsupported unary op")
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            fn = node.func.id.lower()
            args = [_eval(a) for a in node.args]
            if len(args) != 1:
                raise ValueError("Expected 1 arg")
            if fn in ("log", "ln"):
                return math.log(args[0])
            if fn == "log10":
                return math.log10(args[0])
            if fn == "exp":
                return math.exp(args[0])
            if fn == "sqrt":
                return math.sqrt(args[0])
            if fn == "abs":
                return abs(args[0])
            raise ValueError(f"Unsupported func {fn}")
        raise ValueError("Unsupported node")

    try:
        res = float(_eval(tree))
        return res if math.isfinite(res) else None
    except Exception:
        return None


def _extract_leading_number(rhs: str) -> Optional[float]:
    """Extract the leading printed float from the RHS of an '=' segment."""
    s = rhs.strip()
    # Strip optional leading '~' or '≈'
    s = re.sub(r"^[~≈]+\s*", "", s)
    # Match scientific notation like 2.3e-5 or 2.3 * 10^-5 or plain float
    m_sci = re.match(r"^([+-]?\d+(?:\.\d+)?)\s*[×x*]\s*10\^?([+-]?\d+)", s)
    if m_sci:
        try:
            return float(m_sci.group(1)) * (10.0 ** int(m_sci.group(2)))
        except ValueError:
            return None
    m = re.match(r"^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)", s)
    if not m:
        return None
    # Make sure it's not immediately followed by an arithmetic operator continuing another expression
    rest = s[m.end():].lstrip()
    if rest and rest[0] in ("+", "-", "*", "/", "^", "×", "·", "÷"):
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def verify_printed_arithmetic(calculations: List[str], rel_tol: float = 0.02) -> List[str]:
    """Scan calculation steps for `<arithmetic_expr> = <number>` and flag discrepancies > 2%."""
    mismatches: List[str] = []
    for step in calculations or []:
        if not isinstance(step, str) or "=" not in step:
            continue
        # Split into clauses separated by ';' or ',' when multiple equations appear on one line
        clauses = re.split(r"[;,]|\.\s+(?=[A-Za-z])", step)
        for clause in clauses:
            if "=" not in clause:
                continue
            parts = clause.split("=")
            for i in range(len(parts) - 1):
                lhs_raw = parts[i].strip()
                rhs_raw = parts[i + 1].strip()
                # Strip leading label like "Step 1 (Duty):" if present
                if ":" in lhs_raw:
                    lhs_raw = lhs_raw.split(":", 1)[1].strip()
                computed = _safe_eval_arithmetic(lhs_raw)
                if computed is None:
                    continue
                printed = _extract_leading_number(rhs_raw)
                if printed is None:
                    continue
                denom = max(abs(computed), abs(printed), 1e-12)
                rel_err = abs(computed - printed) / denom
                if rel_err > rel_tol:
                    mismatches.append(
                        f"Arithmetic mismatch in calculation: '{lhs_raw}' evaluates to "
                        f"{computed:.6g}, but printed value is {printed:.6g} "
                        f"({rel_err * 100:.1f}% error > {rel_tol * 100:.0f}% tolerance)."
                    )
    return mismatches


# ─── Hard Programmatic Sanity Auditor ────────────────────────────────────────

_ELEVATION_PROMPT_RE = re.compile(
    r"\b(elevation|height|lift|vertical\s+rise|static\s+head)\b|\bm\s+above\b|Δz|delta_z",
    re.IGNORECASE,
)
_HORIZONTAL_ASSUMPTION_RE = re.compile(
    r"\b(horizontal|neglecting\s+elevation|zero\s+elevation|no\s+elevation|Δz\s*=\s*0)\b",
    re.IGNORECASE,
)
_LIQUID_PIPE_PROMPT_RE = re.compile(
    r"\b(water|methanol|ethanol|oil|liquid|pipe|pump|pumping|brine|benzene|toluene)\b",
    re.IGNORECASE,
)


def run_hard_sanity_audit(
    problem: str,
    gruca: Any,
    sympy_result: Optional[Dict[str, Any]],
    final_answers: List[Any],
) -> Dict[str, Any]:
    """Run Stage 4 hard programmatic assertions on a Tutor solution."""
    critical_failures: List[str] = []
    warnings: List[str] = []
    notes: List[str] = []

    # 1. Sub-question coverage check
    expected_q = count_prompt_subquestions(problem)
    if expected_q >= 2 and len(final_answers or []) < expected_q:
        critical_failures.append(
            f"Incomplete sub-question coverage: prompt asks {expected_q} sub-questions, "
            f"but only {len(final_answers or [])} final_answers were provided."
        )
    elif expected_q >= 2:
        notes.append(f"✓ All {expected_q} prompt sub-questions are covered in final_answers.")

    # 2. Printed arithmetic check
    calcs = getattr(gruca, "calculations", []) if gruca is not None else []
    arith_errors = verify_printed_arithmetic(calcs)
    if arith_errors:
        critical_failures.extend(arith_errors)
    elif calcs:
        notes.append("✓ Printed arithmetic expressions passed 2% tolerance verification.")

    # 3. False horizontal-pipe assumption check
    assumptions = getattr(gruca, "assumptions", []) if gruca is not None else []
    assumptions_blob = " ".join(str(a) for a in assumptions)
    if _ELEVATION_PROMPT_RE.search(problem or "") and _HORIZONTAL_ASSUMPTION_RE.search(assumptions_blob):
        critical_failures.append(
            "Contradictory assumption detected: problem specifies an elevation/lift change, "
            "but assumptions claim a horizontal pipe or neglect elevation."
        )

    # 4. Physical bounds on SymPy computed values
    computed: Dict[str, float] = {}
    if isinstance(sympy_result, dict):
        raw_comp = sympy_result.get("computed")
        if isinstance(raw_comp, dict):
            computed = {str(k): float(v) for k, v in raw_comp.items() if isinstance(v, (int, float))}

        # Check SymPy execution errors
        sym_errors = sympy_result.get("errors") or []
        if sym_errors:
            warnings.extend([f"SymPy execution warning: {e}" for e in sym_errors])

        # Check conservation residuals
        for res_key in ("mass_balance_residual", "energy_balance_residual"):
            res_val = sympy_result.get(res_key)
            if isinstance(res_val, (int, float)) and res_val > 1e-3:
                critical_failures.append(
                    f"Conservation residual failure: {res_key} = {res_val:.4e} exceeds 1e-3."
                )

    fraction_keys = {"x1", "x2", "y1", "y2", "z1", "z2", "v_over_f", "vf", "l_over_f", "eta", "efficiency", "xa", "x_a"}
    positive_keys = {"a", "area", "a_m2", "v_reactor", "volume", "re", "reynolds", "lmtd", "lmtd_k", "f", "friction_factor"}
    velocity_keys = {"vel", "vel_ms", "velocity", "v_flow"}

    is_liquid_pipe = bool(_LIQUID_PIPE_PROMPT_RE.search(problem or ""))

    for sym, val in computed.items():
        s_low = sym.lower()
        if s_low in fraction_keys:
            if not (0.0 <= val <= 1.0 + 1e-6):
                critical_failures.append(
                    f"Physical bound violation: {sym} = {val:.4g} is outside [0, 1]."
                )
        if s_low in positive_keys:
            if val <= 0.0:
                critical_failures.append(
                    f"Physical bound violation: {sym} = {val:.4g} must be strictly positive (> 0)."
                )
        if is_liquid_pipe and s_low in velocity_keys and val > 8.0:
            warnings.append(
                f"Unusually high liquid pipe velocity ({sym} = {val:.2f} m/s > 8.0 m/s). "
                "Verify volumetric flow rate unit conversion (e.g., L/min → m³/s)."
            )

    # Also check final_answers for liquid pipe velocity > 8.0 m/s if not already caught
    if is_liquid_pipe:
        for item in final_answers or []:
            lbl = (getattr(item, "label", None) or (item.get("label") if isinstance(item, dict) else "") or "").lower()
            unit = (getattr(item, "unit", None) or (item.get("unit") if isinstance(item, dict) else "") or "").lower()
            raw_v = getattr(item, "value", None) if not isinstance(item, dict) else item.get("value")
            if "velocity" in lbl and "m/s" in unit:
                try:
                    v_num = float(re.search(r"[+-]?\d+(?:\.\d+)?", str(raw_v)).group(0))  # type: ignore[union-attr]
                    if v_num > 8.0 and not any("velocity" in w.lower() for w in warnings):
                        warnings.append(
                            f"Unusually high liquid pipe velocity ({v_num:.2f} m/s > 8.0 m/s). "
                            "Verify volumetric flow rate unit conversion (e.g., L/min → m³/s)."
                        )
                except Exception:
                    pass

    passed = len(critical_failures) == 0
    if passed and not notes:
        notes.append("✓ Solution passed Stage 4 programmatic sanity audit.")

    return {
        "passed": passed,
        "critical_failures": critical_failures,
        "warnings": warnings,
        "notes": notes,
    }
