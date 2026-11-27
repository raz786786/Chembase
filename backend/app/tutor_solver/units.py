"""Stage 1: Deterministic SI Unit Converter & ASCII SymPy Symbol Normalizer."""

from __future__ import annotations

import re
from typing import Dict, Tuple

# Unicode superscript / subscript normalization maps
_SUPERSCRIPT_MAP = str.maketrans({
    "²": "2",
    "³": "3",
    "¹": "1",
    "⁰": "0",
    "⁻": "-",
    "·": "*",
    "•": "*",
    "⋅": "*",
    "×": "*",
})

_SUBSCRIPT_MAP = str.maketrans({
    "₀": "0",
    "₁": "1",
    "₂": "2",
    "₃": "3",
    "₄": "4",
    "₅": "5",
    "₆": "6",
    "₇": "7",
    "₈": "8",
    "₉": "9",
    "ₐ": "a",
    "ₑ": "e",
    "ₕ": "h",
    "ᵢ": "i",
    "ⱼ": "j",
    "ₖ": "k",
    "ₗ": "l",
    "ₘ": "m",
    "ₙ": "n",
    "ₒ": "o",
    "ₚ": "p",
    "ᵣ": "r",
    "ₛ": "s",
    "ₜ": "t",
    "ᵤ": "u",
    "ᵥ": "v",
    "ₓ": "x",
})

_GREEK_TO_ASCII: Dict[str, str] = {
    "μ": "mu",
    "µ": "mu",
    "ρ": "rho",
    "ν": "nu",
    "ε": "eps",
    "ϵ": "eps",
    "η": "eta",
    "Δ": "delta_",
    "∆": "delta_",
    "α": "alpha",
    "β": "beta",
    "γ": "gamma",
    "λ": "lam",
    "τ": "tau",
    "π": "pi",
    "θ": "theta",
    "σ": "sigma",
    "φ": "phi",
    "ϕ": "phi",
    "ω": "omega",
}

# Exact NIST / SI multiplicative conversion factors: normalized_unit -> (factor, canonical_si_unit)
_MULTIPLICATIVE_CONVERSIONS: Dict[str, Tuple[float, str]] = {
    # Volumetric flow rate -> m³/s
    "l/min": (1.0 / 60000.0, "m³/s"),
    "l/s": (1e-3, "m³/s"),
    "l/h": (1.0 / 3.6e6, "m³/s"),
    "l/hr": (1.0 / 3.6e6, "m³/s"),
    "m3/h": (1.0 / 3600.0, "m³/s"),
    "m3/hr": (1.0 / 3600.0, "m³/s"),
    "m3/min": (1.0 / 60.0, "m³/s"),
    "m3/s": (1.0, "m³/s"),
    "gpm": (6.30901964e-5, "m³/s"),
    "ft3/s": (0.0283168466, "m³/s"),
    "cfm": (0.000471947443, "m³/s"),
    "ft3/min": (0.000471947443, "m³/s"),
    # Length -> m
    "mm": (1e-3, "m"),
    "cm": (1e-2, "m"),
    "m": (1.0, "m"),
    "km": (1e3, "m"),
    "in": (0.0254, "m"),
    "inch": (0.0254, "m"),
    "inches": (0.0254, "m"),
    "ft": (0.3048, "m"),
    "foot": (0.3048, "m"),
    "feet": (0.3048, "m"),
    # Pressure -> Pa
    "pa": (1.0, "Pa"),
    "kpa": (1e3, "Pa"),
    "kpag": (1e3, "Pa"),
    "kpaa": (1e3, "Pa"),
    "mpa": (1e6, "Pa"),
    "bar": (1e5, "Pa"),
    "barg": (1e5, "Pa"),
    "bara": (1e5, "Pa"),
    "atm": (101325.0, "Pa"),
    "psi": (6894.75729, "Pa"),
    "psig": (6894.75729, "Pa"),
    "psia": (6894.75729, "Pa"),
    "mmhg": (133.322368, "Pa"),
    "torr": (133.322368, "Pa"),
    # Dynamic viscosity -> Pa·s
    "pa*s": (1.0, "Pa·s"),
    "pas": (1.0, "Pa·s"),
    "n*s/m2": (1.0, "Pa·s"),
    "kg/(m*s)": (1.0, "Pa·s"),
    "kg/m*s": (1.0, "Pa·s"),
    "mpa*s": (1e-3, "Pa·s"),
    "mpas": (1e-3, "Pa·s"),
    "cp": (1e-3, "Pa·s"),
    "p": (0.1, "Pa·s"),
    "poise": (0.1, "Pa·s"),
    # Kinematic viscosity -> m²/s
    "m2/s": (1.0, "m²/s"),
    "cst": (1e-6, "m²/s"),
    # Density -> kg/m³
    "kg/m3": (1.0, "kg/m³"),
    "g/cm3": (1000.0, "kg/m³"),
    "g/ml": (1000.0, "kg/m³"),
    "kg/l": (1000.0, "kg/m³"),
    "lb/ft3": (16.0184634, "kg/m³"),
    "lbm/ft3": (16.0184634, "kg/m³"),
    # Specific heat capacity -> J/kg·K
    "j/kg*k": (1.0, "J/kg·K"),
    "j/(kg*k)": (1.0, "J/kg·K"),
    "j/kgk": (1.0, "J/kg·K"),
    "j/kg*c": (1.0, "J/kg·K"),
    "j/(kg*c)": (1.0, "J/kg·K"),
    "j/kg*°c": (1.0, "J/kg·K"),
    "j/(kg*°c)": (1.0, "J/kg·K"),
    "kj/kg*k": (1000.0, "J/kg·K"),
    "kj/(kg*k)": (1000.0, "J/kg·K"),
    "kj/kgk": (1000.0, "J/kg·K"),
    "kj/kg*c": (1000.0, "J/kg·K"),
    "kj/(kg*c)": (1000.0, "J/kg·K"),
    "kj/kg*°c": (1000.0, "J/kg·K"),
    "kj/(kg*°c)": (1000.0, "J/kg·K"),
    "j/g*k": (1000.0, "J/kg·K"),
    "j/(g*k)": (1000.0, "J/kg·K"),
    "j/gk": (1000.0, "J/kg·K"),
    "cal/g*k": (4186.8, "J/kg·K"),
    "cal/(g*k)": (4186.8, "J/kg·K"),
    "cal/g*c": (4186.8, "J/kg·K"),
    "btu/lb*f": (4186.8, "J/kg·K"),
    "btu/(lb*f)": (4186.8, "J/kg·K"),
    "btu/lb*°f": (4186.8, "J/kg·K"),
    "btu/(lb*°f)": (4186.8, "J/kg·K"),
    "btu/(lbm*f)": (4186.8, "J/kg·K"),
    # Power / Heat duty -> W
    "w": (1.0, "W"),
    "j/s": (1.0, "W"),
    "kw": (1e3, "W"),
    "kj/s": (1e3, "W"),
    "mw": (1e6, "W"),
    "kj/h": (1000.0 / 3600.0, "W"),
    "kj/hr": (1000.0 / 3600.0, "W"),
    "btu/h": (0.29307107, "W"),
    "btu/hr": (0.29307107, "W"),
    "hp": (745.699872, "W"),
    # Heat transfer coefficient -> W/m²·K
    "w/m2*k": (1.0, "W/m²·K"),
    "w/(m2*k)": (1.0, "W/m²·K"),
    "w/m2k": (1.0, "W/m²·K"),
    "w/m2*c": (1.0, "W/m²·K"),
    "w/(m2*c)": (1.0, "W/m²·K"),
    "w/m2*°c": (1.0, "W/m²·K"),
    "w/(m2*°c)": (1.0, "W/m²·K"),
    "kw/m2*k": (1000.0, "W/m²·K"),
    "kw/(m2*k)": (1000.0, "W/m²·K"),
    "kw/m2k": (1000.0, "W/m²·K"),
    "kw/m2*c": (1000.0, "W/m²·K"),
    # Mass -> kg
    "g": (1e-3, "kg"),
    "kg": (1.0, "kg"),
    "lb": (0.45359237, "kg"),
    "lbm": (0.45359237, "kg"),
    # Mass flow rate -> kg/s
    "kg/s": (1.0, "kg/s"),
    "kg/min": (1.0 / 60.0, "kg/s"),
    "kg/h": (1.0 / 3600.0, "kg/s"),
    "kg/hr": (1.0 / 3600.0, "kg/s"),
    "g/s": (1e-3, "kg/s"),
    # Area & Volume
    "m2": (1.0, "m²"),
    "cm2": (1e-4, "m²"),
    "mm2": (1e-6, "m²"),
    "l": (1e-3, "m³"),
    "liter": (1e-3, "m³"),
    "liters": (1e-3, "m³"),
    "m3": (1.0, "m³"),
    # Time
    "s": (1.0, "s"),
    "sec": (1.0, "s"),
    "min": (60.0, "s"),
    "h": (3600.0, "s"),
    "hr": (3600.0, "s"),
    # Fractions / percentages
    "%": (0.01, "fraction"),
    "wt%": (0.01, "fraction"),
    "mol%": (0.01, "fraction"),
    "vol%": (0.01, "fraction"),
    "percent": (0.01, "fraction"),
}


def _normalize_unit_key(unit: str) -> str:
    """Normalize a raw unit string for lookup."""
    u = (unit or "").strip().translate(_SUPERSCRIPT_MAP)
    u = re.sub(r"\s+", "", u).lower()
    return u


def convert_to_si(value: float, unit: str, is_delta: bool = False) -> Tuple[float, str]:
    """Deterministically convert a numeric engineering quantity into canonical SI units.

    Parameters
    ----------
    value : float
        Raw numeric magnitude.
    unit : str
        Raw unit string (e.g., 'L/min', 'mm', '°C', 'cP', 'kJ/kg·K').
    is_delta : bool, optional
        If True, temperatures are treated as temperature differences (e.g. ΔT = 30 °C -> 30 K).
    """
    val = float(value)
    raw_unit = (unit or "").strip()
    if not raw_unit:
        return (val, "")

    u = _normalize_unit_key(raw_unit)

    # Temperature handling (absolute vs delta)
    if u in ("°c", "c", "degc", "celsius"):
        return (val if is_delta else val + 273.15, "K")
    if u in ("°f", "f", "degf", "fahrenheit"):
        return (val * 5.0 / 9.0 if is_delta else (val - 32.0) * 5.0 / 9.0 + 273.15, "K")
    if u in ("k", "kelvin"):
        return (val, "K")
    if u in ("r", "°r", "degr", "rankine"):
        return (val * 5.0 / 9.0, "K")

    if u in _MULTIPLICATIVE_CONVERSIONS:
        factor, target_unit = _MULTIPLICATIVE_CONVERSIONS[u]
        return (val * factor, target_unit)

    return (val, raw_unit)


def normalize_symbol(sym: str) -> str:
    """Normalize a variable name to a clean, unambiguous ASCII SymPy identifier.

    Ensures Greek symbols map deterministically (μ->mu, ρ->rho, ν->nu, ε->eps, η->eta, Δ->delta_)
    and prevents velocity ('vel') from colliding with kinematic viscosity ('nu').
    """
    if not sym or not isinstance(sym, str):
        return "var"

    s = sym.strip().translate(_SUBSCRIPT_MAP)
    for greek, ascii_rep in _GREEK_TO_ASCII.items():
        s = s.replace(greek, ascii_rep)

    # Replace whitespace, punctuation, and separators with underscores
    s = re.sub(r"[^A-Za-z0-9_]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")

    if not s:
        return "var"
    if s[0].isdigit():
        s = f"v_{s}"

    return s
