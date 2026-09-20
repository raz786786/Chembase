import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, Home, LayoutGrid, TestTube2, GraduationCap, Settings2, ShieldCheck, Beaker, FlaskConical } from 'lucide-react';
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
      contentClassName="fixed left-1/2 top-[12vh] w-[90vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-surface-700 bg-surface-900 shadow-2xl"
    >
      <div className="flex items-center gap-3 border-b border-surface-800 px-4">
        <Search className="h-4 w-4 text-surface-500" />
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Search substances, jump to pages…"
          className="h-12 w-full bg-transparent text-sm font-semibold text-surface-100 outline-none placeholder:text-surface-500"
        />
        <kbd className="rounded border border-surface-700 px-1.5 py-0.5 text-[10px] font-bold text-surface-500">ESC</kbd>
      </div>
      <Command.List className="max-h-[50vh] overflow-y-auto p-2">
        <Command.Empty className="px-4 py-6 text-center text-xs font-bold text-surface-500">No results found.</Command.Empty>

        <Command.Group heading="Navigation" className="px-1 py-1 text-[10px] font-black uppercase tracking-widest text-surface-500">
          <Item onSelect={() => go('/')}><Home className="h-4 w-4" /> Home</Item>
          <Item onSelect={() => go('/periodic-table')}><LayoutGrid className="h-4 w-4" /> Periodic Table</Item>
          <Item onSelect={() => go('/compounds')}><TestTube2 className="h-4 w-4" /> Compounds</Item>
          <Item onSelect={() => go('/tutor')}><GraduationCap className="h-4 w-4" /> AI Tutor</Item>
          <Item onSelect={() => go('/advanced')}><Settings2 className="h-4 w-4" /> Engineering Hub</Item>
          <Item onSelect={() => go('/deftech-demo')}><ShieldCheck className="h-4 w-4" /> DEFTECH Command</Item>
        </Command.Group>

        {results.length > 0 && (
          <Command.Group heading="Substances" className="px-1 py-1 text-[10px] font-black uppercase tracking-widest text-surface-500">
            {results.map((s) => (
              <Item key={s.id} onSelect={() => go(`/substances/${s.id}`)}>
                {s.type === 'element' ? <FlaskConical className="h-4 w-4" /> : <Beaker className="h-4 w-4" />}
                <span className="flex-1 truncate">{s.name}</span>
                <span className="font-mono text-[10px] text-surface-500">{s.formula}</span>
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
      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-surface-300 data-[selected=true]:bg-primary-600/20 data-[selected=true]:text-primary-300 transition-colors"
    >
      {children}
    </Command.Item>
  );
}
