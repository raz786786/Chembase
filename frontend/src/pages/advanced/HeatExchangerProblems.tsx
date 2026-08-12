import { useState } from 'react';
import { 
  CalcCard, 
  ValidationInputRow, 
  ResultBox,
  StepByStepDisplay
} from './SharedComponents';
import { BookOpen, PlaySquare, ToggleLeft, ToggleRight, RefreshCw, Info } from 'lucide-react';

const positiveRule = { rule: (v: number) => v > 0, message: 'Value must be strictly positive (> 0)' };

// Procedural Generator for LMTD
function generateLMTDProblem() {
  let valid = false;
  let Thi = 0, Tho = 0, Tci = 0, Tco = 0, U = 0, Q = 0;
  let config = 'counter';
  let F = 1.0;

  while (!valid) {
    Thi = Math.floor(Math.random() * 100) + 100; // 100 to 200
    Tci = Math.floor(Math.random() * 30) + 15;   // 15 to 45
    Tho = Thi - Math.floor(Math.random() * 40) - 20; // Drop by 20-60
    Tco = Tci + Math.floor(Math.random() * 40) + 20; // Rise by 20-60

    U = Math.floor(Math.random() * 400) + 200; // 200 to 600
    Q = (Math.floor(Math.random() * 400) + 100) * 1000; // 100kW to 500kW

    const dT1 = Thi - Tco;
    const dT2 = Tho - Tci;

    if (dT1 > 5 && dT2 > 5) {
      config = Math.random() > 0.5 ? 'shell_tube' : 'counter';
      
      if (config === 'shell_tube') {
        const R = (Thi - Tho) / (Tco - Tci);
        const P = (Tco - Tci) / (Thi - Tci);
        
        if (Math.abs(R - 1) < 0.001) continue; // Avoid div zero

        const num = Math.sqrt(R * R + 1);
        const den = R - 1;
        const term1 = (1 - P) / (1 - R * P);
        
        if (term1 <= 0) continue; // Temperature cross instability (Kern's formula breakdown)
        
        F = (num / den) * Math.log(term1) / Math.log((2 - P * (R + 1 - num)) / (2 - P * (R + 1 + num)));
        
        // Strict boundary validation
        if (!isNaN(F) && F >= 0.75 && F <= 1.0) {
          valid = true;
        }
      } else {
        F = 1.0;
        valid = true;
      }
    }
  }

  return {
    Thi: Thi.toString(), Tho: Tho.toString(), Tci: Tci.toString(), Tco: Tco.toString(),
    U: U.toString(), Q: Q.toString(), config, F
  };
}

function LMTDProblem({ showSteps, onToggleSteps }: { showSteps: boolean, onToggleSteps: () => void }) {
  const [prob, setProb] = useState(generateLMTDProblem());

  const thi = parseFloat(prob.Thi);
  const tho = parseFloat(prob.Tho);
  const tci = parseFloat(prob.Tci);
  const tco = parseFloat(prob.Tco);
  const u = parseFloat(prob.U);
  const q = parseFloat(prob.Q);

  const dT1 = thi - tco;
  const dT2 = tho - tci;
  
  const isValid = dT1 > 0 && dT2 > 0 && u > 0;
  
  const lmtd = (!isValid || Math.abs(dT1 - dT2) < 0.001) ? dT1 : (dT1 - dT2) / Math.log(dT1 / dT2);
  const area = isValid ? q / (u * prob.F * lmtd) : 0;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-surface-50 dark:bg-surface-900 p-6 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm relative overflow-hidden">
        <button onClick={() => setProb(generateLMTDProblem())} className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors text-xs font-bold">
          <RefreshCw className="w-4 h-4" /> Generate New Problem
        </button>
        <h3 className="text-lg font-black flex items-center gap-2 mb-2 text-primary-600 dark:text-primary-400">
          <BookOpen className="w-5 h-5" /> Procedural Sizing Problem (LMTD)
        </h3>
        <p className="text-sm font-medium text-surface-600 dark:text-surface-300 pr-40">
          <strong>Configuration:</strong> {prob.config === 'shell_tube' ? '1-2 Shell and Tube Exchanger' : 'Counter-flow Double Pipe'}<br/>
          <strong>Objective:</strong> Given the temperatures and required duty, calculate the required heat transfer surface area ($A$).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-surface-400 mb-6">Generated Parameters</h4>
          <div className="space-y-2">
            <ValidationInputRow label="Hot Inlet Temp" unit="°C" value={prob.Thi} onChange={v => setProb({...prob, Thi: v})} allowNegative />
            <ValidationInputRow label="Hot Outlet Temp" unit="°C" value={prob.Tho} onChange={v => setProb({...prob, Tho: v})} allowNegative />
            <ValidationInputRow label="Cold Inlet Temp" unit="°C" value={prob.Tci} onChange={v => setProb({...prob, Tci: v})} allowNegative />
            <ValidationInputRow label="Cold Outlet Temp" unit="°C" value={prob.Tco} onChange={v => setProb({...prob, Tco: v})} allowNegative />
            <ValidationInputRow label="Required Heat Duty" unit="W" value={prob.Q} onChange={v => setProb({...prob, Q: v})} validationRules={[positiveRule]} />
            <ValidationInputRow label="Overall HTC (U)" unit="W/m²·K" value={prob.U} onChange={v => setProb({...prob, U: v})} validationRules={[positiveRule]} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-400">Results</h4>
            <button 
              onClick={onToggleSteps}
              className="flex items-center gap-2 text-xs font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              {showSteps ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {showSteps ? 'Hide Steps' : 'Show Steps'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ResultBox label="LMTD" value={isValid && !isNaN(lmtd) ? lmtd.toFixed(2) : '--'} unit="°C" color="#f97316" />
            <ResultBox label="Required Area" value={isValid && !isNaN(area) ? area.toFixed(2) : '--'} unit="m²" color="#059669" />
          </div>

          <StepByStepDisplay 
            showSteps={showSteps}
            formula={
              `1. ΔT_lm = (ΔT1 - ΔT2) / ln(ΔT1 / ΔT2)\n` +
              (prob.config === 'shell_tube' ? `2. F = Correction Factor (Kern's Formula)\n` : '') +
              `3. A = Q / (U × F × ΔT_lm)`
            }
            substitution={
              isValid ? 
              `ΔT1 = ${thi} - ${tco} = ${dT1}\nΔT2 = ${tho} - ${tci} = ${dT2}\n` +
              `ΔT_lm = (${dT1} - ${dT2}) / ln(${dT1} / ${dT2}) = ${lmtd.toFixed(2)}\n` +
              (prob.config === 'shell_tube' ? `F = ${prob.F.toFixed(3)}\n` : `F = 1.0 (Counter-flow)\n`) +
              `A = ${q} / (${u} × ${prob.F.toFixed(3)} × ${lmtd.toFixed(2)})` : 'Invalid input'
            }
            result={isValid && !isNaN(area) ? `A = ${area.toFixed(2)} m²` : 'Error'}
            insight={prob.config === 'shell_tube' ? `The F factor is ${prob.F.toFixed(3)}. The procedural generator secretly pre-calculates this to ensure F >= 0.75, avoiding physically invalid setups or temperature cross crashes.` : `Pure counter-flow allows for the maximum possible driving force (F=1.0).`}
          />
        </div>
      </div>
    </div>
  );
}

export default function HeatExchangerProblems() {
  const [problemType, setProblemType] = useState<'lmtd' | 'ntu'>('lmtd');
  const [showSteps, setShowSteps] = useState(false);

  return (
    <CalcCard title="Interactive Design Problems" icon={PlaySquare}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Procedurally generated engineering problems. Practice sizing and rating while avoiding fatal mathematical bounds.</p>
      
      <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl w-fit mb-10">
        <button 
          onClick={() => { setProblemType('lmtd'); setShowSteps(false); }} 
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${problemType === 'lmtd' ? 'bg-surface-50 dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
        >
          Sizing (LMTD)
        </button>
        <button 
          onClick={() => { setProblemType('ntu'); setShowSteps(false); }} 
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${problemType === 'ntu' ? 'bg-surface-50 dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
        >
          Rating (NTU)
        </button>
      </div>

      {problemType === 'lmtd' && <LMTDProblem showSteps={showSteps} onToggleSteps={() => setShowSteps(!showSteps)} />}
      {problemType === 'ntu' && (
        <div className="text-center py-12 text-surface-500 dark:text-surface-400 font-medium border border-dashed border-surface-300 dark:border-surface-700 rounded-3xl">
          <Info className="w-8 h-8 mx-auto mb-4 opacity-50" />
          <p>NTU Procedural Generator coming soon in the next architectural update.</p>
        </div>
      )}
    </CalcCard>
  );
}
