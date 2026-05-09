import { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  Layers, 
  Info, 
  ChevronRight,
  TrendingUp,
  Activity,
  Zap,
  FlaskConical,
  Waves
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// ─── RIGOROUS MCCABE-THIELE STEPPING ───
function RigorousMcCabeThiele() {
  const [alpha, setAlpha] = useState('2.5');
  const [xF, setXF] = useState('0.5');
  const [xD, setXD] = useState('0.9');
  const [xB, setXB] = useState('0.1');
  const [R, setR] = useState('1.5');
  const [q, setQ] = useState('1.0');

  const a = parseFloat(alpha), xf = parseFloat(xF), xd = parseFloat(xD), xb = parseFloat(xB), r = parseFloat(R), fq = parseFloat(q);

  const getYeq = (x: number) => (a * x) / (1 + (a - 1) * x);
  const getXeq = (y: number) => y / (a - y * (a - 1));

  const data = useMemo(() => {
    let eqCurve: any[] = [];
    let lines: any[] = [];
    if (isNaN(a) || isNaN(xf) || isNaN(xd) || isNaN(xb) || isNaN(r) || isNaN(fq)) return { eqCurve, lines, xi: 0, yi: 0 };

    for (let x = 0; x <= 1.0; x += 0.05) {
      eqCurve.push({ x: parseFloat(x.toFixed(2)), y_eq: getYeq(x), y_x: x });
    }

    let xi = 0, yi = 0;
    if (Math.abs(fq - 1.0) < 0.001) {
      xi = xf;
      yi = (r / (r + 1)) * xi + xd / (r + 1);
    } else {
      const m1 = r / (r + 1);
      const b1 = xd / (r + 1);
      const m2 = fq / (fq - 1);
      const b2 = -xf / (fq - 1);
      xi = (b2 - b1) / (m1 - m2);
      yi = m1 * xi + b1;
    }

    lines = [
      { x: xd, y_rect: xd },
      { x: xi, y_rect: yi, y_strip: yi, y_q: yi },
      { x: xf, y_q: xf },
      { x: xb, y_strip: xb }
    ].sort((c, n) => c.x - n.x);

    return { eqCurve, lines, xi, yi };
  }, [a, xf, xd, xb, r, fq]);

  const getStages = () => {
    if (isNaN(a) || isNaN(xf) || isNaN(xd) || isNaN(xb) || isNaN(r) || isNaN(fq)) return { stages: [], count: 0 };
    
    const stages = [];
    let current_x = xd;
    let current_y = xd;
    let stageCount = 0;
    const { xi } = data;

    while (current_x > xb && stageCount < 30) {
      stages.push({ x: current_x, y_step: current_y });
      let next_x = getXeq(current_y);
      stages.push({ x: next_x, y_step: current_y });
      stageCount++;

      if (next_x <= xb) {
        stages.push({ x: next_x, y_step: next_x });
        break;
      }

      let next_y;
      if (next_x > xi) {
        next_y = (r / (r + 1)) * next_x + xd / (r + 1);
      } else {
        const m_strip = (data.yi - xb) / (xi - xb);
        next_y = m_strip * (next_x - xb) + xb;
      }
      stages.push({ x: next_x, y_step: next_y });
      current_x = next_x;
      current_y = next_y;
    }
    return { stages, count: stageCount };
  };

  const { stages, count } = getStages();

  return (
    <CalcCard title="McCabe-Thiele Distillation Analysis" icon={TrendingDown}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Equilibrium curve generation and recursive theoretical stage stepping.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-teal-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Properties</h4>
          </div>
          <InputRow label="Volatility (α)" unit="" value={alpha} onChange={setAlpha} />
          <InputRow label="Reflux Ratio (R)" unit="" value={R} onChange={setR} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-teal-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Compositions</h4>
          </div>
          <InputRow label="Feed (x_F)" unit="" value={xF} onChange={setXF} />
          <InputRow label="Distillate (x_D)" unit="" value={xD} onChange={setXD} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-teal-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Operating</h4>
          </div>
          <InputRow label="Feed Quality (q)" unit="" value={q} onChange={setQ} />
          <InputRow label="Bottoms (x_B)" unit="" value={xB} onChange={setXB} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="glass p-8 rounded-3xl border border-teal-100 dark:border-teal-900/30 bg-teal-50/20 dark:bg-teal-900/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1">Theoretical Stages</p>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white">
              {count > 0 && count < 30 ? count.toFixed(0) : '--'}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
          <Info className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            The minimum reflux ratio (Rmin) can be found where the rectifying line intersects the equilibrium curve at the q-line junction.
          </p>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="x" type="number" domain={[0, 1]} name="x" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" type="number" domain={[0, 1]} name="y" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              
              <Line data={data.eqCurve} type="monotone" dataKey="y_eq" stroke="#ef4444" name="Equilibrium" dot={false} strokeWidth={3} isAnimationActive={false} />
              <Line data={data.eqCurve} type="monotone" dataKey="y_x" stroke="#94a3b8" name="y=x" dot={false} strokeWidth={1} strokeDasharray="5 5" isAnimationActive={false} />
              
              <Line data={data.lines} type="linear" dataKey="y_rect" stroke="#3b82f6" name="Rectifying" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line data={data.lines} type="linear" dataKey="y_strip" stroke="#059669" name="Stripping" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line data={data.lines} type="linear" dataKey="y_q" stroke="#f59e0b" name="q-line" dot={false} strokeWidth={2} strokeDasharray="4 2" isAnimationActive={false} />
              
              <Line data={stages} type="step" dataKey="y_step" stroke="#8b5cf6" name="Stages" dot={false} strokeWidth={2.5} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </CalcCard>
  );
}

// ─── PACKED COLUMN DESIGNER ───
function PackedColumnCalc() {
  const [NTP, setNTP] = useState('12');
  const [HETP, setHETP] = useState('0.5');
  const [D, setD] = useState('1.2');
  const [vapRate, setVapRate] = useState('2.5');

  const ntp = parseFloat(NTP), hetp = parseFloat(HETP), d = parseFloat(D), vr = parseFloat(vapRate);
  const Z = ntp * hetp;
  const Ac = Math.PI * d * d / 4;
  const uv = vr / Ac;

  return (
    <CalcCard title="Packed Column Design" icon={Layers}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Z = NTP × HETP — Column height from theoretical plates and packing efficiency.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <InputRow label="Number of Stages (NTP)" unit="" value={NTP} onChange={setNTP} />
          <InputRow label="HETP" unit="m" value={HETP} onChange={setHETP} />
        </div>
        <div className="space-y-4">
          <InputRow label="Column Diameter (D)" unit="m" value={D} onChange={setD} />
          <InputRow label="Vapor Flow Rate" unit="m³/s" value={vapRate} onChange={setVapRate} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResultBox label="Packing Height (Z)" value={isNaN(Z) ? '--' : Z.toFixed(2)} unit="m" color="#14b8a6" />
        <ResultBox label="Cross-Section Area" value={isNaN(Ac) ? '--' : Ac.toFixed(3)} unit="m²" color="#6366f1" />
        <ResultBox label="Superficial Velocity" value={isNaN(uv) ? '--' : uv.toFixed(2)} unit="m/s" color="#f59e0b" />
        <ResultBox label="Column Volume" value={isNaN(Z) || isNaN(Ac) ? '--' : (Z * Ac).toFixed(2)} unit="m³" color="#3b82f6" />
      </div>
    </CalcCard>
  );
}

// ─── LIQUID-LIQUID EXTRACTION ───
function ExtractionCalc() {
  const [xF, setXF] = useState('0.30');
  const [xR, setXR] = useState('0.05');
  const [yS, setYS] = useState('0.0');
  const [m, setM] = useState('2.5');
  const [SoF, setSoF] = useState('1.5');

  const xf = parseFloat(xF), xr = parseFloat(xR), ys = parseFloat(yS), mv = parseFloat(m), sf = parseFloat(SoF);
  const A = mv * sf; // extraction factor
  const recovery = xf > 0 ? ((xf - xr) / xf) * 100 : 0;
  // Kremser equation for N stages
  let N = NaN;
  if (A > 0 && A !== 1 && xf > xr) {
    N = Math.log(((xf - ys / mv) / (xr - ys / mv)) * (1 - 1 / A) + 1 / A) / Math.log(A);
  } else if (Math.abs(A - 1) < 0.001) {
    N = (xf - xr) / (xr - ys / mv);
  }

  return (
    <CalcCard title="Liquid-Liquid Extraction" icon={FlaskConical}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Kremser equation — Analytical stage count for countercurrent extraction.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Feed Conc. (x_F)" unit="" value={xF} onChange={setXF} />
        <InputRow label="Raffinate Target (x_R)" unit="" value={xR} onChange={setXR} />
        <InputRow label="Solvent Inlet (y_S)" unit="" value={yS} onChange={setYS} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <InputRow label="Distribution Coeff. (m)" unit="" value={m} onChange={setM} />
        <InputRow label="Solvent/Feed Ratio (S/F)" unit="" value={SoF} onChange={setSoF} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResultBox label="Extraction Factor (A)" value={isNaN(A) ? '--' : A.toFixed(3)} unit="" color="#8b5cf6" />
        <ResultBox label="Theoretical Stages (N)" value={isNaN(N) || !isFinite(N) ? '--' : N.toFixed(1)} unit="" color="#14b8a6" />
        <ResultBox label="Recovery" value={isNaN(recovery) ? '--' : recovery.toFixed(1)} unit="%" color="#10b981" />
        <ResultBox label="Status" value={A > 1 ? 'Feasible ✓' : 'Low A ✗'} unit="" color={A > 1 ? '#10b981' : '#ef4444'} />
      </div>
    </CalcCard>
  );
}

// ─── DRYING FUNDAMENTALS ───
function DryingCalc() {
  const [mSolid, setMSolid] = useState('100');
  const [Xi, setXi] = useState('0.50');
  const [Xf, setXf] = useState('0.05');
  const [Xc, setXc] = useState('0.20');
  const [Rc, setRc] = useState('2.0');
  const [A, setA] = useState('5');

  const ms = parseFloat(mSolid), xi = parseFloat(Xi), xf = parseFloat(Xf);
  const xc = parseFloat(Xc), rc = parseFloat(Rc), a = parseFloat(A);
  const Xe = 0.02; // equilibrium moisture assumed

  let t_total = NaN;
  if (!isNaN(ms) && !isNaN(xi) && !isNaN(xf) && !isNaN(xc) && !isNaN(rc) && !isNaN(a) && a > 0 && rc > 0) {
    const t_const = (ms * (xi - xc)) / (rc * a); // constant rate period
    const t_falling = xf < xc && xc > Xe ? (ms * (xc - Xe)) / (rc * a) * Math.log((xc - Xe) / (xf - Xe)) : 0;
    t_total = t_const + (xf < xc ? t_falling : 0);
  }
  const waterRemoved = !isNaN(ms) && !isNaN(xi) && !isNaN(xf) ? ms * (xi - xf) : NaN;

  return (
    <CalcCard title="Drying Fundamentals" icon={Waves}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">Constant-rate + falling-rate drying time estimation for convective dryers.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Dry Solid Mass (m_s)" unit="kg" value={mSolid} onChange={setMSolid} />
        <InputRow label="Initial Moisture (X_i)" unit="kg/kg" value={Xi} onChange={setXi} />
        <InputRow label="Final Moisture (X_f)" unit="kg/kg" value={Xf} onChange={setXf} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InputRow label="Critical Moisture (X_c)" unit="kg/kg" value={Xc} onChange={setXc} />
        <InputRow label="Drying Rate (R_c)" unit="kg/m²·h" value={Rc} onChange={setRc} />
        <InputRow label="Drying Area (A)" unit="m²" value={A} onChange={setA} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultBox label="Total Drying Time" value={isNaN(t_total) || !isFinite(t_total) ? '--' : t_total.toFixed(2)} unit="hours" color="#f59e0b" />
        <ResultBox label="Water Removed" value={isNaN(waterRemoved) ? '--' : waterRemoved.toFixed(1)} unit="kg" color="#3b82f6" />
        <ResultBox label="Equil. Moisture (X_e)" value={Xe.toFixed(3)} unit="kg/kg" color="#10b981" />
      </div>
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type MassTab = 'mccabe' | 'packed-column' | 'extraction' | 'drying';

export default function MassTransferModule() {
  const [activeTab, setActiveTab] = useState<MassTab>('mccabe');
  const tabs = [
    { id: 'mccabe', label: 'Distillation Analysis', icon: TrendingDown },
    { id: 'packed-column', label: 'Packed Column', icon: Layers },
    { id: 'extraction', label: 'Extraction', icon: FlaskConical },
    { id: 'drying', label: 'Drying', icon: Waves },
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Mass Transfer Console</h1>
        <p className="text-slate-500 text-lg font-medium">Distillation, packed column design, extraction, and drying simulators.</p>
      </div>
      
      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-12 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest pb-4 transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'border-b-4 border-teal-600 text-slate-900 dark:text-white' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {activeTab === 'mccabe' && <RigorousMcCabeThiele />}
        {activeTab === 'packed-column' && <PackedColumnCalc />}
        {activeTab === 'extraction' && <ExtractionCalc />}
        {activeTab === 'drying' && <DryingCalc />}
      </div>
    </div>
  );
}

