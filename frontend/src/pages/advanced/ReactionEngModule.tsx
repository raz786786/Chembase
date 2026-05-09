import { useState } from 'react';
import { 
  Settings, 
  Wind, 
  BookOpen, 
  Info, 
  ChevronRight,
  TrendingUp,
  Box,
  Layers,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── VARIABLE VOLUME METRICS (EPSILON) ───
function VariableVolumeCalc() {
  const [yA0, setYA0] = useState('1.0');
  const [deltaN, setDeltaN] = useState('1');
  const [X, setX] = useState('0.8');
  const [CA0, setCA0] = useState('2');

  const ya = parseFloat(yA0), dn = parseFloat(deltaN), x = parseFloat(X), ca0 = parseFloat(CA0);
  const eps = ya * dn;
  
  const v_ratio = 1 + eps * x;
  const CA = (ca0 * (1 - x)) / (1 + eps * x);

  return (
    <CalcCard title="Gas-Phase Expansion Analysis" icon={Wind}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">V = V₀(1 + εX) — Analytical metrics for reactions with significant molar changes.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-indigo-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Initial Composition</h4>
          </div>
          <InputRow label="Mole Fraction A (y_A₀)" unit="" value={yA0} onChange={setYA0} />
          <InputRow label="Molar Change (Δn)" unit="" value={deltaN} onChange={setDeltaN} />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Example: A → 2B + C (Δn = 2)</p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-indigo-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Reaction Target</h4>
          </div>
          <InputRow label="Conversion (X)" unit="" value={X} onChange={setX} />
          <InputRow label="Inlet Conc. (C_A₀)" unit="mol/L" value={CA0} onChange={setCA0} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Expansion Factor (ε)" value={isNaN(eps) ? '--' : eps.toFixed(2)} unit="" color="#f59e0b" />
        <ResultBox label="Volume Ratio (V/V₀)" value={isNaN(v_ratio) ? '--' : v_ratio.toFixed(2)} unit="×" color="#8b5cf6" />
        <ResultBox label="Final Conc. (C_A)" value={isNaN(CA) ? '--' : CA.toFixed(3)} unit="mol/L" color="#3b82f6" />
      </div>
    </CalcCard>
  );
}

// ─── CSTR IN SERIES ───
function CSTRSeriesCalc() {
  const [FA0, setFA0] = useState('100');
  const [k, setK] = useState('0.1');
  const [CA0, setCA0] = useState('2');
  const [X_target, setXTarget] = useState('0.9');

  const fa0 = parseFloat(FA0), kk = parseFloat(k), ca0 = parseFloat(CA0), x = parseFloat(X_target);
  const v0 = fa0 / ca0;
  
  let v1 = 0, v2 = 0, v3 = 0, vpfr = 0;
  if (!isNaN(v0) && !isNaN(kk) && !isNaN(x) && x < 1) {
    const tau1 = x / (kk * (1 - x));
    v1 = tau1 * v0;
    
    const tau2 = (Math.pow(1 - x, -1/2) - 1) / kk;
    v2 = 2 * tau2 * v0;

    const tau3 = (Math.pow(1 - x, -1/3) - 1) / kk;
    v3 = 3 * tau3 * v0;

    const tauPFR = Math.log(1 / (1 - x)) / kk;
    vpfr = tauPFR * v0;
  }

  return (
    <CalcCard title="Reactor Network Optimization" icon={RefreshCw}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Compares required volumes for mixed-flow (CSTR) vs plug-flow (PFR) configurations.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-violet-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Feed Parameters</h4>
          </div>
          <InputRow label="Molar Feed Rate" unit="mol/s" value={FA0} onChange={setFA0} />
          <InputRow label="Initial Conc." unit="mol/L" value={CA0} onChange={setCA0} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-violet-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Kinetic Constraints</h4>
          </div>
          <InputRow label="Target Conv. (X)" unit="" value={X_target} onChange={setXTarget} />
          <InputRow label="Rate Constant (k)" unit="1/s" value={k} onChange={setK} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <ResultBox label="Single CSTR" value={isNaN(v1) || !isFinite(v1) ? '--' : v1.toFixed(1)} unit="L" color="#ef4444" />
        <ResultBox label="2 CSTR Series" value={isNaN(v2) || !isFinite(v2) ? '--' : v2.toFixed(1)} unit="L" color="#f97316" />
        <ResultBox label="3 CSTR Series" value={isNaN(v3) || !isFinite(v3) ? '--' : v3.toFixed(1)} unit="L" color="#eab308" />
        <ResultBox label="Single PFR" value={isNaN(vpfr) || !isFinite(vpfr) ? '--' : vpfr.toFixed(1)} unit="L" color="#10b981" />
      </div>

      <div className="p-6 bg-violet-50/30 dark:bg-violet-900/10 rounded-3xl border border-violet-100 dark:border-violet-900/30 flex items-start gap-4">
        <Info className="w-5 h-5 text-violet-500 mt-1 flex-shrink-0" />
        <p className="text-xs font-bold text-slate-500 leading-relaxed">
          As N → ∞, the total series CSTR volume converges to the PFR volume. Series configurations are preferred for high conversions to minimize total footprint.
        </p>
      </div>
    </CalcCard>
  );
}

// ─── REACTION KINETICS DATABASE ───
function KineticsDatabase() {
  const data = [
    { name: 'Saponification of Ethyl Acetate', phase: 'Liquid', order: '2nd', Ea: 42.6, A: '1.8×10⁷' },
    { name: 'Decomposition of N₂O₅', phase: 'Gas', order: '1st', Ea: 103.2, A: '4.3×10¹³' },
    { name: 'Synthesis of Ammonia', phase: 'Gas/Solid', order: 'Complex', Ea: 150, A: '--' },
    { name: 'Cracking of Ethane (to C₂H₄)', phase: 'Gas', order: '1st', Ea: 284, A: '3×10¹³' },
    { name: 'Oxidation of SO₂ (Pt Catalyst)', phase: 'Gas/Solid', order: 'Complex', Ea: 75, A: '--' },
  ];

  return (
    <CalcCard title="Kinetics Library" icon={BookOpen}>
      <p className="text-sm text-slate-500 mb-8 font-medium">Verified Arrhenius parameters for common industrial reaction systems.</p>
      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Reaction System</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Order</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ea (kJ/mol)</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Pre-exp A</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map(d => (
              <tr key={d.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-700 dark:text-slate-300">{d.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{d.phase} Phase</div>
                </td>
                <td className="px-6 py-4 font-black text-violet-600">{d.order}</td>
                <td className="px-6 py-4 text-right font-black text-rose-500">{d.Ea}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-slate-500">{d.A}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CalcCard>
  );
}

// ─── BATCH REACTOR SIZING ───
function BatchReactorCalc() {
  const [CA0, setCA0] = useState('2.0');
  const [X, setX] = useState('0.9');
  const [k, setK] = useState('0.1');
  const [order, setOrder] = useState<'1' | '2'>('1');

  const ca0 = parseFloat(CA0), x = parseFloat(X), kv = parseFloat(k);
  let t_batch = 0;
  if (!isNaN(ca0) && !isNaN(x) && !isNaN(kv) && kv > 0 && x < 1) {
    if (order === '1') {
      t_batch = -Math.log(1 - x) / kv;
    } else {
      t_batch = x / (kv * ca0 * (1 - x));
    }
  }

  return (
    <CalcCard title="Batch Reactor Design" icon={Box}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Calculate required reaction time for batch operation at target conversion.</p>
      <div className="mb-6">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Reaction Order</label>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {(['1', '2'] as const).map(o => (
            <button key={o} onClick={() => setOrder(o)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${order === o ? 'bg-white dark:bg-slate-700 text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {o === '1' ? 'First Order' : 'Second Order'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Initial Conc. (C_A₀)" unit="mol/L" value={CA0} onChange={setCA0} />
        <InputRow label="Target Conversion (X)" unit="" value={X} onChange={setX} />
        <InputRow label={order === '1' ? 'Rate Constant (k)' : 'Rate Constant (k)'} unit={order === '1' ? '1/min' : 'L/mol·min'} value={k} onChange={setK} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Batch Time" value={isNaN(t_batch) || !isFinite(t_batch) ? '--' : t_batch.toFixed(2)} unit="min" color="#8b5cf6" />
        <ResultBox label="Final Conc. (C_A)" value={isNaN(ca0) || isNaN(x) ? '--' : (ca0 * (1 - x)).toFixed(3)} unit="mol/L" color="#3b82f6" />
        <ResultBox label="Moles Reacted" value={isNaN(ca0) || isNaN(x) ? '--' : (ca0 * x).toFixed(3)} unit="mol/L" color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── PACKED BED REACTOR ───
function PBRCalc() {
  const [FA0, setFA0] = useState('5');
  const [X, setX] = useState('0.8');
  const [rA, setRA] = useState('0.5');
  const [rhoCat, setRhoCat] = useState('500');

  const fa0 = parseFloat(FA0), x = parseFloat(X), ra = parseFloat(rA), rho = parseFloat(rhoCat);
  const W = !isNaN(fa0) && !isNaN(x) && !isNaN(ra) && ra > 0 ? (fa0 * x) / ra : NaN;
  const V_bed = !isNaN(W) && !isNaN(rho) && rho > 0 ? W / rho : NaN;
  const spaceVel = !isNaN(fa0) && !isNaN(W) && W > 0 ? fa0 / W : NaN;

  return (
    <CalcCard title="Packed Bed Reactor (PBR)" icon={Layers}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">W = F_A₀ · X / (−r'_A) — Catalyst weight sizing for heterogeneous reactions.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <InputRow label="Molar Feed Rate (F_A₀)" unit="mol/min" value={FA0} onChange={setFA0} />
          <InputRow label="Target Conversion (X)" unit="" value={X} onChange={setX} />
        </div>
        <div className="space-y-4">
          <InputRow label="Rate per Cat. (−r'_A)" unit="mol/kg·min" value={rA} onChange={setRA} />
          <InputRow label="Catalyst Bulk Density" unit="kg/m³" value={rhoCat} onChange={setRhoCat} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Catalyst Weight (W)" value={isNaN(W) ? '--' : W.toFixed(2)} unit="kg" color="#8b5cf6" />
        <ResultBox label="Bed Volume" value={isNaN(V_bed) ? '--' : (V_bed * 1000).toFixed(1)} unit="L" color="#f59e0b" />
        <ResultBox label="Space Velocity" value={isNaN(spaceVel) ? '--' : spaceVel.toFixed(4)} unit="mol/kg·min" color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── SELECTIVITY & YIELD ───
function SelectivityCalc() {
  const [FA0, setFA0] = useState('10');
  const [FA, setFA] = useState('2');
  const [FD, setFD] = useState('6');
  const [FU, setFU] = useState('2');

  const fa0 = parseFloat(FA0), fa = parseFloat(FA), fd = parseFloat(FD), fu = parseFloat(FU);
  const X = fa0 > 0 ? (fa0 - fa) / fa0 : NaN;
  const Sd = (fd > 0 || fu > 0) ? fd / (fd + fu) : NaN;
  const Yd = fa0 > 0 ? fd / fa0 : NaN;
  const OY = (fa0 - fa) > 0 ? fd / (fa0 - fa) : NaN;

  return (
    <CalcCard title="Selectivity & Yield Analysis" icon={TrendingUp}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Multiple-reaction performance metrics for parallel/series reaction systems.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <InputRow label="Feed Molar Rate (F_A₀)" unit="mol/min" value={FA0} onChange={setFA0} />
          <InputRow label="Exit A Rate (F_A)" unit="mol/min" value={FA} onChange={setFA} />
        </div>
        <div className="space-y-4">
          <InputRow label="Desired Product (F_D)" unit="mol/min" value={FD} onChange={setFD} />
          <InputRow label="Undesired Product (F_U)" unit="mol/min" value={FU} onChange={setFU} />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ResultBox label="Conversion (X)" value={isNaN(X) ? '--' : (X * 100).toFixed(1)} unit="%" color="#6366f1" />
        <ResultBox label="Selectivity (S_D)" value={isNaN(Sd) ? '--' : (Sd * 100).toFixed(1)} unit="%" color="#10b981" />
        <ResultBox label="Overall Yield (Y_D)" value={isNaN(Yd) ? '--' : (Yd * 100).toFixed(1)} unit="%" color="#f59e0b" />
        <ResultBox label="Instantaneous Yield" value={isNaN(OY) ? '--' : (OY * 100).toFixed(1)} unit="%" color="#8b5cf6" />
      </div>
    </CalcCard>
  );
}

// ─── CATALYSIS REFERENCE DATABASE ───
function CatalysisDB() {
  const catalysts = [
    { name: 'Pt/Al₂O₃', reaction: 'Catalytic Reforming', temp: '450–520°C', mechanism: 'Bifunctional (metal + acid)', lifespan: '3–5 years', notes: 'Naphtha to aromatics, high octane' },
    { name: 'V₂O₅/TiO₂', reaction: 'SCR DeNOx', temp: '300–400°C', mechanism: 'Redox cycle', lifespan: '3–7 years', notes: 'Flue gas NOx removal' },
    { name: 'Fe₃O₄/Cr₂O₃/K₂O', reaction: 'Haber-Bosch (NH₃)', temp: '400–500°C', mechanism: 'Dissociative chemisorption', lifespan: '10+ years', notes: 'N₂ + 3H₂ → 2NH₃, 150–300 bar' },
    { name: 'ZnO/Al₂O₃/CuO', reaction: 'Methanol Synthesis', temp: '220–275°C', mechanism: 'CO/CO₂ hydrogenation', lifespan: '2–5 years', notes: 'CO₂ + 3H₂ → CH₃OH + H₂O' },
    { name: 'Ni/Al₂O₃', reaction: 'Steam Methane Reforming', temp: '700–1000°C', mechanism: 'Surface dissociation', lifespan: '3–5 years', notes: 'CH₄ + H₂O → CO + 3H₂' },
    { name: 'Pd/C', reaction: 'Hydrogenation', temp: '25–100°C', mechanism: 'H₂ dissociation on Pd', lifespan: 'Reusable', notes: 'Pharma fine chemicals, mild conditions' },
    { name: 'Zeolite (H-ZSM-5)', reaction: 'FCC Cracking', temp: '500–550°C', mechanism: 'Brønsted acid sites', lifespan: 'Continuously regenerated', notes: 'Heavy oil → gasoline/diesel' },
    { name: 'TiO₂ (Anatase)', reaction: 'Photocatalysis', temp: 'Ambient', mechanism: 'UV electron-hole pairs', lifespan: 'Semi-permanent', notes: 'Water purification, self-cleaning' },
    { name: 'Rh/Pt/Pd Monolith', reaction: 'Three-Way Catalyst', temp: '300–600°C', mechanism: 'Redox + oxidation', lifespan: '100k+ miles', notes: 'Automotive CO/HC/NOx treatment' },
    { name: 'MoS₂/Al₂O₃', reaction: 'Hydrodesulfurization', temp: '300–400°C', mechanism: 'Sulfur vacancy sites', lifespan: '2–4 years', notes: 'Crude oil sulfur removal' },
  ];
  const [filter, setFilter] = useState('');
  const filtered = catalysts.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.reaction.toLowerCase().includes(filter.toLowerCase()));

  return (
    <CalcCard title="Industrial Catalysis Reference" icon={Zap}>
      <p className="text-sm text-slate-500 mb-6 font-medium italic">Common industrial catalysts with operating conditions and mechanisms.</p>
      <div className="relative mb-6">
        <input type="text" placeholder="Search catalysts or reactions..." value={filter} onChange={e => setFilter(e.target.value)}
          className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-violet-500 transition-all" />
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Catalyst</th>
              <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Reaction</th>
              <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Temp</th>
              <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Mechanism</th>
              <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Life</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.name} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors">
                <td className="px-4 py-3 font-bold text-violet-600">{c.name}</td>
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{c.reaction}</td>
                <td className="px-4 py-3 text-center text-slate-500">{c.temp}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{c.mechanism}</td>
                <td className="px-4 py-3 text-center text-slate-500">{c.lifespan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type RxnTab = 'series' | 'variable-vol' | 'batch' | 'pbr' | 'selectivity' | 'catalysis' | 'database';

export default function ReactionEngModule() {
  const [activeTab, setActiveTab] = useState<RxnTab>('series');
  const tabs = [
    { id: 'series', label: 'Reactor Networks', icon: RefreshCw },
    { id: 'variable-vol', label: 'Gas Kinetics', icon: Wind },
    { id: 'batch', label: 'Batch Reactor', icon: Box },
    { id: 'pbr', label: 'Packed Bed', icon: Layers },
    { id: 'selectivity', label: 'Selectivity', icon: TrendingUp },
    { id: 'catalysis', label: 'Catalysis DB', icon: Zap },
    { id: 'database', label: 'Kinetics Library', icon: BookOpen },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Reaction Engineering Console</h1>
        <p className="text-slate-500 text-lg font-medium">Reactor sizing, selectivity analysis, catalysis data, and kinetic property libraries.</p>
      </div>

      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest pb-4 transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-b-4 border-violet-600 text-slate-900 dark:text-white' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {activeTab === 'series' && <CSTRSeriesCalc />}
        {activeTab === 'variable-vol' && <VariableVolumeCalc />}
        {activeTab === 'batch' && <BatchReactorCalc />}
        {activeTab === 'pbr' && <PBRCalc />}
        {activeTab === 'selectivity' && <SelectivityCalc />}
        {activeTab === 'catalysis' && <CatalysisDB />}
        {activeTab === 'database' && <KineticsDatabase />}
      </div>
    </div>
  );
}

