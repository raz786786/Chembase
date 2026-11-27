import type { CalcDef } from './GenericCalculator';

export const CALC_DB_2: CalcDef[] = [
  {
    id: '51',
    title: 'Mole Fraction',
    category: 'Mixtures',
    inputs: [
      { id: 'ni', label: 'Moles of Component i', default: 1, unit: 'mol' },
      { id: 'ntot', label: 'Total Moles', default: 10, unit: 'mol' }
    ],
    outputs: [{ id: 'xi', label: 'Mole Fraction', unit: '-' }],
    calculate: (inputs) => {
      const ntot = inputs.ntot ?? 0;
      if (ntot <= 0) return { error: 'Total moles must be > 0' };
      return { xi: (inputs.ni ?? 0) / ntot };
    }
  },
  {
    id: '52',
    title: 'Mass Fraction',
    category: 'Mixtures',
    inputs: [
      { id: 'mi', label: 'Mass of Component i', default: 1, unit: 'kg' },
      { id: 'mtot', label: 'Total Mass', default: 10, unit: 'kg' }
    ],
    outputs: [{ id: 'wi', label: 'Mass Fraction', unit: '-' }],
    calculate: (inputs) => {
      const mtot = inputs.mtot ?? 0;
      if (mtot <= 0) return { error: 'Total mass must be > 0' };
      return { wi: (inputs.mi ?? 0) / mtot };
    }
  },
  {
    id: '53',
    title: 'Average Molecular Weight',
    category: 'Mixtures',
    inputs: [
      { id: 'y1', label: 'Mole Fraction Comp. 1 (y₁)', default: 0.79, unit: '-' },
      { id: 'M1', label: 'Molar Mass Comp. 1 (M₁)', default: 28.01, unit: 'kg/kmol' },
      { id: 'M2', label: 'Molar Mass Comp. 2 (M₂)', default: 32.0, unit: 'kg/kmol' }
    ],
    outputs: [{ id: 'Mavg', label: 'Average Molecular Weight', unit: 'kg/kmol' }],
    calculate: (inputs) => {
      const y1 = inputs.y1 ?? 0;
      const M1 = inputs.M1 ?? 0;
      const M2 = inputs.M2 ?? 0;
      if (y1 < 0 || y1 > 1 || M1 <= 0 || M2 <= 0) {
        return { error: 'Requires 0 ≤ y₁ ≤ 1 and M₁, M₂ > 0' };
      }
      return { Mavg: y1 * M1 + (1 - y1) * M2 };
    }
  },
  {
    id: '54',
    title: 'Partial Pressure',
    category: 'Mixtures',
    inputs: [
      { id: 'yi', label: 'Mole Fraction in Vapor', default: 0.21, unit: '-' },
      { id: 'Ptot', label: 'Total Pressure', default: 101325, unit: 'Pa' }
    ],
    outputs: [{ id: 'Pi', label: 'Partial Pressure', unit: 'Pa' }],
    calculate: (inputs) => ({ Pi: (inputs.yi ?? 0) * (inputs.Ptot ?? 0) })
  },
  {
    id: '55',
    title: 'Partial Molar Properties',
    category: 'Mixtures',
    inputs: [
      { id: 'M', label: 'Mixture Molar Property (M)', default: 50, unit: 'any/mol' },
      { id: 'x2', label: 'Mole Fraction Comp. 2 (x₂)', default: 0.4, unit: '-' },
      { id: 'dM_dx1', label: 'Derivative (dM/dx₁)', default: 10, unit: 'any/mol' }
    ],
    outputs: [{ id: 'Mi_partial', label: 'Partial Molar Property (M̄₁)', unit: 'any/mol' }],
    calculate: (inputs) => {
      const x2 = inputs.x2 ?? 0;
      if (x2 < 0 || x2 > 1) return { error: 'Mole fraction x₂ must be between 0 and 1' };
      return { Mi_partial: (inputs.M ?? 0) + x2 * (inputs.dM_dx1 ?? 0) };
    }
  },
  {
    id: '56',
    title: 'Mixture Enthalpy',
    category: 'Mixtures',
    inputs: [
      { id: 'x1', label: 'Mole Fraction Comp. 1 (x₁)', default: 0.5, unit: '-' },
      { id: 'h1', label: 'Molar Enthalpy Comp. 1 (h₁)', default: 2000, unit: 'J/mol' },
      { id: 'h2', label: 'Molar Enthalpy Comp. 2 (h₂)', default: 3000, unit: 'J/mol' }
    ],
    outputs: [{ id: 'Hmix', label: 'Mixture Enthalpy', unit: 'J/mol' }],
    calculate: (inputs) => {
      const x1 = inputs.x1 ?? 0;
      if (x1 < 0 || x1 > 1) return { error: 'Mole fraction x₁ must be between 0 and 1' };
      return { Hmix: x1 * (inputs.h1 ?? 0) + (1 - x1) * (inputs.h2 ?? 0) };
    }
  },
  {
    id: '57',
    title: 'Carnot Cycle Analyzer',
    category: 'Power Cycles',
    inputs: [
      { id: 'TH', label: 'High Temperature', default: 1000, unit: 'K' },
      { id: 'TL', label: 'Low Temperature', default: 300, unit: 'K' },
      { id: 'QH', label: 'Heat Input', default: 1000, unit: 'J' }
    ],
    outputs: [
      { id: 'eta', label: 'Efficiency', unit: '-' },
      { id: 'W', label: 'Net Work', unit: 'J' },
      { id: 'QL', label: 'Heat Rejection', unit: 'J' }
    ],
    calculate: (inputs) => {
      const TH = inputs.TH ?? 0;
      const TL = inputs.TL ?? 0;
      if (TH <= 0 || TL <= 0 || TL >= TH) {
        return { error: 'Requires 0 < T_L < T_H (K)' };
      }
      const eta = 1 - TL / TH;
      const W = (inputs.QH ?? 0) * eta;
      const QL = (inputs.QH ?? 0) - W;
      return { eta, W, QL };
    }
  },
  {
    id: '58',
    title: 'Rankine Cycle Analyzer',
    category: 'Power Cycles',
    inputs: [
      { id: 'h1', label: 'Pump Inlet Enthalpy', default: 300, unit: 'kJ/kg' },
      { id: 'h2', label: 'Pump Outlet Enthalpy', default: 310, unit: 'kJ/kg' },
      { id: 'h3', label: 'Turbine Inlet Enthalpy', default: 3500, unit: 'kJ/kg' },
      { id: 'h4', label: 'Turbine Outlet Enthalpy', default: 2200, unit: 'kJ/kg' }
    ],
    outputs: [
      { id: 'Wp', label: 'Pump Work', unit: 'kJ/kg' },
      { id: 'Wt', label: 'Turbine Work', unit: 'kJ/kg' },
      { id: 'Qin', label: 'Heat Input', unit: 'kJ/kg' },
      { id: 'eta', label: 'Efficiency', unit: '-' }
    ],
    calculate: (inputs) => {
      const Wp = (inputs.h2 ?? 0) - (inputs.h1 ?? 0);
      const Wt = (inputs.h3 ?? 0) - (inputs.h4 ?? 0);
      const Qin = (inputs.h3 ?? 0) - (inputs.h2 ?? 0);
      const Wnet = Wt - Wp;
      const eta = Qin !== 0 ? Wnet / Qin : 0;
      return { Wp, Wt, Qin, eta };
    }
  },
  {
    id: '59',
    title: 'Reheat Rankine Cycle',
    category: 'Power Cycles',
    inputs: [
      { id: 'Wt1', label: 'HP Turbine Work', default: 1000, unit: 'kJ/kg' },
      { id: 'Wt2', label: 'LP Turbine Work', default: 800, unit: 'kJ/kg' },
      { id: 'Wp', label: 'Pump Work', default: 10, unit: 'kJ/kg' },
      { id: 'Qin1', label: 'Primary Heat Input', default: 3000, unit: 'kJ/kg' },
      { id: 'Qin2', label: 'Reheat Heat Input', default: 1500, unit: 'kJ/kg' }
    ],
    outputs: [
      { id: 'Wnet', label: 'Net Work', unit: 'kJ/kg' },
      { id: 'eta', label: 'Efficiency', unit: '-' }
    ],
    calculate: (inputs) => {
      const Wnet = (inputs.Wt1 ?? 0) + (inputs.Wt2 ?? 0) - (inputs.Wp ?? 0);
      const Qin_tot = (inputs.Qin1 ?? 0) + (inputs.Qin2 ?? 0);
      const eta = Qin_tot !== 0 ? Wnet / Qin_tot : 0;
      return { Wnet, eta };
    }
  },
  {
    id: '60',
    title: 'Regenerative Rankine Cycle',
    category: 'Power Cycles',
    inputs: [
      { id: 'h_ex', label: 'Extraction Enthalpy', default: 2800, unit: 'kJ/kg' },
      { id: 'h_fw', label: 'FW Heater Outlet Enthalpy', default: 800, unit: 'kJ/kg' },
      { id: 'h_cond', label: 'Condenser Outlet Enthalpy', default: 200, unit: 'kJ/kg' }
    ],
    outputs: [{ id: 'y', label: 'Extraction Fraction', unit: '-' }],
    calculate: (inputs) => {
      const num = (inputs.h_fw || 0) - (inputs.h_cond || 0);
      const den = (inputs.h_ex || 0) - (inputs.h_cond || 0);
      return { y: den !== 0 ? num / den : 0 };
    }
  },
  {
    id: '61',
    title: 'Brayton Cycle',
    category: 'Power Cycles',
    inputs: [
      { id: 'rp', label: 'Pressure Ratio', default: 10, unit: '-' },
      { id: 'k', label: 'Specific Heat Ratio (k)', default: 1.4, unit: '-' }
    ],
    outputs: [{ id: 'eta', label: 'Efficiency', unit: '-' }],
    calculate: (inputs) => {
      const rp = inputs.rp ?? 1;
      const k = inputs.k ?? 1.4;
      if (rp <= 1 || k <= 1) return { error: 'Requires rp > 1 and k > 1' };
      const eta = 1 - Math.pow(rp, (1 - k) / k);
      return { eta };
    }
  },
  {
    id: '62',
    title: 'Intercooled Brayton',
    category: 'Power Cycles',
    inputs: [
      { id: 'P1', label: 'Inlet Pressure', default: 100000, unit: 'Pa' },
      { id: 'P2', label: 'Exit Pressure', default: 900000, unit: 'Pa' }
    ],
    outputs: [{ id: 'Px', label: 'Intercooler Pressure', unit: 'Pa' }],
    calculate: (inputs) => {
      const P1 = inputs.P1 ?? 0;
      const P2 = inputs.P2 ?? 0;
      if (P1 <= 0 || P2 <= 0) return { error: 'Pressures P1 and P2 must be > 0' };
      return { Px: Math.sqrt(P1 * P2) };
    }
  },
  {
    id: '63',
    title: 'Reheated Brayton',
    category: 'Power Cycles',
    inputs: [
      { id: 'Wt1', label: 'HP Turbine Work', default: 500, unit: 'kJ/kg' },
      { id: 'Wt2', label: 'LP Turbine Work', default: 500, unit: 'kJ/kg' },
      { id: 'Wc', label: 'Compressor Work', default: 400, unit: 'kJ/kg' }
    ],
    outputs: [{ id: 'Wnet', label: 'Net Work', unit: 'kJ/kg' }],
    calculate: (inputs) => ({ Wnet: (inputs.Wt1 || 0) + (inputs.Wt2 || 0) - (inputs.Wc || 0) })
  },
  {
    id: '64',
    title: 'Regenerative Brayton',
    category: 'Power Cycles',
    inputs: [
      { id: 'T3', label: 'Actual Heated Temp', default: 800, unit: 'K' },
      { id: 'T2', label: 'Compressor Exit Temp', default: 500, unit: 'K' },
      { id: 'T5', label: 'Turbine Exit Temp', default: 900, unit: 'K' }
    ],
    outputs: [{ id: 'epsilon', label: 'Effectiveness', unit: '-' }],
    calculate: (inputs) => {
      const num = (inputs.T3 || 0) - (inputs.T2 || 0);
      const den = (inputs.T5 || 0) - (inputs.T2 || 0);
      return { epsilon: den !== 0 ? num / den : 0 };
    }
  },
  {
    id: '65',
    title: 'Otto Cycle',
    category: 'Power Cycles',
    inputs: [
      { id: 'r', label: 'Compression Ratio', default: 8, unit: '-' },
      { id: 'k', label: 'Specific Heat Ratio (k)', default: 1.4, unit: '-' }
    ],
    outputs: [{ id: 'eta', label: 'Efficiency', unit: '-' }],
    calculate: (inputs) => {
      const r = inputs.r ?? 1;
      const k = inputs.k ?? 1.4;
      if (r <= 1 || k <= 1) return { error: 'Requires r > 1 and k > 1' };
      const eta = 1 - 1 / Math.pow(r, k - 1);
      return { eta };
    }
  },
  {
    id: '66',
    title: 'Diesel Cycle',
    category: 'Power Cycles',
    inputs: [
      { id: 'r', label: 'Compression Ratio', default: 18, unit: '-' },
      { id: 'rc', label: 'Cut-off Ratio', default: 2, unit: '-' },
      { id: 'k', label: 'Specific Heat Ratio (k)', default: 1.4, unit: '-' }
    ],
    outputs: [{ id: 'eta', label: 'Efficiency', unit: '-' }],
    calculate: (inputs) => {
      const r = inputs.r ?? 1;
      const rc = inputs.rc ?? 1;
      const k = inputs.k ?? 1.4;
      if (r <= 1 || rc < 1 || k <= 1) return { error: 'Requires r > 1, rc ≥ 1, and k > 1' };
      const term1 = 1 / Math.pow(r, k - 1);
      const term2 = Math.abs(rc - 1) < 1e-9 ? 1 : (Math.pow(rc, k) - 1) / (k * (rc - 1));
      return { eta: 1 - term1 * term2 };
    }
  },
  {
    id: '67',
    title: 'Dual Cycle',
    category: 'Power Cycles',
    inputs: [
      { id: 'r', label: 'Compression Ratio', default: 15, unit: '-' },
      { id: 'rc', label: 'Cut-off Ratio', default: 1.5, unit: '-' },
      { id: 'rp', label: 'Pressure Ratio', default: 1.5, unit: '-' },
      { id: 'k', label: 'Specific Heat Ratio (k)', default: 1.4, unit: '-' }
    ],
    outputs: [{ id: 'eta', label: 'Efficiency', unit: '-' }],
    calculate: (inputs) => {
      const r = inputs.r ?? 1;
      const rc = inputs.rc ?? 1;
      const rp = inputs.rp ?? 1;
      const k = inputs.k ?? 1.4;
      if (r <= 1 || rc < 1 || rp < 1 || k <= 1) {
        return { error: 'Requires r > 1, rc ≥ 1, rp ≥ 1, and k > 1' };
      }
      const num = rp * Math.pow(rc, k) - 1;
      const den = (rp - 1) + k * rp * (rc - 1);
      const term1 = 1 / Math.pow(r, k - 1);
      const ratio = Math.abs(den) < 1e-9 ? 1 : num / den;
      return { eta: 1 - term1 * ratio };
    }
  },
  {
    id: '68',
    title: 'Refrigeration COP',
    category: 'Refrigeration',
    inputs: [
      { id: 'QL', label: 'Cooling Effect', default: 5000, unit: 'W' },
      { id: 'W', label: 'Work Input', default: 1500, unit: 'W' }
    ],
    outputs: [{ id: 'COP_R', label: 'COP (Refrigeration)', unit: '-' }],
    calculate: (inputs) => {
      const W = inputs.W ?? 0;
      if (W <= 0) return { error: 'Work input W must be > 0' };
      return { COP_R: (inputs.QL ?? 0) / W };
    }
  },
  {
    id: '69',
    title: 'Heat Pump COP',
    category: 'Refrigeration',
    inputs: [
      { id: 'QH', label: 'Heating Effect', default: 6500, unit: 'W' },
      { id: 'W', label: 'Work Input', default: 1500, unit: 'W' }
    ],
    outputs: [{ id: 'COP_HP', label: 'COP (Heat Pump)', unit: '-' }],
    calculate: (inputs) => {
      const W = inputs.W ?? 0;
      if (W <= 0) return { error: 'Work input W must be > 0' };
      return { COP_HP: (inputs.QH ?? 0) / W };
    }
  },
  {
    id: '70',
    title: 'Vapor Compression Cycle Analyzer',
    category: 'Refrigeration',
    inputs: [
      { id: 'h1', label: 'Compressor Inlet h₁', default: 250, unit: 'kJ/kg' },
      { id: 'h2', label: 'Compressor Exit h₂', default: 280, unit: 'kJ/kg' },
      { id: 'h3', label: 'Condenser Exit h₃', default: 105, unit: 'kJ/kg' },
      { id: 'h4', label: 'Evaporator Inlet h₄', default: 105, unit: 'kJ/kg' }
    ],
    outputs: [
      { id: 'COP', label: 'COP', unit: '-' },
      { id: 'qL', label: 'Cooling Effect (q_L)', unit: 'kJ/kg' },
      { id: 'qH', label: 'Heat Rejected (q_H)', unit: 'kJ/kg' }
    ],
    calculate: (inputs) => {
      const h1 = inputs.h1 ?? 0;
      const h2 = inputs.h2 ?? 0;
      const h3 = inputs.h3 ?? 0;
      const h4 = inputs.h4 ?? 0;
      const qL = h1 - h4;
      const qH = h2 - h3;
      const win = h2 - h1;
      if (win <= 0) return { error: 'Compressor work (h₂ − h₁) must be > 0' };
      return { COP: qL / win, qL, qH };
    }
  },
  {
    id: '71',
    title: 'Refrigeration Capacity',
    category: 'Refrigeration',
    inputs: [
      { id: 'm_dot', label: 'Mass Flow Rate', default: 0.05, unit: 'kg/s' },
      { id: 'qL', label: 'Specific Cooling Effect', default: 140000, unit: 'J/kg' }
    ],
    outputs: [{ id: 'Q_dot_L', label: 'Cooling Capacity', unit: 'W' }],
    calculate: (inputs) => ({ Q_dot_L: (inputs.m_dot || 0) * (inputs.qL || 0) })
  },
  {
    id: '72',
    title: 'Ton of Refrigeration',
    category: 'Refrigeration',
    inputs: [
      { id: 'Q_kW', label: 'Cooling Capacity in kW', default: 3.517, unit: 'kW' }
    ],
    outputs: [{ id: 'TR', label: 'Tons of Refrigeration', unit: 'TR' }],
    calculate: (inputs) => ({ TR: (inputs.Q_kW || 0) / 3.5168525 })
  },
  {
    id: '73',
    title: 'Compressor Performance',
    category: 'Refrigeration',
    inputs: [
      { id: 'W_s', label: 'Isentropic Work', default: 300, unit: 'kJ/kg' },
      { id: 'W_a', label: 'Actual Work', default: 350, unit: 'kJ/kg' }
    ],
    outputs: [{ id: 'eta_c', label: 'Isentropic Efficiency', unit: '-' }],
    calculate: (inputs) => ({ eta_c: (inputs.W_a || 0) !== 0 ? (inputs.W_s || 0) / inputs.W_a : 0 })
  },
  {
    id: '74',
    title: 'Throttling Valve',
    category: 'Refrigeration',
    inputs: [
      { id: 'h1', label: 'Inlet Enthalpy', default: 1000, unit: 'kJ/kg' }
    ],
    outputs: [{ id: 'h2', label: 'Exit Enthalpy', unit: 'kJ/kg' }],
    calculate: (inputs) => ({ h2: inputs.h1 || 0 })
  },
  {
    id: '75',
    title: 'Stoichiometric Air Requirement',
    category: 'Combustion',
    inputs: [
      { id: 'x', label: 'Atoms of Carbon', default: 1, unit: '-' },
      { id: 'y', label: 'Atoms of Hydrogen', default: 4, unit: '-' }
    ],
    outputs: [
      { id: 'O2_req', label: 'Theoretical O2 Moles', unit: 'mol' },
      { id: 'Air_req', label: 'Theoretical Air Moles', unit: 'mol' }
    ],
    calculate: (inputs) => {
      const O2_req = (inputs.x ?? 0) + (inputs.y ?? 0) / 4;
      return { O2_req, Air_req: 4.76 * O2_req };
    }
  },
  {
    id: '76',
    title: 'Excess Air',
    category: 'Combustion',
    inputs: [
      { id: 'Air_actual', label: 'Actual Air', default: 120, unit: 'mol' },
      { id: 'Air_theo', label: 'Theoretical Air', default: 100, unit: 'mol' }
    ],
    outputs: [{ id: 'Excess_Air_Pct', label: 'Excess Air %', unit: '%' }],
    calculate: (inputs) => {
      const Air_actual = inputs.Air_actual ?? 0;
      const Air_theo = inputs.Air_theo ?? 0;
      if (Air_theo <= 0) return { error: 'Theoretical air must be > 0' };
      return { Excess_Air_Pct: ((Air_actual - Air_theo) / Air_theo) * 100 };
    }
  },
  {
    id: '77',
    title: 'Air-Fuel Ratio',
    category: 'Combustion',
    inputs: [
      { id: 'm_air', label: 'Mass of Air', default: 17.1, unit: 'kg' },
      { id: 'm_fuel', label: 'Mass of Fuel', default: 1.0, unit: 'kg' }
    ],
    outputs: [{ id: 'AF', label: 'Air-Fuel Ratio', unit: '-' }],
    calculate: (inputs) => ({ AF: (inputs.m_fuel || 0) !== 0 ? (inputs.m_air || 0) / inputs.m_fuel : 0 })
  },
  {
    id: '78',
    title: 'Equivalence Ratio',
    category: 'Combustion',
    inputs: [
      { id: 'AF_actual', label: 'Actual A/F Ratio', default: 15, unit: '-' },
      { id: 'AF_stoich', label: 'Stoichiometric A/F Ratio', default: 17.1, unit: '-' }
    ],
    outputs: [{ id: 'phi', label: 'Equivalence Ratio', unit: '-' }],
    calculate: (inputs) => ({ phi: (inputs.AF_actual || 0) !== 0 ? (inputs.AF_stoich || 0) / inputs.AF_actual : 0 })
  },
  {
    id: '79',
    title: 'Combustion Product Calculation',
    category: 'Combustion',
    inputs: [
      { id: 'x', label: 'Atoms of Carbon in Fuel', default: 1, unit: '-' },
      { id: 'n_fuel', label: 'Moles of Fuel', default: 1, unit: 'mol' }
    ],
    outputs: [{ id: 'n_CO2', label: 'Moles of CO2 Produced', unit: 'mol' }],
    calculate: (inputs) => ({ n_CO2: (inputs.x || 0) * (inputs.n_fuel || 0) })
  },
  {
    id: '80',
    title: 'Heating Value',
    category: 'Combustion',
    inputs: [
      { id: 'HHV', label: 'Higher Heating Value', default: 55000000, unit: 'J/kg' },
      { id: 'm_water', label: 'Mass of Water Produced per kg Fuel', default: 2.25, unit: 'kg/kg' },
      { id: 'h_fg', label: 'Latent Heat of Vaporization of Water', default: 2442000, unit: 'J/kg' }
    ],
    outputs: [{ id: 'LHV', label: 'Lower Heating Value', unit: 'J/kg' }],
    calculate: (inputs) => ({ LHV: (inputs.HHV ?? 0) - ((inputs.m_water ?? 0) * (inputs.h_fg ?? 2442000)) })
  },
  {
    id: '81',
    title: 'Gibbs Free Energy',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'dH', label: 'Enthalpy Change (ΔH)', default: -100000, unit: 'J' },
      { id: 'T', label: 'Temperature', default: 298, unit: 'K' },
      { id: 'dS', label: 'Entropy Change (ΔS)', default: -100, unit: 'J/K' }
    ],
    outputs: [{ id: 'dG', label: 'Gibbs Free Energy Change (ΔG)', unit: 'J' }],
    calculate: (inputs) => ({ dG: (inputs.dH || 0) - (inputs.T || 0) * (inputs.dS || 0) })
  },
  {
    id: '82',
    title: 'Helmholtz Free Energy',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'U', label: 'Internal Energy', default: 50000, unit: 'J' },
      { id: 'T', label: 'Temperature', default: 298, unit: 'K' },
      { id: 'S', label: 'Entropy', default: 150, unit: 'J/K' }
    ],
    outputs: [{ id: 'A', label: 'Helmholtz Free Energy', unit: 'J' }],
    calculate: (inputs) => ({ A: (inputs.U || 0) - (inputs.T || 0) * (inputs.S || 0) })
  },
  {
    id: '83',
    title: 'Chemical Potential',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'mu0', label: 'Standard Chemical Potential', default: 0, unit: 'J/mol' },
      { id: 'T', label: 'Temperature', default: 298, unit: 'K' },
      { id: 'a', label: 'Activity', default: 0.5, unit: '-' }
    ],
    outputs: [{ id: 'mu', label: 'Chemical Potential', unit: 'J/mol' }],
    calculate: (inputs) => {
      const R = 8.314;
      const mu0 = inputs.mu0 ?? 0;
      const T = inputs.T ?? 0;
      const a = inputs.a ?? 0;
      if (a <= 0 || T <= 0) return { error: 'Requires activity a > 0 and T > 0 K' };
      return { mu: mu0 + R * T * Math.log(a) };
    }
  },
  {
    id: '84',
    title: 'Standard ΔG° from Equilibrium Constant (K)',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'K', label: 'Equilibrium Constant', default: 10, unit: '-' },
      { id: 'T', label: 'Temperature', default: 298, unit: 'K' }
    ],
    outputs: [{ id: 'dG0', label: 'Standard Gibbs Energy', unit: 'J/mol' }],
    calculate: (inputs) => {
      const K = inputs.K ?? 0;
      const T = inputs.T ?? 0;
      if (K <= 0 || T <= 0) return { error: 'Requires K > 0 and T > 0 K' };
      return { dG0: -8.314 * T * Math.log(K) };
    }
  },
  {
    id: '85',
    title: 'Reaction Gibbs Energy',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'dG0', label: 'Standard Gibbs Energy Change', default: -5000, unit: 'J/mol' },
      { id: 'T', label: 'Temperature', default: 298, unit: 'K' },
      { id: 'Q', label: 'Reaction Quotient', default: 2, unit: '-' }
    ],
    outputs: [{ id: 'dG', label: 'Reaction Gibbs Energy', unit: 'J/mol' }],
    calculate: (inputs) => {
      const dG0 = inputs.dG0 ?? 0;
      const T = inputs.T ?? 0;
      const Q = inputs.Q ?? 0;
      if (Q <= 0 || T <= 0) return { error: 'Requires Q > 0 and T > 0 K' };
      return { dG: dG0 + 8.314 * T * Math.log(Q) };
    }
  },
  {
    id: '86',
    title: 'Equilibrium Constant',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'dG0', label: 'Standard Gibbs Energy', default: -5000, unit: 'J/mol' },
      { id: 'T', label: 'Temperature', default: 298, unit: 'K' }
    ],
    outputs: [{ id: 'K', label: 'Equilibrium Constant', unit: '-' }],
    calculate: (inputs) => {
      const dG0 = inputs.dG0 ?? 0;
      const T = inputs.T ?? 0;
      if (T <= 0) return { error: 'Temperature T must be > 0 K' };
      return { K: Math.exp(-dG0 / (8.314 * T)) };
    }
  },
  {
    id: '87',
    title: 'vant Hoff Equation',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'K1', label: 'K at T1', default: 1, unit: '-' },
      { id: 'T1', label: 'Temperature 1', default: 298, unit: 'K' },
      { id: 'T2', label: 'Temperature 2', default: 350, unit: 'K' },
      { id: 'dH0', label: 'Standard Enthalpy Change', default: -50000, unit: 'J/mol' }
    ],
    outputs: [{ id: 'K2', label: 'K at T2', unit: '-' }],
    calculate: (inputs) => {
      const R = 8.314;
      const K1 = inputs.K1 ?? 0;
      const T1 = inputs.T1 ?? 0;
      const T2 = inputs.T2 ?? 0;
      const dH0 = inputs.dH0 ?? 0;
      if (K1 <= 0 || T1 <= 0 || T2 <= 0) return { error: 'Requires K1 > 0, T1 > 0 K, and T2 > 0 K' };
      const lnK2 = Math.log(K1) - (dH0 / R) * (1 / T2 - 1 / T1);
      return { K2: Math.exp(lnK2) };
    }
  },
  {
    id: '88',
    title: 'Reaction Enthalpy',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'H_prod', label: 'Sum of Product Enthalpies', default: -393500, unit: 'J' },
      { id: 'H_react', label: 'Sum of Reactant Enthalpies', default: -110500, unit: 'J' }
    ],
    outputs: [{ id: 'dH_rxn', label: 'Reaction Enthalpy', unit: 'J' }],
    calculate: (inputs) => ({ dH_rxn: (inputs.H_prod || 0) - (inputs.H_react || 0) })
  },
  {
    id: '89',
    title: 'Reaction Entropy',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'S_prod', label: 'Sum of Product Entropies', default: 213.6, unit: 'J/K' },
      { id: 'S_react', label: 'Sum of Reactant Entropies', default: 197.6, unit: 'J/K' }
    ],
    outputs: [{ id: 'dS_rxn', label: 'Reaction Entropy', unit: 'J/K' }],
    calculate: (inputs) => ({ dS_rxn: (inputs.S_prod || 0) - (inputs.S_react || 0) })
  },
  {
    id: '90',
    title: 'Reaction Gibbs Energy (Standard)',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'G_prod', label: 'Sum of Product Standard Gibbs', default: -394400, unit: 'J' },
      { id: 'G_react', label: 'Sum of Reactant Standard Gibbs', default: -137200, unit: 'J' }
    ],
    outputs: [{ id: 'dG_rxn', label: 'Standard Reaction Gibbs Energy', unit: 'J' }],
    calculate: (inputs) => ({ dG_rxn: (inputs.G_prod || 0) - (inputs.G_react || 0) })
  },
  {
    id: '91',
    title: 'Raoults Law',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'xi', label: 'Liquid Mole Fraction', default: 0.5, unit: '-' },
      { id: 'Pisat', label: 'Saturation Pressure', default: 101325, unit: 'Pa' }
    ],
    outputs: [{ id: 'Pi', label: 'Partial Pressure', unit: 'Pa' }],
    calculate: (inputs) => ({ Pi: (inputs.xi || 0) * (inputs.Pisat || 0) })
  },
  {
    id: '92',
    title: 'Bubble Point Pressure',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'x1', label: 'Liquid Mole Fraction (x₁)', default: 0.5, unit: '-' },
      { id: 'P1sat', label: 'Sat. Pressure Comp. 1 (P₁ˢᵃᵗ)', default: 150, unit: 'kPa' },
      { id: 'P2sat', label: 'Sat. Pressure Comp. 2 (P₂ˢᵃᵗ)', default: 70, unit: 'kPa' }
    ],
    outputs: [
      { id: 'Pbubble', label: 'Bubble Point Pressure', unit: 'kPa' },
      { id: 'y1', label: 'Equilibrium Vapor y₁', unit: '-' }
    ],
    calculate: (inputs) => {
      const x1 = inputs.x1 ?? 0;
      const P1sat = inputs.P1sat ?? 0;
      const P2sat = inputs.P2sat ?? 0;
      if (x1 < 0 || x1 > 1 || P1sat <= 0 || P2sat <= 0) {
        return { error: 'Requires 0 ≤ x₁ ≤ 1 and P₁ˢᵃᵗ, P₂ˢᵃᵗ > 0' };
      }
      const Pbubble = x1 * P1sat + (1 - x1) * P2sat;
      const y1 = (x1 * P1sat) / Pbubble;
      return { Pbubble, y1 };
    }
  },
  {
    id: '93',
    title: 'Dew Point Pressure',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'y1', label: 'Vapor Mole Fraction (y₁)', default: 0.5, unit: '-' },
      { id: 'P1sat', label: 'Sat. Pressure Comp. 1 (P₁ˢᵃᵗ)', default: 150, unit: 'kPa' },
      { id: 'P2sat', label: 'Sat. Pressure Comp. 2 (P₂ˢᵃᵗ)', default: 70, unit: 'kPa' }
    ],
    outputs: [
      { id: 'Pdew', label: 'Dew Point Pressure', unit: 'kPa' },
      { id: 'x1', label: 'Equilibrium Liquid x₁', unit: '-' }
    ],
    calculate: (inputs) => {
      const y1 = inputs.y1 ?? 0;
      const P1sat = inputs.P1sat ?? 0;
      const P2sat = inputs.P2sat ?? 0;
      if (y1 < 0 || y1 > 1 || P1sat <= 0 || P2sat <= 0) {
        return { error: 'Requires 0 ≤ y₁ ≤ 1 and P₁ˢᵃᵗ, P₂ˢᵃᵗ > 0' };
      }
      const Pdew = 1 / (y1 / P1sat + (1 - y1) / P2sat);
      const x1 = (y1 * Pdew) / P1sat;
      return { Pdew, x1 };
    }
  },
  {
    id: '94',
    title: 'Bubble Point Temperature',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'x1', label: 'Liquid Mole Fraction (x₁)', default: 0.5, unit: '-' },
      { id: 'P', label: 'System Pressure (P)', default: 760, unit: 'mmHg' },
      { id: 'A1', label: 'Antoine A₁ (Benzene)', default: 6.90565, unit: '-' },
      { id: 'B1', label: 'Antoine B₁', default: 1211.033, unit: '°C' },
      { id: 'C1', label: 'Antoine C₁', default: 220.79, unit: '°C' },
      { id: 'A2', label: 'Antoine A₂ (Toluene)', default: 6.95464, unit: '-' },
      { id: 'B2', label: 'Antoine B₂', default: 1344.8, unit: '°C' },
      { id: 'C2', label: 'Antoine C₂', default: 219.482, unit: '°C' }
    ],
    outputs: [
      { id: 'T_bubble', label: 'Bubble Point Temperature', unit: '°C' },
      { id: 'y1', label: 'Equilibrium Vapor y₁', unit: '-' }
    ],
    calculate: (inputs) => {
      const x1 = inputs.x1 ?? 0;
      const P = inputs.P ?? 0;
      const A1 = inputs.A1 ?? 6.90565, B1 = inputs.B1 ?? 1211.033, C1 = inputs.C1 ?? 220.79;
      const A2 = inputs.A2 ?? 6.95464, B2 = inputs.B2 ?? 1344.8, C2 = inputs.C2 ?? 219.482;
      if (x1 < 0 || x1 > 1 || P <= 0) return { error: 'Requires 0 ≤ x₁ ≤ 1 and P > 0' };
      const logP = Math.log10(P);
      if (A1 <= logP || A2 <= logP || B1 <= 0 || B2 <= 0) {
        return { error: 'Pressure exceeds valid Antoine domain for given constants' };
      }
      const T1sat = B1 / (A1 - logP) - C1;
      const T2sat = B2 / (A2 - logP) - C2;
      let lo = Math.min(T1sat, T2sat);
      let hi = Math.max(T1sat, T2sat);
      const psat = (A: number, B: number, C: number, T: number) => Math.pow(10, A - B / (T + C));
      for (let iter = 0; iter < 60; iter++) {
        const mid = 0.5 * (lo + hi);
        const fMid = x1 * psat(A1, B1, C1, mid) + (1 - x1) * psat(A2, B2, C2, mid) - P;
        if (Math.abs(fMid) < 1e-9) { lo = hi = mid; break; }
        if (fMid < 0) lo = mid;
        else hi = mid;
      }
      const T_bubble = 0.5 * (lo + hi);
      const y1 = (x1 * psat(A1, B1, C1, T_bubble)) / P;
      return { T_bubble, y1 };
    }
  },
  {
    id: '95',
    title: 'Dew Point Temperature',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'y1', label: 'Vapor Mole Fraction (y₁)', default: 0.5, unit: '-' },
      { id: 'P', label: 'System Pressure (P)', default: 760, unit: 'mmHg' },
      { id: 'A1', label: 'Antoine A₁ (Benzene)', default: 6.90565, unit: '-' },
      { id: 'B1', label: 'Antoine B₁', default: 1211.033, unit: '°C' },
      { id: 'C1', label: 'Antoine C₁', default: 220.79, unit: '°C' },
      { id: 'A2', label: 'Antoine A₂ (Toluene)', default: 6.95464, unit: '-' },
      { id: 'B2', label: 'Antoine B₂', default: 1344.8, unit: '°C' },
      { id: 'C2', label: 'Antoine C₂', default: 219.482, unit: '°C' }
    ],
    outputs: [
      { id: 'T_dew', label: 'Dew Point Temperature', unit: '°C' },
      { id: 'x1', label: 'Equilibrium Liquid x₁', unit: '-' }
    ],
    calculate: (inputs) => {
      const y1 = inputs.y1 ?? 0;
      const P = inputs.P ?? 0;
      const A1 = inputs.A1 ?? 6.90565, B1 = inputs.B1 ?? 1211.033, C1 = inputs.C1 ?? 220.79;
      const A2 = inputs.A2 ?? 6.95464, B2 = inputs.B2 ?? 1344.8, C2 = inputs.C2 ?? 219.482;
      if (y1 < 0 || y1 > 1 || P <= 0) return { error: 'Requires 0 ≤ y₁ ≤ 1 and P > 0' };
      const logP = Math.log10(P);
      if (A1 <= logP || A2 <= logP || B1 <= 0 || B2 <= 0) {
        return { error: 'Pressure exceeds valid Antoine domain for given constants' };
      }
      const T1sat = B1 / (A1 - logP) - C1;
      const T2sat = B2 / (A2 - logP) - C2;
      let lo = Math.min(T1sat, T2sat);
      let hi = Math.max(T1sat, T2sat);
      const psat = (A: number, B: number, C: number, T: number) => Math.pow(10, A - B / (T + C));
      for (let iter = 0; iter < 60; iter++) {
        const mid = 0.5 * (lo + hi);
        // f(T) = y1*P/P1sat(T) + (1-y1)*P/P2sat(T) - 1 is strictly decreasing with T
        const fMid = (y1 * P) / psat(A1, B1, C1, mid) + ((1 - y1) * P) / psat(A2, B2, C2, mid) - 1;
        if (Math.abs(fMid) < 1e-9) { lo = hi = mid; break; }
        if (fMid > 0) lo = mid;
        else hi = mid;
      }
      const T_dew = 0.5 * (lo + hi);
      const x1 = (y1 * P) / psat(A1, B1, C1, T_dew);
      return { T_dew, x1 };
    }
  },
  {
    id: '96',
    title: 'Relative Volatility',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'Ki', label: 'K-value of component i', default: 2.0, unit: '-' },
      { id: 'Kj', label: 'K-value of component j', default: 0.8, unit: '-' }
    ],
    outputs: [{ id: 'alpha', label: 'Relative Volatility', unit: '-' }],
    calculate: (inputs) => {
      const Kj = inputs.Kj ?? 0;
      if (Kj === 0) return { error: 'K-value of component j (Kj) cannot be zero' };
      return { alpha: (inputs.Ki ?? 0) / Kj };
    }
  },
  {
    id: '97',
    title: 'K-value Calculator',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'yi', label: 'Vapor Mole Fraction', default: 0.6, unit: '-' },
      { id: 'xi', label: 'Liquid Mole Fraction', default: 0.4, unit: '-' }
    ],
    outputs: [{ id: 'Ki', label: 'K-value', unit: '-' }],
    calculate: (inputs) => {
      const xi = inputs.xi ?? 0;
      if (xi === 0) return { error: 'Liquid mole fraction (xi) cannot be zero' };
      return { Ki: (inputs.yi ?? 0) / xi };
    }
  },
  {
    id: '98',
    title: 'VLE Flash Calculation',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'z1', label: 'Feed Mol Frac 1', default: 0.5, unit: '-' },
      { id: 'K1', label: 'K-value 1', default: 2.0, unit: '-' },
      { id: 'z2', label: 'Feed Mol Frac 2', default: 0.5, unit: '-' },
      { id: 'K2', label: 'K-value 2', default: 0.5, unit: '-' }
    ],
    outputs: [
      { id: 'VF', label: 'Vapor Fraction (V/F)', unit: '-' },
      { id: 'x1', label: 'Liquid Mole Fraction (x₁)', unit: '-' },
      { id: 'y1', label: 'Vapor Mole Fraction (y₁)', unit: '-' }
    ],
    calculate: (inputs) => {
      const z1Raw = inputs.z1 ?? 0;
      const z2Raw = inputs.z2 ?? 0;
      const K1 = inputs.K1 ?? 0;
      const K2 = inputs.K2 ?? 0;
      const zSum = z1Raw + z2Raw;
      if (z1Raw < 0 || z2Raw < 0 || zSum <= 0) {
        return { error: 'Feed mole fractions must be ≥ 0 with sum > 0' };
      }
      if (K1 <= 0 || K2 <= 0) {
        return { error: 'K-values must be > 0' };
      }
      const z1 = z1Raw / zSum;
      const z2 = z2Raw / zSum;

      // Bubble point check: sum(z_i * K_i) <= 1 -> subcooled liquid (VF = 0)
      if (z1 * K1 + z2 * K2 <= 1) {
        return { VF: 0, x1: z1, y1: Math.min(1, K1 * z1) };
      }
      // Dew point check: sum(z_i / K_i) <= 1 -> superheated vapor (VF = 1)
      if (z1 / K1 + z2 / K2 <= 1) {
        return { VF: 1, x1: Math.min(1, z1 / K1), y1: z1 };
      }

      // Exact binary Rachford-Rice analytical solution
      const denom = (K1 - 1) * (1 - K2);
      if (Math.abs(denom) < 1e-12) {
        return { error: 'Degenerate K-values for two-phase flash' };
      }
      const VF = Math.max(0, Math.min(1, (z1 * K1 + z2 * K2 - 1) / denom));
      const x1 = z1 / (1 + VF * (K1 - 1));
      const y1 = K1 * x1;
      return { VF, x1, y1 };
    }
  }
];
