import { useState } from 'react';
import { Calculator } from 'lucide-react';

export interface CalcInput {
  id: string;
  label: string;
  unit: string;
  default: number;
}

export interface CalcOutput {
  id: string;
  label: string;
  unit: string;
}

export interface CalcDef {
  id: string;
  title: string;
  category: string;
  inputs: CalcInput[];
  outputs: CalcOutput[];
  calculate: (inputs: Record<string, number>) => Record<string, number | string>;
}

interface GenericCalculatorProps {
  def: CalcDef;
}

export function GenericCalculator({ def }: GenericCalculatorProps) {
  const [inputs, setInputs] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    def.inputs.forEach(i => { init[i.id] = i.default; });
    return init;
  });

  const handleChange = (id: string, val: string) => {
    setInputs(prev => ({ ...prev, [id]: parseFloat(val) || 0 }));
  };

  let results: Record<string, number | string> = {};
  try {
    results = def.calculate(inputs);
  } catch (e) {
    results = { error: 'Calculation Error' };
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm animate-in fade-in duration-300">
      <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-indigo-500" /> {def.title}
      </h3>
      
      <div className="space-y-4 mb-6">
        {def.inputs.map(inp => (
          <div key={inp.id}>
            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1">
              {inp.label}
            </label>
            <div className="flex bg-surface-50 dark:bg-surface-900 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
              <input 
                type="number" 
                value={inputs[inp.id]} 
                onChange={e => handleChange(inp.id, e.target.value)} 
                className="w-full bg-transparent px-4 py-2 font-bold outline-none text-surface-900 dark:text-white" 
              />
              <span className="px-4 py-2 bg-surface-100 dark:bg-surface-800 text-surface-500 font-bold border-l border-surface-200 dark:border-surface-700">
                {inp.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30 space-y-3">
        {results.error ? (
          <div className="text-red-500 font-bold">{results.error}</div>
        ) : (
          def.outputs.map(out => (
            <div key={out.id} className="flex justify-between items-baseline border-b border-indigo-200/50 dark:border-indigo-800/50 pb-2 last:border-0 last:pb-0">
              <span className="text-sm font-semibold text-indigo-700/70 dark:text-indigo-300/70">{out.label}</span>
              <span className="text-base font-black text-indigo-900 dark:text-indigo-100">
                {typeof results[out.id] === 'number' ? (results[out.id] as number).toFixed(4) : results[out.id]} {out.unit}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
