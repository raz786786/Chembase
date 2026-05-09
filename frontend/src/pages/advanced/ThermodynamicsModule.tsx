import { useState, useMemo } from 'react';
import { 
  Flame, 
  Zap, 
  TrendingUp, 
  RefreshCw, 
  Microscope,
  Info,
  ChevronRight,
  Database,
  Thermometer,
  Activity,
  Droplets
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { COMPONENT_DB } from './ChemData';
import type { ChemComponent } from './ChemData';

// ─── PENG-ROBINSON EQUATION OF STATE ───
function PREOSCalc() {
  const R = 8.31446261815324; // J/(mol K)
  const [gasId, setGasId] = useState(COMPONENT_DB[0].id);
  const [T, setT] = useState('350'); // K
  const [v, setV] = useState('0.005'); // m^3/mol

  const gas = COMPONENT_DB.find(g => g.id === gasId)!;
  const t = parseFloat(T);
  const vm = parseFloat(v); // molar volume

  let P_pr = 0;
  let P_ideal = 0;

  if (!isNaN(t) && !isNaN(vm) && vm > 0) {
    const Tc = gas.tc;
    const Pc = gas.pc * 100000; // convert bar to Pa
    const w = gas.w;

    const a = (0.45724 * R * R * Tc * Tc) / Pc;
    const b = (0.07780 * R * Tc) / Pc;
    
    const Tr = t / Tc;
    const kappa = 0.37464 + 1.54226 * w - 0.26992 * w * w;
    const alpha = Math.pow(1 + kappa * (1 - Math.sqrt(Tr)), 2);

    P_pr = (R * t) / (vm - b) - (a * alpha) / (vm * vm + 2 * b * vm - b * b);
    P_ideal = (R * t) / vm;
  }

  return (
    <CalcCard title="Peng-Robinson Equation of State" icon={Microscope}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Industry-standard rigorous cubic equation of state for real fluids.</p>
      
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
          <InputRow label="Molar Volume (v)" unit="m³/mol" value={v} onChange={setV} />
        </div>
        
        <div className="md:w-72 p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4">Critical Constants</h4>
          <div className="space-y-3">
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
              <Info className="w-3 h-3" /> PR-EOS Validated
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultBox label="Ideal Pressure" value={isNaN(P_ideal) ? '--' : (P_ideal / 1000).toFixed(1)} unit="kPa" />
        <ResultBox label="PR-EOS Pressure" value={isNaN(P_pr) || !isFinite(P_pr) ? '--' : (P_pr / 1000).toFixed(1)} unit="kPa" color="#ef4444" />
        <ResultBox label="Real Deviation" value={P_ideal !== 0 ? (((P_pr - P_ideal) / P_ideal) * 100).toFixed(2) : '--'} unit="%" color="#3b82f6" />
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
  
  const k_1 = Psat1 / p;
  const k_2 = Psat2 / p;

  let V_F = 0.5;
  if (!isNaN(z_1) && !isNaN(k_1) && !isNaN(k_2)) {
    let low = 0;
    let high = 1;
    for (let i = 0; i < 60; i++) {
      V_F = (low + high) / 2;
      const f = (z_1 * (1 - k_1)) / (1 + V_F * (k_1 - 1)) + (z_2 * (1 - k_2)) / (1 + V_F * (k_2 - 1));
      if (f > 0) high = V_F;
      else low = V_F;
    }
  }

  const x_1 = z_1 / (1 + V_F * (k_1 - 1));
  const x_2 = z_2 / (1 + V_F * (k_2 - 1));
  const y_1 = k_1 * x_1;
  const y_2 = k_2 * x_2;

  const isSubcooled = V_F <= 0.001;
  const isSuperheated = V_F >= 0.999;
  const valid = V_F > 0.001 && V_F < 0.999;

  let stateStr = "Two-Phase Equilibrium";
  if (isSubcooled) stateStr = "Subcooled Liquid (V/F = 0)";
  if (isSuperheated) stateStr = "Superheated Vapor (V/F = 1)";

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
    <CalcCard title="Vapor Pressure Curve" icon={TrendingUp}>
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

// ─── PSYCHROMETRIC CALCULATOR ───
function PsychrometricCalc() {
  const [Tdb, setTdb] = useState('30');
  const [RH, setRH] = useState('60');
  const [P, setP] = useState('101.325');

  const tdb = parseFloat(Tdb), rh = parseFloat(RH) / 100, p = parseFloat(P);

  // Antoine equation for saturation pressure (kPa)
  const Psat = (t: number) => 0.61078 * Math.exp((17.27 * t) / (t + 237.3));
  const psat = Psat(tdb);
  const pw = rh * psat;
  const W = 0.622 * pw / (p - pw); // humidity ratio kg/kg
  const Tdp = isNaN(pw) || pw <= 0 ? NaN : (237.3 * Math.log(pw / 0.61078)) / (17.27 - Math.log(pw / 0.61078));
  const h = 1.006 * tdb + W * (2501 + 1.86 * tdb); // kJ/kg dry air
  const v = (287.05 * (tdb + 273.15)) / ((p - pw) * 1000); // m³/kg
  // Wet bulb approximation (Stull formula)
  const Twb = tdb * Math.atan(0.151977 * Math.sqrt(rh * 100 + 8.313659)) +
    Math.atan(tdb + rh * 100) - Math.atan(rh * 100 - 1.676331) +
    0.00391838 * Math.pow(rh * 100, 1.5) * Math.atan(0.023101 * rh * 100) - 4.686035;

  return (
    <CalcCard title="Psychrometric Calculator" icon={Droplets}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Humid air properties at any dry-bulb temperature and relative humidity.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Dry-Bulb Temp (T_db)" unit="°C" value={Tdb} onChange={setTdb} />
        <InputRow label="Relative Humidity" unit="%" value={RH} onChange={setRH} />
        <InputRow label="Barometric Pressure" unit="kPa" value={P} onChange={setP} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <ResultBox label="Humidity Ratio (W)" value={isNaN(W) ? '--' : (W * 1000).toFixed(2)} unit="g/kg" color="#3b82f6" />
        <ResultBox label="Dew Point (T_dp)" value={isNaN(Tdp) ? '--' : Tdp.toFixed(1)} unit="°C" color="#6366f1" />
        <ResultBox label="Wet Bulb (T_wb)" value={isNaN(Twb) ? '--' : Twb.toFixed(1)} unit="°C" color="#14b8a6" />
        <ResultBox label="Enthalpy (h)" value={isNaN(h) ? '--' : h.toFixed(1)} unit="kJ/kg" color="#f59e0b" />
        <ResultBox label="Sp. Volume (v)" value={isNaN(v) ? '--' : v.toFixed(4)} unit="m³/kg" color="#8b5cf6" />
      </div>
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type ThermTab = 'pr-eos' | 'flash' | 'phase-diagram' | 'steam' | 'psychro' | 'units';

export default function ThermodynamicsModule() {
  const [activeTab, setActiveTab] = useState<ThermTab>('pr-eos');
  const tabs = [
    { id: 'pr-eos', label: 'PR-EOS Solver', icon: Microscope },
    { id: 'flash', label: 'Flash Equilibrium', icon: Zap },
    { id: 'phase-diagram', label: 'Phase Boundary', icon: TrendingUp },
    { id: 'steam', label: 'Steam Tables', icon: Thermometer },
    { id: 'psychro', label: 'Psychrometrics', icon: Droplets },
    { id: 'units', label: 'Conversions', icon: RefreshCw },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Thermodynamic Analysis</h1>
        <p className="text-slate-500 text-lg font-medium">PR-EOS, VLE, steam tables, and psychrometric property calculators.</p>
      </div>

      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
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
        {activeTab === 'phase-diagram' && <RigorousPhaseDiagram />}
        {activeTab === 'steam' && <SteamTablesCalc />}
        {activeTab === 'psychro' && <PsychrometricCalc />}
        {activeTab === 'units' && <UnitConverter />}
      </div>
    </div>
  );
}
