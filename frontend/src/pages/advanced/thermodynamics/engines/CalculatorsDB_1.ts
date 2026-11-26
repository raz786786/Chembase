import type { CalcDef } from "./GenericCalculator";
import { SteamEngine } from "./SteamEngine";

export const CALC_DB_1: CalcDef[] = [
  // 1-6: BASIC PROPERTY CALCULATORS
  {
    id: "1",
    title: "Density",
    category: "Basic Property",
    inputs: [
      { id: "mass", label: "Mass", unit: "kg", default: 10 },
      { id: "vol", label: "Volume", unit: "m³", default: 2 }
    ],
    outputs: [{ id: "density", label: "Density", unit: "kg/m³" }],
    calculate: (inputs) => {
      const vol = inputs.vol ?? 0;
      if (vol <= 0) return { error: "Volume must be > 0" };
      return { density: (inputs.mass ?? 0) / vol };
    }
  },
  {
    id: "2",
    title: "Specific Volume",
    category: "Basic Property",
    inputs: [
      { id: "vol", label: "Volume", unit: "m³", default: 2 },
      { id: "mass", label: "Mass", unit: "kg", default: 10 }
    ],
    outputs: [{ id: "v", label: "Specific Volume", unit: "m³/kg" }],
    calculate: (inputs) => {
      const mass = inputs.mass ?? 0;
      if (mass <= 0) return { error: "Mass must be > 0" };
      return { v: (inputs.vol ?? 0) / mass };
    }
  },
  {
    id: "3",
    title: "Specific Gravity",
    category: "Basic Property",
    inputs: [
      { id: "rho", label: "Fluid Density", unit: "kg/m³", default: 800 },
      { id: "rho_ref", label: "Reference Density", unit: "kg/m³", default: 1000 }
    ],
    outputs: [{ id: "sg", label: "Specific Gravity", unit: "" }],
    calculate: (inputs) => {
      const ref = inputs.rho_ref ?? 0;
      if (ref <= 0) return { error: "Reference density must be > 0" };
      return { sg: (inputs.rho ?? 0) / ref };
    }
  },
  {
    id: "4",
    title: "Pressure Conversion",
    category: "Basic Property",
    inputs: [{ id: "p_pa", label: "Pressure", unit: "Pa", default: 101325 }],
    outputs: [
      { id: "kpa", label: "kPa", unit: "kPa" },
      { id: "mpa", label: "MPa", unit: "MPa" },
      { id: "bar", label: "bar", unit: "bar" },
      { id: "atm", label: "atm", unit: "atm" },
      { id: "psi", label: "psi", unit: "psi" },
      { id: "mmhg", label: "mmHg", unit: "mmHg" },
      { id: "torr", label: "Torr", unit: "Torr" }
    ],
    calculate: (inputs) => {
      const p = inputs.p_pa || 0;
      return {
        kpa: p / 1000, mpa: p / 1000000, bar: p / 100000, atm: p / 101325,
        psi: p / 6894.757, mmhg: p / 133.322, torr: p / 133.322
      };
    }
  },
  {
    id: "5",
    title: "Temperature Conversion",
    category: "Basic Property",
    inputs: [{ id: "tc", label: "Temperature", unit: "°C", default: 25 }],
    outputs: [
      { id: "tk", label: "Kelvin", unit: "K" },
      { id: "tf", label: "Fahrenheit", unit: "°F" },
      { id: "tr", label: "Rankine", unit: "°R" }
    ],
    calculate: (inputs) => {
      const c = inputs.tc || 0;
      return { tk: c + 273.15, tf: (c * 9/5) + 32, tr: (c + 273.15) * 1.8 };
    }
  },
  {
    id: "6",
    title: "Specific Heat",
    category: "Basic Property",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: 1 },
      { id: "q", label: "Heat", unit: "kJ", default: 10 },
      { id: "dt", label: "Temp Change", unit: "K", default: 5 }
    ],
    outputs: [{ id: "c", label: "Specific Heat", unit: "kJ/kg·K" }],
    calculate: (inputs) => {
      const m = inputs.m ?? 0;
      const dt = inputs.dt ?? 0;
      if (m <= 0 || dt === 0) return { error: "Mass must be > 0 and Temp Change ≠ 0" };
      return { c: (inputs.q ?? 0) / (m * dt) };
    }
  },
  {
    id: "7",
    title: "Sensible Heat",
    category: "Heat and Work",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: 1 },
      { id: "c", label: "Specific Heat", unit: "kJ/kg·K", default: 4.18 },
      { id: "dt", label: "Temp Change", unit: "K", default: 10 }
    ],
    outputs: [{ id: "q", label: "Sensible Heat", unit: "kJ" }],
    calculate: (inputs) => ({ q: (inputs.m || 0) * (inputs.c || 0) * (inputs.dt || 0) })
  },
  {
    id: "8",
    title: "Latent Heat",
    category: "Heat and Work",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: 1 },
      { id: "l", label: "Latent Heat", unit: "kJ/kg", default: 2257 }
    ],
    outputs: [{ id: "q", label: "Latent Heat", unit: "kJ" }],
    calculate: (inputs) => ({ q: (inputs.m || 0) * (inputs.l || 0) })
  },
  {
    id: "9",
    title: "Heat Capacity",
    category: "Heat and Work",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: 2 },
      { id: "c", label: "Specific Heat", unit: "kJ/kg·K", default: 4.18 },
      { id: "mw", label: "Molar Mass", unit: "kg/kmol", default: 18 }
    ],
    outputs: [
      { id: "cap", label: "Total Heat Capacity", unit: "kJ/K" },
      { id: "mcap", label: "Molar Heat Capacity", unit: "kJ/kmol·K" }
    ],
    calculate: (inputs) => ({ cap: (inputs.m || 0) * (inputs.c || 0), mcap: (inputs.mw || 0) * (inputs.c || 0) })
  },
  {
    id: "10",
    title: "Boundary Work",
    category: "Heat and Work",
    inputs: [
      { id: "p1", label: "P1", unit: "kPa", default: 100 },
      { id: "v1", label: "V1", unit: "m³", default: 1 },
      { id: "v2", label: "V2", unit: "m³", default: 2 },
      { id: "n", label: "Polytropic Index n", unit: "", default: 1 }
    ],
    outputs: [{ id: "w", label: "Work", unit: "kJ" }],
    calculate: (inputs) => {
      const p1 = inputs.p1 ?? 0;
      const v1 = inputs.v1 ?? 0;
      const v2 = inputs.v2 ?? 0;
      const n = inputs.n ?? 1;
      if (v1 <= 0 || v2 <= 0) return { error: "Volumes V1 and V2 must be > 0" };
      if (Math.abs(n - 1) < 1e-9) return { w: p1 * v1 * Math.log(v2 / v1) };
      const p2 = p1 * Math.pow(v1 / v2, n);
      return { w: (p2 * v2 - p1 * v1) / (1 - n) };
    }
  },
  {
    id: "11",
    title: "Isothermal Work",
    category: "Heat and Work",
    inputs: [
      { id: "n", label: "Moles", unit: "kmol", default: 1 },
      { id: "t", label: "Temp", unit: "K", default: 300 },
      { id: "v1", label: "V1", unit: "m³", default: 1 },
      { id: "v2", label: "V2", unit: "m³", default: 2 }
    ],
    outputs: [{ id: "w", label: "Work", unit: "kJ" }],
    calculate: (inputs) => {
      const n = inputs.n ?? 0;
      const t = inputs.t ?? 0;
      const v1 = inputs.v1 ?? 0;
      const v2 = inputs.v2 ?? 0;
      if (t <= 0 || v1 <= 0 || v2 <= 0) return { error: "T, V1, and V2 must be > 0" };
      return { w: n * 8.314 * t * Math.log(v2 / v1) };
    }
  },
  {
    id: "12",
    title: "Adiabatic Work",
    category: "Heat and Work",
    inputs: [
      { id: "p1", label: "P1", unit: "kPa", default: 100 },
      { id: "v1", label: "V1", unit: "m³", default: 1 },
      { id: "v2", label: "V2", unit: "m³", default: 2 },
      { id: "k", label: "Gamma (k)", unit: "", default: 1.4 }
    ],
    outputs: [{ id: "w", label: "Work", unit: "kJ" }],
    calculate: (inputs) => {
      const p1 = inputs.p1 ?? 0;
      const v1 = inputs.v1 ?? 0;
      const v2 = inputs.v2 ?? 0;
      const k = inputs.k ?? 1.4;
      if (v1 <= 0 || v2 <= 0) return { error: "Volumes V1 and V2 must be > 0" };
      if (Math.abs(k - 1) < 1e-9) return { w: p1 * v1 * Math.log(v2 / v1) };
      const p2 = p1 * Math.pow(v1 / v2, k);
      return { w: (p2 * v2 - p1 * v1) / (1 - k) };
    }
  },
  {
    id: "13",
    title: "Polytropic Process",
    category: "Heat and Work",
    inputs: [
      { id: "p1", label: "P1", unit: "kPa", default: 100 },
      { id: "v1", label: "V1", unit: "m³", default: 1 },
      { id: "v2", label: "V2", unit: "m³", default: 2 },
      { id: "n", label: "Index n", unit: "", default: 1.2 }
    ],
    outputs: [
      { id: "p2", label: "P2", unit: "kPa" },
      { id: "w", label: "Work", unit: "kJ" }
    ],
    calculate: (inputs) => {
      const p1 = inputs.p1 ?? 0;
      const v1 = inputs.v1 ?? 0;
      const v2 = inputs.v2 ?? 0;
      const n = inputs.n ?? 1;
      if (v1 <= 0 || v2 <= 0) return { error: "Volumes V1 and V2 must be > 0" };
      const p2 = p1 * Math.pow(v1 / v2, n);
      const w = Math.abs(n - 1) < 1e-9 ? p1 * v1 * Math.log(v2 / v1) : (p2 * v2 - p1 * v1) / (1 - n);
      return { p2, w };
    }
  },
  {
    id: "14",
    title: "Closed-System First Law",
    category: "First Law",
    inputs: [
      { id: "q", label: "Heat (Q)", unit: "kJ", default: 10 },
      { id: "w", label: "Work (W)", unit: "kJ", default: 5 }
    ],
    outputs: [{ id: "de", label: "Change in Energy (ΔE)", unit: "kJ" }],
    calculate: (inputs) => ({ de: (inputs.q || 0) - (inputs.w || 0) })
  },
  {
    id: "15",
    title: "Internal Energy Change",
    category: "First Law",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: 1 },
      { id: "cv", label: "Cv", unit: "kJ/kg·K", default: 0.718 },
      { id: "dt", label: "Temp Change", unit: "K", default: 50 }
    ],
    outputs: [{ id: "du", label: "ΔU", unit: "kJ" }],
    calculate: (inputs) => ({ du: (inputs.m || 0) * (inputs.cv || 0) * (inputs.dt || 0) })
  },
  {
    id: "16",
    title: "Enthalpy Change",
    category: "First Law",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: 1 },
      { id: "cp", label: "Cp", unit: "kJ/kg·K", default: 1.005 },
      { id: "dt", label: "Temp Change", unit: "K", default: 50 }
    ],
    outputs: [{ id: "dh", label: "ΔH", unit: "kJ" }],
    calculate: (inputs) => ({ dh: (inputs.m || 0) * (inputs.cp || 0) * (inputs.dt || 0) })
  },
  {
    id: "17",
    title: "Heat Transfer from Energy Balance",
    category: "First Law",
    inputs: [
      { id: "de", label: "ΔE", unit: "kJ", default: 10 },
      { id: "w", label: "Work (W)", unit: "kJ", default: 5 }
    ],
    outputs: [{ id: "q", label: "Heat (Q)", unit: "kJ" }],
    calculate: (inputs) => ({ q: (inputs.de || 0) + (inputs.w || 0) })
  },
  {
    id: "18",
    title: "Work from Energy Balance",
    category: "First Law",
    inputs: [
      { id: "de", label: "ΔE", unit: "kJ", default: 10 },
      { id: "q", label: "Heat (Q)", unit: "kJ", default: 15 }
    ],
    outputs: [{ id: "w", label: "Work (W)", unit: "kJ" }],
    calculate: (inputs) => ({ w: (inputs.q || 0) - (inputs.de || 0) })
  },
  {
    id: "19",
    title: "SFEE Calculator",
    category: "Steady Flow Energy Equation",
    inputs: [
      { id: "dh", label: "ΔH", unit: "kJ/kg", default: 50 },
      { id: "v1", label: "Vel 1", unit: "m/s", default: 10 },
      { id: "v2", label: "Vel 2", unit: "m/s", default: 20 },
      { id: "z1", label: "Elev 1", unit: "m", default: 0 },
      { id: "z2", label: "Elev 2", unit: "m", default: 10 },
      { id: "q", label: "Heat Q", unit: "kJ/kg", default: 10 }
    ],
    outputs: [{ id: "w", label: "Work W", unit: "kJ/kg" }],
    calculate: (inputs) => {
      const dKE = (Math.pow(inputs.v2 || 0, 2) - Math.pow(inputs.v1 || 0, 2)) / 2000;
      const dPE = 9.81 * ((inputs.z2 || 0) - (inputs.z1 || 0)) / 1000;
      return { w: (inputs.q || 0) - ((inputs.dh || 0) + dKE + dPE) };
    }
  },
  {
    id: "20",
    title: "Sensible Enthalpy Change",
    category: "Enthalpy",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: 1 },
      { id: "cp", label: "Cp", unit: "kJ/kg·K", default: 1.005 },
      { id: "dt", label: "ΔT", unit: "K", default: 20 }
    ],
    outputs: [{ id: "dh", label: "ΔH", unit: "kJ" }],
    calculate: (inputs) => ({ dh: (inputs.m || 0) * (inputs.cp || 0) * (inputs.dt || 0) })
  },
  {
    id: "21",
    title: "Enthalpy of Vaporization",
    category: "Enthalpy",
    inputs: [
      { id: "m", label: "Mass", unit: "kg", default: 1 },
      { id: "hfg", label: "h_fg", unit: "kJ/kg", default: 2257 }
    ],
    outputs: [{ id: "q", label: "Heat Required", unit: "kJ" }],
    calculate: (inputs) => ({ q: (inputs.m || 0) * (inputs.hfg || 0) })
  },
  {
    id: "22",
    title: "Mixture Enthalpy",
    category: "Enthalpy",
    inputs: [
      { id: "m1", label: "Mass 1", unit: "kg", default: 1 },
      { id: "h1", label: "h1", unit: "kJ/kg", default: 100 },
      { id: "m2", label: "Mass 2", unit: "kg", default: 2 },
      { id: "h2", label: "h2", unit: "kJ/kg", default: 200 }
    ],
    outputs: [{ id: "hmix", label: "Mixture Enthalpy", unit: "kJ" }],
    calculate: (inputs) => ({ hmix: (inputs.m1 || 0) * (inputs.h1 || 0) + (inputs.m2 || 0) * (inputs.h2 || 0) })
  },
  {
    id: "23",
    title: "Reaction Enthalpy",
    category: "Enthalpy",
    inputs: [
      { id: "h_prod", label: "Sum H_f Products", unit: "kJ", default: -393 },
      { id: "h_reac", label: "Sum H_f Reactants", unit: "kJ", default: -110 }
    ],
    outputs: [{ id: "hrxn", label: "ΔH Reaction", unit: "kJ" }],
    calculate: (inputs) => ({ hrxn: (inputs.h_prod || 0) - (inputs.h_reac || 0) })
  },
  {
    id: "24",
    title: "Hess's Law Calculator",
    category: "Enthalpy",
    inputs: [
      { id: "dh1", label: "ΔH 1", unit: "kJ", default: -100 },
      { id: "dh2", label: "ΔH 2", unit: "kJ", default: -50 },
      { id: "dh3", label: "ΔH 3", unit: "kJ", default: 0 }
    ],
    outputs: [{ id: "dhtot", label: "Total ΔH", unit: "kJ" }],
    calculate: (inputs) => ({ dhtot: (inputs.dh1 || 0) + (inputs.dh2 || 0) + (inputs.dh3 || 0) })
  },
  {
    id: "25",
    title: "Entropy Change — Ideal Gas",
    category: "Entropy",
    inputs: [
      { id: "cp", label: "Cp", unit: "kJ/kg·K", default: 1.005 },
      { id: "r", label: "R", unit: "kJ/kg·K", default: 0.287 },
      { id: "t1", label: "T1", unit: "K", default: 300 },
      { id: "t2", label: "T2", unit: "K", default: 400 },
      { id: "p1", label: "P1", unit: "kPa", default: 100 },
      { id: "p2", label: "P2", unit: "kPa", default: 200 }
    ],
    outputs: [{ id: "ds", label: "Δs", unit: "kJ/kg·K" }],
    calculate: (inputs) => {
      const t1 = inputs.t1 ?? 0;
      const t2 = inputs.t2 ?? 0;
      const p1 = inputs.p1 ?? 0;
      const p2 = inputs.p2 ?? 0;
      if (t1 <= 0 || t2 <= 0 || p1 <= 0 || p2 <= 0) {
        return { error: "Absolute temperatures and pressures must be > 0" };
      }
      return { ds: (inputs.cp ?? 0) * Math.log(t2 / t1) - (inputs.r ?? 0) * Math.log(p2 / p1) };
    }
  },
  {
    id: "26",
    title: "Entropy Change — Constant Pressure",
    category: "Entropy",
    inputs: [
      { id: "cp", label: "Cp", unit: "kJ/kg·K", default: 1.005 },
      { id: "t1", label: "T1", unit: "K", default: 300 },
      { id: "t2", label: "T2", unit: "K", default: 400 }
    ],
    outputs: [{ id: "ds", label: "Δs", unit: "kJ/kg·K" }],
    calculate: (inputs) => {
      const t1 = inputs.t1 ?? 0;
      const t2 = inputs.t2 ?? 0;
      if (t1 <= 0 || t2 <= 0) return { error: "Absolute temperatures T1 and T2 must be > 0 K" };
      return { ds: (inputs.cp ?? 0) * Math.log(t2 / t1) };
    }
  },
  {
    id: "27",
    title: "Entropy Change — Constant Temperature",
    category: "Entropy",
    inputs: [
      { id: "r", label: "R", unit: "kJ/kg·K", default: 0.287 },
      { id: "p1", label: "P1", unit: "kPa", default: 100 },
      { id: "p2", label: "P2", unit: "kPa", default: 200 }
    ],
    outputs: [{ id: "ds", label: "Δs", unit: "kJ/kg·K" }],
    calculate: (inputs) => {
      const p1 = inputs.p1 ?? 0;
      const p2 = inputs.p2 ?? 0;
      if (p1 <= 0 || p2 <= 0) return { error: "Pressures P1 and P2 must be > 0" };
      return { ds: -(inputs.r ?? 0) * Math.log(p2 / p1) };
    }
  },
  {
    id: "28",
    title: "Entropy Generation",
    category: "Entropy",
    inputs: [
      { id: "dssys", label: "ΔS System", unit: "kJ/K", default: 0.5 },
      { id: "dssurr", label: "ΔS Surr", unit: "kJ/K", default: 0.2 }
    ],
    outputs: [{ id: "sgen", label: "S_gen", unit: "kJ/K" }],
    calculate: (inputs) => ({ sgen: (inputs.dssys || 0) + (inputs.dssurr || 0) })
  },
  {
    id: "29",
    title: "Entropy Balance",
    category: "Entropy",
    inputs: [
      { id: "sin", label: "S_in", unit: "kJ/K", default: 1 },
      { id: "sout", label: "S_out", unit: "kJ/K", default: 1.2 },
      { id: "dssys", label: "ΔS System", unit: "kJ/K", default: 0.1 }
    ],
    outputs: [{ id: "sgen", label: "S_gen", unit: "kJ/K" }],
    calculate: (inputs) => ({ sgen: (inputs.dssys || 0) - (inputs.sin || 0) + (inputs.sout || 0) })
  },
  {
    id: "30",
    title: "Isentropic Process Calculator",
    category: "Entropy",
    inputs: [
      { id: "t1", label: "T1", unit: "K", default: 300 },
      { id: "p1", label: "P1", unit: "kPa", default: 100 },
      { id: "p2", label: "P2", unit: "kPa", default: 200 },
      { id: "k", label: "k (Cp/Cv)", unit: "", default: 1.4 }
    ],
    outputs: [{ id: "t2", label: "T2", unit: "K" }],
    calculate: (inputs) => {
      const t1 = inputs.t1 ?? 0;
      const p1 = inputs.p1 ?? 0;
      const p2 = inputs.p2 ?? 0;
      const k = inputs.k ?? 1.4;
      if (t1 <= 0 || p1 <= 0 || p2 <= 0 || k <= 0) {
        return { error: "T1, P1, P2, and k must be > 0" };
      }
      return { t2: t1 * Math.pow(p2 / p1, (k - 1) / k) };
    }
  },
  {
    id: "31",
    title: "Carnot Efficiency",
    category: "Second Law",
    inputs: [
      { id: "tl", label: "TL", unit: "K", default: 300 },
      { id: "th", label: "TH", unit: "K", default: 600 }
    ],
    outputs: [{ id: "eff", label: "Efficiency", unit: "%" }],
    calculate: (inputs) => {
      const tl = inputs.tl ?? 0;
      const th = inputs.th ?? 0;
      if (tl <= 0 || th <= 0) return { error: "Absolute temperatures TL and TH must be > 0 K" };
      if (tl >= th) return { error: "TL must be strictly less than TH (TL < TH)" };
      return { eff: (1 - tl / th) * 100 };
    }
  },
  {
    id: "32",
    title: "COP — Refrigerator",
    category: "Second Law",
    inputs: [
      { id: "ql", label: "Q_L", unit: "kW", default: 10 },
      { id: "w", label: "Work W", unit: "kW", default: 2.5 }
    ],
    outputs: [{ id: "cop", label: "COP", unit: "" }],
    calculate: (inputs) => {
      const w = inputs.w ?? 0;
      if (w <= 0) return { error: "Work input W must be > 0" };
      return { cop: (inputs.ql ?? 0) / w };
    }
  },
  {
    id: "33",
    title: "COP — Heat Pump",
    category: "Second Law",
    inputs: [
      { id: "qh", label: "Q_H", unit: "kW", default: 12.5 },
      { id: "w", label: "Work W", unit: "kW", default: 2.5 }
    ],
    outputs: [{ id: "cop", label: "COP", unit: "" }],
    calculate: (inputs) => {
      const w = inputs.w ?? 0;
      if (w <= 0) return { error: "Work input W must be > 0" };
      return { cop: (inputs.qh ?? 0) / w };
    }
  },
  {
    id: "34",
    title: "Second-Law Efficiency",
    category: "Second Law",
    inputs: [
      { id: "eff_th", label: "Thermal Efficiency", unit: "%", default: 30 },
      { id: "eff_rev", label: "Reversible Efficiency", unit: "%", default: 50 }
    ],
    outputs: [{ id: "eff_ii", label: "Second-Law Eff", unit: "%" }],
    calculate: (inputs) => {
      const rev = inputs.eff_rev ?? 0;
      if (rev <= 0) return { error: "Reversible efficiency must be > 0" };
      return { eff_ii: ((inputs.eff_th ?? 0) / rev) * 100 };
    }
  },
  {
    id: "35",
    title: "Reversible Work",
    category: "Second Law",
    inputs: [
      { id: "qh", label: "Q_H", unit: "kW", default: 100 },
      { id: "tl", label: "T_L", unit: "K", default: 300 },
      { id: "th", label: "T_H", unit: "K", default: 1000 }
    ],
    outputs: [{ id: "wrev", label: "Reversible Work", unit: "kW" }],
    calculate: (inputs) => {
      const tl = inputs.tl ?? 0;
      const th = inputs.th ?? 0;
      if (tl <= 0 || th <= 0) return { error: "Absolute temperatures T_L and T_H must be > 0 K" };
      if (tl >= th) return { error: "T_L must be strictly less than T_H" };
      return { wrev: (inputs.qh ?? 0) * (1 - tl / th) };
    }
  },
  {
    id: "36",
    title: "Lost Work / Exergy Destruction",
    category: "Second Law",
    inputs: [
      { id: "t0", label: "T0", unit: "K", default: 298 },
      { id: "sgen", label: "S_gen", unit: "kW/K", default: 0.05 }
    ],
    outputs: [{ id: "xdes", label: "Exergy Destruct.", unit: "kW" }],
    calculate: (inputs) => {
      const t0 = inputs.t0 ?? 0;
      if (t0 <= 0) return { error: "Dead-state temperature T0 must be > 0 K" };
      return { xdes: t0 * (inputs.sgen ?? 0) };
    }
  },
  {
    id: "37",
    title: "Steam Property Lookup (Ideal Approx)",
    category: "Pure Substance",
    inputs: [
      { id: "p", label: "Pressure", unit: "kPa", default: 101.325 },
      { id: "t", label: "Temperature", unit: "°C", default: 100 }
    ],
    outputs: [{ id: "v", label: "Est. Spec. Volume", unit: "m³/kg" }],
    calculate: (inputs) => {
      const p = inputs.p ?? 0;
      const tk = (inputs.t ?? 0) + 273.15;
      if (p <= 0 || tk <= 0) return { error: "Pressure must be > 0 and T > -273.15°C" };
      return { v: (0.4615 * tk) / p };
    }
  },
  {
    id: "38",
    title: "Saturated Steam Properties (Antoine)",
    category: "Pure Substance",
    inputs: [{ id: "t", label: "Temperature", unit: "°C", default: 100 }],
    outputs: [{ id: "psat", label: "P_sat", unit: "kPa" }],
    calculate: (inputs) => {
      const T = inputs.t ?? 0;
      if (T < 0.01 || T > 374.14) {
        return { error: "Temperature must be within 0.01°C to 374.14°C (water saturation domain)" };
      }
      // Piecewise NIST Antoine constants for water
      const [A, B, C] = T <= 100
        ? [8.07131, 1730.63, 233.426]
        : [8.14019, 1810.94, 244.485];
      const p_mmhg = Math.pow(10, A - B / (T + C));
      return { psat: (p_mmhg * 133.322) / 1000 };
    }
  },
  {
    id: "39",
    title: "Wet Steam Calculator",
    category: "Pure Substance",
    inputs: [
      { id: "x", label: "Quality x", unit: "", default: 0.9 },
      { id: "yf", label: "y_f", unit: "kJ/kg", default: 419 },
      { id: "yg", label: "y_g", unit: "kJ/kg", default: 2676 }
    ],
    outputs: [{ id: "y", label: "Property y", unit: "kJ/kg" }],
    calculate: (inputs) => ({ y: (inputs.yf ?? 0) + (inputs.x ?? 0) * ((inputs.yg ?? 0) - (inputs.yf ?? 0)) })
  },
  {
    id: "40",
    title: "Superheated Steam Calculator",
    category: "Pure Substance",
    inputs: [
      { id: "p", label: "Pressure", unit: "kPa", default: 200 },
      { id: "t", label: "Temp", unit: "°C", default: 200 }
    ],
    outputs: [{ id: "v", label: "Ideal Spec. Vol", unit: "m³/kg" }],
    calculate: (inputs) => {
      const p = inputs.p ?? 0;
      const tk = (inputs.t ?? 0) + 273.15;
      if (p <= 0 || tk <= 0) return { error: "Pressure must be > 0 and T > -273.15°C" };
      return { v: (0.4615 * tk) / p };
    }
  },
  {
    id: "41",
    title: "Compressed Liquid Calculator",
    category: "Pure Substance",
    inputs: [{ id: "t", label: "Temp", unit: "°C", default: 20 }],
    outputs: [{ id: "v", label: "Spec. Vol approx", unit: "m³/kg" }],
    calculate: (inputs) => {
      const t = inputs.t ?? 20;
      if (t < 0.01 || t > 374.14) {
        return { error: "Temperature must be within 0.01°C to 374.14°C" };
      }
      return { v: SteamEngine.getSatPropByT(t, "vf") };
    }
  },
  {
    id: "42",
    title: "Steam Quality Calculator",
    category: "Pure Substance",
    inputs: [
      { id: "y", label: "Property y", unit: "kJ/kg", default: 2000 },
      { id: "yf", label: "y_f", unit: "kJ/kg", default: 419 },
      { id: "yg", label: "y_g", unit: "kJ/kg", default: 2676 }
    ],
    outputs: [{ id: "x", label: "Quality x", unit: "" }],
    calculate: (inputs) => {
      const y = inputs.y ?? 0;
      const yf = inputs.yf ?? 0;
      const yg = inputs.yg ?? 0;
      const denom = yg - yf;
      if (denom === 0) return { error: "y_g and y_f cannot be equal (zero denominator)" };
      return { x: (y - yf) / denom };
    }
  },
  {
    id: "43",
    title: "Steam Table Interpolation",
    category: "Pure Substance",
    inputs: [
      { id: "x", label: "x value", unit: "", default: 1.5 },
      { id: "x1", label: "x1", unit: "", default: 1 },
      { id: "x2", label: "x2", unit: "", default: 2 },
      { id: "y1", label: "y1", unit: "", default: 100 },
      { id: "y2", label: "y2", unit: "", default: 200 }
    ],
    outputs: [{ id: "y", label: "Interpolated y", unit: "" }],
    calculate: (inputs) => {
      const x = inputs.x ?? 0;
      const x1 = inputs.x1 ?? 0;
      const x2 = inputs.x2 ?? 0;
      const y1 = inputs.y1 ?? 0;
      const y2 = inputs.y2 ?? 0;
      const denom = x2 - x1;
      if (denom === 0) return { error: "x1 and x2 cannot be equal (zero denominator)" };
      return { y: y1 + ((x - x1) * (y2 - y1)) / denom };
    }
  },
  {
    id: "44",
    title: "Compressibility Factor",
    category: "Real Gas",
    inputs: [
      { id: "p", label: "Pressure", unit: "kPa", default: 100 },
      { id: "v", label: "Volume", unit: "m³", default: 24 },
      { id: "n", label: "Moles", unit: "kmol", default: 1 },
      { id: "t", label: "Temp", unit: "K", default: 298 }
    ],
    outputs: [{ id: "z", label: "Z", unit: "" }],
    calculate: (inputs) => {
      const p = inputs.p ?? 0;
      const v = inputs.v ?? 0;
      const n = inputs.n ?? 0;
      const t = inputs.t ?? 0;
      if (p <= 0 || v <= 0 || n <= 0 || t <= 0) {
        return { error: "P, V, n, and T must all be > 0" };
      }
      return { z: (p * v) / (n * 8.314 * t) };
    }
  },
  {
    id: "45",
    title: "Ideal Gas Law",
    category: "Real Gas",
    inputs: [
      { id: "p", label: "Pressure", unit: "kPa", default: 101.3 },
      { id: "v", label: "Volume", unit: "m³", default: 22.4 },
      { id: "t", label: "Temp", unit: "K", default: 273.15 }
    ],
    outputs: [{ id: "n", label: "Moles", unit: "kmol" }],
    calculate: (inputs) => {
      const p = inputs.p ?? 0;
      const v = inputs.v ?? 0;
      const t = inputs.t ?? 0;
      if (p < 0 || v < 0 || t <= 0) {
        return { error: "Requires T > 0 K and P, V ≥ 0" };
      }
      return { n: (p * v) / (8.314 * t) };
    }
  },
  {
    id: "46",
    title: "van der Waals Equation",
    category: "Real Gas",
    inputs: [
      { id: "n", label: "Moles", unit: "kmol", default: 1 },
      { id: "t", label: "Temp", unit: "K", default: 300 },
      { id: "v", label: "Volume", unit: "m³", default: 1 },
      { id: "a", label: "a", unit: "kPa(m³/kmol)²", default: 138 },
      { id: "b", label: "b", unit: "m³/kmol", default: 0.0318 }
    ],
    outputs: [{ id: "p", label: "Pressure", unit: "kPa" }],
    calculate: (inputs) => {
      const n = inputs.n ?? 0;
      const t = inputs.t ?? 0;
      const v = inputs.v ?? 0;
      const a = inputs.a ?? 0;
      const b = inputs.b ?? 0;
      if (t <= 0 || n < 0 || v <= 0 || v <= n * b) {
        return { error: "Requires T > 0 K, n ≥ 0, and V > n·b" };
      }
      return { p: (n * 8.314 * t) / (v - n * b) - a * Math.pow(n / v, 2) };
    }
  },
  {
    id: "47",
    title: "Peng-Robinson EOS (P calc)",
    category: "Real Gas",
    inputs: [
      { id: "tc", label: "Tc", unit: "K", default: 304.2 },
      { id: "pc", label: "Pc", unit: "kPa", default: 7380 },
      { id: "w", label: "Acentric w", unit: "", default: 0.225 },
      { id: "t", label: "T", unit: "K", default: 350 },
      { id: "v", label: "Molar Vol", unit: "m³/kmol", default: 1 }
    ],
    outputs: [{ id: "p", label: "Pressure", unit: "kPa" }],
    calculate: (inputs) => {
      const R = 8.314;
      const tc = inputs.tc ?? 0;
      const pc = inputs.pc ?? 0;
      const w = inputs.w ?? 0;
      const t = inputs.t ?? 0;
      const v = inputs.v ?? 0;
      if (t <= 0 || tc <= 0 || pc <= 0) {
        return { error: "Requires T > 0 K, Tc > 0 K, and Pc > 0 kPa" };
      }
      const b = (0.07780 * R * tc) / pc;
      if (v <= b) {
        return { error: `Molar volume v must be > covolume b (${b.toFixed(5)} m³/kmol)` };
      }
      const kappa = 0.37464 + 1.54226 * w - 0.26992 * w * w;
      const alpha = Math.pow(1 + kappa * (1 - Math.sqrt(t / tc)), 2);
      const a = (0.45724 * R * R * tc * tc * alpha) / pc;
      return { p: (R * t) / (v - b) - a / (v * v + 2 * b * v - b * b) };
    }
  },
  {
    id: "48",
    title: "SRK Equation of State",
    category: "Real Gas",
    inputs: [
      { id: "tc", label: "Tc", unit: "K", default: 304.2 },
      { id: "pc", label: "Pc", unit: "kPa", default: 7380 },
      { id: "w", label: "Acentric w", unit: "", default: 0.225 },
      { id: "t", label: "T", unit: "K", default: 350 },
      { id: "v", label: "Molar Vol", unit: "m³/kmol", default: 1 }
    ],
    outputs: [{ id: "p", label: "Pressure", unit: "kPa" }],
    calculate: (inputs) => {
      const R = 8.314;
      const tc = inputs.tc ?? 0;
      const pc = inputs.pc ?? 0;
      const w = inputs.w ?? 0;
      const t = inputs.t ?? 0;
      const v = inputs.v ?? 0;
      if (t <= 0 || tc <= 0 || pc <= 0) {
        return { error: "Requires T > 0 K, Tc > 0 K, and Pc > 0 kPa" };
      }
      const b = (0.08664 * R * tc) / pc;
      if (v <= b) {
        return { error: `Molar volume v must be > covolume b (${b.toFixed(5)} m³/kmol)` };
      }
      const m = 0.480 + 1.574 * w - 0.176 * w * w;
      const alpha = Math.pow(1 + m * (1 - Math.sqrt(t / tc)), 2);
      const a = (0.42748 * R * R * tc * tc * alpha) / pc;
      return { p: (R * t) / (v - b) - a / (v * (v + b)) };
    }
  },
  {
    id: "49",
    title: "Reduced Properties",
    category: "Real Gas",
    inputs: [
      { id: "t", label: "T", unit: "K", default: 300 },
      { id: "tc", label: "Tc", unit: "K", default: 150 },
      { id: "p", label: "P", unit: "kPa", default: 200 },
      { id: "pc", label: "Pc", unit: "kPa", default: 100 }
    ],
    outputs: [
      { id: "tr", label: "T_r", unit: "" },
      { id: "pr", label: "P_r", unit: "" }
    ],
    calculate: (inputs) => {
      const tc = inputs.tc ?? 0;
      const pc = inputs.pc ?? 0;
      if (tc <= 0 || pc <= 0) return { error: "Critical properties Tc and Pc must be > 0" };
      return { tr: (inputs.t ?? 0) / tc, pr: (inputs.p ?? 0) / pc };
    }
  },
  {
    id: "50",
    title: "Joule-Thomson Coefficient",
    category: "Real Gas",
    inputs: [
      { id: "dt", label: "ΔT", unit: "K", default: -2 },
      { id: "dp", label: "ΔP", unit: "kPa", default: -100 }
    ],
    outputs: [{ id: "mu", label: "μ_JT", unit: "K/kPa" }],
    calculate: (inputs) => {
      const dp = inputs.dp ?? 0;
      if (dp === 0) return { error: "ΔP cannot be zero" };
      return { mu: (inputs.dt ?? 0) / dp };
    }
  }
];
