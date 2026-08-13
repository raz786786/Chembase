import { useState } from 'react';
import { Lightbulb, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../../../../api';

export default function ProblemSolver() {
  const [problemText, setProblemText] = useState('');
  const [solution, setSolution] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSolve = async () => {
    if (!problemText.trim() || isLoading) return;
    setIsLoading(true);
    setSolution(null);
    try {
      const systemPrompt = `You are an expert AI Thermodynamics Problem Solver for Chemical Engineering.
Given a problem, you MUST output the solution strictly in this format using markdown:
**Topic**: [Identify topic]
**Given**: [List given values with units]
**Find**: [List what needs to be found]
**Assumptions**: [List assumptions, e.g., ideal gas, steady state]
**Formulas**: [List formulas used]
**Solution**: [Step by step derivation]
**Answer**: [Final numerical answer clearly boxed or bolded]
**Interpretation**: [What this result means physically]`;
      
      const response = await api.aiProxy({
        
        prompt: `Solve this thermodynamics problem:\n\n${problemText}`,
        system_prompt: systemPrompt
      });

      setSolution(response.text || 'Could not generate a solution.');
    } catch (err) {
      setSolution('Error connecting to the AI solver. Please check your API keys.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3 mb-2">
          <Lightbulb className="w-7 h-7 text-amber-500" /> AI Problem Solver
        </h2>
        <p className="text-surface-500 mb-6">Paste any thermodynamics numerical problem below for a structured, step-by-step engineering solution.</p>
        
        <div className="space-y-4">
          <textarea
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            placeholder="e.g., Steam enters an adiabatic turbine at 5 MPa and 450°C and leaves at a pressure of 1.4 MPa. Determine the work output of the turbine per unit mass of steam if the process is reversible."
            className="w-full h-32 px-5 py-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium outline-none focus:border-amber-500 shadow-sm resize-none"
          />
          <button 
            onClick={handleSolve}
            disabled={!problemText.trim() || isLoading}
            className="btn-tactile w-full py-4 bg-amber-500 text-white rounded-xl disabled:bg-surface-300 dark:disabled:bg-surface-700 flex items-center justify-center gap-2 font-bold transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">Solving Problem <span className="animate-pulse">...</span></span>
            ) : (
              <span className="flex items-center gap-2">Solve Problem <Send className="w-4 h-4" /></span>
            )}
          </button>
        </div>
      </div>

      {solution && (
        <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
          <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Structured Solution
          </h3>
          <div className="prose dark:prose-invert max-w-none text-surface-700 dark:text-surface-300">
            {/* Note: Ideally use ReactMarkdown here. For simplicity, pre-wrap text */}
            <div className="whitespace-pre-wrap font-medium leading-relaxed">{solution}</div>
          </div>
        </div>
      )}
    </div>
  );
}
