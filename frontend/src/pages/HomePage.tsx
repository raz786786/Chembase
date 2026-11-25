import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Database,
  TestTube,
  History,
  Zap,
  Clock,
  ArrowRight,
  PlusCircle,
  GraduationCap,
  Calculator,
  Search,
  LayoutGrid,
  Flame,
  Briefcase,
  FlaskConical,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { api, type SubstanceSummary, type StatsOut } from '../api';
import { SpotlightCard, ShimmerLink, StatusPill } from '../components/ui/InteractivePrimitives';

interface HistoryEntry {
  elements: string[];
  resultCount: number;
  timestamp: number;
}

const QUICK_MODULES = [
  { to: '/tutor', label: 'AI GRUCA Tutor', tag: 'Multi-AI Verified', icon: GraduationCap, accent: 'text-sky-500 bg-sky-500/10' },
  { to: '/periodic-table', label: 'Periodic Table', tag: '118 Elements', icon: LayoutGrid, accent: 'text-teal-500 bg-teal-500/10' },
  { to: '/compounds', label: 'Compounds', tag: 'Properties & GHS', icon: TestTube, accent: 'text-blue-500 bg-blue-500/10' },
  { to: '/reactions', label: 'Reactions', tag: 'Stoichiometry', icon: Zap, accent: 'text-amber-500 bg-amber-500/10' },
  { to: '/build-compound', label: 'Compound Finder', tag: 'Element Combiner', icon: FlaskConical, accent: 'text-cyan-500 bg-cyan-500/10' },
  { to: '/advanced/thermodynamics', label: 'Thermodynamics', tag: 'Cycles & EOS', icon: Flame, accent: 'text-sky-500 bg-sky-500/10' },
  { to: '/advanced/calculators', label: 'Calculators', tag: '60+ Solvers', icon: Calculator, accent: 'text-teal-500 bg-teal-500/10' },
  { to: '/advanced/career-hub', label: 'Career & CV Hub', tag: 'Targeted ATS CV', icon: Briefcase, accent: 'text-blue-500 bg-blue-500/10' },
  { to: '/advanced/process-safety', label: 'HSE & Safety', tag: 'HAZOP & LOPA', icon: ShieldAlert, accent: 'text-rose-500 bg-rose-500/10' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [elements, setElements] = useState<SubstanceSummary[]>([]);
  const [compounds, setCompounds] = useState<SubstanceSummary[]>([]);
  const [stats, setStats] = useState<StatsOut | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pubchemOk, setPubchemOk] = useState(false);

  useEffect(() => {
    api.getElements().then(setElements).catch(() => {});
    api.getCompounds().then(setCompounds).catch(() => {});
    api.getStats().then(setStats).catch(() => {});

    let historyTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const stored = localStorage.getItem('compound_search_history');
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[];
        historyTimer = setTimeout(() => setHistory(parsed.slice(0, 5)), 0);
      }
    } catch { /* ignore corrupt history */ }

    fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/water/property/MolecularFormula/JSON', { signal: AbortSignal.timeout(5000) })
      .then((r) => { if (r.ok) setPubchemOk(true); })
      .catch(() => {});

    return () => { if (historyTimer) clearTimeout(historyTimer); };
  }, []);

  const loadHistoryEntry = (index: number) => {
    localStorage.setItem('load_history_index', String(index));
    navigate('/build-compound');
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* TNR AgentOS-Inspired Compact Hero + Floating Status Pills */}
      <SpotlightCard className="p-5 sm:p-7 bg-gradient-to-br from-white via-sky-50/40 to-teal-50/30 dark:from-[#0a0f18] dark:via-[#0d1522] dark:to-[#08121c]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label="Cluster: Optimal" value="27 Modules" dotColor="bg-emerald-400" />
              <StatusPill
                label={pubchemOk ? 'PubChem Live' : 'Local Engine'}
                dotColor={pubchemOk ? 'bg-sky-400' : 'bg-amber-400'}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              ChemBase <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-teal-400 bg-clip-text text-transparent">Pro</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              AI GRUCA solver, 60+ engineering calculators & live chemical database.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <ShimmerLink to="/tutor" variant="primary">
                <GraduationCap className="w-4 h-4" /> AI Tutor
              </ShimmerLink>
              <ShimmerLink to="/advanced" variant="secondary">
                <Sparkles className="w-4 h-4 text-sky-500" /> Engineering Hub
              </ShimmerLink>
              <ShimmerLink to="/build-compound" variant="secondary">
                <Search className="w-4 h-4 text-teal-500" /> Compound Finder
              </ShimmerLink>
            </div>
          </div>

          {/* Compact 2x2 KPI Mini-Tiles inside Hero */}
          <div className="grid grid-cols-2 gap-2.5 lg:w-72 flex-shrink-0">
            <Link to="/periodic-table" className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-3 hover:border-sky-400/50 transition-all no-underline">
              <div className="text-xl font-black text-slate-900 dark:text-white">{stats ? stats.elements : elements.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Elements</div>
            </Link>
            <Link to="/compounds" className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-3 hover:border-sky-400/50 transition-all no-underline">
              <div className="text-xl font-black text-slate-900 dark:text-white">{stats ? stats.compounds.toLocaleString() : compounds.length.toLocaleString()}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Compounds</div>
            </Link>
            <Link to="/reactions" className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-3 hover:border-sky-400/50 transition-all no-underline">
              <div className="text-xl font-black text-slate-900 dark:text-white">{stats ? stats.reactions.toLocaleString() : '—'}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reactions</div>
            </Link>
            <Link to="/build-compound" className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] p-3 hover:border-sky-400/50 transition-all no-underline">
              <div className="text-xl font-black text-sky-600 dark:text-sky-400">{history.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recent</div>
            </Link>
          </div>
        </div>
      </SpotlightCard>

      {/* Interactive Bento Quick-Access Grid (All Core Options Visible at a Glance) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
        {QUICK_MODULES.map((m) => (
          <Link key={m.to} to={m.to} className="no-underline group">
            <SpotlightCard className="p-3.5 sm:p-4 h-full">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${m.accent}`}>
                    <m.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">
                      {m.label}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                      {m.tag}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 hidden sm:block" />
              </div>
            </SpotlightCard>
          </Link>
        ))}
      </div>

      {/* Compact Recent Queries Strip */}
      <SpotlightCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">
            <Clock className="w-3.5 h-3.5 text-sky-500" /> Recent Queries
          </h2>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                onClick={() => { localStorage.removeItem('compound_search_history'); setHistory([]); }}
                className="text-[11px] text-slate-400 hover:text-rose-500 font-bold transition-colors"
              >
                Clear
              </button>
            )}
            <Link to="/build-compound" className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 no-underline hover:underline">
              <PlusCircle className="w-3.5 h-3.5" /> New
            </Link>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4" /> No recent compound searches.
            </span>
            <Link to="/build-compound" className="text-xs font-bold text-sky-500 no-underline hover:underline">
              Try Finder →
            </Link>
          </div>
        ) : (
          <div className="touch-scroll-x flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {history.map((entry, i) => (
              <button
                key={i}
                onClick={() => loadHistoryEntry(i)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-sky-400 transition-all whitespace-nowrap flex-shrink-0"
              >
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{entry.elements.join(' + ')}</span>
                <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                  <Database className="w-2.5 h-2.5 inline mr-0.5" />{entry.resultCount}
                </span>
              </button>
            ))}
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
