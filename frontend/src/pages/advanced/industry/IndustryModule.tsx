import { useState } from 'react';
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

const iconMap: Record<string, any> = {
  Factory, Wheat, Fuel, Pill, Droplets, Zap, Activity, Box, FileText
};

export default function IndustryModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const navigate = useNavigate();

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

  // Multi-dimensional search results (Rule 27)
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
    <div className="flex h-[calc(100vh-64px)] animate-in fade-in duration-500">
      
      {/* Sidebar Navigation (Rule 40) */}
      <div className="w-64 bg-surface-50 dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800 flex flex-col h-full overflow-y-auto hide-scrollbar shrink-0">
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 relative bg-surface-50/30 dark:bg-surface-900/30">
        <Routes>
          {/* RULE 1: INDUSTRY MAIN PAGE */}
          <Route path="/" element={
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                  <Factory className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">Industrial Chemical Engineering</h1>
                  <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Explore real industrial processes, equipment, operating parameters, control systems, safety, troubleshooting, and Chemical Engineering applications.
                  </p>
                </div>
              </div>

              {/* Global Search Bar (Rule 27) */}
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

              {/* Multi-Dimensional Categorized Search Results (Rule 27) */}
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
                </div>
              )}

              {/* Default landing message when no search */}
              {!searchTerm && (
                <div className="bg-white dark:bg-surface-900 p-8 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm">
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Explore Industrial Sectors</h2>
                  <p className="text-sm text-surface-500 mb-6">Select a sector to explore real continuous and batch flowsheets, operating envelopes, and engineering roles.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {CORE_INDUSTRIES.slice(0, 5).map(ind => (
                      <button 
                        key={ind.id} 
                        onClick={() => navigate(`/advanced/industry/${ind.id}`)}
                        className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 hover:border-primary-500 text-left transition-all group"
                      >
                        <span className="font-bold text-sm text-surface-900 dark:text-white group-hover:text-primary-600 block mb-1">{ind.name}</span>
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

                        {/* Major Products (Rule 2) */}
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

                        {/* Major Processes (Rule 2) */}
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

                        {/* Relevant Subjects (Rule 2) */}
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

                      {/* Explore Button (Rule 2) */}
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
                  Shared equipment registry connecting Industrial Operations, ChemBase Calculators, and Lab Assistant Experiments (Rule 30).
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
          <Route path="troubleshooting" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Settings className="text-surface-700 dark:text-surface-300"/> Global Troubleshooter</h1>
                <p className="text-surface-500 text-sm">Searchable diagnostic root cause catalog across all continuous processing islands.</p>
              </div>
              <div className="space-y-4">
                {allTroubleshooting.map(tcase => (
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
            </div>
          } />

          {/* GLOBAL CHALLENGES */}
          <Route path="challenges" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><BrainCircuit className="text-purple-500"/> Engineering Challenges</h1>
                <p className="text-surface-500 text-sm">Real-world scenario decision cases spanning continuous and batch plants.</p>
              </div>
              <div className="space-y-4">
                {allChallenges.map((challenge, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">{challenge.industryName}</span>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mt-2 mb-3">{challenge.scenario}</h3>
                    <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200 rounded-xl text-xs border border-purple-100">
                      <strong>Standard Engineering Approach:</strong> {challenge.correctApproach}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* GLOBAL INTERNSHIP */}
          <Route path="internship" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><GraduationCap className="text-amber-500"/> Global Virtual Internship Hub</h1>
                <p className="text-surface-500 text-sm">Select an industrial training path to begin your 7-day graduate trainee simulation.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CORE_INDUSTRIES.slice(0, 6).map(ind => (
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
          <Route path="tutor" element={
            <div className="max-w-4xl mx-auto h-[680px] flex flex-col space-y-4">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white flex items-center gap-3"><Bot className="text-primary-500"/> Global Industry AI Tutor</h1>
                <p className="text-surface-500 text-sm">Ask cross-sector chemical engineering questions (PFDs, equipment comparisons, thermodynamics).</p>
              </div>
              <div className="flex-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
                <div className="p-6 bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-800 rounded-2xl text-primary-900 dark:text-primary-200">
                  <h3 className="font-bold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary-600"/> Industrial Knowledge Assistant</h3>
                  <p className="text-xs leading-relaxed">I am connected to all 15 industry sectors and the central equipment database. Ask me to compare process control schemes, diagnose equipment failures, or explain why specific catalysts are used.</p>
                </div>
                <div className="relative mt-4">
                  <input type="text" placeholder="Ask a cross-industry chemical engineering question..." className="w-full p-4 rounded-2xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm" />
                  <button className="absolute right-3 top-3 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors"><ArrowRight className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          } />

          {/* GLOBAL INTERVIEW */}
          <Route path="interview" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Briefcase className="text-teal-500"/> Global Technical Interview Simulator</h1>
                <p className="text-surface-500 text-sm">Select an industry to practice plant technical, troubleshooting, and safety interview questions.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CORE_INDUSTRIES.slice(0, 6).map(ind => (
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
                <p className="text-surface-500 text-sm">Where chemical engineers work across the process industries (Rule 21).</p>
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
                <p className="text-surface-500 text-sm">Learn to read and interpret PFDs, P&IDs, equipment datasheets, and stream tables (Rule 26).</p>
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
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">P&ID ISA-5.1 Decoder</h3>
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
          <Route path="my-industry" element={
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-3"><Star className="text-yellow-500"/> My Industry & Learning Progress</h1>
                <p className="text-surface-500 text-sm">Your active study modules, saved bookmarks, and progress tracking (Rules 34 & 35).</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                  <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-4">Overall Platform Progress</h3>
                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between mb-1 text-surface-600">
                        <span>Industries Explored:</span>
                        <span className="font-bold text-primary-600">5 / 15 Sectors</span>
                      </div>
                      <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2.5">
                        <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '33%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-surface-600">
                        <span>Equipment Profiles Studied:</span>
                        <span className="font-bold text-indigo-600">{CENTRAL_EQUIPMENT_DATABASE.length} Profiles</span>
                      </div>
                      <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-2">Saved Engineering Bookmarks</h3>
                    <p className="text-xs text-surface-500 mb-4">Quickly jump into priority industries with complete high-temperature and high-pressure datasets.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['cement', 'fertilizer', 'oil-gas', 'chemical-mfg', 'pharmaceutical'].map(id => (
                      <button 
                        key={id} 
                        onClick={() => navigate(`/advanced/industry/${id}`)}
                        className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-primary-50 text-surface-700 dark:text-surface-300 font-bold text-xs uppercase transition-colors"
                      >
                        {id} &rarr;
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          } />
          
          {/* Detailed specific Industry routing */}
          <Route path=":industryId/*" element={<IndustryDashboard />} />
        </Routes>
      </div>

      {/* RULE 8: DETAILED EQUIPMENT MODAL / DRAWER */}
      {selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl overflow-y-auto p-8 relative">
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
                    <span className="text-[10px] uppercase font-bold text-primary-600 block mb-1">Lab Assistant (Rule 9)</span>
                    <span className="font-bold text-xs text-surface-900 dark:text-white block">{selectedEquipment.relatedLabs[0]?.name || 'Perform Experiment'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedEquipment(null);
                      navigate(selectedEquipment.relatedCalculators[0]?.path || '/advanced/calculators');
                    }}
                    className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-primary-200 dark:border-primary-800 text-left hover:border-primary-500 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">Calculator (Rule 11)</span>
                    <span className="font-bold text-xs text-surface-900 dark:text-white block">{selectedEquipment.relatedCalculators[0]?.name || 'Sizing Engine'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedEquipment(null);
                      navigate(selectedEquipment.relatedSubjects[0]?.path || '/advanced');
                    }}
                    className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-primary-200 dark:border-primary-800 text-left hover:border-primary-500 transition-colors shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-accent-600 block mb-1">Subject Theory (Rule 10)</span>
                    <span className="font-bold text-xs text-surface-900 dark:text-white block">{selectedEquipment.relatedSubjects[0]?.name || 'Theory & Equations'}</span>
                  </button>
                </div>
              </div>

              {/* Viva Questions (Rule 8) */}
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
