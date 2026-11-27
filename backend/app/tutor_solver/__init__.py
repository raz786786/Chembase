"""ChemBase Pro — 4-Stage Python/SymPy Chemical Engineering Tutor Verification Package."""

from .units import convert_to_si, normalize_symbol
from .properties import (
    ANTOINE_COEFFS,
    CRITICAL_PROPERTIES,
    antoine_psat_pa,
    build_verified_property_context,
    detect_property_context,
    fetch_pubchem_properties,
    get_air_properties,
    get_coolprop_properties,
    get_critical_properties,
    get_steam_properties,
    get_water_properties,
)
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
    "ANTOINE_COEFFS",
    "CRITICAL_PROPERTIES",
    "get_water_properties",
    "get_air_properties",
    "antoine_psat_pa",
    "get_critical_properties",
    "get_steam_properties",
    "get_coolprop_properties",
    "fetch_pubchem_properties",
    "detect_property_context",
    "build_verified_property_context",
    "EQUATION_REGISTRY_PROMPT",
    "execute_sympy_steps",
    "solve_pipe_flow_system",
    "solve_heat_exchanger_system",
    "solve_vle_margules_flash",
    "count_prompt_subquestions",
    "verify_printed_arithmetic",
    "run_hard_sanity_audit",
]
