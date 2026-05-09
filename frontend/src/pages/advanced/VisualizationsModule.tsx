import { useState } from 'react';
import { TrendingUp, Thermometer, Activity, Zap, Info } from 'lucide-react';
import { CalcCard } from './SharedComponents';
import { ENGINEERING_DB, antoineP, cpAtT, type EngChemical } from '../../data/engineeringData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceDot } from 'recharts';

function ChemSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-sm">
      {ENGINEERING_DB.map(c => <option key={c.formula} value={c.formula}>{c.name} ({c.formula})</option>)}
    </select>
  );
}

// Tab 1: Cp vs Temperature
function CpVsTemp() {
  const [sel, setSel] = useState(ENGINEERING_DB[0].formula);
  const chem = ENGINEERING_DB.find(c => c.formula === sel)!;
  const data = [];
  for (let T = 200; T <= 1200; T += 25) {
    data.push({ T, Cp: parseFloat(cpAtT(chem, T).toFixed(2)) });
  }
  return (
    <CalcCard title="Heat Capacity vs Temperature" icon={Thermometer}>
      <p className="text-sm text-slate-500 mb-6 italic">Cp(T) = a + bT + cT² + dT³ — Polynomial correlation (J/mol·K)</p>
      <ChemSelect value={sel} onChange={setSel} />
      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="T" label={{ value: 'Temperature (K)', position: 'bottom', offset: -5 }} tick={{ fontSize: 11 }} />
            <YAxis label={{ value: 'Cp (J/mol·K)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12 }} />
            <Line type="monotone" dataKey="Cp" stroke="#ef4444" strokeWidth={3} dot={false} name="Cp" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {chem.cpCoeffs.map((c, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-center">
            <div className="text-[10px] font-bold text-slate-400">{['a', 'b', 'c', 'd'][i]}</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.toExponential(2)}</div>
          </div>
        ))}
      </div>
    </CalcCard>
  );
}

// Tab 2: Vapor Pressure Curves (Antoine)
function VaporPressure() {
  const [selected, setSelected] = useState<string[]>([ENGINEERING_DB[0].formula, ENGINEERING_DB[4].formula]);
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const toggle = (f: string) => {
    setSelected(prev => prev.includes(f) ? prev.filter(x => x !== f) : prev.length < 6 ? [...prev, f] : prev);
  };
  const data = [];
  for (let T = 0; T <= 350; T += 5) {
    const point: any = { T };
    for (const f of selected) {
      const chem = ENGINEERING_DB.find(c => c.formula === f);
      if (chem) {
        const p = antoineP(chem, T);
        if (p > 0 && p < 1e6) point[f] = parseFloat((p / 760).toFixed(4)); // Convert to atm
      }
    }
    data.push(point);
  }
  return (
    <CalcCard title="Vapor Pressure Curves (Antoine)" icon={TrendingUp}>
      <p className="text-sm text-slate-500 mb-6 italic">log₁₀(P) = A - B/(T+C) — Select up to 6 chemicals to compare</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {ENGINEERING_DB.map(c => (
          <button key={c.formula} onClick={() => toggle(c.formula)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              selected.includes(c.formula) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}>{c.formula}</button>
        ))}
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="T" label={{ value: 'Temperature (°C)', position: 'bottom', offset: -5 }} tick={{ fontSize: 11 }} />
            <YAxis label={{ value: 'Pressure (atm)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 11 }} scale="log" domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12 }} />
            <Legend />
            {selected.map((f, i) => (
              <Line key={f} type="monotone" dataKey={f} stroke={colors[i % 6]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CalcCard>
  );
}

// Tab 3: Phase Diagram (P-T for Water/CO2)
function PhaseDiagram() {
  const [sel, setSel] = useState<'H2O' | 'CO2'>('H2O');
  const phaseData: Record<string, { triple: { T: number; P: number }; critical: { T: number; P: number }; curve: { T: number; P: number }[] }> = {
    H2O: {
      triple: { T: 0.01, P: 0.00604 },
      critical: { T: 374, P: 217.7 },
      curve: [{ T: 0, P: 0.006 }, { T: 20, P: 0.023 }, { T: 50, P: 0.122 }, { T: 100, P: 1 }, { T: 150, P: 4.76 }, { T: 200, P: 15.5 }, { T: 250, P: 39.7 }, { T: 300, P: 85.8 }, { T: 350, P: 165 }, { T: 374, P: 217.7 }]
    },
    CO2: {
      triple: { T: -56.6, P: 5.18 },
      critical: { T: 31.1, P: 73.8 },
      curve: [{ T: -56.6, P: 5.18 }, { T: -40, P: 10.1 }, { T: -20, P: 19.7 }, { T: 0, P: 34.8 }, { T: 20, P: 57.3 }, { T: 31.1, P: 73.8 }]
    }
  };
  const d = phaseData[sel];
  return (
    <CalcCard title="P-T Phase Diagram" icon={Activity}>
      <p className="text-sm text-slate-500 mb-6 italic">Liquid-vapor equilibrium curve with triple and critical points</p>
      <div className="flex gap-3 mb-6">
        <button onClick={() => setSel('H2O')} className={`px-4 py-2 rounded-xl text-sm font-bold ${sel === 'H2O' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>Water (H₂O)</button>
        <button onClick={() => setSel('CO2')} className={`px-4 py-2 rounded-xl text-sm font-bold ${sel === 'CO2' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>CO₂</button>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={d.curve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="T" label={{ value: 'Temperature (°C)', position: 'bottom', offset: -5 }} tick={{ fontSize: 11 }} />
            <YAxis label={{ value: 'Pressure (atm)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12 }} />
            <Line type="monotone" dataKey="P" stroke="#8b5cf6" strokeWidth={3} dot={false} name="Vap. Curve" />
            <ReferenceDot x={d.triple.T} y={d.triple.P} r={8} fill="#10b981" stroke="#fff" strokeWidth={2} label={{ value: 'Triple', position: 'top', fontSize: 10, fill: '#10b981' }} />
            <ReferenceDot x={d.critical.T} y={d.critical.P} r={8} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: 'Critical', position: 'top', fontSize: 10, fill: '#ef4444' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
          <div className="text-[10px] font-bold text-emerald-500 uppercase">Triple Point</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">{d.triple.T}°C, {d.triple.P} atm</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 border border-rose-200 dark:border-rose-800">
          <div className="text-[10px] font-bold text-rose-500 uppercase">Critical Point</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">{d.critical.T}°C, {d.critical.P} atm</div>
        </div>
      </div>
    </CalcCard>
  );
}

// Tab 4: Reactor Performance (X vs V)
function ReactorPerformance() {
  const [k, setK] = useState(0.1);
  const [ca0, setCa0] = useState(2);
  const [fa0, setFa0] = useState(5);
  const data = [];
  for (let X = 0.01; X <= 0.99; X += 0.02) {
    const ra = k * ca0 * (1 - X);
    const V_cstr = (fa0 * X) / ra;
    const V_pfr = (fa0 / (k * ca0)) * (-Math.log(1 - X));
    data.push({ X: parseFloat(X.toFixed(2)), CSTR: parseFloat(V_cstr.toFixed(1)), PFR: parseFloat(V_pfr.toFixed(1)) });
  }
  return (
    <CalcCard title="Reactor Volume vs Conversion" icon={Zap}>
      <p className="text-sm text-slate-500 mb-6 italic">CSTR vs PFR sizing comparison for 1st-order reaction A → B</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">k (1/min)</label>
          <input type="range" min="0.01" max="1" step="0.01" value={k} onChange={e => setK(parseFloat(e.target.value))} className="w-full" />
          <div className="text-xs font-bold text-center">{k}</div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">CA₀ (mol/L)</label>
          <input type="range" min="0.5" max="10" step="0.5" value={ca0} onChange={e => setCa0(parseFloat(e.target.value))} className="w-full" />
          <div className="text-xs font-bold text-center">{ca0}</div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">FA₀ (mol/min)</label>
          <input type="range" min="1" max="20" step="1" value={fa0} onChange={e => setFa0(parseFloat(e.target.value))} className="w-full" />
          <div className="text-xs font-bold text-center">{fa0}</div>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="X" label={{ value: 'Conversion (X)', position: 'bottom', offset: -5 }} tick={{ fontSize: 11 }} />
            <YAxis label={{ value: 'Volume (L)', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12 }} />
            <Legend />
            <Line type="monotone" dataKey="CSTR" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="PFR" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CalcCard>
  );
}

const TABS = [
  { id: 'cp', label: 'Cp vs T', icon: Thermometer },
  { id: 'vp', label: 'Vapor Pressure', icon: TrendingUp },
  { id: 'phase', label: 'Phase Diagram', icon: Activity },
  { id: 'reactor', label: 'Reactor Perf.', icon: Zap },
];

export default function VisualizationsModule() {
  const [tab, setTab] = useState('cp');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Interactive Visualizations</h2>
          <p className="text-sm text-slate-500">Real-time property plots and engineering graphs</p>
        </div>
      </div>
      <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              tab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'cp' && <CpVsTemp />}
      {tab === 'vp' && <VaporPressure />}
      {tab === 'phase' && <PhaseDiagram />}
      {tab === 'reactor' && <ReactorPerformance />}
    </div>
  );
}
