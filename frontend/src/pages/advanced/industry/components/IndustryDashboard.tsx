import { useState, useMemo } from 'react';
import { Routes, Route, NavLink, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { CORE_INDUSTRIES } from '../data/coreIndustries';
import { 
  ArrowLeft, LayoutTemplate, GitBranch, Activity, Box, 
  ThermometerSun, Sliders, Calculator, ShieldAlert, Leaf, 
  Settings, BrainCircuit, GraduationCap, Bot, Briefcase, 
  Users, FileText, Star, AlertTriangle, Target,
  Flame, Layers, Check, Send, Sparkles
} from 'lucide-react';
import ProcessFlowViewer from './ProcessFlowViewer';

export default function IndustryDashboard() {
  const { industryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [explanationLevel, setExplanationLevel] = useState<'student' | 'advanced' | 'interview' | 'operator'>('student');
  
  // Interactive challenge state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  
  // Interactive mass energy calculator state
  const [productionRate, setProductionRate] = useState<number>(4000); // 4000 tpd clinker or standard
  
  // Interactive internship progress state
  const [completedDays, setCompletedDays] = useState<number[]>([1]);
  
  // Interactive tutor state
  const [tutorQuery, setTutorQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { sender: 'ai', text: 'Welcome to the Industrial Knowledge Assistant! I am trained on full operational flows, PID control loops, mass & energy balances, and troubleshooting cases. Ask me any technical question or select one of the suggested prompts below.' }
  ]);
  
  // Interactive interview state
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  const industry = CORE_INDUSTRIES.find(ind => ind.id === industryId);

  if (!industry) {
    return (
      <div className="p-16 text-center max-w-xl mx-auto bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm mt-10">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2">Industry Not Found</h2>
        <p className="text-surface-500 mb-6">The requested industry module could not be located in the database.</p>
        <button 
          onClick={() => navigate('/advanced/industry/explore')} 
          className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-primary-700 transition-colors"
        >
          Return to Explore Industries
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutTemplate },
    { id: 'process-flow', label: 'Process Explorer', icon: GitBranch },
    { id: 'processes', label: 'Processes', icon: Activity },
    { id: 'equipment', label: 'Equipment Library', icon: Box },
    { id: 'parameters', label: 'Operating Parameters', icon: ThermometerSun },
    { id: 'control', label: 'Process Control', icon: Sliders },
    { id: 'mass-energy', label: 'Mass & Energy', icon: Calculator },
    { id: 'safety', label: 'Safety & Hazards', icon: ShieldAlert },
    { id: 'environment', label: 'Environment', icon: Leaf },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: Settings },
    { id: 'challenges', label: 'Engineering Challenges', icon: BrainCircuit },
    { id: 'internship', label: 'Internship Mode', icon: GraduationCap },
    { id: 'tutor', label: 'Industry AI Tutor', icon: Bot },
    { id: 'interview', label: 'Industry Interview', icon: Briefcase },
    { id: 'careers', label: 'Careers', icon: Users },
    { id: 'documents', label: 'Industrial Documents', icon: FileText },
    { id: 'my-industry', label: 'My Industry', icon: Star },
  ];

  // Calculated mass energy estimates
  const massEnergyStats = useMemo(() => {
    if (industry.id === 'cement') {
      const rawMealReq = (productionRate * 1.55).toFixed(0);
      const co2Emission = (productionRate * 0.55).toFixed(0);
      const coalConsumed = (productionRate * (3200 / 25000)).toFixed(1); // 3200 MJ/t clinker, 25 MJ/kg coal
      const powerConsumed = (productionRate * 105).toLocaleString(); // 105 kWh/t
      return { rawMealReq, co2Emission, coalConsumed, powerConsumed, unit: 'tpd Clinker' };
    } else {
      const rawMaterialsReq = (productionRate * 1.2).toFixed(0);
      const powerConsumed = (productionRate * 85).toLocaleString();
      return { rawMealReq: rawMaterialsReq, co2Emission: (productionRate * 0.35).toFixed(0), coalConsumed: (productionRate * 0.1).toFixed(1), powerConsumed, unit: 'tpd Output' };
    }
  }, [industry.id, productionRate]);

  // Handle Ask Tutor
  const handleSendTutor = (customQuery?: string) => {
    const q = customQuery || tutorQuery;
    if (!q.trim()) return;

    const newMsgs = [...chatMessages, { sender: 'user' as const, text: q }];
    setChatMessages(newMsgs);
    setTutorQuery('');

    // Generate technical response based on question
    setTimeout(() => {
      let reply = `In the ${industry.name}, operational stability depends critically on maintaining mass-energy balance and closed-loop PID control. Specifically regarding "${q}", chemical engineers monitor temperature gradients and reaction kinetics to maximize yield and prevent equipment downtime.`;
      
      const qLower = q.toLowerCase();
      if (qLower.includes('gypsum')) {
        reply = "Gypsum (CaSO4·2H2O) is inter-ground with clinker at approximately 3-5 wt% during finish milling. Its primary function is to regulate the setting time of cement. Without gypsum, C3A (tricalcium aluminate) reacts almost instantaneously with water, leading to a disastrous flash set. The sulfate ions react with C3A to precipitate ettringite crystals, forming a protective barrier that retards hydration.";
      } else if (qLower.includes('lsf') || qLower.includes('modulus')) {
        reply = "The Lime Saturation Factor (LSF) dictates the chemical balance between CaO and acidic oxides (SiO2, Al2O3, Fe2O3). LSF is typically maintained between 94-98%. If LSF > 100%, uncombined free lime (CaO) remains in the clinker, causing unsoundness and volume expansion in hardened concrete. If LSF < 90%, clinker formation is sluggish and early compressive strength decreases.";
      } else if (qLower.includes('sncr') || qLower.includes('nox')) {
        reply = "Selective Non-Catalytic Reduction (SNCR) injects aqueous ammonia or urea directly into the precalciner riser duct where temperatures are between 850°C and 1050°C. In this exact thermal window, NH3 selectively reduces NO and NO2 to harmless N2 and H2O without requiring a costly precious metal catalyst.";
      } else if (qLower.includes('temperature') || qLower.includes('burning zone')) {
        reply = "The burning zone of a rotary kiln operates between 1400°C and 1480°C. This extreme temperature is necessary to create a 20-25% liquid phase (melt) composed of C3A and C4AF, which enables rapid diffusion of solid lime (CaO) into dicalcium silicate (C2S) to crystallize alite (C3S).";
      }

      setChatMessages([...newMsgs, { sender: 'ai' as const, text: reply }]);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in duration-500">
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <button 
          onClick={() => navigate('/advanced/industry/explore')}
          className="flex items-center gap-2 text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm font-bold bg-white dark:bg-surface-900 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Explore Industries
        </button>

        {/* Explain Level Switcher */}
        <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 border border-surface-200 dark:border-surface-700 text-xs">
          <span className="font-bold text-surface-400 uppercase tracking-widest px-2 hidden sm:inline">Depth:</span>
          {(['student', 'advanced', 'interview', 'operator'] as const).map(lvl => (
            <button 
              key={lvl}
              onClick={() => setExplanationLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                explanationLevel === lvl 
                  ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Industry Banner Card */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-primary-600 bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 px-3 py-1 rounded-full">
            Sector ID: {industry.id}
          </span>
          <span className="text-xs font-semibold text-surface-500">
            {industry.processes.length} Core Processes &bull; {industry.processes.flatMap(p => p.equipmentIds).length} Key Equipment Units
          </span>
        </div>

        <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight mb-4 relative z-10">
          {industry.name}
        </h1>
        <p className="text-surface-600 dark:text-surface-300 max-w-4xl text-base leading-relaxed mb-8 relative z-10">
          {industry.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* Major Products */}
          <div className="bg-surface-50 dark:bg-surface-950 p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Box className="w-4 h-4 text-primary-500" /> Major Commercial Products
            </h3>
            <div className="space-y-4">
              {industry.products.map(p => (
                <div key={p.name} className="flex flex-col bg-white dark:bg-surface-900 p-3.5 rounded-xl border border-surface-200/60 dark:border-surface-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-surface-900 dark:text-white text-sm">{p.name}</span>
                    <span className="text-[10px] font-bold uppercase text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">Route: {p.productionRoute}</span>
                  </div>
                  <span className="text-xs text-surface-500">{p.purpose}</span>
                </div>
              ))}
              {industry.products.length === 0 && (
                <div className="text-xs text-surface-500 bg-white dark:bg-surface-900 p-3 rounded-xl">
                  Primary and intermediate chemical goods standardized for export and domestic distribution.
                </div>
              )}
            </div>
          </div>

          {/* Raw Materials */}
          <div className="bg-surface-50 dark:bg-surface-950 p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-500" /> Feedstocks & Raw Materials
            </h3>
            <div className="space-y-4">
              {industry.rawMaterials.map(r => (
                <div key={r.name} className="flex flex-col bg-white dark:bg-surface-900 p-3.5 rounded-xl border border-surface-200/60 dark:border-surface-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-surface-900 dark:text-white text-sm">{r.name}</span>
                    <span className="text-[10px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">Entry: {r.entryPoint}</span>
                  </div>
                  <span className="text-xs text-surface-500">{r.purpose} &bull; <em className="text-surface-400">{r.properties}</em></span>
                </div>
              ))}
              {industry.rawMaterials.length === 0 && (
                <div className="text-xs text-surface-500 bg-white dark:bg-surface-900 p-3 rounded-xl">
                  Primary mined or extracted minerals, hydrocarbons, and chemical utility streams.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-module Navigation Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-surface-100/70 dark:bg-surface-900/70 p-2 rounded-2xl border border-surface-200 dark:border-surface-800">
        {tabs.map(tab => {
          const tabUrl = `/advanced/industry/${industry.id}/${tab.id}`;
          const isTabActive = location.pathname === tabUrl || (location.pathname === `/advanced/industry/${industry.id}` && tab.id === 'overview');
          return (
            <NavLink
              key={tab.id}
              to={tabUrl}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                isTabActive 
                  ? 'bg-white dark:bg-surface-800 text-primary-600 dark:text-primary-400 shadow-sm border border-surface-200 dark:border-surface-700' 
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-surface-800/50 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      {/* Tab Content Display Area */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 min-h-[550px] shadow-sm overflow-hidden p-8">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="" element={<Navigate to="overview" replace />} />
          
          {/* TAB 1: OVERVIEW */}
          <Route path="overview" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <LayoutTemplate className="w-6 h-6 text-primary-500" /> Industry Engineering Overview
                </h2>
                <p className="text-surface-500 text-sm">Comprehensive operational profile tailored for {explanationLevel} level.</p>
              </div>

              {/* Dynamic explanation according to level */}
              <div className="p-6 bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-800 rounded-2xl">
                <h3 className="font-bold text-primary-900 dark:text-primary-200 text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" /> Core Engineering Synthesis ({explanationLevel.toUpperCase()} View)
                </h3>
                <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                  {explanationLevel === 'student' && `The ${industry.name} is a prime showcase of Chemical Engineering principles: thermodynamics dictates the endothermic and exothermic heats of reaction, fluid mechanics governs the handling of multi-phase slurry and pneumatically conveyed powders, and reaction engineering controls the conversion kinetics across large continuous reactors.`}
                  {explanationLevel === 'advanced' && `This industrial facility represents a continuous, highly integrated thermochemical system. Process economics are governed by specific thermal consumption (target: <3100 MJ/t) and power consumption (<100 kWh/t). Pinch analysis and heat integration recover secondary energy to maximize overall thermodynamic efficiency.`}
                  {explanationLevel === 'interview' && `In interviews, expect questions on mass and energy balance discrepancies, LOTO protocols, PID cascade control loops, and mitigation of thermal stress or unexpected pressure surges across the primary reactor vessels.`}
                  {explanationLevel === 'operator' && `Daily control room focus: maintain consistent feed rate, monitor burner flame shape and burning zone pyrometer, ensure continuous negative draft via the ID fan, and prevent build-up or ring formation.`}
                </p>
              </div>

              {/* Linked Core Subjects */}
              <div className="border border-surface-200 dark:border-surface-800 rounded-2xl p-6 bg-surface-50 dark:bg-surface-950">
                <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-primary-500" /> Fundamental Chemical Engineering Subjects Applied
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {industry.relatedSubjects && industry.relatedSubjects.length > 0 ? (
                    industry.relatedSubjects.map(s => (
                      <div key={s.subjectId} className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
                        <span className="text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 block mb-2">{s.subjectId}</span>
                        <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">{s.application}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
                        <span className="text-xs font-black uppercase tracking-wider text-primary-600 block mb-2">Thermodynamics</span>
                        <p className="text-xs text-surface-600 dark:text-surface-400">Enthalpy balances across reactors, phase equilibria, and heat integration.</p>
                      </div>
                      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
                        <span className="text-xs font-black uppercase tracking-wider text-primary-600 block mb-2">Heat Transfer</span>
                        <p className="text-xs text-surface-600 dark:text-surface-400">Radiative and convective transfer in furnaces, coolers, and multi-stage exchangers.</p>
                      </div>
                      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
                        <span className="text-xs font-black uppercase tracking-wider text-primary-600 block mb-2">Process Control</span>
                        <p className="text-xs text-surface-600 dark:text-surface-400">Feedback PID control loops, cascade architectures, and safety interlocks.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          } />

          {/* TAB 2: PROCESS FLOW */}
          <Route path="process-flow" element={
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-surface-900 dark:text-white flex items-center gap-2">
                    <GitBranch className="w-6 h-6 text-primary-500" /> Interactive Process Flowchart
                  </h2>
                  <p className="text-surface-500 text-sm">Visual topology of sequence blocks. Click on any block to inspect its engineering parameters.</p>
                </div>
                <button 
                  onClick={() => navigate(`/advanced/industry/${industry.id}/processes`)}
                  className="px-4 py-2 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-bold text-xs rounded-xl border border-primary-200 dark:border-primary-800"
                >
                  View Tabular Process List &rarr;
                </button>
              </div>

              <div className="h-[650px] bg-surface-50 dark:bg-surface-950 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-inner">
                {industry.processes.length > 0 ? (
                  <ProcessFlowViewer 
                    processes={industry.processes} 
                    onProcessClick={(id) => navigate(`/advanced/industry/${industry.id}/processes#${id}`)} 
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-surface-400 p-8 text-center">
                    <GitBranch className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-bold">Process flow model for {industry.name}</p>
                    <p className="text-xs mt-1">Flowchart connections and nodes are currently being compiled.</p>
                  </div>
                )}
              </div>
            </div>
          } />

          {/* TAB 3: PROCESSES */}
          <Route path="processes" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary-500" /> Step-by-Step Process Operations
                </h2>
                <p className="text-surface-500 text-sm">Detailed chemical conversions, operating conditions, and engineering equipment for each unit operation.</p>
              </div>

              <div className="space-y-6">
                {industry.processes.map((proc, index) => (
                  <div 
                    key={proc.id} 
                    id={proc.id} 
                    className="p-6 border border-surface-200 dark:border-surface-800 rounded-3xl bg-surface-50/50 dark:bg-surface-950 shadow-sm"
                  >
                    <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-md border border-primary-200 dark:border-primary-800">
                          Stage {index + 1}: {proc.id}
                        </span>
                        <h3 className="text-xl font-bold text-surface-900 dark:text-white mt-2">{proc.name}</h3>
                      </div>
                      {proc.equipmentIds.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {proc.equipmentIds.map(eq => (
                            <span key={eq} className="text-xs font-mono font-bold bg-white dark:bg-surface-900 px-2.5 py-1 rounded-lg border border-surface-200 dark:border-surface-800 text-surface-700 dark:text-surface-300">
                              {eq}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-surface-600 dark:text-surface-300 mb-6 leading-relaxed bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200/80 dark:border-surface-800">
                      <strong>Working Principle:</strong> {proc.workingPrinciple}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {/* Typical Conditions */}
                      <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                        <h4 className="text-[11px] font-bold uppercase text-surface-400 tracking-wider mb-3 flex items-center gap-1.5">
                          <ThermometerSun className="w-3.5 h-3.5 text-orange-500"/> Typical Conditions
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(proc.typicalConditions).map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center text-xs border-b border-surface-100 dark:border-surface-800/50 pb-1">
                              <span className="text-surface-500 font-medium">{k}:</span>
                              <span className="font-mono font-bold text-surface-900 dark:text-white">{v as string}</span>
                            </div>
                          ))}
                          {Object.keys(proc.typicalConditions).length === 0 && (
                            <span className="text-xs text-surface-400">Conditions within standard ranges.</span>
                          )}
                        </div>
                      </div>

                      {/* Chemical Reactions */}
                      <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                        <h4 className="text-[11px] font-bold uppercase text-surface-400 tracking-wider mb-3 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-rose-500"/> Reactions & Stoichiometry
                        </h4>
                        <div className="space-y-2">
                          {proc.chemicalReactions && proc.chemicalReactions.length > 0 ? (
                            proc.chemicalReactions.map((r, i) => (
                              <div key={i} className="text-xs font-mono bg-rose-50/50 dark:bg-rose-950/20 p-2 rounded border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
                                {r}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-surface-400">Physical transformation / comminution without bulk chemical reactions.</span>
                          )}
                        </div>
                      </div>

                      {/* Hazards */}
                      <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                        <h4 className="text-[11px] font-bold uppercase text-surface-400 tracking-wider mb-3 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-500"/> Hazards & Safety
                        </h4>
                        <div className="space-y-2">
                          {proc.hazards.map((h, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-bold text-red-600 dark:text-red-400">{h.type}:</span> {h.description}
                            </div>
                          ))}
                          {proc.hazards.length === 0 && (
                            <span className="text-xs text-surface-400">Standard plant safety rules apply.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mass & Energy Balance Details */}
                    {(proc.massBalanceDesc || proc.energyBalanceDesc) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-surface-700 dark:text-surface-300">
                        <div>
                          <strong className="text-indigo-900 dark:text-indigo-300 block mb-1">Mass Balance Insight:</strong>
                          {proc.massBalanceDesc || 'Continuous mass continuity maintained across inputs and outputs.'}
                        </div>
                        <div>
                          <strong className="text-indigo-900 dark:text-indigo-300 block mb-1">Energy Balance Insight:</strong>
                          {proc.energyBalanceDesc || 'Thermal conservation with inter-stage cooling and heat recuperation.'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* TAB 4: EQUIPMENT LIBRARY */}
          <Route path="equipment" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Box className="w-6 h-6 text-primary-500" /> Equipment & Unit Machinery Library
                </h2>
                <p className="text-surface-500 text-sm">Industrial equipment specifications, maintenance procedures, and links to ChemBase subject calculators.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {industry.processes.flatMap(p => p.equipmentIds).length > 0 ? (
                  Array.from(new Set(industry.processes.flatMap(p => p.equipmentIds))).map(eqId => {
                    const relatedProc = industry.processes.find(p => p.equipmentIds.includes(eqId));
                    return (
                      <div 
                        key={eqId} 
                        className="bg-surface-50 dark:bg-surface-950 p-6 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm hover:border-primary-500 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-mono font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-800">
                              {eqId}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-surface-400">
                              {relatedProc?.name.split(' ')[0]}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-2 capitalize">
                            {eqId.replace('EQ-', '').replace(/-/g, ' ').toLowerCase()}
                          </h3>
                          <p className="text-xs text-surface-500 mb-4 leading-relaxed">
                            {relatedProc ? `Primary unit operation in ${relatedProc.name}. Designed for high-duty continuous service.` : 'Standard industrial machinery unit.'}
                          </p>
                          
                          <div className="space-y-2 mb-6">
                            <div className="text-[11px] bg-white dark:bg-surface-900 p-2.5 rounded-xl border border-surface-200 dark:border-surface-800">
                              <span className="font-bold text-surface-700 dark:text-surface-300 block mb-0.5">Primary Maintenance:</span>
                              <span className="text-surface-500">Bearing vibration analysis, lubrication schedule, and seal integrity checks.</span>
                            </div>
                            <div className="text-[11px] bg-white dark:bg-surface-900 p-2.5 rounded-xl border border-surface-200 dark:border-surface-800">
                              <span className="font-bold text-surface-700 dark:text-surface-300 block mb-0.5">Common Failure Modes:</span>
                              <span className="text-surface-500">Liner wear, overheating bearings, thermal cracking, and motor overload.</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-4 border-t border-surface-200 dark:border-surface-800">
                          <button 
                            onClick={() => navigate('/advanced/calculators')}
                            className="w-full py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 rounded-xl font-bold text-xs text-center border border-primary-200 dark:border-primary-800 transition-colors"
                          >
                            Open Equipment Sizing Calculator &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full p-8 text-center text-surface-400 bg-surface-50 rounded-2xl border border-surface-200">
                    Equipment catalog for {industry.name} is currently compiling.
                  </div>
                )}
              </div>
            </div>
          } />

          {/* TAB 5: OPERATING PARAMETERS MATRIX */}
          <Route path="parameters" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <ThermometerSun className="w-6 h-6 text-orange-500" /> Critical Operating Parameters Matrix
                </h2>
                <p className="text-surface-500 text-sm">Target operating envelopes, technical rationale, and deviations consequences (Too High vs. Too Low).</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 text-surface-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold">Process & Parameter</th>
                      <th className="p-4 font-bold">Typical Range</th>
                      <th className="p-4 font-bold">Engineering Importance</th>
                      <th className="p-4 font-bold text-red-500">Consequence if Too High</th>
                      <th className="p-4 font-bold text-blue-500">Consequence if Too Low</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                    {industry.processes.flatMap(p => 
                      Object.entries(p.typicalConditions).map(([param, val]) => (
                        <tr key={p.id + param} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-surface-900 dark:text-white block">{param}</span>
                            <span className="text-xs text-primary-600">{p.name}</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-surface-800 dark:text-surface-200 whitespace-nowrap">{val as string}</td>
                          <td className="p-4 text-xs text-surface-600 dark:text-surface-400">
                            Ensures proper reaction kinetics, prevents thermal shock, and stabilizes continuous yield.
                          </td>
                          <td className="p-4 text-xs text-red-600 dark:text-red-400 bg-red-50/20">
                            Refractory wear, excessive thermal losses, degradation of products, risk of trip.
                          </td>
                          <td className="p-4 text-xs text-blue-600 dark:text-blue-400 bg-blue-50/20">
                            Incomplete conversion, sluggish reaction rates, unreacted raw feed slips through.
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          } />

          {/* TAB 6: PROCESS CONTROL */}
          <Route path="control" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-blue-500" /> Process Control & PID Loop Architectures
                </h2>
                <p className="text-surface-500 text-sm">Industrial feedback and feedforward control architectures for {industry.name}.</p>
              </div>

              <div className="space-y-6">
                {industry.processes.flatMap(p => p.control.map(c => ({ ...c, procName: p.name }))).length > 0 ? (
                  industry.processes.flatMap(p => p.control.map(c => ({ ...c, procName: p.name }))).map((ctrl, i) => (
                    <div key={i} className="bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">{ctrl.procName}</span>
                          <h3 className="text-xl font-bold text-surface-900 dark:text-white mt-1">Control Loop: {ctrl.controlledVariable}</h3>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full uppercase tracking-widest font-black">
                          {ctrl.controller}
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
                        <div className="flex-1 w-full text-center p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
                          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Process Sensor</span>
                          <span className="font-bold text-surface-800 dark:text-surface-200 text-sm">{ctrl.sensor}</span>
                          <span className="text-[11px] text-surface-500 block mt-1">Measures: {ctrl.controlledVariable}</span>
                        </div>
                        <ArrowLeft className="text-surface-400 rotate-90 md:rotate-0 my-1 md:my-0"/>
                        <div className="flex-1 w-full text-center p-4 bg-blue-50/60 dark:bg-blue-950/40 border-2 border-blue-400 dark:border-blue-700 rounded-xl">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Controller Algorithm</span>
                          <span className="font-black text-blue-800 dark:text-blue-300 text-base">{ctrl.controller}</span>
                          <span className="text-[11px] text-blue-600 block mt-1">Calculates Error (SP - PV)</span>
                        </div>
                        <ArrowLeft className="text-surface-400 rotate-90 md:rotate-0 my-1 md:my-0"/>
                        <div className="flex-1 w-full text-center p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl">
                          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Final Control Element</span>
                          <span className="font-bold text-surface-800 dark:text-surface-200 text-sm">{ctrl.valve}</span>
                          <span className="text-[11px] text-surface-500 block mt-1">Manipulates: {ctrl.manipulatedVariable}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-surface-400 bg-surface-50 rounded-2xl border border-surface-200">
                    Control loop definitions are standard continuous single-input single-output (SISO) PID loops.
                  </div>
                )}
              </div>
            </div>
          } />

          {/* TAB 7: MASS & ENERGY BALANCES */}
          <Route path="mass-energy" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-indigo-500" /> Mass & Energy Balances & Stoichiometry
                </h2>
                <p className="text-surface-500 text-sm">Quantitative material flows, thermal duties, and real-time plant scale simulator.</p>
              </div>

              {/* Interactive Live Production Simulator */}
              <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-3xl p-8">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-950 dark:text-indigo-100">Live Plant Production & Energy Model</h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">Adjust plant output capacity to calculate dynamic material inputs and thermal duties.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-surface-600">Capacity (t/day):</label>
                    <input 
                      type="number" 
                      value={productionRate} 
                      onChange={(e) => setProductionRate(Number(e.target.value) || 1000)}
                      className="w-28 p-2 rounded-xl border border-indigo-300 dark:border-indigo-700 font-mono font-bold text-sm bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-surface-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Required Raw Feed</span>
                    <span className="text-2xl font-black text-indigo-600 font-mono">{massEnergyStats.rawMealReq}</span>
                    <span className="text-xs text-surface-400 block">tons / day</span>
                  </div>
                  <div className="bg-white dark:bg-surface-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Process CO2 Emitted</span>
                    <span className="text-2xl font-black text-rose-600 font-mono">{massEnergyStats.co2Emission}</span>
                    <span className="text-xs text-surface-400 block">tons / day</span>
                  </div>
                  <div className="bg-white dark:bg-surface-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Fuel Consumed</span>
                    <span className="text-2xl font-black text-amber-600 font-mono">{massEnergyStats.coalConsumed}</span>
                    <span className="text-xs text-surface-400 block">tons coal / day</span>
                  </div>
                  <div className="bg-white dark:bg-surface-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1">Total Electricity</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">{massEnergyStats.powerConsumed}</span>
                    <span className="text-xs text-surface-400 block">kWh / day</span>
                  </div>
                </div>
              </div>

              {/* Chemical Equations List */}
              <div className="border border-surface-200 dark:border-surface-800 rounded-2xl p-6 bg-surface-50 dark:bg-surface-950">
                <h3 className="font-bold text-surface-900 dark:text-white mb-4 text-base">Key Chemical Equations</h3>
                <div className="space-y-3">
                  {industry.processes.flatMap(p => p.chemicalReactions).map((rxn, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 font-mono text-sm text-surface-800 dark:text-surface-200 flex justify-between items-center">
                      <span>{rxn}</span>
                      <span className="text-[10px] uppercase font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Stoichiometric</span>
                    </div>
                  ))}
                  {industry.processes.flatMap(p => p.chemicalReactions).length === 0 && (
                    <p className="text-xs text-surface-500">Stoichiometric models for physical blending and separation processes.</p>
                  )}
                </div>
              </div>
            </div>
          } />

          {/* TAB 8: SAFETY & HAZARDS */}
          <Route path="safety" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-red-500" /> Plant Safety, Hazards & Required PPE
                </h2>
                <p className="text-surface-500 text-sm">Hazard identification, risk rankings, and emergency personal protective equipment protocols.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {industry.processes.flatMap(p => p.hazards.map(h => ({ ...h, procName: p.name }))).map((haz, idx) => (
                  <div key={idx} className="p-6 bg-white dark:bg-surface-900 border-l-4 border-red-500 border-y border-r border-surface-200 dark:border-surface-800 rounded-r-3xl shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{haz.type} HAZARD</span>
                        <h3 className="font-bold text-lg text-surface-900 dark:text-white">{haz.procName}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-surface-700 dark:text-surface-300 mb-4">{haz.description}</p>
                    
                    <div className="bg-surface-50 dark:bg-surface-950 p-4 rounded-xl border border-surface-200 dark:border-surface-800 space-y-2 text-xs">
                      <div><strong className="text-surface-900 dark:text-white">Safety Precaution:</strong> {haz.precautions}</div>
                      <div>
                        <strong className="text-surface-900 dark:text-white">Required PPE:</strong>{' '}
                        {haz.ppe && haz.ppe.length > 0 ? (
                          haz.ppe.map(p => (
                            <span key={p} className="inline-block bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 font-bold px-2 py-0.5 rounded text-[10px] mr-1">
                              {p}
                            </span>
                          ))
                        ) : 'Hard hat, safety glasses, steel-toe shoes'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* TAB 9: ENVIRONMENT */}
          <Route path="environment" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Leaf className="w-6 h-6 text-green-500" /> Environmental Sustainability & Decarbonization
                </h2>
                <p className="text-surface-500 text-sm">Industrial stack emissions abatement, circular economy, and waste heat recovery.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {industry.processes.filter(p => p.environmentalImpact).map((p, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{p.name}</span>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mt-1 mb-4">Emissions & Abatement Control</h3>
                    
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
                        <span className="font-bold text-surface-800 dark:text-surface-200 block mb-1">Air Emissions:</span>
                        <span className="text-surface-600">{p.environmentalImpact.emissions.join(', ') || 'Low fugitive dust'}</span>
                      </div>
                      <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900">
                        <span className="font-bold text-green-900 dark:text-green-300 block mb-1">Control Technologies:</span>
                        <span className="text-green-800 dark:text-green-400 font-semibold">{p.environmentalImpact.controlTech.join(', ') || 'High efficiency bag filters'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* TAB 10: TROUBLESHOOTING */}
          <Route path="troubleshooting" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-surface-700 dark:text-surface-300" /> Industrial Troubleshooter & Root Cause Engine
                </h2>
                <p className="text-surface-500 text-sm">Diagnostic decision trees for plant upsets and mechanical trip conditions.</p>
              </div>

              <div className="space-y-6">
                {industry.processes.flatMap(p => p.troubleshooting.map(t => ({ ...t, procName: p.name }))).map((tcase) => (
                  <div key={tcase.id} className="border border-surface-200 dark:border-surface-800 rounded-3xl bg-surface-50 dark:bg-surface-950 overflow-hidden shadow-sm">
                    <div className="p-6 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{tcase.procName}</span>
                      <h3 className="text-lg font-bold flex items-center gap-2 text-surface-900 dark:text-white mt-1">
                        <AlertTriangle className="w-5 h-5 text-orange-500" /> Symptom: {tcase.symptom}
                      </h3>
                      {tcase.whatToCheckFirst && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-semibold">
                          <strong>First Diagnostic Step:</strong> {tcase.whatToCheckFirst}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div>
                        <h4 className="font-bold text-surface-900 dark:text-white mb-2 uppercase tracking-wider text-[11px]">Probable Root Causes:</h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-surface-600 dark:text-surface-400">
                          {tcase.possibleCauses.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-wider text-[11px]">Engineering Solutions:</h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-surface-600 dark:text-surface-400">
                          {tcase.possibleSolutions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
                {industry.processes.flatMap(p => p.troubleshooting).length === 0 && (
                  <div className="p-8 text-center text-surface-400 bg-surface-50 rounded-2xl border border-surface-200">
                    Troubleshooting cases for this module follow standard industrial root cause analysis (RCA).
                  </div>
                )}
              </div>
            </div>
          } />

          {/* TAB 11: CHALLENGES */}
          <Route path="challenges" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-purple-500" /> Real-World Engineering Scenarios & Challenges
                </h2>
                <p className="text-surface-500 text-sm">Make executive operational decisions under simulated upset conditions and receive immediate feedback.</p>
              </div>

              <div className="space-y-6">
                {industry.challenges.map((c, idx) => (
                  <div key={c.id} className="p-8 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded">
                      Scenario Challenge #{idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mt-3 mb-4 leading-relaxed">
                      {c.scenario}
                    </h3>

                    <div className="space-y-3 mb-6">
                      {c.options.map((opt, optIdx) => {
                        const isSelected = selectedOptions[c.id] === optIdx;
                        return (
                          <div 
                            key={optIdx} 
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [c.id]: optIdx }))}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all text-sm ${
                              isSelected 
                                ? opt.score > 50 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold' 
                                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold'
                                : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-purple-400 text-surface-800 dark:text-surface-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0">
                                {optIdx + 1}
                              </span>
                              <span>{opt.text}</span>
                            </div>

                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 text-xs">
                                <strong>Feedback:</strong> {opt.feedback}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {selectedOptions[c.id] !== undefined && (
                      <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
                        <strong className="block mb-1 font-bold">Standard Engineering Debriefing:</strong>
                        {c.correctApproach}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          } />

          {/* TAB 12: INTERNSHIP MODE */}
          <Route path="internship" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-amber-500" /> 7-Day Virtual Plant Internship Simulator
                </h2>
                <p className="text-surface-500 text-sm">Step into the role of a graduate trainee engineer at a commercial {industry.name} facility.</p>
              </div>

              {/* Progress bar */}
              <div className="p-6 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-3xl">
                <div className="flex justify-between items-center mb-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <span>Internship Curriculum Completion</span>
                  <span>{completedDays.length} / 7 Days Complete</span>
                </div>
                <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${(completedDays.length / 7) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { day: 1, title: 'Raw Material Geology, Sampling & Crushing', task: 'Review XRF raw meal analyzer outputs and set primary crusher jaw gap.' },
                  { day: 2, title: 'Milling Dynamics & Particle Size Classification', task: 'Calculate Blaine fineness and balance vertical roller mill hydraulic pressures.' },
                  { day: 3, title: 'Pyroprocessing Island: Precalciner & Rotary Kiln', task: 'Monitor draft fans and evaluate burning zone flame temperature via pyrometer.' },
                  { day: 4, title: 'Clinker Cooler Grate Operation & Heat Recovery', task: 'Ensure clinker quenching to <100°C and optimize tertiary air duct dampers.' },
                  { day: 5, title: 'Finish Grinding Ball Mill Circuits & Gypsum Dosing', task: 'Calibrate gypsum weigh feeder rate to prevent flash set in Portland cement.' },
                  { day: 6, title: 'Plant HSE, Continuous Emissions Monitoring (CEMS)', task: 'Conduct HAZOP walkthrough, inspect baghouses, and verify SNCR ammonia flow.' },
                  { day: 7, title: 'Capstone Plant Thermal Efficiency & Optimization Audit', task: 'Compile daily energy balance report and present kiln ring prevention strategy.' },
                ].map(item => {
                  const isDone = completedDays.includes(item.day);
                  return (
                    <div 
                      key={item.day} 
                      className={`p-6 rounded-2xl border transition-all flex flex-wrap justify-between items-center gap-4 ${
                        isDone 
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block mb-1">
                          Day {item.day} Focus
                        </span>
                        <h4 className="font-bold text-base text-surface-900 dark:text-white mb-1">{item.title}</h4>
                        <p className="text-xs text-surface-500">{item.task}</p>
                      </div>

                      <button 
                        onClick={() => {
                          if (isDone) {
                            setCompletedDays(completedDays.filter(d => d !== item.day));
                          } else {
                            setCompletedDays([...completedDays, item.day]);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                          isDone 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-amber-500 hover:text-white'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5"/> : null}
                        {isDone ? 'Completed' : 'Mark Complete'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          } />

          {/* TAB 13: CONTEXTUAL AI TUTOR */}
          <Route path="tutor" element={
            <div className="h-[650px] flex flex-col animate-in fade-in duration-300">
              <div className="mb-4">
                <h2 className="text-2xl font-black text-surface-900 dark:text-white flex items-center gap-2">
                  <Bot className="w-6 h-6 text-primary-500" /> Contextual AI Tutor ({industry.name})
                </h2>
                <p className="text-surface-500 text-sm">Specialized technical AI tutor trained on this industry's PFDs and operating parameters.</p>
              </div>

              {/* Chat Window */}
              <div className="flex-1 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-inner">
                <div className="overflow-y-auto space-y-4 pr-2 flex-1 mb-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-2xl p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-primary-600 text-white rounded-br-none shadow-sm' 
                          : 'bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-200 rounded-bl-none border border-surface-200 dark:border-surface-800 shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested prompt chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    "Why is gypsum added to clinker?",
                    "What is LSF in raw mix?",
                    "How does SNCR control NOx?",
                    "What temperature is the burning zone?"
                  ].map(chip => (
                    <button 
                      key={chip} 
                      onClick={() => handleSendTutor(chip)}
                      className="text-xs bg-white dark:bg-surface-900 hover:bg-primary-50 text-surface-600 dark:text-surface-300 px-3 py-1.5 rounded-full border border-surface-200 dark:border-surface-800 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input row */}
                <div className="relative">
                  <input 
                    type="text" 
                    value={tutorQuery}
                    onChange={(e) => setTutorQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendTutor()}
                    placeholder="Ask an engineering question about this industry..." 
                    className="w-full p-4 pr-14 rounded-2xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm"
                  />
                  <button 
                    onClick={() => handleSendTutor()}
                    className="absolute right-2.5 top-2.5 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          } />

          {/* TAB 14: INDUSTRY INTERVIEW */}
          <Route path="interview" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-teal-500" /> Technical Interview Question Bank
                </h2>
                <p className="text-surface-500 text-sm">Real technical interview questions asked at top plant operations and EPC contractors.</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: 'q1',
                    category: 'Reactions & Chemistry',
                    q: 'What are the four main mineral phases in Portland cement clinker, and which one provides 28-day ultimate strength?',
                    a: 'The four phases are Alite (C3S - 3CaO·SiO2), Belite (C2S - 2CaO·SiO2), Tricalcium Aluminate (C3A - 3CaO·Al2O3), and Brownmillerite (C4AF - 4CaO·Al2O3·Fe2O3). Alite (C3S) provides rapid hydration and early strength (1-7 days), whereas Belite (C2S) hydrates slowly and is responsible for long-term ultimate strength (28 days to 1 year).'
                  },
                  {
                    id: 'q2',
                    category: 'Thermal Operations & Kiln',
                    q: 'Why is a rotary kiln placed on an incline (typically 3-4%) and rotated at 3-5 RPM?',
                    a: 'The mechanical incline and rotation enable controlled axial conveyance of the solid bed through gravity and tumbling. The rotation continuously exposes new bed surface to radiant heat transfer from the burner flame, maintaining a retention time of 20-30 minutes required for the solid-liquid sintering reactions.'
                  },
                  {
                    id: 'q3',
                    category: 'Process Safety & HAZOP',
                    q: 'What is the danger of high CO levels at the kiln inlet, and what automatic interlock is triggered?',
                    a: 'Carbon Monoxide (CO) at concentrations > 0.5% mixed with secondary air creates an explosive atmosphere in the downstream electrostatic precipitator (ESP) or fabric filter baghouse. High CO triggers an automatic high-voltage trip on the ESP to eliminate potential ignition sparks.'
                  },
                  {
                    id: 'q4',
                    category: 'Process Control',
                    q: 'How does a cascade control loop stabilize fuel feed rate based on burning zone temperature?',
                    a: 'The primary (master) controller receives the burning zone optical pyrometer PV and calculates a required fuel setpoint. The secondary (slave) controller monitors the coal mass flow weigh feeder and modulates the feeder speed to eliminate fuel surge disturbances before they affect kiln temperature.'
                  }
                ].map(item => {
                  const isRevealed = revealedAnswers[item.id];
                  return (
                    <div key={item.id} className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4">
                        {item.q}
                      </h3>

                      {isRevealed ? (
                        <div className="p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl text-xs text-surface-700 dark:text-surface-300 leading-relaxed">
                          <strong className="text-teal-700 dark:text-teal-400 block mb-1">Model Technical Answer:</strong>
                          {item.a}
                        </div>
                      ) : (
                        <button 
                          onClick={() => setRevealedAnswers(prev => ({ ...prev, [item.id]: true }))}
                          className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 rounded-xl font-bold text-xs border border-teal-200 dark:border-teal-800 transition-colors"
                        >
                          Reveal Model Answer &rarr;
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          } />

          {/* TAB 15: CAREERS */}
          <Route path="careers" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-500" /> Career Paths in {industry.name}
                </h2>
                <p className="text-surface-500 text-sm">Industrial job titles, daily shift responsibilities, and required engineering competencies.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {industry.roles && industry.roles.length > 0 ? (
                  industry.roles.map((role, idx) => (
                    <div key={idx} className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                      <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">{role.title}</h3>
                      <div className="space-y-4 text-xs mt-4">
                        <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                          <span className="font-bold text-primary-600 block mb-2 uppercase tracking-wider text-[10px]">Key Responsibilities:</span>
                          <ul className="list-disc pl-4 space-y-1 text-surface-600 dark:text-surface-400">
                            {role.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                        <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                          <span className="font-bold text-primary-600 block mb-2 uppercase tracking-wider text-[10px]">Essential Core Skills:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {role.skills.map((s, i) => (
                              <span key={i} className="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-surface-700 dark:text-surface-300 font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                      <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Process Optimization Engineer</h3>
                      <p className="text-xs text-surface-500 mb-4">Responsible for minimizing thermal and electrical energy consumption across kilns and milling islands.</p>
                      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800 text-xs text-surface-600 space-y-1">
                        <div>&bull; Monitor daily material and heat balances</div>
                        <div>&bull; Optimize raw mix chemistry (LSF, SM, AM)</div>
                        <div>&bull; Troubleshoot ring formations and mill vibrations</div>
                      </div>
                    </div>
                    <div className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-sm">
                      <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Plant HSE & Emissions Compliance Manager</h3>
                      <p className="text-xs text-surface-500 mb-4">Ensures zero-harm workplace safety and environmental stack compliance.</p>
                      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800 text-xs text-surface-600 space-y-1">
                        <div>&bull; Supervise CEMS stack particulate, NOx, and SOx limits</div>
                        <div>&bull; Lead plant HAZOP and LOTO reviews</div>
                        <div>&bull; Oversee alternative fuel (RDF, biomass) safety protocols</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          } />

          {/* TAB 16: INDUSTRIAL DOCUMENTS */}
          <Route path="documents" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-amber-500" /> Industrial Document Reading Room
                </h2>
                <p className="text-surface-500 text-sm">Standard engineering deliverables: Process Flow Diagrams, P&IDs, and equipment datasheets.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">Process Flow Diagram (PFD)</h3>
                    <p className="text-xs text-surface-500 mb-4">Master stream flow diagram displaying flow rates, temperatures, pressures, and heat exchanger duties.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/advanced/pfd-pid')}
                    className="w-full py-2.5 bg-white dark:bg-surface-900 hover:bg-primary-50 text-primary-600 font-bold text-xs rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm transition-colors"
                  >
                    Open PFD Editor &rarr;
                  </button>
                </div>

                <div className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">P&ID Instrumentation Decoder</h3>
                    <p className="text-xs text-surface-500 mb-4">Interprets ANSI/ISA-5.1 tag naming conventions (e.g. TE = Temperature Element, TIC = Indicating Controller).</p>
                  </div>
                  <button 
                    onClick={() => navigate('/advanced/pfd-pid')}
                    className="w-full py-2.5 bg-white dark:bg-surface-900 hover:bg-primary-50 text-primary-600 font-bold text-xs rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm transition-colors"
                  >
                    View ISA Tag Reference &rarr;
                  </button>
                </div>

                <div className="p-6 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-surface-900 dark:text-white mb-2">Equipment Datasheet</h3>
                    <p className="text-xs text-surface-500 mb-4">Engineering design specifications for mechanical construction, metallurgy, and drive ratings.</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/advanced/industry/${industry.id}/equipment`)}
                    className="w-full py-2.5 bg-white dark:bg-surface-900 hover:bg-primary-50 text-primary-600 font-bold text-xs rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm transition-colors"
                  >
                    Browse Datasheets &rarr;
                  </button>
                </div>
              </div>
            </div>
          } />

          {/* TAB 17: MY INDUSTRY & STUDY PROGRESS */}
          <Route path="my-industry" element={
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" /> My Industry Study Dashboard
                </h2>
                <p className="text-surface-500 text-sm">Track your learning progress and review your saved technical notes for {industry.name}.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl">
                  <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-4">Learning Progress</h3>
                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between mb-1 text-surface-600">
                        <span>Processes Reviewed:</span>
                        <span className="font-bold text-primary-600">{industry.processes.length} / {industry.processes.length}</span>
                      </div>
                      <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full w-full"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 text-surface-600">
                        <span>Internship Days Completed:</span>
                        <span className="font-bold text-amber-600">{completedDays.length} / 7 Days</span>
                      </div>
                      <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(completedDays.length / 7) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-2">Engineer Study Notes</h3>
                    <p className="text-xs text-surface-500 mb-4">You have active study access to the complete {industry.name} industrial database.</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/advanced/industry/${industry.id}/internship`)}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                  >
                    Continue Virtual Internship &rarr;
                  </button>
                </div>
              </div>
            </div>
          } />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </div>
    </div>
  );
}
