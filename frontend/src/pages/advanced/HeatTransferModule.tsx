import { useState } from 'react';
import { 
  RefreshCw, 
  ClipboardList, 
  Zap, 
  Thermometer,
  Network,
  AlertTriangle
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';
import { ValidationInputRow, StepByStepDisplay } from './SharedComponents';
import ShellAndTubeConsultant from './ShellAndTubeConsultant';

const fmt = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '--');

// ─── LMTD METHOD ───
const positiveRule = { rule: (v: number) => v > 0, message: 'Value must be strictly positive (> 0)' };

function LMTDCalc() {
  const [showSteps, setShowSteps] = useState(false);
  const [flowType, setFlowType] = useState<'counter' | 'parallel'>('counter');
  const [Thi, setThi] = useState('150');
  const [Tho, setTho] = useState('90');
  const [Tci, setTci] = useState('30');
  const [Tco, setTco] = useState('70');
  const [U, setU] = useState('300');
  const [A, setA] = useState('10');

  const thi = parseFloat(Thi), tho = parseFloat(Tho), tci = parseFloat(Tci), tco = parseFloat(Tco), u = parseFloat(U), a = parseFloat(A);

  let dT1: number, dT2: number;
  if (flowType === 'counter') {
    dT1 = thi - tco;
    dT2 = tho - tci;
  } else {
    dT1 = thi - tci;
    dT2 = tho - tco;
  }

  const tempCross = !isNaN(dT1) && !isNaN(dT2) && (dT1 <= 0 || dT2 <= 0);
  const lmtd = (isNaN(dT1) || isNaN(dT2) || tempCross)
    ? NaN
    : Math.abs(dT1 - dT2) < 0.001
      ? dT1
      : (dT1 - dT2) / Math.log(dT1 / dT2);
  const Q = !isNaN(lmtd) && u > 0 && a > 0 ? u * a * lmtd : NaN;

  return (
    <CalcCard title="Log-Mean Temperature Difference" icon={RefreshCw}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Standard method for determining the temperature driving force in heat exchangers.</p>
      
      <div className="mb-10">
        <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Flow Configuration</label>
        <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl w-fit">
          {(['counter', 'parallel'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFlowType(f)} 
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                flowType === f 
                ? 'bg-surface-50 dark:bg-surface-700 text-accent-600 shadow-sm' 
                : 'text-surface-400 hover:text-surface-600'
              }`}
            >
              {f} Flow
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-rose-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-surface-50">Hot Fluid Path</h4>
          </div>
          <ValidationInputRow label="Inlet Temp (T_hi)" unit="°C" value={Thi} onChange={setThi} allowNegative />
          <ValidationInputRow label="Outlet Temp (T_ho)" unit="°C" value={Tho} onChange={setTho} allowNegative />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-primary-500 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-surface-50">Cold Fluid Path</h4>
          </div>
          <ValidationInputRow label="Inlet Temp (T_ci)" unit="°C" value={Tci} onChange={setTci} allowNegative />
          <ValidationInputRow label="Outlet Temp (T_co)" unit="°C" value={Tco} onChange={setTco} allowNegative />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-t border-surface-100 dark:border-surface-800 pt-10">
        <ValidationInputRow label="Overall HT Coeff. (U)" unit="W/m²·K" value={U} onChange={setU} validationRules={[positiveRule]} />
        <ValidationInputRow label="Heat Transfer Area (A)" unit="m²" value={A} onChange={setA} validationRules={[positiveRule]} />
      </div>

      <div className="flex justify-between items-center mb-6 border-t border-surface-100 dark:border-surface-800 pt-10">
        <h4 className="text-xs font-black uppercase tracking-widest text-surface-400">Results</h4>
        <button 
          onClick={() => setShowSteps(!showSteps)}
          className="flex items-center gap-2 text-xs font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
        >
          {showSteps ? 'Hide Steps' : 'Show Steps'}
        </button>
      </div>

      {tempCross && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>Temperature Cross Detected: ΔT₁ = {fmt(dT1, 1)}°C, ΔT₂ = {fmt(dT2, 1)}°C. Both terminal approaches must be strictly positive (&gt; 0) for LMTD to be defined.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="LMTD (ΔT_lm)" value={fmt(lmtd, 2)} unit="°C" color="#f97316" />
        <ResultBox label="Total Heat Duty" value={fmt(Q / 1000, 2)} unit="kW" color="#ea580c" />
        <ResultBox label="Temp Approach" value={`${fmt(dT1, 1)} / ${fmt(dT2, 1)}`} unit="°C" />
      </div>

      <StepByStepDisplay
        showSteps={showSteps}
        formula={
          flowType === 'counter'
            ? 'ΔT₁ = T_hi − T_co\nΔT₂ = T_ho − T_ci\nΔT_lm = (ΔT₁ − ΔT₂) / ln(ΔT₁ / ΔT₂)\nQ = U × A × ΔT_lm'
            : 'ΔT₁ = T_hi − T_ci\nΔT₂ = T_ho − T_co\nΔT_lm = (ΔT₁ − ΔT₂) / ln(ΔT₁ / ΔT₂)\nQ = U × A × ΔT_lm'
        }
        substitution={
          `ΔT₁ = ${fmt(dT1, 2)} °C, ΔT₂ = ${fmt(dT2, 2)} °C\n` +
          `ΔT_lm = (${fmt(dT1, 2)} − ${fmt(dT2, 2)}) / ln(${fmt(dT1, 2)} / ${fmt(dT2, 2)}) = ${fmt(lmtd, 2)} °C\n` +
          `Q = ${fmt(u, 1)} × ${fmt(a, 2)} × ${fmt(lmtd, 2)} = ${fmt(Q, 1)} W`
        }
        result={`LMTD = ${fmt(lmtd, 2)} °C\nQ = ${fmt(Q / 1000, 2)} kW`}
        insight={
          tempCross
            ? 'Temperature cross violates the Second Law for this flow arrangement. Switch to counter-flow or adjust stream temperatures.'
            : 'Counter-flow generally yields a higher LMTD than parallel flow for the same terminal temperatures, reducing required heat transfer area.'
        }
      />

    </CalcCard>
  );
}

// ─── COOLING TOWER MERKEL EQUATION & CHEBYSHEV 4-POINT QUADRATURE ───
function CoolingTowerMerkelCalc() {
  const [twin, setTwin] = useState('42'); // °C water in
  const [twout, setTwout] = useState('29'); // °C water out
  const [twb, setTwb] = useState('24'); // °C wet bulb
  const [lgRatio, setLgRatio] = useState('1.1'); // L/G mass ratio

  const T1 = parseFloat(twin), T2 = parseFloat(twout), Twb_c = parseFloat(twb), lg = parseFloat(lgRatio);

  let merkelVal = NaN;
  let coolingRange = NaN;
  let approach = NaN;
  let pinchViolated = false;
  let statusText = 'Invalid Inputs';

  if (!isNaN(T1) && !isNaN(T2) && !isNaN(Twb_c) && !isNaN(lg) && T1 > T2 && T2 > Twb_c && lg > 0 && T1 < 99.5) {
    coolingRange = T1 - T2;
    approach = T2 - Twb_c;

    // Air enthalpy at wet bulb h_in (kJ/kg)
    const psat_wb = 0.61078 * Math.exp((17.27 * Twb_c) / (Twb_c + 237.3));
    const h_in = 1.006 * Twb_c + ((0.622 * psat_wb) / (101.325 - psat_wb)) * (2501 + 1.86 * Twb_c);

    // Chebyshev 4-point quadrature weights & nodes
    const chebNodes = [0.102673, 0.406204, 0.593796, 0.897327];
    let sum_quad = 0;

    for (const x_i of chebNodes) {
      const T_i = T2 + x_i * (T1 - T2);
      // Saturated air enthalpy at water temperature T_i
      const psat_i = 0.61078 * Math.exp((17.27 * T_i) / (T_i + 237.3));
      const w_sat_i = (0.622 * psat_i) / (101.325 - psat_i);
      const h_sat_i = 1.006 * T_i + w_sat_i * (2501 + 1.86 * T_i);

      // Bulk air enthalpy at height x_i: h_a(x_i) = h_in + lg * 4.184 * (T_i - T2)
      const h_a_i = h_in + lg * 4.184 * (T_i - T2);
      const dh = h_sat_i - h_a_i;

      if (dh <= 0) {
        pinchViolated = true;
        break;
      }
      sum_quad += 1 / dh;
    }

    if (pinchViolated) {
      merkelVal = NaN;
      statusText = 'Pinch Violated (L/G too high)';
    } else {
      merkelVal = (4.184 * (T1 - T2) / 4) * sum_quad;
      statusText = '4-Point Valid';
    }
  }

  return (
    <CalcCard title="Cooling Tower Merkel Integration (Chebyshev 4-Point)" icon={RefreshCw}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Simultaneous heat/mass transfer enthalpy driving force integration (KaV/L) via Chebyshev 4-point quadrature.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <InputRow label="Water Inlet Temp (T_w1)" unit="°C" value={twin} onChange={setTwin} />
          <InputRow label="Water Outlet Temp (T_w2)" unit="°C" value={twout} onChange={setTwout} />
        </div>
        <div className="space-y-4">
          <InputRow label="Air Wet-Bulb Temp (T_wb)" unit="°C" value={twb} onChange={setTwb} />
          <InputRow label="Water/Air Ratio (L/G)" unit="kg/kg" value={lgRatio} onChange={setLgRatio} />
        </div>
      </div>

      {pinchViolated && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>Pinch Violated (L/G too high): Operating line crosses the air saturation enthalpy curve (h_sat − h_a ≤ 0). Reduce L/G ratio or relax the cooling approach.</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ResultBox label="Merkel Number (KaV/L)" value={isNaN(merkelVal) ? '--' : merkelVal.toFixed(3)} unit="" color="#6366f1" />
        <ResultBox label="Cooling Range" value={isNaN(coolingRange) ? '--' : coolingRange.toFixed(1)} unit="°C" color="#ea580c" />
        <ResultBox label="Approach to Wet Bulb" value={isNaN(approach) ? '--' : approach.toFixed(1)} unit="°C" color="#10b981" />
        <ResultBox label="Chebyshev Status" value={statusText} unit="" color={pinchViolated ? '#ef4444' : statusText === '4-Point Valid' ? '#8b5cf6' : '#94a3b8'} />
      </div>
    </CalcCard>
  );
}

// ─── GNIELINSKI CONVECTION HEAT TRANSFER CORRELATION ───
function ConvectionGnielinskiCalc() {
  const [reynolds, setReynolds] = useState('15000');
  const [prandtl, setPrandtl] = useState('5.2');
  const [kFluid, setKFluid] = useState('0.6'); // W/m·K (water)
  const [diameter, setDiameter] = useState('0.025'); // m

  const Re = parseFloat(reynolds), Pr = parseFloat(prandtl), k_f = parseFloat(kFluid), D = parseFloat(diameter);

  let Nu = NaN;
  let h_coeff = NaN;
  let regimeStr = '--';
  const prOutOfRange = Number.isFinite(Pr) && Pr > 0 && (Pr < 0.5 || Pr > 2000);

  if (!isNaN(Re) && !isNaN(Pr) && !isNaN(k_f) && !isNaN(D) && Re > 0 && Pr > 0 && k_f > 0 && D > 0) {
    if (Re < 2300) {
      Nu = 4.36; // Constant heat flux laminar
      regimeStr = 'Laminar (Nu = 4.36)';
    } else {
      // Colebrook/Petukhov friction factor f = (0.790 * ln(Re) - 1.64)^-2
      const f = Math.pow(0.790 * Math.log(Re) - 1.64, -2);
      // Gnielinski correlation: Nu = ((f/8)*(Re-1000)*Pr) / (1 + 12.7*sqrt(f/8)*(Pr^(2/3) - 1))
      const num = (f / 8) * (Re - 1000) * Pr;
      const den = 1 + 12.7 * Math.sqrt(f / 8) * (Math.pow(Pr, 2 / 3) - 1);
      Nu = den > 0 ? num / den : NaN;
      regimeStr = Number.isFinite(Nu) ? (Re < 4000 ? 'Transitional (Gnielinski)' : 'Turbulent (Gnielinski)') : '--';
    }
    h_coeff = Number.isFinite(Nu) ? (Nu * k_f) / D : NaN;
  }

  return (
    <CalcCard title="Gnielinski Convective Heat Transfer Correlation" icon={Zap}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Precise Nusselt (Nu) & convection coefficient (h) for transitional/turbulent internal flow.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <InputRow label="Reynolds Number (Re)" unit="" value={reynolds} onChange={setReynolds} />
          <InputRow label="Prandtl Number (Pr)" unit="" value={prandtl} onChange={setPrandtl} />
        </div>
        <div className="space-y-4">
          <InputRow label="Fluid Thermal Cond. (k)" unit="W/m·K" value={kFluid} onChange={setKFluid} />
          <InputRow label="Hydraulic Diameter (D)" unit="m" value={diameter} onChange={setDiameter} />
        </div>
      </div>

      {prOutOfRange && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-bold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          <span>Prandtl Number Out of Validity Range: Gnielinski correlation is validated for 0.5 ≤ Pr ≤ 2000 (entered Pr = {Pr}). Use liquid-metal or specialized correlations outside this range.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Nusselt Number (Nu)" value={!Number.isFinite(Nu) ? '--' : Nu.toFixed(2)} unit="" color="#6366f1" />
        <ResultBox label="Convection Coeff. (h)" value={!Number.isFinite(h_coeff) ? '--' : h_coeff.toFixed(1)} unit="W/m²·K" color="#ea580c" />
        <ResultBox label="Flow & Model State" value={regimeStr} unit="" color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── RIGOROUS EFFECTIVENESS-NTU METHOD ───
function NTUCalc() {
  const [showSteps, setShowSteps] = useState(false);
  const [flow, setFlow] = useState<'counter' | 'parallel' | 'shell_tube'>('counter');
  const [Thi, setThi] = useState('150');
  const [mH, setMH] = useState('2');
  const [CpH, setCpH] = useState('4.18');
  const [Tci, setTci] = useState('30');
  const [mC, setMC] = useState('5');
  const [CpC, setCpC] = useState('4.18');
  const [U, setU] = useState('300');
  const [A, setA] = useState('15');

  const thi = parseFloat(Thi), mh = parseFloat(mH), cph = parseFloat(CpH) * 1000;
  const tci = parseFloat(Tci), mc = parseFloat(mC), cpc = parseFloat(CpC) * 1000;
  const u = parseFloat(U), a = parseFloat(A);

  const Ch = mh > 0 && cph > 0 ? mh * cph : NaN;
  const Cc = mc > 0 && cpc > 0 ? mc * cpc : NaN;
  
  const validC = Number.isFinite(Ch) && Number.isFinite(Cc) && Ch > 0 && Cc > 0;
  const Cmin = validC ? Math.min(Ch, Cc) : NaN;
  const Cmax = validC ? Math.max(Ch, Cc) : NaN;
  const Cr = validC && Cmax > 0 ? Cmin / Cmax : NaN;

  const ntu = validC && Cmin > 0 && u > 0 && a > 0 ? (u * a) / Cmin : NaN;

  let eps = NaN;
  if (Number.isFinite(ntu) && Number.isFinite(Cr) && ntu >= 0) {
    if (ntu === 0) {
      eps = 0;
    } else if (flow === 'parallel') {
      eps = (1 - Math.exp(-ntu * (1 + Cr))) / (1 + Cr);
    } else if (flow === 'counter') {
      if (Math.abs(Cr - 1) < 1e-6) {
        eps = ntu / (1 + ntu);
      } else {
        eps = (1 - Math.exp(-ntu * (1 - Cr))) / (1 - Cr * Math.exp(-ntu * (1 - Cr)));
      }
    } else {
      const sq = Math.sqrt(1 + Cr * Cr);
      const E = Math.exp(-ntu * sq);
      eps = Math.abs(1 - E) < 1e-12 ? 0 : 2 / (1 + Cr + sq * ((1 + E) / (1 - E)));
    }
  }

  const q_max = validC && !isNaN(thi) && !isNaN(tci) ? Cmin * (thi - tci) : NaN;
  const q_actual = Number.isFinite(eps) && Number.isFinite(q_max) ? eps * q_max : NaN;
  
  const Tho = Number.isFinite(q_actual) && validC ? thi - (q_actual / Ch) : NaN;
  const Tco = Number.isFinite(q_actual) && validC ? tci + (q_actual / Cc) : NaN;

  return (
    <CalcCard title="Effectiveness-NTU Analysis" icon={Zap}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Performance estimation for existing exchangers with known inlet conditions.</p>
      
      <div className="mb-10">
        <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Exchanger Architecture</label>
        <div className="flex flex-wrap gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl w-fit">
          {(['counter', 'parallel', 'shell_tube'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFlow(f)} 
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                flow === f 
                ? 'bg-surface-50 dark:bg-surface-700 text-primary-600 shadow-sm' 
                : 'text-surface-400 hover:text-surface-600'
              }`}
            >
              {f.replace('_', ' & ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-rose-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-surface-50">Hot Stream (Primary)</h4>
          </div>
          <ValidationInputRow label="Inlet Temp" unit="°C" value={Thi} onChange={setThi} allowNegative />
          <ValidationInputRow label="Mass Flow" unit="kg/s" value={mH} onChange={setMH} validationRules={[positiveRule]} />
          <ValidationInputRow label="Heat Cap (Cp)" unit="kJ/kg·K" value={CpH} onChange={setCpH} validationRules={[positiveRule]} onAutoFill={() => setCpH('2.1')} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-primary-500 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-surface-50">Cold Stream (Utility)</h4>
          </div>
          <ValidationInputRow label="Inlet Temp" unit="°C" value={Tci} onChange={setTci} allowNegative />
          <ValidationInputRow label="Mass Flow" unit="kg/s" value={mC} onChange={setMC} validationRules={[positiveRule]} />
          <ValidationInputRow label="Heat Cap (Cp)" unit="kJ/kg·K" value={CpC} onChange={setCpC} validationRules={[positiveRule]} onAutoFill={() => setCpC('4.18')} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-t border-surface-100 dark:border-surface-800 pt-10">
        <ValidationInputRow label="Overall Coeff. (U)" unit="W/m²·K" value={U} onChange={setU} validationRules={[positiveRule]} />
        <ValidationInputRow label="Surface Area (A)" unit="m²" value={A} onChange={setA} validationRules={[positiveRule]} />
      </div>

      <div className="flex justify-between items-center mb-6 border-t border-surface-100 dark:border-surface-800 pt-10">
        <h4 className="text-xs font-black uppercase tracking-widest text-surface-400">Results</h4>
        <button 
          onClick={() => setShowSteps(!showSteps)}
          className="flex items-center gap-2 text-xs font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
        >
          {showSteps ? 'Hide Steps' : 'Show Steps'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ResultBox label="Cap. Ratio (Cr)" value={isNaN(Cr) ? '--' : Cr.toFixed(3)} unit="" />
        <ResultBox label="NTU" value={isNaN(ntu) ? '--' : ntu.toFixed(2)} unit="" color="#2563eb" />
        <ResultBox label="Effectiveness (ε)" value={isNaN(eps) ? '--' : eps.toFixed(3)} unit="" color="#059669" />
        <ResultBox label="Heat Load (Q)" value={isNaN(q_actual) ? '--' : (q_actual/1000).toFixed(1)} unit="kW" color="#ea580c" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-surface-100 dark:border-surface-800 bg-rose-50/20 dark:bg-rose-900/10">
          <ResultBox label="Outlet Temp (Hot)" value={isNaN(Tho) ? '--' : Tho.toFixed(1)} unit="°C" color="#ef4444" />
        </div>
        <div className="glass p-6 rounded-3xl border border-surface-100 dark:border-surface-800 bg-primary-50/20 dark:bg-primary-900/10">
          <ResultBox label="Outlet Temp (Cold)" value={isNaN(Tco) ? '--' : Tco.toFixed(1)} unit="°C" color="#3b82f6" />
        </div>
      </div>

      <StepByStepDisplay 
        showSteps={showSteps}
        formula={`C_min = min(Ch, Cc)\nC_max = max(Ch, Cc)\nNTU = (U × A) / C_min\nε = f(NTU, Cr, Flow Type)\nQ = ε × C_min × (Th_in - Tc_in)`}
        substitution={`C_min = min(${fmt(Ch, 1)}, ${fmt(Cc, 1)}) = ${fmt(Cmin, 1)}\nNTU = (${fmt(u, 1)} × ${fmt(a, 2)}) / ${fmt(Cmin, 1)} = ${fmt(ntu, 2)}\nε = ${fmt(eps, 3)}\nQ = ${fmt(eps, 3)} × ${fmt(Cmin, 1)} × (${fmt(thi, 1)} - ${fmt(tci, 1)})`}
        result={`Q = ${fmt(q_actual / 1000, 2)} kW\nTh_out = ${fmt(Tho, 1)} °C\nTc_out = ${fmt(Tco, 1)} °C`}
        insight="The effectiveness (ε) represents the ratio of actual heat transfer to the maximum possible heat transfer. It can never exceed 1.0."
      />
    </CalcCard>
  );
}

// ─── HT DATABASES ───
function HTDatabases() {
  const foulingData = [
    { fluid: 'Seawater (<50°C)', R_f: '0.00009' },
    { fluid: 'City Water (<50°C)', R_f: '0.00018' },
    { fluid: 'Treated Boiler Feed', R_f: '0.00009' },
    { fluid: 'Fuel Oil', R_f: '0.00088' },
    { fluid: 'Crude Oil', R_f: '0.00035 - 0.00120' },
    { fluid: 'Steam (Oil-free)', R_f: '0.00009' },
    { fluid: 'Organic Vapors', R_f: '0.00009' },
  ];

  return (
    <CalcCard title="Fouling Factor Database" icon={ClipboardList}>
      <p className="text-sm text-surface-500 mb-8 font-medium">Standard industrial thermal resistances for heat exchanger design and rating.</p>
      <div className="overflow-hidden rounded-3xl border border-surface-100 dark:border-surface-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-surface-400">Fluid / Service</th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-surface-400">R_f (m²·K/W)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {foulingData.map(d => (
              <tr key={d.fluid} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-surface-700 dark:text-surface-300">{d.fluid}</td>
                <td className="px-6 py-4 text-right font-mono font-black text-accent-600">{d.R_f}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CalcCard>
  );
}

// ─── FOULING FACTOR DATABASE ───
function FoulingDatabase() {
  const foulingData = [
    { fluid: 'Distilled Water', Rf: 0.00009, category: 'Clean' },
    { fluid: 'City Water (below 50°C)', Rf: 0.00018, category: 'Clean' },
    { fluid: 'City Water (above 50°C)', Rf: 0.00035, category: 'Moderate' },
    { fluid: 'River Water', Rf: 0.00035, category: 'Moderate' },
    { fluid: 'Seawater (below 50°C)', Rf: 0.00009, category: 'Clean' },
    { fluid: 'Seawater (above 50°C)', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Boiler Feed Water (treated)', Rf: 0.00009, category: 'Clean' },
    { fluid: 'Fuel Oil', Rf: 0.00088, category: 'Heavy' },
    { fluid: 'Transformer Oil', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Engine Lube Oil', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Refrigerant (liquid)', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Refrigerant (vapor)', Rf: 0.00035, category: 'Moderate' },
    { fluid: 'Steam (oil-free)', Rf: 0.00009, category: 'Clean' },
    { fluid: 'Steam (with oil)', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Natural Gas', Rf: 0.00018, category: 'Clean' },
    { fluid: 'Flue Gas', Rf: 0.00088, category: 'Heavy' },
    { fluid: 'Organic Vapors', Rf: 0.00009, category: 'Clean' },
    { fluid: 'Alcohol Vapors', Rf: 0.00009, category: 'Clean' },
    { fluid: 'Heavy Hydrocarbons', Rf: 0.00053, category: 'Heavy' },
    { fluid: 'Vegetable Oil', Rf: 0.00053, category: 'Heavy' },
  ];

  const thermalK = [
    { material: 'Copper', k: 385, category: 'Metal' },
    { material: 'Aluminum', k: 205, category: 'Metal' },
    { material: 'Carbon Steel', k: 54, category: 'Metal' },
    { material: 'Stainless Steel 304', k: 16.3, category: 'Metal' },
    { material: 'Titanium', k: 21.9, category: 'Metal' },
    { material: 'Glass', k: 1.05, category: 'Insulator' },
    { material: 'Concrete', k: 1.7, category: 'Insulator' },
    { material: 'Fiberglass Insulation', k: 0.04, category: 'Insulator' },
    { material: 'PTFE (Teflon)', k: 0.25, category: 'Polymer' },
    { material: 'Polypropylene', k: 0.12, category: 'Polymer' },
  ];

  const [view, setView] = useState<'fouling' | 'conductivity'>('fouling');
  const catColor = (c: string) =>
    c === 'Clean'
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
      : c === 'Moderate'
        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
        : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20';
  const matColor = (c: string) => c === 'Metal' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : c === 'Insulator' ? 'text-accent-500 bg-accent-50 dark:bg-accent-900/20' : 'text-violet-500 bg-violet-50 dark:bg-violet-900/20';

  return (
    <CalcCard title="Fouling Factors & Thermal Conductivity" icon={ClipboardList}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">TEMA-standard fouling resistances and material thermal conductivities for heat exchanger design.</p>
      <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl w-fit mb-8">
        {(['fouling', 'conductivity'] as const).map(t => (
          <button key={t} onClick={() => setView(t)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${view === t ? 'bg-surface-50 dark:bg-surface-700 text-accent-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}>
            {t === 'fouling' ? 'Fouling Factors (Rf)' : 'Thermal Conductivity (k)'}
          </button>
        ))}
      </div>

      {view === 'fouling' && (
        <div className="overflow-hidden rounded-3xl border border-surface-100 dark:border-surface-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-surface-400">Fluid</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-surface-400">Rf (m²·K/W)</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-surface-400">Category</th>
              </tr>
            </thead>
            <tbody>
              {foulingData.map(r => (
                <tr key={r.fluid} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-accent-50/30 dark:hover:bg-accent-900/10 transition-colors">
                  <td className="px-6 py-3 font-bold text-surface-900 dark:text-surface-50">{r.fluid}</td>
                  <td className="px-6 py-3 text-right font-mono text-sm font-bold text-surface-600 dark:text-surface-300">{r.Rf.toFixed(5)}</td>
                  <td className="px-6 py-3 text-center"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${catColor(r.category)}`}>{r.category}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'conductivity' && (
        <div className="overflow-hidden rounded-3xl border border-surface-100 dark:border-surface-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-surface-400">Material</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-surface-400">k (W/m·K)</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-surface-400">Type</th>
              </tr>
            </thead>
            <tbody>
              {thermalK.map(r => (
                <tr key={r.material} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                  <td className="px-6 py-3 font-bold text-surface-900 dark:text-surface-50">{r.material}</td>
                  <td className="px-6 py-3 text-right font-mono text-sm font-bold text-surface-600 dark:text-surface-300">{r.k}</td>
                  <td className="px-6 py-3 text-center"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${matColor(r.category)}`}>{r.category}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type HeatTab = 'consultant' | 'cooling-tower' | 'gnielinski' | 'ntu' | 'lmtd' | 'fouling' | 'database';

export default function HeatTransferModule() {
  const [activeTab, setActiveTab] = useState<HeatTab>('consultant');
  const tabs = [
    { id: 'consultant', label: 'Rigorous S&T Consultant', icon: Network },
    { id: 'cooling-tower', label: 'Cooling Tower Merkel', icon: RefreshCw },
    { id: 'gnielinski', label: 'Gnielinski Convection', icon: Zap },
    { id: 'ntu', label: 'ε-NTU Analysis', icon: Zap },
    { id: 'lmtd', label: 'Driving Force', icon: RefreshCw },
    { id: 'fouling', label: 'Fouling & k Data', icon: Thermometer },
    { id: 'database', label: 'Reference Data', icon: ClipboardList },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-surface-900 dark:text-surface-50 mb-1">Heat Transfer Console</h1>
        <p className="text-surface-500 text-xs">Shell & tube sizing, cooling tower Merkel quadrature, Gnielinski convection, and ε-NTU rating.</p>
      </div>

      <div className="touch-scroll-x flex gap-2 border-b border-surface-200 dark:border-surface-800 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as HeatTab)} 
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider pb-2.5 transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id 
              ? 'border-accent-600 text-accent-600 dark:text-accent-400' 
              : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {activeTab === 'consultant' && <ShellAndTubeConsultant />}
        {activeTab === 'cooling-tower' && <CoolingTowerMerkelCalc />}
        {activeTab === 'gnielinski' && <ConvectionGnielinskiCalc />}
        {activeTab === 'ntu' && <NTUCalc />}
        {activeTab === 'lmtd' && <LMTDCalc />}
        {activeTab === 'fouling' && <FoulingDatabase />}
        {activeTab === 'database' && <HTDatabases />}
      </div>
    </div>
  );
}

