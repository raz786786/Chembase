'use client';

import { AlertTriangle } from 'lucide-react';
import { MOCK_DEFENSE_DB } from '../../lib/deftech/mockDatabase';

export default function PrecursorRegistry() {
  return (
    <div className="bg-slate-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
        Precursor Inventory Registry
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-slate-300">
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Compound</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Class</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs w-1/3">Stock Level</th>
              <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {MOCK_DEFENSE_DB.map((compound) => {
              const isBreach = compound.currentStockKg > compound.maxPermittedKg;
              const percent = Math.min((compound.currentStockKg / compound.maxPermittedKg) * 100, 100);
              
              return (
                <tr key={compound.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-medium text-slate-200">{compound.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{compound.casNumber} | {compound.unNumber}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-slate-800 rounded border border-zinc-700 text-xs text-slate-300">
                      {compound.explosiveClass}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs text-slate-300 font-mono">
                        <span>{compound.currentStockKg}kg</span>
                        <span>{compound.maxPermittedKg}kg</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isBreach ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {isBreach ? (
                      <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-pulse uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        QUOTA BREACH
                      </div>
                    ) : (
                      <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Nominal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
