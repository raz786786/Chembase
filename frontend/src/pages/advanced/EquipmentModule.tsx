import { useState } from 'react';
import { 
  Wind, 
  Settings, 
  Activity, 
  Info, 
  ChevronRight,
  Zap,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── RIGOROUS COMPRESSOR POWER ───
function CompressorCalc() {
  const [compType, setCompType] = useState<'isentropic' | 'polytropic'>('polytropic');
  const [P1, setP1] = useState('100'); // kPa
  const [P2, setP2] = useState('500'); // kPa
  const [Q_std, setQStd] = useState('0.1'); // m3/s
  const [T1, setT1] = useState('298'); // K
  
  const [k, setK] = useState('1.4'); // Cp/Cv
  const [Z, setZ] = useState('0.98'); // Avg compressibility
  const [eff, setEff] = useState('75'); // efficiency

  const p1 = parseFloat(P1), p2 = parseFloat(P2), q = parseFloat(Q_std), t1 = parseFloat(T1);
  const kk = parseFloat(k), z = parseFloat(Z), e = parseFloat(eff) / 100;
  
  let power = 0;
  let power_ideal = 0;
  let T2 = 0;

  if (!isNaN(p1) && !isNaN(p2) && !isNaN(q) && !isNaN(kk) && !isNaN(z) && !isNaN(e) && e > 0) {
    if (compType === 'isentropic') {
      const exp = (kk - 1) / kk;
      power_ideal = z * (p1 * 1000) * q * (1 / exp) * (Math.pow(p2 / p1, exp) - 1);
      power = power_ideal / e;
      T2 = t1 * Math.pow(p2 / p1, exp) / Math.pow(e, 0.4);
    } else {
      const exp = (kk - 1) / (kk * e);
      power_ideal = z * (p1 * 1000) * q * (1 / exp) * (Math.pow(p2 / p1, exp) - 1);
      power = power_ideal;
      T2 = t1 * Math.pow(p2 / p1, exp);
    }
  }

  return (
    <CalcCard title="Gas Compression Analysis" icon={Wind}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Simulates Isentropic and Polytropic compression paths with compressibility factor adjustments.</p>
      
      <div className="mb-10">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Thermodynamic Path</label>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {(['polytropic', 'isentropic'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setCompType(f)} 
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                compType === f 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-indigo-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Inlet Conditions</h4>
          </div>
          <InputRow label="Suction Pressure (P₁)" unit="kPa" value={P1} onChange={setP1} />
          <InputRow label="Inlet Temperature (T₁)" unit="K" value={T1} onChange={setT1} />
          <InputRow label="Volumetric Flow (Q₁)" unit="m³/s" value={Q_std} onChange={setQStd} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-amber-500 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Gas & Machine Params</h4>
          </div>
          <InputRow label="Discharge Pressure (P₂)" unit="kPa" value={P2} onChange={setP2} />
          <InputRow label="Heat Capacity Ratio (k)" unit="Cp/Cv" value={k} onChange={setK} />
          <InputRow label="Efficiency (η)" unit="%" value={eff} onChange={setEff} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Theoretical Power" value={isNaN(power_ideal) ? '--' : (power_ideal / 1000).toFixed(1)} unit="kW" />
        <ResultBox label="Brake Shaft Power" value={isNaN(power) ? '--' : (power / 1000).toFixed(1)} unit="kW" color="#f59e0b" />
        <ResultBox label="Discharge Temp (T₂)" value={isNaN(T2) ? '--' : T2.toFixed(1)} unit="K" color="#ef4444" />
      </div>

      <div className="mt-10 p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-4">
        <Info className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Compression Note</p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            The {compType} calculation assumes an average compressibility factor Z = {Z}. For high-pressure applications, 
            consider using the PR-EOS module to determine local Z-factors at inlet and outlet for improved precision.
          </p>
        </div>
      </div>
    </CalcCard>
  );
}

// ─── NPSH CALCULATOR ───
function NPSHCalc() {
  const [Patm, setPatm] = useState('101.325');
  const [Pvap, setPvap] = useState('2.34');
  const [rho, setRho] = useState('1000');
  const [zs, setZs] = useState('3');
  const [hfL, setHfL] = useState('0.5');
  const [NPSHr, setNPSHr] = useState('3.0');

  const patm = parseFloat(Patm), pvap = parseFloat(Pvap), rv = parseFloat(rho);
  const z = parseFloat(zs), hf = parseFloat(hfL), npshReq = parseFloat(NPSHr);
  const g = 9.81;
  const NPSHA = (patm - pvap) * 1000 / (rv * g) + z - hf;
  const margin = NPSHA - npshReq;

  return (
    <CalcCard title="NPSH Analysis" icon={Activity}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">NPSH_A = (P_atm - P_vap)/(ρg) + z_s - h_fL — Cavitation safety margin for pump installations.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <InputRow label="Atmospheric Pressure" unit="kPa" value={Patm} onChange={setPatm} />
          <InputRow label="Vapor Pressure" unit="kPa" value={Pvap} onChange={setPvap} />
          <InputRow label="Fluid Density (ρ)" unit="kg/m³" value={rho} onChange={setRho} />
        </div>
        <div className="space-y-4">
          <InputRow label="Static Suction Head (z_s)" unit="m" value={zs} onChange={setZs} />
          <InputRow label="Friction Losses (h_fL)" unit="m" value={hfL} onChange={setHfL} />
          <InputRow label="NPSH Required" unit="m" value={NPSHr} onChange={setNPSHr} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="NPSH Available" value={isNaN(NPSHA) ? '--' : NPSHA.toFixed(2)} unit="m" color="#3b82f6" />
        <ResultBox label="NPSH Required" value={isNaN(npshReq) ? '--' : npshReq.toFixed(2)} unit="m" color="#f59e0b" />
        <ResultBox label="Safety Margin" value={isNaN(margin) ? '--' : margin.toFixed(2)} unit="m" color={margin >= 1 ? '#10b981' : margin >= 0 ? '#f59e0b' : '#ef4444'} />
      </div>
      <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${margin >= 1 ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30' : margin >= 0 ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30' : 'bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30'}`}>
        <Info className={`w-5 h-5 ${margin >= 1 ? 'text-emerald-500' : margin >= 0 ? 'text-amber-500' : 'text-rose-500'}`} />
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {margin >= 1 ? `Safe: ${margin.toFixed(1)}m margin above required NPSH — no cavitation risk.` :
           margin >= 0 ? `Warning: Only ${margin.toFixed(1)}m margin. Recommend increasing suction head or reducing losses.` :
           `Danger: NPSH_A < NPSH_R — cavitation will occur! Raise pump or reduce losses.`}
        </span>
      </div>
    </CalcCard>
  );
}

// ─── EQUIPMENT CATALOG ───
function EquipmentCatalog() {
  const catalog = [
    { name: 'Shell & Tube HX', type: 'Heat Transfer', U_range: '150–1200', pressure: '≤150 bar', temp: '-200 to 800°C', notes: 'Most common industrial exchanger' },
    { name: 'Plate HX', type: 'Heat Transfer', U_range: '1000–4000', pressure: '≤25 bar', temp: '-35 to 200°C', notes: 'High U, compact, easy cleaning' },
    { name: 'Double Pipe HX', type: 'Heat Transfer', U_range: '100–500', pressure: '≤300 bar', temp: '-200 to 600°C', notes: 'Simple, low area, high pressure' },
    { name: 'Centrifugal Pump', type: 'Fluid Moving', U_range: 'η=60–85%', pressure: '≤40 bar', temp: '-30 to 200°C', notes: 'Standard process pump, NPSH critical' },
    { name: 'Positive Displacement Pump', type: 'Fluid Moving', U_range: 'η=80–95%', pressure: '≤700 bar', temp: '-30 to 350°C', notes: 'Viscous fluids, precise flow' },
    { name: 'Packed Tower', type: 'Separation', U_range: 'HETP 0.3–1.5m', pressure: '≤10 bar', temp: '-40 to 300°C', notes: 'Low ΔP, corrosive service, random/structured' },
    { name: 'Tray Column', type: 'Separation', U_range: 'Eff. 50–80%', pressure: '≤50 bar', temp: '-40 to 400°C', notes: 'Wide turndown, fouling tolerant' },
    { name: 'CSTR Reactor', type: 'Reaction', U_range: 'V: 0.1–50 m³', pressure: '≤25 bar', temp: '0 to 300°C', notes: 'Uniform composition, good temp control' },
    { name: 'PFR (Tubular)', type: 'Reaction', U_range: 'L/D: 10–100', pressure: '≤300 bar', temp: '0 to 800°C', notes: 'High conversion per unit volume' },
    { name: 'Fluidized Bed', type: 'Reaction', U_range: 'u: 0.1–3 m/s', pressure: '≤25 bar', temp: '200 to 1000°C', notes: 'Excellent heat transfer, catalytic' },
  ];

  const [filter, setFilter] = useState('');
  const filtered = catalog.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()) || e.type.toLowerCase().includes(filter.toLowerCase()));

  const typeColor = (t: string) => {
    if (t === 'Heat Transfer') return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
    if (t === 'Fluid Moving') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    if (t === 'Separation') return 'text-teal-600 bg-teal-50 dark:bg-teal-900/20';
    return 'text-violet-600 bg-violet-50 dark:bg-violet-900/20';
  };

  return (
    <CalcCard title="Industrial Equipment Catalog" icon={Cpu}>
      <p className="text-sm text-slate-500 mb-6 font-medium italic">Quick-reference specifications for common process equipment.</p>
      <div className="relative mb-6">
        <input type="text" placeholder="Filter by name or type..." value={filter} onChange={e => setFilter(e.target.value)}
          className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all" />
      </div>
      <div className="space-y-3">
        {filtered.map(e => (
          <div key={e.name} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{e.name}</h4>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${typeColor(e.type)}`}>{e.type}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><span className="text-slate-400 font-bold">U/Spec:</span> <span className="font-bold text-slate-600 dark:text-slate-300">{e.U_range}</span></div>
              <div><span className="text-slate-400 font-bold">Pressure:</span> <span className="font-bold text-slate-600 dark:text-slate-300">{e.pressure}</span></div>
              <div><span className="text-slate-400 font-bold">Temp:</span> <span className="font-bold text-slate-600 dark:text-slate-300">{e.temp}</span></div>
              <div><span className="text-slate-400 font-bold">Notes:</span> <span className="font-bold text-slate-600 dark:text-slate-300">{e.notes}</span></div>
            </div>
          </div>
        ))}
      </div>
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type EquipTab = 'compressors' | 'npsh' | 'catalog';

export default function EquipmentModule() {
  const [activeTab, setActiveTab] = useState<EquipTab>('compressors');
  const tabs = [
    { id: 'compressors', label: 'Compression Systems', icon: Wind },
    { id: 'npsh', label: 'NPSH Analysis', icon: Activity },
    { id: 'catalog', label: 'Equipment Catalog', icon: Cpu },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Process Equipment Console</h1>
        <p className="text-slate-500 text-lg font-medium">Compressor sizing, NPSH analysis, and industrial equipment reference catalog.</p>
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
        {activeTab === 'compressors' && <CompressorCalc />}
        {activeTab === 'npsh' && <NPSHCalc />}
        {activeTab === 'catalog' && <EquipmentCatalog />}
      </div>
    </div>
  );
}

