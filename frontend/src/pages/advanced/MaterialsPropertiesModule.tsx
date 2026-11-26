import { useState } from 'react';
import { 
  Database, 
  ShieldAlert, 
  Search, 
  Info, 
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
  const normalizeSubscripts = (s: string) =>
    s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, ch => String(ch.charCodeAt(0) - 0x2080)).toLowerCase();
  const q = normalizeSubscripts(filter.trim());
  const filtered = data.filter(
    d => d.name.toLowerCase().includes(q) || normalizeSubscripts(d.formula).includes(q)
  );

  return (
    <CalcCard title="Chemical Properties Library" icon={Database}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Validated physical properties for common industrial solvents and reagents at standard conditions.</p>
      
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input 
          type="text" 
          placeholder="Search by name or chemical formula (e.g., H2O, H2SO4, NH3)..." 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-bold outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all" 
        />
      </div>

      <div className="overflow-x-auto rounded-3xl border border-surface-100 dark:border-surface-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-surface-400">Substance</th>
              <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-surface-400">MW (g/mol)</th>
              <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-surface-400">Density (kg/m³)</th>
              <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-surface-400">Viscosity (cP)</th>
              <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-surface-400">MP (°C)</th>
              <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-surface-400">BP (°C)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm font-bold text-surface-400">
                  No substances matching "{filter}".
                </td>
              </tr>
            ) : filtered.map(d => (
              <tr key={d.name} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-bold text-surface-700 dark:text-surface-300">{d.name}</div>
                  <div className="text-[10px] text-accent-600 font-black font-mono tracking-wider">{d.formula}</div>
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold text-surface-500">{d.mw}</td>
                <td className="px-5 py-4 text-right font-black text-primary-600">{d.d}</td>
                <td className="px-5 py-4 text-right font-black text-accent-600">{d.v}</td>
                <td className="px-5 py-4 text-right font-black text-sky-500">{d.mp}</td>
                <td className="px-5 py-4 text-right font-black text-rose-500">{d.bp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 p-6 bg-surface-50/50 dark:bg-surface-900/50 rounded-3xl border border-surface-100 dark:border-surface-800 flex items-start gap-4">
        <Info className="w-5 h-5 text-surface-400 mt-1 flex-shrink-0" />
        <p className="text-xs font-bold text-surface-500 leading-relaxed">
          Properties are reported at SATP (25°C, 1 atm; NH₃ liquid at −33.3°C, Glycerol viscosity at 20°C). For high-pressure or temperature conditions, refer to the Thermodynamics module for Equation of State (EOS) corrections.
        </p>
      </div>
    </CalcCard>
  );
}

// ─── MSDS BASICS QUICK REFERENCE ───
function MSDSGuidance() {
  const diamonds = [
    { code: 'H', label: 'Health Hazard', desc: '0 (Normal) to 4 (Deadly)', color: 'bg-blue-600 text-white' },
    { code: 'F', label: 'Flammability', desc: '0 (Will not burn) to 4 (Flash point < 73°F (22.8°C) and BP < 100°F (37.8°C))', color: 'bg-red-600 text-white' },
    { code: 'I', label: 'Instability', desc: '0 (Stable) to 4 (May detonate)', color: 'bg-yellow-400 text-slate-950' },
    { code: 'S', label: 'Special Hazard', desc: 'OX (Oxidizer), W (Water-reactive), SA (Simple asphyxiant)', color: 'bg-white text-slate-900 border border-slate-300' },
  ];

  return (
    <CalcCard title="MSDS Safety Framework" icon={ShieldAlert}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Standardized protocols for chemical handling and hazard identification (GHS & NFPA 704).</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-400 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent-500" /> NFPA 704 Diamond Guide
            </h4>
            <div className="space-y-4">
              {diamonds.map(d => (
                <div key={d.label} className="glass p-4 rounded-2xl border border-surface-100 dark:border-surface-800 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${d.color}`}>{d.code}</div>
                  <div>
                    <div className="text-xs font-black text-surface-900 dark:text-surface-50 uppercase tracking-wider">{d.label}</div>
                    <div className="text-[11px] font-bold text-surface-500">{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-400 mb-6 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-accent-500" /> SDS Critical Sections
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
                <div key={sec.s} className="flex items-start gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 rounded-2xl transition-colors group">
                  <span className="text-[10px] font-black text-accent-600 bg-accent-50 dark:bg-accent-900/30 px-2 py-1 rounded h-fit">{sec.s}</span>
                  <div>
                    <div className="text-xs font-black text-surface-900 dark:text-surface-50 uppercase tracking-wider">{sec.t}</div>
                    <div className="text-[11px] font-bold text-surface-500">{sec.d}</div>
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
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-surface-900 dark:text-surface-50 mb-1">Materials & Properties</h1>
        <p className="text-surface-500 text-xs">Validated chemical properties and industrial safety guidelines.</p>
      </div>
      
      <div className="touch-scroll-x flex gap-3 border-b border-surface-200 dark:border-surface-800 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest pb-4 transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-b-4 border-accent-600 text-surface-900 dark:text-surface-50' 
              : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
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
