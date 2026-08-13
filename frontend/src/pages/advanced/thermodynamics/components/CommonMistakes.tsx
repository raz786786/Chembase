import React from 'react';
import { AlertOctagon, XCircle } from 'lucide-react';

const mistakes = [
  "Confusing heat and temperature",
  "Confusing enthalpy and internal energy",
  "Wrong sign convention for work and heat",
  "Using gauge pressure incorrectly instead of absolute pressure",
  "Using °C instead of K in thermodynamic equations",
  "Forgetting kinetic/potential energy terms in SFEE",
  "Incorrect steam-table region lookup (e.g. using superheated tables for wet steam)",
  "Incorrect quality interpretation (x is undefined outside the wet region)",
  "Using ideal-gas assumptions incorrectly for real gases or vapors",
  "Confusing COP with thermal efficiency",
  "Mixing kJ and J in the same energy balance",
  "Incorrect linear interpolation from property tables",
  "Incorrect state identification before starting calculations"
];

export default function CommonMistakes() {
  return (
    <div className="w-full mx-auto bg-white dark:bg-surface-800 rounded-3xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-surface-200 dark:border-surface-700">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Common Mistakes</h2>
          <p className="text-surface-500 mt-1 font-medium">Watch out for these frequent thermodynamic pitfalls.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mistakes.map((mistake, idx) => (
          <div 
            key={idx} 
            className="flex items-start p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          >
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-surface-700 dark:text-surface-300 text-sm font-medium leading-relaxed">
              {mistake}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
