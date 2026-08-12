import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Rocket, Lightbulb, FlaskConical, Microscope, TestTubes, ShieldAlert,
  BookOpen, FileText, Presentation, Filter, Target, HelpCircle, ListChecks,
  CheckCircle2, Plus, Trash2, Info, Layers, Network, CalendarDays, ClipboardList,
  Award, TrendingUp, Database, ScrollText, Leaf, Droplets, Pill
} from 'lucide-react';
import { CalcCard } from './SharedComponents';
import type { LucideIcon } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
      <Info className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{children}</p>
    </div>
  );
}

// ─── FYP idea bank ──────────────────────────────────────────────────────────
interface FypIdea {
  id: number; domain: string; title: string; problem: string; approach: string;
  tools: string[]; difficulty: 'Beginner' | 'Intermediate' | 'Advanced'; type: 'Experimental' | 'Simulation' | 'Hybrid';
}

const FYP_DOMAINS: { id: string; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'energy', label: 'Energy & Environment', icon: Leaf, color: '#16a34a' },
  { id: 'water', label: 'Water & Wastewater', icon: Droplets, color: '#06b6d4' },
  { id: 'materials', label: 'Materials & Polymers', icon: Layers, color: '#8b5cf6' },
  { id: 'bio', label: 'Bio & Pharma', icon: Pill, color: '#ec4899' },
  { id: 'process', label: 'Process Intensification', icon: FlaskConical, color: '#f59e0b' },
  { id: 'safety', label: 'Safety & Digitalisation', icon: ShieldAlert, color: '#ef4444' },
];
const FYP_IDEAS: FypIdea[] = [
  { id: 1, domain: 'energy', title: 'Biodiesel from Waste Cooking Oil', problem: 'Restaurant waste oil is dumped, polluting water and sewer lines. Pakistan imports most edible oil; waste-to-fuel cuts cost and imports.', approach: 'Collect waste oil, run acid-catalysed esterification then base-catalysed transesterification; optimise methanol:oil ratio, catalyst and time via response surface methodology.', tools: ['Buchner flask', 'Reflux condenser', 'GC / acid value test'], difficulty: 'Beginner', type: 'Experimental' },
  { id: 2, domain: 'energy', title: 'Biogas from Organic Farm Waste', problem: 'Farm waste emits methane to air and causes odour; villages lack clean cooking fuel.', approach: 'Build a lab-scale anaerobic digester; test C/N ratio, loading rate and temperature; measure biogas yield and methane fraction.', tools: ['Anaerobic digester', 'Water displacement setup', 'Gas chromatography'], difficulty: 'Beginner', type: 'Experimental' },
  { id: 3, domain: 'energy', title: 'Solar Thermal Distillation for Brackish Water', problem: 'Coastal villages lack potable water; solar stills are simple but inefficient.', approach: 'Design and test a stepped solar still with phase-change storage; compare productivity against a conventional basin still under local conditions.', tools: ['Solar still rig', 'Pyranometer', 'TDS meter'], difficulty: 'Intermediate', type: 'Hybrid' },
  { id: 4, domain: 'energy', title: 'CO2 Capture with Amine in a Packed Column', problem: 'Cement/fertilizer flue gas emits CO2; absorption is energy-hungry and needs local optimisation.', approach: 'Simulate MEA absorption in Aspen Plus; validate against a bench packed column; study lean-loading and reboiler duty trade-offs.', tools: ['Aspen Plus', 'Packed column', 'Gas analyser'], difficulty: 'Advanced', type: 'Hybrid' },
  { id: 5, domain: 'water', title: 'Low-Cost Biosand Water Filter', problem: 'Rural households drink untreated water; imported filters are unaffordable.', approach: 'Layer sand/gravel columns with a biolayer; test turbidity and coliform removal across flow rates; design for local fabrication.', tools: ['Filter columns', 'Turbidity meter', 'Coliform test kits'], difficulty: 'Beginner', type: 'Experimental' },
  { id: 6, domain: 'water', title: 'Phytoremediation of Industrial Effluent', problem: 'Textile effluent heavy metals reach streams; chemical treatment is costly for small units.', approach: 'Grow water hyacinth / duckweed in synthetic effluent; measure heavy-metal uptake over time; model a wetland design.', tools: ['Constructed wetland pots', 'AAS', 'pH/conductivity meter'], difficulty: 'Beginner', type: 'Experimental' },
  { id: 7, domain: 'water', title: 'Forward Osmosis for RO Brine Concentration', problem: 'RO plants discharge brine; concentrate disposal is an environmental and cost problem.', approach: 'Build a lab FO cell with draw solutes; compare flux and reverse salt flux; evaluate brine volume reduction.', tools: ['FO membrane cell', 'Draw solute salts', 'Conductivity meter'], difficulty: 'Advanced', type: 'Experimental' },
  { id: 8, domain: 'water', title: 'Rainwater Harvesting & Treatment System', problem: 'Urban water scarcity with monsoon flooding; harvested water is underused.', approach: 'Design a rooftop harvesting + sand/charcoal filtration + storage system for a campus building; simulate annual yield from rainfall data.', tools: ['Rainfall data', 'Filtration rig', 'Water quality tests'], difficulty: 'Beginner', type: 'Hybrid' },
  { id: 9, domain: 'materials', title: 'Bioplastic from Banana Peel Starch', problem: 'Single-use plastic waste is rampant; starch-based films are biodegradable but brittle.', approach: 'Extract starch from peels, cast films with glycerol plasticiser; test tensile strength, solubility and degradation rate.', tools: ['Film casting', 'Tensile tester', 'Moisture analyser'], difficulty: 'Beginner', type: 'Experimental' },
  { id: 10, domain: 'materials', title: 'Fly-Ash Geopolymer Concrete', problem: 'Coal plants produce fly ash that is landfilled; cement production is CO2-heavy.', approach: 'Mix fly ash with alkaline activators; cure at room/oven temperature; test compressive strength vs cement control at 7/28 days.', tools: ['Moulds', 'Compression tester', 'Alkali solutions'], difficulty: 'Intermediate', type: 'Experimental' },
  { id: 11, domain: 'materials', title: 'Recycled PET into Composite Panels', problem: 'PET bottles litter the environment; recycling into value-added panels is underdeveloped locally.', approach: 'Shred PET, hot-press with sand or rice husk into panels; test density, flexural strength and water absorption.', tools: ['Shredder', 'Hot press', 'Flexural tester'], difficulty: 'Intermediate', type: 'Experimental' },
  { id: 12, domain: 'materials', title: 'Polymer Membrane for Water Purification', problem: 'Cheap membranes are needed for filtration in low-resource settings.', approach: 'Cast PVDF/PES membranes by phase inversion; vary polymer concentration; test flux, rejection and fouling.', tools: ['Casting knife', 'Phase inversion bath', 'Dead-end filtration cell'], difficulty: 'Advanced', type: 'Experimental' },
  { id: 13, domain: 'bio', title: 'Antibacterial Activity of Plant Extracts', problem: 'Antimicrobial resistance grows; herbal extracts are a low-cost candidate source.', approach: 'Extract neem/tulsi compounds by solvent extraction; test zones of inhibition against E. coli and S. aureus; isolate active fractions.', tools: ['Rotary evaporator', 'Agar plates', 'Incubator'], difficulty: 'Beginner', type: 'Experimental' },
  { id: 14, domain: 'bio', title: 'Fermentation of Agro-Waste to Ethanol', problem: 'Molasses/fruit waste is underutilised; bioethanol demand grows.', approach: 'Hydrolyse waste, ferment with yeast, distil; study sugar concentration, pH and fermentation time on yield.', tools: ['Fermenter flask', 'Distillation', 'Refractometer'], difficulty: 'Beginner', type: 'Experimental' },
  { id: 15, domain: 'bio', title: 'Algae Cultivation for Lipid Extraction', problem: 'Microalgae promise biofuel without competing for farmland but need local optimisation.', approach: 'Grow chlorella in photobioreactors; vary light, CO2 and nutrients; extract lipids for biodiesel potential.', tools: ['Photobioreactor', 'Spectrophotometer', 'Soxhlet extraction'], difficulty: 'Intermediate', type: 'Hybrid' },
  { id: 16, domain: 'bio', title: 'Drug Release Kinetics of Hydrogel Beads', problem: 'Controlled drug delivery needs predictable release; formulation science is a hot pharma skill.', approach: 'Prepare alginate beads with model drug; test release in simulated fluids; fit zero/first-order and Higuchi models.', tools: ['Extrusion setup', 'UV-Vis', 'Dissolution bath'], difficulty: 'Advanced', type: 'Experimental' },
  { id: 17, domain: 'process', title: 'Microwave-Assisted Extraction of Essential Oils', problem: 'Conventional extraction is slow and solvent-hungry; microwave intensification is under-studied locally.', approach: 'Compare microwave vs Soxhlet extraction of citrus/rosemary oil; optimise power, time and solvent ratio; compare yields and quality.', tools: ['Microwave reactor', 'Soxhlet', 'GC-MS'], difficulty: 'Intermediate', type: 'Experimental' },
  { id: 18, domain: 'process', title: 'Heat Exchanger Fouling Study', problem: 'Fouling costs plants millions in energy penalties; data-driven models can predict cleaning cycles.', approach: 'Run a lab exchanger with scaling-prone water; measure U over time; fit a fouling growth model; propose cleaning schedule.', tools: ['Lab heat exchanger', 'Data logger', 'Excel/Python model'], difficulty: 'Intermediate', type: 'Hybrid' },
  { id: 19, domain: 'process', title: 'Distillation Column Optimisation via Simulation', problem: 'Refineries run columns off-optimum; tray-by-tray simulation can find energy savings.', approach: 'Model a real column in Aspen Plus / DWSIM; validate against plant data; optimise feed stage and reflux for minimum duty.', tools: ['Aspen Plus / DWSIM', 'Plant data', 'Optimisation solver'], difficulty: 'Advanced', type: 'Simulation' },
  { id: 20, domain: 'process', title: 'Reactive Distillation for Ester Production', problem: 'Conventional reactor + column trains are capital-heavy; reactive distillation combines them.', approach: 'Simulate methyl acetate production by reactive distillation; compare against conventional flowsheet on energy and yield.', tools: ['Aspen Plus', 'Kinetics data', 'Sensitivity analysis'], difficulty: 'Advanced', type: 'Simulation' },
  { id: 21, domain: 'safety', title: 'HAZOP Study of a Fertilizer Unit (Case Study)', problem: 'Safety studies are paperwork-light in many plants; a rigorous HAZOP is a valuable engineering skill.', approach: 'Take a real urea/ammonia process section; build P&ID-based HAZOP worksheets; quantify risks with a matrix; propose safeguards.', tools: ['P&IDs', 'HAZOP worksheets', 'Risk matrix'], difficulty: 'Beginner', type: 'Simulation' },
  { id: 22, domain: 'safety', title: 'Dust Explosion Risk Assessment of a Grain Plant', problem: 'Grain silos have periodic dust explosions; hazard zoning is often informal.', approach: 'Measure dust characteristics (Kst, Pmax) in a 20-L sphere; classify zones; map ATEX requirements across the plant.', tools: ['20-L explosion sphere', 'Dust analyser', 'ATEX zoning'], difficulty: 'Intermediate', type: 'Experimental' },
  { id: 23, domain: 'safety', title: 'Machine Learning for Process Fault Detection', problem: 'Plants detect faults late; ML on historical data can flag anomalies early.', approach: 'Collect normal/fault process data (real or simulated); train classifiers (SVM/random forest); build an early-warning dashboard.', tools: ['Python', 'scikit-learn', 'Plant historian data'], difficulty: 'Advanced', type: 'Simulation' },
  { id: 24, domain: 'safety', title: 'Emergency Response Plan for a Chemical Store', problem: 'Small chemical stores lack validated emergency plans; drills are rare.', approach: 'Map the store inventory (SDS-based), model worst-case release scenarios (ALOHA/PHAST), write and test an ERP with local responders.', tools: ['SDS database', 'ALOHA/PHAST', 'Response checklists'], difficulty: 'Intermediate', type: 'Hybrid' },
];
// ─── Idea Lab: filter the curated bank ──────────────────────────────────────
function IdeaLabTab() {
  const [dom, setDom] = useState('all');
  const [diff, setDiff] = useState('All');
  const [typ, setTyp] = useState('All');
  const [qry, setQry] = useState('');
  const [sel, setSel] = useState<number | null>(null);
  const ideas = FYP_IDEAS.filter(i =>
    (dom === 'all' || i.domain === dom) &&
    (diff === 'All' || i.difficulty === diff) &&
    (typ === 'All' || i.type === typ) &&
    (i.title.toLowerCase().includes(qry.toLowerCase()) || i.problem.toLowerCase().includes(qry.toLowerCase()))
  );
  const selIdea = FYP_IDEAS.find(i => i.id === sel);
  const selCls = 'px-3 py-2 rounded-xl text-xs font-black bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500';
  const diffColor = (d: string) => d === 'Beginner' ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300' : d === 'Intermediate' ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-300' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300';
  const typColor = (t: string) => t === 'Simulation' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300' : t === 'Experimental' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-accent-500" /> FYP Idea Lab
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">24 curated, locally-grounded project ideas — each with the problem, the approach and the tools. Click one to draft its research questions.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: 'all', label: 'All domains', icon: Filter }, ...FYP_DOMAINS].map(d => (
          <button key={d.id} onClick={() => setDom(d.id)}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all ${dom === d.id ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-lg shadow-accent-500/25' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400'}`}>
            {d.id !== 'all' ? <d.icon className="w-3.5 h-3.5" /> : null} {d.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <select className={selCls} value={diff} onChange={e => setDiff(e.target.value)}>
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map(d => <option key={d}>{d}</option>)}
        </select>
        <select className={selCls} value={typ} onChange={e => setTyp(e.target.value)}>
          {['All', 'Experimental', 'Simulation', 'Hybrid'].map(t => <option key={t}>{t}</option>)}
        </select>
        <input className={`${selCls} flex-1 min-w-[200px]`} placeholder="Search ideas…" value={qry} onChange={e => setQry(e.target.value)} />
        <span className="text-[10px] font-black text-surface-400 self-center">{ideas.length} ideas</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {ideas.map(i => (
          <button key={i.id} onClick={() => setSel(i.id)}
            className={`rounded-2xl border p-5 text-left transition-all ${sel === i.id ? 'border-accent-500 ring-2 ring-accent-500/20 bg-accent-50 dark:bg-accent-900/10' : 'border-surface-200 dark:border-surface-800 hover:border-accent-400 hover:shadow-lg hover:shadow-accent-500/5'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${diffColor(i.difficulty)}`}>{i.difficulty}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${typColor(i.type)}`}>{i.type}</span>
              <span className="ml-auto text-[9px] font-black text-surface-400">{FYP_DOMAINS.find(d => d.id === i.domain)?.label}</span>
            </div>
            <p className="text-sm font-black text-surface-800 dark:text-surface-50 mb-1">{i.title}</p>
            <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-relaxed mb-3">{i.problem}</p>
            <div className="flex flex-wrap gap-1.5">
              {i.tools.map(t => <span key={t} className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[9px] font-bold text-surface-500 dark:text-surface-400">{t}</span>)}
            </div>
          </button>
        ))}
        {ideas.length === 0 && <p className="text-xs text-surface-400 py-10 text-center col-span-2">No ideas match those filters.</p>}
      </div>
      {selIdea && (
        <CalcCard title={`Research questions for: ${selIdea.title}`} icon={HelpCircle}>
          <ul className="space-y-2">
            {[`Which combination of ${selIdea.tools.join(', ')} gives the most repeatable and measurable results for ${selIdea.title.toLowerCase()}?`, `What is the optimum set of process variables that maximises performance of the ${selIdea.title.toLowerCase()} system?`, `How does the proposed ${selIdea.type.toLowerCase()} approach compare with conventional practice on cost and sustainability?`].map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-surface-600 dark:text-surface-300">
                <Target className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> {q}
              </li>
            ))}
          </ul>
          <InfoNote>Generate your own ideas too: pick a local problem (energy cost, waste, water, safety), invert it into a research question, and always scope it to what a final-year lab can actually measure or simulate.</InfoNote>
        </CalcCard>
      )}
    </>
  );
}

// ─── Problem Canvas: guided problem identification ──────────────────────────
function ProblemCanvasTab() {
  const [topic, setTopic] = useState('Biodiesel from waste cooking oil');
  const [why, setWhy] = useState('Waste oil currently pollutes drains and is not monetised.');
  const [who, setWho] = useState('Restaurants, edible-oil importers, local municipalities.');
  const [gap, setGap] = useState('No local optimisation of the transesterification process has been published for this feedstock.');
  const [rq, setRq] = useState('What methanol-to-oil ratio, catalyst loading and reaction time maximise biodiesel yield from waste cooking oil?')
  const [hyp, setHyp] = useState('A 6:1 methanol:oil ratio with 1% KOH at 60 °C for 90 minutes will achieve ≥ 94% yield.');
  const inputCls = 'w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500';
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1 block';
  const qbox = (label: string, prompt: string, v: string, s: (x: string) => void) => (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
      <label className={labelCls}>{label}</label>
      <p className="text-[10px] text-surface-400 italic mb-2">{prompt}</p>
      <textarea rows={2} className={inputCls} value={v} onChange={e => s(e.target.value)} />
    </div>
  );
  const rqIsGood = rq.split(' ').length >= 8 && rq.includes('?');
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <Target className="w-6 h-6 text-accent-500" /> Problem Canvas
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Turn a vague interest into a sharp, defensible research question and hypothesis.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {qbox('Broad topic', 'One line about your interest.', topic, setTopic)}
        {qbox('Why now?', 'What is the pain, cost or risk right now?', why, setWhy)}
        {qbox('Who is affected?', 'Stakeholders who feel the problem.', who, setWho)}
        {qbox('What is the knowledge gap?', 'What has NOT been published or solved?', gap, setGap)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <CalcCard title="Research question" icon={HelpCircle}>
          <textarea rows={3} className={inputCls} value={rq} onChange={e => setRq(e.target.value)} />
          <div className={`mt-3 rounded-xl p-3 text-[11px] font-bold ${rqIsGood ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800' : 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800'}`}>
            {rqIsGood ? '✓ Good research question — specific, measurable and ends with a ?' : 'Tip: make it specific and measurable — name the variables and the outcome. End with a question mark.'}
          </div>
        </CalcCard>
        <CalcCard title="Hypothesis + SMART objectives" icon={ClipboardList}>
          <label className={labelCls}>Hypothesis</label>
          <textarea rows={2} className={inputCls} value={hyp} onChange={e => setHyp(e.target.value)} />
          <ul className="mt-3 space-y-1.5 text-[11px] text-surface-600 dark:text-surface-300">
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Specific:</b> one process, one feedstock</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Measurable:</b> a number (yield %, removal %, U value)</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Achievable:</b> fits your lab and semester</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Relevant:</b> matters to the stakeholder</li>
            <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> <b>Time-bound:</b> done by the defense date</li>
          </ul>
        </CalcCard>
      </div>
      <InfoNote>Assist, do not fabricate: ChemBase helps you structure your own work — the experiments, data and writing must be yours. If you copy-paste this text into your report, that is plagiarism.</InfoNote>
    </>
  );
}
// ─── Methodology Planner: experimental design + simulation plan ─────────────
function MethodologyTab() {
  const [mode, setMode] = useState('experimental');
  const [factors, setFactors] = useState('Methanol:oil ratio (3:1–9:1), Catalyst loading (0.5–1.5%), Temperature (50–65 °C)');
  const [levels, setLevels] = useState('3 levels each → factorial or RSM design');
  const [response, setResponse] = useState('Biodiesel yield (%) and viscosity (cSt)');
  const [reps, setReps] = useState('3 replicates per run');
  const [software, setSoftware] = useState('Aspen Plus / DWSIM');
  const [modelType, setModelType] = useState('Steady-state equilibrium (RadFrac for the column)');
  const [assumptions, setAssumptions] = useState('Ideal gas, constant pressure drop, 85% column efficiency');
  const [validation, setValidation] = useState('Compare simulated product purity vs. 3 published plant data points');
  const inputCls = 'w-full px-3 py-2 rounded-xl text-xs font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500';
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1 block';
  const field = (label: string, v: string, s: (x: string) => void, ph?: string) => (
    <div className="mb-3"><label className={labelCls}>{label}</label><textarea rows={2} className={inputCls} placeholder={ph} value={v} onChange={e => s(e.target.value)} /></div>
  );
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-accent-500" /> Methodology Planner
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Structure your experimental design or simulation plan before touching the lab or keyboard.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: 'experimental', label: 'Experimental', icon: TestTubes }, { id: 'simulation', label: 'Simulation', icon: Database }, { id: 'lit', label: 'Literature matrix', icon: BookOpen }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${mode === m.id ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-lg shadow-accent-500/25' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400'}`}>
            <m.icon className="w-4 h-4" /> {m.label}
          </button>
        ))}
      </div>
      {mode === 'experimental' && (
        <div className="grid md:grid-cols-2 gap-6">
          <CalcCard title="Design of Experiments" icon={Microscope}>
            {field('Independent variables (factors)', factors, setFactors, 'Which variables you will change')}
            {field('Levels / design type', levels, setLevels, 'Full factorial, fractional, RSM…')}
            {field('Response variables', response, setResponse, 'What you measure')}
            {field('Replicates & controls', reps, setReps, 'How many repeats, what baseline')}
          </CalcCard>
          <CalcCard title="Checklist before you start" icon={ListChecks}>
            <ul className="space-y-2 text-[11px] text-surface-600 dark:text-surface-300">
              {['Materials & chemicals received and stored per SDS', 'Equipment calibrated (balance, pH meter, thermometer)', 'Safety review done — MSDS, PPE, ventilation', 'Blank/control runs defined', 'Data sheet ready (date, run #, variables, results)', 'Budget for consumables confirmed', 'Supervisor sign-off on the procedure'].map((c, i) => (
                <li key={i} className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> {c}</li>
              ))}
            </ul>
            <div className="rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 p-3 mt-4">
              <p className="text-[11px] font-bold text-accent-700 dark:text-accent-300">Typical run count: 3 factors × 3 levels × 3 reps = 27 runs ≈ 2-3 lab weeks.</p>
            </div>
          </CalcCard>
        </div>
      )}
      {mode === 'simulation' && (
        <div className="grid md:grid-cols-2 gap-6">
          <CalcCard title="Simulation plan" icon={Database}>
            {field('Software', software, setSoftware, 'Aspen Plus, DWSIM, COMSOL, Python…')}
            {field('Model type & key blocks', modelType, setModelType, 'Steady-state, equilibrium, RadFrac…')}
            {field('Assumptions', assumptions, setAssumptions, 'Ideal gas, efficiency, no heat loss…')}
            {field('Validation strategy', validation, setValidation, 'Compare with plant data or literature')}
          </CalcCard>
          <CalcCard title="Simulation workflow" icon={Network}>
            <ol className="space-y-2 text-[11px] text-surface-600 dark:text-surface-300">
              {['Define scope: feed, products, constraints', 'Draw the flowsheet with the right property package', 'Add components + methods (e.g. NRTL, Peng-Robinson)', 'Converge base case — fix warnings one by one', 'Validate against real data before optimising', 'Sensitivity analysis on the variables that matter', 'Document every assumption for the report'].map((s, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span> {s}</li>
              ))}
            </ol>
          </CalcCard>
        </div>
      )}
      {mode === 'lit' && <LiteratureMatrix />}
      <InfoNote>Every methodology decision maps back to your research question: if a variable is not in your question, it probably does not belong in your design.</InfoNote>
    </>
  );
}

// ─── Literature matrix: organise papers you have read ───────────────────────
interface LitRow { id: number; cite: string; problem: string; method: string; finding: string; gap: string; }

function LiteratureMatrix() {
  const [rows, setRows] = useState<LitRow[]>([
    { id: 1, cite: 'Khan et al. (2021), Fuel', problem: 'Waste oil transesterification yields vary', method: 'Central composite design, 6:1 ratio', finding: '94% yield at 60 °C, 1% KOH', gap: 'No local feedstock study' },
    { id: 2, cite: 'Ali & Raza (2022), Energy Reports', problem: 'Catalyst recovery is costly', method: 'Heterogeneous CaO catalyst', finding: 'Reusable 5 cycles, 91% yield', gap: 'Long reaction time not studied' },
  ]);
  const add = () => setRows(prev => [...prev, { id: Math.max(0, ...prev.map(r => r.id)) + 1, cite: '', problem: '', method: '', finding: '', gap: '' }]);
  const edit = (id: number, k: keyof LitRow, v: string) => setRows(prev => prev.map(r => (r.id === id ? { ...r, [k]: v } : r)));
  const del = (id: number) => setRows(prev => prev.filter(r => r.id !== id));
  const cols: { k: keyof LitRow; label: string }[] = [
    { k: 'cite', label: 'Citation' }, { k: 'problem', label: 'Problem addressed' }, { k: 'method', label: 'Method' }, { k: 'finding', label: 'Key finding' }, { k: 'gap', label: 'Gap → your angle' },
  ];
  return (
    <CalcCard title={`Literature matrix · ${rows.length} papers`} icon={BookOpen}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-800">
              {cols.map(c => <th key={c.k} className="py-2 pr-3 font-black text-surface-400 uppercase tracking-widest">{c.label}</th>)}
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-surface-100 dark:border-surface-800/50">
                {cols.map(c => (
                  <td key={c.k} className="py-1.5 pr-3">
                    <input className="w-40 md:w-48 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-1 focus:ring-accent-500" value={String(r[c.k])} onChange={e => edit(r.id, c.k, e.target.value)} />
                  </td>
                ))}
                <td className="py-1.5">
                  <button onClick={() => del(r.id)} className="text-surface-400 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={add} className="mt-4 px-3 py-2 rounded-xl text-xs font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all shadow-lg shadow-accent-500/25 flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" /> Add paper
      </button>
      <p className="text-[10px] text-surface-400 mt-3">The last column is your gold: every gap you record is a candidate research angle for the introduction and discussion.</p>
    </CalcCard>
  );
}
// ─── Report Studio: report structure + presentation outline ────────────────
const REPORT_CHAPTERS = [
  { ch: 1, title: 'Introduction', weeks: '2', words: '800-1,200', what: 'Background, problem statement, research questions, objectives, scope and thesis outline.' },
  { ch: 2, title: 'Literature Review', weeks: '3-4', words: '2,000-3,000', what: 'State of the art, key studies (cite your matrix!), research gap and how your work fills it.' },
  { ch: 3, title: 'Methodology', weeks: '2', words: '1,500-2,500', what: 'Materials, equipment, experimental design or simulation setup, data collection plan, safety.' },
  { ch: 4, title: 'Results & Discussion', weeks: '4-6', words: '2,500-4,000', what: 'Present data (tables/figures), analyse trends, compare with literature, discuss anomalies.' },
  { ch: 5, title: 'Conclusion & Recommendations', weeks: '1', words: '600-1,000', what: 'Answer each research question explicitly; limitations; future work and recommendations.' },
  { ch: 6, title: 'References & Appendices', weeks: '1', words: 'n/a', what: 'Consistent citation style; raw data, sample calculations, P&IDs, code listings.' },
];

const PRESENTATION_SLIDES = [
  { n: 1, title: 'Title slide', secs: 15, what: 'Project title, names, supervisor, university' },
  { n: 2, title: 'Motivation & problem', secs: 45, what: 'The pain, the cost, the stakeholders — one clear story' },
  { n: 3, title: 'Objectives & research questions', secs: 45, what: '2-3 objectives max, mapped to your questions' },
  { n: 4, title: 'Methodology', secs: 60, what: 'Diagram + key variables; not every lab detail' },
  { n: 5, title: 'Key results (2-3 slides)', secs: 120, what: 'Best figures only; one message per slide' },
  { n: 6, title: 'Discussion / comparison', secs: 45, what: 'Your results vs literature; why they differ' },
  { n: 7, title: 'Conclusion & future work', secs: 30, what: 'Answer the questions; what next' },
  { n: 8, title: 'Q&A + thank you', secs: 30, what: 'Prepared backup slides for likely questions' },
];

const DEFENSE_QUESTIONS = [
  'Why did you choose this particular feedstock / process / software?',
  'What is the main contribution of your work?',
  'What are the limitations, and how would you improve the study?',
  'How do your results compare with published data?',
  'Which variable had the biggest effect and how do you know?',
  'What would you do differently with unlimited time and budget?',
  'Explain one calculation from your methodology from first principles.',
  'How does your work apply to industry?',
];

function ReportStudioTab() {
  const [view, setView] = useState('report');
  const [totalWords, setTotalWords] = useState('8,000');
  const parseWords = (w: string) => w === 'n/a' ? null : w.split('-').map(x => parseInt(x.replace(/[^0-9]/g, ''), 10));
  const [sumMin, sumMax] = REPORT_CHAPTERS.reduce<[number, number]>(([mn, mx], c) => {
    const p = parseWords(c.words);
    return p ? [mn + p[0], mx + (p[1] ?? p[0])] : [mn, mx];
  }, [0, 0]);
  const tgt = parseInt(totalWords.replace(/[^0-9]/g, ''), 10) || 0;
  const inBudget = tgt > 0 && tgt >= sumMin && tgt <= sumMax;
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <FileText className="w-6 h-6 text-accent-500" /> Report Studio
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Chapter-by-chapter report structure and a slide-by-slide defense presentation.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: 'report', label: 'Report structure', icon: ScrollText }, { id: 'slides', label: 'Presentation', icon: Presentation }, { id: 'defense', label: 'Defense prep', icon: Award }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${view === v.id ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-lg shadow-accent-500/25' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400'}`}>
            <v.icon className="w-4 h-4" /> {v.label}
          </button>
        ))}
      </div>
      {view === 'report' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-surface-400">Target length (words):</label>
            <input className="px-3 py-2 rounded-xl text-xs font-black bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500 w-32" value={totalWords} onChange={e => setTotalWords(e.target.value)} />
            <span className={`text-[10px] font-bold ${inBudget ? 'text-accent-600 dark:text-accent-400' : 'text-accent-600 dark:text-accent-400'}`}>
              {inBudget ? `✓ fits the ${sumMin.toLocaleString()}–${sumMax.toLocaleString()} word chapter budget` : `Chapter budget is ${sumMin.toLocaleString()}–${sumMax.toLocaleString()} words — aim inside it`}
            </span>
          </div>
          <div className="space-y-3">
            {REPORT_CHAPTERS.map(c => (
              <div key={c.ch} className="grid md:grid-cols-[60px_180px_100px_1fr] gap-3 rounded-xl border border-surface-200 dark:border-surface-800 p-4 hover:border-accent-400 transition-all">
                <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 font-black flex items-center justify-center text-sm">{c.ch}</div>
                <div>
                  <p className="text-xs font-black text-surface-800 dark:text-surface-50">Chapter {c.ch}</p>
                  <p className="text-[10px] text-surface-400">{c.title}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-surface-400 uppercase">{c.weeks} wks</p>
                  <p className="text-[10px] font-bold text-accent-600 dark:text-accent-400">{c.words} words</p>
                </div>
                <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-relaxed">{c.what}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {view === 'slides' && (
        <div className="grid md:grid-cols-2 gap-4">
          {PRESENTATION_SLIDES.map(s => (
            <div key={s.n} className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 hover:border-accent-400 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-lg bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 text-[9px] font-black">{s.n}</span>
                <p className="text-xs font-black text-surface-800 dark:text-surface-50">{s.title}</p>
                <span className="ml-auto text-[9px] font-black text-surface-400">~{s.secs}s</span>
              </div>
              <p className="text-[11px] text-surface-500 dark:text-surface-400">{s.what}</p>
            </div>
          ))}
          <div className="rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 p-4 md:col-span-2">
            <p className="text-[11px] font-bold text-accent-700 dark:text-accent-300">Total ≈ 6.5 minutes of talking — perfect for a 10-minute slot with Q&A. Practice with a real timer twice before the defense.</p>
          </div>
        </div>
      )}
      {view === 'defense' && (
        <CalcCard title="Likely defense questions" icon={Award}>
          <ul className="space-y-2">
            {DEFENSE_QUESTIONS.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-surface-600 dark:text-surface-300">
                <HelpCircle className="w-3.5 h-3.5 text-accent-500 flex-shrink-0 mt-0.5" /> {q}
              </li>
            ))}
          </ul>
          <InfoNote>Prepare answers for these BEFORE the defense. Rehearse aloud, time yourself, and have one backup slide ready for the limitation question.</InfoNote>
        </CalcCard>
      )}
    </>
  );
}
// ─── Timeline planner: semester phases with progress ────────────────────────
interface Phase { id: number; name: string; weeks: string; tasks: string; done: boolean; }

const DEFAULT_PHASES: Phase[] = [
  { id: 1, name: 'Topic & supervisor', weeks: 'W1-2', tasks: 'Pick domain, shortlist ideas, meet supervisor, freeze title', done: false },
  { id: 2, name: 'Proposal', weeks: 'W3-4', tasks: 'Problem statement, research questions, initial methodology', done: false },
  { id: 3, name: 'Literature review', weeks: 'W3-6', tasks: 'Read 15-25 papers, build the literature matrix, draft Ch.2', done: false },
  { id: 4, name: 'Methodology finalised', weeks: 'W6-7', tasks: 'Freeze design/software, order materials, get safety sign-off', done: false },
  { id: 5, name: 'Experiments / simulation', weeks: 'W8-13', tasks: 'Run trials, collect data, log everything, troubleshoot', done: false },
  { id: 6, name: 'Analysis', weeks: 'W13-15', tasks: 'Statistical analysis, plots, compare with literature', done: false },
  { id: 7, name: 'Report writing', weeks: 'W14-17', tasks: 'Write Ch.3-4 as you go, then Ch.1-2, then Ch.5', done: false },
  { id: 8, name: 'Defense prep', weeks: 'W17-18', tasks: 'Slides, rehearse aloud, prepare backup slides, final edit', done: false },
];

function TimelineTab() {
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES);
  const toggle = (id: number) => setPhases(prev => prev.map(p => (p.id === id ? { ...p, done: !p.done } : p)));
  const done = phases.filter(p => p.done).length;
  const pct = Math.round((done / phases.length) * 100);
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-surface-800 dark:text-surface-50 flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-accent-500" /> Semester Timeline
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">A realistic 18-week FYP plan. Tick phases as you complete them.</p>
      </div>
      <CalcCard title={`Overall progress: ${pct}%`} icon={TrendingUp}>
        <div className="h-3 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden mb-6">
          <div className={`h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-500 transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-2">
          {phases.map(p => (
            <button key={p.id} onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${p.done ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/10' : 'border-surface-200 dark:border-surface-800 hover:border-accent-400'}`}>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${p.done ? 'bg-accent-500 text-surface-50' : 'bg-surface-100 dark:bg-surface-800 text-surface-400'}`}>
                {p.done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px] font-black">{p.id}</span>}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-black ${p.done ? 'text-accent-700 dark:text-accent-300 line-through' : 'text-surface-800 dark:text-surface-50'}`}>{p.name}</p>
                  <span className="px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[9px] font-black text-surface-400">{p.weeks}</span>
                </div>
                <p className="text-[10px] text-surface-400 mt-0.5">{p.tasks}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setPhases(prev => prev.map(p => ({ ...p, done: true })))}
            className="px-3 py-2 rounded-xl text-[10px] font-black bg-accent-600 text-surface-50 hover:bg-accent-700 transition-all">Mark all done</button>
          <button onClick={() => setPhases(prev => prev.map(p => ({ ...p, done: false })))}
            className="px-3 py-2 rounded-xl text-[10px] font-black bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 transition-all">Reset</button>
        </div>
      </CalcCard>
      <InfoNote>Writing the report chapter-by-chapter as you go (not at the end) is the single biggest de-risking move. Start Chapter 3 while the equipment is still being delivered.</InfoNote>
    </>
  );
}
// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'ideas', label: 'Idea Lab', icon: Lightbulb },
  { id: 'canvas', label: 'Problem Canvas', icon: Target },
  { id: 'method', label: 'Methodology', icon: FlaskConical },
  { id: 'report', label: 'Report Studio', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function FypModule() {
  const [tab, setTab] = useState<TabId>('ideas');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 text-surface-50 flex items-center justify-center shadow-lg shadow-accent-500/25">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-surface-800 dark:text-surface-50">Final Year Project</h1>
            <p className="text-xs text-surface-500 dark:text-surface-400">From first idea to defended thesis — idea generation, problem framing, methodology, reporting and planning.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${tab === t.id
                ? 'bg-accent-600 border-accent-600 text-surface-50 shadow-lg shadow-accent-500/25'
                : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-accent-400'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'ideas' && <IdeaLabTab />}
      {tab === 'canvas' && <ProblemCanvasTab />}
      {tab === 'method' && <MethodologyTab />}
      {tab === 'report' && <ReportStudioTab />}
      {tab === 'timeline' && <TimelineTab />}
    </div>
  );
}
