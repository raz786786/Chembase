import { useState } from 'react';
import { PlayCircle, Shield, Award, Zap, BrainCircuit } from 'lucide-react';
import { api } from '../../../../api';

const LOCAL_BANK: Record<string, { q: string; s: string }[]> = {
  Basic: [
    {
      q: 'A closed rigid vessel contains 2.0 kg of an ideal gas (Cv = 0.718 kJ/kg·K) initially at 300 K. If 143.6 kJ of heat is added, calculate the final temperature.',
      s: 'Step 1: For a rigid vessel, W = 0.\nStep 2: First Law: Q = ΔU = m·Cv·(T₂ − T₁).\nStep 3: 143.6 = 2.0 × 0.718 × (T₂ − 300).\nStep 4: T₂ − 300 = 143.6 / 1.436 = 100 K.\nFinal Answer: T₂ = 400 K (126.85 °C).'
    },
    {
      q: 'A Carnot heat engine operates between a heat source at 900 K and a sink at 300 K. Find its maximum thermal efficiency and work output if it absorbs 600 kJ of heat.',
      s: 'Step 1: η_Carnot = 1 − T_L / T_H = 1 − 300 / 900 = 0.6667 (66.7%).\nStep 2: W_net = η × Q_H = 0.6667 × 600 kJ = 400 kJ.\nFinal Answer: η = 66.7%, W_net = 400 kJ.'
    },
  ],
  Intermediate: [
    {
      q: 'Air (γ = 1.4, Cp = 1.005 kJ/kg·K) is compressed isentropically in a steady-flow compressor from 100 kPa, 300 K to 600 kPa. Calculate the exit temperature and specific work required.',
      s: 'Step 1: Isentropic relation: T₂ = T₁·(P₂/P₁)^((γ−1)/γ) = 300 × 6^(0.2857) = 500.6 K.\nStep 2: Specific work: w_in = Cp·(T₂ − T₁) = 1.005 × (500.6 − 300) = 201.6 kJ/kg.\nFinal Answer: T₂ = 500.6 K, w_in = 201.6 kJ/kg.'
    },
  ],
  Advanced: [
    {
      q: 'Steam enters an adiabatic turbine at 4 MPa, 450 °C (h₁ = 3330.3 kJ/kg, s₁ = 6.936 kJ/kg·K) and expands to 10 kPa (hf = 191.8, hfg = 2392.8 kJ/kg, sf = 0.649, sfg = 7.501 kJ/kg·K). If isentropic efficiency is 85%, find actual shaft work per kg.',
      s: 'Step 1: Isentropic exit quality: x₂s = (s₁ − sf)/sfg = (6.936 − 0.649)/7.501 = 0.838.\nStep 2: h₂s = 191.8 + 0.838 × 2392.8 = 2197.0 kJ/kg.\nStep 3: w_actual = η_t × (h₁ − h₂s) = 0.85 × (3330.3 − 2197.0) = 963.3 kJ/kg.\nFinal Answer: w_actual = 963.3 kJ/kg.'
    },
  ],
  Challenge: [
    {
      q: 'For the water-gas shift reaction CO(g) + H₂O(g) ⇌ CO₂(g) + H₂(g), ΔG°(700 K) = −12.1 kJ/mol. Starting with equimolar CO and H₂O at 700 K and 1 bar, compute the equilibrium conversion.',
      s: 'Step 1: K = exp(−ΔG° / RT) = exp(12100 / (8.314 × 700)) = exp(2.079) = 8.00.\nStep 2: For equimolar feed, K = x² / (1 − x)² ⇒ x / (1 − x) = √8.00 = 2.828.\nStep 3: x = 2.828 / 3.828 = 0.739.\nFinal Answer: Equilibrium conversion X = 73.9%.'
    },
  ],
};

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
        
        prompt: prompt,
        system_prompt: 'You are an expert Thermodynamics Professor.'
      });

      const text = response?.text || '';
      const parts = text.split('[SOLUTION]');
      if (parts.length === 2) {
        setQuestion(parts[0].replace('[QUESTION]', '').trim());
        setSolution(parts[1].trim());
      } else {
        const pool = LOCAL_BANK[level] || LOCAL_BANK.Basic;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setQuestion(pick.q);
        setSolution(pick.s);
      }
    } catch {
      const pool = LOCAL_BANK[level] || LOCAL_BANK.Basic;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setQuestion(pick.q);
      setSolution(pick.s);
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
