import { useState, useEffect } from 'react';
import { 
  Calculator, 
  Search, 
  Star, 
  ChevronRight, 
  FlaskConical, 
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── DIMENSIONLESS NUMBERS ───
const DIMENSIONLESS_NUMBERS = [
  { id: 're', name: 'Reynolds Number (Re)', formula: 'ρvD/μ', desc: 'Ratio of inertial forces to viscous forces. Defines flow regime.', tags: ['Fluid', 'Heat', 'Mass'] },
  { id: 'pr', name: 'Prandtl Number (Pr)', formula: 'Cpμ/k', desc: 'Ratio of momentum diffusivity to thermal diffusivity.', tags: ['Heat'] },
  { id: 'nu', name: 'Nusselt Number (Nu)', formula: 'hD/k', desc: 'Ratio of convective to conductive heat transfer.', tags: ['Heat'] },
  { id: 'sc', name: 'Schmidt Number (Sc)', formula: 'μ/(ρD_AB)', desc: 'Ratio of momentum diffusivity to mass diffusivity.', tags: ['Mass'] },
  { id: 'sh', name: 'Sherwood Number (Sh)', formula: 'kcL/D_AB', desc: 'Ratio of convective to diffusive mass transport.', tags: ['Mass'] },
  { id: 'pe', name: 'Peclet Number (Pe)', formula: 'Re × Pr', desc: 'Ratio of advection to diffusion rate.', tags: ['Heat', 'Mass'] },
  { id: 'fr', name: 'Froude Number (Fr)', formula: 'v/√(gL)', desc: 'Ratio of inertial forces to gravitational forces.', tags: ['Fluid'] },
  { id: 'ma', name: 'Mach Number (Ma)', formula: 'v/c', desc: 'Ratio of flow velocity to the speed of sound.', tags: ['Fluid'] },
];

function DimensionlessHub() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [filter, setFilter] = useState('');

  // Load bookmarks
  useEffect(() => {
    const saved = localStorage.getItem('cec_bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  // Save bookmarks
  const toggleBookmark = (id: string) => {
    let newMarks = [];
    if (bookmarks.includes(id)) {
      newMarks = bookmarks.filter(b => b !== id);
    } else {
      newMarks = [...bookmarks, id];
    }
    setBookmarks(newMarks);
    localStorage.setItem('cec_bookmarks', JSON.stringify(newMarks));
  };

  const filtered = DIMENSIONLESS_NUMBERS.filter(d => 
    d.name.toLowerCase().includes(filter.toLowerCase()) || 
    d.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()))
  );

  // Sort so bookmarked items are always at the top
  const sorted = [...filtered].sort((a, b) => {
    const aBook = bookmarks.includes(a.id);
    const bBook = bookmarks.includes(b.id);
    if (aBook && !bBook) return -1;
    if (!aBook && bBook) return 1;
    return 0;
  });

  return (
    <CalcCard title="Dimensionless Numbers & Parameters" icon={Calculator}>
      <p className="text-sm text-slate-500 mb-8 font-medium">Bookmark your most-used parameters to pin them to the top of your workspace.</p>
      
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by name or category (e.g., 'Heat')..." 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sorted.map(d => {
          const isBookmarked = bookmarks.includes(d.id);
          return (
            <div 
              key={d.id} 
              className={`p-6 rounded-3xl border transition-all flex items-start gap-6 group ${
                isBookmarked 
                ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-indigo-300'
              }`}
            >
              <button 
                onClick={() => toggleBookmark(d.id)}
                className={`flex-shrink-0 mt-1 transition-colors ${
                  isBookmarked ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'
                }`}
                title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
              >
                <Star className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{d.name}</h4>
                  <div className="flex gap-2">
                    {d.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[10px] font-black uppercase tracking-widest">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xl font-black text-indigo-600 mb-2 font-mono tracking-tight">{d.formula}</div>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{d.desc}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info className="w-3 h-3" /> Technical Documentation <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CalcCard>
  );
}

// ─── HEAT DUTY CALCULATOR ───
function HeatDutyCalc() {
  const [m, setM] = useState('1000');
  const [cp, setCp] = useState('4.18');
  const [dT, setDT] = useState('50');
  const mass = parseFloat(m), cpv = parseFloat(cp), dt = parseFloat(dT);
  const Q = mass * cpv * dt;
  return (
    <CalcCard title="Heat Duty Calculator" icon={Activity}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Q = ṁ × Cp × ΔT — Sensible heat duty for process streams.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Mass Flow Rate (ṁ)" unit="kg/h" value={m} onChange={setM} />
        <InputRow label="Specific Heat (Cp)" unit="kJ/kg·K" value={cp} onChange={setCp} />
        <InputRow label="Temperature Change (ΔT)" unit="K" value={dT} onChange={setDT} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultBox label="Heat Duty (Q)" value={isNaN(Q) ? '--' : Q.toFixed(1)} unit="kJ/h" color="#ef4444" />
        <ResultBox label="Heat Duty" value={isNaN(Q) ? '--' : (Q / 3600).toFixed(2)} unit="kW" color="#f59e0b" />
      </div>
    </CalcCard>
  );
}

// ─── MASS BALANCE ───
function MassBalanceCalc() {
  const [feed, setFeed] = useState('1000');
  const [product, setProduct] = useState('800');
  const [waste, setWaste] = useState('150');
  const f = parseFloat(feed), p = parseFloat(product), w = parseFloat(waste);
  const accumulation = f - p - w;
  const yield_pct = f > 0 ? (p / f) * 100 : 0;
  return (
    <CalcCard title="Mass Balance Calculator" icon={Activity}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Feed = Product + Waste + Accumulation — Steady-state material balance.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Feed Rate" unit="kg/h" value={feed} onChange={setFeed} />
        <InputRow label="Product Rate" unit="kg/h" value={product} onChange={setProduct} />
        <InputRow label="Waste Rate" unit="kg/h" value={waste} onChange={setWaste} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Accumulation" value={isNaN(accumulation) ? '--' : accumulation.toFixed(1)} unit="kg/h" color={accumulation === 0 ? '#10b981' : '#f59e0b'} />
        <ResultBox label="Process Yield" value={isNaN(yield_pct) ? '--' : yield_pct.toFixed(1)} unit="%" color="#6366f1" />
        <ResultBox label="Balance Status" value={Math.abs(accumulation) < 0.01 ? 'Balanced ✓' : 'Unbalanced ✗'} unit="" color={Math.abs(accumulation) < 0.01 ? '#10b981' : '#ef4444'} />
      </div>
    </CalcCard>
  );
}

// ─── ENERGY BALANCE ───
function EnergyBalanceCalc() {
  const [Qin, setQin] = useState('5000');
  const [W, setW] = useState('1500');
  const [Qloss, setQloss] = useState('500');
  const qi = parseFloat(Qin), w = parseFloat(W), ql = parseFloat(Qloss);
  const Qout = qi - w - ql;
  const efficiency = qi > 0 ? (w / qi) * 100 : 0;
  return (
    <CalcCard title="Energy Balance Calculator" icon={Zap}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Q_in = W_out + Q_loss + Q_out — First law of thermodynamics for open systems.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Heat Input (Q_in)" unit="kW" value={Qin} onChange={setQin} />
        <InputRow label="Work Output (W)" unit="kW" value={W} onChange={setW} />
        <InputRow label="Heat Losses (Q_loss)" unit="kW" value={Qloss} onChange={setQloss} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Net Heat Output" value={isNaN(Qout) ? '--' : Qout.toFixed(1)} unit="kW" color="#3b82f6" />
        <ResultBox label="Thermal Efficiency" value={isNaN(efficiency) ? '--' : efficiency.toFixed(1)} unit="%" color="#10b981" />
        <ResultBox label="Energy Lost" value={isNaN(ql) ? '--' : ql.toFixed(1)} unit="kW" color="#ef4444" />
      </div>
    </CalcCard>
  );
}

// ─── PRESSURE DROP ───
function PressureDropCalc() {
  const [f, setF] = useState('0.02');
  const [L, setL] = useState('100');
  const [D, setD] = useState('0.1');
  const [rho, setRho] = useState('1000');
  const [v, setV] = useState('2');
  const fv = parseFloat(f), lv = parseFloat(L), dv = parseFloat(D), rv = parseFloat(rho), vv = parseFloat(v);
  const dP = fv * (lv / dv) * (rv * vv * vv / 2);
  return (
    <CalcCard title="Pipe Pressure Drop (Darcy-Weisbach)" icon={Activity}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">ΔP = f × (L/D) × (ρv²/2) — Frictional pressure loss in straight pipe.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Friction Factor (f)" unit="" value={f} onChange={setF} />
        <InputRow label="Pipe Length (L)" unit="m" value={L} onChange={setL} />
        <InputRow label="Pipe Diameter (D)" unit="m" value={D} onChange={setD} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <InputRow label="Fluid Density (ρ)" unit="kg/m³" value={rho} onChange={setRho} />
        <InputRow label="Flow Velocity (v)" unit="m/s" value={v} onChange={setV} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Pressure Drop" value={isNaN(dP) ? '--' : (dP / 1000).toFixed(2)} unit="kPa" color="#ef4444" />
        <ResultBox label="Pressure Drop" value={isNaN(dP) ? '--' : (dP / 100000).toFixed(4)} unit="bar" color="#f59e0b" />
        <ResultBox label="Head Loss" value={isNaN(dP) || rv <= 0 ? '--' : (dP / (rv * 9.81)).toFixed(2)} unit="m" color="#3b82f6" />
      </div>
    </CalcCard>
  );
}

// ─── PUMP POWER ───
function PumpPowerCalc() {
  const [Q, setQ] = useState('0.05');
  const [H, setH] = useState('30');
  const [rho, setRho] = useState('1000');
  const [eta, setEta] = useState('0.75');
  const qv = parseFloat(Q), hv = parseFloat(H), rv = parseFloat(rho), ev = parseFloat(eta);
  const Phyd = rv * 9.81 * qv * hv;
  const Pshaft = ev > 0 ? Phyd / ev : NaN;
  return (
    <CalcCard title="Pump Power Calculator" icon={Zap}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">P = ρgQH/η — Shaft power requirements for centrifugal pumps.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <InputRow label="Volume Flow Rate (Q)" unit="m³/s" value={Q} onChange={setQ} />
          <InputRow label="Total Dynamic Head (H)" unit="m" value={H} onChange={setH} />
        </div>
        <div className="space-y-4">
          <InputRow label="Fluid Density (ρ)" unit="kg/m³" value={rho} onChange={setRho} />
          <InputRow label="Pump Efficiency (η)" unit="" value={eta} onChange={setEta} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Hydraulic Power" value={isNaN(Phyd) ? '--' : (Phyd / 1000).toFixed(2)} unit="kW" color="#3b82f6" />
        <ResultBox label="Shaft Power" value={isNaN(Pshaft) ? '--' : (Pshaft / 1000).toFixed(2)} unit="kW" color="#ef4444" />
        <ResultBox label="Motor Size (×1.15)" value={isNaN(Pshaft) ? '--' : (Pshaft * 1.15 / 1000).toFixed(2)} unit="kW" color="#f59e0b" />
      </div>
    </CalcCard>
  );
}

// ─── REACTOR VOLUME QUICK-CALC ───
function ReactorVolumeCalc() {
  const [FA0, setFA0] = useState('5');
  const [X, setX] = useState('0.9');
  const [rA, setRA] = useState('0.5');
  const [CA0, setCA0] = useState('2');
  const [k, setK] = useState('0.1');

  const fa0 = parseFloat(FA0), x = parseFloat(X), ra = parseFloat(rA), ca0 = parseFloat(CA0), kv = parseFloat(k);
  let V_cstr = NaN, V_pfr = NaN;

  if (!isNaN(fa0) && !isNaN(x) && !isNaN(ra) && ra > 0) {
    V_cstr = fa0 * x / ra;
  }
  if (!isNaN(fa0) && !isNaN(x) && !isNaN(ca0) && !isNaN(kv) && kv > 0 && x < 1) {
    V_pfr = (fa0 / (kv * ca0)) * (-Math.log(1 - x));
  }

  return (
    <CalcCard title="Reactor Volume Quick-Calc" icon={FlaskConical}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Quick CSTR and PFR volume estimation for first-order kinetics.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Molar Feed Rate (F_A₀)" unit="mol/min" value={FA0} onChange={setFA0} />
        <InputRow label="Target Conversion (X)" unit="" value={X} onChange={setX} />
        <InputRow label="Avg. Rate (−r_A)" unit="mol/L·min" value={rA} onChange={setRA} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <InputRow label="Inlet Conc. (C_A₀)" unit="mol/L" value={CA0} onChange={setCA0} />
        <InputRow label="Rate Constant (k, 1st order)" unit="1/min" value={k} onChange={setK} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="CSTR Volume" value={isNaN(V_cstr) ? '--' : V_cstr.toFixed(2)} unit="L" color="#8b5cf6" />
        <ResultBox label="PFR Volume (1st order)" value={isNaN(V_pfr) ? '--' : V_pfr.toFixed(2)} unit="L" color="#3b82f6" />
        <ResultBox label="PFR/CSTR Ratio" value={!isNaN(V_pfr) && !isNaN(V_cstr) && V_cstr > 0 ? (V_pfr / V_cstr).toFixed(3) : '--'} unit="" color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── HX SIZING QUICK-CALC ───
function HXSizingCalc() {
  const [Q, setQ] = useState('500');
  const [U, setU] = useState('300');
  const [LMTD, setLMTD] = useState('40');
  const [Ft, setFt] = useState('0.9');

  const q = parseFloat(Q), u = parseFloat(U), lmtd = parseFloat(LMTD), ft = parseFloat(Ft);
  const A = u > 0 && lmtd > 0 && ft > 0 ? (q * 1000) / (u * ft * lmtd) : NaN;
  const nTubes = !isNaN(A) ? Math.ceil(A / (Math.PI * 0.019 * 3)) : NaN; // 3/4" OD × 3m tubes

  return (
    <CalcCard title="Heat Exchanger Sizing" icon={Activity}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">A = Q / (U × F_t × ΔTLM) — Quick area and tube count estimation.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <InputRow label="Heat Duty (Q)" unit="kW" value={Q} onChange={setQ} />
          <InputRow label="Overall U" unit="W/m²·K" value={U} onChange={setU} />
        </div>
        <div className="space-y-4">
          <InputRow label="LMTD (ΔT_LM)" unit="K" value={LMTD} onChange={setLMTD} />
          <InputRow label="Correction Factor (F_t)" unit="" value={Ft} onChange={setFt} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Required Area (A)" value={isNaN(A) ? '--' : A.toFixed(1)} unit="m²" color="#ef4444" />
        <ResultBox label="Est. Tubes (19mm x 3m)" value={isNaN(nTubes) ? '--' : nTubes.toString()} unit="tubes" color="#f59e0b" />
        <ResultBox label="Corrected LMTD" value={!isNaN(lmtd) && !isNaN(ft) ? (lmtd * ft).toFixed(1) : '--'} unit="K" color="#6366f1" />
      </div>
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type HubTab = 'formulas' | 'heat-duty' | 'mass-balance' | 'energy-balance' | 'pressure-drop' | 'pump-power' | 'reactor-vol' | 'hx-sizing';

export default function CalculatorsHub() {
  const [activeTab, setActiveTab] = useState<HubTab>('formulas');
  const tabs = [
    { id: 'formulas', label: 'Reference Hub', icon: Zap },
    { id: 'heat-duty', label: 'Heat Duty', icon: Activity },
    { id: 'mass-balance', label: 'Mass Balance', icon: FlaskConical },
    { id: 'energy-balance', label: 'Energy Balance', icon: Zap },
    { id: 'pressure-drop', label: 'ΔP Drop', icon: Activity },
    { id: 'pump-power', label: 'Pump Power', icon: Zap },
    { id: 'reactor-vol', label: 'Reactor Vol.', icon: FlaskConical },
    { id: 'hx-sizing', label: 'HX Sizing', icon: Activity },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Computational Engine</h1>
        <p className="text-slate-500 text-lg">Core engineering calculators and dimensionless number reference library.</p>
      </div>
      
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
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
        {activeTab === 'formulas' && <DimensionlessHub />}
        {activeTab === 'heat-duty' && <HeatDutyCalc />}
        {activeTab === 'mass-balance' && <MassBalanceCalc />}
        {activeTab === 'energy-balance' && <EnergyBalanceCalc />}
        {activeTab === 'pressure-drop' && <PressureDropCalc />}
        {activeTab === 'pump-power' && <PumpPowerCalc />}
        {activeTab === 'reactor-vol' && <ReactorVolumeCalc />}
        {activeTab === 'hx-sizing' && <HXSizingCalc />}
      </div>
    </div>
  );
}


