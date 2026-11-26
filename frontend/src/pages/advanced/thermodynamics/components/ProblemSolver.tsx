import { useState } from 'react';
import { Lightbulb, Send, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { api } from '../../../../api';

function localProblemFallback(problemText: string): string {
  const q = problemText.toLowerCase();
  if (q.includes('turbine') || q.includes('compressor') || q.includes('isentropic')) {
    return `**Topic**: Steady-Flow Open System — Adiabatic Reversible (Isentropic) Turbomachinery

**Given**: Inlet and outlet thermodynamic states specified in the problem statement *(offline guidance mode — verify exact steam/gas table lookups in the Property DB tab)*.

**Find**: Specific shaft work $w_s$ (kJ/kg) and outlet thermodynamic state.

**Assumptions**:
- Steady-state, steady-flow control volume
- Adiabatic ($\\dot{Q} = 0$) and reversible ($\\Delta s = 0$, so $s_2 = s_1$)
- Negligible kinetic and potential energy changes ($\\Delta KE \\approx 0, \\Delta PE \\approx 0$)

**Formulas**:
- Steady-Flow Energy Equation (SFEE): $w_s = h_1 - h_2$ (turbine) or $w_{in} = h_2 - h_1$ (compressor)
- Isentropic condition: $s_2 = s_1$; for ideal gas: $T_2 = T_1 (P_2 / P_1)^{(\\gamma - 1)/\\gamma}$
- Wet steam quality (if $s_2 < s_{g2}$): $x_2 = (s_2 - s_{f2}) / s_{fg2}$, $h_2 = h_{f2} + x_2 h_{fg2}$

**Solution**:
1. Look up inlet enthalpy $h_1$ and entropy $s_1$ at $(P_1, T_1)$ in the **Property DB** or **Cycle Analyzer**.
2. Set $s_2 = s_1$ at exit pressure $P_2$ to find exit quality $x_2$ (or superheated $T_2$) and enthalpy $h_2$.
3. Compute shaft work $w_s = h_1 - h_2$ (multiply by isentropic efficiency $\\eta_s$ if non-ideal).

**Answer**: Use the **Property DB** & **100+ Calculators (#19 SFEE / #30 Isentropic)** to substitute exact state enthalpies and obtain the numerical value of $w_s$.

**Interpretation**: Positive $w_s$ indicates work extracted by the turbine from fluid enthalpy drop; minimizing irreversibilities maximizes shaft power output.`;
  }
  if (q.includes('carnot') || q.includes('efficiency') || q.includes('heat engine')) {
    return `**Topic**: Second Law of Thermodynamics — Carnot Heat Engine

**Given**: Reservoir temperatures $T_H$ and $T_L$ (convert °C to K via $T(K) = T(°C) + 273.15$).

**Find**: Maximum theoretical thermal efficiency $\\eta_{\\text{Carnot}}$ and net work output $W_{\\text{net}}$.

**Assumptions**:
- Internally and externally reversible heat engine operating between two thermal reservoirs
- Constant reservoir temperatures $T_H > T_L > 0\\text{ K}$

**Formulas**:
- $\\eta_{\\text{Carnot}} = 1 - \\frac{T_L}{T_H}$
- $W_{\\text{net}} = \\eta_{\\text{Carnot}} \\cdot Q_H$, $\\quad Q_L = Q_H - W_{\\text{net}}$

**Solution**:
1. Convert both temperatures to absolute Kelvin.
2. Evaluate $\\eta = 1 - T_L / T_H$.
3. Compute work $W_{\\text{net}} = \\eta \\cdot Q_H$ if heat input $Q_H$ is given.

**Answer**: Evaluate directly using **Calculator #31 (Carnot Efficiency)** or **#57 (Carnot Cycle Analyzer)** in the Calculators tab.

**Interpretation**: No real engine operating between the same $T_H$ and $T_L$ can exceed $\\eta_{\\text{Carnot}}$; raising $T_H$ or lowering $T_L$ increases maximum convertible work.`;
  }
  return `**Topic**: Engineering Thermodynamics Problem Analysis *(Offline Fallback Mode)*

**Given**: Parameters extracted from: *"${problemText.slice(0, 180)}${problemText.length > 180 ? '...' : ''}"*

**Find**: Requested unknown thermodynamic state variable, heat/work transfer, or equilibrium property.

**Assumptions**:
- Clearly identify system boundary (closed control mass vs. open steady-flow control volume)
- Neglect $\\Delta KE$ and $\\Delta PE$ unless velocities/elevations are specified
- Verify whether working fluid follows Ideal Gas, Real Gas (PR/SRK), or Steam Tables

**Formulas**:
- Closed First Law: $\\Delta U = Q - W$
- Open SFEE: $\\dot{Q} - \\dot{W}_s = \\dot{m}[(h_2 - h_1) + \\frac{1}{2}(v_2^2 - v_1^2) + g(z_2 - z_1)]$
- Second Law / Entropy Balance: $S_{\\text{gen}} = \\Delta S_{\\text{sys}} + \\Delta S_{\\text{surr}} \\ge 0$
- Gibbs Equilibrium: $\\Delta G^\\circ = -RT \\ln K$

**Solution**:
1. Convert all temperatures to Kelvin ($K = °C + 273.15$) and pressures to consistent SI units (kPa / MPa).
2. Fix each independent thermodynamic state using two intensive properties.
3. Apply the governing mass, energy, and entropy balances sequentially.

**Answer**: The live AI service is currently unavailable; use the **100+ Calculators**, **Property DB**, and **Cycle Analyzer** tabs to compute exact numerical results for this problem.

**Interpretation**: Always verify sign conventions (heat in +, work out +) and confirm $S_{\\text{gen}} \\ge 0$ to ensure physical feasibility.`;
}

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

      const text = !response?.error && response?.text?.trim() ? response.text.trim() : '';
      setSolution(text || localProblemFallback(problemText));
    } catch {
      setSolution(localProblemFallback(problemText));
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
          <div className="prose prose-sm dark:prose-invert max-w-none text-surface-700 dark:text-surface-300 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {solution}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
