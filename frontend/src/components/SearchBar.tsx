import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api, type SubstanceSummary, type Reaction } from '../api';

export default function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ substances: SubstanceSummary[]; reactions: Reaction[] }>({ substances: [], reactions: [] });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults({ substances: [], reactions: [] });
        setOpen(false);
        return;
      }
      try {
        const data = await api.search(query);
        setResults(data);
        setOpen(true);
      } catch { /* ignore */ }
    }, 300);
    return () => { if (timerRef.current !== null) clearTimeout(timerRef.current); };
  }, [query]);

  const goTo = (path: string) => { setOpen(false); setQuery(''); navigate(path); };

  const total = results.substances.length + results.reactions.length;

  return (
    <div className={`relative ${className || ''}`} ref={ref}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        placeholder="Search elements, compounds..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (total > 0) setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && query.trim().length > 0) {
            goTo(`/search?q=${encodeURIComponent(query)}`);
          }
        }}
        className="w-48 sm:w-60 lg:w-72 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"
      />
      {open && total > 0 && (
        <div className="absolute left-0 right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {results.substances.map((s) => (
            <div 
              key={s.id} 
              className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center gap-3" 
              onClick={() => goTo(`/substances/${s.id}`)}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${s.type === 'element' ? 'bg-sky-600' : 'bg-indigo-600'}`}>
                {s.type === 'element' ? s.symbol : 'CMP'}
              </span>
              <div className="min-w-0 flex-grow">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.name}</div>
                <div className="text-[10px] font-mono text-slate-500 truncate">{s.formula}</div>
              </div>
            </div>
          ))}
          {results.reactions.map((r) => (
            <div 
              key={r.id} 
              className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center gap-3" 
              onClick={() => goTo(`/reactions/${r.id}`)}
            >
              <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                RXN
              </span>
              <div className="min-w-0 flex-grow">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.name}</div>
                <div className="text-[10px] font-mono text-slate-500 truncate">{r.equation}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
