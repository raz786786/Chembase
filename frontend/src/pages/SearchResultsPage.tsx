import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Zap, AlertCircle, X } from 'lucide-react';
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
  const [inputValue, setInputValue] = useState(q);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(q);
  }, [q]);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    api.search(q)
      .then((data) => {
        if (!isCancelled) {
          setResults(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Search failed:', err);
        if (!isCancelled) {
          setResults(null);
          setError('Search failed. Please check your connection and try again.');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [q]);

  const doSmartSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSmartSearch(inputValue);
  };

  const renderSearchBar = () => (
    <form onSubmit={handleSubmit} className="relative max-w-2xl mb-6">
      <Search className="w-4 h-4 text-surface-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search by name, formula, symbol, CAS number, or property..."
        className="w-full pl-11 pr-24 py-3 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-sm font-semibold text-surface-900 dark:text-surface-50 placeholder:text-surface-400 outline-none focus:border-primary-500 transition-all"
      />
      {inputValue && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { setInputValue(''); navigate('/search'); }}
          className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-surface-50 text-xs font-bold transition-all"
      >
        Search
      </button>
    </form>
  );

  if (!q) {
    return (
      <div className="animate-in fade-in duration-500">
        <h1 className="text-3xl font-extrabold text-surface-900 dark:text-surface-50 mb-2 flex items-center gap-3">
          <Search className="w-8 h-8 text-primary-600" /> Smart Search
        </h1>
        <p className="text-surface-500 mb-6">Search by name, formula, CAS number — or try smart property filters below.</p>
        {renderSearchBar()}
        <h3 className="text-[10px] font-black uppercase text-surface-400 tracking-widest mb-4">Quick Filters</h3>
        <div className="flex flex-wrap gap-3">
          {SMART_FILTERS.map(f => (
            <button key={f.query} onClick={() => doSmartSearch(f.query)}
              className="px-5 py-3 glass rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 text-sm font-bold text-surface-700 dark:text-surface-300 hover:text-primary-600 transition-all">
              {f.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold text-surface-900 dark:text-surface-50 mb-1 flex items-center gap-3">
        <Search className="w-8 h-8 text-primary-600" /> Results for &quot;{q}&quot;
      </h1>
      <p className="text-surface-500 mb-5">Found {results ? results.total : 0} match{results?.total === 1 ? '' : 'es'}</p>

      {renderSearchBar()}

      <div className="flex flex-wrap gap-2 mb-8">
        {SMART_FILTERS.map(f => (
          <button key={f.query} onClick={() => doSmartSearch(f.query)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              q === f.query ? 'bg-primary-600 text-surface-50 border-primary-600' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-500 hover:text-primary-600'
            }`}>{f.label}</button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-primary-200 border-t-indigo-600 rounded-full animate-spin" /></div>}

      {!loading && error && (
        <div className="glass p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => doSmartSearch(q)}
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-surface-50 text-xs font-bold transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && results && results.total === 0 && (
        <div className="glass p-12 rounded-3xl border border-dashed border-surface-300 dark:border-surface-700 text-center">
          <Search className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <p className="text-surface-500 font-medium">No results for &quot;{q}&quot;. Try a different query or smart filter.</p>
        </div>
      )}

      {!loading && results && results.substances.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" /> Substances ({results.substances.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.substances.map(s => (
              <Link to={`/substances/${s.id}`} key={s.id}
                className="glass p-5 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 transition-all no-underline group">
                <div className="text-xl font-black text-surface-900 dark:text-surface-50 group-hover:text-primary-600 transition-colors mb-1">
                  <FormulaDisplay formula={s.type === 'element' && s.symbol ? s.symbol : s.formula} />
                </div>
                <div className="text-sm font-bold text-surface-600 dark:text-surface-400">{s.name}</div>
                <div className="text-[10px] uppercase font-bold text-surface-400 mt-1">{s.type} {s.category ? `\u2022 ${s.category}` : ''}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && results && results.reactions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent-500" /> Reactions ({results.reactions.length})
          </h2>
          <div className="space-y-3">
            {results.reactions.map(r => (
              <Link to={`/reactions/${r.id}`} key={r.id}
                className="glass p-5 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 transition-all no-underline flex justify-between items-center">
                <div>
                  <div className="text-lg font-black text-surface-900 dark:text-surface-50"><FormulaDisplay formula={r.equation} /></div>
                  <div className="flex items-center gap-2 mt-1">
                    {r.reaction_type && <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded text-[10px] font-black uppercase">{r.reaction_type}</span>}
                    <span className="text-xs text-surface-400">{r.name}</span>
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
