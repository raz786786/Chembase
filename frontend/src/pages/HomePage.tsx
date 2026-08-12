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
      <div className="relative overflow-hidden rounded-3xl bg-surface-900 border border-surface-50/5 p-5 sm:p-8 lg:p-12 text-surface-50 shadow-2xl">
        {/* Subtle Luminescent Background Glow */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-950/40 border border-primary-800/60 text-primary-400 text-xs font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" /> Enterprise Chemical Engineering Platform
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-surface-50 leading-tight drop-shadow-sm">
            Precision Chemical Analysis & Process Engineering
          </h1>
          <p className="text-surface-400 text-sm sm:text-base leading-relaxed">
            Accelerating chemical process design, thermodynamic calculations, AI-powered GRUCA problem solving, and stoichiometry verification for chemical engineers.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <Link 
              to="/tutor" 
              className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-surface-950 font-bold text-sm transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 no-underline btn-tactile"
            >
              <GraduationCap className="w-4 h-4" /> AI GRUCA Solver
            </Link>
            <Link 
              to="/build-compound" 
              className="px-6 py-3 rounded-xl bg-surface-50/5 hover:bg-surface-50/10 border border-surface-50/10 text-surface-200 font-bold text-sm transition-all flex items-center justify-center gap-2 no-underline btn-tactile"
            >
              <Search className="w-4 h-4" /> Compound Finder
            </Link>
            <Link 
              to="/advanced" 
              className="px-6 py-3 rounded-xl bg-surface-50/5 hover:bg-surface-50/10 border border-surface-50/10 text-surface-200 font-bold text-sm transition-all flex items-center justify-center gap-2 no-underline btn-tactile"
            >
              <Calculator className="w-4 h-4" /> 25+ Engineering Modules
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/periodic-table" className="glass p-6 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all no-underline group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-900">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400 border border-accent-200 dark:border-accent-900">Verified</span>
          </div>
          <div className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">
            {stats ? stats.elements : elements.length}
          </div>
          <p className="text-surface-500 dark:text-surface-400 text-xs font-bold uppercase tracking-wider">Elements Cataloged</p>
        </Link>

        <Link to="/compounds" className="glass p-6 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all no-underline group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-900">
              <TestTube className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-900">Live Sync</span>
          </div>
          <div className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">
            {stats ? stats.compounds.toLocaleString() : compounds.length.toLocaleString()}
          </div>
          <p className="text-surface-500 dark:text-surface-400 text-xs font-bold uppercase tracking-wider">Chemical Compounds</p>
        </Link>

        <Link to="/build-compound" className="glass p-6 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all no-underline group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-xl border border-surface-200 dark:border-surface-700">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">{history.length}</div>
          <p className="text-surface-500 dark:text-surface-400 text-xs font-bold uppercase tracking-wider">Recent Queries</p>
        </Link>

        <div className="glass p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400 rounded-xl border border-accent-100 dark:border-accent-900">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">
            {stats ? stats.total_substances.toLocaleString() : (elements.length + compounds.length).toLocaleString()}
          </div>
          <p className="text-surface-500 dark:text-surface-400 text-xs font-bold uppercase tracking-wider">Total Substances</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Searches Table */}
        <div className="lg:col-span-2 glass rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50/50 dark:bg-surface-900/50">
            <h2 className="font-bold flex items-center gap-2 text-sm text-surface-900 dark:text-surface-50 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-primary-600" /> Recent Compound Queries
            </h2>
            {history.length > 0 && (
              <button 
                onClick={() => { localStorage.removeItem('compound_search_history'); setHistory([]); }}
                className="text-xs text-surface-500 hover:text-red-500 font-bold transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl">
                <Search className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                <p className="text-surface-500 text-sm font-semibold">No recent compound queries.</p>
                <p className="text-surface-400 text-xs mt-1">Use the Compound Finder to combine elements and query PubChem.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry, i) => (
                  <div 
                    key={i}
                    onClick={() => loadHistoryEntry(i)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-50 dark:bg-surface-900/60 rounded-xl border border-surface-200 dark:border-surface-800 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {entry.elements.slice(0, 3).map((el, idx) => (
                          <span 
                            key={idx}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-surface-50 font-bold border-2 border-surface-50 dark:border-surface-900 bg-primary-700"
                          >
                            {el}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-surface-900 dark:text-surface-50">
                          {entry.elements.join(' & ')}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                          <Database className="w-3.5 h-3.5" /> {entry.resultCount} matching compounds
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-surface-400 uppercase">{new Date(entry.timestamp).toLocaleDateString()}</p>
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
                        Open Results <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link 
              to="/build-compound" 
              className="w-full mt-4 py-3 px-4 border border-dashed border-surface-300 dark:border-surface-700 rounded-xl text-surface-600 dark:text-surface-300 text-xs font-bold hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-center gap-2 no-underline"
            >
              <PlusCircle className="w-4 h-4" /> Open Compound Finder
            </Link>
          </div>
        </div>

        {/* Platform Architecture Sidebar */}
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-6">
          <div className="border-b border-surface-200 dark:border-surface-800 pb-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary-600" /> Platform Infrastructure
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-surface-600 dark:text-surface-400">Database Engine</span>
                <span className="text-accent-600 dark:text-accent-400 font-mono">SQLite (FastAPI)</span>
              </div>
              <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-2">
                <div className="bg-accent-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-surface-600 dark:text-surface-400">AI Proxy Pipeline</span>
                <span className="text-primary-600 dark:text-primary-400 font-mono">5 Active Providers</span>
              </div>
              <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-200 dark:border-surface-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-400">Data Feeds</h3>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <span className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <CheckCircle2 className="w-4 h-4 text-accent-500" /> Local Database
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300 font-mono">OK</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <span className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <CheckCircle2 className="w-4 h-4 text-primary-500" /> PubChem PUG REST
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${pubchemOk ? 'bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300' : 'bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300'}`}>
                  {pubchemOk ? 'ONLINE' : 'CONNECTING'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                <span className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                  <Layers className="w-4 h-4 text-primary-500" /> Materials Project
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-mono">READY</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
