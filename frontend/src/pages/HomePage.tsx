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
  TrendingUp,
  Beaker
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

    try {
      const stored = localStorage.getItem('compound_search_history');
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryEntry[];
        setHistory(parsed.slice(0, 6));
      }
    } catch {}

    // Check PubChem connectivity
    fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/water/property/MolecularFormula/JSON', { signal: AbortSignal.timeout(5000) })
      .then(r => { if (r.ok) setPubchemOk(true); })
      .catch(() => {});
  }, []);

  const loadHistoryEntry = (index: number) => {
    localStorage.setItem('load_history_index', String(index));
    navigate('/build-compound');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/periodic-table" className="glass p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform no-underline group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-green-500">+2 new</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats ? stats.elements : elements.length}
          </h3>
          <p className="text-slate-500 text-sm font-medium">Elements</p>
        </Link>

        <Link to="/compounds" className="glass p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform no-underline group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <TestTube className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-indigo-500">Updated</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats ? stats.compounds.toLocaleString() : compounds.length.toLocaleString()}
          </h3>
          <p className="text-slate-500 text-sm font-medium">Compounds</p>
        </Link>

        <Link to="/build-compound" className="glass p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:scale-[1.02] transition-transform no-underline group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <History className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{history.length}</h3>
          <p className="text-slate-500 text-sm font-medium">Recent Searches</p>
        </Link>

        <div className="glass p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats ? stats.total_substances.toLocaleString() : (elements.length + compounds.length).toLocaleString()}
          </h3>
          <p className="text-slate-500 text-sm font-medium">Total Substances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Searches Section */}
        <div className="lg:col-span-2 glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Clock className="w-4 h-4" /> Recent Searches
            </h2>
            <button 
              onClick={() => { localStorage.removeItem('compound_search_history'); setHistory([]); }}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Clear History
            </button>
          </div>
          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No recent searches found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, i) => (
                  <div 
                    key={i}
                    onClick={() => loadHistoryEntry(i)}
                    className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {entry.elements.slice(0, 3).map((el, idx) => (
                          <span 
                            key={idx}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-slate-900 ${
                              idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-slate-500' : 'bg-indigo-500'
                            }`}
                          >
                            {el}
                          </span>
                        ))}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {entry.elements.join(' & ')}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Database className="w-3 h-3" /> {entry.resultCount} compounds discovered
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleDateString()}</p>
                      <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
                        View Results <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link 
              to="/build-compound" 
              className="w-full mt-6 py-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm font-medium hover:border-indigo-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 no-underline"
            >
              <PlusCircle className="w-4 h-4" /> Open Compound Finder
            </Link>
          </div>
        </div>

        {/* Platform Status Sidebar */}
        <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Platform Status
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-500">Database Uptime</span>
                <span className="text-green-500">99.9%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '99.9%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-500">AI Compute Resource</span>
                <span className="text-amber-500">74%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '74%' }}></div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-left">Active Data Sources</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Local Database</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span>Materials Project API</span>
                </div>
                <div className={`flex items-center gap-3 text-sm ${pubchemOk ? '' : 'opacity-50'} text-slate-600 dark:text-slate-400`}>
                  <div className={`w-2 h-2 rounded-full ${pubchemOk ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`}></div>
                  <span>PubChem {pubchemOk ? '(Active)' : '(Connecting...)'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
