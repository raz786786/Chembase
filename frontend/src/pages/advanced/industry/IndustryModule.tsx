import { useState } from 'react';
import { Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import { 
  Factory, Search, Wheat, Fuel, Pill, Droplets, Zap, ChevronRight, Activity, 
  Globe, GitBranch, Box, ThermometerSun, Sliders, Calculator, 
  ShieldAlert, Leaf, Settings, BrainCircuit, GraduationCap, Bot, Briefcase, 
  Users, FileText, Star, AlertTriangle, ArrowRight
} from 'lucide-react';
import { CORE_INDUSTRIES } from './data/coreIndustries';
import IndustryDashboard from './components/IndustryDashboard';

const iconMap: Record<string, any> = {
  Factory, Wheat, Fuel, Pill, Droplets, Zap, Activity, Box, FileText
};

export default function IndustryModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredIndustries = CORE_INDUSTRIES.filter(ind => 
    ind.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ind.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Helper to extract all processes from all industries
  const allProcesses = CORE_INDUSTRIES.flatMap(ind => ind.processes.map(p => ({ ...p, industryName: ind.name, industryId: ind.id })));
  
  // Extract all unique equipment
  const allEquipment = Array.from(new Set(allProcesses.flatMap(p => p.equipmentIds))).map(eqId => {
    const relatedProcs = allProcesses.filter(p => p.equipmentIds.includes(eqId));
    return { id: eqId, relatedProcs };
  });

  // Extract all hazards
  const allHazards = allProcesses.flatMap(p => p.hazards.map(h => ({ ...h, processName: p.name, industryName: p.industryName })));

  // Extract all troubleshooting
  const allTroubleshooting = allProcesses.flatMap(p => p.troubleshooting.map(t => ({ ...t, processName: p.name, industryName: p.industryName })));

  // Extract all challenges
  const allChallenges = CORE_INDUSTRIES.flatMap(ind => (ind.challenges || []).map(c => ({ ...c, industryName: ind.name })));
  
  // Extract all environmental impacts
  const allEnvironment = allProcesses.map(p => ({
    processName: p.name,
    industryName: p.industryName,
    emissions: p.environmentalImpact?.emissions || [],
    waste: p.environmentalImpact?.waste || [],
    controlTech: p.environmentalImpact?.controlTech || []
  })).filter(e => e.emissions.length > 0 || e.waste.length > 0 || e.controlTech.length > 0);

  return (
    <div className="flex h-[calc(100vh-64px)] animate-in fade-in duration-500">
      
      {/* Sidebar Navigation */}
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
          <Route path="/" element={
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Factory className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">Industrial Knowledge</h1>
                  <p className="text-surface-500 mt-1">Search or explore the complete industrial chemical engineering database.</p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-surface-400" />
                <input 
                  type="text" 
                  placeholder="Search industries, plants, processes, equipment, problems..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-800 rounded-2xl text-lg shadow-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
              </div>

              {searchTerm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredIndustries.map(industry => {
                    const Icon = iconMap[industry.icon] || Factory;
                    return (
                      <div 
                        key={industry.id} 
                        onClick={() => navigate(`/advanced/industry/${industry.id}`)} 
                        className="bg-white dark:bg-surface-900 p-6 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm cursor-pointer hover:border-primary-500 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 rounded-xl flex items-center justify-center">
                            <Icon className="w-5 h-5"/>
                          </div>
                          <h3 className="font-bold text-lg text-surface-900 dark:text-white">{industry.name}</h3>
                        </div>
                        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2">{industry.description}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          } />

          <Route path="explore" element={
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-black text-surface-900 dark:text-white mb-2">Explore Industries</h1>
                <p className="text-surface-500 dark:text-surface-400">Select any industry to dive deep into its processes, equipment, operating parameters, and control systems.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CORE_INDUSTRIES.map(industry => {
                  const Icon = iconMap[industry.icon] || Factory;
                  return (
                    <div 
                      key={industry.id} 
                      onClick={() => navigate(`/advanced/industry/${industry.id}`)} 
                      className="bg-white dark:bg-surface-900 rounded-3xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full cursor-pointer"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold group-hover:text-primary-600 text-surface-900 dark:text-white">{industry.name}</h3>
                      </div>
                      <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-3 mb-6 flex-grow leading-relaxed">
                        {industry.description}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/advanced/industry/${industry.id}`);
                        }}
                        className="w-full py-3 bg-surface-100 dark:bg-surface-800 group-hover:bg-primary-600 group-hover:text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-surface-200 dark:border-surface-700 group-hover:border-primary-500 text-surface-700 dark:text-surface-300"
                      >
                        Explore Industry <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          } />

          {/* FULLY FUNCTIONAL GLOBAL VIEWS */}
          
          <Route path="process-explorer" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><GitBranch className="text-primary-500"/> Global Process Explorer</h1>
              <p className="text-surface-500 mb-8">Select an industry below to view its interactive process flow diagram.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CORE_INDUSTRIES.map(ind => (
                  <button 
                    key={ind.id} 
                    onClick={() => navigate(`/advanced/industry/${ind.id}/process-flow`)} 
                    className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl hover:border-primary-500 text-left group transition-all shadow-sm"
                  >
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary-600 text-surface-900 dark:text-white">{ind.name}</h3>
                    <p className="text-xs text-surface-500">{ind.processes.length} defined processes</p>
                  </button>
                ))}
              </div>
            </div>
          } />

          <Route path="equipment" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><Box className="text-primary-500"/> Central Equipment Database</h1>
              <p className="text-surface-500 mb-8">Global registry of all equipment utilized across all covered industries. Integrates with Lab Assistant and Calculators.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allEquipment.map(eq => (
                  <div 
                    key={eq.id} 
                    onClick={() => {
                      const firstInd = eq.relatedProcs[0]?.industryId;
                      if (firstInd) navigate(`/advanced/industry/${firstInd}/equipment`);
                    }}
                    className="p-5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm hover:border-primary-500 transition-all cursor-pointer group"
                  >
                    <h3 className="font-bold mb-2 group-hover:text-primary-600 capitalize text-surface-900 dark:text-white">{eq.id.replace(/-/g, ' ')}</h3>
                    <div className="mb-4">
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Used In:</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(eq.relatedProcs.map(p => p.industryName))).map(indName => (
                          <span key={indName} className="text-[10px] bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-md text-surface-600 dark:text-surface-300">{indName}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-primary-600 font-bold flex items-center gap-1">View Profile <ChevronRight className="w-3 h-3"/></span>
                  </div>
                ))}
                {allEquipment.length === 0 && <p className="text-surface-500 col-span-full">No equipment logged in the database yet.</p>}
              </div>
            </div>
          } />

          <Route path="parameters" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><ThermometerSun className="text-orange-500"/> Global Operating Parameters</h1>
              <p className="text-surface-500 mb-8">Master matrix of typical operating conditions across all industrial processes.</p>
              <div className="space-y-6">
                {allProcesses.filter(p => Object.keys(p.typicalConditions).length > 0).map(proc => (
                  <div key={proc.id} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-surface-50 dark:bg-surface-950 p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center">
                      <h3 className="font-bold text-surface-900 dark:text-white">{proc.name}</h3>
                      <button 
                        onClick={() => navigate(`/advanced/industry/${proc.industryId}/parameters`)}
                        className="text-xs font-bold uppercase tracking-widest text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-3 py-1 rounded-full border border-primary-100 dark:border-primary-800 hover:bg-primary-100"
                      >
                        {proc.industryName} &rarr;
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(proc.typicalConditions).map(([k,v]) => (
                        <div key={k} className="bg-surface-50 dark:bg-surface-950 p-3 rounded-xl border border-surface-100 dark:border-surface-800">
                          <span className="block text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">{k}</span>
                          <span className="font-mono font-semibold text-sm text-surface-900 dark:text-white">{v as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="control" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><Sliders className="text-blue-500"/> Process Control Library</h1>
              <p className="text-surface-500 mb-8">Directory of standard PID control loops utilized in industrial chemical engineering.</p>
              <div className="space-y-6">
                {allProcesses.filter(p => p.control && p.control.length > 0).flatMap(p => p.control.map(c => ({...c, procName: p.name, indName: p.industryName, indId: p.industryId}))).map((ctrl, i) => (
                  <div key={i} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-lg text-surface-900 dark:text-white">{ctrl.procName} Control</h3>
                        <p className="text-sm text-surface-500">{ctrl.indName}</p>
                      </div>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full uppercase tracking-widest font-black">PID Loop</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                      <div className="flex-1 w-full text-center p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
                        <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Sensor</div>
                        <div className="font-bold text-surface-800 dark:text-surface-200">{ctrl.sensor}</div>
                      </div>
                      <ArrowRight className="text-surface-400 rotate-90 md:rotate-0 my-2 md:my-0"/>
                      <div className="flex-1 w-full text-center p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-400 dark:border-blue-700 rounded-xl">
                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Controller</div>
                        <div className="font-black text-blue-700 dark:text-blue-300">{ctrl.controller}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">CV: {ctrl.controlledVariable}</div>
                      </div>
                      <ArrowRight className="text-surface-400 rotate-90 md:rotate-0 my-2 md:my-0"/>
                      <div className="flex-1 w-full text-center p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
                        <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Valve / Actuator</div>
                        <div className="font-bold text-surface-800 dark:text-surface-200">{ctrl.valve}</div>
                        <div className="text-xs text-surface-500 mt-1">MV: {ctrl.manipulatedVariable}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="safety" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><ShieldAlert className="text-red-500"/> Global Safety & Hazards</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {allHazards.map((hazard, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-surface-900 border-l-4 border-red-500 border-y border-r border-surface-200 dark:border-surface-800 rounded-r-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-red-700 dark:text-red-400">{hazard.type}</h3>
                        <p className="text-xs text-surface-500 font-bold uppercase mt-1">{hazard.processName} &bull; {hazard.industryName}</p>
                      </div>
                    </div>
                    <p className="text-sm text-surface-700 dark:text-surface-300 mb-4">{hazard.description}</p>
                    <div className="bg-surface-50 dark:bg-surface-950 p-3 rounded-xl text-xs space-y-2 border border-surface-100 dark:border-surface-800">
                      <div><strong className="text-surface-900 dark:text-white">Precautions:</strong> {hazard.precautions}</div>
                      <div><strong className="text-surface-900 dark:text-white">Required PPE:</strong> {hazard.ppe?.join(', ') || 'Standard Site PPE'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="troubleshooting" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><Settings className="text-surface-700 dark:text-surface-300"/> Global Troubleshooter</h1>
              <p className="text-surface-500 mb-8">Search symptoms across all industrial unit operations.</p>
              
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input type="text" placeholder="Search symptom (e.g. 'high pressure', 'vibration')..." className="w-full pl-12 pr-4 py-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-surface-900 dark:text-white"/>
              </div>

              <div className="space-y-6">
                {allTroubleshooting.map(tcase => (
                  <div key={tcase.id} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-surface-50 dark:bg-surface-950 p-5 border-b border-surface-200 dark:border-surface-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-2 py-1 rounded">{tcase.industryName} &bull; {tcase.processName}</span>
                      </div>
                      <h3 className="text-lg font-bold flex items-center gap-2 text-surface-900 dark:text-white">
                        <AlertTriangle className="w-5 h-5 text-orange-500" /> {tcase.symptom}
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-bold mb-2 text-surface-900 dark:text-white">Possible Causes</h4>
                        <ul className="list-disc pl-5 text-sm text-surface-600 dark:text-surface-400 space-y-1">{tcase.possibleCauses.map(c => <li key={c}>{c}</li>)}</ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold mb-2 text-green-700 dark:text-green-400">Solutions</h4>
                        <ul className="list-disc pl-5 text-sm text-surface-600 dark:text-surface-400 space-y-1">{tcase.possibleSolutions.map(s => <li key={s}>{s}</li>)}</ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="tutor" element={
            <div className="max-w-4xl mx-auto h-[700px] flex flex-col">
              <h1 className="text-3xl font-black mb-2 flex items-center gap-3 text-surface-900 dark:text-white"><Bot className="text-primary-500"/> Global Industry AI Tutor</h1>
              <p className="text-surface-500 mb-6">Ask questions spanning multiple industries, unit operations, or engineering principles.</p>
              <div className="flex-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
                <div className="flex gap-4 p-6 bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-800 rounded-2xl text-primary-900 dark:text-primary-200 mb-auto">
                  <Bot className="w-8 h-8 shrink-0 text-primary-600"/>
                  <div>
                    <h3 className="font-bold mb-1">Hello, Chemical Engineer!</h3>
                    <p className="text-sm leading-relaxed">I have access to the complete ChemBase master engineering database. I can compare process control strategies between Cement, Fertilizers, and Refining, or assist you with heat duties, mass balances, and unit operations. What would you like to explore?</p>
                  </div>
                </div>
                <div className="relative mt-6">
                  <input type="text" placeholder="Type your engineering question..." className="w-full p-5 rounded-2xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-base" />
                  <button className="absolute right-3 top-3 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors"><ArrowRight className="w-5 h-5"/></button>
                </div>
              </div>
            </div>
          } />

          <Route path="mass-energy" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><Calculator className="text-indigo-500"/> Global Mass & Energy Balances</h1>
              <p className="text-surface-500 mb-8">Select an industry to inspect stoichiometry, heat balances, and chemical reaction models.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CORE_INDUSTRIES.map(ind => (
                  <button key={ind.id} onClick={() => navigate(`/advanced/industry/${ind.id}/mass-energy`)} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl hover:border-indigo-500 text-left group transition-all shadow-sm">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 text-surface-900 dark:text-white">{ind.name}</h3>
                    <p className="text-xs text-surface-500">Access reaction models & thermodynamics &rarr;</p>
                  </button>
                ))}
              </div>
            </div>
          } />

          <Route path="environment" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><Leaf className="text-green-500"/> Global Environmental Data</h1>
              <p className="text-surface-500 mb-8">Cross-industry database of emissions and sustainability metrics.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allEnvironment.map((env, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-surface-900 border-l-4 border-green-500 border-y border-r border-surface-200 dark:border-surface-800 rounded-r-2xl shadow-sm">
                    <h3 className="font-bold text-green-700 dark:text-green-400">{env.processName}</h3>
                    <p className="text-xs text-surface-500 font-bold uppercase mt-1 mb-3">{env.industryName}</p>
                    {env.emissions.length > 0 && <p className="text-sm text-surface-700 dark:text-surface-300 mb-2"><strong>Emissions:</strong> {env.emissions.join(', ')}</p>}
                    {env.waste.length > 0 && <p className="text-sm text-surface-700 dark:text-surface-300 mb-2"><strong>Waste:</strong> {env.waste.join(', ')}</p>}
                    {env.controlTech.length > 0 && <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-xl text-xs space-y-2 border border-green-100 dark:border-green-800">
                      <div><strong className="text-green-900 dark:text-green-200">Control Tech:</strong> {env.controlTech.join(', ')}</div>
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="challenges" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><BrainCircuit className="text-purple-500"/> Global Engineering Challenges</h1>
              <p className="text-surface-500 mb-8">Real-world scenario simulation vault spanning all industries.</p>
              <div className="space-y-6">
                {allChallenges.map((challenge, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm hover:border-purple-300 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded">{challenge.industryName}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-3 text-surface-900 dark:text-white">{challenge.scenario}</h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">How would you approach this problem as the lead process engineer?</p>
                    <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl text-sm border border-purple-100 dark:border-purple-800">
                      <strong className="text-purple-900 dark:text-purple-200 block mb-1">Industry Standard Approach:</strong> 
                      <span className="text-purple-800 dark:text-purple-300">{challenge.correctApproach}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="internship" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><GraduationCap className="text-amber-500"/> Global Internship Hub</h1>
              <p className="text-surface-500 mb-8">Enroll in simulated technical internships across different sectors.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CORE_INDUSTRIES.map(ind => (
                  <div key={ind.id} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-lg mb-2 text-surface-900 dark:text-white">{ind.name} Trainee</h3>
                    <p className="text-sm text-surface-500 mb-6">7-day virtual simulation covering {ind.processes.length} core processes.</p>
                    <button onClick={() => navigate(`/advanced/industry/${ind.id}/internship`)} className="w-full py-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-sm transition-colors border border-amber-200 dark:border-amber-800">Begin Internship &rarr;</button>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="interview" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><Briefcase className="text-teal-500"/> Global Interview Prep</h1>
              <p className="text-surface-500 mb-8">Technical interview simulator covering all major chemical engineering sectors.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CORE_INDUSTRIES.slice(0, 6).map(ind => (
                  <div key={ind.id} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm text-center">
                    <h3 className="font-bold mb-4 text-surface-900 dark:text-white">{ind.name} Module</h3>
                    <button onClick={() => navigate(`/advanced/industry/${ind.id}/interview`)} className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-full text-sm transition-colors">Start Mock Interview</button>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="careers" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><Users className="text-pink-500"/> Chemical Engineering Careers</h1>
              <p className="text-surface-500 mb-8">Explore global roles, required skills, and salary matrices across all sectors.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-primary-600 mb-2">Process Engineer</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">The most common role across all 15 sectors. Focuses on optimization, troubleshooting, and yield maximization.</p>
                  <div className="flex gap-2 text-[10px] uppercase font-bold text-surface-400">
                    <span className="bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">Operations</span>
                    <span className="bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">Design</span>
                  </div>
                </div>
                <div className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-primary-600 mb-2">HSE Engineer</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">Critical across Petrochemicals, Pharmaceuticals, and Fertilizers. Focuses on HAZOP and emissions control.</p>
                  <div className="flex gap-2 text-[10px] uppercase font-bold text-surface-400">
                    <span className="bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">Safety</span>
                    <span className="bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">Compliance</span>
                  </div>
                </div>
              </div>
            </div>
          } />

          <Route path="documents" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><FileText className="text-surface-700 dark:text-surface-300"/> Global Document Reading Room</h1>
              <p className="text-surface-500 mb-8">Learn to read standard industrial documentation across any industry.</p>
              <div className="flex gap-4">
                <div className="flex-1 p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm text-center">
                  <h3 className="font-bold mb-4 text-surface-900 dark:text-white">Master PFD Guide</h3>
                  <button className="px-6 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 text-surface-700 dark:text-surface-300 font-bold rounded-xl text-sm transition-colors">View Template</button>
                </div>
                <div className="flex-1 p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm text-center">
                  <h3 className="font-bold mb-4 text-surface-900 dark:text-white">P&ID Symbol Library</h3>
                  <button className="px-6 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 text-surface-700 dark:text-surface-300 font-bold rounded-xl text-sm transition-colors">View Library</button>
                </div>
              </div>
            </div>
          } />

          <Route path="my-industry" element={
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-black mb-4 flex items-center gap-3 text-surface-900 dark:text-white"><Star className="text-yellow-500"/> My Industry Dashboard</h1>
              <p className="text-surface-500 mb-8">Your aggregated progress and saved bookmarks across the ChemBase master dataset.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                  <h3 className="font-bold text-xl mb-6 text-surface-900 dark:text-white">Overall Completion</h3>
                  <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-4 mb-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-500 to-indigo-500 h-4 rounded-full" style={{width: '28%'}}></div>
                  </div>
                  <p className="text-sm text-surface-500">28% of total industrial modules explored.</p>
                </div>
                <div className="p-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                  <h3 className="font-bold text-xl mb-6 text-surface-900 dark:text-white">Active Industry</h3>
                  <p className="text-sm text-surface-500 mb-4">You are exploring the ChemBase Industrial Library.</p>
                  <button onClick={() => navigate('/advanced/industry/explore')} className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-3 py-2 rounded-xl border border-primary-200 dark:border-primary-800">
                    Browse All 15 Industries &rarr;
                  </button>
                </div>
              </div>
            </div>
          } />
          
          {/* Detailed specific Industry routing */}
          <Route path=":industryId/*" element={<IndustryDashboard />} />
        </Routes>
      </div>
    </div>
  );
}
