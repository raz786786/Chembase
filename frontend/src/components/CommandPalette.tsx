import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  Search,
  Home,
  LayoutGrid,
  TestTube2,
  GraduationCap,
  Settings2,
  Beaker,
  FlaskConical,
  Zap,
  Calculator,
  Microscope,
  Sparkles,
} from 'lucide-react';
import { api, type SubstanceSummary } from '../api';
import { playSound } from '../lib/sound';

interface Props { open: boolean; onOpenChange: (o: boolean) => void }

const QUICK_JUMPS = [
  { to: '/', label: 'Home', keywords: 'dashboard start overview', icon: Home, iconClass: 'text-sky-500' },
  { to: '/tutor', label: 'AI GRUCA Tutor', keywords: 'ai tutor chat solver assistant', icon: GraduationCap, iconClass: 'text-sky-500' },
  { to: '/periodic-table', label: 'Periodic Table', keywords: 'elements atoms periodic table', icon: LayoutGrid, iconClass: 'text-teal-500' },
  { to: '/compounds', label: 'Compounds', keywords: 'chemicals molecules formulas', icon: TestTube2, iconClass: 'text-blue-500' },
  { to: '/reactions', label: 'Reactions', keywords: 'equations stoichiometry kinetics', icon: Zap, iconClass: 'text-amber-500' },
  { to: '/build-compound', label: 'Compound Finder', keywords: 'build compound combiner finder', icon: Microscope, iconClass: 'text-cyan-500' },
  { to: '/predict', label: 'Reaction Predictor', keywords: 'predict mixture synthesis pathway', icon: Sparkles, iconClass: 'text-violet-500' },
  { to: '/search', label: 'Global Search', keywords: 'smart search filter cas properties', icon: Search, iconClass: 'text-emerald-500' },
  { to: '/advanced', label: 'Engineering Hub (26 Modules)', keywords: 'engineering hub modules process', icon: Settings2, iconClass: 'text-sky-500' },
  { to: '/advanced/calculators', label: 'Calculators Hub', keywords: 'calculators solvers thermo fluids', icon: Calculator, iconClass: 'text-teal-500' },
];

export default function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SubstanceSummary[]>([]);

  // Reset search state when palette closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Ctrl/Cmd+K global listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
        playSound('click');
      }
      if (open && e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(() => {
      api.search(query)
        .then((r) => { if (!cancelled) setResults(r.substances.slice(0, 6)); })
        .catch(() => { if (!cancelled) setResults([]); });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const filteredQuickJumps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_JUMPS;
    return QUICK_JUMPS.filter(
      (j) => j.label.toLowerCase().includes(q) || j.keywords.toLowerCase().includes(q) || j.to.toLowerCase().includes(q)
    );
  }, [query]);

  const go = (to: string) => { onOpenChange(false); playSound('click'); navigate(to); };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      shouldFilter={false}
      label="Command Palette"
      className="fixed inset-0 z-[200]"
      overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[12vh] w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c111b] shadow-2xl"
    >
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 px-4">
        <Search className="h-4 w-4 text-sky-500" />
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Jump to module, tool, or search chemical…"
          className="h-12 w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
        />
        <kbd className="rounded border border-slate-200 dark:border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">ESC</kbd>
      </div>
      <Command.List className="max-h-[55vh] overflow-y-auto p-2">
        {filteredQuickJumps.length === 0 && results.length === 0 && (
          <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">No results found.</div>
        )}

        {filteredQuickJumps.length > 0 && (
          <Command.Group heading="Quick Jump" className="px-1 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {filteredQuickJumps.map((item) => {
              const Icon = item.icon;
              return (
                <Item key={item.to} value={item.label} onSelect={() => go(item.to)}>
                  <Icon className={`h-4 w-4 ${item.iconClass}`} /> {item.label}
                </Item>
              );
            })}
          </Command.Group>
        )}

        {results.length > 0 && (
          <Command.Group heading="Substances" className="px-1 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {results.map((s) => (
              <Item key={s.id} value={`${s.name} ${s.formula} ${s.symbol || ''}`} onSelect={() => go(`/substances/${s.id}`)}>
                {s.type === 'element' ? <FlaskConical className="h-4 w-4 text-teal-500" /> : <Beaker className="h-4 w-4 text-sky-500" />}
                <span className="flex-1 truncate">{s.name}</span>
                <span className="font-mono text-[10px] text-slate-400">{s.formula}</span>
              </Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}

function Item({ children, value, onSelect }: { children: React.ReactNode; value: string; onSelect: (v: string) => void }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 data-[selected=true]:bg-sky-500/15 data-[selected=true]:text-sky-600 dark:data-[selected=true]:text-sky-300 transition-colors"
    >
      {children}
    </Command.Item>
  );
}
