"""Built-in NIST / Perry's Chemical Engineering Physical Property Lookup Tables."""

from __future__ import annotations

import math
import re
from typing import Dict, List, Optional, Tuple

MMHG_TO_PA = 133.322368

# ─── Saturated Liquid Water (0–100 °C, NIST / Perry's) ──────────────────────
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

# ─── Dry Air at 1 atm (0–400 °C, NIST / Incropera / Perry's) ────────────────
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


# ─── Prompt Context Auto-Detector ────────────────────────────────────────────

_TEMP_UNIT_PATTERN = r"(-?\d+(?:\.\d+)?)\s*(?:°\s*([CF])|deg\s*([CF])|\b([CFK])\b)"


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
        rf"{_TEMP_UNIT_PATTERN}\s+(?:liquid\s+|saturated\s+|dry\s+)?\b(?:{species_pattern})\b",
        re.IGNORECASE,
    )
    m2 = p2.search(text)
    if m2:
        return _parse_temp_to_c(m2.group(1), m2.group(2), m2.group(3), m2.group(4))

    return None


def detect_property_context(problem_text: str) -> str:
    """Scan problem_text for known species + temperatures and return a NIST/Perry's reference block."""
    if not problem_text or not isinstance(problem_text, str):
        return ""

    lines: List[str] = []
    seen_species: set[str] = set()

    # 1. Liquid water at T
    t_water = _find_species_temperature_c(problem_text, r"water|h2o")
    if t_water is not None and -5.0 <= t_water <= 110.0:
        wp = get_water_properties(t_water)
        lines.append(
            f"- Liquid Water at {t_water:.1f} °C: "
            f"rho = {wp['rho_kgm3']:.2f} kg/m³, "
            f"mu = {wp['mu_Pas']:.4e} Pa·s, "
            f"Cp = {wp['Cp_JkgK']:.1f} J/(kg·K), "
            f"k = {wp['k_WmK']:.4f} W/(m·K), "
            f"Pr = {wp['Pr']:.2f}, "
            f"Psat = {wp['Psat_Pa']:.1f} Pa"
        )
        seen_species.add("water")

    # 2. Dry air at T
    t_air = _find_species_temperature_c(problem_text, r"air")
    if t_air is not None and -10.0 <= t_air <= 450.0:
        ap = get_air_properties(t_air)
        lines.append(
            f"- Dry Air (1 atm) at {t_air:.1f} °C: "
            f"rho = {ap['rho_kgm3']:.4f} kg/m³, "
            f"mu = {ap['mu_Pas']:.4e} Pa·s, "
            f"Cp = {ap['Cp_JkgK']:.1f} J/(kg·K), "
            f"k = {ap['k_WmK']:.5f} W/(m·K), "
            f"Pr = {ap['Pr']:.3f}"
        )
        seen_species.add("air")

    # 3. Named Antoine / Critical species with a temperature
    all_species_names = sorted(
        (set(ANTOINE_COEFFS.keys()) | set(CRITICAL_PROPERTIES.keys())) - {"water"},
        key=len,
        reverse=True,
    )
    text_lower = problem_text.lower()
    for sp_name in all_species_names:
        if sp_name in seen_species:
            continue
        # Match either canonical name or short name without "n-" prefix
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
            lines.append(f"- {sp_name.title()}: " + "; ".join(parts))
            seen_species.add(sp_name)

    if not lines:
        return ""
    return "Verified Reference Properties (NIST/Perry's):\n" + "\n".join(lines)
