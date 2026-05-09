import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Info } from 'lucide-react';
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
  if (!category) return 'bg-slate-200 dark:bg-slate-800';
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
  return 'bg-slate-200 dark:bg-slate-800';
}

export default function PeriodicTablePage() {
  const [elements, setElements] = useState<SubstanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    api.getElements().then((data) => { setElements(data); setLoading(false); }).catch(console.error);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
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
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-indigo-600" /> Periodic Table of Elements
          </h1>
          <p className="text-slate-500 mt-1">Click on any element to view detailed physical and atomic properties.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button className="px-4 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 rounded-lg shadow-sm text-indigo-600">Standard</button>
          <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Atomic</button>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 scrollbar-hide">
        <div className="grid grid-cols-18 gap-1 min-w-[1000px]">
          {grid.map((row, ri) =>
            row.map((el, ci) => {
              if (!el) {
                if (ri === 5 && ci === 2) return <div key={`${ri}-${ci}`} className="aspect-square rounded-lg bg-lanthanide/20 flex items-center justify-center text-[10px] font-bold text-slate-400">57-71</div>;
                if (ri === 6 && ci === 2) return <div key={`${ri}-${ci}`} className="aspect-square rounded-lg bg-actinide/20 flex items-center justify-center text-[10px] font-bold text-slate-400">89-103</div>;
                if (ri === 7) return <div key={`${ri}-${ci}`} className="h-4" />;
                return <div key={`${ri}-${ci}`} className="aspect-square" />;
              }
              const isInactive = activeFilter && !getCategoryClass(el.category).includes(activeFilter);
              return (
                <Link
                  to={`/substances/${el.id}`}
                  key={el.id}
                  className={`aspect-square rounded-lg ${getCategoryClass(el.category)} p-1.5 flex flex-col justify-between cursor-pointer transition-all hover:scale-125 hover:z-10 hover:shadow-xl no-underline text-slate-900 dark:text-slate-950`}
                  style={{ opacity: isInactive ? 0.15 : 1 }}
                >
                  <span className="text-[10px] font-bold">{el.atomic_number}</span>
                  <span className="text-lg font-black text-center leading-none">{el.symbol}</span>
                  <span className="text-[8px] text-center font-bold truncate leading-none">{el.name}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 items-center justify-center glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        {CATEGORIES.map((cat) => (
          <button 
            key={cat.filter}
            onClick={() => setActiveFilter(activeFilter === cat.filter ? null : cat.filter)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === cat.filter ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            style={{ color: activeFilter && activeFilter !== cat.filter ? '#94a3b8' : 'inherit' }}
          >
            <div className={`w-3 h-3 rounded ${cat.class}`} /> {cat.label}
          </button>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
          <Info className="w-5 h-5 text-indigo-500" /> All Substances
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {elements.map((el) => {
            const isInactive = activeFilter && !getCategoryClass(el.category).includes(activeFilter);
            if (isInactive) return null;
            return (
              <Link to={`/substances/${el.id}`} key={el.id} className="glass p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all flex items-center gap-4 no-underline">
                <div className={`w-12 h-12 rounded-xl ${getCategoryClass(el.category)} flex items-center justify-center text-lg font-black text-slate-900 dark:text-slate-950`}>
                  {el.symbol}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{el.name}</div>
                  <div className="text-xs text-slate-500 font-medium">#{el.atomic_number} · {el.category}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}
