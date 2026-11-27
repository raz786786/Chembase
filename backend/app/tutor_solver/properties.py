"""Multi-Tier Verified Physical Property Engine:
- Tier 1: Built-in NIST / Perry's Chemical Engineering Physical Property Lookup Tables
- Tier 2A: IAPWS-97 Steam & Water Formulation (iapws)
- Tier 2B: CoolProp Real Fluid Equations of State (CoolProp)
- Tier 2C: Live Async PubChem Compound Lookup Fallback (httpx)
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote

import httpx

MMHG_TO_PA = 133.322368

# ─── Tier 1: Saturated Liquid Water (0–100 °C, NIST / Perry's) ──────────────
# Tuple: (T_C, rho_kgm3, mu_Pas, Cp_JkgK, k_WmK, Pr, Psat_Pa)
_WATER_TABLE: List[Tuple[float, float, float, float, float, float, float]] = [
    (0.0, 999.84, 1.792e-3, 4217.0, 0.561, 13.47, 611.3),
    (5.0, 999.97, 1.519e-3, 4202.0, 0.571, 11.18, 872.6),
    (10.0, 999.70, 1.307e-3, 4192.0, 0.580, 9.45, 1228.1),
    (15.0, 999.10, 1.138e-3, 4186.0, 0.589, 8.09, 1705.6),
    (20.0, 998.2, 1.002e-3, 4184.0, 0.598, 7.01, 2338.8),
    (25.0, 997.0, 8.904e-4, 4180.0, 0.607, 6.13, 3169.0),
    (30.0, 995.6, 7.975e-4, 4178.0, 0.615, 5.42, 4245.5),
    (40.0, 992.2, 6.532e-4, 4179.0, 0.631, 4.33, 7381.4),
    (50.0, 988.0, 5.471e-4, 4181.0, 0.644, 3.55, 12344.0),
    (60.0, 983.2, 4.665e-4, 4185.0, 0.654, 2.99, 19932.0),
    (70.0, 977.8, 4.042e-4, 4190.0, 0.663, 2.55, 31176.0),
    (80.0, 971.8, 3.54e-4, 4196.0, 0.670, 2.22, 47373.0),
    (90.0, 965.3, 3.145e-4, 4205.0, 0.675, 1.96, 70117.0),
    (100.0, 958.4, 2.82e-4, 4216.0, 0.679, 1.75, 101325.0),
]

# ─── Tier 1: Dry Air at 1 atm (0–400 °C, NIST / Incropera / Perry's) ────────
# Tuple: (T_C, rho_kgm3, mu_Pas, Cp_JkgK, k_WmK, Pr)
_AIR_TABLE: List[Tuple[float, float, float, float, float, float]] = [
    (0.0, 1.292, 1.729e-5, 1006.0, 0.0243, 0.715),
    (20.0, 1.204, 1.825e-5, 1007.0, 0.0257, 0.713),
    (25.0, 1.184, 1.849e-5, 1007.0, 0.0261, 0.713),
    (40.0, 1.127, 1.918e-5, 1007.0, 0.0271, 0.711),
    (60.0, 1.060, 2.008e-5, 1008.0, 0.0285, 0.709),
    (80.0, 1.000, 2.096e-5, 1009.0, 0.0299, 0.708),
    (100.0, 0.946, 2.181e-5, 1011.0, 0.0314, 0.703),
    (150.0, 0.834, 2.386e-5, 1017.0, 0.0349, 0.695),
    (200.0, 0.746, 2.577e-5, 1025.0, 0.0383, 0.689),
    (250.0, 0.675, 2.760e-5, 1034.0, 0.0417, 0.684),
    (300.0, 0.616, 2.934e-5, 1045.0, 0.0450, 0.681),
    (350.0, 0.566, 3.101e-5, 1057.0, 0.0483, 0.679),
    (400.0, 0.524, 3.261e-5, 1069.0, 0.0515, 0.677),
]

# ─── Antoine Vapor Pressure Constants: log10(P_mmHg) = A - B / (T_C + C) ────
# Source: Lange's Handbook of Chemistry / Perry's / NIST WebBook
ANTOINE_COEFFS: Dict[str, Tuple[float, float, float]] = {
    "water": (8.07131, 1730.63, 233.426),
    "methanol": (8.08097, 1582.271, 239.726),
    "ethanol": (8.11220, 1592.864, 226.184),
    "benzene": (6.90565, 1211.033, 220.790),
    "toluene": (6.95464, 1344.800, 219.482),
    "acetone": (7.02447, 1161.000, 224.000),
    "n-hexane": (6.87776, 1171.530, 224.366),
    "n-heptane": (6.89677, 1264.900, 216.544),
    "cyclohexane": (6.84498, 1203.526, 222.863),
    "acetic acid": (7.38782, 1533.313, 222.309),
    "chloroform": (6.95465, 1170.966, 226.232),
    "n-pentane": (6.85221, 1064.630, 232.000),
    "n-butane": (6.80896, 935.860, 238.730),
    "propane": (6.80338, 804.000, 247.040),
    "ammonia": (7.55466, 1002.711, 247.885),
    "diethyl ether": (6.92032, 1064.066, 228.799),
    "isopropanol": (8.11778, 1580.920, 219.610),
    "ethyl acetate": (7.10179, 1244.951, 217.881),
    "styrene": (6.95711, 1445.580, 209.430),
    "o-xylene": (6.99891, 1474.679, 213.686),
    "n-octane": (6.91874, 1351.756, 209.100),
    "carbon tetrachloride": (6.87926, 1212.021, 226.409),
}

# ─── Critical Properties (NIST / Smith-Van Ness-Abbott / Perry's) ───────────
CRITICAL_PROPERTIES: Dict[str, Dict[str, float]] = {
    "water": {"MW_gmol": 18.015, "Tc_K": 647.10, "Pc_Pa": 22.064e6, "omega": 0.3449},
    "methane": {"MW_gmol": 16.043, "Tc_K": 190.56, "Pc_Pa": 4.599e6, "omega": 0.0115},
    "ethane": {"MW_gmol": 30.070, "Tc_K": 305.32, "Pc_Pa": 4.872e6, "omega": 0.0995},
    "propane": {"MW_gmol": 44.097, "Tc_K": 369.83, "Pc_Pa": 4.248e6, "omega": 0.1523},
    "n-butane": {"MW_gmol": 58.123, "Tc_K": 425.12, "Pc_Pa": 3.796e6, "omega": 0.2002},
    "n-pentane": {"MW_gmol": 72.150, "Tc_K": 469.70, "Pc_Pa": 3.370e6, "omega": 0.2515},
    "n-hexane": {"MW_gmol": 86.177, "Tc_K": 507.60, "Pc_Pa": 3.025e6, "omega": 0.3013},
    "n-heptane": {"MW_gmol": 100.204, "Tc_K": 540.20, "Pc_Pa": 2.740e6, "omega": 0.3495},
    "n-octane": {"MW_gmol": 114.231, "Tc_K": 568.70, "Pc_Pa": 2.490e6, "omega": 0.3996},
    "benzene": {"MW_gmol": 78.114, "Tc_K": 562.05, "Pc_Pa": 4.895e6, "omega": 0.2103},
    "toluene": {"MW_gmol": 92.141, "Tc_K": 591.75, "Pc_Pa": 4.108e6, "omega": 0.2640},
    "cyclohexane": {"MW_gmol": 84.161, "Tc_K": 553.60, "Pc_Pa": 4.075e6, "omega": 0.2096},
    "methanol": {"MW_gmol": 32.042, "Tc_K": 512.64, "Pc_Pa": 8.097e6, "omega": 0.5640},
    "ethanol": {"MW_gmol": 46.069, "Tc_K": 513.92, "Pc_Pa": 6.148e6, "omega": 0.6436},
    "isopropanol": {"MW_gmol": 60.096, "Tc_K": 508.30, "Pc_Pa": 4.762e6, "omega": 0.6650},
    "acetone": {"MW_gmol": 58.080, "Tc_K": 508.10, "Pc_Pa": 4.700e6, "omega": 0.3071},
    "acetic acid": {"MW_gmol": 60.052, "Tc_K": 591.95, "Pc_Pa": 5.786e6, "omega": 0.4665},
    "chloroform": {"MW_gmol": 119.378, "Tc_K": 536.40, "Pc_Pa": 5.472e6, "omega": 0.2219},
    "diethyl ether": {"MW_gmol": 74.123, "Tc_K": 466.70, "Pc_Pa": 3.640e6, "omega": 0.2810},
    "ethyl acetate": {"MW_gmol": 88.106, "Tc_K": 523.30, "Pc_Pa": 3.880e6, "omega": 0.3664},
    "styrene": {"MW_gmol": 104.152, "Tc_K": 636.00, "Pc_Pa": 3.840e6, "omega": 0.2971},
    "o-xylene": {"MW_gmol": 106.167, "Tc_K": 630.30, "Pc_Pa": 3.732e6, "omega": 0.3127},
    "ammonia": {"MW_gmol": 17.031, "Tc_K": 405.40, "Pc_Pa": 11.333e6, "omega": 0.2560},
    "nitrogen": {"MW_gmol": 28.013, "Tc_K": 126.20, "Pc_Pa": 3.398e6, "omega": 0.0377},
    "oxygen": {"MW_gmol": 31.999, "Tc_K": 154.58, "Pc_Pa": 5.043e6, "omega": 0.0222},
    "carbon dioxide": {"MW_gmol": 44.010, "Tc_K": 304.13, "Pc_Pa": 7.377e6, "omega": 0.2239},
    "hydrogen": {"MW_gmol": 2.016, "Tc_K": 33.19, "Pc_Pa": 1.313e6, "omega": -0.2160},
    "ethylene": {"MW_gmol": 28.054, "Tc_K": 282.34, "Pc_Pa": 5.041e6, "omega": 0.0862},
    "carbon monoxide": {"MW_gmol": 28.010, "Tc_K": 132.86, "Pc_Pa": 3.494e6, "omega": 0.0497},
}

_SPECIES_ALIASES: Dict[str, str] = {
    "h2o": "water",
    "ch4": "methane",
    "c2h6": "ethane",
    "c3h8": "propane",
    "butane": "n-butane",
    "c4h10": "n-butane",
    "pentane": "n-pentane",
    "c5h12": "n-pentane",
    "hexane": "n-hexane",
    "c6h14": "n-hexane",
    "heptane": "n-heptane",
    "c7h16": "n-heptane",
    "octane": "n-octane",
    "c8h18": "n-octane",
    "c6h6": "benzene",
    "nh3": "ammonia",
    "n2": "nitrogen",
    "o2": "oxygen",
    "co2": "carbon dioxide",
    "h2": "hydrogen",
    "co": "carbon monoxide",
    "c2h4": "ethylene",
    "isopropyl alcohol": "isopropanol",
    "2-propanol": "isopropanol",
    "ipa": "isopropanol",
    "ether": "diethyl ether",
    "xylene": "o-xylene",
}

# ─── Tier 2B: CoolProp Real Fluid Name Mapping ───────────────────────────────
_COOLPROP_FLUID_MAP: Dict[str, str] = {
    "ammonia": "Ammonia",
    "nh3": "Ammonia",
    "co2": "CarbonDioxide",
    "carbon dioxide": "CarbonDioxide",
    "r134a": "R134a",
    "r-134a": "R134a",
    "r410a": "R410A",
    "r-410a": "R410A",
    "r32": "R32",
    "r-32": "R32",
    "r22": "R22",
    "r-22": "R22",
    "methane": "Methane",
    "ch4": "Methane",
    "ethane": "Ethane",
    "c2h6": "Ethane",
    "propane": "Propane",
    "c3h8": "Propane",
    "butane": "n-Butane",
    "n-butane": "n-Butane",
    "c4h10": "n-Butane",
    "isobutane": "IsoButane",
    "pentane": "n-Pentane",
    "n-pentane": "n-Pentane",
    "n-hexane": "n-Hexane",
    "hexane": "n-Hexane",
    "n-heptane": "n-Heptane",
    "heptane": "n-Heptane",
    "n-octane": "n-Octane",
    "octane": "n-Octane",
    "nitrogen": "Nitrogen",
    "n2": "Nitrogen",
    "oxygen": "Oxygen",
    "o2": "Oxygen",
    "hydrogen": "Hydrogen",
    "h2": "Hydrogen",
    "argon": "Argon",
    "helium": "Helium",
    "ethylene": "Ethylene",
    "propylene": "Propylene",
    "carbon monoxide": "CarbonMonoxide",
    "sulfur dioxide": "SulfurDioxide",
    "so2": "SulfurDioxide",
    "hydrogen sulfide": "HydrogenSulfide",
    "h2s": "HydrogenSulfide",
    "benzene": "Benzene",
    "toluene": "Toluene",
    "ethanol": "Ethanol",
    "methanol": "Methanol",
    "acetone": "Acetone",
    "air": "Air",
    "water": "Water",
    "steam": "Water",
    "h2o": "Water",
}

# ─── Tier 2C: Bounded PubChem In-Memory Cache ────────────────────────────────
_PUBCHEM_CACHE_MAX = 128
_PUBCHEM_CACHE: Dict[str, Optional[Dict[str, Any]]] = {}

_COMPOUND_STOPWORDS = frozenset({
    "the", "this", "that", "these", "those", "with", "from", "into", "onto",
    "pipe", "flow", "heat", "mass", "rate", "pump", "tank", "tube", "wall",
    "line", "unit", "area", "time", "work", "data", "pure", "cold", "warm",
    "ideal", "real", "fluid", "vapor", "steam", "water", "liquid", "solid",
    "gas", "air", "system", "stream", "feed", "product", "reactor", "column",
    "boiler", "turbine", "nozzle", "vessel", "process", "mixture", "solution",
    "pressure", "velocity", "diameter", "temperature", "exchanger", "condenser",
    "evaporator", "compressor", "distillation", "concentration", "efficiency",
    "conversion", "coefficient", "insulation", "atmosphere", "environment",
    "energy", "enthalpy", "entropy", "power", "force", "length", "height",
    "volume", "density", "viscosity", "conductivity", "capacity", "diffusivity",
    "friction", "roughness", "elevation", "head", "loss", "drop", "delta",
    "reaction", "kinetics", "catalyst", "stage", "plate", "shell", "baffle",
    "inlet", "outlet", "ambient", "surface", "shell-and-tube", "counterflow",
    "saturated", "superheated", "compressed", "subcooled", "isothermal",
    "adiabatic", "isobaric", "isochoric", "steady", "steady-state", "batch",
    "continuous", "laminar", "turbulent", "reynolds", "prandtl", "nusselt",
})


def _canonical_species(species: str) -> str:
    key = re.sub(r"\s+", " ", (species or "").strip().lower())
    return _SPECIES_ALIASES.get(key, key)


def _interpolate_table(
    table: List[Tuple[float, ...]],
    T_C: float,
    keys: Tuple[str, ...],
) -> Dict[str, float]:
    t_min = table[0][0]
    t_max = table[-1][0]
    t = max(t_min, min(t_max, float(T_C)))

    for idx in range(len(table) - 1):
        row0 = table[idx]
        row1 = table[idx + 1]
        if row0[0] <= t <= row1[0]:
            if row1[0] == row0[0]:
                frac = 0.0
            else:
                frac = (t - row0[0]) / (row1[0] - row0[0])
            return {
                k: row0[i + 1] + frac * (row1[i + 1] - row0[i + 1])
                for i, k in enumerate(keys)
            }

    last = table[-1]
    return {k: last[i + 1] for i, k in enumerate(keys)}


def get_water_properties(T_C: float) -> Dict[str, float]:
    """Return linearly interpolated liquid water properties (0–100 °C, NIST/Perry's)."""
    return _interpolate_table(
        _WATER_TABLE,
        T_C,
        ("rho_kgm3", "mu_Pas", "Cp_JkgK", "k_WmK", "Pr", "Psat_Pa"),
    )


def get_air_properties(T_C: float) -> Dict[str, float]:
    """Return linearly interpolated dry air properties at 1 atm (0–400 °C, NIST/Perry's)."""
    return _interpolate_table(
        _AIR_TABLE,
        T_C,
        ("rho_kgm3", "mu_Pas", "Cp_JkgK", "k_WmK", "Pr"),
    )


def antoine_psat_pa(species: str, T_C: float) -> Optional[float]:
    """Compute vapor pressure in Pa via Antoine equation: log10(P_mmHg) = A - B / (T_C + C)."""
    canon = _canonical_species(species)
    coeffs = ANTOINE_COEFFS.get(canon)
    if coeffs is None:
        return None
    a, b, c = coeffs
    denom = float(T_C) + c
    if denom <= 0.0:
        return None
    p_mmhg = 10.0 ** (a - b / denom)
    if not math.isfinite(p_mmhg):
        return None
    return p_mmhg * MMHG_TO_PA


def get_critical_properties(species: str) -> Optional[Dict[str, float]]:
    """Return critical properties (MW_gmol, Tc_K, Pc_Pa, omega) for a named species."""
    canon = _canonical_species(species)
    props = CRITICAL_PROPERTIES.get(canon)
    return dict(props) if props is not None else None


# ─── Tier 2A: IAPWS-97 Steam & Water Formulation ─────────────────────────────

def _clean_finite(val: Any, scale: float = 1.0) -> Optional[float]:
    if val is None:
        return None
    try:
        fval = float(val) * scale
        return fval if math.isfinite(fval) else None
    except (TypeError, ValueError):
        return None


def get_steam_properties(
    T_K: Optional[float] = None,
    P_Pa: Optional[float] = None,
    x: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    """Tier 2A: Verified IAPWS-97 steam and water thermodynamic & transport properties.

    Supports:
    - (T_K, P_Pa): single-phase liquid, superheated vapor, or supercritical water
    - (P_Pa, x): saturated liquid (x=0), saturated vapor (x=1), or two-phase mixture
    - (T_K, x): saturated state by temperature and vapor quality
    """
    try:
        from iapws import IAPWS97
    except ImportError:
        return None

    try:
        p_mpa = float(P_Pa) / 1e6 if P_Pa is not None else None
        if T_K is not None and p_mpa is not None:
            state = IAPWS97(T=float(T_K), P=p_mpa)
        elif p_mpa is not None and x is not None:
            state = IAPWS97(P=p_mpa, x=float(x))
        elif T_K is not None and x is not None:
            state = IAPWS97(T=float(T_K), x=float(x))
        else:
            return None
    except Exception:
        return None

    raw: Dict[str, Any] = {
        "phase": str(state.phase) if getattr(state, "phase", None) else None,
        "T_K": _clean_finite(getattr(state, "T", None)),
        "P_Pa": _clean_finite(getattr(state, "P", None), scale=1e6),
        "rho_kgm3": _clean_finite(getattr(state, "rho", None)),
        "h_kJkg": _clean_finite(getattr(state, "h", None)),
        "s_kJkgK": _clean_finite(getattr(state, "s", None)),
        "Cp_JkgK": _clean_finite(getattr(state, "cp", None), scale=1000.0),
        "mu_Pas": _clean_finite(getattr(state, "mu", None)),
        "k_WmK": _clean_finite(getattr(state, "k", None)),
        "Pr": _clean_finite(getattr(state, "Prandt", None)),
    }
    cleaned = {k: v for k, v in raw.items() if v is not None}
    if "h_kJkg" not in cleaned and "rho_kgm3" not in cleaned:
        return None
    cleaned["source"] = "IAPWS-97 Verified"
    return cleaned


# ─── Tier 2B: CoolProp Real Fluid Equation of State ──────────────────────────

def get_coolprop_properties(
    fluid_name: str,
    T_K: float,
    P_Pa: float = 101325.0,
) -> Optional[Dict[str, Any]]:
    """Tier 2B: Verified CoolProp real-fluid thermodynamic & transport properties."""
    try:
        import CoolProp.CoolProp as CP
    except ImportError:
        return None

    key = re.sub(r"\s+", " ", (fluid_name or "").strip().lower())
    fluid_id = _COOLPROP_FLUID_MAP.get(key)
    if not fluid_id:
        return None

    t_val = float(T_K)
    p_val = float(P_Pa)
    if not (math.isfinite(t_val) and math.isfinite(p_val) and t_val > 0.0 and p_val > 0.0):
        return None

    result: Dict[str, Any] = {
        "fluid": fluid_id,
        "T_K": t_val,
        "P_Pa": p_val,
    }

    try:
        phase_str = CP.PhaseSI("T", t_val, "P", p_val, fluid_id)
        if phase_str:
            result["phase"] = str(phase_str)
    except Exception:
        try:
            phase_num = CP.PropsSI("Phase", "T", t_val, "P", p_val, fluid_id)
            if math.isfinite(phase_num):
                result["phase"] = str(int(phase_num))
        except Exception:
            pass

    prop_specs: Tuple[Tuple[str, str, float], ...] = (
        ("D", "rho_kgm3", 1.0),
        ("H", "h_kJkg", 1e-3),
        ("S", "s_kJkgK", 1e-3),
        ("C", "Cp_JkgK", 1.0),
        ("V", "mu_Pas", 1.0),
        ("L", "k_WmK", 1.0),
        ("Z", "Z", 1.0),
    )

    numeric_hits = 0
    for cp_code, out_key, scale in prop_specs:
        try:
            val = CP.PropsSI(cp_code, "T", t_val, "P", p_val, fluid_id)
            cleaned = _clean_finite(val, scale=scale)
            if cleaned is not None:
                result[out_key] = cleaned
                numeric_hits += 1
        except Exception:
            continue

    if numeric_hits == 0:
        return None

    result["source"] = "CoolProp EOS Verified"
    return result


# ─── Tier 2C: Live Async PubChem Compound Lookup Fallback ────────────────────

async def fetch_pubchem_properties(
    compound_name: str,
    timeout_s: float = 4.0,
) -> Optional[Dict[str, Any]]:
    """Tier 2C: Query PubChem PUG-REST for molecular formula, MW, and IUPAC name.

    Uses a bounded 128-entry in-memory cache and fails gracefully to None on timeout,
    HTTP errors, or network unavailability.
    """
    raw_name = (compound_name or "").strip()
    key = re.sub(r"\s+", " ", raw_name.lower())
    if not key or len(key) < 2 or len(key) > 64:
        return None

    if key in _PUBCHEM_CACHE:
        cached = _PUBCHEM_CACHE[key]
        return dict(cached) if cached is not None else None

    url = (
        "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"
        f"{quote(key, safe='')}/property/MolecularFormula,MolecularWeight,IUPACName/JSON"
    )
    try:
        async with httpx.AsyncClient(timeout=timeout_s, follow_redirects=False) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            _cache_pubchem(key, None)
            return None
        payload = resp.json()
        props_list = (payload.get("PropertyTable") or {}).get("Properties") or []
        if not props_list or not isinstance(props_list[0], dict):
            _cache_pubchem(key, None)
            return None
        entry = props_list[0]
        formula = str(entry.get("MolecularFormula") or "").strip()
        mw_raw = entry.get("MolecularWeight")
        mw = _clean_finite(mw_raw)
        iupac = str(entry.get("IUPACName") or "").strip()
        if not formula and mw is None:
            _cache_pubchem(key, None)
            return None
        out: Dict[str, Any] = {
            "name": raw_name,
            "formula": formula,
            "MW_gmol": mw,
            "iupac": iupac,
            "source": "PubChem Verified",
        }
        _cache_pubchem(key, out)
        return dict(out)
    except Exception:
        return None


def _cache_pubchem(key: str, value: Optional[Dict[str, Any]]) -> None:
    if key not in _PUBCHEM_CACHE and len(_PUBCHEM_CACHE) >= _PUBCHEM_CACHE_MAX:
        oldest = next(iter(_PUBCHEM_CACHE))
        _PUBCHEM_CACHE.pop(oldest, None)
    _PUBCHEM_CACHE[key] = value


# ─── Prompt Context Auto-Detector ────────────────────────────────────────────

_TEMP_UNIT_PATTERN = r"(-?\d+(?:\.\d+)?)\s*(?:°\s*([CF])|deg\s*([CF])|\b([CFK])\b)"
_PRESSURE_UNIT_PATTERN = r"(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(MPa|kPa|Pa|bara|bar|atm|psia|psi|mmHg|torr)\b"

_PRESSURE_TO_PA: Dict[str, float] = {
    "pa": 1.0,
    "kpa": 1e3,
    "mpa": 1e6,
    "bar": 1e5,
    "bara": 1e5,
    "atm": 101325.0,
    "psi": 6894.757293,
    "psia": 6894.757293,
    "mmhg": MMHG_TO_PA,
    "torr": MMHG_TO_PA,
}


def _parse_temp_to_c(val_str: str, u1: Optional[str], u2: Optional[str], u3: Optional[str]) -> Optional[float]:
    try:
        val = float(val_str)
    except ValueError:
        return None
    unit = (u1 or u2 or u3 or "").upper()
    if unit == "C":
        return val
    if unit == "K":
        return val - 273.15
    if unit == "F":
        return (val - 32.0) * 5.0 / 9.0
    return None


def _parse_pressure_to_pa(val_str: str, unit_str: str) -> Optional[float]:
    try:
        val = float(val_str)
    except ValueError:
        return None
    factor = _PRESSURE_TO_PA.get((unit_str or "").strip().lower())
    if factor is None or val <= 0.0:
        return None
    return val * factor


def _find_species_temperature_c(text: str, species_pattern: str) -> Optional[float]:
    # Pattern 1: "<species> ... at <T>" (within 35 chars)
    p1 = re.compile(
        rf"\b(?:{species_pattern})\b[^.;\n]{{0,35}}?\b(?:at|@|=|\()\s*{_TEMP_UNIT_PATTERN}",
        re.IGNORECASE,
    )
    m = p1.search(text)
    if m:
        return _parse_temp_to_c(m.group(1), m.group(2), m.group(3), m.group(4))

    # Pattern 2: "<T> <species>" (e.g., "80°C water")
    p2 = re.compile(
        rf"{_TEMP_UNIT_PATTERN}\s+(?:liquid\s+|saturated\s+|superheated\s+|dry\s+)?\b(?:{species_pattern})\b",
        re.IGNORECASE,
    )
    m2 = p2.search(text)
    if m2:
        return _parse_temp_to_c(m2.group(1), m2.group(2), m2.group(3), m2.group(4))

    # Pattern 3: "<species> ... <P> and <T>" (within 65 chars)
    p3 = re.compile(
        rf"\b(?:{species_pattern})\b[^.;\n]{{0,65}}?{_TEMP_UNIT_PATTERN}",
        re.IGNORECASE,
    )
    m3 = p3.search(text)
    if m3:
        return _parse_temp_to_c(m3.group(1), m3.group(2), m3.group(3), m3.group(4))

    return None


def _find_species_pressure_pa(text: str, species_pattern: str) -> Optional[float]:
    p1 = re.compile(
        rf"\b(?:{species_pattern})\b[^.;\n]{{0,65}}?{_PRESSURE_UNIT_PATTERN}",
        re.IGNORECASE,
    )
    m = p1.search(text)
    if m:
        return _parse_pressure_to_pa(m.group(1), m.group(2))

    p2 = re.compile(
        rf"{_PRESSURE_UNIT_PATTERN}[^.;\n]{{0,25}}?\b(?:{species_pattern})\b",
        re.IGNORECASE,
    )
    m2 = p2.search(text)
    if m2:
        return _parse_pressure_to_pa(m2.group(1), m2.group(2))

    return None


def _format_steam_line(label: str, sp: Dict[str, Any]) -> str:
    parts: List[str] = []
    if "phase" in sp:
        parts.append(f"phase = {sp['phase']}")
    if "T_K" in sp:
        parts.append(f"T = {sp['T_K']:.2f} K ({sp['T_K'] - 273.15:.1f} °C)")
    if "P_Pa" in sp:
        parts.append(f"P = {sp['P_Pa'] / 1e5:.3f} bar")
    if "rho_kgm3" in sp:
        parts.append(f"rho = {sp['rho_kgm3']:.4g} kg/m³")
    if "h_kJkg" in sp:
        parts.append(f"h = {sp['h_kJkg']:.2f} kJ/kg")
    if "s_kJkgK" in sp:
        parts.append(f"s = {sp['s_kJkgK']:.4f} kJ/(kg·K)")
    if "Cp_JkgK" in sp:
        parts.append(f"Cp = {sp['Cp_JkgK']:.1f} J/(kg·K)")
    if "mu_Pas" in sp:
        parts.append(f"mu = {sp['mu_Pas']:.4e} Pa·s")
    if "k_WmK" in sp:
        parts.append(f"k = {sp['k_WmK']:.4f} W/(m·K)")
    if "Pr" in sp:
        parts.append(f"Pr = {sp['Pr']:.3f}")
    return f"- {label} [IAPWS-97 Verified]: " + ", ".join(parts)


def _format_coolprop_line(label: str, cp: Dict[str, Any]) -> str:
    parts: List[str] = []
    if "phase" in cp:
        parts.append(f"phase = {cp['phase']}")
    if "rho_kgm3" in cp:
        parts.append(f"rho = {cp['rho_kgm3']:.4g} kg/m³")
    if "h_kJkg" in cp:
        parts.append(f"h = {cp['h_kJkg']:.2f} kJ/kg")
    if "s_kJkgK" in cp:
        parts.append(f"s = {cp['s_kJkgK']:.4f} kJ/(kg·K)")
    if "Cp_JkgK" in cp:
        parts.append(f"Cp = {cp['Cp_JkgK']:.1f} J/(kg·K)")
    if "mu_Pas" in cp:
        parts.append(f"mu = {cp['mu_Pas']:.4e} Pa·s")
    if "k_WmK" in cp:
        parts.append(f"k = {cp['k_WmK']:.4f} W/(m·K)")
    if "Z" in cp:
        parts.append(f"Z = {cp['Z']:.4f}")
    return (
        f"- {label} ({cp['T_K']:.2f} K, {cp['P_Pa'] / 1e5:.3f} bar) "
        f"[CoolProp EOS Verified]: " + ", ".join(parts)
    )


def detect_property_context(problem_text: str) -> str:
    """Scan problem_text for known species + state conditions and return a verified reference block
    combining Tier 1 (NIST/Perry's), Tier 2A (IAPWS-97), and Tier 2B (CoolProp EOS).
    """
    if not problem_text or not isinstance(problem_text, str):
        return ""

    lines: List[str] = []
    seen_species: set[str] = set()
    text_lower = problem_text.lower()

    # 1A. Tier 2A: Steam or high-T / pressurized water via IAPWS-97
    if re.search(r"\bsteam\b", text_lower):
        t_steam = _find_species_temperature_c(problem_text, r"steam")
        p_steam = _find_species_pressure_pa(problem_text, r"steam")
        sp_props: Optional[Dict[str, Any]] = None
        if t_steam is not None and p_steam is not None:
            sp_props = get_steam_properties(T_K=t_steam + 273.15, P_Pa=p_steam)
        elif p_steam is not None:
            x_val = 0.0 if "saturated liquid" in text_lower else 1.0
            sp_props = get_steam_properties(P_Pa=p_steam, x=x_val)
        elif t_steam is not None:
            t_k = t_steam + 273.15
            if t_k < 647.0:
                x_val = 0.0 if "saturated liquid" in text_lower else 1.0
                sp_props = get_steam_properties(T_K=t_k, x=x_val)
            else:
                sp_props = get_steam_properties(T_K=t_k, P_Pa=101325.0)
        if sp_props is not None:
            lines.append(_format_steam_line("Steam / Water", sp_props))
            seen_species.update({"steam", "water"})

    # 1B. Water: IAPWS-97 for high-T (>100 °C) or pressurized (>=2 bar), otherwise Tier 1 NIST/Perry's
    if "water" not in seen_species:
        t_water = _find_species_temperature_c(problem_text, r"water|h2o")
        p_water = _find_species_pressure_pa(problem_text, r"water|h2o")
        if t_water is not None and (t_water > 100.0 or (p_water is not None and p_water >= 2.0e5)):
            sp_props = get_steam_properties(T_K=t_water + 273.15, P_Pa=p_water or 101325.0)
            if sp_props is not None:
                lines.append(_format_steam_line("Water", sp_props))
                seen_species.add("water")
        if "water" not in seen_species and t_water is not None and -5.0 <= t_water <= 110.0:
            wp = get_water_properties(t_water)
            lines.append(
                f"- Liquid Water at {t_water:.1f} °C [NIST/Perry's Table]: "
                f"rho = {wp['rho_kgm3']:.2f} kg/m³, "
                f"mu = {wp['mu_Pas']:.4e} Pa·s, "
                f"Cp = {wp['Cp_JkgK']:.1f} J/(kg·K), "
                f"k = {wp['k_WmK']:.4f} W/(m·K), "
                f"Pr = {wp['Pr']:.2f}, "
                f"Psat = {wp['Psat_Pa']:.1f} Pa"
            )
            seen_species.add("water")

    # 2. Dry air at T (Tier 1 NIST/Perry's at 1 atm, or CoolProp if elevated pressure)
    t_air = _find_species_temperature_c(problem_text, r"air")
    p_air = _find_species_pressure_pa(problem_text, r"air")
    if t_air is not None:
        if p_air is not None and abs(p_air - 101325.0) / 101325.0 > 0.15:
            cp_air = get_coolprop_properties("air", T_K=t_air + 273.15, P_Pa=p_air)
            if cp_air is not None:
                lines.append(_format_coolprop_line("Air", cp_air))
                seen_species.add("air")
        if "air" not in seen_species and -10.0 <= t_air <= 450.0:
            ap = get_air_properties(t_air)
            lines.append(
                f"- Dry Air (1 atm) at {t_air:.1f} °C [NIST/Perry's Table]: "
                f"rho = {ap['rho_kgm3']:.4f} kg/m³, "
                f"mu = {ap['mu_Pas']:.4e} Pa·s, "
                f"Cp = {ap['Cp_JkgK']:.1f} J/(kg·K), "
                f"k = {ap['k_WmK']:.5f} W/(m·K), "
                f"Pr = {ap['Pr']:.3f}"
            )
            seen_species.add("air")

    # 3. Tier 2B CoolProp Real Fluids (with T and optional P)
    coolprop_candidates = sorted(
        (k for k in _COOLPROP_FLUID_MAP.keys() if k not in {"water", "steam", "h2o", "air"}),
        key=len,
        reverse=True,
    )
    coolprop_seen_ids: set[str] = set()
    for sp_key in coolprop_candidates:
        fluid_id = _COOLPROP_FLUID_MAP[sp_key]
        if fluid_id in coolprop_seen_ids:
            continue
        pat = re.escape(sp_key)
        if not re.search(rf"\b{pat}\b", text_lower):
            continue
        t_sp = _find_species_temperature_c(problem_text, pat)
        p_sp = _find_species_pressure_pa(problem_text, pat)
        if t_sp is not None:
            cp_props = get_coolprop_properties(sp_key, T_K=t_sp + 273.15, P_Pa=p_sp or 101325.0)
            if cp_props is not None:
                lines.append(_format_coolprop_line(fluid_id, cp_props))
                coolprop_seen_ids.add(fluid_id)
                seen_species.add(_canonical_species(sp_key))

    # 4. Named Antoine / Critical species (Tier 1 NIST/Perry's)
    all_species_names = sorted(
        (set(ANTOINE_COEFFS.keys()) | set(CRITICAL_PROPERTIES.keys())) - {"water"},
        key=len,
        reverse=True,
    )
    for sp_name in all_species_names:
        variants = [re.escape(sp_name)]
        if sp_name.startswith("n-"):
            variants.append(re.escape(sp_name[2:]))
        pat = "|".join(variants)
        if not re.search(rf"\b(?:{pat})\b", text_lower):
            continue

        t_sp = _find_species_temperature_c(problem_text, pat)
        parts: List[str] = []
        if t_sp is not None and sp_name in ANTOINE_COEFFS:
            psat = antoine_psat_pa(sp_name, t_sp)
            if psat is not None:
                parts.append(f"Psat({t_sp:.1f} °C) = {psat:.1f} Pa")
        if t_sp is not None and sp_name in CRITICAL_PROPERTIES:
            cp = CRITICAL_PROPERTIES[sp_name]
            parts.append(
                f"MW = {cp['MW_gmol']:.3f} g/mol, "
                f"Tc = {cp['Tc_K']:.2f} K, "
                f"Pc = {cp['Pc_Pa']:.3e} Pa, "
                f"omega = {cp['omega']:.4f}"
            )

        if parts:
            lines.append(f"- {sp_name.title()} [NIST/Perry's Table]: " + "; ".join(parts))
            seen_species.add(sp_name)

    if not lines:
        return ""
    return "Verified Reference Properties (NIST/Perry's):\n" + "\n".join(lines)


def _extract_unfamiliar_compound_candidates(problem_text: str) -> List[str]:
    """Identify unfamiliar chemical compound names not covered by local Tier 1 / 2A / 2B databases."""
    known = (
        set(ANTOINE_COEFFS.keys())
        | set(CRITICAL_PROPERTIES.keys())
        | set(_SPECIES_ALIASES.keys())
        | set(_COOLPROP_FLUID_MAP.keys())
        | {"water", "steam", "air"}
    )
    pattern = re.compile(
        r"\b(?:of|for|with|using)\s+([a-z][a-z0-9\-]{3,30})\s+(?:at|in|flows|enters|is)\b",
        re.IGNORECASE,
    )
    candidates: List[str] = []
    seen: set[str] = set()
    for m in pattern.finditer(problem_text):
        cand = m.group(1).strip().lower()
        if cand in seen or cand in _COMPOUND_STOPWORDS or cand in known:
            continue
        if _canonical_species(cand) in known:
            continue
        if cand.isdigit():
            continue
        seen.add(cand)
        candidates.append(cand)
        if len(candidates) >= 2:
            break
    return candidates


async def build_verified_property_context(problem_text: str) -> str:
    """Unified Async Context Builder:
    - Tier 1 (NIST/Perry's Tables)
    - Tier 2A (IAPWS-97 Steam & Water)
    - Tier 2B (CoolProp Real Fluid EOS)
    - Tier 2C (Live Async PubChem fallback, max 2 lookups, 4s timeout)
    """
    if not problem_text or not isinstance(problem_text, str):
        return ""

    base_ctx = detect_property_context(problem_text)
    extra_lines: List[str] = []

    candidates = _extract_unfamiliar_compound_candidates(problem_text)
    for cand in candidates[:2]:
        pc = await fetch_pubchem_properties(cand, timeout_s=4.0)
        if pc is not None:
            parts: List[str] = []
            if pc.get("formula"):
                parts.append(f"Formula = {pc['formula']}")
            if pc.get("MW_gmol") is not None:
                parts.append(f"MW = {pc['MW_gmol']:.3f} g/mol")
            if pc.get("iupac"):
                parts.append(f"IUPAC = {pc['iupac']}")
            if parts:
                extra_lines.append(
                    f"- {pc['name'].title()} [PubChem Verified]: " + ", ".join(parts)
                )

    if not base_ctx and not extra_lines:
        return ""
    if base_ctx and extra_lines:
        return base_ctx + "\n" + "\n".join(extra_lines)
    if base_ctx:
        return base_ctx
    return "Verified Reference Properties (NIST/Perry's):\n" + "\n".join(extra_lines)
