import { useState, useMemo } from 'react';
import { 
  Waves, 
  TrendingUp, 
  Settings, 
  Gauge
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

// ─── REYNOLDS NUMBER & RHEOLOGY (NEWTONIAN, POWER-LAW, BINGHAM) ───
function ReynoldsCalc() {
  const [fluidType, setFluidType] = useState<'newtonian' | 'powerlaw' | 'bingham'>('newtonian');
  const [rho, setRho] = useState('1000');
  const [v, setV] = useState('2');
  const [D, setD] = useState('0.05');
  const [mu, setMu] = useState('0.001');
  const [nIndex, setNIndex] = useState('0.75'); // Power law index n
  const [kIndex, setKIndex] = useState('0.05');  // Power law consistency K
  const [tau0, setTau0] = useState('5.0');      // Bingham yield stress Pa
  const [muP, setMuP] = useState('0.002');       // Plastic viscosity Pa·s

  const r = parseFloat(rho), vel = parseFloat(v), d = parseFloat(D), m = parseFloat(mu);
  const n = parseFloat(nIndex), K = parseFloat(kIndex), t0 = parseFloat(tau0), m_p = parseFloat(muP);

  let Re = NaN;
  let He = NaN;
  let metricLabel = "Dimensionless Reynolds (Re)";

  if (fluidType === 'newtonian') {
    Re = (r * vel * d) / m;
    metricLabel = "Newtonian Reynolds (Re)";
  } else if (fluidType === 'powerlaw') {
    // Generalized Reynolds number Reg = (rho * v^(2-n) * D^n) / (8^(n-1) * K * ((3n+1)/(4n))^n)
    const factor = Math.pow(8, n - 1) * K * Math.pow((3 * n + 1) / (4 * n), n);
    Re = (r * Math.pow(vel, 2 - n) * Math.pow(d, n)) / factor;
    metricLabel = "Generalized Reynolds (Re_g)";
  } else if (fluidType === 'bingham') {
    Re = (r * vel * d) / m_p;
    He = (r * t0 * d * d) / (m_p * m_p);
    metricLabel = "Bingham Reynolds (Re_b)";
  }

  const regime = isNaN(Re) ? '--' : Re < 2300 ? 'Laminar' : Re < 4000 ? 'Transitional' : 'Turbulent';
  const regimeColor = regime === 'Laminar' ? '#10b981' : regime === 'Transitional' ? '#f59e0b' : '#ef4444';

  return (
    <CalcCard title="Reynolds Number & Non-Newtonian Rheology" icon={Waves}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Generalized Reynolds (Re_g) for Power-Law fluids & Hedström (He) number for Bingham plastics.</p>

      <div className="mb-8">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Fluid Rheology Model</label>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {(['newtonian', 'powerlaw', 'bingham'] as const).map(t => (
            <button key={t} onClick={() => setFluidType(t)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${fluidType === t ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {t === 'newtonian' ? 'Newtonian' : t === 'powerlaw' ? 'Power-Law (n, K)' : 'Bingham Plastic'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <InputRow label="Fluid Density (ρ)" unit="kg/m³" value={rho} onChange={setRho} />
          <InputRow label="Flow Velocity (v)" unit="m/s" value={v} onChange={setV} />
          <InputRow label="Pipe Diameter (D)" unit="m" value={D} onChange={setD} />
        </div>
        <div className="space-y-4">
          {fluidType === 'newtonian' && (
            <InputRow label="Dynamic Viscosity (μ)" unit="Pa·s" value={mu} onChange={setMu} />
          )}
          {fluidType === 'powerlaw' && (
            <>
              <InputRow label="Flow Behavior Index (n)" unit="" value={nIndex} onChange={setNIndex} />
              <InputRow label="Consistency Index (K)" unit="Pa·sⁿ" value={kIndex} onChange={setKIndex} />
            </>
          )}
          {fluidType === 'bingham' && (
            <>
              <InputRow label="Yield Stress (τ₀)" unit="Pa" value={tau0} onChange={setTau0} />
              <InputRow label="Plastic Viscosity (μ_p)" unit="Pa·s" value={muP} onChange={setMuP} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <ResultBox label={metricLabel} value={isNaN(Re) ? '--' : Re.toFixed(0)} unit="" color="#6366f1" />
        <ResultBox label="Flow Classification" value={regime} unit="" color={regimeColor} />
        {fluidType === 'bingham' ? (
          <ResultBox label="Hedström Number (He)" value={isNaN(He) ? '--' : He.toFixed(0)} unit="" color="#f59e0b" />
        ) : (
          <ResultBox label="Viscous Scaling" value={fluidType === 'powerlaw' ? `Pseudoplastic (n=${n})` : 'Linear Newtonian'} unit="" color="#10b981" />
        )}
      </div>
    </CalcCard>
  );
}

// ─── RIGOROUS MOODY CHART ───
function MoodyChartApproximation() {
  const generateCurve = (e_d: number) => {
    const points = [];
    for (let logRe = 3; logRe <= 8; logRe += 0.1) {
      const Re = Math.pow(10, logRe);
      let f;
      if (Re < 2300) {
        f = 64 / Re;
      } else if (Re < 4000) {
        continue;
      } else {
        const invSqrtF = -1.8 * Math.log10( Math.pow((e_d / 3.7), 1.11) + 6.9 / Re );
        f = 1 / (invSqrtF * invSqrtF);
      }
      points.push({ Re, f, logRe: parseFloat(logRe.toFixed(2)) });
    }
    return points;
  };

  const smoothCurve = useMemo(() => generateCurve(0.00001), []);
  const medCurve = useMemo(() => generateCurve(0.001), []);
  const roughCurve = useMemo(() => generateCurve(0.01), []);

  const data = smoothCurve.map((pt, i) => ({
    logRe: pt.logRe,
    f_smooth: pt.f,
    f_med: medCurve[i]?.f,
    f_rough: roughCurve[i]?.f
  }));

  return (
    <CalcCard title="Friction Analysis (Moody Chart)" icon={TrendingUp}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Friction factor (f) mapping using the Haaland explicit approximation of Colebrook-White.</p>
      <div className="h-[400px] w-full bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="logRe" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis scale="log" domain={[0.008, 0.1]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} iconType="circle" />
            <Line type="monotone" dataKey="f_smooth" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} name="Smooth" />
            <Line type="monotone" dataKey="f_med" stroke="#f59e0b" strokeWidth={3} dot={false} isAnimationActive={false} name="Intermediate" />
            <Line type="monotone" dataKey="f_rough" stroke="#ef4444" strokeWidth={3} dot={false} isAnimationActive={false} name="Rough" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CalcCard>
  );
}

// ─── PUMP VS SYSTEM CURVE ───
function PumpSystemCurve() {
  const [H_stat, setHstat] = useState('15');
  const [K_sys, setKsys] = useState('500');
  const [H_shut, setHshut] = useState('30');
  const [Pump_A, setPumpA] = useState('300');

  const hs = parseFloat(H_stat), ksys = parseFloat(K_sys), shut = parseFloat(H_shut), pa = parseFloat(Pump_A);

  const data = useMemo(() => {
    const pts: { q: number; H_sys: number; H_pump: number | null }[] = [];
    if (isNaN(hs) || isNaN(ksys) || isNaN(shut) || isNaN(pa)) return pts;
    
    let maxQ = Math.sqrt(shut / pa);
    if (!isFinite(maxQ) || maxQ <= 0) maxQ = 0.5;

    for (let q = 0; q <= maxQ * 1.1; q += maxQ / 50) {
      const H_system = hs + ksys * q * q;
      const H_pump = shut - pa * q * q;
      pts.push({
        q: parseFloat(q.toFixed(4)),
        H_sys: H_system,
        H_pump: H_pump >= 0 ? H_pump : null
      });
    }
    return pts;
  }, [hs, ksys, shut, pa]);

  let op_Q = NaN;
  let op_H = NaN;
  if (!isNaN(hs) && !isNaN(ksys) && !isNaN(shut) && !isNaN(pa) && shut > hs) {
    op_Q = Math.sqrt((shut - hs) / (ksys + pa));
    op_H = hs + ksys * op_Q * op_Q;
  }

  return (
    <CalcCard title="Pump Operating Characteristics" icon={Settings}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Intersection of centrifugal pump performance and system resistance curves.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-indigo-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">System Dynamics</h4>
          </div>
          <InputRow label="Static Head (H_stat)" unit="m" value={H_stat} onChange={setHstat} />
          <InputRow label="Resistance (K)" unit="s²/m⁵" value={K_sys} onChange={setKsys} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-rose-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Pump Performance</h4>
          </div>
          <InputRow label="Shut-off Head" unit="m" value={H_shut} onChange={setHshut} />
          <InputRow label="Decline Factor (A)" unit="s²/m⁵" value={Pump_A} onChange={setPumpA} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <ResultBox label="Operating Flow (Q)" value={!isNaN(op_Q) ? op_Q.toFixed(4) : '--'} unit="m³/s" color="#10b981" />
        <ResultBox label="Dynamic Head (H)" value={!isNaN(op_H) ? op_H.toFixed(2) : '--'} unit="m" color="#6366f1" />
      </div>

      <div className="h-[400px] w-full bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="q" type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} iconType="circle" />
            <Line type="monotone" dataKey="H_pump" stroke="#ef4444" strokeWidth={4} dot={false} isAnimationActive={false} name="Pump Head" />
            <Line type="monotone" dataKey="H_sys" stroke="#6366f1" strokeWidth={4} dot={false} isAnimationActive={false} name="System Head" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CalcCard>
  );
}

// ─── PUMP SPECIFIC SPEED, AFFINITY LAWS & NPSH CAVITATION PREVENTER ───
function PumpSpecificSpeedNPSHCalc() {
  const [unitSys, setUnitSys] = useState<'us' | 'metric'>('us');
  const [rpm, setRpm] = useState('1750');
  const [flow, setFlow] = useState('1200'); // GPM (US) or m3/h (Metric)
  const [head, setHead] = useState('150');  // ft (US) or m (Metric)
  const [speedRatio, setSpeedRatio] = useState('1.3'); // Speed scaling N2/N1
  const [pAbs, setPAbs] = useState('101.325'); // kPa
  const [temp, setTemp] = useState('35'); // °C for suction fluid
  const [hSuction, setHSuction] = useState('3'); // m or ft static head
  const [hFriction, setHFriction] = useState('1.5'); // m or ft friction loss
  const [npshReq, setNpshReq] = useState('2.5'); // m or ft required NPSH

  const N = parseFloat(rpm), Q_val = parseFloat(flow), H_val = parseFloat(head);
  const ratio = parseFloat(speedRatio);
  const p_a = parseFloat(pAbs), t_c = parseFloat(temp);
  const hs = parseFloat(hSuction), hf = parseFloat(hFriction), npsh_r = parseFloat(npshReq);

  let Ns = NaN;
  let impellerType = '--';
  if (!isNaN(N) && !isNaN(Q_val) && !isNaN(H_val) && H_val > 0 && Q_val > 0) {
    if (unitSys === 'us') {
      Ns = (N * Math.sqrt(Q_val)) / Math.pow(H_val, 0.75);
      if (Ns < 1500) impellerType = 'Radial Flow Impeller (High Head, Low Flow)';
      else if (Ns <= 5000) impellerType = 'Mixed Flow Impeller (Medium Head/Flow)';
      else impellerType = 'Axial Flow Propeller (Low Head, High Flow)';
    } else {
      // Metric nq = N(rpm) * sqrt(Q m3/s) / H^0.75
      const q_m3s = Q_val / 3600;
      Ns = (N * Math.sqrt(q_m3s)) / Math.pow(H_val, 0.75);
      if (Ns < 35) impellerType = 'Radial Flow Impeller (High Head, Low Flow)';
      else if (Ns <= 160) impellerType = 'Mixed Flow Impeller (Medium Head/Flow)';
      else impellerType = 'Axial Flow Propeller (Low Head, High Flow)';
    }
  }

  // Affinity laws scaling
  const q2 = Q_val * ratio;
  const h2 = H_val * ratio * ratio;
  const effDegradation = Math.abs(ratio - 1) > 0.20;

  // Vapor pressure calculation (Antoine water)
  const Psat_kPa = 0.61078 * Math.exp((17.27 * t_c) / (t_c + 237.3));
  // NPSHA (meters) = (P_abs - P_v) / (rho*g) + h_s - h_f
  const rho_g = 9.81; // kPa per meter head
  const npsh_a = ((p_a - Psat_kPa) / rho_g) + hs - hf;
  const npsh_margin = npsh_a - npsh_r;
  const cavitationRisk = npsh_margin < (unitSys === 'us' ? 3.0 : 1.0);

  return (
    <CalcCard title="Pump Specific Speed (Ns) & NPSH Cavitation Guard" icon={Settings}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Dimensional impeller classification, speed variance efficiency scaling, and NPSHA cavitation safety margin evaluation.</p>
      
      <div className="mb-8">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Unit Standard</label>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {(['us', 'metric'] as const).map(u => (
            <button key={u} onClick={() => setUnitSys(u)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${unitSys === u ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {u === 'us' ? 'US Customary (GPM, ft, RPM)' : 'Metric System (m³/h, m, RPM)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <InputRow label="Speed (N)" unit="RPM" value={rpm} onChange={setRpm} />
          <InputRow label="Flow Rate (Q)" unit={unitSys === 'us' ? 'GPM' : 'm³/h'} value={flow} onChange={setFlow} />
          <InputRow label="Total Dynamic Head (H)" unit={unitSys === 'us' ? 'ft' : 'm'} value={head} onChange={setHead} />
          <InputRow label="VFD Speed Ratio (N₂/N₁)" unit="×" value={speedRatio} onChange={setSpeedRatio} />
        </div>
        <div className="space-y-4">
          <InputRow label="Barometric Pressure" unit="kPa" value={pAbs} onChange={setPAbs} />
          <InputRow label="Suction Fluid Temp" unit="°C" value={temp} onChange={setTemp} />
          <InputRow label="Suction Static Head (h_s)" unit={unitSys === 'us' ? 'ft' : 'm'} value={hSuction} onChange={setHSuction} />
          <InputRow label="Suction Friction Loss (h_f)" unit={unitSys === 'us' ? 'ft' : 'm'} value={hFriction} onChange={setHFriction} />
          <InputRow label="Required NPSH (NPSHR)" unit={unitSys === 'us' ? 'ft' : 'm'} value={npshReq} onChange={setNpshReq} />
        </div>
      </div>

      {effDegradation && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-3">
          <span>⚠️ <strong>Efficiency Degradation Warning:</strong> VFD speed change exceeds ±20% ({((ratio - 1) * 100).toFixed(0)}%). Affinity laws will over-predict actual hydraulic power due to BEP divergence!</span>
        </div>
      )}

      {cavitationRisk && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-3">
          <span>🚨 <strong>Cavitation Alert:</strong> Available NPSH margin ({npsh_margin.toFixed(2)} {unitSys === 'us' ? 'ft' : 'm'}) falls below the mandatory 3 ft / 1.0 m safety limit above NPSHR!</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ResultBox label="Specific Speed (N_s)" value={isNaN(Ns) ? '--' : Ns.toFixed(0)} unit="" color="#6366f1" />
        <ResultBox label="Recommended Impeller" value={impellerType.split(' ')[0]} unit="" color="#3b82f6" />
        <ResultBox label="NPSH Available" value={isNaN(npsh_a) ? '--' : npsh_a.toFixed(2)} unit={unitSys === 'us' ? 'ft' : 'm'} color={cavitationRisk ? '#ef4444' : '#10b981'} />
        <ResultBox label="Scaled Flow (Q₂)" value={isNaN(q2) ? '--' : q2.toFixed(1)} unit={unitSys === 'us' ? 'GPM' : 'm³/h'} color="#f59e0b" />
        <ResultBox label="Scaled Head (H₂)" value={isNaN(h2) ? '--' : h2.toFixed(1)} unit={unitSys === 'us' ? 'ft' : 'm'} color="#8b5cf6" />
      </div>
    </CalcCard>
  );
}

// ─── FLOW MEASUREMENT ───
function FlowMeterCalc() {
  const [meterType, setMeterType] = useState<'venturi' | 'orifice'>('venturi');
  const [D1, setD1] = useState('0.1');
  const [D2, setD2] = useState('0.05');
  const [rho, setRho] = useState('1000');
  const [dP, setDP] = useState('50000');

  const d1 = parseFloat(D1), d2 = parseFloat(D2), rhoV = parseFloat(rho), dp = parseFloat(dP);
  const Cd = meterType === 'venturi' ? 0.98 : 0.62;
  const beta = d2 / d1;
  const A2 = Math.PI * d2 * d2 / 4;
  const Q = !isNaN(d1) && !isNaN(d2) && !isNaN(rhoV) && !isNaN(dp) && dp > 0 && d1 > d2
    ? Cd * A2 * Math.sqrt((2 * dp) / (rhoV * (1 - Math.pow(beta, 4))))
    : NaN;
  const v2 = !isNaN(Q) && A2 > 0 ? Q / A2 : NaN;

  return (
    <CalcCard title="Flow Measurement Devices" icon={Gauge}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Venturi meter & orifice plate flow rate calculations using Bernoulli's equation.</p>
      <div className="mb-8">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Meter Type</label>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          {(['venturi', 'orifice'] as const).map(t => (
            <button key={t} onClick={() => setMeterType(t)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${meterType === t ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {t === 'venturi' ? `Venturi (Cd=0.98)` : `Orifice (Cd=0.62)`}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <InputRow label="Pipe Diameter (D₁)" unit="m" value={D1} onChange={setD1} />
          <InputRow label="Throat Diameter (D₂)" unit="m" value={D2} onChange={setD2} />
        </div>
        <div className="space-y-4">
          <InputRow label="Fluid Density (ρ)" unit="kg/m³" value={rho} onChange={setRho} />
          <InputRow label="Pressure Drop (ΔP)" unit="Pa" value={dP} onChange={setDP} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ResultBox label="Flow Rate (Q)" value={isNaN(Q) ? '--' : (Q * 1000).toFixed(2)} unit="L/s" color="#3b82f6" />
        <ResultBox label="Throat Velocity" value={isNaN(v2) ? '--' : v2.toFixed(2)} unit="m/s" color="#6366f1" />
        <ResultBox label="Beta Ratio (β)" value={isNaN(beta) ? '--' : beta.toFixed(3)} unit="" color="#f59e0b" />
        <ResultBox label="Discharge Coeff." value={Cd.toString()} unit="" color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type FluidTab = 'reynolds' | 'moody' | 'pump-system' | 'pump-npsh' | 'flow-meter';

export default function FluidMechanicsModule() {
  const [activeTab, setActiveTab] = useState<FluidTab>('pump-system');
  const tabs = [
    { id: 'pump-system', label: 'Pump Performance', icon: Settings },
    { id: 'pump-npsh', label: 'Ns & NPSH Cavitation', icon: Gauge },
    { id: 'moody', label: 'Friction Analysis', icon: TrendingUp },
    { id: 'reynolds', label: 'Rheology & Re', icon: Waves },
    { id: 'flow-meter', label: 'Flow Meters', icon: Gauge },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Fluid Dynamics Console</h1>
        <p className="text-slate-500 text-lg font-medium">Pipe friction, non-Newtonian rheology, pump curves, Ns impeller classification, NPSHA cavitation, and flow meters.</p>
      </div>

      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as FluidTab)} 
            className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest pb-4 transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-b-4 border-indigo-600 text-slate-900 dark:text-white' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {activeTab === 'pump-system' && <PumpSystemCurve />}
        {activeTab === 'pump-npsh' && <PumpSpecificSpeedNPSHCalc />}
        {activeTab === 'moody' && <MoodyChartApproximation />}
        {activeTab === 'reynolds' && <ReynoldsCalc />}
        {activeTab === 'flow-meter' && <FlowMeterCalc />}
      </div>
    </div>
  );
}


