import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, FlaskConical, Beaker, ArrowRight } from 'lucide-react';
import { api, type SubstanceSummary } from '../api';
import { FormulaDisplay } from '../components/FormulaDisplay';

function formatCategoryLabel(category?: string): string {
  if (!category || !category.trim()) return 'Compound';
  return category
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getCategoryBadgeStyle(category?: string): string {
  const c = (category || '').toLowerCase();
  if (c.includes('acid')) return 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300';
  if (c.includes('base') || c.includes('alkali')) return 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300';
  if (c.includes('salt')) return 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300';
  if (c.includes('oxide')) return 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300';
  if (c.includes('organic') || c.includes('aromatic') || c.includes('hydrocarbon') || c.includes('alcohol') || c.includes('solvent')) {
    return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
  }
  return 'bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300';
}

export default function CompoundsPage() {
  const [compounds, setCompounds] = useState<SubstanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.getCompounds()
      .then((data) => {
        setCompounds(data || []);
      })
      .catch((err) => {
        console.warn('Backend API offline or slow, fallback active:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return compounds;
    return compounds.filter(c => 
      (c.name || '').toLowerCase().includes(q) || 
      (c.formula || '').toLowerCase().includes(q)
    );
  }, [compounds, searchTerm]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header & Instant Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary-600" /> Chemical Compounds
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300">
              {compounds.length} Compounds
            </span>
          </h1>
          <p className="text-xs text-surface-500 mt-0.5">Explore formulas, molecular weights, and hazard classifications.</p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input 
            type="text" 
            placeholder="Search name or formula (e.g. H2O, CH4)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((c) => (
          <Link 
            to={`/substances/${c.id}`} 
            key={c.id} 
            className="glass p-4 rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 transition-all cursor-pointer group no-underline flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-xl font-black tracking-tight text-surface-900 dark:text-surface-50 group-hover:text-primary-600 transition-colors">
                  <FormulaDisplay formula={c.formula || ''} />
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${getCategoryBadgeStyle(c.category)}`}>
                  {formatCategoryLabel(c.category)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-surface-800 dark:text-surface-100 group-hover:text-primary-600 transition-colors truncate">
                {c.name}
              </h3>
              <p className="text-xs text-surface-400 mt-1">
                {c.molar_mass ? `M = ${c.molar_mass} g/mol` : 'Properties available'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-100 dark:border-surface-800/60">
              <span className="text-[10px] font-bold text-surface-400 flex items-center gap-1">
                <Beaker className="w-3 h-3" /> Data verified
              </span>
              <span className="text-xs font-bold text-primary-600 flex items-center gap-0.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                Details <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 glass rounded-2xl border border-dashed border-surface-300 dark:border-surface-700">
          <Beaker className="w-10 h-10 text-surface-400 mb-2" />
          <p className="text-xs text-surface-500 font-medium">No compounds found matching "{searchTerm}".</p>
        </div>
      )}
    </div>
  );
}
