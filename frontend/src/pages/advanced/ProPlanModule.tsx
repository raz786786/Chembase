import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Crown, Gem, Sparkles, BadgeCheck, Zap, Check, ArrowRight, ArrowLeftRight,
  Wallet, Users, Puzzle, Network, Rocket, ShieldCheck, Building2,
  FlaskConical, Calculator, Database, LineChart,
  Microscope, Briefcase, Brain, Waypoints, Info,
  GraduationCap, Lock, LockOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Helpers ────────────────────────────────────────────────────────────────
function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <Info className="w-4 h-4 text-fuchsia-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}

// ─── Free vs Pro feature map (spec #33) ─────────────────────────────────────
interface PlanFeature { id: string; label: string; free: string; pro: string; proBold?: boolean; }

const FEATURES: PlanFeature[] = [
  { id: 'ai', label: 'AI Tutor (GRUCA solver)', free: 'Limited questions / day', pro: 'Unlimited questions, all 7 subjects', proBold: true },
  { id: 'calc', label: 'Engineering calculators', free: 'Basic set', pro: 'All 25 modules + advanced tools', proBold: true },
  { id: 'db', label: 'Chemical database', free: 'Core compounds', pro: 'Full database + property profiles' },
  { id: 'sim', label: 'Interactive simulations', free: 'Preview only', pro: 'Full access (PFD/P&ID, process sim)', proBold: true },
  { id: 'visual', label: 'Visualizations', free: '2 visualizations', pro: 'All interactive visualizations' },
  { id: 'quiz', label: 'Quizzes & practice', free: 'Basic quizzes', pro: 'Advanced practice problems + Quiz Lab', proBold: true },
  { id: 'lab', label: 'Lab tools & calculators', free: '—', pro: 'Equipment, lab modules, problem solver' },
  { id: 'interview', label: 'Interview simulator', free: '—', pro: 'Full simulator + 22-question bank', proBold: true },
  { id: 'career', label: 'Career tools', free: '—', pro: 'CV builder, LinkedIn, interview prep' },
  { id: 'templates', label: 'Templates', free: '—', pro: 'Reports, FYP, formula sheets' },
  { id: 'dashboard', label: 'Personal learning dashboard', free: '—', pro: 'Mastery tracking + weak-area paths', proBold: true },
  { id: 'smart', label: 'Smart Connect (AI → tools)', free: '—', pro: 'Topic routing to the right module', proBold: true },
  { id: 'support', label: 'Support & updates', free: 'Community', pro: 'Priority support + new modules first' },
];

const FREE_COUNT = FEATURES.filter(f => f.free !== '—').length;

// ─── Pricing tiers (student-friendly, to be validated with real students) ───
interface Tier { id: string; name: string; price: number; period: string; blurb: string; features: string[]; popular?: boolean; }

const TIERS: Tier[] = [
  {
    id: 'free', name: 'Free', price: 0, period: 'forever',
    blurb: 'Try ChemBase and prove it helps you study before you pay a rupee.',
    features: ['Basic calculators', 'Limited AI tutor questions', 'Core chemical database', 'Basic quizzes & learning resources', 'Smart Connect routing'],
  },
  {
    id: 'pro', name: 'ChemBase Pro', price: 299, period: '/month', popular: true,
    blurb: 'Everything in Free, plus every advanced tool — the price of one coffee per week.',
    features: ['Unlimited AI tutoring (all subjects)', 'All 25 advanced modules', 'Full database + substance profiles', 'Interview simulator + career tools', 'Personalized mastery dashboard', 'New features first'],
  },
  {
    id: 'annual', name: 'Annual', price: 239, period: '/month billed yearly',
    blurb: 'Two months free — best value for a full semester of study.',
    features: ['Everything in Pro', 'Save 20% vs monthly', 'Lifetime of your study period', 'Early access to new modules'],
  },
];


// ─── Compare tab: Free vs Pro feature table ────────────────────────────────
function CompareTab() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <ArrowLeftRight className="w-6 h-6 text-fuchsia-500" /> Free vs ChemBase Pro
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">A freemium model: prove the value free, upgrade when you need the full engineering ecosystem.</p>
      </div>
      <div className="grid md:grid-cols-[1fr_150px_150px] gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
        <span>Feature</span>
        <span className="text-center">Free</span>
        <span className="text-center text-fuchsia-500">Pro</span>
      </div>
      <div className="space-y-2">
        {FEATURES.map(f => (
          <div key={f.id} className="grid md:grid-cols-[1fr_150px_150px] gap-2 items-center rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 hover:border-fuchsia-400 transition-all">
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-white">{f.label}</p>
              <p className="text-[9px] text-slate-400">{f.free}</p>
            </div>
            <div className="text-center">
              {f.free === '—' ? <Lock className="w-3.5 h-3.5 inline text-slate-300 dark:text-slate-600" /> : <Check className="w-3.5 h-3.5 inline text-emerald-500" />}
              <p className="text-[9px] text-slate-400 mt-0.5">{f.free === '—' ? 'Locked' : f.free.slice(0, 22)}</p>
            </div>
            <div className="text-center">
              <Check className="w-3.5 h-3.5 inline text-fuchsia-500" />
              <p className={`text-[9px] mt-0.5 ${f.proBold ? 'font-black text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-400'}`}>{f.pro}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-900/10 border border-fuchsia-200 dark:border-fuchsia-800 p-4">
        <p className="text-[11px] text-fuchsia-700 dark:text-fuchsia-300 font-bold">
          {FREE_COUNT} of {FEATURES.length} capabilities are free — the advanced engineering ecosystem (simulations, interview simulator, career tools, mastery dashboard) is Pro.
        </p>
      </div>
      <InfoNote>Free tier exists to prove value, not to trap you: every module is built so a free student can try the core flow before upgrading.</InfoNote>
    </>
  );
}

// ─── Pricing tab: student-friendly tiers ───────────────────────────────────
function PricingTab() {
  const [yearly, setYearly] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const price = (t: Tier) => {
    if (t.price === 0) return 'Free';
    if (t.id === 'annual') return 'Rs ' + t.price.toLocaleString();
    return yearly ? 'Rs ' + t.price.toLocaleString() : 'Rs ' + Math.round(t.price / 0.8).toLocaleString();
  };
  const period = (t: Tier) => {
    if (t.price === 0) return 'forever';
    if (t.id === 'annual') return '/month · billed yearly';
    return yearly ? '/month' : '/month · pay monthly';
  };
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Wallet className="w-6 h-6 text-fuchsia-500" /> Pricing
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Student-friendly pricing. The exact price must be tested with real students — this is a research starting point, not a final decision.</p>
      </div>
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-[10px] font-black ${yearly ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>Pay monthly</span>
        <button onClick={() => setYearly(y => !y)}
          className={`w-12 h-6 rounded-full transition-all relative ${yearly ? 'bg-fuchsia-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${yearly ? 'left-6' : 'left-0.5'}`} />
        </button>
        <span className={`text-[10px] font-black ${yearly ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>Billed yearly <span className="text-emerald-500">(−20%)</span></span>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {TIERS.map(t => {
          const active = picked === t.id;
          return (
            <button key={t.id} onClick={() => setPicked(t.id)}
              className={`relative rounded-2xl border-2 p-6 text-left transition-all ${t.popular ? 'border-fuchsia-500 shadow-xl shadow-fuchsia-500/15' : 'border-slate-200 dark:border-slate-800 hover:border-fuchsia-400'} ${active ? 'ring-2 ring-fuchsia-500/40' : ''}`}>
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-fuchsia-600 text-white text-[9px] font-black flex items-center gap-1">
                  <Crown className="w-3 h-3" /> MOST POPULAR
                </span>
              )}
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                {t.id === 'free' ? <LockOpen className="w-3.5 h-3.5" /> : t.id === 'pro' ? <Zap className="w-3.5 h-3.5 text-fuchsia-500" /> : <Gem className="w-3.5 h-3.5 text-fuchsia-500" />} {t.name}
              </p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{price(t)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{period(t)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">{t.blurb}</p>
              <div className="mt-4 space-y-1.5">
                {t.features.map(f => (
                  <p key={f} className="text-[10px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" /> {f}
                  </p>
                ))}
              </div>
              <span className={`mt-5 block w-full text-center px-4 py-2.5 rounded-xl text-[11px] font-black transition-all ${t.price === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-lg shadow-fuchsia-500/25'}`}>
                {active ? '✓ Selected' : t.price === 0 ? 'Start free' : 'Choose Pro'}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-3">
        <Users className="w-4 h-4 text-fuchsia-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Pricing must be researched, not assumed</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Run a survey with 30-50 chemical engineering students before launch: what they would pay, which features they actually use, and whether a semester pass beats monthly. Adjust the price after real data — the numbers above are a starting hypothesis.</p>
        </div>
      </div>
      <InfoNote>If a student cannot afford Pro, the free tier still works: basic calculators, limited AI questions, core database and basic quizzes — enough to get through the semester.</InfoNote>
    </>
  );
}

// ─── Ecosystem tab: the connected ChemBase differentiator (#32) ────────────
interface EcoNode { id: string; label: string; icon: ReactNode; desc: string; to: string; }

const ECO_NODES: EcoNode[] = [
  { id: 'ai', label: 'AI Tutor', icon: <Brain className="w-5 h-5" />, desc: 'GRUCA solver across 7 subjects', to: '/tutor' },
  { id: 'calc', label: 'Calculators', icon: <Calculator className="w-5 h-5" />, desc: '25 modules of engineering tools', to: '/advanced/calculators' },
  { id: 'db', label: 'Database', icon: <Database className="w-5 h-5" />, desc: 'Compounds, reactions, properties', to: '/compounds' },
  { id: 'sim', label: 'Simulations', icon: <Network className="w-5 h-5" />, desc: 'Process sim, PFD/P&ID, control', to: '/advanced/process-simulation' },
  { id: 'viz', label: 'Visualizations', icon: <LineChart className="w-5 h-5" />, desc: 'Interactive charts & diagrams', to: '/advanced/visualizations' },
  { id: 'lab', label: 'Lab & Equipment', icon: <FlaskConical className="w-5 h-5" />, desc: 'Equipment, unit operations', to: '/advanced/equipment' },
  { id: 'safety', label: 'Process Safety', icon: <ShieldCheck className="w-5 h-5" />, desc: 'HSE, HAZOP, risk', to: '/advanced/process-safety' },
  { id: 'industry', label: 'Industrial', icon: <Building2 className="w-5 h-5" />, desc: 'Industry knowledge paths', to: '/advanced/industrial-knowledge' },
  { id: 'career', label: 'Career Tools', icon: <Briefcase className="w-5 h-5" />, desc: 'CV, LinkedIn, interview simulator', to: '/advanced/career-hub' },
  { id: 'mastery', label: 'Mastery Dashboard', icon: <GraduationCap className="w-5 h-5" />, desc: 'Personalized learning path', to: '/advanced/academic-hub' },
];

function EcosystemTab() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Puzzle className="w-6 h-6 text-fuchsia-500" /> The ChemBase Ecosystem
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ChemBase Pro is not another chatbot. It is a connected chemical-engineering ecosystem where every tool reinforces the others.</p>
      </div>
      <div className="rounded-2xl border-2 border-fuchsia-200 dark:border-fuchsia-800 bg-gradient-to-br from-fuchsia-50/60 to-violet-50/50 dark:from-fuchsia-950/20 dark:to-violet-950/20 p-6 mb-6">
        <p className="text-sm font-black text-slate-800 dark:text-white mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-fuchsia-500" /> How everything connects
        </p>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          Ask the AI tutor about reflux ratio → <b>Smart Connect</b> routes you to the Separation module → run the McCabe-Thiele visualization → drill into the quiz → the result updates your <b>Mastery Dashboard</b>, which schedules the next flashcard review. One question becomes a complete learning loop.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] font-black">
          {['Question', 'Route', 'Tools', 'Practice', 'Track'].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-fuchsia-600 text-white">{s}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ECO_NODES.map(n => (
          <Link key={n.id} to={n.to}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center hover:border-fuchsia-400 hover:shadow-lg hover:shadow-fuchsia-500/5 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              {n.icon}
            </div>
            <p className="text-[11px] font-black text-slate-800 dark:text-white">{n.label}</p>
            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{n.desc}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[10px] font-black text-emerald-500 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Specialized</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Built for chemical engineers — not a generic chatbot that happens to know chemistry.</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[10px] font-black text-indigo-500 flex items-center gap-1"><Waypoints className="w-3.5 h-3.5" /> Connected</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">AI, calculators, database, simulations, visualizations, labs, safety, career — all linked.</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[10px] font-black text-amber-500 flex items-center gap-1"><Rocket className="w-3.5 h-3.5" /> Ever-growing</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">New modules ship in priority order for Pro — the ecosystem compounds in value.</p>
        </div>
      </div>
      <InfoNote>This is the differentiator: a student does not leave ChemBase to piece together five websites — the whole engineering workflow lives here, connected.</InfoNote>
    </>
  );
}

// ─── MVP note tab (#34): what to build first ────────────────────────────────
const MVP_ITEMS = [
  { icon: <Brain className="w-4 h-4" />, title: 'AI Tutor', why: 'The hook — students come for the solving power', done: true },
  { icon: <Calculator className="w-4 h-4" />, title: 'Calculator Hub', why: 'Daily utility — the reason students return', done: true },
  { icon: <Database className="w-4 h-4" />, title: 'Chemical Database', why: 'Reference trust — the reason they stay', done: true },
  { icon: <LineChart className="w-4 h-4" />, title: 'Visualizations', why: 'Understanding — the reason they recommend', done: true },
  { icon: <Microscope className="w-4 h-4" />, title: 'Viva / Question Bank', why: 'Exam readiness — the reason they pay', done: true },
];

function MvpTab() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Rocket className="w-6 h-6 text-fuchsia-500" /> MVP Roadmap (#34)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">The long-term vision is the ecosystem above — but the first release proves value with the five core areas, then grows from real usage data.</p>
      </div>
      <div className="space-y-2">
        {MVP_ITEMS.map((m, i) => (
          <div key={m.title} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <span className="w-7 h-7 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center font-black text-[10px] flex-shrink-0">{i + 1}</span>
            <span className="text-fuchsia-500 flex-shrink-0">{m.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-black text-slate-800 dark:text-white">{m.title}</p>
              <p className="text-[10px] text-slate-400">{m.why}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${m.done ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{m.done ? '✓ Shipped' : 'In progress'}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-2">Track after release — then build what students actually use:</p>
        <div className="grid md:grid-cols-2 gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          {['Which features they use', 'How often they return', 'What problems they ask', 'Which tools they ignore', 'What they would pay for', 'Which modules to build next'].map(s => (
            <p key={s} className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500 flex-shrink-0" /> {s}</p>
          ))}
        </div>
      </div>
      <InfoNote>Everything above this note is already built and registered — the MVP is effectively live; what remains is real student data to steer the roadmap.</InfoNote>
    </>
  );
}

// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'compare', label: 'Free vs Pro', icon: ArrowLeftRight },
  { id: 'pricing', label: 'Pricing', icon: Wallet },
  { id: 'ecosystem', label: 'Ecosystem', icon: Puzzle },
  { id: 'mvp', label: 'MVP Roadmap', icon: Rocket },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ProPlanModule() {
  const [tab, setTab] = useState<TabId>('compare');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">ChemBase Pro</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">The freemium model, the connected ecosystem, and the roadmap — the business behind the product.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${tab === t.id
                ? 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-500'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'compare' && <CompareTab />}
      {tab === 'pricing' && <PricingTab />}
      {tab === 'ecosystem' && <EcosystemTab />}
      {tab === 'mvp' && <MvpTab />}
    </div>
  );
}
