import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  RefreshCcw, 
  ChevronRight, 
  Beaker, 
  FlaskConical,
  ArrowRightLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api, type Reaction } from '../api';
import { FormulaDisplay } from '../components/FormulaDisplay';

const PRESET_QUERIES = [
  { a: 'H2', b: 'O2', label: 'H2 + O2' },
  { a: 'CH4', b: 'O2', label: 'CH4 + O2' },
  { a: 'N2', b: 'H2', label: 'N2 + H2' },
  { a: 'CO', b: 'H2', label: 'CO + H2' },
];

export default function ReactionsPage() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [queried, setQueried] = useState(false);

  const loadAllReactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReactions();
      setReactions(data || []);
    } catch (e) {
      console.error(e);
      setReactions([]);
      setError('Failed to load reactions from the database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReactions();
  }, []);

  const handleQuery = async (overrideA?: string, overrideB?: string) => {
    const a = (overrideA ?? r1).trim();
    const b = (overrideB ?? r2).trim();
    if (!a) return;
    setLoading(true);
    setError(null);
    setQueried(true);
    try {
      const data = await api.queryReactions(a, b || undefined);
      setReactions(data || []);
    } catch (e) {
      console.error(e);
      setReactions([]);
      setError('Failed to query reactions. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (a: string, b: string) => {
    setR1(a);
    setR2(b);
    handleQuery(a, b);
  };

  const resetQuery = async () => {
    setR1('');
    setR2('');
    setQueried(false);
    await loadAllReactions();
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Compact Query Bar Header */}
      <div className="glass rounded-2xl p-4 sm:p-6 mb-6 border border-surface-200 dark:border-surface-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-600" /> Reaction Engine
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300">
                Stoichiometry & Kinetics
              </span>
            </h1>
            <p className="text-xs text-surface-500 mt-0.5">Query industrial reaction paths, enthalpies, and operational conditions.</p>
          </div>

          {/* Quick preset chips */}
          <div className="touch-scroll-x flex gap-1.5 overflow-x-auto pb-1 no-scrollbar items-center">
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mr-1">Presets:</span>
            {PRESET_QUERIES.map(p => (
              <button
                key={p.label}
                onClick={() => loadPreset(p.a, p.b)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[11px] font-semibold text-surface-600 dark:text-surface-300 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-all flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-accent-500" /> {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-5 flex items-center px-3 py-2 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
            <FlaskConical className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Reactant A (e.g. H2, CH4)" 
              className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-surface-900 dark:text-surface-50 placeholder:text-surface-400"
              value={r1} 
              onChange={(e) => setR1(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            />
          </div>
          <div className="sm:col-span-4 flex items-center px-3 py-2 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
            <Beaker className="w-4 h-4 text-violet-500 mr-2 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Reactant B (Optional)" 
              className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-surface-900 dark:text-surface-50 placeholder:text-surface-400"
              value={r2} 
              onChange={(e) => setR2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            />
          </div>
          <div className="sm:col-span-3 flex gap-1.5">
            <button 
              className="flex-1 bg-primary-600 text-surface-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              onClick={() => handleQuery()}
            >
              <Zap className="w-3.5 h-3.5" /> Find
            </button>
            {queried && (
              <button 
                title="Reset search"
                className="bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300 px-3 rounded-xl hover:bg-surface-300 dark:hover:bg-surface-700 transition-all"
                onClick={resetQuery}
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-surface-400">
          {queried ? `Found Results (${reactions.length})` : `Industrial Reactions (${reactions.length})`}
        </h2>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-surface-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500" /> Verified
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Industrial
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-2" />
          <p className="text-xs text-surface-400 font-semibold">Consulting reaction database...</p>
        </div>
      ) : error ? (
        <div className="glass p-10 rounded-2xl text-center border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-50 mb-1">Unable to load reactions</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => (queried ? handleQuery() : loadAllReactions())}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-surface-50 text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : reactions.length === 0 ? (
        <div className="glass p-12 rounded-2xl text-center border border-dashed border-surface-300 dark:border-surface-700">
          <Beaker className="w-10 h-10 text-surface-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-1">No reactions found</h3>
          <p className="text-xs text-surface-400">Try testing common industrial reactants such as H2, CH4, or N2.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reactions.map((r) => (
            <Link 
              to={`/reactions/${r.id}`} 
              className="glass p-4 sm:p-5 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 no-underline group shadow-sm" 
              key={r.id}
            >
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {r.reaction_type && (
                    <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {r.reaction_type}
                    </span>
                  )}
                  {r.is_reversible && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-violet-500 uppercase">
                      <ArrowRightLeft className="w-3 h-3" /> Reversible
                    </span>
                  )}
                </div>
                <div className="text-lg sm:text-xl font-black text-surface-900 dark:text-surface-50 group-hover:text-primary-600 transition-colors">
                  <FormulaDisplay formula={r.equation} />
                </div>
                <h3 className="text-xs font-semibold text-surface-500 mt-1">{r.name}</h3>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-4 md:border-l border-surface-100 dark:border-surface-800 md:pl-6 pt-2 md:pt-0 border-t md:border-t-0">
                <div className="text-left md:text-right">
                  {r.enthalpy_change !== null && r.enthalpy_change !== undefined && (
                    <div>
                      <p className="text-[9px] font-black text-surface-400 uppercase tracking-wider">Enthalpy</p>
                      <p className={`text-xs font-black ${r.enthalpy_change < 0 ? 'text-accent-500' : 'text-rose-500'}`}>
                        {r.enthalpy_change} kJ/mol
                      </p>
                    </div>
                  )}
                  {r.conditions && (
                    <div className="mt-1">
                      <p className="text-[9px] font-black text-surface-400 uppercase tracking-wider">Conditions</p>
                      <p className="text-xs font-semibold text-surface-600 dark:text-surface-300 truncate max-w-[180px]">{r.conditions}</p>
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-surface-50 transition-all flex-shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
