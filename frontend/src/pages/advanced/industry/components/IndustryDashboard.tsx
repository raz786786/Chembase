
import { useParams, useNavigate, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { CORE_INDUSTRIES } from '../data/coreIndustries';
import { ArrowLeft, LayoutTemplate, Activity, ShieldAlert, GitBranch, Settings, BrainCircuit, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
    { id: 'process-flow', label: 'Process Flow', icon: GitBranch },
    { id: 'processes', label: 'Processes', icon: Activity },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: Settings },
    { id: 'challenges', label: 'Challenges', icon: BrainCircuit },
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
                  <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold mt-1">Route: {p.productionRoute}</span>
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
                  <span className="text-[10px] text-accent-600 dark:text-accent-400 font-semibold mt-1">Enters at: {r.entryPoint}</span>
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
              `flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
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
            <div className="p-8 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">Chemical Engineering Careers in {industry.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {industry.roles.map(role => (
                    <div key={role.title} className="p-5 border border-surface-200 dark:border-surface-800 rounded-2xl">
                      <h3 className="font-bold text-primary-600 dark:text-primary-400 mb-3">{role.title}</h3>
                      <div className="text-sm space-y-3 text-surface-600 dark:text-surface-300">
                        <div>
                          <strong className="block text-surface-900 dark:text-white mb-1">Responsibilities:</strong>
                          <ul className="list-disc pl-5 space-y-1">{role.responsibilities.map(r => <li key={r}>{r}</li>)}</ul>
                        </div>
                        <div>
                          <strong className="block text-surface-900 dark:text-white mb-1">Key Skills:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {role.skills.map(s => <span key={s} className="px-2 py-0.5 bg-surface-100 dark:bg-surface-800 rounded text-[10px] uppercase font-bold">{s}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {industry.roles.length === 0 && <p className="text-sm text-surface-500">More role information coming soon.</p>}
                </div>
              </div>
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
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white">{proc.name}</h3>
                    </div>
                    
                    <p className="text-sm text-surface-600 dark:text-surface-300 mb-6 leading-relaxed">
                      <strong>Purpose:</strong> {proc.purpose}<br/>
                      <strong>Working Principle:</strong> {proc.workingPrinciple}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-3">Typical Conditions</h4>
                        <div className="space-y-2">
                          {Object.entries(proc.typicalConditions).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-sm">
                              <span className="text-surface-500">{k}</span>
                              <span className="font-mono font-semibold text-surface-900 dark:text-white">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-3">Hazards</h4>
                        <div className="space-y-3">
                          {proc.hazards.map(h => (
                            <div key={h.description} className="flex gap-2">
                              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <span className="font-semibold text-surface-900 dark:text-white block">{h.type}</span>
                                <span className="text-surface-500 text-xs">{h.description} - {h.precautions}</span>
                              </div>
                            </div>
                          ))}
                          {proc.hazards.length === 0 && <span className="text-sm text-surface-500">Standard operating hazards apply.</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          } />

          <Route path="processes/:procId" element={<Navigate to="../processes" replace />} />

          <Route path="troubleshooting" element={
            <div className="p-8">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Industrial Troubleshooter</h2>
              <p className="text-surface-500 text-sm mb-8">Select a symptom to see diagnostic steps and solutions.</p>

              <div className="space-y-6">
                {industry.processes.flatMap(p => p.troubleshooting.map(t => ({...t, procName: p.name}))).map(tcase => (
                  <div key={tcase.id} className="border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden">
                    <div className="bg-surface-50 dark:bg-surface-950 p-5 border-b border-surface-200 dark:border-surface-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-500">{tcase.procName}</span>
                      </div>
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" /> {tcase.symptom}
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Possible Causes</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-surface-600 dark:text-surface-300">
                          {tcase.possibleCauses.map(c => <li key={c}>{c}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Diagnostic Questions</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-surface-600 dark:text-surface-300">
                          {tcase.diagnosticQuestions.map(c => <li key={c}>{c}</li>)}
                        </ul>
                      </div>
                      <div className="md:col-span-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 rounded-xl">
                        <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Safety First</h4>
                        <p className="text-sm text-red-800 dark:text-red-300">{tcase.safetyConsiderations}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {industry.processes.every(p => p.troubleshooting.length === 0) && (
                  <p className="text-surface-500">No troubleshooting scenarios documented for this industry yet.</p>
                )}
              </div>
            </div>
          } />

          <Route path="challenges" element={
            <div className="p-8">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">Engineering Challenges</h2>
              <div className="space-y-8">
                {industry.challenges.map((challenge, idx) => (
                  <div key={challenge.id} className="bg-surface-50 dark:bg-surface-950 p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">{idx + 1}</div>
                      <h3 className="text-base font-bold text-surface-900 dark:text-white leading-relaxed">{challenge.scenario}</h3>
                    </div>
                    
                    <div className="space-y-3 mt-6">
                      {challenge.options.map((opt, i) => (
                        <div key={i} className="p-4 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-xl">
                          <p className="font-semibold text-surface-800 dark:text-surface-200 mb-2">{opt.text}</p>
                          <div className={`text-sm p-3 rounded-lg flex gap-2 ${opt.score > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                            {opt.score > 0 ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                            {opt.feedback}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-900/30 rounded-xl">
                      <h4 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Correct Engineering Approach</h4>
                      <p className="text-sm text-surface-700 dark:text-surface-300">{challenge.correctApproach}</p>
                    </div>
                  </div>
                ))}
                {industry.challenges.length === 0 && (
                  <p className="text-surface-500">More challenges coming soon.</p>
                )}
              </div>
            </div>
          } />

        </Routes>
      </div>

    </div>
  );
}
