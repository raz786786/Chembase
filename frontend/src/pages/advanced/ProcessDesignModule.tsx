import { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart4, 
  ChevronRight,
  Info,
  Calendar,
  Zap,
  Activity,
  Box,
  Scale
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── POWER LAW COST ESTIMATION ───
function PowerLawCost() {
  const [baseCost, setBaseCost] = useState('150000');
  const [baseCap, setBaseCap] = useState('100');
  const [newCap, setNewCap] = useState('250');
  const [exp, setExp] = useState('0.6');
  const [baseYear, setBaseYear] = useState('2010');
  const [newYear, setNewYear] = useState('2023');

  const cepciData: Record<string, number> = {
    '2000': 394, '2005': 468, '2010': 551, '2015': 557, '2018': 603, '2019': 607, '2020': 596, '2021': 708, '2022': 816, '2023': 798, '2024': 805
  };

  const bc = parseFloat(baseCost), bcap = parseFloat(baseCap), ncap = parseFloat(newCap), e = parseFloat(exp);
  const cepciBase = cepciData[baseYear] || 551;
  const cepciNew = cepciData[newYear] || 798;

  const costScale = Math.pow(ncap / bcap, e);
  const costIndex = cepciNew / cepciBase;
  const cNew = bc * costScale * costIndex;

  return (
    <CalcCard title="Equipment Cost Scaling (Power Law)" icon={DollarSign}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">C₂ = C₁ × (Size₂/Size₁)ⁿ × (Index₂/Index₁) — Precise economic forecasting adjusted for inflation.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-slate-400 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Reference Point (Base)</h4>
          </div>
          <InputRow label="Known Cost (C₁)" unit="$" value={baseCost} onChange={setBaseCost} />
          <InputRow label="Known Size (Size₁)" unit="Units" value={baseCap} onChange={setBaseCap} />
          
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Base Year (CEPCI)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={baseYear} 
                onChange={e => setBaseYear(e.target.value)} 
                className="w-full pl-12 pr-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold outline-none focus:border-slate-500 transition-all appearance-none text-sm"
              >
                {Object.keys(cepciData).map(y => <option key={y} value={y}>{y} (Index: {cepciData[y]})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-indigo-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Design Target</h4>
          </div>
          <InputRow label="Target Size (Size₂)" unit="Units" value={newCap} onChange={setNewCap} />
          <InputRow label="Scaling Exponent (n)" unit="" value={exp} onChange={setExp} />
          
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Target Year (CEPCI)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={newYear} 
                onChange={e => setNewYear(e.target.value)} 
                className="w-full pl-12 pr-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold outline-none focus:border-indigo-500 transition-all appearance-none text-sm"
              >
                {Object.keys(cepciData).map(y => <option key={y} value={y}>{y} (Index: {cepciData[y]})</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <ResultBox label="Capacity Factor" value={isNaN(costScale) ? '--' : `${costScale.toFixed(2)}x`} unit="" />
        <ResultBox label="Inflation Multiplier" value={isNaN(costIndex) ? '--' : `${costIndex.toFixed(2)}x`} unit="" />
        <ResultBox label="Estimated Cost" value={isNaN(cNew) ? '--' : `$${cNew.toLocaleString(undefined, {maximumFractionDigits: 0})}`} unit="" color="#10b981" />
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
        <Info className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Common Exponents (n):</p>
          <div className="flex flex-wrap gap-4">
            {[
              { l: 'Centrifugal Pumps', v: '0.6' },
              { l: 'Shell/Tube HX', v: '0.68' },
              { l: 'Agitated Tanks', v: '0.5' },
              { l: 'Fermenters', v: '0.54' },
            ].map(item => (
              <div key={item.l} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">{item.l}:</span>
                <span className="text-[10px] font-black text-indigo-600">{item.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type DesignTab = 'cost';

export default function ProcessDesignModule() {
  const [activeTab, setActiveTab] = useState<DesignTab>('cost');
  const tabs = [
    { id: 'cost', label: 'Power Scaling Law', icon: DollarSign },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Process Design Console</h1>
        <p className="text-slate-500 text-lg font-medium">Historical CEPCI data indices and rigorous component scaling economics.</p>
      </div>

      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest pb-4 transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-b-4 border-slate-700 text-slate-900 dark:text-white' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {activeTab === 'cost' && <PowerLawCost />}
      </div>
    </div>
  );
}
