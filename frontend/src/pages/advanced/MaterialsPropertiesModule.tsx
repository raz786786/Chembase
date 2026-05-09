import { useState } from 'react';
import { 
  Database, 
  ShieldAlert, 
  Search, 
  Info, 
  ChevronRight,
  TrendingUp,
  FlaskConical,
  Activity,
  Zap,
  Beaker,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { CalcCard } from './SharedComponents';

// ─── CHEMPROP DATABASE ───
function ChemicalPropertiesDb() {
  const data = [
    { name: 'Water (Liquid)', formula: 'H₂O', d: 997, v: 0.89, bp: 100, mp: 0, mw: 18.015 },
    { name: 'Ethanol', formula: 'C₂H₅OH', d: 789, v: 1.095, bp: 78.37, mp: -114.1, mw: 46.069 },
    { name: 'Benzene', formula: 'C₆H₆', d: 876, v: 0.604, bp: 80.1, mp: 5.5, mw: 78.114 },
    { name: 'Toluene', formula: 'C₇H₈', d: 867, v: 0.59, bp: 110.6, mp: -95, mw: 92.141 },
    { name: 'Acetone', formula: 'C₃H₆O', d: 784, v: 0.32, bp: 56.05, mp: -94.7, mw: 58.08 },
    { name: 'Sulfuric Acid', formula: 'H₂SO₄', d: 1830, v: 24.2, bp: 337, mp: 10, mw: 98.079 },
    { name: 'Ammonia (Liquid)', formula: 'NH₃', d: 681, v: 0.25, bp: -33.34, mp: -77.73, mw: 17.031 },
    { name: 'Glycerol', formula: 'C₃H₈O₃', d: 1261, v: 1412, bp: 290, mp: 17.8, mw: 92.094 },
    { name: 'Hexane', formula: 'C₆H₁₄', d: 655, v: 0.3, bp: 68.7, mp: -95.3, mw: 86.178 },
  ];
  
  const [filter, setFilter] = useState('');
  const filtered = data.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()) || d.formula.toLowerCase().includes(filter.toLowerCase()));

  return (
    <CalcCard title="Chemical Properties Library" icon={Database}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Validated physical properties for common industrial solvents and reagents at standard conditions.</p>
      
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by name or chemical formula..." 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" 
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Substance</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">MW (g/mol)</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Density (kg/m³)</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Viscosity (cP)</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">BP (°C)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(d => (
              <tr key={d.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-700 dark:text-slate-300">{d.name}</div>
                  <div className="text-[10px] text-emerald-600 font-black font-mono tracking-wider">{d.formula}</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-slate-500">{d.mw}</td>
                <td className="px-6 py-4 text-right font-black text-blue-600">{d.d}</td>
                <td className="px-6 py-4 text-right font-black text-amber-600">{d.v}</td>
                <td className="px-6 py-4 text-right font-black text-rose-500">{d.bp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
        <Info className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
        <p className="text-xs font-bold text-slate-500 leading-relaxed">
          Properties are reported at STP (25°C, 1 atm). For high-pressure or temperature conditions, refer to the Thermodynamics module for Equation of State (EOS) corrections.
        </p>
      </div>
    </CalcCard>
  );
}

// ─── MSDS BASICS QUICK REFERENCE ───
function MSDSGuidance() {
  const diamonds = [
    { label: 'Health Hazard', desc: '0 (Normal) to 4 (Deadly)', color: 'bg-blue-500' },
    { label: 'Flammability', desc: '0 (Will not burn) to 4 (Below 73°F)', color: 'bg-rose-500' },
    { label: 'Instability', desc: '0 (Stable) to 4 (May detonate)', color: 'bg-amber-500' },
    { label: 'Special Hazard', desc: 'OX, W, SA codes', color: 'bg-slate-400' },
  ];

  return (
    <CalcCard title="MSDS Safety Framework" icon={ShieldAlert}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Standardized protocols for chemical handling and hazard identification (GHS & NFPA 704).</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> NFPA 704 Diamond Guide
            </h4>
            <div className="space-y-4">
              {diamonds.map(d => (
                <div key={d.label} className="glass p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className={`w-3 h-10 rounded-full ${d.color}`} />
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{d.label}</div>
                    <div className="text-[11px] font-bold text-slate-500">{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-500" /> SDS Critical Sections
            </h4>
            <div className="space-y-2">
              {[
                { s: 'Section 2', t: 'Hazard Identification', d: 'Pictograms & Signal words' },
                { s: 'Section 4', t: 'First-Aid Measures', d: 'Exposure protocols' },
                { s: 'Section 8', t: 'Exposure Controls', d: 'PPE, PEL, TLV limits' },
                { s: 'Section 9', t: 'Physical Properties', d: 'BP, MP, Solubilities' },
                { s: 'Section 10', t: 'Reactivity', d: 'Incompatibility matrix' },
                { s: 'Section 11', t: 'Toxicological', d: 'LD50, LC50 metrics' },
              ].map(sec => (
                <div key={sec.s} className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors group">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded h-fit">{sec.s}</span>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{sec.t}</div>
                    <div className="text-[11px] font-bold text-slate-500">{sec.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type MaterialsTab = 'properties' | 'msds';

export default function MaterialsPropertiesModule() {
  const [activeTab, setActiveTab] = useState<MaterialsTab>('properties');
  const tabs = [
    { id: 'properties', label: 'Properties Library', icon: Database },
    { id: 'msds', label: 'Safety Protocols', icon: ShieldAlert },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Materials & Properties Console</h1>
        <p className="text-slate-500 text-lg font-medium">Validated chemical property reference databases and industrial safety guidelines.</p>
      </div>
      
      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest pb-4 transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-b-4 border-emerald-600 text-slate-900 dark:text-white' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {activeTab === 'properties' && <ChemicalPropertiesDb />}
        {activeTab === 'msds' && <MSDSGuidance />}
      </div>
    </div>
  );
}
