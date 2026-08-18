import { Routes, Route, NavLink, Navigate, useParams, useNavigate } from 'react-router-dom';
import { CORE_INDUSTRIES } from '../data/coreIndustries';
import { 
  ArrowLeft, LayoutTemplate, GitBranch, Activity, Box, 
  ThermometerSun, Sliders, Calculator, ShieldAlert, Leaf, 
  Settings, BrainCircuit, GraduationCap, Bot, Briefcase, 
  Users, FileText, Star, AlertTriangle 
} from 'lucide-react';
import ProcessFlowViewer from './ProcessFlowViewer';

export default function IndustryDashboard() {
  const { industryId } = useParams();
  const navigate = useNavigate();
  
  const industry = CORE_INDUSTRIES.find(ind => ind.id === industryId);

  if (!industry) {
    return <div className="p-10 text-center">Industry not found. <button onClick={() => navigate('..')} className="text-primary-500 underline ml-2">Go back</button></div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutTemplate },
    { id: 'process-flow', label: 'Process Explorer', icon: GitBranch },
    { id: 'processes', label: 'Processes', icon: Activity },
    { id: 'equipment', label: 'Equipment Library', icon: Box },
    { id: 'parameters', label: 'Operating Parameters', icon: ThermometerSun },
    { id: 'control', label: 'Process Control', icon: Sliders },
    { id: 'mass-energy', label: 'Mass & Energy', icon: Calculator },
    { id: 'safety', label: 'Safety', icon: ShieldAlert },
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

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* Top Navigation */}
      <button 
        onClick={() => navigate('..')}
        className="flex items-center gap-2 text-surface-500 hover:text-surface-900 dark:hover:text-white mb-6 transition-colors text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Industries
      </button>

      {/* Header Dashboard Card */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 dark:bg-primary-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight mb-4 relative z-10">{industry.name}</h1>
        <p className="text-surface-500 dark:text-surface-400 max-w-4xl text-base leading-relaxed mb-8 relative z-10">{industry.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="bg-surface-50 dark:bg-surface-950 p-5 rounded-2xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4">Major Products</h3>
            <div className="space-y-4">
              {industry.products.map(p => (
                <div key={p.name} className="flex flex-col">
                  <span className="font-bold text-surface-900 dark:text-white text-sm mb-1">{p.name}</span>
                  <span className="text-xs text-surface-500 dark:text-surface-400">{p.purpose}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-50 dark:bg-surface-950 p-5 rounded-2xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4">Raw Materials</h3>
            <div className="space-y-4">
              {industry.rawMaterials.map(r => (
                <div key={r.name} className="flex flex-col">
                  <span className="font-bold text-surface-900 dark:text-white text-sm mb-1">{r.name}</span>
                  <span className="text-xs text-surface-500 dark:text-surface-400">{r.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-surface-100/50 dark:bg-surface-900/50 p-2 rounded-2xl border border-surface-200 dark:border-surface-800">
        {tabs.map(tab => (
          <NavLink
            key={tab.id}
            to={tab.id}
            className={({ isActive }) => 
              `flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-white dark:bg-surface-800 text-primary-600 dark:text-primary-400 shadow-sm border border-surface-200 dark:border-surface-700' 
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-surface-800/50 border border-transparent'
              }`
            }
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 min-h-[500px] shadow-sm overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="overview" replace />} />
          
          <Route path="overview" element={
            <div className="p-8">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Industry Overview</h2>
              <p className="text-surface-600 dark:text-surface-300">Select a tab above to explore this industry in detail.</p>
            </div>
          } />

          <Route path="process-flow" element={
            <div className="p-8 h-[700px] flex flex-col">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Interactive Process Flow</h2>
              <p className="text-surface-500 text-sm mb-6">Click on any process block to jump to its detailed operational parameters.</p>
              <div className="flex-1 min-h-0">
                <ProcessFlowViewer 
                  processes={industry.processes} 
                  onProcessClick={(id) => navigate(`../processes/${id}`)} 
                />
              </div>
            </div>
          } />

          <Route path="processes" element={
            <div className="p-8">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">Process Details</h2>
              <div className="space-y-6">
                {industry.processes.map(proc => (
                  <div key={proc.id} id={proc.id} className="p-6 border border-surface-200 dark:border-surface-800 rounded-2xl bg-surface-50 dark:bg-surface-950">
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">{proc.name}</h3>
                    <p className="text-sm text-surface-600 dark:text-surface-300 mb-4">{proc.workingPrinciple}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                        <h4 className="text-xs font-bold uppercase text-surface-500 mb-2">Typical Conditions</h4>
                        {Object.entries(proc.typicalConditions).map(([k,v]) => (
                           <div key={k} className="flex justify-between text-sm">
                             <span className="text-surface-500">{k}</span>
                             <span className="font-mono">{v}</span>
                           </div>
                        ))}
                      </div>
                      <div className="p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                         <h4 className="text-xs font-bold uppercase text-surface-500 mb-2">Hazards</h4>
                         {proc.hazards.map(h => (
                           <div key={h.description} className="text-sm mb-1">
                             <span className="font-semibold">{h.type}:</span> {h.description}
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />
          
          <Route path="equipment" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Equipment Library</h2><p className="text-surface-500">Centralized database of all equipment used in {industry.name}. Interconnects with Lab Assistant and Subjects.</p></div>} />
          
          <Route path="parameters" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Operating Parameters</h2><p className="text-surface-500">Critical parameters to monitor, why they matter, and what happens if they are too high or low.</p></div>} />
          
          <Route path="control" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Process Control</h2><p className="text-surface-500">Interactive PID control loops and strategies for key processes.</p></div>} />
          
          <Route path="mass-energy" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Mass & Energy Analysis</h2><p className="text-surface-500">Calculators for material and energy balances specific to {industry.name}.</p></div>} />
          
          <Route path="safety" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Process Safety & Hazards</h2><p className="text-surface-500">Chemical, thermal, and mechanical hazards along with required PPE and precautions.</p></div>} />
          
          <Route path="environment" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Environmental Impact</h2><p className="text-surface-500">Emissions, waste management, and control technologies (e.g. scrubbers, bag filters).</p></div>} />

          <Route path="troubleshooting" element={
            <div className="p-8">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Industrial Troubleshooter</h2>
              <div className="space-y-6 mt-6">
                {industry.processes.flatMap(p => p.troubleshooting.map(t => ({...t, procName: p.name}))).map(tcase => (
                  <div key={tcase.id} className="border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden p-5">
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-orange-500" /> {tcase.symptom}
                    </h3>
                    <p className="text-sm text-surface-600">Possible Solutions: {tcase.possibleSolutions?.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="challenges" element={
            <div className="p-8">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">Engineering Challenges</h2>
              <div className="space-y-8">
                {industry.challenges.map((challenge) => (
                  <div key={challenge.id} className="p-6 border border-surface-200 rounded-2xl">
                    <h3 className="font-bold mb-2">{challenge.scenario}</h3>
                    <p className="text-sm text-surface-500">{challenge.correctApproach}</p>
                  </div>
                ))}
              </div>
            </div>
          } />
          
          <Route path="internship" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Internship Mode</h2><p className="text-surface-500">Structured day-by-day learning path through the plant.</p></div>} />
          
          <Route path="tutor" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Industry AI Tutor</h2><p className="text-surface-500">Contextual AI assistant ready to answer questions about {industry.name}.</p></div>} />
          
          <Route path="interview" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Industry Interview Prep</h2><p className="text-surface-500">Dynamic technical and HR interview questions for Process Engineering roles.</p></div>} />
          
          <Route path="careers" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Chemical Engineering Careers</h2><p className="text-surface-500">Roles, responsibilities, and required skills in this industry.</p></div>} />
          
          <Route path="documents" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">Industrial Documents</h2><p className="text-surface-500">Learn to read PFDs, P&IDs, and equipment datasheets.</p></div>} />
          
          <Route path="my-industry" element={<div className="p-8"><h2 className="text-xl font-bold mb-4">My Industry</h2><p className="text-surface-500">Your saved equipment, processes, and learning progress.</p></div>} />

        </Routes>
      </div>
    </div>
  );
}
