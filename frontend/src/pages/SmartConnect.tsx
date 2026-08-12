import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Target, Sigma, ExternalLink, ChevronDown } from 'lucide-react';
import { detectTopics } from './smartTopics';

// ─── Smart Connect panel: shows the concept path + tools for the question ───
function SmartConnectPanel({ text }: { text: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const topics = detectTopics(text, 3);
  if (topics.length === 0) return null;
  return (
    <div className="rounded-2xl border border-primary-200 dark:border-primary-800/60 bg-gradient-to-br from-primary-50/80 to-violet-50/60 dark:from-primary-950/40 dark:to-violet-950/30 p-5 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-8 h-8 rounded-xl bg-primary-600 text-surface-50 flex items-center justify-center shadow-md shadow-primary-500/30">
          <Compass className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-sm font-black text-surface-800 dark:text-surface-50">Smart Connect</h3>
          <p className="text-[10px] text-surface-500 dark:text-surface-400">ChemBase recognised {topics.length} topic{topics.length > 1 ? 's' : ''} — jump straight to the right tools.</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {topics.map(t => {
          const isOpen = open === t.id;
          return (
            <div key={t.id} className="rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/80 overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : t.id)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors">
                <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest whitespace-nowrap">{t.path.split('→')[0].trim()}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-surface-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                <span className="ml-auto text-[10px] font-black text-primary-600 dark:text-primary-400 whitespace-nowrap">{t.path}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-300">
                  <p className="text-[11px] text-surface-600 dark:text-surface-300 leading-relaxed">{t.explain}</p>
                  <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 p-3 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-surface-400 flex items-center gap-1"><Sigma className="w-3 h-3" /> Key equations</p>
                    {t.equations.map((e, i) => (
                      <p key={i} className="font-mono text-[10px] font-bold text-surface-700 dark:text-surface-200">{e}</p>
                    ))}
                  </div>
                  <div className="rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50/60 dark:bg-accent-900/10 p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-accent-600 dark:text-accent-400 flex items-center gap-1 mb-1"><Target className="w-3 h-3" /> Practice question</p>
                    <p className="text-[10px] text-surface-600 dark:text-surface-300 leading-relaxed">{t.practice}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.links.map(l => (
                      <Link key={l.to + l.label} to={l.to}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black bg-primary-600 text-surface-50 hover:bg-primary-700 transition-all shadow-sm shadow-primary-500/20">
                        <ExternalLink className="w-3 h-3" /> {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SmartConnectPanel;
