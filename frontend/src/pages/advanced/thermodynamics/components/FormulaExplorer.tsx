import { Calculator, Variable, AlertTriangle, Lightbulb } from 'lucide-react';

export default function FormulaExplorer() {
  return (
    <div className="w-full mx-auto bg-white dark:bg-surface-800 rounded-3xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-surface-200 dark:border-surface-700">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Formula Explorer</h2>
          <p className="text-surface-500 mt-1 font-medium">Deep dive into thermodynamic equations and their physical meaning.</p>
        </div>
      </div>

      <div className="bg-surface-50 dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-sm font-bold mb-4">
            Gibbs Free Energy
          </span>
          <h3 className="text-4xl font-serif tracking-wider text-surface-900 dark:text-white font-black">
            ΔG = ΔH − TΔS
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="flex items-center font-bold text-surface-900 dark:text-white text-lg">
              <Variable className="w-5 h-5 mr-2 text-cyan-500" />
              Variables & Meaning
            </h4>
            <ul className="space-y-3">
              <li className="flex flex-col">
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">ΔG (Gibbs Free Energy Change)</span>
                <span className="text-sm text-surface-600 dark:text-surface-400 font-medium">Maximum reversible work obtainable from a system at constant T and P. Predicts reaction spontaneity.</span>
              </li>
              <li className="flex flex-col">
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">ΔH (Enthalpy Change)</span>
                <span className="text-sm text-surface-600 dark:text-surface-400 font-medium">Total heat content change. Negative means exothermic, positive means endothermic.</span>
              </li>
              <li className="flex flex-col">
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">T (Absolute Temperature)</span>
                <span className="text-sm text-surface-600 dark:text-surface-400 font-medium">Must be in Kelvin (K). Scales the entropy contribution.</span>
              </li>
              <li className="flex flex-col">
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">ΔS (Entropy Change)</span>
                <span className="text-sm text-surface-600 dark:text-surface-400 font-medium">Change in system disorder. Positive means increasing disorder.</span>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="flex items-center font-bold text-surface-900 dark:text-white text-lg mb-3">
                <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                Interpretation
              </h4>
              <div className="bg-white dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700 text-sm space-y-2 font-medium">
                <p><strong className="text-rose-500">ΔG &lt; 0:</strong> Spontaneous process</p>
                <p><strong className="text-emerald-500">ΔG = 0:</strong> System at equilibrium</p>
                <p><strong className="text-blue-500">ΔG &gt; 0:</strong> Non-spontaneous process</p>
              </div>
            </div>

            <div>
              <h4 className="flex items-center font-bold text-surface-900 dark:text-white text-lg mb-3">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
                Common Mistakes
              </h4>
              <ul className="list-disc list-inside text-sm text-surface-600 dark:text-surface-400 space-y-1 font-medium">
                <li>Using °C instead of K for Temperature</li>
                <li>Mixing units (ΔH is usually kJ/mol, ΔS is J/K·mol)</li>
                <li>Assuming a spontaneous reaction is fast (kinetics vs thermodynamics)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
