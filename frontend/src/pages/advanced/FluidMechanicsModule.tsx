import { useState, useMemo } from 'react';
import { 
  Waves, 
  Activity, 
  TrendingUp, 
  Settings, 
  Info,
  ChevronRight,
  Zap,
  Gauge
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

// ─── REYNOLDS NUMBER ───
function ReynoldsCalc() {
  const [rho, setRho] = useState('1000');
  const [v, setV] = useState('2');
  const [D, setD] = useState('0.05');
  const [mu, setMu] = useState('0.001');

  const Re = (parseFloat(rho) * parseFloat(v) * parseFloat(D)) / parseFloat(mu);
  const regime = isNaN(Re) ? '--' : Re < 2300 ? 'Laminar' : Re < 4000 ? 'Transitional' : 'Turbulent';
  const regimeColor = regime === 'Laminar' ? '#10b981' : regime === 'Transitional' ? '#f59e0b' : '#ef4444';
  const indicatorPercent = isNaN(Re) ? 0 : Math.min(100, Math.max(0, ((Math.log10(Re) - 2) / 3) * 100)); 

  return (
    <CalcCard title="Reynolds Number (Re)" icon={Waves}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic italic">Re = ρvD/μ — Analytical determination of flow regime and momentum transfer behavior.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <InputRow label="Fluid Density (ρ)" unit="kg/m³" value={rho} onChange={setRho} />
          <InputRow label="Flow Velocity (v)" unit="m/s" value={v} onChange={setV} />
        </div>
        <div className="space-y-4">
          <InputRow label="Characteristic Length (D)" unit="m" value={D} onChange={setD} />
          <InputRow label="Dynamic Viscosity (μ)" unit="Pa·s" value={mu} onChange={setMu} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <ResultBox label="Dimensionless Reynolds" value={isNaN(Re) ? '--' : Re.toFixed(0)} unit="" color="#6366f1" />
        <ResultBox label="Flow Classification" value={regime} unit="" color={regimeColor} />
      </div>

      <div className="glass p-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950/30">
        <div className="flex items-center justify-between mb-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flow Regime Analysis</label>
          <div className="flex gap-4">
             <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Laminar</span>
             <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Transitional</span>
             <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Turbulent</span>
          </div>
        </div>
        <div className="relative h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-visible border border-slate-100 dark:border-slate-700">
          <div className="absolute inset-0 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500/20" style={{ width: '33%' }}></div>
            <div className="h-full bg-amber-500/20" style={{ width: '17%' }}></div>
            <div className="h-full bg-rose-500/20" style={{ width: '50%' }}></div>
          </div>
          
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-900 border-2 border-indigo-600 rounded-lg shadow-xl shadow-indigo-500/20 flex items-center justify-center transition-all duration-500"
            style={{ left: `calc(${indicatorPercent}% - 12px)` }}
          >
            <Activity className="w-3 h-3 text-indigo-600" />
          </div>
          
          <div className="absolute left-[33%] top-full mt-2 h-2 border-l border-slate-300 dark:border-slate-600 flex flex-col items-start">
             <span className="text-[8px] font-black text-slate-400 mt-1 uppercase">Re 2300</span>
          </div>
          <div className="absolute left-[50%] top-full mt-2 h-2 border-l border-slate-300 dark:border-slate-600 flex flex-col items-start">
             <span className="text-[8px] font-black text-slate-400 mt-1 uppercase">Re 4000</span>
          </div>
        </div>
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
    const pts: any[] = [];
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
type FluidTab = 'reynolds' | 'moody' | 'pump-system' | 'flow-meter';

export default function FluidMechanicsModule() {
  const [activeTab, setActiveTab] = useState<FluidTab>('pump-system');
  const tabs = [
    { id: 'pump-system', label: 'Pump Performance', icon: Settings },
    { id: 'moody', label: 'Friction Analysis', icon: TrendingUp },
    { id: 'reynolds', label: 'Flow Regimes', icon: Waves },
    { id: 'flow-meter', label: 'Flow Meters', icon: Gauge },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Fluid Dynamics Console</h1>
        <p className="text-slate-500 text-lg font-medium">Robust hydraulic simulators for pipe friction, pump curves, flow measurement, and dimensionless analysis.</p>
      </div>

      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
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
        {activeTab === 'moody' && <MoodyChartApproximation />}
        {activeTab === 'reynolds' && <ReynoldsCalc />}
        {activeTab === 'flow-meter' && <FlowMeterCalc />}
      </div>
    </div>
  );
}


