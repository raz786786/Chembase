import { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp, Info } from 'lucide-react';

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

  const [showSteps, setShowSteps] = useState(false);

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

      {!results.error && def.outputs.length > 0 && (
        <div className="mt-4">
          <button 
            onClick={() => setShowSteps(!showSteps)}
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <Info className="w-4 h-4" /> 
            {showSteps ? 'Hide Calculation Steps' : 'View Calculation Steps (Transparency)'}
            {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showSteps && (
            <div className="mt-3 p-4 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 text-sm space-y-3 animate-in slide-in-from-top-2">
              <div>
                <span className="font-bold text-surface-900 dark:text-white">Given:</span>
                <ul className="list-disc pl-5 text-surface-600 dark:text-surface-400 mt-1">
                  {def.inputs.map(inp => (
                    <li key={inp.id}>{inp.label} = {inputs[inp.id]} {inp.unit}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-bold text-surface-900 dark:text-white">Formula & Substitution:</span>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                  Derived using standard {def.category.toLowerCase()} thermodynamic relations based on the given state parameters.
                </p>
              </div>
              <div>
                <span className="font-bold text-surface-900 dark:text-white">Final Answer:</span>
                <ul className="list-disc pl-5 text-surface-600 dark:text-surface-400 mt-1">
                  {def.outputs.map(out => (
                    <li key={out.id}>
                      {out.label} = <span className="font-bold text-indigo-600 dark:text-indigo-400">{typeof results[out.id] === 'number' ? (results[out.id] as number).toFixed(4) : results[out.id]} {out.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
                <span className="font-bold text-surface-900 dark:text-white text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Engineering Meaning</span>
                <p className="text-surface-600 dark:text-surface-400 mt-1 italic">
                  This value represents the state or transition variable required to evaluate the energy balance or efficiency of the system under these conditions.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
