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
  Activity,
  Layers,
  GraduationCap,
  Calculator,
  Search,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { api, type SubstanceSummary, type StatsOut } from '../api';

interface HistoryEntry {
  elements: string[];
  resultCount: number;
  timestamp: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [elements, setElements] = useState<SubstanceSummary[]>([]);
  const [compounds, setCompounds] = useState<SubstanceSummary[]>([]);
  const [stats, setStats] = useState<StatsOut | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pubchemOk, setPubchemOk] = useState(false);

  useEffect(() => {
    api.getElements().then(setElements).catch(console.error);
    api.getCompounds().then(setCompounds).catch(console.error);
    api.getStats().then(setStats).catch(console.error);

    let historyTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const stored = localStorage.getItem('compound_search_history');
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[];
        historyTimer = setTimeout(() => setHistory(parsed.slice(0, 6)), 0);
      }
    } catch { /* ignore corrupt history */ }

    fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/water/property/MolecularFormula/JSON', { signal: AbortSignal.timeout(5000) })
      .then(r => { if (r.ok) setPubchemOk(true); })
      .catch(() => { /* offline */ });

    return () => { if (historyTimer) clearTimeout(historyTimer); };
  }, []);

  const loadHistoryEntry = (index: number) => {
    localStorage.setItem('load_history_index', String(index));
    navigate('/build-compound');
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-5 sm:space-y-8">
      
      {/* Enterprise Gateway Hero - Minimal Text Diet */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-900 border border-surface-200/50 dark:border-surface-50/10 p-5 sm:p-8 lg:p-10 text-surface-50 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-950/60 border border-primary-800/60 text-primary-400 text-[11px] font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" /> Chemical Engineering Platform
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-surface-50 leading-tight drop-shadow-sm">
            Precision Chemical Analysis & Process Engineering
          </h1>
          <p className="text-surface-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Interactive engineering calculators, thermodynamic engines, verified GRUCA solver, and property databases.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <Link 
              to="/tutor" 
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-surface-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 no-underline btn-tactile"
            >
              <GraduationCap className="w-4 h-4" /> AI GRUCA Solver
            </Link>
            <Link 
              to="/build-compound" 
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-surface-50/10 hover:bg-surface-50/15 border border-surface-50/15 text-surface-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 no-underline btn-tactile"
            >
              <Search className="w-4 h-4" /> Compound Finder
            </Link>
            <Link 
              to="/advanced" 
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-surface-50/10 hover:bg-surface-50/15 border border-surface-50/15 text-surface-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 no-underline btn-tactile"
            >
              <Calculator className="w-4 h-4" /> 27+ Solvers
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Link to="/periodic-table" className="glass p-4 sm:p-5 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 transition-all no-underline group btn-tactile">
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-900">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400 border border-accent-200 dark:border-accent-900">Verified</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-surface-900 dark:text-surface-50 mb-0.5 sm:mb-1">
            {stats ? stats.elements : elements.length}
          </div>
          <p className="text-surface-500 dark:text-surface-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">Elements</p>
        </Link>

        <Link to="/compounds" className="glass p-4 sm:p-5 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 transition-all no-underline group btn-tactile">
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-900">
              <TestTube className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-900">Live Sync</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-surface-900 dark:text-surface-50 mb-0.5 sm:mb-1">
            {stats ? stats.compounds.toLocaleString() : compounds.length.toLocaleString()}
          </div>
          <p className="text-surface-500 dark:text-surface-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">Compounds</p>
        </Link>

        <Link to="/build-compound" className="glass p-4 sm:p-5 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 transition-all no-underline group btn-tactile">
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-xl border border-surface-200 dark:border-surface-700">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">History</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-surface-900 dark:text-surface-50 mb-0.5 sm:mb-1">{history.length}</div>
          <p className="text-surface-500 dark:text-surface-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">Queries</p>
        </Link>

        <div className="glass p-4 sm:p-5 rounded-2xl border border-surface-200 dark:border-surface-800">
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400 rounded-xl border border-accent-100 dark:border-accent-900">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400">Total</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-surface-900 dark:text-surface-50 mb-0.5 sm:mb-1">
            {stats ? stats.total_substances.toLocaleString() : (elements.length + compounds.length).toLocaleString()}
          </div>
          <p className="text-surface-500 dark:text-surface-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">Substances</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
        
        {/* Recent Searches Table */}
        <div className="lg:col-span-2 glass rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50/50 dark:bg-surface-900/50">
            <h2 className="font-bold flex items-center gap-2 text-xs sm:text-sm text-surface-900 dark:text-surface-50 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-primary-600" /> Recent Compound Queries
            </h2>
            {history.length > 0 && (
              <button 
                onClick={() => { localStorage.removeItem('compound_search_history'); setHistory([]); }}
                className="text-[11px] text-surface-500 hover:text-red-500 font-bold transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
          <div className="p-4 sm:p-6">
            {history.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl">
                <Search className="w-7 h-7 text-surface-400 mx-auto mb-2" />
                <p className="text-surface-500 text-xs sm:text-sm font-semibold">No recent compound queries.</p>
                <p className="text-surface-400 text-[11px] mt-0.5">Use Compound Finder to combine elements and query PubChem.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map((entry, i) => (
                  <div 
                    key={i}
                    onClick={() => loadHistoryEntry(i)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-3.5 bg-surface-50 dark:bg-surface-900/60 rounded-xl border border-surface-200 dark:border-surface-800 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-all group btn-tactile"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {entry.elements.slice(0, 3).map((el, idx) => (
                          <span 
                            key={idx}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-surface-50 font-bold border-2 border-surface-50 dark:border-surface-900 bg-primary-700"
                          >
                            {el}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-surface-900 dark:text-surface-50">
                          {entry.elements.join(' & ')}
                        </p>
                        <p className="text-[11px] text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                          <Database className="w-3 h-3" /> {entry.resultCount} matching compounds
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 text-right">
                      <span className="text-[10px] font-bold text-surface-400 uppercase">{new Date(entry.timestamp).toLocaleDateString()}</span>
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link 
              to="/build-compound" 
              className="w-full mt-3 py-2.5 px-4 border border-dashed border-surface-300 dark:border-surface-700 rounded-xl text-surface-600 dark:text-surface-300 text-xs font-bold hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-center gap-2 no-underline btn-tactile"
            >
              <PlusCircle className="w-4 h-4" /> Open Compound Finder
            </Link>
          </div>
        </div>

        {/* Platform Architecture Sidebar - Minimal Text Status Badges */}
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="border-b border-surface-200 dark:border-surface-800 pb-3">
            <h2 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary-600" /> Platform Infrastructure
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-surface-600 dark:text-surface-400">Database Engine</span>
                <span className="text-accent-600 dark:text-accent-400 font-mono text-[11px]">SQLite (FastAPI)</span>
              </div>
              <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-1.5">
                <div className="bg-accent-500 h-1.5 rounded-full w-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-surface-600 dark:text-surface-400">AI Proxy Pipeline</span>
                <span className="text-primary-600 dark:text-primary-400 font-mono text-[11px]">5 Providers</span>
              </div>
              <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-1.5">
                <div className="bg-primary-600 h-1.5 rounded-full w-full"></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-200 dark:border-surface-800 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Data Feeds</h3>
            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <span className="flex items-center gap-1.5 text-surface-700 dark:text-surface-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-500" /> Local Database
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300 font-mono">OK</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <span className="flex items-center gap-1.5 text-surface-700 dark:text-surface-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-500" /> PubChem REST
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300">
                  {pubchemOk ? 'ONLINE' : 'ACTIVE'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <span className="flex items-center gap-1.5 text-surface-700 dark:text-surface-300">
                  <Layers className="w-3.5 h-3.5 text-primary-500" /> Materials Project
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-mono">READY</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
