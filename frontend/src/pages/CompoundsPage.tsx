import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FlaskConical, Beaker, Info } from 'lucide-react';
import { api, type SubstanceSummary } from '../api';
import { FormulaDisplay } from '../components/FormulaDisplay';

export default function CompoundsPage() {
  const [compounds, setCompounds] = useState<SubstanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.getCompounds().then((data) => { setCompounds(data); setLoading(false); }).catch(console.error);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  const filtered = compounds.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.formula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-indigo-600" /> Chemical Compounds
          </h1>
          <p className="text-slate-500 mt-1">Browse the compound database — click any compound for details and hazard information.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search compounds (e.g. Acetone, H2O)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <Link 
            to={`/substances/${c.id}`} 
            key={c.id} 
            className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group no-underline"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                <FormulaDisplay formula={c.formula} />
              </span>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                c.formula.includes('O') ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
              }`}>
                {c.formula.includes('O') ? 'Oxidizer' : 'Stable'}
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              {c.name}
            </h3>
            <p className="text-sm text-slate-500 mb-4 font-medium">
              {c.molar_mass ? `M = ${c.molar_mass} g/mol` : 'Properties available'}
            </p>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500 transition-colors">
                <Beaker className="w-4 h-4" />
              </div>
              <div className="flex-grow flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">Details <Info className="w-3 h-3" /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <Beaker className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No compounds found matching "{searchTerm}".</p>
        </div>
      )}
    </div>
  );
}
