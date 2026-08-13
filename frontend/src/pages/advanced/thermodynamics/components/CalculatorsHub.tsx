import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Calculator } from 'lucide-react';
import { GenericCalculator } from '../engines/GenericCalculator';
import { CALC_DB_1 } from '../engines/CalculatorsDB_1';
import { CALC_DB_2 } from '../engines/CalculatorsDB_2';

// Combine both arrays. 98 total calculators!
const ALL_CALCULATORS = [...CALC_DB_1, ...CALC_DB_2];

export default function CalculatorsHub() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    ALL_CALCULATORS.forEach(c => cats.add(c.category));
    return ['All', ...Array.from(cats)].sort();
  }, []);

  const filteredCalculators = useMemo(() => {
    return ALL_CALCULATORS.filter(calc => {
      const matchesSearch = calc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || calc.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3 mb-2">
          <Calculator className="w-7 h-7 text-indigo-500" /> Complete Calculator Library
        </h2>
        <p className="text-surface-500 mb-6">Access {ALL_CALCULATORS.length} specialized thermodynamics calculators across all topics.</p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input 
              type="text" 
              placeholder="Search calculators (e.g., Rankine, Enthalpy)..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl font-medium outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="relative md:w-64">
            <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <select 
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl font-medium outline-none focus:border-indigo-500 appearance-none transition-colors"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCalculators.map(calc => (
          <GenericCalculator key={calc.id} def={calc} />
        ))}
        
        {filteredCalculators.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white dark:bg-surface-800 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm">
            <Calculator className="w-16 h-16 text-surface-300 dark:text-surface-600 mb-4" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">No calculators found</h3>
            <p className="text-surface-500">Try adjusting your search term or category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
