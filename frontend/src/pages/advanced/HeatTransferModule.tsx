import { useState } from 'react';
import { 
  Flame, 
  RefreshCw, 
  ClipboardList, 
  Zap, 
  Info, 
  ChevronRight,
  TrendingUp,
  Thermometer
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── LMTD METHOD ───
function LMTDCalc() {
  const [flowType, setFlowType] = useState<'counter' | 'parallel'>('counter');
  const [Thi, setThi] = useState('150');
  const [Tho, setTho] = useState('90');
  const [Tci, setTci] = useState('30');
  const [Tco, setTco] = useState('70');
  const [U, setU] = useState('300');
  const [A, setA] = useState('10');

  const thi = parseFloat(Thi), tho = parseFloat(Tho), tci = parseFloat(Tci), tco = parseFloat(Tco), u = parseFloat(U), a = parseFloat(A);

  let dT1: number, dT2: number;
  if (flowType === 'counter') {
    dT1 = thi - tco;
    dT2 = tho - tci;
  } else {
    dT1 = thi - tci;
    dT2 = tho - tco;
  }

  const lmtd = Math.abs(dT1 - dT2) < 0.001 ? dT1 : (dT1 - dT2) / Math.log(dT1 / dT2);
  const Q = u * a * lmtd;

  return (
    <CalcCard title="Log-Mean Temperature Difference" icon={RefreshCw}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Standard method for determining the temperature driving force in heat exchangers.</p>
      
      <div className="mb-10">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Flow Configuration</label>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {(['counter', 'parallel'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFlowType(f)} 
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                flowType === f 
                ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f} Flow
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-rose-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Hot Fluid Path</h4>
          </div>
          <InputRow label="Inlet Temp (T_hi)" unit="°C" value={Thi} onChange={setThi} />
          <InputRow label="Outlet Temp (T_ho)" unit="°C" value={Tho} onChange={setTho} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Cold Fluid Path</h4>
          </div>
          <InputRow label="Inlet Temp (T_ci)" unit="°C" value={Tci} onChange={setTci} />
          <InputRow label="Outlet Temp (T_co)" unit="°C" value={Tco} onChange={setTco} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-t border-slate-100 dark:border-slate-800 pt-10">
        <InputRow label="Overall HT Coeff. (U)" unit="W/m²·K" value={U} onChange={setU} />
        <InputRow label="Heat Transfer Area (A)" unit="m²" value={A} onChange={setA} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="LMTD (ΔT_lm)" value={isNaN(lmtd) ? '--' : lmtd.toFixed(2)} unit="°C" color="#f97316" />
        <ResultBox label="Total Heat Duty" value={isNaN(Q) ? '--' : (Q / 1000).toFixed(2)} unit="kW" color="#ea580c" />
        <ResultBox label="Temp Approach" value={`${isNaN(dT1) ? '--' : dT1.toFixed(1)} / ${isNaN(dT2) ? '--' : dT2.toFixed(1)}`} unit="°C" />
      </div>
    </CalcCard>
  );
}

// ─── RIGOROUS EFFECTIVENESS-NTU METHOD ───
function NTUCalc() {
  const [flow, setFlow] = useState<'counter' | 'parallel' | 'shell_tube'>('counter');
  const [Thi, setThi] = useState('150');
  const [mH, setMH] = useState('2');
  const [CpH, setCpH] = useState('4.18');
  const [Tci, setTci] = useState('30');
  const [mC, setMC] = useState('5');
  const [CpC, setCpC] = useState('4.18');
  const [U, setU] = useState('300');
  const [A, setA] = useState('15');

  const thi = parseFloat(Thi), mh = parseFloat(mH), cph = parseFloat(CpH) * 1000;
  const tci = parseFloat(Tci), mc = parseFloat(mC), cpc = parseFloat(CpC) * 1000;
  const u = parseFloat(U), a = parseFloat(A);

  const Ch = mh * cph;
  const Cc = mc * cpc;
  
  const Cmin = Math.min(Ch, Cc);
  const Cmax = Math.max(Ch, Cc);
  const Cr = isNaN(Cmin/Cmax) ? 0 : Cmin / Cmax;

  const ntu = (u * a) / Cmin;

  let eps = 0;
  if (!isNaN(ntu) && !isNaN(Cr)) {
    if (flow === 'parallel') {
      eps = (1 - Math.exp(-ntu * (1 + Cr))) / (1 + Cr);
    } else if (flow === 'counter') {
      if (Cr === 1) {
        eps = ntu / (1 + ntu);
      } else {
        eps = (1 - Math.exp(-ntu * (1 - Cr))) / (1 - Cr * Math.exp(-ntu * (1 - Cr)));
      }
    } else {
      const sq = Math.sqrt(1 + Cr * Cr);
      const E = Math.exp(-ntu * sq);
      eps = 2 / (1 + Cr + sq * ((1 + E) / (1 - E)));
    }
  }

  const q_max = Cmin * (thi - tci);
  const q_actual = eps * q_max;
  
  const Tho = thi - (q_actual / Ch);
  const Tco = tci + (q_actual / Cc);

  return (
    <CalcCard title="Effectiveness-NTU Analysis" icon={Zap}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Performance estimation for existing exchangers with known inlet conditions.</p>
      
      <div className="mb-10">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Exchanger Architecture</label>
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {(['counter', 'parallel', 'shell_tube'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFlow(f)} 
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                flow === f 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f.replace('_', ' & ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-rose-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Hot Stream (Primary)</h4>
          </div>
          <InputRow label="Inlet Temp" unit="°C" value={Thi} onChange={setThi} />
          <InputRow label="Mass Flow" unit="kg/s" value={mH} onChange={setMH} />
          <InputRow label="Heat Cap (Cp)" unit="kJ/kg·K" value={CpH} onChange={setCpH} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Cold Stream (Utility)</h4>
          </div>
          <InputRow label="Inlet Temp" unit="°C" value={Tci} onChange={setTci} />
          <InputRow label="Mass Flow" unit="kg/s" value={mC} onChange={setMC} />
          <InputRow label="Heat Cap (Cp)" unit="kJ/kg·K" value={CpC} onChange={setCpC} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-t border-slate-100 dark:border-slate-800 pt-10">
        <InputRow label="Overall Coeff. (U)" unit="W/m²·K" value={U} onChange={setU} />
        <InputRow label="Surface Area (A)" unit="m²" value={A} onChange={setA} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ResultBox label="Cap. Ratio (Cr)" value={isNaN(Cr) ? '--' : Cr.toFixed(3)} unit="" />
        <ResultBox label="NTU" value={isNaN(ntu) ? '--' : ntu.toFixed(2)} unit="" color="#2563eb" />
        <ResultBox label="Effectiveness (ε)" value={isNaN(eps) ? '--' : eps.toFixed(3)} unit="" color="#059669" />
        <ResultBox label="Heat Load (Q)" value={isNaN(q_actual) ? '--' : (q_actual/1000).toFixed(1)} unit="kW" color="#ea580c" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-rose-50/20 dark:bg-rose-900/10">
          <ResultBox label="Outlet Temp (Hot)" value={isNaN(Tho) ? '--' : Tho.toFixed(1)} unit="°C" color="#ef4444" />
        </div>
        <div className="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-blue-50/20 dark:bg-blue-900/10">
          <ResultBox label="Outlet Temp (Cold)" value={isNaN(Tco) ? '--' : Tco.toFixed(1)} unit="°C" color="#3b82f6" />
        </div>
      </div>
    </CalcCard>
  );
}

// ─── HT DATABASES ───
function HTDatabases() {
  const foulingData = [
    { fluid: 'Seawater (<50°C)', R_f: '0.00009' },
    { fluid: 'City Water', R_f: '0.00018' },
    { fluid: 'Treated Boiler Feed', R_f: '0.00009' },
    { fluid: 'Fuel Oil', R_f: '0.0009' },
    { fluid: 'Crude Oil', R_f: '0.0003 - 0.0012' },
    { fluid: 'Steam (Oil-free)', R_f: '0.00009' },
    { fluid: 'Organic Vapors', R_f: '0.0002' },
  ];

  return (
    <CalcCard title="Fouling Factor Database" icon={ClipboardList}>
      <p className="text-sm text-slate-500 mb-8 font-medium">Standard industrial thermal resistances for heat exchanger design and rating.</p>
      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Fluid / Service</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">R_f (m²·K/W)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {foulingData.map(d => (
              <tr key={d.fluid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{d.fluid}</td>
                <td className="px-6 py-4 text-right font-mono font-black text-amber-600">{d.R_f}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CalcCard>
  );
}

// ─── FOULING FACTOR DATABASE ───
function FoulingDatabase() {
  const foulingData = [
    { fluid: 'Distilled Water', Rf: 0.00009, category: 'Clean' },
    { fluid: 'City Water (below 50°C)', Rf: 0.00018, category: 'Clean' },
    { fluid: 'City Water (above 50°C)', Rf: 0.00035, category: 'Moderate' },
    { fluid: 'River Water', Rf: 0.00035, category: 'Moderate' },
    { fluid: 'Seawater (below 50°C)', Rf: 0.00009, category: 'Clean' },
    { fluid: 'Seawater (above 50°C)', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Boiler Feed Water (treated)', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Fuel Oil', Rf: 0.00088, category: 'Heavy' },
    { fluid: 'Transformer Oil', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Engine Lube Oil', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Refrigerant (liquid)', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Refrigerant (vapor)', Rf: 0.00035, category: 'Moderate' },
    { fluid: 'Steam (oil-free)', Rf: 0.00009, category: 'Clean' },
    { fluid: 'Steam (with oil)', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Natural Gas', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Flue Gas', Rf: 0.00088, category: 'Heavy' },
    { fluid: 'Organic Vapors', Rf: 0.00009, category: 'Clean' },
    { fluid: 'Alcohol Vapors', Rf: 0.00009, category: 'Clean' },
    { fluid: 'Heavy Hydrocarbons', Rf: 0.00053, category: 'Heavy' },
    { fluid: 'Vegetable Oil', Rf: 0.00053, category: 'Heavy' },
  ];

  const thermalK = [
    { material: 'Copper', k: 385, category: 'Metal' },
    { material: 'Aluminum', k: 205, category: 'Metal' },
    { material: 'Carbon Steel', k: 54, category: 'Metal' },
    { material: 'Stainless Steel 304', k: 16.3, category: 'Metal' },
    { material: 'Titanium', k: 21.9, category: 'Metal' },
    { material: 'Glass', k: 1.05, category: 'Insulator' },
    { material: 'Concrete', k: 1.7, category: 'Insulator' },
    { material: 'Fiberglass Insulation', k: 0.04, category: 'Insulator' },
    { material: 'PTFE (Teflon)', k: 0.25, category: 'Polymer' },
    { material: 'Polypropylene', k: 0.12, category: 'Polymer' },
  ];

  const [view, setView] = useState<'fouling' | 'conductivity'>('fouling');
  const catColor = (c: string) => c === 'Clean' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : c === 'Moderate' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
  const matColor = (c: string) => c === 'Metal' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : c === 'Insulator' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-violet-500 bg-violet-50 dark:bg-violet-900/20';

  return (
    <CalcCard title="Fouling Factors & Thermal Conductivity" icon={ClipboardList}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">TEMA-standard fouling resistances and material thermal conductivities for heat exchanger design.</p>
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mb-8">
        {(['fouling', 'conductivity'] as const).map(t => (
          <button key={t} onClick={() => setView(t)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${view === t ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {t === 'fouling' ? 'Fouling Factors (Rf)' : 'Thermal Conductivity (k)'}
          </button>
        ))}
      </div>

      {view === 'fouling' && (
        <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Fluid</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Rf (m²·K/W)</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
              </tr>
            </thead>
            <tbody>
              {foulingData.map(r => (
                <tr key={r.fluid} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors">
                  <td className="px-6 py-3 font-bold text-slate-900 dark:text-white">{r.fluid}</td>
                  <td className="px-6 py-3 text-right font-mono text-sm font-bold text-slate-600 dark:text-slate-300">{r.Rf.toFixed(5)}</td>
                  <td className="px-6 py-3 text-center"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${catColor(r.category)}`}>{r.category}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'conductivity' && (
        <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Material</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">k (W/m·K)</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
              </tr>
            </thead>
            <tbody>
              {thermalK.map(r => (
                <tr key={r.material} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-6 py-3 font-bold text-slate-900 dark:text-white">{r.material}</td>
                  <td className="px-6 py-3 text-right font-mono text-sm font-bold text-slate-600 dark:text-slate-300">{r.k}</td>
                  <td className="px-6 py-3 text-center"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${matColor(r.category)}`}>{r.category}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type HeatTab = 'ntu' | 'lmtd' | 'fouling' | 'database';

export default function HeatTransferModule() {
  const [activeTab, setActiveTab] = useState<HeatTab>('ntu');
  const tabs = [
    { id: 'ntu', label: 'ε-NTU Analysis', icon: Zap },
    { id: 'lmtd', label: 'Driving Force', icon: RefreshCw },
    { id: 'fouling', label: 'Fouling & k Data', icon: Thermometer },
    { id: 'database', label: 'Reference Data', icon: ClipboardList },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Heat Transfer Console</h1>
        <p className="text-slate-500 text-lg font-medium">Rigorous exchangers sizing, rating simulators, fouling databases, and thermal property libraries.</p>
      </div>

      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest pb-4 transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-b-4 border-orange-600 text-slate-900 dark:text-white' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {activeTab === 'ntu' && <NTUCalc />}
        {activeTab === 'lmtd' && <LMTDCalc />}
        {activeTab === 'fouling' && <FoulingDatabase />}
        {activeTab === 'database' && <HTDatabases />}
      </div>
    </div>
  );
}

