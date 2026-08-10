import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  FileText, FilePen, Briefcase, Award, Target, ListChecks, MessageSquare, Mic,
  Plus, Trash2, Sparkles, BadgeCheck, Users, Send, RefreshCw, Lightbulb,
  PenLine, Info, ChevronRight, TrendingUp, HelpCircle
} from 'lucide-react';
import { CalcCard } from './SharedComponents';

// ─── Helpers ────────────────────────────────────────────────────────────────
function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}

// ─── Achievement-booster: turns weak bullets into strong ones ───────────────
const ACHIEVE_TIPS: { weak: string; strong: string }[] = [
  { weak: 'Worked on a distillation column project', strong: 'Designed and optimised a 12-tray distillation column, cutting reboiler duty by 18% through feed-stage relocation' },
  { weak: 'Helped in the lab', strong: 'Independently executed 40+ ASTM standard tests (flash point, viscosity, distillation) with zero rework' },
  { weak: 'Learned Aspen Plus', strong: 'Built and converged a 5-column separation flowsheet in Aspen Plus, validating results against plant data' },
  { weak: 'Did an internship at a fertilizer plant', strong: 'Interned at a 1,500 t/day urea plant — audited 3 process units and presented 6 improvement proposals to engineering leadership' },
  { weak: 'Team project', strong: 'Led a 4-member team to a 92% grade on a chlor-alkali plant design; authored the mass & energy balance chapter' },
  { weak: 'Member of a society', strong: 'Served as AIChE student chapter treasurer — grew event attendance 3× and managed a $2k budget' },
];

const ACTION_VERBS = ['Designed', 'Optimised', 'Engineered', 'Led', 'Reduced', 'Increased', 'Implemented', 'Modelled', 'Analysed', 'Automated', 'Validated', 'Developed', 'Streamlined', 'Spearheaded'];
// ─── CV Builder: editable form + live ATS-friendly preview ──────────────────
interface CvData {
  name: string; title: string; email: string; phone: string; location: string;
  linkedin: string; summary: string; edu: string[]; exp: string[]; skills: string[]; projects: string[];
}

const DEFAULT_CV: CvData = {
  name: 'Ayesha Khan',
  title: 'Chemical Process Engineer (Fresher)',
  email: 'ayesha.khan@email.com', phone: '+92 300 1234567', location: 'Lahore, Pakistan',
  linkedin: 'linkedin.com/in/ayesha-khan-chem',
  summary: 'Chemical engineering graduate with hands-on plant internship experience in fertilizer and polymer processes. Skilled in Aspen Plus simulation, process safety (HAZOP) and data-driven optimisation. Seeking a Process Engineer role where I can apply mass & energy balance fundamentals to real production problems.',
  edu: ['B.Sc. Chemical Engineering, University of Engineering & Technology — CGPA 3.7/4.0 (2026)'],
  exp: ['Process Engineering Intern — Fatima Fertilizer (2025): mapped the urea granulation circuit, updated 12 P&IDs, analysed 6 months of plant data to recommend a 2% steam savings', 'Research Assistant — Polymer Lab (2024): prepared and characterised PMMA films; operated DSC and tensile tester'],
  skills: ['Aspen Plus', 'Mass & Energy Balance', 'HAZOP', 'MATLAB', 'P&ID / PFD', 'MS Excel (advanced)'],
  projects: ['Chlor-Alkali Plant Design (FYP): 25,000 t/yr membrane cell plant — complete heat & mass balance, equipment sizing and economics', 'Biodiesel from Waste Oil: bench-scale transesterification, 94% yield optimisation via response surface methodology'],
};

const CV_TEMPLATES = [
  { id: 'modern', name: 'Modern', desc: 'Clean sans-serif, accent bar' },
  { id: 'classic', name: 'Classic', desc: 'Serif, traditional sections' },
  { id: 'compact', name: 'Compact', desc: 'Single-page, tight spacing' },
] as const;

function CvBuilderTab() {
  const [cv, setCv] = useState<CvData>(DEFAULT_CV);
  const [tpl, setTpl] = useState('modern');
  const [boost, setBoost] = useState(0);
  const set = (k: keyof CvData, v: string | string[]) => setCv(prev => ({ ...prev, [k]: v }));
  const editList = (k: 'edu' | 'exp' | 'skills' | 'projects', i: number, v: string) =>
    setCv(prev => ({ ...prev, [k]: prev[k].map((x, j) => (j === i ? v : x)) }));
  const addList = (k: 'edu' | 'exp' | 'skills' | 'projects') => setCv(prev => ({ ...prev, [k]: [...prev[k], ''] }));
  const rmList = (k: 'edu' | 'exp' | 'skills' | 'projects', i: number) => setCv(prev => ({ ...prev, [k]: prev[k].filter((_, j) => j !== i) }));
  const inputCls = 'w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block';

  const input = (label: string, k: keyof CvData, ph: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input className={inputCls} placeholder={ph} value={String(cv[k])}
        onChange={e => set(k, e.target.value)} />
    </div>
  );

  const list = (label: string, k: 'edu' | 'exp' | 'skills' | 'projects') => (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      {cv[k].map((item, i) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls} value={item} onChange={e => editList(k, i, e.target.value)} />
          <button onClick={() => rmList(k, i)} className="px-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={() => addList(k)} className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">
        <Plus className="w-3 h-3" /> Add {label.toLowerCase()}
      </button>
    </div>
  );

  const boostTip = ACHIEVE_TIPS[boost % ACHIEVE_TIPS.length];
  const atsScore = Math.min(100, 40 + (cv.name ? 5 : 0) + (cv.summary.length > 50 ? 10 : 0) + cv.skills.length * 3 + cv.exp.filter(e => /\d/.test(e)).length * 5 + (cv.linkedin ? 5 : 0));
  const tplIs = tpl === 'classic';

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <FilePen className="w-6 h-6 text-emerald-500" /> CV Builder
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fill the form — the ATS-friendly resume updates live. Numbers beat adjectives.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* left: form */}
        <CalcCard title="Your details" icon={PenLine}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {input('Full name', 'name', 'Ayesha Khan')}
              {input('Headline', 'title', 'Chemical Process Engineer')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {input('Email', 'email', 'a@b.com')}
              {input('Phone', 'phone', '+92 ...')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {input('Location', 'location', 'Lahore, PK')}
              {input('LinkedIn', 'linkedin', 'linkedin.com/in/...')}
            </div>
            <div>
              <label className={labelCls}>Professional summary</label>
              <textarea rows={3} className={inputCls} value={cv.summary} onChange={e => set('summary', e.target.value)} />
            </div>
            {list('Education', 'edu')}
            {list('Experience (action + result!)', 'exp')}
            {list('Skills', 'skills')}
            {list('Projects', 'projects')}
          </div>
        </CalcCard>

        {/* right: booster + preview */}
        <div className="space-y-6">
          <CalcCard title="Achievement booster" icon={Sparkles}>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">Click for instant before/after examples, then rewrite your own bullets.</p>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 mb-3">
              <p className="text-[11px] text-slate-400 line-through mb-1">❌ {boostTip.weak}</p>
              <p className="text-[11px] text-slate-700 dark:text-slate-200 font-bold">✅ {boostTip.strong}</p>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setBoost(boost + 1)} className="px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Next example
              </button>
              <span className="text-[10px] font-black text-slate-400">verbs: {ACTION_VERBS.slice(0, 8).join(', ')}…</span>
            </div>
          </CalcCard>

          <CalcCard title={`Live preview · ${atsScore}/100 ATS score`} icon={FileText}>
            <div className="flex flex-wrap gap-2 mb-4">
              {CV_TEMPLATES.map(t => (
                <button key={t.id} title={t.desc} onClick={() => setTpl(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${tpl === t.id ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                  {t.name}
                </button>
              ))}
            </div>
            <div className={`rounded-xl border border-slate-200 dark:border-slate-800 p-5 ${tplIs ? 'font-serif' : ''} ${tpl === 'compact' ? 'text-[10px]' : 'text-[11px]'}`}>
              <p className={`text-lg font-black text-slate-800 dark:text-white ${tplIs ? 'font-serif' : ''}`}>{cv.name || 'Your Name'}</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold mb-1">{cv.title || 'Your headline'}</p>
              <p className="text-[9px] text-slate-400 mb-3">{cv.email} · {cv.phone} · {cv.location} · {cv.linkedin}</p>
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-0.5">SUMMARY</p>
              <p className="text-slate-500 dark:text-slate-400 mb-3">{cv.summary}</p>
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-0.5">EXPERIENCE</p>
              {cv.exp.filter(Boolean).map((e, i) => <p key={i} className="text-slate-500 dark:text-slate-400 mb-1">• {e}</p>)}
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-0.5 mt-2">EDUCATION</p>
              {cv.edu.filter(Boolean).map((e, i) => <p key={i} className="text-slate-500 dark:text-slate-400 mb-1">• {e}</p>)}
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-0.5 mt-2">SKILLS</p>
              <p className="text-slate-500 dark:text-slate-400 mb-2">{cv.skills.filter(Boolean).join(' · ')}</p>
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-0.5">PROJECTS</p>
              {cv.projects.filter(Boolean).map((p, i) => <p key={i} className="text-slate-500 dark:text-slate-400">• {p}</p>)}
            </div>
            <InfoNote>ATS parsers read single-column, text-based layouts. No tables, graphics or header text boxes — one font, standard section names, and quantify every bullet.</InfoNote>
          </CalcCard>
        </div>
      </div>
    </>
  );
}
// ─── LinkedIn optimizer: headline, about, posts ─────────────────────────────
const HEADLINE_FORMULAS = [
  { role: 'Process Engineer', formula: 'Chemical Engineer | [Skill 1] + [Skill 2] | [Industry]', example: 'Chemical Engineer | Process Optimisation + Aspen Plus | Fertilizer Industry' },
  { role: 'Graduate', formula: 'Final-year [Degree] @ [University] | [Skill] | [Interest]', example: 'Final-year Chemical Engineering @ UET | Process Simulation | Sustainable Energy' },
  { role: 'Researcher', formula: '[Research area] Researcher | [One key result] | [Affiliation]', example: 'Polymer Characterization Researcher | 3 published papers | UET Polymer Lab' },
] as const;

const ABOUT_STRUCTURE = [
  { step: 1, title: 'Hook', hint: 'What you do + who you help in one line', example: 'Chemical engineer turning raw materials into safer, cheaper products.' },
  { step: 2, title: 'Evidence', hint: 'Your strongest 2-3 achievements with numbers', example: 'Cut a pilot-plant cycle time 22% during my FYP; interned at a 1,500 t/day fertilizer plant.' },
  { step: 3, title: 'Differentiator', hint: 'The one thing you are known for', example: 'The person who converts messy plant data into clear, actionable recommendations.' },
  { step: 4, title: 'Call to action', hint: 'What you want the reader to do', example: 'Open to Process Engineering roles and plant internships — let us connect.' },
] as const;

const POST_TEMPLATES = [
  {
    type: 'Internship recap', template: 'Thrilled to wrap up my internship at {COMPANY} 🏭\n\nIn {N} weeks I: → audited {X} P&IDs → ran {Y} plant trials → presented {Z} improvement ideas to leadership.\n\nBiggest lesson: {LESSON}\n\nGrateful to {MENTOR} and the whole team. #ChemicalEngineering #Internship #ProcessEngineering',
  },
  {
    type: 'Project milestone', template: 'Milestone unlocked: {PROJECT} ✅\n\nThe problem: {PROBLEM}\nWhat we did: {SOLUTION}\nThe result: {RESULT} — a {PCT}% improvement over baseline.\n\n#Engineering #FYP #Innovation',
  },
  {
    type: 'Learning share', template: 'I spent {TIME} learning {TOPIC} and here is the one insight worth sharing:\n\n{INSIGHT}\n\nWhat should I learn next? Drop suggestions below 👇\n#LearningInPublic #ChemicalEngineering',
  },
] as const;

function LinkedinTab() {
  const [tab2, setTab2] = useState('about');
  const [name, setName] = useState('Ayesha');
  const [role, setRole] = useState('Process Engineer');
  const [skills, setSkills] = useState('Aspen Plus, HAZOP');
  const [industry, setIndustry] = useState('Fertilizer');
  const [about, setAbout] = useState('Chemical engineer turning raw materials into safer, cheaper products.');
  const [evidence, setEvidence] = useState('Cut pilot-plant cycle time 22% during FYP; interned at a 1,500 t/day fertilizer plant.');
  const [diff, setDiff] = useState('Converts messy plant data into clear, actionable recommendations.');
  const [cta, setCta] = useState('Open to Process Engineering roles and plant internships.');
  const [showGenerated, setShowGenerated] = useState(false);
  const [postIdx, setPostIdx] = useState(0);
  const inputCls = 'w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block';
  const tabBtn = (id: string, label: string) => (
    <button onClick={() => setTab2(id)} className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${tab2 === id ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-400'}`}>{label}</button>
  );
  const fullAbout = `I am ${name}, a ${role.toLowerCase()} specialising in ${skills}. ${about} ${evidence} ${diff} ${cta}`;
  const post = POST_TEMPLATES[postIdx];
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Users className="w-6 h-6 text-sky-500" /> LinkedIn Optimizer
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Headline formulas, an about-section builder and copy-paste post templates.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabBtn('about', 'About builder')}
        {tabBtn('headline', 'Headline formulas')}
        {tabBtn('posts', 'Post templates')}
      </div>
      {tab2 === 'about' && (
        <div className="grid md:grid-cols-2 gap-6">
          <CalcCard title="Your ingredients" icon={PenLine}>
            <div className="space-y-3">
              {[{ l: 'Your name', v: name, s: setName }, { l: 'Role', v: role, s: setRole }, { l: 'Skills', v: skills, s: setSkills }, { l: 'Industry', v: industry, s: setIndustry }].map(f => (
                <div key={f.l}><label className={labelCls}>{f.l}</label><input className={inputCls} value={f.v} onChange={e => f.s(e.target.value)} /></div>
              ))}
              <div>
                <label className={labelCls}>About structure — 4 paragraphs</label>
                {ABOUT_STRUCTURE.map(a => (
                  <div key={a.step} className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 mb-2">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{a.step}. {a.title} — <span className="text-slate-400">{a.hint}</span></p>
                    <p className="text-[10px] text-slate-400 italic mt-1">e.g. {a.example}</p>
                  </div>
                ))}
                <label className={labelCls}>1 · Hook</label>
                <textarea rows={2} className={inputCls} placeholder="What you do + who you help" value={about} onChange={e => setAbout(e.target.value)} />
                <label className={`${labelCls} mt-2`}>2 · Evidence</label>
                <textarea rows={2} className={inputCls} placeholder="Achievements with numbers" value={evidence} onChange={e => setEvidence(e.target.value)} />
                <label className={`${labelCls} mt-2`}>3 · Differentiator</label>
                <textarea rows={2} className={inputCls} placeholder="What you are known for" value={diff} onChange={e => setDiff(e.target.value)} />
                <label className={`${labelCls} mt-2`}>4 · Call to action</label>
                <textarea rows={2} className={inputCls} placeholder="What the reader should do" value={cta} onChange={e => setCta(e.target.value)} />
              </div>
            </div>
          </CalcCard>
          <CalcCard title="Generated About section" icon={BadgeCheck}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{fullAbout}</div>
            <button onClick={() => { navigator.clipboard?.writeText(fullAbout); setShowGenerated(true); }}
              className="mt-4 px-3 py-2 rounded-xl text-xs font-black bg-sky-600 text-white hover:bg-sky-700 transition-all shadow-lg shadow-sky-500/25 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> {showGenerated ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <InfoNote>Recruiters scan about sections in ~10 seconds. One idea per paragraph, numbers in every claim, and a clear call to action at the end.</InfoNote>
          </CalcCard>
        </div>
      )}
      {tab2 === 'headline' && (
        <div className="grid md:grid-cols-3 gap-4">
          {HEADLINE_FORMULAS.map(h => (
            <div key={h.role} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-xs font-black text-slate-700 dark:text-slate-200 mb-2">For {h.role}</p>
              <p className="text-[10px] font-bold text-slate-400 mb-1">FORMULA</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mb-3">{h.formula}</p>
              <p className="text-[10px] font-bold text-slate-400 mb-1">EXAMPLE</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">{h.example}</p>
            </div>
          ))}
        </div>
      )}
      {tab2 === 'posts' && (
        <CalcCard title="Post templates" icon={MessageSquare}>
          <div className="flex flex-wrap gap-2 mb-4">
            {POST_TEMPLATES.map((p, i) => (
              <button key={p.type} onClick={() => setPostIdx(i)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${i === postIdx ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>{p.type}</button>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono">{post.template}</div>
          <p className="text-[10px] text-slate-400 mt-3">Replace the {'{PLACEHOLDERS}'} with your details. Post at 8-10am on weekdays; comment on 3-5 posts before publishing yours to warm up engagement.</p>
        </CalcCard>
      )}
    </>
  );
}
// ─── Interview Prep: question bank + filterable UI ──────────────────────────
interface InterviewQ {
  id: number; cat: string; subject: string; q: string; model: string;
}

const INTERVIEW_QS: InterviewQ[] = [
  { id: 1, cat: 'Technical', subject: 'Mass & Energy Balance', q: 'A countercurrent heat exchanger heats 5 kg/s of cold water from 20 °C to 70 °C using hot water entering at 90 °C. If the hot stream exits at 50 °C, what is the hot-stream flow?', model: 'Energy balance: m_c·Cp·ΔT_c = m_h·Cp·ΔT_h. Cp cancels: 5 × 50 = m_h × 40 → m_h = 6.25 kg/s. State assumptions (no losses, constant Cp) before calculating.' },
  { id: 2, cat: 'Technical', subject: 'Thermodynamics', q: 'What is the difference between a throttling valve and an isentropic turbine, and what stays constant in each?', model: 'Throttling is isenthalpic (h = const, entropy increases, no work). An ideal turbine is isentropic (s = const, produces work). Real turbines have isentropic efficiency η = (actual work)/(ideal work).' },
  { id: 3, cat: 'Technical', subject: 'Fluid Mechanics', q: 'Define Reynolds number and what flow regimes it predicts. What happens to pressure drop if velocity doubles in turbulent flow?', model: 'Re = ρvD/μ. Laminar < 2100, transition 2100-4000, turbulent > 4000. In turbulent flow ΔP scales roughly with v² (Darcy-Weisbach + friction factor), so doubling velocity ≈ quadruples pressure drop.' },
  { id: 4, cat: 'Technical', subject: 'Heat Transfer', q: 'Explain countercurrent vs co-current heat exchange and why countercurrent is preferred.', model: 'Countercurrent keeps a temperature driving force along the whole exchanger (T_hot,in vs T_cold,out at one end), enabling closer approach temperatures and smaller area for the same duty. Co-current limits outlet hot temp above cold outlet.' },
  { id: 5, cat: 'Technical', subject: 'Mass Transfer', q: 'What is the difference between absorption and stripping? Give an example of each.', model: 'Absorption transfers a component from gas to liquid (e.g. CO₂ into MEA/amine solution). Stripping transfers from liquid to gas (e.g. steam stripping organics from wastewater). Both driven by concentration gradients, described by equilibrium + rate.' },
  { id: 6, cat: 'Technical', subject: 'Reaction Eng', q: 'What is the difference between conversion and selectivity? Why does selectivity matter more in parallel reactions?', model: 'Conversion = reacted/feed. Selectivity = desired product/reacted. In parallel reactions (A→B desired, A→C waste), high conversion with poor selectivity wastes feed on C — so selectivity (not conversion) drives economics.' },
  { id: 7, cat: 'Technical', subject: 'Separation', q: 'Explain relative volatility and how it relates to distillation difficulty.', model: 'α = (yA/xA)/(yB/xB) — how much easier A evaporates than B. α near 1 (e.g. benzene/toluene is 2.4, close-boilers 1.05) → many trays, high reflux, expensive column. α = 1 → impossible by ordinary distillation (needs extractive/azeotropic).' },
  { id: 8, cat: 'Technical', subject: 'Process Control', q: 'What is a feedback control loop? Name its five elements and explain a cascade control application.', model: 'Elements: process variable, sensor, controller, final control element, setpoint. Feedback compares PV to SP, adjusts valve. Cascade: e.g. reactor temperature master controlling cooling-water flow slave loop — rejects disturbances faster.' },
  { id: 9, cat: 'Technical', subject: 'Process Safety', q: 'What is a HAZOP and what are the three consequences of a loss of containment?', model: 'HAZOP = structured brainstorming using guidewords (MORE/LESS/NO/REVERSE) × parameters to find deviations. Loss of containment → fire, explosion, toxic release (and environmental damage).' },
  { id: 10, cat: 'Technical', subject: 'Equipment', q: 'What is NPSH and why does it matter for pump selection?', model: 'NPSH_available = head at pump suction above vapour pressure. If NPSH_a < NPSH_r (required), cavitation — vapour bubbles collapse and erode impeller. Fix: raise suction tank level, shorten suction line, lower fluid temperature.' },
  { id: 11, cat: 'Technical', subject: 'PFD & P&ID', q: 'What is the difference between a PFD and a P&ID?', model: 'PFD: process overview — major equipment, streams, heat/material balance, control philosophy. P&ID: piping + instrumentation detail — every pipe, valve, instrument tag, interlock, and utility connection. PFD for engineers, P&ID for design/construction/operation.' },
  { id: 12, cat: 'Technical', subject: 'Industrial', q: 'In a fertilizer plant, what are the key unit operations between ammonia synthesis and final urea product?', model: 'NH₃ synthesis loop (Haber-Bosch at ~150-250 bar, 450-500 °C) → CO₂ capture → urea reactor → stripping → evaporation → prilling/granulation → bagging. Energy recovery via HP steam from exotherm.' },
  { id: 13, cat: 'HR', subject: 'General', q: 'Tell me about yourself.', model: 'STAR-style 60-90 seconds: present (role/degree + one anchor achievement) → past (key experience) → future (why this role/company). Never recite your CV; highlight 2-3 transferable points.' },
  { id: 14, cat: 'HR', subject: 'General', q: 'Why do you want to work in this industry/company?', model: 'Show research: name the company\'s products, latest project or challenge, and connect your skills (e.g. \'Your urea capacity expansion aligns with my FYP on process optimisation\'). Avoid generic answers.' },
  { id: 15, cat: 'HR', subject: 'General', q: 'What are your strengths and weaknesses?', model: 'Strength: pick one relevant + evidence (\'data analysis — reduced lab rework 30%\'). Weakness: real but manageable + mitigation (\'public speaking — now present monthly team updates\'). Never say \'I work too hard\'.' },
  { id: 16, cat: 'HR', subject: 'General', q: 'Tell me about a time you faced a conflict or failure.', model: 'STAR: Situation, Task, Action, Result — own the mistake, show what you learned and changed. Avoid blaming teammates or hiding the failure.' },
  { id: 17, cat: 'HR', subject: 'General', q: 'Where do you see yourself in five years?', model: 'Show ambition aligned with the employer: growing into a chartered/senior process engineer, taking ownership of larger projects — not a different career or \'your job\'.' },
  { id: 18, cat: 'HR', subject: 'General', q: 'Do you have any questions for us?', model: 'Always ask 2-3 prepared questions: about team structure, typical first-year responsibilities, training/mentorship, or recent plant challenges. It signals genuine interest.' },
  { id: 19, cat: 'Behavioral', subject: 'Teamwork', q: 'Describe a project where you worked in a team. What was your role?', model: 'Use STAR + quantify: \'Led the simulation subgroup of 3; delivered converged flowsheet 2 weeks early; resolved a disagreement by proposing a decision matrix\'. Highlight both contribution and collaboration.' },
  { id: 20, cat: 'Behavioral', subject: 'Leadership', q: 'Give an example of when you took the lead.', model: 'Pick a concrete situation (FYP subgroup, society event, lab batch). Explain how you organised tasks, motivated others, handled a setback, and the measured outcome.' },
  { id: 21, cat: 'Behavioral', subject: 'Problem Solving', q: 'Tell me about a difficult technical problem you solved.', model: 'Structure: define the problem precisely → constraints → alternatives evaluated → chosen solution → result with numbers. Show systematic thinking, not just the answer.' },
  { id: 22, cat: 'Behavioral', subject: 'Initiative', q: 'Describe something you did beyond your assigned responsibilities.', model: 'Example: taught yourself Aspen Plus in a month to support the design team; organised a plant-visit for juniors; volunteered to present. Tie to an outcome.' },
];
// ─── Interview Prep tab: filterable Q&A bank ────────────────────────────────
function InterviewPrepTab() {
  const [cat, setCat] = useState('All');
  const [subj, setSubj] = useState('All');
  const [qry, setQry] = useState('');
  const [open, setOpen] = useState<number | null>(1);
  const cats = ['All', ...Array.from(new Set(INTERVIEW_QS.map(q => q.cat)))];
  const subs = ['All', ...Array.from(new Set(INTERVIEW_QS.map(q => q.subject)))];
  const filtered = INTERVIEW_QS.filter(q =>
    (cat === 'All' || q.cat === cat) &&
    (subj === 'All' || q.subject === subj) &&
    (q.q.toLowerCase().includes(qry.toLowerCase()) || q.model.toLowerCase().includes(qry.toLowerCase()))
  );
  const selCls = 'px-3 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <ListChecks className="w-6 h-6 text-emerald-500" /> Interview Question Bank
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">22 curated questions with model answers — click to reveal, then practice aloud.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <select className={selCls} value={cat} onChange={e => setCat(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className={selCls} value={subj} onChange={e => setSubj(e.target.value)}>
          {subs.map(s => <option key={s}>{s}</option>)}
        </select>
        <input className={`${selCls} flex-1 min-w-[200px]`} placeholder="Search questions…" value={qry} onChange={e => setQry(e.target.value)} />
        <span className="text-[10px] font-black text-slate-400 self-center">{filtered.length} shown</span>
      </div>
      <div className="space-y-3">
        {filtered.map(q => (
          <div key={q.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setOpen(open === q.id ? null : q.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${q.cat === 'Technical' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' : q.cat === 'HR' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'}`}>{q.cat}</span>
              <span className="text-[9px] font-black text-slate-400 w-28">{q.subject}</span>
              <p className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">{q.q}</p>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${open === q.id ? 'rotate-90' : ''}`} />
            </button>
            {open === q.id && (
              <div className="px-4 pb-4">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mb-1">MODEL ANSWER</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{q.model}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-slate-400 py-10 text-center">No questions match your filters.</p>}
      </div>
      <InfoNote>Interviewers reward STRUCTURE: state your answer, give evidence with numbers, then a one-line conclusion. Practice the technical answers out loud — your mouth knows less than your brain.</InfoNote>
    </>
  );
}
// ─── Interview Simulator: config → timed Q&A → scored evaluation ───────────
interface SimQuestion {
  q: string; hint: string; score: 0 | 1;
}

const SIM_BANKS: Record<string, SimQuestion[]> = {
  'Process Engineer': [
    { q: 'A distillation column separates a 50/50 feed of benzene/toluene. Why is countercurrent liquid-vapour contact essential, and what happens to the tray count as relative volatility approaches 1?', hint: 'Driving force + equilibrium stages; mention α = 1 makes it impossible.', score: 1 },
    { q: 'Your plant\'s pump trips and NPSH_a drops below NPSH_r. What is happening inside the pump and what two fixes do you propose?', hint: 'Cavitation: vapour bubbles collapse on the impeller; raise suction head or lower liquid temperature.', score: 1 },
    { q: 'A reactor runs away (exotherm out of control). Walk me through your immediate response as the process engineer.', hint: 'Stop feed, activate emergency cooling/relief, isolate, follow ESD — safety first, then stabilise.', score: 1 },
    { q: 'Steam consumption is 10% above design in your plant. List the three most likely causes and how you would verify each.', hint: 'Trap failures, insulation loss, process fouling/over-reflux — check condensate, surface temps, energy balance.', score: 1 },
    { q: 'Explain why reflux ratio affects both product purity AND operating cost, and how you would choose the optimum.', hint: 'Higher reflux = more trays separation but more reboiler/condenser duty; optimum near minimum reflux + margin.', score: 1 },
  ],
  'Plant Engineer': [
    { q: 'You arrive on shift and a gas alarm sounds at the ammonia storage area. What are your first five actions?', hint: 'Evacuate/upwind, sound alarm, isolate source, call emergency response, check for injured — in that spirit.', score: 1 },
    { q: 'A heat exchanger is fouling every 3 months instead of every 12. What investigation would you run?', hint: 'Check cooling-water chemistry, flow velocity, temperatures, upstream carryover, metallurgy — pick a plan.', score: 1 },
    { q: 'What is the difference between a permit-to-work and a lockout/tagout, and when is each required?', hint: 'PtW = non-routine job authorisation (risk + gas test); LOTO = energy isolation for maintenance safety.', score: 1 },
    { q: 'A valve fails-closed during start-up. Which failure mode would you have specified and why?', hint: 'Fails-open vs closed trade-off: choose the safe position for the process (e.g. cooling water fails open).', score: 1 },
    { q: 'How would you verify a pressure relief valve is sized correctly for a blocked-outlet scenario?', hint: 'Calculate required relieving rate at worst-case upstream pressure; check PSV capacity vs demand at set +10%.', score: 1 },
  ],
  'Design Engineer': [
    { q: 'You must size a heat exchanger for 2 MW duty. What data do you need and what are the design steps?', hint: 'Duty, flows, T in/out, U estimate → LMTD → area, then mechanical: shell/tube, ΔP check, fouling.', score: 1 },
    { q: 'What is the difference between design pressure and operating pressure, and how is the MAWP chosen?', hint: 'Operating + margin (10% or 25 psi rule); MAWP from code calculations of the weakest component.', score: 1 },
    { q: 'Explain how you would approach a plant-wide mass balance for a new process line.', hint: 'Boundary definition, species balances, recycle convergence, degrees of freedom, then validate against vendor data.', score: 1 },
    { q: 'Why do you add a safety factor to pump sizing? What is typical practice?', hint: 'Uncertainty in friction factors/fouling; add 10-20% margin but avoid oversizing causing cavitation at low flows.', score: 1 },
    { q: 'A client wants a 20% capacity increase. What are your first three engineering questions?', hint: 'What is the current bottleneck? Utility capacity? Who owns the risk/justification? Bottleneck analysis first.', score: 1 },
  ],
};

const SIM_ROLES = Object.keys(SIM_BANKS);

interface SimResult {
  score: number; tech: number; comm: number; struct: number; acc: number; conf: number;
  verdict: string; weak: string[]; followups: string[];
}

function simulateInterview(answers: (0 | 1 | null)[], conf: number, role?: string): SimResult {
  const n = answers.length || 1;
  const right = answers.filter(a => a === 1).length;
  const tech = Math.round((right / n) * 100);
  const acc = tech;
  const comm = Math.round(Math.min(100, tech * 0.5 + conf * 0.3 + 25));
  const struct = Math.round(Math.min(100, tech * 0.4 + conf * 0.25 + 30));
  const score = Math.round(tech * 0.5 + comm * 0.2 + struct * 0.2 + conf * 0.1);
  const verdict = score >= 80 ? 'Strong hire — ready to interview' : score >= 60 ? 'Good — polish a few weak spots' : score >= 40 ? 'Developing — drill the fundamentals' : 'Rehearse the basics, then retry';
  const weak: string[] = [];
  if (tech < 60) weak.push('Technical fundamentals — review mass/energy balance, pumps & heat transfer');
  if (struct < 60) weak.push('Answer structure — practice STAR and claim-evidence-conclusion');
  if (comm < 60) weak.push('Communication — practise aloud with a timer');
  if (conf < 50) weak.push('Confidence — rehearse answers until they are automatic');
  if (weak.length === 0) weak.push('All areas healthy — add depth with plant-specific examples');
  const followups = role === 'Design Engineer'
    ? ['Walk through your FYP process design choices', 'What industry would you target and why?']
    : ['Describe a time you used data to convince a supervisor', 'What is your biggest engineering failure and what changed?'];
  return { score, tech, comm, struct, acc, conf, verdict, weak, followups };
}
// ─── Simulator UI: config → question-by-question → evaluation ───────────────
function SimulatorTab() {
  const [phase, setPhase] = useState<'config' | 'run' | 'done'>('config');
  const [role, setRole] = useState(SIM_ROLES[0]);
  const [conf, setConf] = useState(60);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(0 | 1 | null)[]>([]);
  const [result, setResult] = useState<SimResult | null>(null);

  const start = () => { setIdx(0); setAnswers([]); setResult(null); setPhase('run'); };
  const bank = SIM_BANKS[role] ?? SIM_BANKS[SIM_ROLES[0]];
  const q = bank[idx];
  const answer = (v: 0 | 1) => {
    const next = [...answers, v];
    setAnswers(next);
    if (idx + 1 >= bank.length) { setResult(simulateInterview(next, conf, role)); setPhase('done'); }
    else setIdx(idx + 1);
  };
  const bar = (label: string, v: number, color: string) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-xs font-black text-slate-700 dark:text-slate-200">{v}/100</p>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Mic className="w-6 h-6 text-rose-500" /> Interview Simulator
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pick a role, answer like it is the real thing — get scored on technical, communication, structure, accuracy and confidence.</p>
      </div>

      {phase === 'config' && (
        <CalcCard title="Set up your interview" icon={Target}>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Target role</label>
              <div className="flex flex-wrap gap-2">
                {SIM_ROLES.map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${role === r ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/25' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-400'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-4 mb-2">Honest confidence self-rating (used in scoring):</p>
              <input type="range" min={0} max={100} value={conf} onChange={e => setConf(parseInt(e.target.value))} className="w-full accent-rose-500" />
              <div className="flex justify-between text-[9px] font-black text-slate-400"><span>Nervous</span><span>Confident</span></div>
            </div>
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4">
              <p className="text-[10px] font-black text-rose-500 mb-2">HOW IT WORKS</p>
              <ul className="text-[10px] text-slate-600 dark:text-slate-300 space-y-1.5">
                <li>• {bank.length} scenario questions for the {role} role</li>
                <li>• Answer each from memory — no peeking</li>
                <li>• Self-mark honestly: right / missed key point</li>
                <li>• You get a 5-dimension score + weak areas</li>
              </ul>
            </div>
          </div>
          <button onClick={start} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2">
            <Mic className="w-4 h-4" /> Start the interview
          </button>
        </CalcCard>
      )}

      {phase === 'run' && (
        <CalcCard title={`Question ${idx + 1} of ${bank.length} · ${role}`} icon={HelpCircle}>
          <div className="flex items-center gap-2 mb-4">
            {bank.map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < idx ? 'bg-emerald-500' : i === idx ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            ))}
          </div>
          <p className="text-sm font-black text-slate-800 dark:text-white mb-4 leading-relaxed">{q.q}</p>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 mb-4">
            <p className="text-[10px] font-black text-slate-400 mb-1">WHAT A GREAT ANSWER COVERS</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">{q.hint}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => answer(1)} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25">✓ I nailed it</button>
            <button onClick={() => answer(0)} className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">Partially missed it</button>
          </div>
        </CalcCard>
      )}

      {phase === 'done' && result && (
        <div className="grid md:grid-cols-2 gap-6">
          <CalcCard title={`Overall score: ${result.score}/100`} icon={Award}>
            <p className="text-5xl font-black text-slate-800 dark:text-white mb-2">{result.score}<span className="text-lg text-slate-400">/100</span></p>
            <p className="text-xs font-black text-rose-500 mb-6">{result.verdict}</p>
            {bar('Technical knowledge', result.tech, 'bg-blue-500')}
            {bar('Accuracy', result.acc, 'bg-emerald-500')}
            {bar('Structure', result.struct, 'bg-amber-500')}
            {bar('Communication', result.comm, 'bg-purple-500')}
            {bar('Confidence', result.conf, 'bg-rose-500')}
          </CalcCard>
          <div className="space-y-6">
            <CalcCard title="Weak areas & recommended topics" icon={Lightbulb}>
              <ul className="space-y-2">
                {result.weak.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <ChevronRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" /> {w}
                  </li>
                ))}
              </ul>
            </CalcCard>
            <CalcCard title="Follow-up questions to prepare" icon={TrendingUp}>
              <ul className="space-y-2">
                {result.followups.map((f, i) => (
                  <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </CalcCard>
            <button onClick={start} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-rose-500/25">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Retake with another role
            </button>
          </div>
        </div>
      )}
      <InfoNote>Scoring is a self-assessment simulation, not a verdict — the act of articulating answers under time pressure is the real training. Use the question bank to fill gaps the simulator finds.</InfoNote>
    </>
  );
}

// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'cv', label: 'CV Builder', icon: FileText },
  { id: 'linkedin', label: 'LinkedIn', icon: Users },
  { id: 'prep', label: 'Interview Prep', icon: ListChecks },
  { id: 'sim', label: 'Simulator', icon: Mic },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function CareerHubModule() {
  const [tab, setTab] = useState<TabId>('cv');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Career Hub</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Resume builder, LinkedIn optimizer, interview question bank and a scored interview simulator.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${tab === t.id
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'cv' && <CvBuilderTab />}
      {tab === 'linkedin' && <LinkedinTab />}
      {tab === 'prep' && <InterviewPrepTab />}
      {tab === 'sim' && <SimulatorTab />}
    </div>
  );
}
