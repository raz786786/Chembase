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
    calculate: (inputs) => ({ xi: (inputs.ni || 0) / (inputs.ntot || 1) })
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
    calculate: (inputs) => ({ wi: (inputs.mi || 0) / (inputs.mtot || 1) })
  },
  {
    id: '53',
    title: 'Average Molecular Weight',
    category: 'Mixtures',
    inputs: [
      { id: 'sum_yi_Mi', label: 'Sum of (y_i * M_i)', default: 28.97, unit: 'kg/kmol' }
    ],
    outputs: [{ id: 'Mavg', label: 'Average Molecular Weight', unit: 'kg/kmol' }],
    calculate: (inputs) => ({ Mavg: inputs.sum_yi_Mi || 0 })
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
    calculate: (inputs) => ({ Pi: (inputs.yi || 0) * (inputs.Ptot || 0) })
  },
  {
    id: '55',
    title: 'Partial Molar Properties',
    category: 'Mixtures',
    inputs: [
      { id: 'Mtot', label: 'Total Property', default: 1000, unit: 'any' },
      { id: 'ni', label: 'Moles of Component i', default: 10, unit: 'mol' }
    ],
    outputs: [{ id: 'Mi_partial', label: 'Partial Molar Property', unit: 'any/mol' }],
    calculate: (inputs) => ({ Mi_partial: (inputs.Mtot || 0) / (inputs.ni || 1) })
  },
  {
    id: '56',
    title: 'Mixture Enthalpy',
    category: 'Mixtures',
    inputs: [
      { id: 'sum_xi_hi', label: 'Sum of (x_i * h_i)', default: 2500, unit: 'J/mol' }
    ],
    outputs: [{ id: 'Hmix', label: 'Mixture Enthalpy', unit: 'J/mol' }],
    calculate: (inputs) => ({ Hmix: inputs.sum_xi_hi || 0 })
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
      const eta = 1 - ((inputs.TL || 0) / (inputs.TH || 1));
      const W = (inputs.QH || 0) * eta;
      const QL = (inputs.QH || 0) - W;
      return { eta, W, QL };
    }
  },
  {
    id: '58',
    title: 'Rankine Cycle Analyzer',
    category: 'Power Cycles',
    inputs: [
      { id: 'h1', label: 'Pump Inlet Enthalpy', default: 300, unit: 'J/kg' },
      { id: 'h2', label: 'Pump Outlet Enthalpy', default: 310, unit: 'J/kg' },
      { id: 'h3', label: 'Turbine Inlet Enthalpy', default: 3500, unit: 'J/kg' },
      { id: 'h4', label: 'Turbine Outlet Enthalpy', default: 2200, unit: 'J/kg' }
    ],
    outputs: [
      { id: 'Wp', label: 'Pump Work', unit: 'J/kg' },
      { id: 'Wt', label: 'Turbine Work', unit: 'J/kg' },
      { id: 'Qin', label: 'Heat Input', unit: 'J/kg' },
      { id: 'eta', label: 'Efficiency', unit: '-' }
    ],
    calculate: (inputs) => {
      const Wp = (inputs.h2 || 0) - (inputs.h1 || 0);
      const Wt = (inputs.h3 || 0) - (inputs.h4 || 0);
      const Qin = (inputs.h3 || 0) - (inputs.h2 || 0);
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
      { id: 'Wt1', label: 'HP Turbine Work', default: 1000, unit: 'J/kg' },
      { id: 'Wt2', label: 'LP Turbine Work', default: 800, unit: 'J/kg' },
      { id: 'Wp', label: 'Pump Work', default: 10, unit: 'J/kg' },
      { id: 'Qin1', label: 'Primary Heat Input', default: 3000, unit: 'J/kg' },
      { id: 'Qin2', label: 'Reheat Heat Input', default: 1500, unit: 'J/kg' }
    ],
    outputs: [
      { id: 'Wnet', label: 'Net Work', unit: 'J/kg' },
      { id: 'eta', label: 'Efficiency', unit: '-' }
    ],
    calculate: (inputs) => {
      const Wnet = (inputs.Wt1 || 0) + (inputs.Wt2 || 0) - (inputs.Wp || 0);
      const Qin_tot = (inputs.Qin1 || 0) + (inputs.Qin2 || 0);
      const eta = Qin_tot !== 0 ? Wnet / Qin_tot : 0;
      return { Wnet, eta };
    }
  },
  {
    id: '60',
    title: 'Regenerative Rankine Cycle',
    category: 'Power Cycles',
    inputs: [
      { id: 'h_ex', label: 'Extraction Enthalpy', default: 2800, unit: 'J/kg' },
      { id: 'h_fw', label: 'FW Heater Outlet Enthalpy', default: 800, unit: 'J/kg' },
      { id: 'h_cond', label: 'Condenser Outlet Enthalpy', default: 200, unit: 'J/kg' }
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
      const rp = inputs.rp || 1;
      const k = inputs.k || 1.4;
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
    calculate: (inputs) => ({ Px: Math.sqrt((inputs.P1 || 0) * (inputs.P2 || 0)) })
  },
  {
    id: '63',
    title: 'Reheated Brayton',
    category: 'Power Cycles',
    inputs: [
      { id: 'Wt1', label: 'HP Turbine Work', default: 500, unit: 'J/kg' },
      { id: 'Wt2', label: 'LP Turbine Work', default: 500, unit: 'J/kg' },
      { id: 'Wc', label: 'Compressor Work', default: 400, unit: 'J/kg' }
    ],
    outputs: [{ id: 'Wnet', label: 'Net Work', unit: 'J/kg' }],
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
      const r = inputs.r || 1;
      const k = inputs.k || 1.4;
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
      const r = inputs.r || 1;
      const rc = inputs.rc || 1;
      const k = inputs.k || 1.4;
      const term1 = 1 / Math.pow(r, k - 1);
      const term2 = (Math.pow(rc, k) - 1) / (k * (rc - 1));
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
      const r = inputs.r || 1;
      const rc = inputs.rc || 1;
      const rp = inputs.rp || 1;
      const k = inputs.k || 1.4;
      const num = rp * Math.pow(rc, k) - 1;
      const den = (rp - 1) + k * rp * (rc - 1);
      const term1 = 1 / Math.pow(r, k - 1);
      return { eta: 1 - term1 * (num / (den || 1)) };
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
    calculate: (inputs) => ({ COP_R: (inputs.W || 0) !== 0 ? (inputs.QL || 0) / inputs.W : 0 })
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
    calculate: (inputs) => ({ COP_HP: (inputs.W || 0) !== 0 ? (inputs.QH || 0) / inputs.W : 0 })
  },
  {
    id: '70',
    title: 'Vapor Compression Cycle Analyzer',
    category: 'Refrigeration',
    inputs: [
      { id: 'h1', label: 'Compressor Inlet h', default: 2400, unit: 'J/kg' },
      { id: 'h2', label: 'Compressor Exit h', default: 2800, unit: 'J/kg' },
      { id: 'h3', label: 'Condenser Exit h', default: 1000, unit: 'J/kg' },
      { id: 'h4', label: 'Evaporator Inlet h', default: 1000, unit: 'J/kg' }
    ],
    outputs: [{ id: 'COP', label: 'COP', unit: '-' }],
    calculate: (inputs) => {
      const qL = (inputs.h1 || 0) - (inputs.h4 || 0);
      const win = (inputs.h2 || 0) - (inputs.h1 || 0);
      return { COP: win !== 0 ? qL / win : 0 };
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
      { id: 'W_s', label: 'Isentropic Work', default: 300, unit: 'J/kg' },
      { id: 'W_a', label: 'Actual Work', default: 350, unit: 'J/kg' }
    ],
    outputs: [{ id: 'eta_c', label: 'Isentropic Efficiency', unit: '-' }],
    calculate: (inputs) => ({ eta_c: (inputs.W_a || 0) !== 0 ? (inputs.W_s || 0) / inputs.W_a : 0 })
  },
  {
    id: '74',
    title: 'Throttling Valve',
    category: 'Refrigeration',
    inputs: [
      { id: 'h1', label: 'Inlet Enthalpy', default: 1000, unit: 'J/kg' }
    ],
    outputs: [{ id: 'h2', label: 'Exit Enthalpy', unit: 'J/kg' }],
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
    outputs: [{ id: 'O2_req', label: 'Theoretical O2 Moles', unit: 'mol' }],
    calculate: (inputs) => ({ O2_req: (inputs.x || 0) + (inputs.y || 0) / 4 })
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
      const diff = (inputs.Air_actual || 0) - (inputs.Air_theo || 1);
      return { Excess_Air_Pct: (diff / (inputs.Air_theo || 1)) * 100 };
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
    calculate: (inputs) => ({ LHV: (inputs.HHV || 0) - ((inputs.m_water || 0) * (inputs.h_fg || 2442000)) })
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
      return { mu: (inputs.mu0 || 0) + R * (inputs.T || 0) * Math.log(inputs.a || 1) };
    }
  },
  {
    id: '84',
    title: 'Equilibrium Constant from ΔG°',
    category: 'Chemical Thermodynamics',
    inputs: [
      { id: 'K', label: 'Equilibrium Constant', default: 10, unit: '-' },
      { id: 'T', label: 'Temperature', default: 298, unit: 'K' }
    ],
    outputs: [{ id: 'dG0', label: 'Standard Gibbs Energy', unit: 'J/mol' }],
    calculate: (inputs) => ({ dG0: -8.314 * (inputs.T || 0) * Math.log(inputs.K || 1) })
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
    calculate: (inputs) => ({ dG: (inputs.dG0 || 0) + 8.314 * (inputs.T || 0) * Math.log(inputs.Q || 1) })
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
    calculate: (inputs) => ({ K: Math.exp(-(inputs.dG0 || 0) / (8.314 * (inputs.T || 1))) })
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
      const lnK2 = Math.log(inputs.K1 || 1) - ((inputs.dH0 || 0) / R) * (1 / (inputs.T2 || 1) - 1 / (inputs.T1 || 1));
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
      { id: 'sum_xi_Pisat', label: 'Sum of (x_i * P_i^sat)', default: 101325, unit: 'Pa' }
    ],
    outputs: [{ id: 'Pbubble', label: 'Bubble Point Pressure', unit: 'Pa' }],
    calculate: (inputs) => ({ Pbubble: inputs.sum_xi_Pisat || 0 })
  },
  {
    id: '93',
    title: 'Dew Point Pressure',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'sum_yi_over_Pisat', label: 'Sum of (y_i / P_i^sat)', default: 0.00001, unit: '1/Pa' }
    ],
    outputs: [{ id: 'Pdew', label: 'Dew Point Pressure', unit: 'Pa' }],
    calculate: (inputs) => ({ Pdew: 1 / (inputs.sum_yi_over_Pisat || 1) })
  },
  {
    id: '94',
    title: 'Bubble Point Temperature',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'T_est', label: 'Estimated Bubble Temperature', default: 350, unit: 'K' }
    ],
    outputs: [{ id: 'T_bubble', label: 'Bubble Point Temperature', unit: 'K' }],
    calculate: (inputs) => ({ T_bubble: inputs.T_est || 0 })
  },
  {
    id: '95',
    title: 'Dew Point Temperature',
    category: 'Phase Equilibrium / VLE',
    inputs: [
      { id: 'T_est', label: 'Estimated Dew Temperature', default: 360, unit: 'K' }
    ],
    outputs: [{ id: 'T_dew', label: 'Dew Point Temperature', unit: 'K' }],
    calculate: (inputs) => ({ T_dew: inputs.T_est || 0 })
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
    calculate: (inputs) => ({ alpha: (inputs.Kj || 1) !== 0 ? (inputs.Ki || 0) / (inputs.Kj || 1) : 0 })
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
    calculate: (inputs) => ({ Ki: (inputs.xi || 1) !== 0 ? (inputs.yi || 0) / (inputs.xi || 1) : 0 })
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
    outputs: [{ id: 'VF', label: 'Vapor Fraction (V/F)', unit: '-' }],
    calculate: (inputs) => {
      // Simplified binary flash approximation solver
      let VF = 0.5;
      for (let i = 0; i < 10; i++) {
        let f = (inputs.z1 || 0) * ((inputs.K1 || 1) - 1) / (1 + VF * ((inputs.K1 || 1) - 1)) + 
                (inputs.z2 || 0) * ((inputs.K2 || 1) - 1) / (1 + VF * ((inputs.K2 || 1) - 1));
        let df = -(inputs.z1 || 0) * Math.pow((inputs.K1 || 1) - 1, 2) / Math.pow(1 + VF * ((inputs.K1 || 1) - 1), 2) - 
                 (inputs.z2 || 0) * Math.pow((inputs.K2 || 1) - 1, 2) / Math.pow(1 + VF * ((inputs.K2 || 1) - 1), 2);
        if (Math.abs(df) > 1e-6) VF = VF - f / df;
      }
      return { VF: Math.max(0, Math.min(1, VF)) };
    }
  }
];
