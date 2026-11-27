"""ChemBase Pro — 4-Stage Python/SymPy Chemical Engineering Tutor Verification Package."""

from .units import convert_to_si, normalize_symbol
from .sympy_executor import (
    EQUATION_REGISTRY_PROMPT,
    execute_sympy_steps,
    solve_heat_exchanger_system,
    solve_pipe_flow_system,
    solve_vle_margules_flash,
)
from .sanity_audit import (
    count_prompt_subquestions,
    run_hard_sanity_audit,
    verify_printed_arithmetic,
)

__all__ = [
    "convert_to_si",
    "normalize_symbol",
    "EQUATION_REGISTRY_PROMPT",
    "execute_sympy_steps",
    "solve_pipe_flow_system",
    "solve_heat_exchanger_system",
    "solve_vle_margules_flash",
    "count_prompt_subquestions",
    "verify_printed_arithmetic",
    "run_hard_sanity_audit",
]
