import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Zap } from 'lucide-react';
import { api, type SearchResult } from '../api';
import { FormulaDisplay } from '../components/FormulaDisplay';

const SMART_FILTERS = [
  { label: '🔥 High Boiling', query: 'high boiling' },
  { label: '💨 Volatile', query: 'volatile' },
  { label: '🧊 Gases', query: 'gases' },
  { label: '💧 Liquids', query: 'liquids' },
  { label: '🪨 Solids', query: 'solids' },
  { label: '⚙️ Metals', query: 'metals' },
  { label: '✨ Noble Gases', query: 'noble' },
  { label: '🟡 Halogens', query: 'halogens' },
  { label: '☢️ Radioactive', query: 'radioactive' },
];

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.search(q)
      .then((data) => { setResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q]);

  const doSmartSearch = (query: string) => navigate(`/search?q=${encodeURIComponent(query)}`);

  if (!q) {
    return (
      <div className="animate-in fade-in duration-500">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Search className="w-8 h-8 text-indigo-600" /> Smart Search
        </h1>
        <p className="text-slate-500 mb-8">Search by name, formula, CAS number — or try smart property filters below.</p>
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Quick Filters</h3>
        <div className="flex flex-wrap gap-3">
          {SMART_FILTERS.map(f => (
            <button key={f.query} onClick={() => doSmartSearch(f.query)}
              className="px-5 py-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all">
              {f.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-3">
        <Search className="w-8 h-8 text-indigo-600" /> Results for &quot;{q}&quot;
      </h1>
      <p className="text-slate-500 mb-6">Found {results ? results.total : 0} match{results?.total === 1 ? '' : 'es'}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {SMART_FILTERS.map(f => (
          <button key={f.query} onClick={() => doSmartSearch(f.query)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              q === f.query ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600'
            }`}>{f.label}</button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>}

      {!loading && results && results.total === 0 && (
        <div className="glass p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No results for &quot;{q}&quot;. Try a different query or smart filter.</p>
        </div>
      )}

      {!loading && results && results.substances.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" /> Substances ({results.substances.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.substances.map(s => (
              <Link to={`/substances/${s.id}`} key={s.id}
                className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all no-underline group">
                <div className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-1">
                  <FormulaDisplay formula={s.type === 'element' && s.symbol ? s.symbol : s.formula} />
                </div>
                <div className="text-sm font-bold text-slate-600 dark:text-slate-400">{s.name}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">{s.type} {s.category ? `\u2022 ${s.category}` : ''}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && results && results.reactions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Reactions ({results.reactions.length})
          </h2>
          <div className="space-y-3">
            {results.reactions.map(r => (
              <Link to={`/reactions/${r.id}`} key={r.id}
                className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all no-underline flex justify-between items-center">
                <div>
                  <div className="text-lg font-black text-slate-900 dark:text-white"><FormulaDisplay formula={r.equation} /></div>
                  <div className="flex items-center gap-2 mt-1">
                    {r.reaction_type && <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded text-[10px] font-black uppercase">{r.reaction_type}</span>}
                    <span className="text-xs text-slate-400">{r.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
