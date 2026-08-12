import { useState, useMemo } from 'react';
import { 
  Zap, 
  TrendingUp, 
  RefreshCw, 
  Microscope,
  Info,
  ChevronRight,
  Database,
  Thermometer,
  Droplets
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { COMPONENT_DB } from './ChemData';
import type { ChemComponent } from './ChemData';
import { isToolEnabled } from '../../utils/moduleVisibility';

// ─── PENG-ROBINSON EQUATION OF STATE (CUBIC Z-ROOT & FUGACITY) ───
function PREOSCalc() {
  const R = 8.31446261815324; // J/(mol K)
  const [gasId, setGasId] = useState(COMPONENT_DB[0].id);
  const [T, setT] = useState('350'); // K
  const [P_in, setP_in] = useState('10'); // bar

  const gas = COMPONENT_DB.find(g => g.id === gasId)!;
  const t = parseFloat(T);
  const p_bar = parseFloat(P_in);
  const p_pa = p_bar * 100000;

  let Z_v = NaN;
  let Z_l = NaN;
  let phi_v = NaN;
  let phi_l = NaN;
  let V_v = NaN;
  let V_l = NaN;
  let phaseState = 'Single Phase / Supercritical';

  if (!isNaN(t) && !isNaN(p_pa) && t > 0 && p_pa > 0) {
    const Tc = gas.tc;
    const Pc = gas.pc * 100000;
    const w = gas.w;

    const Tr = t / Tc;
    const kappa = 0.37464 + 1.54226 * w - 0.26992 * w * w;
    const alpha = Math.pow(1 + kappa * (1 - Math.sqrt(Tr)), 2);

    const a = (0.45724 * R * R * Tc * Tc * alpha) / Pc;
    const b = (0.07780 * R * Tc) / Pc;

    const A_param = (a * p_pa) / (R * R * t * t);
    const B_param = (b * p_pa) / (R * t);

    // Cubic polynomial for Z: Z^3 + c2*Z^2 + c1*Z + c0 = 0
    const c2 = -(1 - B_param);
    const c1 = A_param - 3 * B_param * B_param - 2 * B_param;
    const c0 = -(A_param * B_param - B_param * B_param - B_param * B_param * B_param);

    // Cardano's Analytical Cubic Solver
    const Q_c = (3 * c1 - c2 * c2) / 9;
    const R_c = (9 * c2 * c1 - 27 * c0 - 2 * c2 * c2 * c2) / 54;
    const D_c = Q_c * Q_c * Q_c + R_c * R_c;

    const roots: number[] = [];
    if (D_c < 0) {
      // 3 Real Roots (Vapor-Liquid Equilibrium region)
      const theta = Math.acos(R_c / Math.sqrt(-Q_c * Q_c * Q_c));
      const sqrtQ = Math.sqrt(-Q_c);
      const z1 = 2 * sqrtQ * Math.cos(theta / 3) - c2 / 3;
      const z2 = 2 * sqrtQ * Math.cos((theta + 2 * Math.PI) / 3) - c2 / 3;
      const z3 = 2 * sqrtQ * Math.cos((theta + 4 * Math.PI) / 3) - c2 / 3;
      roots.push(z1, z2, z3);
    } else {
      // 1 Real Root
      const S_c = Math.cbrt(R_c + Math.sqrt(D_c));
      const T_c_val = Math.cbrt(R_c - Math.sqrt(D_c));
      const z1 = S_c + T_c_val - c2 / 3;
      roots.push(z1);
    }

    const validRoots = roots.filter(z => z > B_param).sort((x, y) => x - y);
    if (validRoots.length === 3) {
      Z_l = validRoots[0];
      Z_v = validRoots[2];
      phaseState = 'Two-Phase (VLE Region)';
    } else if (validRoots.length === 1) {
      Z_v = validRoots[0];
      Z_l = validRoots[0];
      phaseState = Tr > 1.0 ? 'Supercritical Gas' : (Z_v > 0.5 ? 'Vapor Phase' : 'Liquid Phase');
    } else if (validRoots.length > 0) {
      Z_v = validRoots[validRoots.length - 1];
      Z_l = validRoots[0];
    }

    const calcPhi = (Z: number) => {
      if (isNaN(Z) || Z <= B_param) return NaN;
      const term1 = Z - 1 - Math.log(Z - B_param);
      const term2 = (A_param / (2 * Math.sqrt(2) * B_param)) * Math.log((Z + (1 + Math.sqrt(2)) * B_param) / (Z + (1 - Math.sqrt(2)) * B_param));
      return Math.exp(term1 - term2);
    };

    phi_v = calcPhi(Z_v);
    phi_l = calcPhi(Z_l);
    V_v = (Z_v * R * t) / p_pa;
    V_l = (Z_l * R * t) / p_pa;
  }

  return (
    <CalcCard title="Peng-Robinson Cubic Equation of State (Z-Factor & Fugacity)" icon={Microscope}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Full Cardano analytical cubic Z-root selection with fugacity coefficients (φ) & molar volumes.</p>
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-grow">
          <div className="mb-6 group">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Target Component</label>
            <div className="relative">
              <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
              <select 
                value={gasId} 
                onChange={e => setGasId(e.target.value)} 
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                {COMPONENT_DB.map(g => <option key={g.id} value={g.id}>{g.name} ({g.formula})</option>)}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
            </div>
          </div>
          <InputRow label="Temperature (T)" unit="K" value={T} onChange={setT} />
          <InputRow label="System Pressure (P)" unit="bar" value={P_in} onChange={setP_in} />
        </div>
        
        <div className="md:w-72 p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4">Phase & Critical Constants</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-500">Phase Region</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{phaseState}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-500">T_c</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{gas.tc} K</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-500">P_c</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{gas.pc} bar</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-500">Acentric ω</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{gas.w}</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
              <Info className="w-3 h-3" /> Cardano Analytical Cubic Solver
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <ResultBox label="Vapor Z-Factor (Z_v)" value={isNaN(Z_v) ? '--' : Z_v.toFixed(4)} unit="" color="#6366f1" />
        <ResultBox label="Liquid Z-Factor (Z_l)" value={isNaN(Z_l) ? '--' : Z_l.toFixed(4)} unit="" color="#3b82f6" />
        <ResultBox label="Fugacity Coeff. (φ_v)" value={isNaN(phi_v) ? '--' : phi_v.toFixed(4)} unit="" color="#10b981" />
        <ResultBox label="Fugacity Coeff. (φ_l)" value={isNaN(phi_l) ? '--' : phi_l.toFixed(4)} unit="" color="#f59e0b" />
        <ResultBox label="Vapor Molar Vol (V_v)" value={isNaN(V_v) ? '--' : (V_v * 1000).toFixed(2)} unit="L/mol" color="#8b5cf6" />
        <ResultBox label="Liquid Molar Vol (V_l)" value={isNaN(V_l) ? '--' : (V_l * 1000).toFixed(3)} unit="L/mol" color="#ec4899" />
      </div>
    </CalcCard>
  );
}

// ─── RIGOROUS FLASH CALCULATION ───
function RigorousFlashCalc() {
  const [comp1, setComp1] = useState(COMPONENT_DB[1].id);
  const [comp2, setComp2] = useState(COMPONENT_DB[4].id);
  const [z1, setZ1] = useState('0.4');
  const [T, setT] = useState('280');
  const [P, setP] = useState('5');

  const c1 = COMPONENT_DB.find(g => g.id === comp1)!;
  const c2 = COMPONENT_DB.find(g => g.id === comp2)!;
  const z_1 = parseFloat(z1);
  const z_2 = 1 - z_1;
  const t = parseFloat(T);
  const p = parseFloat(P);

  const getPsat = (comp: ChemComponent, tempK: number) => {
    return Math.pow(10, comp.antoine.A - (comp.antoine.B / (tempK + comp.antoine.C)));
  };

  const Psat1 = getPsat(c1, t);
  const Psat2 = getPsat(c2, t);
  
  const k_1 = p > 0 ? Psat1 / p : NaN;
  const k_2 = p > 0 ? Psat2 / p : NaN;

  let V_F = 0.5;
  let valid = false;
  if (!isNaN(z_1) && !isNaN(k_1) && !isNaN(k_2) && isFinite(k_1) && isFinite(k_2) && p > 0) {
    let low = 0;
    let high = 1;
    for (let i = 0; i < 60; i++) {
      V_F = (low + high) / 2;
      // Standard Rachford-Rice equation
      const f = (z_1 * (k_1 - 1)) / (1 + V_F * (k_1 - 1)) + (z_2 * (k_2 - 1)) / (1 + V_F * (k_2 - 1));
      if (f > 0) low = V_F;
      else high = V_F;
    }
    valid = V_F > 0.001 && V_F < 0.999;
  }

  const x_1 = !isNaN(k_1) && (1 + V_F * (k_1 - 1)) !== 0 ? z_1 / (1 + V_F * (k_1 - 1)) : NaN;
  const y_1 = !isNaN(x_1) && !isNaN(k_1) ? k_1 * x_1 : NaN;

  let stateStr = "Two-Phase Equilibrium";
  if (p <= 0 || isNaN(p) || isNaN(t)) {
    stateStr = "Invalid Input Conditions";
  } else {
    const isSubcooled = V_F <= 0.001;
    const isSuperheated = V_F >= 0.999;
    if (isSubcooled) stateStr = "Subcooled Liquid (V/F = 0)";
    if (isSuperheated) stateStr = "Superheated Vapor (V/F = 1)";
  }

  return (
    <CalcCard title="Isothermal Flash (Rachford-Rice)" icon={Zap}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">VLE fraction determination using Antoine correlations for K-values.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="group">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Component A (Light)</label>
            <select value={comp1} onChange={e => setComp1(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold outline-none focus:border-indigo-500">
              {COMPONENT_DB.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <InputRow label="Feed Fraction (z₁)" unit="mol/mol" value={z1} onChange={setZ1} />
        </div>
        <div className="space-y-6">
          <div className="group">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Component B (Heavy)</label>
            <select value={comp2} onChange={e => setComp2(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold outline-none focus:border-indigo-500">
              {COMPONENT_DB.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <InputRow label="System Temp" unit="K" value={T} onChange={setT} />
          <InputRow label="System Pressure" unit="bar" value={P} onChange={setP} />
        </div>
      </div>

      <div className={`mb-10 p-4 rounded-2xl border text-center font-bold text-sm ${valid ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
        Phase State: {stateStr}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
          <ResultBox label="Vapor Fraction (V/F)" value={valid ? V_F.toFixed(4) : '--'} unit="" color="#f97316" />
          <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>y₁: {valid ? y_1.toFixed(3) : '--'}</span>
            <span>K₁: {valid ? k_1.toFixed(2) : '--'}</span>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
          <ResultBox label="Liquid Fraction (L/F)" value={valid ? (1 - V_F).toFixed(4) : '--'} unit="" color="#3b82f6" />
          <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>x₁: {valid ? x_1.toFixed(3) : '--'}</span>
            <span>P₁s: {valid ? Psat1.toFixed(2) : '--'} bar</span>
          </div>
        </div>
      </div>
    </CalcCard>
  );
}

// ─── RIGOROUS PHASE DIAGRAM ───
function RigorousPhaseDiagram() {
  const [gasId, setGasId] = useState(COMPONENT_DB[0].id);
  const gas = COMPONENT_DB.find(g => g.id === gasId)!;

  const data = useMemo(() => {
    const pts = [];
    const t_start = 250;
    const t_end = gas.tc;
    const steps = 60;
    const step_size = (t_end - t_start) / steps;

    for (let temp = t_start; temp <= t_end; temp += step_size) {
      const p_bar = Math.pow(10, gas.antoine.A - (gas.antoine.B / (temp + gas.antoine.C)));
      if (p_bar > 0 && isFinite(p_bar)) {
        pts.push({ temp: parseFloat(temp.toFixed(1)), p: p_bar });
      }
    }
    return pts;
  }, [gas]);

  return (
    <CalcCard title="Vapor Pressure Curve (Antoine & Wagner Correlation)" icon={TrendingUp}>
      <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
        <select value={gasId} onChange={e => setGasId(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold outline-none focus:border-indigo-500">
          {COMPONENT_DB.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4" /> Trace to critical point: {gas.tc} K / {gas.pc} bar
        </span>
      </div>

      <div className="h-[400px] w-full bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="temp" type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis scale="log" domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <RechartsTooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
            />
            <Line type="monotone" dataKey="p" stroke="#6366f1" strokeWidth={4} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CalcCard>
  );
}

// ─── HEAT CAPACITY, ENTHALPY & ENTROPY POLYNOMIAL INTEGRATOR ───
function HeatCapacityEnthalpyCalc() {
  const R = 8.314462618;
  const [T1, setT1] = useState('300'); // K
  const [T2, setT2] = useState('600'); // K
  const [P1, setP1] = useState('1');   // bar
  const [P2, setP2] = useState('10');  // bar
  const [a_coeff, setA] = useState('30.09');
  const [b_coeff, setB] = useState('0.00683');
  const [c_coeff, setC] = useState('0.00000679');
  const [d_coeff, setD] = useState('-0.00000000253');
  const [dHvap, setDHvap] = useState('40.65'); // kJ/mol for water phase transition
  const [Tsat, setTsat] = useState('373.15'); // K

  const t1 = parseFloat(T1), t2 = parseFloat(T2);
  const p1 = parseFloat(P1), p2 = parseFloat(P2);
  const a = parseFloat(a_coeff), b = parseFloat(b_coeff), c = parseFloat(c_coeff), d = parseFloat(d_coeff);
  const dh_v = parseFloat(dHvap), t_sat = parseFloat(Tsat);

  let deltaH_sensible = NaN;
  let deltaH_latent = 0;
  let deltaH_total = NaN;
  let deltaS_temp = NaN;
  let deltaS_press = NaN;
  let deltaS_total = NaN;

  if (!isNaN(t1) && !isNaN(t2) && t1 > 0 && t2 > 0 && !isNaN(a)) {
    // Sensible Enthalpy: Integral Cp(T) dT = a(T2-T1) + b/2(T2^2-T1^2) + c/3(T2^3-T1^3) + d/4(T2^4-T1^4)
    deltaH_sensible = a * (t2 - t1) + 
                      (b / 2) * (t2 * t2 - t1 * t1) + 
                      (c / 3) * (t2 * t2 * t2 - t1 * t1 * t1) + 
                      (d / 4) * (Math.pow(t2, 4) - Math.pow(t1, 4)); // J/mol

    // Phase transition detection
    if ((t1 <= t_sat && t2 >= t_sat) || (t2 <= t_sat && t1 >= t_sat)) {
      deltaH_latent = (t2 >= t1 ? 1 : -1) * dh_v * 1000; // J/mol
    }

    deltaH_total = (deltaH_sensible + deltaH_latent) / 1000; // kJ/mol

    // Entropy: Integral (Cp/T) dT - R ln(P2/P1)
    deltaS_temp = a * Math.log(t2 / t1) + 
                  b * (t2 - t1) + 
                  (c / 2) * (t2 * t2 - t1 * t1) + 
                  (d / 3) * (Math.pow(t2, 3) - Math.pow(t1, 3)); // J/(mol K)
    
    deltaS_press = !isNaN(p1) && !isNaN(p2) && p1 > 0 && p2 > 0 ? -R * Math.log(p2 / p1) : 0;
    
    let deltaS_latent = 0;
    if (deltaH_latent !== 0) {
      deltaS_latent = deltaH_latent / t_sat;
    }
    
    deltaS_total = deltaS_temp + deltaS_press + deltaS_latent; // J/(mol K)
  }

  return (
    <CalcCard title="Heat Capacity, Enthalpy & Entropy Integrator" icon={Zap}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Polynomial Cp(T) = a + bT + cT² + dT³ integration with phase change enthalpy injection & pressure entropy correction.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <InputRow label="Initial Temp (T₁)" unit="K" value={T1} onChange={setT1} />
          <InputRow label="Final Temp (T₂)" unit="K" value={T2} onChange={setT2} />
          <InputRow label="Initial Pressure (P₁)" unit="bar" value={P1} onChange={setP1} />
          <InputRow label="Final Pressure (P₂)" unit="bar" value={P2} onChange={setP2} />
        </div>
        <div className="space-y-4">
          <InputRow label="Cp Coeff a" unit="J/mol·K" value={a_coeff} onChange={setA} />
          <InputRow label="Cp Coeff b" unit="J/mol·K²" value={b_coeff} onChange={setB} />
          <InputRow label="Cp Coeff c" unit="J/mol·K³" value={c_coeff} onChange={setC} />
          <InputRow label="Cp Coeff d" unit="J/mol·K⁴" value={d_coeff} onChange={setD} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-t border-slate-100 dark:border-slate-800 pt-6">
        <InputRow label="Latent Heat ΔH_vap" unit="kJ/mol" value={dHvap} onChange={setDHvap} />
        <InputRow label="Saturation Temp (T_sat)" unit="K" value={Tsat} onChange={setTsat} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Enthalpy Change (ΔH)" value={isNaN(deltaH_total) ? '--' : deltaH_total.toFixed(3)} unit="kJ/mol" color="#ea580c" />
        <ResultBox label="Entropy Change (ΔS)" value={isNaN(deltaS_total) ? '--' : deltaS_total.toFixed(3)} unit="J/mol·K" color="#6366f1" />
        <ResultBox label="Latent Heat Injected" value={(deltaH_latent / 1000).toFixed(2)} unit="kJ/mol" color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── UNIT CONVERTER ───
function UnitConverter() {
  const [category, setCategory] = useState('temperature');
  const [inputVal, setInputVal] = useState('100');
  const categories: Record<string, { units: string[]; convert: (v: number, from: string, to: string) => number }> = {
    temperature: {
      units: ['°C', '°F', 'K', '°R'],
      convert: (v, from, to) => {
        let k: number;
        if (from === '°C') k = v + 273.15; else if (from === '°F') k = (v - 32) * 5 / 9 + 273.15; else if (from === '°R') k = v * 5 / 9; else k = v;
        if (to === '°C') return k - 273.15; if (to === '°F') return (k - 273.15) * 9 / 5 + 32; if (to === '°R') return k * 9 / 5; return k;
      }
    },
    pressure: {
      units: ['Pa', 'kPa', 'atm', 'bar', 'mmHg', 'psi'],
      convert: (v, from, to) => {
        const toPa: Record<string, number> = { Pa: 1, kPa: 1000, atm: 101325, bar: 100000, mmHg: 133.322, psi: 6894.76 };
        return v * toPa[from] / toPa[to];
      }
    },
    energy: {
      units: ['J', 'kJ', 'cal', 'kcal', 'BTU', 'eV'],
      convert: (v, from, to) => {
        const toJ: Record<string, number> = { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, BTU: 1055.06, eV: 1.602e-19 };
        return v * toJ[from] / toJ[to];
      }
    },
  };
  const [fromUnit, setFromUnit] = useState(categories[category].units[0]);
  const [toUnit, setToUnit] = useState(categories[category].units[1]);

  const result = categories[category].convert(parseFloat(inputVal) || 0, fromUnit, toUnit);

  return (
    <CalcCard title="Universal Unit Converter" icon={RefreshCw}>
      <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
        {Object.keys(categories).map(cat => (
          <button 
            key={cat} 
            onClick={() => { setCategory(cat); setFromUnit(categories[cat].units[0]); setToUnit(categories[cat].units[1]); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              category === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
        <div className="flex-grow flex items-center gap-3 w-full">
          <input 
            type="number" 
            value={inputVal} 
            onChange={e => setInputVal(e.target.value)} 
            className="flex-grow px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold outline-none"
          />
          <select value={fromUnit} onChange={e => setFromUnit(e.target.value)} className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm">
            {categories[category].units.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <ChevronRight className="w-6 h-6 text-indigo-500 rotate-90 md:rotate-0" />
        <div className="flex-grow flex items-center gap-3 w-full">
          <div className="flex-grow px-5 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 font-black">
            {result.toPrecision(6)}
          </div>
          <select value={toUnit} onChange={e => setToUnit(e.target.value)} className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm">
            {categories[category].units.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>
    </CalcCard>
  );
}

// ─── STEAM TABLES (SATURATED WATER) ───
const STEAM_SAT_DATA = [
  { T: 0, P: 0.000611, hf: 0, hfg: 2501, hg: 2501, sf: 0, sfg: 9.157, sg: 9.157, vf: 0.001000, vg: 206.1 },
  { T: 5, P: 0.000872, hf: 21, hfg: 2490, hg: 2511, sf: 0.076, sfg: 8.950, sg: 9.026, vf: 0.001000, vg: 147.1 },
  { T: 10, P: 0.001228, hf: 42, hfg: 2478, hg: 2520, sf: 0.151, sfg: 8.750, sg: 8.901, vf: 0.001000, vg: 106.4 },
  { T: 20, P: 0.002338, hf: 83.9, hfg: 2454, hg: 2538, sf: 0.296, sfg: 8.372, sg: 8.667, vf: 0.001002, vg: 57.79 },
  { T: 25, P: 0.003169, hf: 104.9, hfg: 2442, hg: 2547, sf: 0.367, sfg: 8.191, sg: 8.558, vf: 0.001003, vg: 43.36 },
  { T: 30, P: 0.004246, hf: 125.8, hfg: 2431, hg: 2556, sf: 0.437, sfg: 8.016, sg: 8.453, vf: 0.001004, vg: 32.93 },
  { T: 40, P: 0.007384, hf: 167.6, hfg: 2407, hg: 2574, sf: 0.572, sfg: 7.686, sg: 8.258, vf: 0.001008, vg: 19.52 },
  { T: 50, P: 0.01235, hf: 209.3, hfg: 2383, hg: 2592, sf: 0.704, sfg: 7.373, sg: 8.076, vf: 0.001012, vg: 12.03 },
  { T: 60, P: 0.01994, hf: 251.1, hfg: 2358, hg: 2609, sf: 0.831, sfg: 7.077, sg: 7.909, vf: 0.001017, vg: 7.671 },
  { T: 70, P: 0.03119, hf: 293.0, hfg: 2334, hg: 2627, sf: 0.955, sfg: 6.800, sg: 7.755, vf: 0.001023, vg: 5.042 },
  { T: 80, P: 0.04739, hf: 334.9, hfg: 2309, hg: 2644, sf: 1.075, sfg: 6.537, sg: 7.612, vf: 0.001029, vg: 3.407 },
  { T: 90, P: 0.07014, hf: 376.9, hfg: 2283, hg: 2660, sf: 1.193, sfg: 6.287, sg: 7.479, vf: 0.001036, vg: 2.361 },
  { T: 100, P: 0.10142, hf: 419.0, hfg: 2257, hg: 2676, sf: 1.307, sfg: 6.048, sg: 7.355, vf: 0.001044, vg: 1.673 },
  { T: 120, P: 0.19853, hf: 503.7, hfg: 2203, hg: 2706, sf: 1.528, sfg: 5.602, sg: 7.130, vf: 0.001060, vg: 0.892 },
  { T: 140, P: 0.36136, hf: 589.1, hfg: 2145, hg: 2734, sf: 1.739, sfg: 5.190, sg: 6.930, vf: 0.001080, vg: 0.509 },
  { T: 160, P: 0.61780, hf: 675.5, hfg: 2083, hg: 2758, sf: 1.942, sfg: 4.807, sg: 6.749, vf: 0.001102, vg: 0.307 },
  { T: 180, P: 1.0021, hf: 763.2, hfg: 2015, hg: 2778, sf: 2.139, sfg: 4.446, sg: 6.585, vf: 0.001127, vg: 0.194 },
  { T: 200, P: 1.5538, hf: 852.5, hfg: 1941, hg: 2793, sf: 2.331, sfg: 4.100, sg: 6.431, vf: 0.001157, vg: 0.127 },
  { T: 250, P: 3.973, hf: 1085.4, hfg: 1716, hg: 2801, sf: 2.794, sfg: 3.277, sg: 6.071, vf: 0.001251, vg: 0.0501 },
  { T: 300, P: 8.581, hf: 1344.0, hfg: 1405, hg: 2749, sf: 3.254, sfg: 2.625, sg: 5.705, vf: 0.001404, vg: 0.0217 },
  { T: 350, P: 16.513, hf: 1670.6, hfg: 893, hg: 2563, sf: 3.778, sfg: 1.753, sg: 5.211, vf: 0.001740, vg: 0.00881 },
  { T: 374.14, P: 22.064, hf: 2099, hfg: 0, hg: 2099, sf: 4.430, sfg: 0, sg: 4.430, vf: 0.003155, vg: 0.003155 },
];

function SteamTablesCalc() {
  const [targetT, setTargetT] = useState('100');
  const t = parseFloat(targetT);

  // Linear interpolation
  function interp(prop: keyof typeof STEAM_SAT_DATA[0]) {
    if (isNaN(t)) return NaN;
    if (t <= STEAM_SAT_DATA[0].T) return STEAM_SAT_DATA[0][prop] as number;
    if (t >= STEAM_SAT_DATA[STEAM_SAT_DATA.length - 1].T) return STEAM_SAT_DATA[STEAM_SAT_DATA.length - 1][prop] as number;
    for (let i = 0; i < STEAM_SAT_DATA.length - 1; i++) {
      if (t >= STEAM_SAT_DATA[i].T && t <= STEAM_SAT_DATA[i + 1].T) {
        const frac = (t - STEAM_SAT_DATA[i].T) / (STEAM_SAT_DATA[i + 1].T - STEAM_SAT_DATA[i].T);
        return (STEAM_SAT_DATA[i][prop] as number) + frac * ((STEAM_SAT_DATA[i + 1][prop] as number) - (STEAM_SAT_DATA[i][prop] as number));
      }
    }
    return NaN;
  }

  const fmt = (v: number, d = 3) => isNaN(v) ? '--' : v.toFixed(d);

  return (
    <CalcCard title="Saturated Steam Tables" icon={Thermometer}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Interpolated saturated water/steam properties at any temperature (0–374°C).</p>
      <div className="max-w-sm mb-10">
        <InputRow label="Temperature" unit="°C" value={targetT} onChange={setTargetT} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <ResultBox label="Saturation Pressure" value={fmt(interp('P'), 4)} unit="MPa" color="#6366f1" />
        <ResultBox label="h_f (Liquid Enthalpy)" value={fmt(interp('hf'), 1)} unit="kJ/kg" color="#3b82f6" />
        <ResultBox label="h_fg (Latent Heat)" value={fmt(interp('hfg'), 1)} unit="kJ/kg" color="#f59e0b" />
        <ResultBox label="h_g (Vapor Enthalpy)" value={fmt(interp('hg'), 1)} unit="kJ/kg" color="#ef4444" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <ResultBox label="s_f (Liquid Entropy)" value={fmt(interp('sf'))} unit="kJ/kg·K" color="#10b981" />
        <ResultBox label="s_fg" value={fmt(interp('sfg'))} unit="kJ/kg·K" color="#8b5cf6" />
        <ResultBox label="s_g (Vapor Entropy)" value={fmt(interp('sg'))} unit="kJ/kg·K" color="#ec4899" />
        <ResultBox label="v_f (Sp. Vol.)" value={fmt(interp('vf'), 6)} unit="m³/kg" color="#14b8a6" />
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">T (°C)</th>
              <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">P (MPa)</th>
              <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">h_f</th>
              <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">h_fg</th>
              <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">h_g</th>
              <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">s_f</th>
              <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">s_g</th>
            </tr>
          </thead>
          <tbody>
            {STEAM_SAT_DATA.map(r => (
              <tr key={r.T} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{r.T}</td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{r.P.toFixed(4)}</td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{r.hf.toFixed(1)}</td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{r.hfg}</td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{r.hg}</td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{r.sf.toFixed(3)}</td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{r.sg.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CalcCard>
  );
}

// ─── NRTL LIQUID ACTIVITY COEFFICIENT MODEL ───
function NRTLActivityCalc() {
  const [x1_val, setX1Val] = useState('0.4');
  const [tau12_val, setTau12Val] = useState('1.5');
  const [tau21_val, setTau21Val] = useState('2.1');
  const [alpha_val, setAlphaVal] = useState('0.3');

  const x1 = parseFloat(x1_val);
  const x2 = 1 - x1;
  const t12 = parseFloat(tau12_val), t21 = parseFloat(tau21_val), alpha = parseFloat(alpha_val);

  let gamma1 = NaN, gamma2 = NaN, GE_RT = NaN;

  if (!isNaN(x1) && x1 >= 0 && x1 <= 1 && !isNaN(t12) && !isNaN(t21)) {
    const G12 = Math.exp(-alpha * t12);
    const G21 = Math.exp(-alpha * t21);

    const term1_g1 = t21 * Math.pow(G21 / (x1 + x2 * G21), 2);
    const term2_g1 = (t12 * G12) / Math.pow(x2 + x1 * G12, 2);
    const ln_g1 = x2 * x2 * (term1_g1 + term2_g1);
    gamma1 = Math.exp(ln_g1);

    const term1_g2 = t12 * Math.pow(G12 / (x2 + x1 * G12), 2);
    const term2_g2 = (t21 * G21) / Math.pow(x1 + x2 * G21, 2);
    const ln_g2 = x1 * x1 * (term1_g2 + term2_g2);
    gamma2 = Math.exp(ln_g2);

    GE_RT = x1 * ln_g1 + x2 * ln_g2;
  }

  return (
    <CalcCard title="Non-Random Two-Liquid (NRTL) Activity Coefficients" icon={Droplets}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Local composition model for non-ideal liquid mixtures, azeotropes & liquid-liquid phase splitting.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <InputRow label="Liquid Mole Fraction (x₁)" unit="mol/mol" value={x1_val} onChange={setX1Val} />
          <InputRow label="Non-randomness (α₁₂)" unit="" value={alpha_val} onChange={setAlphaVal} />
        </div>
        <div className="space-y-4">
          <InputRow label="Binary Interaction τ₁₂" unit="" value={tau12_val} onChange={setTau12Val} />
          <InputRow label="Binary Interaction τ₂₁" unit="" value={tau21_val} onChange={setTau21Val} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Activity Coeff. γ₁" value={isNaN(gamma1) ? '--' : gamma1.toFixed(4)} unit="" color="#6366f1" />
        <ResultBox label="Activity Coeff. γ₂" value={isNaN(gamma2) ? '--' : gamma2.toFixed(4)} unit="" color="#3b82f6" />
        <ResultBox label="Excess Free Energy (Gᵉ/RT)" value={isNaN(GE_RT) ? '--' : GE_RT.toFixed(4)} unit="" color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── PSYCHROMETRIC CALCULATOR (ARDEN BUCK EQUATION & HIGH PRESSURE ENHANCEMENT) ───
function PsychrometricCalc() {
  const [Tdb, setTdb] = useState('30');
  const [RH, setRH] = useState('60');
  const [P, setP] = useState('101.325');

  const tdb = parseFloat(Tdb), rh = parseFloat(RH) / 100, p = parseFloat(P);

  // Arden Buck equation for saturation vapor pressure over water (T >= 0°C) and ice (T < 0°C)
  const ArdenBuckPsat = (t: number) => {
    if (t >= 0) {
      // Over liquid water
      return 0.61121 * Math.exp((18.678 - t / 234.5) * (t / (257.14 + t))); // kPa
    } else {
      // Over solid ice
      return 0.61115 * Math.exp((23.036 - t / 333.7) * (t / (279.82 + t))); // kPa
    }
  };

  // High-pressure enhancement factor f(P,T) for compressed air control lines
  const enhFactor = 1.00062 + 3.14e-6 * p + 5.6e-7 * tdb * tdb;
  const psat_base = ArdenBuckPsat(tdb);
  const psat = psat_base * enhFactor; // kPa
  const pw = rh * psat;
  const hasValidPressures = p > pw;
  const W = hasValidPressures ? (0.622 * pw) / (p - pw) : NaN; // humidity ratio kg/kg
  
  // Inverse Arden Buck dew point calculation
  let Tdp = NaN;
  if (pw > 0) {
    const alpha_val = Math.log(pw / 0.61121);
    Tdp = (257.14 * alpha_val) / (18.678 - alpha_val);
  }

  const h = !isNaN(W) ? 1.006 * tdb + W * (2501 + 1.86 * tdb) : NaN; // kJ/kg dry air
  const v = hasValidPressures ? (287.05 * (tdb + 273.15)) / ((p - pw) * 1000) : NaN; // m³/kg
  
  // Wet bulb approximation (Stull formula)
  const Twb = tdb * Math.atan(0.151977 * Math.sqrt(rh * 100 + 8.313659)) +
    Math.atan(tdb + rh * 100) - Math.atan(rh * 100 - 1.676331) +
    0.00391838 * Math.pow(rh * 100, 1.5) * Math.atan(0.023101 * rh * 100) - 4.686035;

  return (
    <CalcCard title="Psychrometric Calculator (Arden Buck & Pressure Enhancement)" icon={Droplets}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Precision Arden Buck formulation (Water vs Ice boundary) with high-pressure enhancement factor f(P,T).</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Dry-Bulb Temp (T_db)" unit="°C" value={Tdb} onChange={setTdb} />
        <InputRow label="Relative Humidity" unit="%" value={RH} onChange={setRH} />
        <InputRow label="Barometric Pressure" unit="kPa" value={P} onChange={setP} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <ResultBox label="Humidity Ratio (W)" value={isNaN(W) ? '--' : (W * 1000).toFixed(2)} unit="g/kg" color="#3b82f6" />
        <ResultBox label="Dew Point (T_dp)" value={isNaN(Tdp) ? '--' : Tdp.toFixed(1)} unit="°C" color="#6366f1" />
        <ResultBox label="Wet Bulb (T_wb)" value={isNaN(Twb) ? '--' : Twb.toFixed(1)} unit="°C" color="#14b8a6" />
        <ResultBox label="Enthalpy (h)" value={isNaN(h) ? '--' : h.toFixed(1)} unit="kJ/kg" color="#f59e0b" />
        <ResultBox label="Sp. Volume (v)" value={isNaN(v) ? '--' : v.toFixed(4)} unit="m³/kg" color="#8b5cf6" />
        <ResultBox label="P Enhancement f(P,T)" value={enhFactor.toFixed(5)} unit="×" color="#ec4899" />
      </div>
    </CalcCard>
  );
}

// ─── SOLUTION THERMODYNAMICS & ADVANCED ACTIVITY / HENRY / FUGACITY SOLVER ───
function SolutionThermodynamicsCalc() {
  const [target, setTarget] = useState<'activity' | 'henry' | 'fugacity' | 'excess'>('activity');
  
  // Inputs for Activity
  const [x_val, setXVal] = useState('0.35');
  const [gamma_val, setGammaVal] = useState('1.8');
  const [act_input, setActInput] = useState('0.63');

  // Inputs for Henry's Law
  const [pressureP, setPressureP] = useState('2.5'); // bar
  const [henryH, setHenryH] = useState('0.034'); // M/bar
  const [concC, setConcC] = useState('0.085'); // M

  // Inputs for Fugacity
  const [phi_val, setPhiVal] = useState('0.88');
  const [press_f, setPressF] = useState('50'); // bar
  const [fug_input, setFugInput] = useState('44'); // bar

  // Calculations
  const x = parseFloat(x_val), g = parseFloat(gamma_val), a_in = parseFloat(act_input);
  const p_h = parseFloat(pressureP), H_c = parseFloat(henryH), c_h = parseFloat(concC);
  const phi = parseFloat(phi_val), p_f = parseFloat(press_f), f_in = parseFloat(fug_input);

  let resVal1 = '--', resLabel1 = '', resUnit1 = '';
  let resVal2 = '--', resLabel2 = '', resUnit2 = '';

  if (target === 'activity') {
    // a = x * gamma  OR  gamma = a / x  OR  x = a / gamma
    const act_calc = x * g;
    const gamma_calc = a_in / x;
    resLabel1 = 'Activity (a_i)'; resVal1 = isNaN(act_calc) ? '--' : act_calc.toFixed(4); resUnit1 = '';
    resLabel2 = 'Derived γ_i (if a_i given)'; resVal2 = isNaN(gamma_calc) ? '--' : gamma_calc.toFixed(4); resUnit2 = '';
  } else if (target === 'henry') {
    // C = H * P  =>  H = C / P  =>  P = C / H
    const conc_calc = H_c * p_h;
    const Henry_calc = c_h / p_h;
    resLabel1 = 'Dissolved Conc. (C_i)'; resVal1 = isNaN(conc_calc) ? '--' : conc_calc.toFixed(4); resUnit1 = 'M (mol/L)';
    resLabel2 = 'Derived Henry H_i'; resVal2 = isNaN(Henry_calc) ? '--' : Henry_calc.toFixed(4); resUnit2 = 'M/bar';
  } else if (target === 'fugacity') {
    // f = phi * P  =>  phi = f / P
    const fug_calc = phi * p_f;
    const phi_calc = f_in / p_f;
    resLabel1 = 'Fugacity (f_i)'; resVal1 = isNaN(fug_calc) ? '--' : fug_calc.toFixed(2); resUnit1 = 'bar';
    resLabel2 = 'Derived Coeff. (φ_i)'; resVal2 = isNaN(phi_calc) ? '--' : phi_calc.toFixed(4); resUnit2 = '';
  } else {
    // Excess Gibbs Free Energy G^E = R T (x1 ln gamma1 + x2 ln gamma2)
    const GE_val = 8.314 * 298.15 * (x * Math.log(g) + (1 - x) * Math.log(1.2));
    resLabel1 = 'Excess Gibbs (G^E)'; resVal1 = isNaN(GE_val) ? '--' : GE_val.toFixed(2); resUnit1 = 'J/mol';
    resLabel2 = 'Ideal Free Energy G_id'; resVal2 = (8.314 * 298.15 * (x * Math.log(x) + (1 - x) * Math.log(1 - x))).toFixed(2); resUnit2 = 'J/mol';
  }

  return (
    <CalcCard title="Flexible Target Solution Thermodynamics (Activity, Henry, Fugacity)" icon={Microscope}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Configure any variable as the unknown target (Activity, Activity Coefficient, Henry Constant, or Fugacity).</p>
      
      <div className="mb-8">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Select Computational Target</label>
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {[
            { id: 'activity', label: 'Activity & γ_i' },
            { id: 'henry', label: 'Henry\'s Law Solubility' },
            { id: 'fugacity', label: 'Fugacity & φ_i' },
            { id: 'excess', label: 'Excess Properties (Gᵉ)' },
          ].map(t => (
            <button key={t.id} onClick={() => setTarget(t.id as any)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${target === t.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {target === 'activity' && (
          <>
            <div className="space-y-4">
              <InputRow label="Mole Fraction (x_i)" unit="mol/mol" value={x_val} onChange={setXVal} />
              <InputRow label="Activity Coeff. (γ_i)" unit="" value={gamma_val} onChange={setGammaVal} />
            </div>
            <div className="space-y-4">
              <InputRow label="Known Activity (a_i)" unit="" value={act_input} onChange={setActInput} />
            </div>
          </>
        )}

        {target === 'henry' && (
          <>
            <div className="space-y-4">
              <InputRow label="Partial Pressure (P_i)" unit="bar" value={pressureP} onChange={setPressureP} />
              <InputRow label="Henry Constant (H_i)" unit="M/bar" value={henryH} onChange={setHenryH} />
            </div>
            <div className="space-y-4">
              <InputRow label="Known Concentration (C_i)" unit="M" value={concC} onChange={setConcC} />
            </div>
          </>
        )}

        {target === 'fugacity' && (
          <>
            <div className="space-y-4">
              <InputRow label="System Pressure (P)" unit="bar" value={press_f} onChange={setPressF} />
              <InputRow label="Fugacity Coeff. (φ_i)" unit="" value={phi_val} onChange={setPhiVal} />
            </div>
            <div className="space-y-4">
              <InputRow label="Known Fugacity (f_i)" unit="bar" value={fug_input} onChange={setFugInput} />
            </div>
          </>
        )}

        {target === 'excess' && (
          <div className="space-y-4 col-span-2">
            <InputRow label="Mole Fraction (x₁)" unit="mol/mol" value={x_val} onChange={setXVal} />
            <InputRow label="Activity Coefficient (γ₁)" unit="" value={gamma_val} onChange={setGammaVal} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultBox label={resLabel1} value={resVal1} unit={resUnit1} color="#6366f1" />
        <ResultBox label={resLabel2} value={resVal2} unit={resUnit2} color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── CHEMICAL REACTION EQUILIBRIUM & VAN 'T HOFF SOLVER ───
function ReactionEquilibriumCalc() {
  const [target, setTarget] = useState<'Keq' | 'dG' | 'temp' | 'Xeq'>('Keq');
  const [dG0, setDG0] = useState('-15.5'); // kJ/mol
  const [tempT, setTempT] = useState('298.15'); // K
  const [keqInput, setKeqInput] = useState('525');

  const dg = parseFloat(dG0) * 1000, T = parseFloat(tempT), K_in = parseFloat(keqInput);
  const R = 8.314;

  let val1 = '--', lbl1 = '', u1 = '';
  let val2 = '--', lbl2 = '', u2 = '';

  if (target === 'Keq') {
    // K_eq = exp(-dG0 / RT)
    const K = Math.exp(-dg / (R * T));
    lbl1 = 'Equilibrium Constant (K_eq)'; val1 = isNaN(K) ? '--' : K >= 1e4 ? K.toExponential(3) : K.toFixed(3); u1 = '';
    lbl2 = 'Spontaneity State'; val2 = dg < 0 ? 'Exergonic (Spontaneous)' : 'Endergonic (Non-spontaneous)'; u2 = '';
  } else if (target === 'dG') {
    // dG0 = -RT ln(K_eq)
    const dG_calc = -R * T * Math.log(K_in) / 1000;
    lbl1 = 'Standard Free Energy (ΔG°)'; val1 = isNaN(dG_calc) ? '--' : dG_calc.toFixed(2); u1 = 'kJ/mol';
    lbl2 = 'Equilibrium Shift'; val2 = K_in > 1 ? 'Favors Products' : 'Favors Reactants'; u2 = '';
  } else if (target === 'temp') {
    // T = -dG0 / (R ln K_eq)
    const T_calc = -dg / (R * Math.log(K_in));
    lbl1 = 'Equilibrium Temp (T)'; val1 = isNaN(T_calc) ? '--' : T_calc.toFixed(1); u1 = 'K';
    lbl2 = 'In Celsius'; val2 = isNaN(T_calc) ? '--' : (T_calc - 273.15).toFixed(1); u2 = '°C';
  } else {
    // X_eq = K / (1 + K) for A <-> B
    const K = Math.exp(-dg / (R * T));
    const Xeq = K / (1 + K);
    lbl1 = 'Equilibrium Conversion (X_eq)'; val1 = isNaN(Xeq) ? '--' : (Xeq * 100).toFixed(1); u1 = '%';
    lbl2 = 'Unconverted Fraction'; val2 = isNaN(Xeq) ? '--' : ((1 - Xeq) * 100).toFixed(1); u2 = '%';
  }

  return (
    <CalcCard title="Dynamic Reaction Equilibrium & ΔG° / Van 't Hoff Solver" icon={Zap}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Flexibly calculate K_eq, ΔG°, Equilibrium Temperature, or Conversion X_eq based on given problem inputs.</p>
      
      <div className="mb-8">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Select Unknown Parameter to Solve</label>
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {[
            { id: 'Keq', label: 'Solve K_eq' },
            { id: 'dG', label: 'Solve ΔG°' },
            { id: 'temp', label: 'Solve Temperature (T)' },
            { id: 'Xeq', label: 'Solve Conversion (X_eq)' },
          ].map(t => (
            <button key={t.id} onClick={() => setTarget(t.id as any)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${target === t.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {target !== 'dG' && <InputRow label="Standard ΔG°" unit="kJ/mol" value={dG0} onChange={setDG0} />}
        {target !== 'temp' && <InputRow label="Temperature (T)" unit="K" value={tempT} onChange={setTempT} />}
        {(target === 'dG' || target === 'temp') && <InputRow label="Known K_eq" unit="" value={keqInput} onChange={setKeqInput} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultBox label={lbl1} value={val1} unit={u1} color="#6366f1" />
        <ResultBox label={lbl2} value={val2} unit={u2} color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── POWER / REFRIGERATION CYCLES & COP / EFFICIENCY SOLVER ───
function ThermodynamicsCyclesCalc() {
  const [cycleType, setCycleType] = useState<'rankine' | 'refrig'>('rankine');
  const [target, setTarget] = useState<'eff' | 'th' | 'tl' | 'work'>('eff');

  const [Th, setTh] = useState('500'); // K or °C
  const [Tl, setTl] = useState('300'); // K or °C
  const [win, setWin] = useState('450'); // kW
  const [qin, setQin] = useState('1000'); // kW
  const [copIn, setCopIn] = useState('3.5');

  const T_h = parseFloat(Th), T_l = parseFloat(Tl), W = parseFloat(win), Q_in = parseFloat(qin);

  let val1 = '--', lbl1 = '', u1 = '';
  let val2 = '--', lbl2 = '', u2 = '';

  if (cycleType === 'rankine') {
    // Thermal Efficiency eta = 1 - T_L/T_H  OR  W_net / Q_in
    if (target === 'eff') {
      const eta_carnot = 1 - T_l / T_h;
      const eta_actual = W / Q_in;
      lbl1 = 'Carnot Max Efficiency'; val1 = isNaN(eta_carnot) ? '--' : (eta_carnot * 100).toFixed(1); u1 = '%';
      lbl2 = 'Actual Net Efficiency'; val2 = isNaN(eta_actual) ? '--' : (eta_actual * 100).toFixed(1); u2 = '%';
    } else if (target === 'work') {
      const W_calc = Q_in * (1 - T_l / T_h);
      lbl1 = 'Max Net Power Work (W_net)'; val1 = isNaN(W_calc) ? '--' : W_calc.toFixed(1); u1 = 'kW';
      lbl2 = 'Heat Rejected (Q_out)'; val2 = isNaN(W_calc) ? '--' : (Q_in - W_calc).toFixed(1); u2 = 'kW';
    } else {
      // Solve T_H = T_L / (1 - eta)
      const T_h_calc = T_l / (1 - (W / Q_in));
      lbl1 = 'Required Source Temp (T_H)'; val1 = isNaN(T_h_calc) ? '--' : T_h_calc.toFixed(1); u1 = 'K';
      lbl2 = 'In Celsius'; val2 = isNaN(T_h_calc) ? '--' : (T_h_calc - 273.15).toFixed(1); u2 = '°C';
    }
  } else {
    // Refrigeration COP = Q_L / W_net = T_L / (T_H - T_L)
    if (target === 'eff') {
      const cop_carnot = T_l / (T_h - T_l);
      const cop_actual = Q_in / W;
      lbl1 = 'Carnot Max COP'; val1 = isNaN(cop_carnot) ? '--' : cop_carnot.toFixed(2); u1 = '';
      lbl2 = 'Actual System COP'; val2 = isNaN(cop_actual) ? '--' : cop_actual.toFixed(2); u2 = '';
    } else {
      const Q_cooling = parseFloat(copIn) * W;
      lbl1 = 'Cooling Duty (Q_L)'; val1 = isNaN(Q_cooling) ? '--' : Q_cooling.toFixed(1); u1 = 'kW';
      lbl2 = 'Total Heat Rejected (Q_H)'; val2 = isNaN(Q_cooling) ? '--' : (Q_cooling + W).toFixed(1); u2 = 'kW';
    }
  }

  return (
    <CalcCard title="Thermodynamic Power & Refrigeration Cycles (Rankine, Brayton, Carnot, COP)" icon={RefreshCw}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Flexible thermal efficiency (η) and Coefficient of Performance (COP) solver for heat engines & chillers.</p>
      
      <div className="flex flex-wrap gap-6 mb-8">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cycle Architecture</label>
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            <button onClick={() => setCycleType('rankine')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${cycleType === 'rankine' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Rankine / Power Engine</button>
            <button onClick={() => setCycleType('refrig')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${cycleType === 'refrig' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Refrigeration / Chiller COP</button>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Target Unknown</label>
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            <button onClick={() => setTarget('eff')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${target === 'eff' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Efficiency / COP</button>
            <button onClick={() => setTarget('work')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${target === 'work' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Work / Duty</button>
            <button onClick={() => setTarget('th')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${target === 'th' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Source Temp (T_H)</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <InputRow label="Hot Reservoir Temp (T_H)" unit="K" value={Th} onChange={setTh} />
        <InputRow label="Cold Sink Temp (T_L)" unit="K" value={Tl} onChange={setTl} />
        <InputRow label="Heat Input (Q_in)" unit="kW" value={qin} onChange={setQin} />
        <InputRow label="Net Work (W_net)" unit="kW" value={win} onChange={setWin} />
        {cycleType === 'refrig' && <InputRow label="Design Rating COP" unit="" value={copIn} onChange={setCopIn} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultBox label={lbl1} value={val1} unit={u1} color="#6366f1" />
        <ResultBox label={lbl2} value={val2} unit={u2} color="#10b981" />
      </div>
    </CalcCard>
  );
}
type ThermTab = 'pr-eos' | 'flash' | 'nrtl' | 'sol-thermo' | 'rxn-eq' | 'cycles' | 'cp-enthalpy' | 'phase-diagram' | 'steam' | 'psychro' | 'units';

export default function ThermodynamicsModule() {
  const [activeTab, setActiveTab] = useState<ThermTab>('pr-eos');
  const allTabs = [
    { id: 'pr-eos', label: 'PR-EOS & Z-Factor', icon: Microscope },
    { id: 'flash', label: 'Flash Equilibrium', icon: Zap },
    { id: 'nrtl', label: 'NRTL Activity', icon: Droplets },
    { id: 'sol-thermo', label: 'Solution Thermo & Henry', icon: Microscope },
    { id: 'rxn-eq', label: 'Reaction Equilibrium', icon: Zap },
    { id: 'cycles', label: 'Power & Ref. Cycles', icon: RefreshCw },
    { id: 'cp-enthalpy', label: 'Cp / ΔH / ΔS Integrator', icon: RefreshCw },
    { id: 'phase-diagram', label: 'Phase Boundary', icon: TrendingUp },
    { id: 'steam', label: 'Steam Tables', icon: Thermometer },
    { id: 'psychro', label: 'Arden Buck Psychro', icon: Droplets },
    { id: 'units', label: 'Conversions', icon: RefreshCw },
  ] as const;

  const tabs = allTabs.filter(t => isToolEnabled('thermodynamics', t.id));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Thermodynamic Analysis</h1>
        <p className="text-slate-500 text-lg font-medium">Flexible target parameter solvers for PR-EOS cubic Z-factor, fugacity, NRTL activity, Henry's law, reaction equilibrium, cycles, VLE, steam tables, and psychrometrics.</p>
      </div>

      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as ThermTab)} 
            className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest pb-4 transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-b-4 border-indigo-600 text-slate-900 dark:text-white' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {activeTab === 'pr-eos' && <PREOSCalc />}
        {activeTab === 'flash' && <RigorousFlashCalc />}
        {activeTab === 'nrtl' && <NRTLActivityCalc />}
        {activeTab === 'sol-thermo' && <SolutionThermodynamicsCalc />}
        {activeTab === 'rxn-eq' && <ReactionEquilibriumCalc />}
        {activeTab === 'cycles' && <ThermodynamicsCyclesCalc />}
        {activeTab === 'cp-enthalpy' && <HeatCapacityEnthalpyCalc />}
        {activeTab === 'phase-diagram' && <RigorousPhaseDiagram />}
        {activeTab === 'steam' && <SteamTablesCalc />}
        {activeTab === 'psychro' && <PsychrometricCalc />}
        {activeTab === 'units' && <UnitConverter />}
      </div>
    </div>
  );
}
