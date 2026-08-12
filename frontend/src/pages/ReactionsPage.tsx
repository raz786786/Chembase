import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  RefreshCcw, 
  ChevronRight, 
  Beaker, 
  FlaskConical,
  ArrowRightLeft
} from 'lucide-react';
import { api, type Reaction } from '../api';
import { FormulaDisplay } from '../components/FormulaDisplay';

export default function ReactionsPage() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');
  const [queried, setQueried] = useState(false);

  useEffect(() => {
    api.getReactions().then((data) => { 
      setReactions(data); 
      setLoading(false); 
    }).catch(console.error);
  }, []);

  const handleQuery = async () => {
    if (!r1.trim()) return;
    setLoading(true);
    setQueried(true);
    try {
      const data = await api.queryReactions(r1, r2 || undefined);
      setReactions(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const resetQuery = async () => {
    setR1('');
    setR2('');
    setQueried(false);
    setLoading(true);
    const data = await api.getReactions();
    setReactions(data);
    setLoading(false);
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* Search Hero */}
      <div className="relative overflow-hidden glass rounded-[40px] p-8 md:p-16 mb-12 border border-surface-50 dark:border-surface-800 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 blur-[100px] -ml-32 -mb-32"></div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-surface-900 dark:text-surface-50 mb-4">
            Reaction <span className="text-primary-600">Query Engine</span>
          </h1>
          <p className="text-surface-500 text-lg mb-10 font-medium">Predict products and find industrial reactions using our high-fidelity database.</p>
          
          <div className="flex flex-col md:flex-row gap-4 p-3 glass rounded-[32px] border border-surface-200 dark:border-surface-700 shadow-2xl transition-all hover:border-primary-400">
            <div className="flex-1 flex items-center px-6 py-2 bg-surface-50/50 dark:bg-surface-900/50 rounded-2xl border border-surface-100 dark:border-surface-800">
              <FlaskConical className="w-5 h-5 text-primary-500 mr-3" />
              <input 
                type="text" 
                placeholder="Reactant A (e.g. H2)" 
                className="w-full bg-transparent outline-none text-lg font-bold text-surface-800 dark:text-surface-50 placeholder:text-surface-400"
                value={r1} 
                onChange={(e) => setR1(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              />
            </div>
            <div className="flex-1 flex items-center px-6 py-2 bg-surface-50/50 dark:bg-surface-900/50 rounded-2xl border border-surface-100 dark:border-surface-800">
              <Beaker className="w-5 h-5 text-violet-500 mr-3" />
              <input 
                type="text" 
                placeholder="Reactant B (Optional)" 
                className="w-full bg-transparent outline-none text-lg font-bold text-surface-800 dark:text-surface-50 placeholder:text-surface-400"
                value={r2} 
                onChange={(e) => setR2(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              />
            </div>
            <div className="flex gap-2">
              <button 
                className="flex-grow md:flex-initial bg-primary-600 text-surface-50 px-8 py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30"
                onClick={handleQuery}
              >
                <Zap className="w-5 h-5" /> Search
              </button>
              {queried && (
                <button 
                  className="bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300 px-4 rounded-2xl hover:bg-surface-300 dark:hover:bg-surface-700 transition-all"
                  onClick={resetQuery}
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-8 px-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-surface-400">
          {queried ? `Search Results (${reactions.length})` : 'Recent Industrial Reactions'}
        </h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-surface-500">
            <div className="w-2 h-2 rounded-full bg-accent-500"></div> Verified
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-surface-500">
            <div className="w-2 h-2 rounded-full bg-primary-500"></div> Industrial
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-surface-500 font-bold">Consulting Database...</p>
        </div>
      ) : reactions.length === 0 ? (
        <div className="glass p-20 rounded-[40px] text-center border border-surface-200 dark:border-surface-800">
          <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Beaker className="w-10 h-10 text-surface-300" />
          </div>
          <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">No reactions found</h3>
          <p className="text-surface-500">Try searching for common reactants like H2, O2, or NaOH.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reactions.map((r) => (
            <Link 
              to={`/reactions/${r.id}`} 
              className="glass p-8 rounded-[32px] border border-surface-200 dark:border-surface-800 hover:border-primary-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 no-underline group shadow-sm hover:shadow-xl hover:shadow-primary-500/5" 
              key={r.id}
            >
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-4">
                  {r.reaction_type && (
                    <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {r.reaction_type}
                    </span>
                  )}
                  {r.is_reversible && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-violet-500 uppercase">
                      <ArrowRightLeft className="w-3 h-3" /> Reversible
                    </span>
                  )}
                </div>
                <div className="text-2xl md:text-3xl font-black text-surface-900 dark:text-surface-50 mb-2 group-hover:text-primary-600 transition-colors">
                   <FormulaDisplay formula={r.equation} />
                </div>
                <h3 className="text-sm font-bold text-surface-500 mb-4">{r.name}</h3>
                {r.description && <p className="text-sm text-surface-400 line-clamp-1 max-w-2xl">{r.description}</p>}
              </div>
              
              <div className="flex items-center gap-6 md:border-l border-surface-100 dark:border-surface-800 md:pl-8">
                <div className="text-right">
                  {r.enthalpy_change !== null && r.enthalpy_change !== undefined && (
                    <div className="mb-2">
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Enthalpy</p>
                      <p className={`text-sm font-black ${r.enthalpy_change < 0 ? 'text-accent-500' : 'text-rose-500'}`}>
                        {r.enthalpy_change} kJ/mol
                      </p>
                    </div>
                  )}
                  {r.conditions && (
                    <div>
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Conditions</p>
                      <p className="text-sm font-bold text-surface-600 dark:text-surface-300">{r.conditions}</p>
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-surface-50 dark:bg-surface-800 text-surface-400 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-surface-50 transition-all">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
