import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import { 
  Factory, Search, Wheat, Fuel, Pill, Droplets, Zap, Activity, 
  Globe, GitBranch, Box, ThermometerSun, Sliders, Calculator, 
  ShieldAlert, Leaf, Settings, BrainCircuit, GraduationCap, Bot, Briefcase, 
  Users, FileText, Star, AlertTriangle, ArrowRight, X, BookOpen, Layers,
  ExternalLink, Sparkles
} from 'lucide-react';
import { CORE_INDUSTRIES } from './data/coreIndustries';
import { CENTRAL_EQUIPMENT_DATABASE, type EquipmentItem } from './data/equipmentDatabase';
import IndustryDashboard from './components/IndustryDashboard';
import { api } from '../../../api';

const iconMap: Record<string, any> = {
  Factory, Wheat, Fuel, Pill, Droplets, Zap, Activity, Box, FileText
};

function renderFormattedText(text: string) {
  return text.split('\n').map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return (
      <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return <strong key={i} className="font-bold text-surface-900 dark:text-white">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return <em key={i} className="italic">{part.slice(1, -1)}</em>;
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  });
}

function IndustryTutorPanel() {
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([
    {
      role: 'assistant',
      text: 'I am connected to all 15 industrial chemical engineering sectors and the central equipment database. Ask me about flowsheets, unit operations, catalyst selection, control loops, or plant troubleshooting.'
    }
  ]);
  const [question, setQuestion] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const answerQuestionOffline = (q: string): string => {
    const low = q.toLowerCase();
    if (low.includes('ammonia') || low.includes('haber') || low.includes('urea')) {
      return '**Ammonia / Urea Synthesis:** Haber–Bosch operates at 150–250 bar and 400–500 °C over promoted iron (Fe/K₂O/Al₂O₃) catalyst. Single-pass conversion is ~15–20% due to equilibrium limits, so unreacted N₂/H₂ is recycled after condensing NH₃. Urea is produced from NH₃ + CO₂ at 140–180 bar via ammonium carbamate dehydration.';
    }
    if (low.includes('cement') || low.includes('kiln') || low.includes('clinker')) {
      return '**Cement Rotary Kiln Process:** Raw meal (CaCO₃ + clay) is preheated in a 5-stage cyclone preheater/precalciner (850–900 °C, >90% calcination) before entering the rotary kiln (1450 °C sintering zone) to form alite (C₃S) and belite (C₂S) clinker, followed by rapid grate cooling.';
    }
    if (low.includes('refinery') || low.includes('crude') || low.includes('fcc') || low.includes('distillation')) {
      return '**Oil & Gas Refinery:** Desalted crude is heated to ~350 °C in a fired heater and fractionated in the Atmospheric Distillation Unit (ADU) into LPG, naphtha, kerosene, diesel, and atmospheric residue. Heavy gas oils go to Fluid Catalytic Cracking (FCC, zeolite catalyst, ~510 °C) to maximize gasoline and olefins.';
    }
    if (low.includes('control') || low.includes('pid') || low.includes('cascade') || low.includes('surge')) {
      return '**Industrial Process Control:** Reactors and columns commonly use cascade control (e.g., master TIC adjusting slave jacket-flow FIC) to reject utility disturbances before they affect product quality. Centrifugal compressors use dedicated anti-surge recycle loops (FT/PT → recycle valve) to prevent mechanical damage.';
    }
    if (low.includes('pump') || low.includes('cavitation') || low.includes('npsh') || low.includes('troubleshoot')) {
      return '**Plant Troubleshooting (Pumps & Rotating Equipment):** Cavitation occurs when NPSH_A < NPSH_R (cracking/gravel noise, fluctuating discharge pressure, impeller pitting). Remedies: raise suction drum level, lower fluid temperature, clean suction strainer, or reduce flow rate.';
    }
    return `**Industrial Engineering Analysis for "${q}":**\n• **Process Envelope:** Check operating T, P, and residence time in the Operating Parameters tab.\n• **Equipment & Metallurgy:** Match corrosion allowance and alloy class (CS, 316L SS, Duplex) to fluid chemistry.\n• **Safety & Control:** Verify relief valve (PSV) sizing and interlocks (HAZOP/LOPA) before changing setpoints.\n\nTry asking about *Ammonia/Urea*, *Cement Kiln*, *Refinery/FCC*, *Cascade & Anti-Surge Control*, or *Pump Cavitation*.`;
  };

  const handleSend = async (e?: React.FormEvent, preset?: string) => {
    e?.preventDefault();
    const text = (preset ?? question).trim();
    if (!text || isThinking) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setQuestion('');
    setIsThinking(true);

    try {
      const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 6000));
      const res = await Promise.race([
        api.aiProxy({
          prompt: `Answer this industrial chemical engineering question concisely with operating conditions, governing mechanisms, and safety/control considerations: ${text}`,
          system_prompt: 'You are a Senior Chemical Process Engineer tutor. Be concise, accurate, and practical.'
        }).catch(() => null),
        timeout,
      ]);
      const reply = (res && !res.error && res.text?.trim()) ? res.text.trim() : answerQuestionOffline(text);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: answerQuestionOffline(text) }]);
    } finally {
      setIsThinking(false);
    }
  };

  const prompts = [
    'Explain Haber-Bosch ammonia loop',
    'How does a cement rotary kiln work?',
    'How to prevent centrifugal pump cavitation?',
    'When to use cascade PID control?',
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-surface-900 dark:text-white flex items-center gap-3"><Bot className="text-primary-500"/> Global Industry AI Tutor</h1>
        <p className="text-surface-500 text-sm">Ask cross-sector chemical engineering questions (PFDs, equipment comparisons, thermodynamics, troubleshooting).</p>
      </div>
      <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-5 flex flex-col justify-between shadow-sm min-h-[540px]">
        <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
          {messages.map((m, idx) => (
            <div key={idx} className={`p-4 rounded-2xl text-xs leading-relaxed ${
              m.role === 'user'
                ? 'ml-auto max-w-[85%] bg-primary-600 text-white font-semibold'
                : 'max-w-[90%] bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-800 text-surface-800 dark:text-surface-200'
            }`}>
              {m.role === 'assistant' && idx === 0 && (
                <div className="font-bold mb-1 flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                  <Sparkles className="w-3.5 h-3.5" /> Industrial Knowledge Assistant
                </div>
              )}
              {m.role === 'assistant' ? renderFormattedText(m.text) : m.text}
            </div>
          ))}
          {isThinking && (
            <div className="max-w-[90%] p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-800 text-xs text-primary-600 font-semibold animate-pulse">
              Analyzing industrial process knowledge...
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {prompts.map(p => (
              <button
                key={p}
                type="button"
                disabled={isThinking}
                onClick={() => handleSend(undefined, p)}
                className="px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[11px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-primary-50 hover:text-primary-600 transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask a cross-industry chemical engineering question..."
              className="flex-1 px-4 py-3 rounded-2xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-950 text-surface-900 dark:text-white shadow-sm focus:border-primary-500 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={!question.trim() || isThinking}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-2xl shadow-sm transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              Send <ArrowRight className="w-4 h-4"/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function IndustryModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [tsSearch, setTsSearch] = useState('');
  const [tsIndustryFilter, setTsIndustryFilter] = useState('all');
  const [globalChallengeChoices, setGlobalChallengeChoices] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedEquipment) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedEquipment(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedEquipment]);

  const navItems = [
    { id: 'search', label: 'Search', icon: Search, path: '/advanced/industry' },
    { id: 'explore', label: 'Explore Industries', icon: Globe, path: '/advanced/industry/explore' },
    { id: 'process-explorer', label: 'Global Process Explorer', icon: GitBranch, path: '/advanced/industry/process-explorer' },
    { id: 'equipment', label: 'Central Equipment DB', icon: Box, path: '/advanced/industry/equipment' },
    { id: 'parameters', label: 'Operating Parameters', icon: ThermometerSun, path: '/advanced/industry/parameters' },
    { id: 'control', label: 'Process Control Loops', icon: Sliders, path: '/advanced/industry/control' },
    { id: 'mass-energy', label: 'Mass & Energy', icon: Calculator, path: '/advanced/industry/mass-energy' },
    { id: 'safety', label: 'Safety & Hazards', icon: ShieldAlert, path: '/advanced/industry/safety' },
    { id: 'environment', label: 'Environment', icon: Leaf, path: '/advanced/industry/environment' },
    { id: 'troubleshooting', label: 'Global Troubleshooter', icon: Settings, path: '/advanced/industry/troubleshooting' },
    { id: 'challenges', label: 'Engineering Challenges', icon: BrainCircuit, path: '/advanced/industry/challenges' },
    { id: 'internship', label: 'Internship Mode', icon: GraduationCap, path: '/advanced/industry/internship' },
    { id: 'tutor', label: 'Industry AI Tutor', icon: Bot, path: '/advanced/industry/tutor' },
    { id: 'interview', label: 'Industry Interview', icon: Briefcase, path: '/advanced/industry/interview' },
    { id: 'careers', label: 'Careers', icon: Users, path: '/advanced/industry/careers' },
    { id: 'documents', label: 'Industrial Documents', icon: FileText, path: '/advanced/industry/documents' },
    { id: 'my-industry', label: 'My Industry', icon: Star, path: '/advanced/industry/my-industry' },
  ];

  // Helper collections for global views and multi-dimensional search
  const allProcesses = CORE_INDUSTRIES.flatMap(ind => ind.processes.map(p => ({ ...p, industryName: ind.name, industryId: ind.id })));
  const allTroubleshooting = allProcesses.flatMap(p => p.troubleshooting.map(t => ({ ...t, processName: p.name, industryName: p.industryName, industryId: p.industryId })));
  const allChallenges = CORE_INDUSTRIES.flatMap(ind => (ind.challenges || []).map(c => ({ ...c, industryName: ind.name, industryId: ind.id })));
  const allEnvironment = allProcesses.map(p => ({
    processName: p.name,
    industryName: p.industryName,
    industryId: p.industryId,
    emissions: p.environmentalImpact?.emissions || [],
    waste: p.environmentalImpact?.waste || [],
    controlTech: p.environmentalImpact?.controlTech || []
  })).filter(e => e.emissions.length > 0 || e.waste.length > 0 || e.controlTech.length > 0);

  // Multi-dimensional search results
  const searchResults = {
    industries: CORE_INDUSTRIES.filter(ind => 
      ind.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ind.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    equipment: CENTRAL_EQUIPMENT_DATABASE.filter(eq => 
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      eq.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    processes: allProcesses.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.workingPrinciple.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    troubleshooting: allTroubleshooting.filter(t => 
      t.symptom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.possibleCauses.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-64px)] animate-in fade-in duration-500">
      
      {/* Sidebar Navigation */}
      <div className="hidden lg:flex w-60 bg-surface-50 dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800 flex-col h-full overflow-y-auto hide-scrollbar shrink-0">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800">
          <h2 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Factory className="w-4 h-4 text-primary-500"/> INDUSTRY
          </h2>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/advanced/industry'}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold' 
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900 hover:text-surface-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Horizontal Navigation Strip */}
      <div className="lg:hidden touch-scroll-x flex gap-1.5 overflow-x-auto p-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 no-scrollbar">
        {navItems.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/advanced/industry'}
            className={({ isActive }) => 
              `whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                isActive 
                  ? 'bg-primary-600 text-surface-50 shadow-xs' 
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
              }`
            }
          >
            <item.icon className="w-3 h-3" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 relative bg-surface-50/30 dark:bg-surface-900/30">
        <Routes>
          {/* RULE 1: INDUSTRY MAIN PAGE */}
          <Route path="/" element={
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                  <Factory className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-surface-900 dark:text-white tracking-tight">Industrial Chemical Engineering</h1>
                  <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Real industrial processes, equipment, parameters, control systems, and troubleshooting.
                  </p>
                </div>
              </div>

              {/* Global Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-surface-400" />
                <input 
                  type="text" 
                  placeholder="Search industries, plants, processes, equipment, problems..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-800 rounded-2xl text-lg shadow-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-surface-900 dark:text-white"
                />
              </div>

              {/* Multi-Dimensional Categorized Search Results */}
              {searchTerm && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {/* Matching Industries */}
                  {searchResults.industries.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-3 flex items-center gap-2">
                        <Factory className="w-4 h-4 text-primary-500" /> Matching Industries ({searchResults.industries.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.industries.map(ind => (
                          <div 
                            key={ind.id} 
                            onClick={() => navigate(`/advanced/industry/${ind.id}`)}
                            className="bg-white dark:bg-surface-900 p-5 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 cursor-pointer transition-all shadow-sm group"
                          >
                            <h4 className="font-bold text-base text-surface-900 dark:text-white group-hover:text-primary-600 mb-1">{ind.name}</h4>
                            <p className="text-xs text-surface-500 line-clamp-2">{ind.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Central Equipment */}
                  {searchResults.equipment.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-3 flex items-center gap-2">
                        <Box className="w-4 h-4 text-accent-500" /> Matching Equipment ({searchResults.equipment.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.equipment.map(eq => (
                          <div 
                            key={eq.id} 
                            onClick={() => setSelectedEquipment(eq)}
                            className="bg-white dark:bg-surface-900 p-5 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-accent-500 cursor-pointer transition-all shadow-sm group"
                          >
                            <span className="text-[10px] font-bold uppercase text-accent-600 bg-accent-50 dark:bg-accent-950 px-2 py-0.5 rounded">{eq.category}</span>
                            <h4 className="font-bold text-base text-surface-900 dark:text-white group-hover:text-accent-600 mt-2 mb-1">{eq.name}</h4>
                            <p className="text-xs text-surface-500 line-clamp-2">{eq.purpose}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Processes */}
                  {searchResults.processes.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" /> Matching Processes ({searchResults.processes.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.processes.map(p => (
                          <div 
                            key={`${p.industryId}-${p.id}`}
                            onClick={() => navigate(`/advanced/industry/${p.industryId}/processes#${p.id}`)}
                            className="bg-white dark:bg-surface-900 p-5 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-emerald-500 cursor-pointer transition-all shadow-sm group"
                          >
                            <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">{p.industryName}</span>
                            <h4 className="font-bold text-base text-surface-900 dark:text-white group-hover:text-emerald-600 mt-2 mb-1">{p.name}</h4>
                            <p className="text-xs text-surface-500 line-clamp-2">{p.workingPrinciple}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Troubleshooting Cases */}
                  {searchResults.troubleshooting.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-orange-500" /> Troubleshooting Problems ({searchResults.troubleshooting.length})
                      </h3>
                      <div className="space-y-2">
                        {searchResults.troubleshooting.map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => navigate(`/advanced/industry/${t.industryId}/troubleshooting`)}
                            className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-orange-500 cursor-pointer transition-all flex justify-between items-center"
                          >
                            <div>
                              <span className="text-[10px] font-bold text-primary-600 uppercase mr-2">{t.industryName} &bull; {t.processName}</span>
                              <span className="font-bold text-sm text-surface-900 dark:text-white block mt-0.5">{t.symptom}</span>
                            </div>
                            <span className="text-xs text-orange-600 font-semibold">Inspect RCA &rarr;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty Search State */}
                  {searchResults.industries.length === 0 &&
                   searchResults.equipment.length === 0 &&
                   searchResults.processes.length === 0 &&
                   searchResults.troubleshooting.length === 0 && (
                    <div className="bg-white dark:bg-surface-900 p-10 rounded-3xl border border-surface-200 dark:border-surface-800 text-center">
                      <Search className="w-8 h-8 text-surface-300 mx-auto mb-3" />
                      <h4 className="font-bold text-base text-surface-900 dark:text-white mb-1">No matching industrial records found</h4>
                      <p className="text-xs text-surface-500 mb-4">Try searching for keywords like "ammonia", "kiln", "pump", "distillation", or "cavitation".</p>
                      <button onClick={() => setSearchTerm('')} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors">
                        Clear Search
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Default landing message when no search */}
              {!searchTerm && (
                <div className="bg-white dark:bg-surface-900 p-8 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Explore All {CORE_INDUSTRIES.length} Industrial Sectors</h2>
                    <button onClick={() => navigate('/advanced/industry/explore')} className="text-xs font-bold text-primary-600 hover:underline">
                      Detailed Cards View &rarr;
                    </button>
                  </div>
                  <p className="text-sm text-surface-500 mb-6">Select a sector to explore real continuous and batch flowsheets, operating envelopes, and engineering roles.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CORE_INDUSTRIES.map(ind => (
                      <button 
                        key={ind.id} 
                        onClick={() => navigate(`/advanced/industry/${ind.id}`)}
                        className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 hover:border-primary-500 text-left transition-all group"
                      >
                        <span className="font-bold text-sm text-surface-900 dark:text-white group-hover:text-primary-600 block mb-1 break-words">{ind.name}</span>
                        <span className="text-[10px] text-surface-400 block">{ind.processes.length} Processes</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          } />

          {/* RULE 2: EXPLORE INDUSTRIES CARDS */}
          <Route path="explore" element={
            <div className="max-w-6xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2">Explore Industries</h1>
                <p className="text-surface-500 dark:text-surface-400 text-sm">
                  Comprehensive chemical engineering profiles for all major industrial production sectors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CORE_INDUSTRIES.map(industry => {
                  const Icon = iconMap[industry.icon] || Factory;
                  return (
                    <div 
                      key={industry.id} 
                      onClick={() => navigate(`/advanced/industry/${industry.id}`)} 
                      className="bg-white dark:bg-surface-900 rounded-3xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors shrink-0">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold group-hover:text-primary-600 text-surface-900 dark:text-white leading-tight">{industry.name}</h3>
                            <span className="text-[10px] uppercase font-bold text-surface-400">Sector ID: {industry.id}</span>
                          </div>
                        </div>

                        <p className="text-xs text-surface-600 dark:text-surface-400 line-clamp-3 mb-4 leading-relaxed">
                          {industry.description}
                        </p>

                        {/* Major Products */}
                        <div className="mb-3">
                          <span className="text-[10px] font-bold uppercase text-surface-400 tracking-wider block mb-1">Major Products:</span>
                          <div className="flex flex-wrap gap-1">
                            {industry.products.slice(0, 3).map(p => (
                              <span key={p.name} className="text-[10px] font-semibold bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-surface-700 dark:text-surface-300">
                                {p.name.split(' ')[0]}
                              </span>
                            ))}
                            {industry.products.length === 0 && <span className="text-[10px] text-surface-400 italic">Commercial bulk goods</span>}
                          </div>
                        </div>

                        {/* Major Processes */}
                        <div className="mb-3">
                          <span className="text-[10px] font-bold uppercase text-surface-400 tracking-wider block mb-1">Major Processes:</span>
                          <div className="flex flex-wrap gap-1">
                            {industry.processes.slice(0, 3).map(p => (
                              <span key={p.id} className="text-[10px] font-semibold bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded text-primary-700 dark:text-primary-300">
                                {p.name.split(' ')[0]}
                              </span>
                            ))}
                            {industry.processes.length === 0 && <span className="text-[10px] text-surface-400 italic">Continuous flowsheets</span>}
                          </div>
                        </div>

                        {/* Relevant Subjects */}
                        <div className="mb-6">
                          <span className="text-[10px] font-bold uppercase text-surface-400 tracking-wider block mb-1">Relevant Subjects:</span>
                          <div className="flex flex-wrap gap-1">
                            {industry.relatedSubjects.slice(0, 3).map(s => (
                              <span key={s.subjectId} className="text-[10px] font-bold uppercase bg-accent-50 dark:bg-accent-950/40 px-2 py-0.5 rounded text-accent-700 dark:text-accent-300">
                                {s.subjectId.split('-')[0]}
                              </span>
                            ))}
                            {industry.relatedSubjects.length === 0 && <span className="text-[10px] text-surface-400 italic">Thermodynamics, Heat Transfer</span>}
                          </div>
                        </div>
                      </div>

                      {/* Explore Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/advanced/industry/${industry.id}`);
                        }}
                        className="w-full py-3 bg-surface-100 dark:bg-surface-800 group-hover:bg-primary-600 group-hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-surface-200 dark:border-surface-700 group-hover:border-primary-500 text-surface-700 dark:text-surface-300"
                      >
                        Explore Industry &rarr;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          } />

          {/* RULES 7, 8, 9, 10, 11, 30: CENTRAL EQUIPMENT DATABASE */}
          <Route path="equipment" element={
            <div className="max-w-6xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3">
                  <Box className="text-primary-500"/> Central Industry Equipment Database
                </h1>
                <p className="text-surface-500 text-sm">
                  Shared equipment registry connecting Industrial Operations, ChemBase Calculators, and Lab Assistant Experiments.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CENTRAL_EQUIPMENT_DATABASE.map(eq => (
                  <div 
                    key={eq.id}
                    onClick={() => setSelectedEquipment(eq)}
                    className="bg-white dark:bg-surface-900 p-6 rounded-3xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 transition-all cursor-pointer shadow-sm group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-800">{eq.id}</span>
                        <span className="text-[10px] uppercase font-bold text-surface-400">{eq.category}</span>
                      </div>
                      <h3 className="font-bold text-lg text-surface-900 dark:text-white group-hover:text-primary-600 mb-2">{eq.name}</h3>
                      <p className="text-xs text-surface-500 leading-relaxed mb-4 line-clamp-3">{eq.purpose}</p>

                      <div className="space-y-1.5 text-[11px] mb-4">
                        <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                          <ExternalLink className="w-3.5 h-3.5 text-primary-500" />
                          <span><strong>Lab:</strong> {eq.relatedLabs[0]?.name || 'Lab simulation available'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                          <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                          <span><strong>Calc:</strong> {eq.relatedCalculators[0]?.name || 'Sizing engine linked'}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEquipment(eq);
                      }}
                      className="w-full py-2 bg-surface-100 dark:bg-surface-800 group-hover:bg-primary-50 text-primary-600 dark:text-primary-400 rounded-xl font-bold text-xs text-center border border-surface-200 dark:border-surface-700 transition-colors"
                    >
                      View Complete Specification &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL PROCESS EXPLORER */}
          <Route path="process-explorer" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><GitBranch className="text-primary-500"/> Global Process Explorer</h1>
                <p className="text-surface-500 text-sm">Select an industry to open its interactive flowsheet.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CORE_INDUSTRIES.map(ind => (
                  <button 
                    key={ind.id} 
                    onClick={() => navigate(`/advanced/industry/${ind.id}/process-flow`)} 
                    className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl hover:border-primary-500 text-left group transition-all shadow-sm"
                  >
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary-600 text-surface-900 dark:text-white">{ind.name}</h3>
                    <p className="text-xs text-surface-500">{ind.processes.length} defined unit operations &rarr;</p>
                  </button>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL OPERATING PARAMETERS */}
          <Route path="parameters" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><ThermometerSun className="text-orange-500"/> Global Operating Parameters</h1>
                <p className="text-surface-500 text-sm">Cross-industry matrix of normal operating conditions.</p>
              </div>
              <div className="space-y-4">
                {allProcesses.filter(p => Object.keys(p.typicalConditions).length > 0).map(proc => (
                  <div key={proc.id} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-surface-50 dark:bg-surface-950 p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center">
                      <h3 className="font-bold text-surface-900 dark:text-white text-base">{proc.name}</h3>
                      <button 
                        onClick={() => navigate(`/advanced/industry/${proc.industryId}/parameters`)}
                        className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-3 py-1 rounded-full border border-primary-100 hover:bg-primary-100"
                      >
                        {proc.industryName} &rarr;
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(proc.typicalConditions).map(([k, v]) => (
                        <div key={k} className="bg-surface-50 dark:bg-surface-950 p-3 rounded-xl border border-surface-100 dark:border-surface-800">
                          <span className="block text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">{k}</span>
                          <span className="font-mono font-bold text-sm text-surface-900 dark:text-white">{v as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL CONTROL */}
          <Route path="control" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Sliders className="text-blue-500"/> Process Control Library</h1>
                <p className="text-surface-500 text-sm">Standard industrial feedback and cascade PID control loops.</p>
              </div>
              <div className="space-y-4">
                {allProcesses.filter(p => p.control && p.control.length > 0).flatMap(p => p.control.map(c => ({...c, procName: p.name, indName: p.industryName, indId: p.industryId}))).map((ctrl, i) => (
                  <div key={i} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-base text-surface-900 dark:text-white">{ctrl.procName} Control</h3>
                        <p className="text-xs text-surface-500">{ctrl.indName}</p>
                      </div>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full uppercase font-bold">{ctrl.controller}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                      <div className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border">
                        <span className="text-surface-400 font-bold block mb-1">Sensor (PV)</span>
                        <span className="font-bold text-surface-800 dark:text-surface-200">{ctrl.sensor}</span>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 font-bold text-blue-800 dark:text-blue-300">
                        {ctrl.controlledVariable}
                      </div>
                      <div className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border">
                        <span className="text-surface-400 font-bold block mb-1">Final Element (MV)</span>
                        <span className="font-bold text-surface-800 dark:text-surface-200">{ctrl.valve}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL MASS & ENERGY */}
          <Route path="mass-energy" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Calculator className="text-indigo-500"/> Global Mass & Energy Balances</h1>
                <p className="text-surface-500 text-sm">Select an industry to run stoichiometric calculations and live heat duty models.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CORE_INDUSTRIES.map(ind => (
                  <button key={ind.id} onClick={() => navigate(`/advanced/industry/${ind.id}/mass-energy`)} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl hover:border-indigo-500 text-left group transition-all shadow-sm">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-600 text-surface-900 dark:text-white">{ind.name}</h3>
                    <p className="text-xs text-surface-500">Access stoichiometry & heat balances &rarr;</p>
                  </button>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL SAFETY */}
          <Route path="safety" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><ShieldAlert className="text-red-500"/> Global Safety & Hazards Registry</h1>
                <p className="text-surface-500 text-sm">Comprehensive chemical, thermal, and mechanical hazard classifications.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {allProcesses.flatMap(p => p.hazards.map(h => ({ ...h, procName: p.name, indName: p.industryName }))).map((hazard, i) => (
                  <div key={i} className="p-5 bg-white dark:bg-surface-900 border-l-4 border-red-500 border-y border-r border-surface-200 dark:border-surface-800 rounded-r-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{hazard.type} &bull; {hazard.indName}</span>
                    <h4 className="font-bold text-base text-surface-900 dark:text-white mt-1 mb-2">{hazard.procName}</h4>
                    <p className="text-xs text-surface-600 dark:text-surface-400 mb-3">{hazard.description}</p>
                    <div className="text-xs bg-surface-50 dark:bg-surface-950 p-2.5 rounded-lg border border-surface-100">
                      <strong>Precautions:</strong> {hazard.precautions}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL ENVIRONMENT */}
          <Route path="environment" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Leaf className="text-green-500"/> Global Environmental Abatement</h1>
                <p className="text-surface-500 text-sm">Industrial stack emissions, effluent treatment, and carbon abatement technologies.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allEnvironment.map((env, i) => (
                  <div key={i} className="p-5 bg-white dark:bg-surface-900 border-l-4 border-green-500 border-y border-r border-surface-200 dark:border-surface-800 rounded-r-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-green-600 uppercase">{env.industryName}</span>
                    <h4 className="font-bold text-base text-surface-900 dark:text-white mt-1 mb-2">{env.processName}</h4>
                    <div className="text-xs space-y-2">
                      <div className="p-2 bg-surface-50 dark:bg-surface-950 rounded">
                        <strong>Emissions:</strong> {env.emissions.join(', ')}
                      </div>
                      <div className="p-2 bg-green-50/50 dark:bg-green-950/30 text-green-800 dark:text-green-300 rounded border border-green-100">
                        <strong>Control Tech:</strong> {env.controlTech.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL TROUBLESHOOTING */}
          <Route path="troubleshooting" element={(() => {
            const filteredTs = allTroubleshooting.filter(tcase => {
              const matchesInd = tsIndustryFilter === 'all' || tcase.industryId === tsIndustryFilter;
              const q = tsSearch.trim().toLowerCase();
              const matchesQ = !q ||
                tcase.symptom.toLowerCase().includes(q) ||
                tcase.processName.toLowerCase().includes(q) ||
                tcase.industryName.toLowerCase().includes(q) ||
                tcase.possibleCauses.some(c => c.toLowerCase().includes(q)) ||
                tcase.possibleSolutions.some(s => s.toLowerCase().includes(q));
              return matchesInd && matchesQ;
            });
            return (
              <div className="max-w-6xl mx-auto space-y-6">
                <div>
                  <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Settings className="text-surface-700 dark:text-surface-300"/> Global Troubleshooter</h1>
                  <p className="text-surface-500 text-sm">Searchable diagnostic root cause catalog across all continuous processing islands.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      value={tsSearch}
                      onChange={e => setTsSearch(e.target.value)}
                      placeholder="Filter by symptom, cause, solution, or unit operation..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <select
                    value={tsIndustryFilter}
                    onChange={e => setTsIndustryFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-sm font-semibold focus:outline-none focus:border-primary-500"
                  >
                    <option value="all">All Sectors ({allTroubleshooting.length})</option>
                    {CORE_INDUSTRIES.filter(ind => ind.processes.some(p => p.troubleshooting.length > 0)).map(ind => (
                      <option key={ind.id} value={ind.id}>{ind.name}</option>
                    ))}
                  </select>
                </div>
                {filteredTs.length === 0 ? (
                  <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-10 text-center text-sm text-surface-500">
                    No troubleshooting cases match your filter.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTs.map(tcase => (
                      <div key={tcase.id} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold uppercase text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">{tcase.industryName} &bull; {tcase.processName}</span>
                          <button onClick={() => navigate(`/advanced/industry/${tcase.industryId}/troubleshooting`)} className="text-xs font-bold text-primary-600 hover:underline">Open in Sector &rarr;</button>
                        </div>
                        <h4 className="text-base font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" /> {tcase.symptom}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl">
                            <strong className="block mb-1 text-surface-700 dark:text-surface-300">Probable Causes:</strong>
                            <ul className="list-disc pl-4 space-y-1 text-surface-600 dark:text-surface-400">
                              {tcase.possibleCauses.slice(0, 3).map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 rounded-xl border border-emerald-100">
                            <strong className="block mb-1">Recommended Solution:</strong>
                            <p>{tcase.possibleSolutions[0] || 'Follow standard root cause troubleshooting protocol.'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()} />

          {/* GLOBAL CHALLENGES */}
          <Route path="challenges" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><BrainCircuit className="text-purple-500"/> Engineering Challenges</h1>
                <p className="text-surface-500 text-sm">Real-world scenario decision cases spanning continuous and batch plants. Pick an option to evaluate your engineering judgment.</p>
              </div>
              <div className="space-y-4">
                {allChallenges.map((challenge, i) => {
                  const key = `${challenge.industryId}_${challenge.id || i}`;
                  const picked = globalChallengeChoices[key];
                  return (
                    <div key={key} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">{challenge.industryName}</span>
                        <button
                          onClick={() => navigate(`/advanced/industry/${challenge.industryId}/challenges`)}
                          className="text-xs font-bold text-purple-600 hover:underline"
                        >
                          Solve in Sector &rarr;
                        </button>
                      </div>
                      <h3 className="font-bold text-base text-surface-900 dark:text-white">{challenge.scenario}</h3>
                      {challenge.options && challenge.options.length > 0 && (
                        <div className="space-y-2">
                          {challenge.options.map((opt, optIdx) => {
                            const isSelected = picked === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => setGlobalChallengeChoices(prev => ({ ...prev, [key]: optIdx }))}
                                className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${
                                  isSelected
                                    ? opt.score > 50
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold'
                                    : 'bg-surface-50 dark:bg-surface-950 border-surface-200 dark:border-surface-800 hover:border-purple-400 text-surface-700 dark:text-surface-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0">{optIdx + 1}</span>
                                  <span>{opt.text}</span>
                                </div>
                                {isSelected && (
                                  <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                                    <strong>Score: {opt.score}/100</strong> &bull; {opt.feedback}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {picked !== undefined && (
                        <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200 rounded-xl text-xs border border-purple-100">
                          <strong>Standard Engineering Approach:</strong> {challenge.correctApproach}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          } />

          {/* GLOBAL INTERNSHIP */}
          <Route path="internship" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><GraduationCap className="text-amber-500"/> Global Virtual Internship Hub</h1>
                <p className="text-surface-500 text-sm">Select any of the {CORE_INDUSTRIES.length} industrial training paths to begin your 7-day graduate trainee simulation.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CORE_INDUSTRIES.map(ind => (
                  <div key={ind.id} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-1">{ind.name} Trainee</h3>
                      <p className="text-xs text-surface-500 mb-6">7-day curriculum: layout, flowsheets, equipment, control, and capstone heat balance.</p>
                    </div>
                    <button onClick={() => navigate(`/advanced/industry/${ind.id}/internship`)} className="w-full py-2.5 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-xs border border-amber-200 transition-colors">
                      Begin Internship &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL TUTOR */}
          <Route path="tutor" element={<IndustryTutorPanel />} />

          {/* GLOBAL INTERVIEW */}
          <Route path="interview" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Briefcase className="text-teal-500"/> Global Technical Interview Simulator</h1>
                <p className="text-surface-500 text-sm">Select any industry to practice plant technical, troubleshooting, and safety interview questions.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CORE_INDUSTRIES.map(ind => (
                  <div key={ind.id} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm text-center">
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4">{ind.name}</h3>
                    <button onClick={() => navigate(`/advanced/industry/${ind.id}/interview`)} className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm">
                      Start Interview &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL CAREERS */}
          <Route path="careers" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Users className="text-pink-500"/> Chemical Engineering Careers in Industry</h1>
                <p className="text-surface-500 text-sm">Where chemical engineers work across the process industries.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Process Optimization Engineer", desc: "Focuses on minimizing energy consumption, mass balance reconciliation, and debottlenecking reactors and columns.", skills: "Aspen Plus / HYSYS, Thermodynamics, Heat Integration (Pinch Analysis)" },
                  { title: "Process Control & Automation Engineer", desc: "Designs and tunes feedback/feedforward PID loops, Advanced Process Control (APC), and emergency trip interlocks.", skills: "DCS Architecture, PID Tuning, Frequency Response, Anti-Surge Control" },
                  { title: "HSE & Process Safety Manager", desc: "Leads HAZOP and LOPA hazard reviews, monitors CEMS stack emissions, and enforces plant LOTO isolation protocols.", skills: "Risk Assessment, Dispersion Modeling, Fire & Blast Mitigation" },
                  { title: "Plant Production Shift Superintendent", desc: "Directs round-the-clock shift operators, coordinates raw material logistics, and responds to immediate plant upsets.", skills: "Root Cause Troubleshooting, Crisis Leadership, Operational Decision-Making" }
                ].map((role, idx) => (
                  <div key={idx} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-lg text-primary-600 mb-2">{role.title}</h3>
                    <p className="text-xs text-surface-600 dark:text-surface-400 mb-4 leading-relaxed">{role.desc}</p>
                    <div className="text-[11px] p-2.5 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
                      <strong>Essential Competencies:</strong> {role.skills}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL DOCUMENTS */}
          <Route path="documents" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><FileText className="text-surface-700 dark:text-surface-300"/> Industrial Document Reading Room</h1>
                <p className="text-surface-500 text-sm">Learn to read and interpret PFDs, P&amp;IDs, equipment datasheets, and stream tables.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">How to Read a PFD</h3>
                    <p className="text-xs text-surface-500 mb-4">Learn to trace primary mass flows, identify unit operations, and interpret stream enthalpy balances.</p>
                  </div>
                  <button onClick={() => navigate('/advanced/pfd-pid')} className="w-full py-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-primary-50 text-primary-600 font-bold rounded-xl text-xs transition-colors">
                    Launch PFD Tutorial &rarr;
                  </button>
                </div>
                <div className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">P&amp;ID ISA-5.1 Decoder</h3>
                    <p className="text-xs text-surface-500 mb-4">Understand instrumentation tag numbers (e.g. TE-101, PT-202), valve fail positions (FC/FO), and line styles.</p>
                  </div>
                  <button onClick={() => navigate('/advanced/pfd-pid')} className="w-full py-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-primary-50 text-primary-600 font-bold rounded-xl text-xs transition-colors">
                    Open Symbol Guide &rarr;
                  </button>
                </div>
                <div className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">Equipment Datasheets</h3>
                    <p className="text-xs text-surface-500 mb-4">Read real pump curves, vessel mechanical design pressures, metallurgy classes, and nozzle schedules.</p>
                  </div>
                  <button onClick={() => navigate('/advanced/industry/equipment')} className="w-full py-2.5 bg-surface-100 dark:bg-surface-800 hover:bg-primary-50 text-primary-600 font-bold rounded-xl text-xs transition-colors">
                    Browse Datasheets &rarr;
                  </button>
                </div>
              </div>
            </div>
          } />

          {/* GLOBAL MY INDUSTRY */}
          <Route path="my-industry" element={(() => {
            let visitedIds: string[] = [];
            try {
              visitedIds = JSON.parse(localStorage.getItem('chembase_visited_industries') || '[]');
            } catch {
              visitedIds = [];
            }
            const bookmarkedProcesses: { industryId: string; industryName: string; procId: string; procName: string }[] = [];
            let sectorsWithNotes = 0;
            let totalInternshipDays = 0;

            CORE_INDUSTRIES.forEach(ind => {
              const note = localStorage.getItem(`notes_${ind.id}`);
              if (note && note.trim().length > 0) sectorsWithNotes++;
              try {
                const savedIds: string[] = JSON.parse(localStorage.getItem(`saved_proc_${ind.id}`) || '[]');
                savedIds.forEach(pid => {
                  const found = ind.processes.find(p => p.id === pid);
                  if (found) {
                    bookmarkedProcesses.push({ industryId: ind.id, industryName: ind.name, procId: pid, procName: found.name });
                  }
                });
              } catch { /* ignore */ }
              try {
                const days: number[] = JSON.parse(localStorage.getItem(`internship_days_${ind.id}`) || '[]');
                totalInternshipDays += days.length;
              } catch { /* ignore */ }
            });

            const exploredCount = visitedIds.filter(id => CORE_INDUSTRIES.some(ind => ind.id === id)).length;
            const exploredPct = Math.round((exploredCount / Math.max(1, CORE_INDUSTRIES.length)) * 100);
            const bookmarkPct = Math.round((bookmarkedProcesses.length / Math.max(1, allProcesses.length)) * 100);

            return (
              <div className="max-w-6xl mx-auto space-y-6">
                <div>
                  <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Star className="text-yellow-500"/> My Industry & Learning Progress</h1>
                  <p className="text-surface-500 text-sm">Live tracking of sectors explored, saved process bookmarks, notes, and internship milestones.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                    <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-4">Overall Platform Progress</h3>
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between mb-1 text-surface-600">
                          <span>Industries Explored:</span>
                          <span className="font-bold text-primary-600">{exploredCount} / {CORE_INDUSTRIES.length} Sectors ({exploredPct}%)</span>
                        </div>
                        <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2.5">
                          <div className="bg-primary-600 h-2.5 rounded-full transition-all" style={{ width: `${exploredPct}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-surface-600">
                          <span>Bookmarked Unit Operations:</span>
                          <span className="font-bold text-indigo-600">{bookmarkedProcesses.length} / {allProcesses.length} Processes</span>
                        </div>
                        <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2.5">
                          <div className="bg-indigo-600 h-2.5 rounded-full transition-all" style={{ width: `${bookmarkPct}%` }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800">
                          <span className="text-[10px] font-bold uppercase text-surface-400 block">Sectors With Notes</span>
                          <span className="text-lg font-black text-surface-900 dark:text-white">{sectorsWithNotes}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800">
                          <span className="text-[10px] font-bold uppercase text-surface-400 block">Internship Days Done</span>
                          <span className="text-lg font-black text-amber-600">{totalInternshipDays}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-2">Saved Process Bookmarks</h3>
                      <p className="text-xs text-surface-500 mb-4">Processes you have bookmarked across industrial sectors.</p>
                      {bookmarkedProcesses.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {bookmarkedProcesses.map(bp => (
                            <button
                              key={`${bp.industryId}-${bp.procId}`}
                              onClick={() => navigate(`/advanced/industry/${bp.industryId}/processes#${bp.procId}`)}
                              className="w-full p-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 hover:border-primary-500 text-left flex justify-between items-center transition-colors"
                            >
                              <div>
                                <span className="text-[10px] font-bold uppercase text-primary-600 block">{bp.industryName}</span>
                                <span className="text-xs font-bold text-surface-900 dark:text-white">{bp.procName}</span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-surface-400 italic mb-4">No bookmarked processes yet. Open any sector's Processes tab and click "Bookmark" to pin unit operations here.</p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                      <span className="text-[10px] font-bold uppercase text-surface-400 block mb-2">Quick Jump Sectors</span>
                      <div className="flex flex-wrap gap-2">
                        {['cement', 'fertilizer', 'oil-gas', 'chemical-mfg', 'pharmaceutical'].map(id => (
                          <button 
                            key={id} 
                            onClick={() => navigate(`/advanced/industry/${id}`)}
                            className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-primary-50 text-surface-700 dark:text-surface-300 font-bold text-xs uppercase transition-colors"
                          >
                            {id.replace(/-/g, ' ')} &rarr;
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()} />
          
          {/* Detailed specific Industry routing */}
          <Route path=":industryId/*" element={<IndustryDashboard />} />
        </Routes>
      </div>

      {/* RULE 8: DETAILED EQUIPMENT MODAL / DRAWER */}
      {selectedEquipment && (
        <div
          onClick={() => setSelectedEquipment(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-surface-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl overflow-y-auto p-8 relative"
          >
            <button 
              onClick={() => setSelectedEquipment(null)}
              className="absolute right-6 top-6 p-2 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-md border border-primary-200 dark:border-primary-800">{selectedEquipment.id}</span>
              <span className="text-xs font-bold uppercase text-surface-400">{selectedEquipment.category}</span>
            </div>

            <h2 className="text-3xl font-black text-surface-900 dark:text-white mb-4">{selectedEquipment.name}</h2>
            <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-6 bg-surface-50 dark:bg-surface-950 p-4 rounded-2xl border border-surface-200 dark:border-surface-800">
              <strong>Purpose:</strong> {selectedEquipment.purpose}
            </p>

            <div className="space-y-6 text-sm">
              {/* Working Principle */}
              <div>
                <h4 className="font-bold text-surface-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-500" /> Working Principle
                </h4>
                <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">{selectedEquipment.workingPrinciple}</p>
              </div>

              {/* Main Components */}
              <div>
                <h4 className="font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent-500" /> Main Mechanical Components
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEquipment.mainComponents.map((comp, idx) => (
                    <span key={idx} className="text-xs bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-lg text-surface-700 dark:text-surface-300 font-medium">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Operating Parameters */}
              <div>
                <h4 className="font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <ThermometerSun className="w-4 h-4 text-orange-500" /> Operating Parameters
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEquipment.operatingParameters.map((p, idx) => (
                    <div key={idx} className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-surface-900 dark:text-white">{p.name}</span>
                        <span className="font-mono font-bold text-primary-600">{p.normalRange} {p.unit}</span>
                      </div>
                      <span className="text-surface-500 text-[11px]">{p.importance}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory Connections: Labs, Calculators, Subjects (Rules 9, 10, 11) */}
              <div className="p-6 bg-primary-50/50 dark:bg-primary-950/20 rounded-2xl border border-primary-200 dark:border-primary-800">
                <h4 className="font-bold text-primary-900 dark:text-primary-200 mb-3 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" /> ChemBase Connected Ecosystem (Rules 9, 10, 11)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={() => {
                      setSelectedEquipment(null);
                      navigate(selectedEquipment.relatedLabs[0]?.path || '/advanced/lab-assistant');
                    }}
                    className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-primary-200 dark:border-primary-800 text-left hover:border-primary-500 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-primary-600 block mb-1">Lab Assistant</span>
                    <span className="font-bold text-xs text-surface-900 dark:text-white block">{selectedEquipment.relatedLabs[0]?.name || 'Perform Experiment'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedEquipment(null);
                      navigate(selectedEquipment.relatedCalculators[0]?.path || '/advanced/calculators');
                    }}
                    className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-primary-200 dark:border-primary-800 text-left hover:border-primary-500 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">Calculator</span>
                    <span className="font-bold text-xs text-surface-900 dark:text-white block">{selectedEquipment.relatedCalculators[0]?.name || 'Sizing Engine'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedEquipment(null);
                      navigate(selectedEquipment.relatedSubjects[0]?.path || '/advanced');
                    }}
                    className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-primary-200 dark:border-primary-800 text-left hover:border-primary-500 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-accent-600 block mb-1">Subject Theory</span>
                    <span className="font-bold text-xs text-surface-900 dark:text-white block">{selectedEquipment.relatedSubjects[0]?.name || 'Theory & Equations'}</span>
                  </button>
                </div>
              </div>

              {/* Viva Questions */}
              {selectedEquipment.vivaQuestions.length > 0 && (
                <div>
                  <h4 className="font-bold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" /> Viva Voce Oral Exam Questions
                  </h4>
                  <div className="space-y-2">
                    {selectedEquipment.vivaQuestions.map((v, idx) => (
                      <div key={idx} className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800 text-xs">
                        <strong className="text-surface-900 dark:text-white block mb-1">Q: {v.q}</strong>
                        <span className="text-surface-600 dark:text-surface-400"><strong>A:</strong> {v.a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
