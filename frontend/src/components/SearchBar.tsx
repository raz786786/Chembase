import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    if (query.trim().length < 2) { setResults({ substances: [], reactions: [] }); return; }
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
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
    <div className={`search-container ${className || ''}`} ref={ref}>
      <span 
        className="search-icon cursor-pointer hover:scale-110 transition-transform" 
        onClick={() => {
          if (query.trim().length > 0) goTo(`/search?q=${encodeURIComponent(query)}`);
        }}
        title="Search"
      >
        🔍
      </span>
      <input
        className="search-input"
        placeholder="Search elements, compounds, reactions…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (total > 0) setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && query.trim().length > 0) {
            goTo(`/search?q=${encodeURIComponent(query)}`);
          }
        }}
      />
      {open && total > 0 && (
        <div className="search-dropdown">
          {results.substances.map((s) => (
            <div key={s.id} className="search-result-item" onClick={() => goTo(`/substances/${s.id}`)}>
              <span className={`search-result-badge ${s.type === 'element' ? 'badge-element' : 'badge-compound'}`}>
                {s.type === 'element' ? s.symbol : 'CMP'}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-200)' }}>{s.formula}</div>
              </div>
            </div>
          ))}
          {results.reactions.map((r) => (
            <div key={r.id} className="search-result-item" onClick={() => goTo(`/reactions/${r.id}`)}>
              <span className="search-result-badge badge-reaction">RXN</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-200)' }}>{r.equation}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
