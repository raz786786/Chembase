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
  {
    id: 're',
    name: 'Reynolds Number (Re)',
    formula: 'ρvD/μ',
    desc: 'Ratio of inertial forces to viscous forces. Defines flow regime.',
    meaning: 'Predicts laminar vs. turbulent transition in internal pipes and external boundary layers; governs friction factor and convective correlations.',
    ranges: 'Pipe flow: Re < 2100 (Laminar), 2100–4000 (Transitional), Re > 4000 (Turbulent).',
    tags: ['Fluid', 'Heat', 'Mass']
  },
  {
    id: 'pr',
    name: 'Prandtl Number (Pr)',
    formula: 'Cpμ/k',
    desc: 'Ratio of momentum diffusivity to thermal diffusivity.',
    meaning: 'Compares hydrodynamic and thermal boundary layer thicknesses (δ/δ_t). Purely a fluid transport property independent of geometry.',
    ranges: 'Liquid metals: 0.004–0.03 · Gases: ~0.7–1.0 · Water: ~7 (20°C) · Heavy oils: 10²–10⁵.',
    tags: ['Heat']
  },
  {
    id: 'nu',
    name: 'Nusselt Number (Nu)',
    formula: 'hD/k',
    desc: 'Ratio of convective to conductive heat transfer.',
    meaning: 'Measures convective enhancement over pure molecular conduction across a fluid layer of characteristic length D.',
    ranges: 'Nu = 1 (pure conduction) · Laminar pipe: 3.66 (const Tw) or 4.36 (const q″) · Turbulent: 100–1000+.',
    tags: ['Heat']
  },
  {
    id: 'sc',
    name: 'Schmidt Number (Sc)',
    formula: 'μ/(ρD_AB)',
    desc: 'Ratio of momentum diffusivity to mass diffusivity.',
    meaning: 'Mass-transfer analog of Prandtl number; relates hydrodynamic and concentration boundary layer thicknesses.',
    ranges: 'Gases: 0.5–2.5 · Liquids (aqueous solutes): 300–2000 · Polymer solutions: >10⁴.',
    tags: ['Mass']
  },
  {
    id: 'sh',
    name: 'Sherwood Number (Sh)',
    formula: 'kcL/D_AB',
    desc: 'Ratio of convective to diffusive mass transport.',
    meaning: 'Mass-transfer analog of Nusselt number; used to obtain mass transfer coefficient k_c in absorbers, extractors, and reactors.',
    ranges: 'Stagnant sphere: Sh = 2 · Forced convection: Sh = 2 + 0.6 Re^(1/2) Sc^(1/3) (Ranz–Marshall).',
    tags: ['Mass']
  },
  {
    id: 'pe',
    name: 'Peclet Number (Pe)',
    formula: 'Re × Pr (Heat) · Re × Sc (Mass)',
    desc: 'Ratio of advection to diffusion rate.',
    meaning: 'Quantifies bulk convective transport relative to molecular thermal conduction (Pe_h = vL/α) or mass diffusion (Pe_m = vL/D_AB).',
    ranges: 'Pe << 1 (diffusion-dominated / CSTR-like) · Pe >> 100 (advection-dominated / plug-flow).',
    tags: ['Heat', 'Mass']
  },
  {
    id: 'fr',
    name: 'Froude Number (Fr)',
    formula: 'v/√(gL)',
    desc: 'Ratio of inertial forces to gravitational forces.',
    meaning: 'Governs free-surface flows, open-channel hydraulics, vortex formation in agitated vessels, and hydraulic jumps.',
    ranges: 'Fr < 1 (subcritical / tranquil) · Fr = 1 (critical) · Fr > 1 (supercritical / rapid).',
    tags: ['Fluid']
  },
  {
    id: 'ma',
    name: 'Mach Number (Ma)',
    formula: 'v/c',
    desc: 'Ratio of flow velocity to the speed of sound.',
    meaning: 'Determines compressibility effects in gas pipelines, nozzles, relief valves, and turbomachinery.',
    ranges: 'Ma < 0.3 (incompressible approx.) · 0.3–0.8 (subsonic compressible) · Ma = 1 (choked/sonic) · Ma > 1 (supersonic).',
    tags: ['Fluid']
  },
];

function DimensionlessHub() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load bookmarks safely
  useEffect(() => {
    const saved = localStorage.getItem('cec_bookmarks');
    if (!saved) return;
    const t = setTimeout(() => {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed.filter((x): x is string => typeof x === 'string'));
        }
      } catch {
        // Ignore corrupted localStorage value
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Save bookmarks
  const toggleBookmark = (id: string) => {
    const newMarks = bookmarks.includes(id)
      ? bookmarks.filter(b => b !== id)
      : [...bookmarks, id];
    setBookmarks(newMarks);
    try {
      localStorage.setItem('cec_bookmarks', JSON.stringify(newMarks));
    } catch {
      // Ignore storage quota errors
    }
  };

  const q = filter.toLowerCase();
  const filtered = DIMENSIONLESS_NUMBERS.filter(d => 
    d.name.toLowerCase().includes(q) || 
    d.formula.toLowerCase().includes(q) ||
    d.tags.some(t => t.toLowerCase().includes(q))
  );

  // Sort so bookmarked items are always at the top
  const sorted = filtered.toSorted((a, b) => {
    const aBook = bookmarks.includes(a.id);
    const bBook = bookmarks.includes(b.id);
    if (aBook && !bBook) return -1;
    if (!aBook && bBook) return 1;
    return 0;
  });

  return (
    <CalcCard title="Dimensionless Numbers & Parameters" icon={Calculator}>
      <p className="text-sm text-surface-500 mb-8 font-medium">Bookmark your most-used parameters to pin them to the top of your workspace. Click any card for technical details.</p>
      
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input 
          type="text" 
          placeholder="Search by name or category (e.g., 'Heat')..." 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all" 
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sorted.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-sm font-bold text-surface-400">
            No dimensionless numbers matching "{filter}".
          </div>
        ) : sorted.map(d => {
          const isBookmarked = bookmarks.includes(d.id);
          const isExpanded = expandedId === d.id;
          return (
            <div 
              key={d.id}
              onClick={() => setExpandedId(isExpanded ? null : d.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(isExpanded ? null : d.id); } }}
              className={`p-6 rounded-3xl border transition-all flex items-start gap-6 group cursor-pointer ${
                isBookmarked 
                ? 'bg-primary-50/50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 shadow-sm' 
                : 'bg-surface-50/50 dark:bg-surface-900/50 border-surface-100 dark:border-surface-800 hover:border-primary-300'
              }`}
            >
              <button 
                onClick={e => { e.stopPropagation(); toggleBookmark(d.id); }}
                className={`flex-shrink-0 mt-1 transition-colors ${
                  isBookmarked ? 'text-primary-600' : 'text-surface-300 group-hover:text-surface-400'
                }`}
                title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
              >
                <Star className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-surface-900 dark:text-surface-50">{d.name}</h4>
                  <div className="flex gap-2">
                    {d.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-500 rounded text-[10px] font-black uppercase tracking-widest">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xl font-black text-primary-600 mb-2 font-mono tracking-tight">{d.formula}</div>
                <p className="text-sm text-surface-500 leading-relaxed mb-3">{d.desc}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-primary-500 uppercase tracking-widest">
                  <Info className="w-3 h-3" /> {isExpanded ? 'Hide Technical Details' : 'Technical Details'} <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-surface-200/70 dark:border-surface-700/70 space-y-2 text-xs">
                    <div>
                      <span className="font-black uppercase tracking-wider text-surface-400 mr-2">Formula:</span>
                      <span className="font-mono font-bold text-surface-700 dark:text-surface-200">{d.formula}</span>
                    </div>
                    <div>
                      <span className="font-black uppercase tracking-wider text-surface-400 mr-2">Physical Meaning:</span>
                      <span className="font-medium text-surface-600 dark:text-surface-300">{d.meaning}</span>
                    </div>
                    <div>
                      <span className="font-black uppercase tracking-wider text-surface-400 mr-2">Typical Ranges:</span>
                      <span className="font-medium text-surface-600 dark:text-surface-300">{d.ranges}</span>
                    </div>
                  </div>
                )}
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
  const Q = isFinite(mass) && mass >= 0 && isFinite(cpv) && cpv > 0 && isFinite(dt) ? mass * cpv * dt : NaN;
  return (
    <CalcCard title="Heat Duty Calculator" icon={Activity}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Q = ṁ × Cp × ΔT — Sensible heat duty for process streams.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Mass Flow Rate (ṁ)" unit="kg/h" value={m} onChange={setM} />
        <InputRow label="Specific Heat (Cp)" unit="kJ/kg·K" value={cp} onChange={setCp} />
        <InputRow label="Temperature Change (ΔT)" unit="K" value={dT} onChange={setDT} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultBox label="Heat Duty (Q)" value={!isFinite(Q) ? '--' : Q.toFixed(1)} unit="kJ/h" color="#ef4444" />
        <ResultBox label="Heat Duty" value={!isFinite(Q) ? '--' : (Q / 3600).toFixed(2)} unit="kW" color="#f59e0b" />
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
  const valid = isFinite(f) && f >= 0 && isFinite(p) && p >= 0 && isFinite(w) && w >= 0;
  const accumulation = valid ? f - p - w : NaN;
  const yield_pct = valid && f > 0 ? (p / f) * 100 : NaN;
  const isBalanced = isFinite(accumulation) && Math.abs(accumulation) < 0.01;
  return (
    <CalcCard title="Mass Balance Calculator" icon={Activity}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Feed = Product + Waste + Accumulation — Steady-state material balance.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Feed Rate" unit="kg/h" value={feed} onChange={setFeed} />
        <InputRow label="Product Rate" unit="kg/h" value={product} onChange={setProduct} />
        <InputRow label="Waste Rate" unit="kg/h" value={waste} onChange={setWaste} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Accumulation" value={!isFinite(accumulation) ? '--' : accumulation.toFixed(1)} unit="kg/h" color={!isFinite(accumulation) ? '#64748b' : isBalanced ? '#10b981' : '#f59e0b'} />
        <ResultBox label="Process Yield" value={!isFinite(yield_pct) ? '--' : yield_pct.toFixed(1)} unit="%" color="#6366f1" />
        <ResultBox label="Balance Status" value={!isFinite(accumulation) ? '--' : isBalanced ? 'Balanced ✓' : 'Unbalanced ✗'} unit="" color={!isFinite(accumulation) ? '#64748b' : isBalanced ? '#10b981' : '#ef4444'} />
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
  const valid = isFinite(qi) && qi >= 0 && isFinite(w) && isFinite(ql) && ql >= 0;
  const Qout = valid ? qi - w - ql : NaN;
  const efficiency = valid && qi > 0 ? (w / qi) * 100 : NaN;
  return (
    <CalcCard title="Energy Balance Calculator" icon={Zap}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Q_in = W_out + Q_loss + Q_out — First law of thermodynamics for open systems.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Heat Input (Q_in)" unit="kW" value={Qin} onChange={setQin} />
        <InputRow label="Work Output (W)" unit="kW" value={W} onChange={setW} />
        <InputRow label="Heat Losses (Q_loss)" unit="kW" value={Qloss} onChange={setQloss} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Net Heat Output" value={!isFinite(Qout) ? '--' : Qout.toFixed(1)} unit="kW" color="#3b82f6" />
        <ResultBox label="Thermal Efficiency" value={!isFinite(efficiency) ? '--' : efficiency.toFixed(1)} unit="%" color="#10b981" />
        <ResultBox label="Energy Lost" value={!isFinite(ql) || ql < 0 ? '--' : ql.toFixed(1)} unit="kW" color="#ef4444" />
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
  const valid = isFinite(fv) && fv >= 0 && isFinite(lv) && lv >= 0 && isFinite(dv) && dv > 0 && isFinite(rv) && rv > 0 && isFinite(vv) && vv >= 0;
  const dP = valid ? fv * (lv / dv) * (rv * vv * vv / 2) : NaN;
  return (
    <CalcCard title="Pipe Pressure Drop (Darcy-Weisbach)" icon={Activity}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">ΔP = f_D × (L/D) × (ρv²/2) — Frictional pressure loss in straight pipe.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Darcy Friction Factor (f_D)" unit="" value={f} onChange={setF} />
        <InputRow label="Pipe Length (L)" unit="m" value={L} onChange={setL} />
        <InputRow label="Pipe Diameter (D)" unit="m" value={D} onChange={setD} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <InputRow label="Fluid Density (ρ)" unit="kg/m³" value={rho} onChange={setRho} />
        <InputRow label="Flow Velocity (v)" unit="m/s" value={v} onChange={setV} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Pressure Drop" value={!isFinite(dP) ? '--' : (dP / 1000).toFixed(2)} unit="kPa" color="#ef4444" />
        <ResultBox label="Pressure Drop" value={!isFinite(dP) ? '--' : (dP / 100000).toFixed(4)} unit="bar" color="#f59e0b" />
        <ResultBox label="Head Loss" value={!isFinite(dP) ? '--' : (dP / (rv * 9.81)).toFixed(2)} unit="m" color="#3b82f6" />
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
  const hydValid = isFinite(qv) && qv >= 0 && isFinite(hv) && hv >= 0 && isFinite(rv) && rv > 0;
  const Phyd = hydValid ? rv * 9.81 * qv * hv : NaN;
  const effTooHigh = isFinite(ev) && ev > 1;
  const Pshaft = hydValid && isFinite(ev) && ev > 0 && ev <= 1 ? Phyd / ev : NaN;
  return (
    <CalcCard title="Pump Power Calculator" icon={Zap}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">P = ρgQH/η — Shaft power requirements for centrifugal pumps.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <InputRow label="Volume Flow Rate (Q)" unit="m³/s" value={Q} onChange={setQ} />
          <InputRow label="Total Dynamic Head (H)" unit="m" value={H} onChange={setH} />
        </div>
        <div className="space-y-4">
          <InputRow label="Fluid Density (ρ)" unit="kg/m³" value={rho} onChange={setRho} />
          <InputRow label="Pump Efficiency (η, 0–1)" unit="" value={eta} onChange={setEta} />
        </div>
      </div>
      {effTooHigh && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300">
          Pump efficiency η must be a decimal between 0 and 1 (e.g., enter 0.75 for 75% efficiency).
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Hydraulic Power" value={!isFinite(Phyd) ? '--' : (Phyd / 1000).toFixed(2)} unit="kW" color="#3b82f6" />
        <ResultBox label="Shaft Power" value={!isFinite(Pshaft) ? '--' : (Pshaft / 1000).toFixed(2)} unit="kW" color="#ef4444" />
        <ResultBox label="Motor Size (×1.15)" value={!isFinite(Pshaft) ? '--' : (Pshaft * 1.15 / 1000).toFixed(2)} unit="kW" color="#f59e0b" />
      </div>
    </CalcCard>
  );
}

// ─── REACTOR VOLUME QUICK-CALC ───
function ReactorVolumeCalc() {
  const [FA0, setFA0] = useState('5');
  const [X, setX] = useState('0.9');
  const [CA0, setCA0] = useState('2');
  const [k, setK] = useState('0.1');

  const fa0 = parseFloat(FA0), x = parseFloat(X), ca0 = parseFloat(CA0), kv = parseFloat(k);
  let V_cstr = NaN, V_pfr = NaN;
  const validRate = isFinite(kv) && kv > 0 && isFinite(ca0) && ca0 > 0 && isFinite(x) && x >= 0 && x < 1;
  const exit_rA = validRate ? kv * ca0 * (1 - x) : NaN;

  if (validRate && isFinite(fa0) && fa0 >= 0) {
    if (exit_rA > 0) {
      V_cstr = (fa0 * x) / exit_rA;
    }
    V_pfr = (fa0 / (kv * ca0)) * (-Math.log(1 - x));
  }

  return (
    <CalcCard title="Reactor Volume Quick-Calc" icon={FlaskConical}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Quick CSTR and PFR volume estimation for first-order kinetics.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="space-y-4">
          <InputRow label="Molar Feed Rate (F_A₀)" unit="mol/min" value={FA0} onChange={setFA0} />
          <InputRow label="Target Conversion (X)" unit="" value={X} onChange={setX} />
        </div>
        <div className="space-y-4">
          <InputRow label="Inlet Conc. (C_A₀)" unit="mol/L" value={CA0} onChange={setCA0} />
          <InputRow label="Rate Constant (k, 1st order)" unit="1/min" value={k} onChange={setK} />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ResultBox label="Exit Rate (−r_A)" value={!isFinite(exit_rA) ? '--' : exit_rA.toFixed(4)} unit="mol/L·min" color="#f59e0b" />
        <ResultBox label="CSTR Volume" value={!isFinite(V_cstr) ? '--' : V_cstr.toFixed(2)} unit="L" color="#8b5cf6" />
        <ResultBox label="PFR Volume (1st order)" value={!isFinite(V_pfr) ? '--' : V_pfr.toFixed(2)} unit="L" color="#3b82f6" />
        <ResultBox label="PFR/CSTR Ratio" value={isFinite(V_pfr) && isFinite(V_cstr) && V_cstr > 0 ? (V_pfr / V_cstr).toFixed(3) : '--'} unit="" color="#10b981" />
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
  const validFtLmtd = isFinite(lmtd) && lmtd > 0 && isFinite(ft) && ft > 0 && ft <= 1;
  const A = isFinite(q) && q >= 0 && isFinite(u) && u > 0 && validFtLmtd ? (q * 1000) / (u * ft * lmtd) : NaN;
  const nTubes = isFinite(A) ? Math.ceil(A / (Math.PI * 0.019 * 3)) : NaN; // 3/4" OD × 3m tubes

  return (
    <CalcCard title="Heat Exchanger Sizing" icon={Activity}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">A = Q / (U × F_t × ΔTLM) — Quick area and tube count estimation.</p>
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
        <ResultBox label="Required Area (A)" value={!isFinite(A) ? '--' : A.toFixed(1)} unit="m²" color="#ef4444" />
        <ResultBox label="Est. Tubes (19mm x 3m)" value={!isFinite(nTubes) ? '--' : nTubes.toString()} unit="tubes" color="#f59e0b" />
        <ResultBox label="Corrected LMTD" value={validFtLmtd ? (lmtd * ft).toFixed(1) : '--'} unit="K" color="#6366f1" />
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
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-surface-900 dark:text-surface-50 mb-1">Computational Engine</h1>
        <p className="text-surface-500 text-xs">Core engineering calculators and dimensionless number reference library.</p>
      </div>
      
      <div className="touch-scroll-x flex gap-2 border-b border-surface-200 dark:border-surface-800 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider pb-2.5 transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id 
              ? 'border-primary-600 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
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


