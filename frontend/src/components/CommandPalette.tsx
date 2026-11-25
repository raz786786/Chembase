import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, Home, LayoutGrid, TestTube2, GraduationCap, Settings2, Beaker, FlaskConical, Zap, Calculator } from 'lucide-react';
import { api, type SubstanceSummary } from '../api';
import { playSound } from '../lib/sound';

interface Props { open: boolean; onOpenChange: (o: boolean) => void }

export default function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SubstanceSummary[]>([]);

  // Ctrl/Cmd+K global listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
        playSound('click');
      }
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      api.search(query).then((r) => setResults(r.substances.slice(0, 6))).catch(() => setResults([]));
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  const go = (to: string) => { onOpenChange(false); playSound('click'); navigate(to); };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
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
        <Command.Empty className="px-4 py-6 text-center text-xs font-bold text-slate-400">No results found.</Command.Empty>

        <Command.Group heading="Quick Jump" className="px-1 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Item onSelect={() => go('/')}><Home className="h-4 w-4 text-sky-500" /> Home</Item>
          <Item onSelect={() => go('/tutor')}><GraduationCap className="h-4 w-4 text-sky-500" /> AI GRUCA Tutor</Item>
          <Item onSelect={() => go('/periodic-table')}><LayoutGrid className="h-4 w-4 text-teal-500" /> Periodic Table</Item>
          <Item onSelect={() => go('/compounds')}><TestTube2 className="h-4 w-4 text-blue-500" /> Compounds</Item>
          <Item onSelect={() => go('/reactions')}><Zap className="h-4 w-4 text-amber-500" /> Reactions</Item>
          <Item onSelect={() => go('/advanced')}><Settings2 className="h-4 w-4 text-sky-500" /> Engineering Hub (27 Modules)</Item>
          <Item onSelect={() => go('/advanced/calculators')}><Calculator className="h-4 w-4 text-teal-500" /> Calculators Hub</Item>
        </Command.Group>

        {results.length > 0 && (
          <Command.Group heading="Substances" className="px-1 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {results.map((s) => (
              <Item key={s.id} onSelect={() => go(`/substances/${s.id}`)}>
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

function Item({ children, onSelect }: { children: React.ReactNode; onSelect: (v: string) => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 data-[selected=true]:bg-sky-500/15 data-[selected=true]:text-sky-600 dark:data-[selected=true]:text-sky-300 transition-colors"
    >
      {children}
    </Command.Item>
  );
}
