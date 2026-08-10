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
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
      
      {/* Enterprise Gateway Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 lg:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" /> Enterprise Chemical Engineering Platform
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Precision Chemical Analysis & Process Engineering
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Accelerating chemical process design, thermodynamic calculations, AI-powered GRUCA problem solving, and stoichiometry verification for chemical engineers.
          </p>
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <Link 
              to="/tutor" 
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2 no-underline"
            >
              <GraduationCap className="w-4 h-4" /> AI GRUCA Solver
            </Link>
            <Link 
              to="/build-compound" 
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center gap-2 no-underline"
            >
              <Search className="w-4 h-4" /> Compound Finder
            </Link>
            <Link 
              to="/advanced" 
              className="px-6 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 font-bold text-sm transition-all flex items-center gap-2 no-underline"
            >
              <Calculator className="w-4 h-4" /> 25+ Engineering Modules
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/periodic-table" className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition-all no-underline group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-100 dark:border-sky-900">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">Verified</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
            {stats ? stats.elements : elements.length}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Elements Cataloged</p>
        </Link>

        <Link to="/compounds" className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition-all no-underline group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900">
              <TestTube className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900">Live Sync</span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
            {stats ? stats.compounds.toLocaleString() : compounds.length.toLocaleString()}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Chemical Compounds</p>
        </Link>

        <Link to="/build-compound" className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition-all no-underline group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{history.length}</div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Recent Queries</p>
        </Link>

        <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
            {stats ? stats.total_substances.toLocaleString() : (elements.length + compounds.length).toLocaleString()}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Substances</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Searches Table */}
        <div className="lg:col-span-2 glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="font-bold flex items-center gap-2 text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              <Clock className="w-4 h-4 text-sky-600" /> Recent Compound Queries
            </h2>
            {history.length > 0 && (
              <button 
                onClick={() => { localStorage.removeItem('compound_search_history'); setHistory([]); }}
                className="text-xs text-slate-500 hover:text-red-500 font-bold transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-semibold">No recent compound queries.</p>
                <p className="text-slate-400 text-xs mt-1">Use the Compound Finder to combine elements and query PubChem.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry, i) => (
                  <div 
                    key={i}
                    onClick={() => loadHistoryEntry(i)}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-sky-500 dark:hover:border-sky-500 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {entry.elements.slice(0, 3).map((el, idx) => (
                          <span 
                            key={idx}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 border-white dark:border-slate-900 bg-sky-700"
                          >
                            {el}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          {entry.elements.join(' & ')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Database className="w-3.5 h-3.5" /> {entry.resultCount} matching compounds
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(entry.timestamp).toLocaleDateString()}</p>
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
                        Open Results <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link 
              to="/build-compound" 
              className="w-full mt-4 py-3 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:border-sky-500 hover:text-sky-600 transition-all flex items-center justify-center gap-2 no-underline"
            >
              <PlusCircle className="w-4 h-4" /> Open Compound Finder
            </Link>
          </div>
        </div>

        {/* Platform Architecture Sidebar */}
        <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-600" /> Platform Infrastructure
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600 dark:text-slate-400">Database Engine</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">SQLite (FastAPI)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600 dark:text-slate-400">AI Proxy Pipeline</span>
                <span className="text-sky-600 dark:text-sky-400 font-mono">5 Active Providers</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-sky-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Data Feeds</h3>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Local Database
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">OK</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-sky-500" /> PubChem PUG REST
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${pubchemOk ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                  {pubchemOk ? 'ONLINE' : 'CONNECTING'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Layers className="w-4 h-4 text-blue-500" /> Materials Project
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">READY</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
