import { useState } from 'react';
import { PlayCircle, Shield, Award, Zap, BrainCircuit } from 'lucide-react';
import { api } from '../../../../api';

export default function Practice() {
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateQuestion = async (level: string) => {
    setIsLoading(true);
    setDifficulty(level);
    setShowSolution(false);
    setSolution(null);
    setQuestion(null);
    
    try {
      const prompt = `Generate a unique Thermodynamics practice question for a Chemical Engineering student at the '${level}' difficulty level. 
Levels:
- Basic: Conceptual + simple numerical.
- Intermediate: Multi-step numerical problems.
- Advanced: University-level examination problems.
- Challenge: Complex engineering problems involving multiple concepts.

Format your response strictly as:
[QUESTION]
<The question text>
[SOLUTION]
<Step-by-step solution ending with the final answer>`;

      const response = await api.aiProxy({
        provider: 'gemini',
        api_key: localStorage.getItem('GEMINI_API_KEY') || '',
        prompt: prompt,
        system_prompt: 'You are an expert Thermodynamics Professor.'
      });

      const text = response.text || '';
      const parts = text.split('[SOLUTION]');
      if (parts.length === 2) {
        setQuestion(parts[0].replace('[QUESTION]', '').trim());
        setSolution(parts[1].trim());
      } else {
        setQuestion("Failed to parse the question format. Please try again.");
      }
    } catch (err) {
      setQuestion("Error connecting to AI. Please check your API keys.");
    } finally {
      setIsLoading(false);
    }
  };

  const levels = [
    { id: 'Basic', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'Intermediate', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'Advanced', icon: BrainCircuit, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
    { id: 'Challenge', icon: Award, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-200' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 border border-surface-200 dark:border-surface-700 shadow-sm">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3 mb-2">
          <PlayCircle className="w-7 h-7 text-rose-500" /> Practice System
        </h2>
        <p className="text-surface-500 mb-6">Dynamic, AI-generated problems. Choose your difficulty level.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {levels.map(lvl => (
            <button 
              key={lvl.id}
              onClick={() => generateQuestion(lvl.id)}
              disabled={isLoading}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${lvl.bg} ${lvl.border} hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 dark:bg-surface-900 dark:border-surface-700`}
            >
              <lvl.icon className={`w-8 h-8 ${lvl.color}`} />
              <span className={`font-bold ${lvl.color}`}>{lvl.id}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="bg-white dark:bg-surface-800 rounded-3xl p-12 border border-surface-200 dark:border-surface-700 shadow-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-surface-200 border-t-rose-500 animate-spin mb-4" />
          <p className="text-surface-500 font-bold">Generating a unique {difficulty} problem...</p>
        </div>
      )}

      {question && !isLoading && (
        <div className="bg-white dark:bg-surface-800 rounded-3xl p-8 border border-surface-200 dark:border-surface-700 shadow-sm animate-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-surface-400 uppercase tracking-wider mb-2">Problem ({difficulty})</h3>
            <div className="text-lg font-medium text-surface-900 dark:text-white leading-relaxed whitespace-pre-wrap">
              {question}
            </div>
          </div>
          
          {!showSolution ? (
            <button 
              onClick={() => setShowSolution(true)}
              className="px-6 py-3 bg-surface-100 dark:bg-surface-900 text-surface-600 dark:text-surface-300 font-bold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            >
              Reveal Solution
            </button>
          ) : (
            <div className="pt-6 border-t border-surface-200 dark:border-surface-700">
              <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4">Solution</h3>
              <div className="prose dark:prose-invert max-w-none text-surface-700 dark:text-surface-300 whitespace-pre-wrap font-medium">
                {solution}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
