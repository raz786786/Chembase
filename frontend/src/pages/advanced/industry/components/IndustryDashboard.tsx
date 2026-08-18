import { Routes, Route, NavLink, Navigate, useParams, useNavigate } from 'react-router-dom';
import { CORE_INDUSTRIES } from '../data/coreIndustries';
import { 
  ArrowLeft, LayoutTemplate, GitBranch, Activity, Box, 
  ThermometerSun, Sliders, Calculator, ShieldAlert, Leaf, 
  Settings, BrainCircuit, GraduationCap, Bot, Briefcase, 
  Users, FileText, Star, AlertTriangle, ChevronRight, Target
} from 'lucide-react';
import ProcessFlowViewer from './ProcessFlowViewer';
import { useState } from 'react';

export default function IndustryDashboard() {
  const { industryId } = useParams();
  const navigate = useNavigate();
  const [explanationLevel, setExplanationLevel] = useState('student');
  
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
      
      {/* Top Navigation & Settings */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('..')}
          className="flex items-center gap-2 text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Industries
        </button>

        {/* Explain Like a Student Toggle (Rule 24) */}
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1 border border-surface-200 dark:border-surface-700">
          {['beginner', 'student', 'advanced', 'interview'].map(lvl => (
            <button 
              key={lvl}
              onClick={() => setExplanationLevel(lvl)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize ${explanationLevel === lvl ? 'bg-white dark:bg-surface-900 text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-900'}`}
            >
              {lvl === 'student' ? 'Eng Student' : lvl}
            </button>
          ))}
        </div>
      </div>

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
              {industry.products.length === 0 && <span className="text-sm text-surface-500">Data pending.</span>}
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
              {industry.rawMaterials.length === 0 && <span className="text-sm text-surface-500">Data pending.</span>}
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
          
          {/* Rule 4: Overview */}
          <Route path="overview" element={
            <div className="p-8">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-6">Industry Overview</h2>
              <div className="prose dark:prose-invert max-w-none mb-8">
                <p><strong>Explain Level ({explanationLevel}):</strong> This mode tailors the technical depth of explanations throughout the module.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-surface-200 rounded-2xl">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-primary-500"/> Related Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {industry.relatedSubjects?.map(s => (
                      <span key={s.subjectId} className="px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg text-sm font-medium">{s.subjectId}</span>
                    )) || <span className="text-surface-500 text-sm">No subjects linked yet.</span>}
                  </div>
                </div>
              </div>
            </div>
          } />

          {/* Rule 5: Process Flow */}
          <Route path="process-flow" element={
            <div className="p-8 h-[700px] flex flex-col">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Interactive Process Flow</h2>
              <p className="text-surface-500 text-sm mb-6">Click on any process block to jump to its detailed operational parameters.</p>
              <div className="flex-1 min-h-0 bg-surface-50 rounded-xl">
                {industry.processes.length > 0 ? (
                  <ProcessFlowViewer processes={industry.processes} onProcessClick={(id) => navigate(`../processes/${id}`)} />
                ) : (
                  <div className="h-full flex items-center justify-center text-surface-400">Process flow data pending.</div>
                )}
              </div>
            </div>
          } />

          {/* Rule 6: Process Details */}
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
                        <h4 className="text-xs font-bold uppercase text-surface-500 mb-2">Typical Conditions (Rule 6)</h4>
                        {Object.entries(proc.typicalConditions).map(([k,v]) => (
                           <div key={k} className="flex justify-between text-sm">
                             <span className="text-surface-500">{k}</span>
                             <span className="font-mono">{v as string}</span>
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
                {industry.processes.length === 0 && <p className="text-surface-500">Data pending.</p>}
              </div>
            </div>
          } />
          
          {/* Rules 7-11: Equipment Library */}
          <Route path="equipment" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Box className="text-primary-500"/> Equipment Library</h2>
              <p className="text-surface-500 mb-8">Centralized database of equipment. Integrates directly with Lab Assistant and Subject Calculators.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stub equipment cards */}
                {['Shell & Tube Heat Exchanger', 'Centrifugal Pump', 'Distillation Column'].map(eq => (
                  <div key={eq} className="p-5 border border-surface-200 rounded-2xl hover:border-primary-500 transition-colors cursor-pointer group">
                    <h3 className="font-bold mb-2 group-hover:text-primary-600">{eq}</h3>
                    <div className="flex gap-2 text-[10px] uppercase font-bold text-surface-400 mb-4">
                      <span className="bg-surface-100 px-2 py-1 rounded">Lab Available</span>
                      <span className="bg-surface-100 px-2 py-1 rounded">Calculators</span>
                    </div>
                    <span className="text-sm text-primary-500 font-semibold flex items-center gap-1">View Profile <ChevronRight className="w-3 h-3"/></span>
                  </div>
                ))}
              </div>
            </div>
          } />
          
          {/* Rule 12: Operating Parameters */}
          <Route path="parameters" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ThermometerSun className="text-orange-500"/> Operating Parameters Matrix</h2>
              <div className="bg-surface-50 border border-surface-200 rounded-2xl p-6">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-surface-200">
                      <th className="pb-3 text-surface-500 font-bold">Parameter</th>
                      <th className="pb-3 text-surface-500 font-bold">Why it matters</th>
                      <th className="pb-3 text-surface-500 font-bold text-red-500">If Too High</th>
                      <th className="pb-3 text-surface-500 font-bold text-blue-500">If Too Low</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-surface-200/50">
                      <td className="py-3 font-semibold">Temperature</td>
                      <td className="py-3 text-surface-600">Reaction kinetics and yield</td>
                      <td className="py-3 text-surface-600">Thermal runaway, catalyst degradation</td>
                      <td className="py-3 text-surface-600">Poor conversion, phase separation</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold">Pressure</td>
                      <td className="py-3 text-surface-600">Gas phase concentration</td>
                      <td className="py-3 text-surface-600">Vessel rupture risk, high compression cost</td>
                      <td className="py-3 text-surface-600">Reduced reaction rate</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          } />
          
          {/* Rule 13: Process Control */}
          <Route path="control" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sliders className="text-blue-500"/> Process Control Loops</h2>
              <p className="text-surface-500 mb-6">Interactive PID control loop architectures for {industry.name}.</p>
              <div className="p-6 border border-surface-200 rounded-2xl bg-surface-50 flex items-center gap-4">
                <div className="flex-1 text-center p-4 bg-white border border-surface-200 rounded-xl font-bold">Temperature Sensor (TE)</div>
                <ArrowLeft className="text-surface-400"/>
                <div className="flex-1 text-center p-4 bg-white border border-primary-200 rounded-xl font-bold text-primary-600 border-2">PID Controller (TIC)</div>
                <ArrowLeft className="text-surface-400"/>
                <div className="flex-1 text-center p-4 bg-white border border-surface-200 rounded-xl font-bold">Control Valve (TV)</div>
              </div>
            </div>
          } />
          
          {/* Rule 14: Mass & Energy Analysis */}
          <Route path="mass-energy" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Calculator className="text-indigo-500"/> Mass & Energy Balances</h2>
              <div className="p-6 border border-surface-200 rounded-2xl bg-surface-50">
                <p className="text-surface-500 mb-4">Select a unit operation to perform a live material or energy balance utilizing existing ChemBase calculation engines.</p>
                <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-bold text-sm">Launch Calculation Engine</button>
              </div>
            </div>
          } />
          
          {/* Rule 18: Safety */}
          <Route path="safety" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ShieldAlert className="text-red-500"/> Safety & Hazards Matrix</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-red-200 bg-red-50/50 rounded-2xl">
                  <h3 className="font-bold text-red-700 mb-2">Chemical Hazards</h3>
                  <p className="text-sm text-red-600">Toxic gas leaks, corrosive material handling.</p>
                  <div className="mt-3 text-xs font-bold uppercase text-red-500">Required PPE: Respirator, Goggles</div>
                </div>
                <div className="p-5 border border-orange-200 bg-orange-50/50 rounded-2xl">
                  <h3 className="font-bold text-orange-700 mb-2">Thermal Hazards</h3>
                  <p className="text-sm text-orange-600">Extreme temperatures &gt; 1000°C.</p>
                  <div className="mt-3 text-xs font-bold uppercase text-orange-500">Required PPE: Aluminized Suit</div>
                </div>
              </div>
            </div>
          } />
          
          {/* Rule 19: Environment */}
          <Route path="environment" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Leaf className="text-green-500"/> Environmental Impact & Control</h2>
              <div className="p-6 border border-green-200 bg-green-50/30 rounded-2xl">
                <h3 className="font-bold text-green-800 mb-3">Emissions Profile</h3>
                <ul className="list-disc pl-5 text-sm text-green-700 space-y-1 mb-4">
                  <li>CO2 Emissions: High</li>
                  <li>NOx / SOx: Monitored via CEMS</li>
                  <li>Particulate Matter: Bag filters required</li>
                </ul>
                <button className="text-sm font-bold text-green-600 underline">View Emission Control Technologies</button>
              </div>
            </div>
          } />

          {/* Rule 15: Troubleshooting */}
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
                {industry.processes.flatMap(p => p.troubleshooting).length === 0 && <p className="text-surface-500">Data pending.</p>}
              </div>
            </div>
          } />

          {/* Rule 16: Challenges */}
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
                {industry.challenges.length === 0 && <p className="text-surface-500">Data pending.</p>}
              </div>
            </div>
          } />
          
          {/* Rule 22: Internship Mode */}
          <Route path="internship" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><GraduationCap className="text-purple-500"/> Virtual Internship & Simulator</h2>
              <p className="text-surface-500 mb-6">Complete a 7-day structured learning path and scenario simulations for {industry.name}.</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7].map(day => (
                  <div key={day} className={`p-4 border rounded-xl font-bold text-sm ${day === 1 ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 text-surface-400'}`}>
                    Day {day} {day === 1 && ' - In Progress'}
                  </div>
                ))}
              </div>
            </div>
          } />
          
          {/* Rule 23: Industry AI Tutor */}
          <Route path="tutor" element={
            <div className="p-8 h-[600px] flex flex-col">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Bot className="text-primary-500"/> Contextual AI Tutor</h2>
              <div className="flex-1 bg-surface-50 border border-surface-200 rounded-2xl p-6 flex flex-col justify-between">
                <div className="text-center text-surface-400 mt-10">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                  <p>I am trained on the complete PFDs, parameters, and troubleshooting guides for {industry.name}.</p>
                  <p className="text-xs mt-2">Example: "Why is a cyclone used here?"</p>
                </div>
                <div className="relative">
                  <input type="text" placeholder="Ask a technical question..." className="w-full p-4 rounded-xl border border-surface-300 shadow-sm" disabled />
                  <button className="absolute right-2 top-2 p-2 bg-primary-500 text-white rounded-lg disabled:opacity-50" disabled><ArrowLeft className="w-4 h-4 rotate-180"/></button>
                </div>
              </div>
            </div>
          } />
          
          {/* Rule 25: Industry Interview */}
          <Route path="interview" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Briefcase className="text-teal-500"/> Interview Simulator</h2>
              <p className="text-surface-500 mb-6">Dynamic questions covering Technical, Equipment, Troubleshooting, Safety, and HR.</p>
              <button className="px-6 py-3 bg-teal-500 text-white font-bold rounded-xl">Start Technical Interview</button>
            </div>
          } />
          
          {/* Rule 21: Careers */}
          <Route path="careers" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-pink-500"/> Careers in {industry.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 border border-surface-200 rounded-2xl">
                  <h3 className="font-bold text-primary-600 mb-2">Process Engineer</h3>
                  <ul className="text-sm space-y-1 text-surface-600 list-disc pl-4">
                    <li>Optimize energy consumption</li>
                    <li>Monitor material balances</li>
                    <li>Scale-up pilot operations</li>
                  </ul>
                </div>
                <div className="p-5 border border-surface-200 rounded-2xl">
                  <h3 className="font-bold text-primary-600 mb-2">HSE Engineer</h3>
                  <ul className="text-sm space-y-1 text-surface-600 list-disc pl-4">
                    <li>Conduct HAZOP analyses</li>
                    <li>Monitor environmental emissions</li>
                  </ul>
                </div>
              </div>
            </div>
          } />
          
          {/* Rule 26: Industrial Documents */}
          <Route path="documents" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText className="text-amber-500"/> Document Reading Room</h2>
              <p className="text-surface-500 mb-6">Learn to interpret standard industrial documentation.</p>
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-surface-100 border border-surface-200 rounded-lg font-bold text-sm hover:bg-white">PFD Tutorial</button>
                <button className="px-4 py-2 bg-surface-100 border border-surface-200 rounded-lg font-bold text-sm hover:bg-white">P&ID Decoder</button>
                <button className="px-4 py-2 bg-surface-100 border border-surface-200 rounded-lg font-bold text-sm hover:bg-white">Equipment Datasheets</button>
              </div>
            </div>
          } />
          
          {/* Rules 34 & 35: My Industry */}
          <Route path="my-industry" element={
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Star className="text-yellow-500"/> My Industry & Progress</h2>
              <div className="p-6 bg-surface-50 border border-surface-200 rounded-2xl mb-6">
                <h3 className="font-bold mb-2">Learning Progress</h3>
                <div className="w-full bg-surface-200 rounded-full h-2.5 mb-2"><div className="bg-primary-600 h-2.5 rounded-full" style={{width: '45%'}}></div></div>
                <p className="text-sm text-surface-500">45% Completed (Processes: 4/10, Equipment: 2/18)</p>
              </div>
              <h3 className="font-bold mb-3">Saved Bookmarks</h3>
              <p className="text-sm text-surface-500">No processes or equipment bookmarked yet.</p>
            </div>
          } />

        </Routes>
      </div>
    </div>
  );
}
