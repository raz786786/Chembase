import { useState, useMemo, useCallback } from 'react';
import { 
  TrendingDown, 
  Layers, 
  Info, 
  FlaskConical,
  Waves,
  AlertTriangle
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── RIGOROUS MCCABE-THIELE STEPPING ───
function RigorousMcCabeThiele() {
  const [alpha, setAlpha] = useState('2.5');
  const [xF, setXF] = useState('0.5');
  const [xD, setXD] = useState('0.9');
  const [xB, setXB] = useState('0.1');
  const [R, setR] = useState('1.5');
  const [q, setQ] = useState('1.0');

  const a = parseFloat(alpha), xf = parseFloat(xF), xd = parseFloat(xD), xb = parseFloat(xB), r = parseFloat(R), fq = parseFloat(q);

  const getYeq = useCallback((x: number) => (a * x) / (1 + (a - 1) * x), [a]);
  const getXeq = useCallback((y: number) => y / (a - y * (a - 1)), [a]);

  const validInputs = !isNaN(a) && !isNaN(xf) && !isNaN(xd) && !isNaN(xb) && !isNaN(r) && !isNaN(fq) &&
    a > 1 && xb > 0 && xb < xf && xf < xd && xd < 1 && r > 0;

  // Fenske minimum stages at total reflux
  const N_min = validInputs
    ? Math.log((xd / (1 - xd)) * ((1 - xb) / xb)) / Math.log(a)
    : NaN;

  // Minimum reflux ratio R_min from q-line / equilibrium curve pinch intersection
  const R_min = useMemo(() => {
    if (!validInputs) return NaN;
    let xPinch = xf;
    let yPinch = getYeq(xf);
    if (Math.abs(fq - 1.0) < 1e-6) {
      xPinch = xf;
      yPinch = getYeq(xf);
    } else if (Math.abs(fq) < 1e-6) {
      yPinch = xf;
      xPinch = getXeq(xf);
    } else {
      // Solve (fq/(fq-1))*x - xf/(fq-1) = a*x / (1 + (a-1)*x)
      const m2 = fq / (fq - 1);
      const b2 = -xf / (fq - 1);
      const A = m2 * (a - 1);
      const B = m2 + b2 * (a - 1) - a;
      const C = b2;
      const disc = B * B - 4 * A * C;
      if (disc < 0 || Math.abs(A) < 1e-12) return NaN;
      const r1 = (-B + Math.sqrt(disc)) / (2 * A);
      const r2 = (-B - Math.sqrt(disc)) / (2 * A);
      const validRoots = [r1, r2].filter(rt => rt > 0 && rt < 1);
      if (validRoots.length === 0) return NaN;
      // Pick root closest to xf
      xPinch = validRoots.reduce((best, curr) => Math.abs(curr - xf) < Math.abs(best - xf) ? curr : best, validRoots[0]);
      yPinch = getYeq(xPinch);
    }
    if (yPinch <= xPinch) return NaN;
    return (xd - yPinch) / (yPinch - xPinch);
  }, [validInputs, a, xf, xd, fq, getYeq, getXeq]);

  const isPinched = validInputs && Number.isFinite(R_min) && r <= R_min;

  const data = useMemo(() => {
    const eqCurve: { x: number; y_eq: number; y_x: number }[] = [];
    let lines: { x: number; y_rect?: number; y_strip?: number; y_q?: number }[] = [];
    if (!validInputs) return { eqCurve, lines, xi: 0, yi: 0 };

    for (let x = 0; x <= 1.0001; x += 0.05) {
      const xc = Math.min(1, parseFloat(x.toFixed(2)));
      eqCurve.push({ x: xc, y_eq: getYeq(xc), y_x: xc });
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
      if (Math.abs(m1 - m2) > 1e-5) {
        xi = (b2 - b1) / (m1 - m2);
        yi = m1 * xi + b1;
      } else {
        xi = xf;
        yi = getYeq(xf);
      }
    }

    lines = [
      { x: xd, y_rect: xd },
      { x: xi, y_rect: yi, y_strip: yi, y_q: yi },
      { x: xf, y_q: xf },
      { x: xb, y_strip: xb }
    ].sort((c, n) => c.x - n.x);

    return { eqCurve, lines, xi, yi };
  }, [validInputs, xf, xd, xb, r, fq, getYeq]);

  const { stages, count } = useMemo(() => {
    if (!validInputs || isPinched) return { stages: [], count: 0 };
    
    const pts: { x: number; y_step: number }[] = [];
    let current_x = xd;
    let current_y = xd;
    let stageCount = 0;
    const { xi, yi } = data;

    while (current_x > xb && stageCount < 50) {
      pts.push({ x: current_x, y_step: current_y });
      const next_x = getXeq(current_y);
      pts.push({ x: next_x, y_step: current_y });
      stageCount++;

      if (next_x <= xb) {
        pts.push({ x: next_x, y_step: next_x });
        break;
      }

      let next_y;
      if (next_x > xi) {
        next_y = (r / (r + 1)) * next_x + xd / (r + 1);
      } else {
        const m_strip = Math.abs(xi - xb) > 1e-5 ? (yi - xb) / (xi - xb) : 1;
        next_y = m_strip * (next_x - xb) + xb;
      }
      pts.push({ x: next_x, y_step: next_y });
      current_x = next_x;
      current_y = next_y;
    }
    return { stages: pts, count: stageCount };
  }, [validInputs, isPinched, xd, xb, r, data, getXeq]);

  return (
    <CalcCard title="McCabe-Thiele Distillation Analysis" icon={TrendingDown}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Equilibrium curve generation and recursive theoretical stage stepping.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-teal-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-surface-50">Properties</h4>
          </div>
          <InputRow label="Volatility (α)" unit="" value={alpha} onChange={setAlpha} />
          <InputRow label="Reflux Ratio (R)" unit="" value={R} onChange={setR} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-teal-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-surface-50">Compositions</h4>
          </div>
          <InputRow label="Feed (x_F)" unit="" value={xF} onChange={setXF} />
          <InputRow label="Distillate (x_D)" unit="" value={xD} onChange={setXD} />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-6 bg-teal-600 rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-surface-50">Operating</h4>
          </div>
          <InputRow label="Feed Quality (q)" unit="" value={q} onChange={setQ} />
          <InputRow label="Bottoms (x_B)" unit="" value={xB} onChange={setXB} />
        </div>
      </div>

      {!validInputs && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-bold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          <span>Invalid Parameters: Requires relative volatility α &gt; 1, reflux ratio R &gt; 0, and 0 &lt; x_B &lt; x_F &lt; x_D &lt; 1.</span>
        </div>
      )}

      {isPinched && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-bold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>Pinch Warning: Operating reflux ratio R ({r.toFixed(3)}) ≤ minimum reflux R_min ({R_min.toFixed(3)}). Separation is infeasible (infinite stages required). Increase R above R_min.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass p-6 rounded-3xl border border-teal-100 dark:border-teal-900/30 bg-teal-50/20 dark:bg-teal-900/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1">Theoretical Stages</p>
            <h2 className="text-3xl font-black text-surface-900 dark:text-surface-50">
              {!isPinched && count > 0 && count < 50 ? count.toFixed(0) : isPinched ? '∞' : '--'}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center text-surface-50 shadow-lg shadow-teal-600/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <ResultBox label="Minimum Reflux (R_min)" value={Number.isFinite(R_min) ? R_min.toFixed(3) : '--'} unit="" color={isPinched ? '#ef4444' : '#f59e0b'} />
        <ResultBox label="Fenske Min Stages (N_min)" value={Number.isFinite(N_min) ? N_min.toFixed(2) : '--'} unit="" color="#6366f1" />
      </div>

      <div className="glass p-4 rounded-2xl border border-surface-100 dark:border-surface-800 flex items-start gap-3 mb-8">
        <Info className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs font-bold text-surface-500 leading-relaxed">
          Operating reflux should typically be 1.2× to 1.5× R_min ({Number.isFinite(R_min) ? `${(1.2 * R_min).toFixed(2)} – ${(1.5 * R_min).toFixed(2)}` : '--'}) for optimal capital vs. energy cost balance.
        </p>
      </div>

      <div className="glass p-6 rounded-3xl border border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
        {(() => {
          const W = 560, H = 400, PL = 52, PR = 24, PT = 18, PB = 42;
          const sx = (xv: number) => PL + Math.max(0, Math.min(1, xv)) * (W - PL - PR);
          const sy = (yv: number) => H - PB - Math.max(0, Math.min(1, yv)) * (H - PT - PB);
          const eqPath = data.eqCurve.map((pt, i) => `${i === 0 ? 'M' : 'L'}${sx(pt.x).toFixed(1)},${sy(pt.y_eq).toFixed(1)}`).join(' ');
          const stagePath = stages.map((pt, i) => `${i === 0 ? 'M' : 'L'}${sx(pt.x).toFixed(1)},${sy(pt.y_step).toFixed(1)}`).join(' ');
          const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
          return (
            <>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto h-auto select-none">
                {ticks.map(t => (
                  <g key={t}>
                    <line x1={PL} y1={sy(t)} x2={W - PR} y2={sy(t)} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={sx(t)} y1={PT} x2={sx(t)} y2={H - PB} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={PL - 8} y={sy(t) + 3.5} textAnchor="end" className="fill-slate-400 text-[10px] font-bold">{t.toFixed(1)}</text>
                    <text x={sx(t)} y={H - PB + 16} textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">{t.toFixed(1)}</text>
                  </g>
                ))}
                {/* Axes */}
                <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />
                <line x1={PL} y1={PT} x2={PL} y2={H - PB} className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.2" />
                {/* 45-degree diagonal */}
                <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="5 5" />
                {/* Equilibrium curve */}
                {validInputs && eqPath && <path d={eqPath} fill="none" stroke="#ef4444" strokeWidth="2.8" strokeLinejoin="round" />}
                {/* Operating lines & q-line */}
                {validInputs && (
                  <>
                    <line x1={sx(xd)} y1={sy(xd)} x2={sx(data.xi)} y2={sy(data.yi)} stroke="#3b82f6" strokeWidth="2.2" />
                    <line x1={sx(xb)} y1={sy(xb)} x2={sx(data.xi)} y2={sy(data.yi)} stroke="#059669" strokeWidth="2.2" />
                    <line x1={sx(xf)} y1={sy(xf)} x2={sx(data.xi)} y2={sy(data.yi)} stroke="#f59e0b" strokeWidth="2.2" strokeDasharray="5 3" />
                    <circle cx={sx(data.xi)} cy={sy(data.yi)} r="4" fill="#f59e0b" />
                  </>
                )}
                {/* Theoretical stages staircase */}
                {validInputs && !isPinched && stagePath && (
                  <path d={stagePath} fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinejoin="miter" />
                )}
                {/* Axis labels */}
                <text x={(PL + W - PR) / 2} y={H - 8} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-bold">Liquid Mole Fraction (x)</text>
                <text x={14} y={(PT + H - PB) / 2} textAnchor="middle" transform={`rotate(-90 14 ${(PT + H - PB) / 2})`} className="fill-slate-500 dark:fill-slate-400 text-[11px] font-bold">Vapor Mole Fraction (y)</text>
              </svg>
              <div className="flex flex-wrap justify-center gap-4 mt-4 text-[11px] font-bold text-surface-500">
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-red-500 inline-block" /> Equilibrium</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 inline-block" /> Rectifying</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-600 inline-block" /> Stripping</span>
                <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-amber-500 inline-block" /> q-line</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-violet-500 inline-block" /> Stages</span>
              </div>
            </>
          );
        })()}
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
  const Z = !isNaN(ntp) && !isNaN(hetp) && ntp > 0 && hetp > 0 ? ntp * hetp : NaN;
  const Ac = !isNaN(d) && d > 0 ? Math.PI * d * d / 4 : NaN;
  const uv = !isNaN(Ac) && Ac > 0 && !isNaN(vr) && vr >= 0 ? vr / Ac : NaN;

  return (
    <CalcCard title="Packed Column Design" icon={Layers}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Z = NTP × HETP — Column height from theoretical plates and packing efficiency.</p>
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
  const validParams = !isNaN(xf) && !isNaN(xr) && !isNaN(ys) && !isNaN(mv) && !isNaN(sf) &&
    xf > 0 && xr > 0 && ys >= 0 && mv > 0 && sf > 0;
  const A = validParams ? mv * sf : NaN; // extraction factor
  const recovery = validParams && xf > xr ? ((xf - xr) / xf) * 100 : NaN;
  let N = NaN;
  if (validParams && xf > xr) {
    const denom = xr - ys / mv;
    if (denom > 0) {
      if (Math.abs(A - 1) >= 0.001) {
        const term = ((xf - ys / mv) / denom) * (1 - 1 / A) + 1 / A;
        if (term > 0) {
          N = Math.log(term) / Math.log(A);
        }
      } else {
        N = (xf - xr) / denom;
      }
    }
  }
  const feasible = isFinite(N) && N > 0;

  return (
    <CalcCard title="Liquid-Liquid Extraction" icon={FlaskConical}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Kremser equation — Analytical stage count for countercurrent extraction.</p>
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
        <ResultBox label="Theoretical Stages (N)" value={!feasible ? '--' : N.toFixed(1)} unit="" color="#14b8a6" />
        <ResultBox label="Recovery" value={isNaN(recovery) ? '--' : recovery.toFixed(1)} unit="%" color="#10b981" />
        <ResultBox label="Status" value={feasible ? 'Feasible ✓' : 'Infeasible ✗'} unit="" color={feasible ? '#10b981' : '#ef4444'} />
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
  const [Xe, setXe] = useState('0.02');
  const [Rc, setRc] = useState('2.0');
  const [A, setA] = useState('5');

  const ms = parseFloat(mSolid), xi = parseFloat(Xi), xf = parseFloat(Xf);
  const xc = parseFloat(Xc), xe = parseFloat(Xe), rc = parseFloat(Rc), a = parseFloat(A);

  let t_total = NaN;
  const validDrying = !isNaN(ms) && !isNaN(xi) && !isNaN(xf) && !isNaN(xc) && !isNaN(xe) && !isNaN(rc) && !isNaN(a) &&
    ms > 0 && a > 0 && rc > 0 && xe >= 0 && xi > xf && xf > xe && xc > xe;

  if (validDrying) {
    let t_const = 0;
    let t_falling = 0;
    if (xi > xc) {
      t_const = (ms * (xi - Math.max(xf, xc))) / (rc * a);
      if (xf < xc) {
        t_falling = ((ms * (xc - xe)) / (rc * a)) * Math.log((xc - xe) / (xf - xe));
      }
    } else {
      t_falling = ((ms * (xc - xe)) / (rc * a)) * Math.log((xi - xe) / (xf - xe));
    }
    t_total = t_const + t_falling;
  }
  const waterRemoved = !isNaN(ms) && !isNaN(xi) && !isNaN(xf) && ms > 0 && xi > xf ? ms * (xi - xf) : NaN;

  return (
    <CalcCard title="Drying Fundamentals" icon={Waves}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Constant-rate + falling-rate drying time estimation for convective dryers.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <InputRow label="Dry Solid Mass (m_s)" unit="kg" value={mSolid} onChange={setMSolid} />
        <InputRow label="Initial Moisture (X_i)" unit="kg/kg" value={Xi} onChange={setXi} />
        <InputRow label="Final Moisture (X_f)" unit="kg/kg" value={Xf} onChange={setXf} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <InputRow label="Critical Moisture (X_c)" unit="kg/kg" value={Xc} onChange={setXc} />
        <InputRow label="Equil. Moisture (X_e)" unit="kg/kg" value={Xe} onChange={setXe} />
        <InputRow label="Drying Rate (R_c)" unit="kg/m²·h" value={Rc} onChange={setRc} />
        <InputRow label="Drying Area (A)" unit="m²" value={A} onChange={setA} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultBox label="Total Drying Time" value={isNaN(t_total) || !isFinite(t_total) ? '--' : t_total.toFixed(2)} unit="hours" color="#f59e0b" />
        <ResultBox label="Water Removed" value={isNaN(waterRemoved) ? '--' : waterRemoved.toFixed(1)} unit="kg" color="#3b82f6" />
        <ResultBox label="Equil. Moisture (X_e)" value={isNaN(xe) ? '--' : xe.toFixed(3)} unit="kg/kg" color="#10b981" />
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
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-surface-900 dark:text-surface-50 mb-1">Mass Transfer Console</h1>
        <p className="text-surface-500 text-xs">Distillation, packed column design, extraction, and drying simulators.</p>
      </div>
      
      <div className="touch-scroll-x flex gap-2 border-b border-surface-200 dark:border-surface-800 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider pb-2.5 transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id 
              ? 'border-teal-600 text-teal-600 dark:text-teal-400' 
              : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
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

