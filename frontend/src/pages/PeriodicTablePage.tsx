import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ListFilter, Search, ArrowLeftRight } from 'lucide-react';
import { api, type SubstanceSummary } from '../api';

const CATEGORIES = [
  { label: 'Alkali', class: 'bg-alkali', filter: 'alkali' },
  { label: 'Alkaline Earth', class: 'bg-alkaline', filter: 'alkaline' },
  { label: 'Transition', class: 'bg-transition', filter: 'transition' },
  { label: 'Post-Transition', class: 'bg-post', filter: 'post' },
  { label: 'Metalloid', class: 'bg-metalloid', filter: 'metalloid' },
  { label: 'Nonmetal', class: 'bg-nonmetal', filter: 'nonmetal' },
  { label: 'Halogen', class: 'bg-halogen', filter: 'halogen' },
  { label: 'Noble Gas', class: 'bg-noble', filter: 'noble' },
  { label: 'Lanthanide', class: 'bg-lanthanide', filter: 'lanthanide' },
  { label: 'Actinide', class: 'bg-actinide', filter: 'actinide' }
];

function getCategoryClass(category?: string): string {
  if (!category) return 'bg-surface-200 dark:bg-surface-800';
  const c = category.toLowerCase();
  if (c.includes('alkali metal')) return 'bg-alkali';
  if (c.includes('alkaline earth')) return 'bg-alkaline';
  if (c.includes('transition metal')) return 'bg-transition';
  if (c.includes('post-transition')) return 'bg-post';
  if (c.includes('metalloid')) return 'bg-metalloid';
  if (c.includes('nonmetal')) return 'bg-nonmetal';
  if (c.includes('halogen')) return 'bg-halogen';
  if (c.includes('noble gas')) return 'bg-noble';
  if (c.includes('lanthanide')) return 'bg-lanthanide';
  if (c.includes('actinide')) return 'bg-actinide';
  return 'bg-surface-200 dark:bg-surface-800';
}

export default function PeriodicTablePage() {
  const [elements, setElements] = useState<SubstanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getElements()
      .then((data) => {
        setElements(data || []);
      })
      .catch((err) => {
        console.warn('Backend API offline or slow, fallback active:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredElements = useMemo(() => {
    return elements.filter((el) => {
      const matchesCategory = !activeFilter || getCategoryClass(el.category) === 'bg-' + activeFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCategory;
      const matchesSearch =
        (el.name || '').toLowerCase().includes(q) ||
        (el.symbol || '').toLowerCase().includes(q) ||
        String(el.atomic_number || '').includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [elements, activeFilter, searchQuery]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  const grid: (SubstanceSummary | null)[][] = Array(10).fill(null).map(() => Array(18).fill(null));

  elements.forEach((el) => {
    if (!el.atomic_number) return;
    const z = el.atomic_number;
    
    if (z >= 57 && z <= 71) {
      grid[8][z - 57 + 2] = el;
    } else if (z >= 89 && z <= 103) {
      grid[9][z - 89 + 2] = el;
    } else if (el.period && el.group_number) {
      grid[el.period - 1][el.group_number - 1] = el;
    }
  });

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Compact Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary-600" /> Periodic Table
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300">
              {elements.length || 118} Elements
            </span>
          </h1>
          <p className="text-xs text-surface-500 mt-0.5">Explore atomic weights, electron configs, and elemental families.</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-surface-50 dark:bg-surface-900 text-primary-600 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-surface-50 dark:bg-surface-900 text-primary-600 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" /> Search & List
          </button>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="touch-scroll-x flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        <button
          onClick={() => setActiveFilter(null)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all ${
            activeFilter === null
              ? 'bg-primary-600 text-surface-50 shadow-sm'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-primary-600'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const isActive = activeFilter === cat.filter;
          return (
            <button
              key={cat.filter}
              onClick={() => setActiveFilter(isActive ? null : cat.filter)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-surface-900 dark:bg-surface-50 text-surface-50 dark:text-surface-900 shadow-sm'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cat.class}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Mode 1: Standard 18-Column Interactive Grid */}
      {viewMode === 'grid' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-surface-400 px-1 md:hidden">
            <span className="flex items-center gap-1">
              <ArrowLeftRight className="w-3 h-3 text-primary-500" /> Swipe horizontally to explore all 18 groups
            </span>
          </div>

          <div className="overflow-x-auto touch-pan-x pb-4 scrollbar-thin rounded-2xl glass p-3 border border-surface-200 dark:border-surface-800">
            <div className="grid grid-cols-18 gap-1 min-w-[960px]">
              {grid.map((row, ri) =>
                row.map((el, ci) => {
                  if (!el) {
                    if (ri === 5 && ci === 2) {
                      return (
                        <div key={`${ri}-${ci}`} className="aspect-square rounded-lg bg-lanthanide/20 flex items-center justify-center text-[10px] font-bold text-surface-400">
                          57-71
                        </div>
                      );
                    }
                    if (ri === 6 && ci === 2) {
                      return (
                        <div key={`${ri}-${ci}`} className="aspect-square rounded-lg bg-actinide/20 flex items-center justify-center text-[10px] font-bold text-surface-400">
                          89-103
                        </div>
                      );
                    }
                    if (ri === 7) return <div key={`${ri}-${ci}`} className="h-3" />;
                    return <div key={`${ri}-${ci}`} className="aspect-square" />;
                  }

                  const isInactive = activeFilter && getCategoryClass(el.category) !== 'bg-' + activeFilter;
                  return (
                    <Link
                      to={`/substances/${el.id}`}
                      key={el.id}
                      className={`aspect-square rounded-lg ${getCategoryClass(el.category)} p-1 flex flex-col justify-between cursor-pointer transition-all hover:scale-125 hover:z-20 hover:shadow-xl no-underline text-surface-950`}
                      style={{ opacity: isInactive ? 0.15 : 1 }}
                      title={`${el.name} (${el.symbol}) #${el.atomic_number}`}
                    >
                      <span className="text-[9px] font-bold leading-none">{el.atomic_number}</span>
                      <span className="text-base font-black text-center leading-none">{el.symbol}</span>
                      <span className="text-[8px] text-center font-bold truncate leading-none">{el.name}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Search & High-Density Responsive List View (Optimized for Mobile & Fast Lookups) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, symbol, or atomic number..."
              className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredElements.map((el) => (
              <Link
                to={`/substances/${el.id}`}
                key={el.id}
                className="glass p-2.5 rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 transition-all flex items-center gap-2.5 no-underline group"
              >
                <div className={`w-9 h-9 rounded-lg ${getCategoryClass(el.category)} flex items-center justify-center text-sm font-black text-surface-950 flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {el.symbol}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-surface-900 dark:text-surface-50 truncate group-hover:text-primary-600 transition-colors">
                    {el.name}
                  </div>
                  <div className="text-[10px] text-surface-400 truncate">
                    #{el.atomic_number} · {el.category || 'Element'}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredElements.length === 0 && (
            <div className="text-center py-12 text-surface-400 text-xs">
              No elements found matching "{searchQuery}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
