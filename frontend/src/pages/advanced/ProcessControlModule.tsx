import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Timer, SlidersHorizontal, Target, Gauge, GitBranch, Activity, Info,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── Formatting ──────────────────────────────────────────────────────────────
function fmt(v: number | null | undefined, digits = 3, suffix = ''): string {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return v.toFixed(digits) + suffix;
}
function pct(v: number): string { return fmt(v, 1, '%'); }

// ─── Generic 2-D SVG plot (linear or log-x axes) ────────────────────────────
interface Pt { x: number; y: number; }
interface Series { id: string; color: string; pts: Pt[]; dashed?: boolean; width?: number; }

function Plot2D({ series, xLog = false, yLog = false, height = 300, xLabel = 'x', yLabel = 'y',
  xMin, xMax, yMin, yMax, zeroLine = true }: {
  series: Series[]; xLog?: boolean; yLog?: boolean; height?: number;
  xLabel?: string; yLabel?: string;
  xMin?: number; xMax?: number; yMin?: number; yMax?: number; zeroLine?: boolean;
}) {
  const W = 560, H = height, PL = 54, PR = 16, PT = 12, PB = 34;
  const toX = (x: number) => xLog ? Math.log10(x) : x;
  const toY = (y: number) => yLog ? Math.log10(Math.max(Math.abs(y), 1e-12)) : y;
  const xs = series.flatMap(s => s.pts.map(p => toX(p.x))).filter(Number.isFinite);
  const ys = series.flatMap(s => s.pts.map(p => toY(p.y))).filter(Number.isFinite);
  let loX = xMin ?? (xs.length ? Math.min(...xs) : 0);
  let hiX = xMax ?? (xs.length ? Math.max(...xs) : 1);
  let loY = yMin ?? (ys.length ? Math.min(...ys) : 0);
  let hiY = yMax ?? (ys.length ? Math.max(...ys) : 1);
  if (hiX - loX < 1e-9) hiX = loX + 1;
  if (hiY - loY < 1e-9) hiY = loY + 1;
  if (xMin === undefined) { const pad = (hiX - loX) * 0.04; loX -= pad; hiX += pad; }
  if (yMin === undefined) { const pad = (hiY - loY) * 0.08; loY -= pad; hiY += pad; }
  if (zeroLine && loY > 0) loY = 0;
  const X = (x: number) => PL + (toX(x) - loX) / (hiX - loX) * (W - PL - PR);
  const Y = (y: number) => H - PB - (toY(y) - loY) / (hiY - loY) * (H - PT - PB);
  const path = (pts: Pt[]) => {
    const segs: string[] = [];
    for (const p of pts) {
      const x = X(p.x), y = Y(p.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      segs.push((segs.length === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1));
    }
    return segs.join(' ');
  };
  const disp = (v: number) => Math.abs(v) >= 10000 || (Math.abs(v) > 0 && Math.abs(v) < 0.001)
    ? v.toExponential(0) : Number(v.toFixed(3)).toString();
  const ticks = (lo: number, hi: number) => Array.from({ length: 6 }, (_, i) => lo + (hi - lo) * i / 5);
  const tx = ticks(loX, hiX), ty = ticks(loY, hiY);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
      {ty.map((t, i) => {
        const yy = Y(t);
        return (
          <g key={'gy' + i}>
            <line x1={PL} y1={yy} x2={W - PR} y2={yy} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.7" />
            <text x={PL - 6} y={yy + 3} textAnchor="end" className="fill-slate-400 text-[9px] font-semibold">{disp(yLog ? Math.pow(10, t) : t)}</text>
          </g>
        );
      })}
      {tx.map((t, i) => {
        const xx = PL + (t - loX) / (hiX - loX) * (W - PL - PR);
        return (
          <g key={'gx' + i}>
            <line x1={xx} y1={PT} x2={xx} y2={H - PB} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.7" />
            <text x={xx} y={H - PB + 14} textAnchor="middle" className="fill-slate-400 text-[9px] font-semibold">{disp(xLog ? Math.pow(10, t) : t)}</text>
          </g>
        );
      })}
      <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1" />
      <line x1={PL} y1={PT} x2={PL} y2={H - PB} className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="1" />
      {loX < 0 && hiX > 0 && (
        <line x1={X(0)} y1={PT} x2={X(0)} y2={H - PB} className="stroke-rose-400/70 dark:stroke-rose-500/60" strokeWidth="1.2" strokeDasharray="4 3" />
      )}
      {loY < 0 && hiY > 0 && (
        <line x1={PL} y1={Y(0)} x2={W - PR} y2={Y(0)} className="stroke-emerald-400/70 dark:stroke-emerald-500/60" strokeWidth="1.2" strokeDasharray="4 3" />
      )}
      {series.map(s => (
        <path key={s.id} d={path(s.pts)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2.2}
          strokeLinejoin="round" strokeDasharray={s.dashed ? '5 4' : undefined} />
      ))}
      <text x={W / 2} y={H - 4} textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">{xLabel}</text>
      <text x={10} y={H / 2} textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`} className="fill-slate-400 text-[10px] font-bold">{yLabel}</text>
    </svg>
  );
}
// ─── Process model step responses (analytic) ────────────────────────────────
function linspace(a: number, b: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(a + (b - a) * i / n);
  return out;
}

// First-order + dead time: y(t) = Kp·Δu·(1 − e^{−(t−θ)/τ}) for t ≥ θ
function fopdtStep(Kp: number, tau: number, theta: number, du: number, t: number[]): number[] {
  return t.map(ti => ti < theta ? 0 : Kp * du * (1 - Math.exp(-(ti - theta) / Math.max(tau, 1e-9))));
}

// Pure integrating: y(t) = Kp·Δu·t
function integratorStep(Kp: number, du: number, t: number[]): number[] {
  return t.map(ti => Kp * du * ti);
}

// Integrating + lag (ramp with curvature): y = Kp·Δu·[t − τ(1 − e^{−t/τ})]
function integratorLagStep(Kp: number, tau: number, du: number, t: number[]): number[] {
  return t.map(ti => ti <= 0 ? 0 : Kp * du * (ti - tau * (1 - Math.exp(-ti / Math.max(tau, 1e-9)))));
}

// Second-order step response — under / critically / over damped
function secondOrderStep(Kp: number, zeta: number, wn: number, du: number, t: number[]): number[] {
  if (zeta < 1) {
    const wd = wn * Math.sqrt(1 - zeta * zeta);
    const c = zeta / Math.sqrt(1 - zeta * zeta);
    return t.map(ti => {
      if (ti <= 0) return 0;
      const e = Math.exp(-zeta * wn * ti);
      return Kp * du * (1 - e * (Math.cos(wd * ti) + c * Math.sin(wd * ti)));
    });
  }
  if (zeta > 1) {
    const b = wn * Math.sqrt(zeta * zeta - 1);
    const c = zeta / Math.sqrt(zeta * zeta - 1);
    return t.map(ti => {
      if (ti <= 0) return 0;
      const e = Math.exp(-zeta * wn * ti);
      return Kp * du * (1 - e * (Math.cosh(b * ti) + c * Math.sinh(b * ti)));
    });
  }
  return t.map(ti => ti <= 0 ? 0 : Kp * du * (1 - Math.exp(-wn * ti) * (1 + wn * ti)));
}

// Model metrics on a step-response array
function stepMetrics(y: number[], t: number[], final: number): {
  t63: number; t90: number; ts2: number; overshoot: number; peak: number;
} {
  const target = Math.abs(final) > 1e-12 ? final : 1;
  let t63 = 0, t90 = 0;
  for (let i = 0; i < y.length; i++) {
    if (t63 === 0 && Math.abs(y[i]) >= Math.abs(0.632 * target)) t63 = t[i];
    if (t90 === 0 && Math.abs(y[i]) >= Math.abs(0.9 * target)) t90 = t[i];
  }
  const peak = y.length ? Math.max(...y) : 0;
  const overshoot = Math.abs(target) > 1e-12 ? Math.max(0, (peak - target) / Math.abs(target)) * 100 : 0;
  const band = 0.02 * Math.abs(target);
  let ts2 = t[t.length - 1] ?? 0;
  if (band > 1e-12) {
    for (let i = t.length - 1; i >= 0; i--) {
      if (Math.abs(y[i] - target) > band) { ts2 = i < t.length - 1 ? t[i + 1] : t[i]; break; }
    }
  }
  return { t63, t90, ts2, overshoot, peak };
}
// ─── PID controller tuning methods ──────────────────────────────────────────
interface TuningResult {
  Kc: number; tauI: number; tauD: number;
  note: string; valid: boolean;
}

const badTuning = (msg: string): TuningResult => ({ Kc: 0, tauI: 0, tauD: 0, note: msg, valid: false });

// Ziegler–Nichols open-loop (process reaction curve)
function znOpenLoop(Kp: number, tau: number, theta: number): TuningResult {
  if (!(Kp > 0) || !(tau > 0) || !(theta > 0)) return badTuning('Kp, τ and θ must all be positive.');
  return {
    Kc: 1.2 * tau / (Kp * theta),
    tauI: 2 * theta,
    tauD: 0.5 * theta,
    valid: true,
    note: 'Ziegler–Nichols open-loop (reaction curve). Aggressive — expect ~25% overshoot; good starting point.',
  };
}

// Ziegler–Nichols closed-loop (ultimate gain Ku, ultimate period Pu)
function znClosedLoop(Ku: number, Pu: number): TuningResult {
  if (!(Ku > 0) || !(Pu > 0)) return badTuning('Ultimate gain Ku and ultimate period Pu must be positive.');
  return {
    Kc: Ku / 1.7,
    tauI: Pu / 2,
    tauD: Pu / 8,
    valid: true,
    note: 'Ziegler–Nichols closed-loop (ultimate) — from the sustained-oscillation experiment. Very aggressive.',
  };
}

// Cohen–Coon
function cohenCoon(Kp: number, tau: number, theta: number): TuningResult {
  if (!(Kp > 0) || !(tau > 0) || !(theta > 0)) return badTuning('Kp, τ and θ must all be positive.');
  const r = theta / tau;
  return {
    Kc: (1 / Kp) * (tau / theta) * (4 / 3 + r / 4),
    tauI: theta * (32 + 6 * r) / (13 + 8 * r),
    tauD: 4 * theta / (11 + 2 * r),
    valid: true,
    note: 'Cohen–Coon — quarter-decay tuning, best when dead time is a significant fraction of τ.',
  };
}

// IMC / λ-tuning for FOPDT: closed-loop time constant λ
function imcLambda(Kp: number, tau: number, theta: number, lambda: number): TuningResult {
  if (!(Kp > 0) || !(tau > 0) || !(lambda > 0)) return badTuning('Kp, τ and λ must be positive.');
  const l = lambda + theta;
  return {
    Kc: tau / (Kp * l),
    tauI: tau,
    tauD: 0,
    valid: true,
    note: 'IMC / λ-tuning — closed-loop time constant λ = ' + fmt(lambda, 2) + '. Larger λ → slower and more robust; smaller λ → faster and more aggressive.',
  };
}
// ─── Closed-loop servo/regulatory simulation (Euler, dead-time buffer) ──────
interface SimOpts {
  Kp: number; tau: number; theta: number; model: 'fopdt' | 'integrating';
  Kc: number; tauI: number; tauD: number;
  sp: number; load: number; tLoad: number; tEnd: number; dt: number;
}
interface SimResult {
  t: number[]; y: number[]; u: number[]; sp: number[];
  overshoot: number; settle: number; iae: number; finalErr: number; unstable: boolean;
}

function simClosedLoop(o: SimOpts): SimResult {
  const n = Math.max(4, Math.round(o.tEnd / o.dt));
  const bufLen = Math.max(1, Math.round(o.theta / o.dt));
  const buf = new Array(bufLen).fill(0);
  let y = 0, integral = 0;
  // filtered derivative on measurement (Åström filter, N = 10) to avoid
  // discrete-time instability from the unfiltered differentiator
  let yF = 0, yFprev = 0;
  const D_N = 10;
  const tauF = o.tauD > 0 ? o.tauD / D_N : o.dt;
  const alphaF = o.dt / (tauF + o.dt);
  const t: number[] = [], ys: number[] = [], us: number[] = [], sps: number[] = [];
  for (let i = 0; i <= n; i++) {
    const ti = i * o.dt;
    const e = o.sp - y;
    const loadNow = ti >= o.tLoad ? o.load : 0;
    const P = o.Kc * e;
    if (o.tauI > 0) integral += (o.Kc / o.tauI) * e * o.dt;
    yFprev = yF;
    yF += alphaF * (y - yF);
    const D = o.tauD > 0 ? -o.Kc * o.tauD * (yF - yFprev) / o.dt : 0;
    const u = P + integral + D;
    const uDel = buf.shift() ?? 0;
    buf.push(u + loadNow);
    let dy: number;
    if (o.model === 'integrating') dy = o.Kp * uDel * o.dt;
    else dy = ((o.Kp * uDel) - y) / Math.max(o.tau, 1e-9) * o.dt;
    y += dy;
    if (!isFinite(y)) { y = y > 0 ? 1e12 : -1e12; }
    t.push(ti); ys.push(y); us.push(u); sps.push(o.sp);
  }
  const maxY = Math.max(...ys);
  const overshoot = Math.abs(o.sp) > 1e-12 ? Math.max(0, (maxY - o.sp) / Math.abs(o.sp)) * 100 : 0;
  const band = 0.02 * Math.abs(o.sp);
  let settle = o.tEnd;
  if (band > 1e-12) {
    for (let i = n; i >= 0; i--) {
      if (Math.abs(ys[i] - o.sp) > band) { settle = i < n ? t[i + 1] : t[i]; break; }
    }
  }
  let iae = 0;
  for (let i = 1; i <= n; i++) iae += Math.abs(o.sp - ys[i]) * o.dt;
  const finalErr = Math.abs(ys[n] - o.sp);
  const unstable = !isFinite(ys[n]) || Math.abs(ys[n]) > 1e6 || Math.abs(ys[n]) > 200 * Math.abs(o.sp || 1);
  return { t, y: ys, u: us, sp: sps, overshoot, settle, iae, finalErr, unstable };
}
// ─── Complex arithmetic, polynomial roots (Durand–Kerner), Routh–Hurwitz ────
interface Cpx { re: number; im: number; }

function polyRoots(coeffs: number[]): Cpx[] {
  const c = coeffs.slice();
  while (c.length > 1 && Math.abs(c[0]) < 1e-14) c.shift();
  const deg = c.length - 1;
  if (deg <= 0) return [];
  const a = c.map(v => v / c[0]);
  const roots: Cpx[] = [];
  for (let i = 0; i < deg; i++) {
    const ang = (2 * Math.PI * i) / deg + 0.4;
    roots.push({ re: 0.4 * Math.cos(ang), im: 0.4 * Math.sin(ang) });
  }
  const evalAt = (z: Cpx): Cpx => {
    let re = 0, im = 0;
    for (let i = 0; i <= deg; i++) {
      const nr = re * z.re - im * z.im + a[i];
      const ni = re * z.im + im * z.re;
      re = nr; im = ni;
    }
    return { re, im };
  };
  for (let it = 0; it < 600; it++) {
    let maxMove = 0;
    for (let j = 0; j < deg; j++) {
      const r = roots[j];
      const p = evalAt(r);
      if (Math.abs(p.re) + Math.abs(p.im) < 1e-16) continue;
      let qr = 1, qi = 0;
      for (let k = 0; k < deg; k++) {
        if (k === j) continue;
        const dr = r.re - roots[k].re, di = r.im - roots[k].im;
        const nr = qr * dr - qi * di, ni = qr * di + qi * dr;
        qr = nr; qi = ni;
      }
      const m2 = qr * qr + qi * qi;
      if (m2 < 1e-18) continue;
      const dRe = (p.re * qr + p.im * qi) / m2;
      const dIm = (p.im * qr - p.re * qi) / m2;
      roots[j] = { re: r.re - dRe, im: r.im - dIm };
      maxMove = Math.max(maxMove, Math.hypot(dRe, dIm));
    }
    if (maxMove < 1e-12) break;
  }
  return roots;
}

interface RouthResult { stable: boolean; rhp: number; table: number[][]; degenerate: boolean; }

function routhHurwitz(coeffs: number[]): RouthResult {
  const c = coeffs.slice();
  while (c.length > 0 && Math.abs(c[c.length - 1]) < 1e-14) c.pop();
  while (c.length > 0 && Math.abs(c[0]) < 1e-14) c.shift();
  const n = c.length - 1;
  if (n < 1) return { stable: false, rhp: 0, table: [], degenerate: true };
  const row1: number[] = [], row2: number[] = [];
  for (let i = 0; i <= n; i++) { if (i % 2 === 0) row1.push(c[i]); else row2.push(c[i] || 0); }
  const table: number[][] = [row1, row2];
  let degenerate = false;
  for (let r = 2; r <= n; r++) {
    const prev = table[r - 2], last = table[r - 1];
    if (Math.abs(last[0]) < 1e-12) { last[0] = 1e-9; degenerate = true; }
    const next: number[] = [];
    for (let i = 0; i < last.length - 1; i++) {
      const a = prev[0], b = last[0], c2 = prev[i + 1] ?? 0, d = last[i + 1] ?? 0;
      next.push(-(a * d - b * c2) / b);
    }
    table.push(next);
  }
  let signChanges = 0;
  let prevSign = Math.sign(table[0][0] || 0);
  for (let r = 1; r < table.length; r++) {
    const s = Math.sign(table[r][0] || 0);
    if (s !== prevSign && s !== 0) signChanges++;
    prevSign = s;
  }
  return { stable: signChanges === 0 && !degenerate, rhp: signChanges, table, degenerate };
}
// ─── Root locus: characteristic D(s) + K·N(s) for a K sweep ────────────────
function rootLocus(num: number[], den: number[], Ks: number[]): Cpx[][] {
  const locus: Cpx[][] = [];
  for (const K of Ks) {
    const deg = Math.max(num.length, den.length);
    const poly = new Array(deg).fill(0);
    for (let i = 0; i < den.length; i++) poly[i] += den[i];
    const off = den.length - num.length;
    for (let i = 0; i < num.length; i++) poly[i + off] += K * num[i];
    locus.push(polyRoots(poly));
  }
  return locus;
}

// ─── Frequency response (Bode) from a factor list ───────────────────────────
type BodeFactor =
  | { kind: 'gain'; value: number }
  | { kind: 'pole0'; value: number }     // (s)^-n at origin
  | { kind: 'zero0'; value: number }     // (s)^n at origin
  | { kind: 'pole1'; value: number }     // 1/(1 + τ·s)
  | { kind: 'zero1'; value: number };    // 1 + τ·s

function bodePoint(factors: BodeFactor[], w: number, theta = 0): { mag: number; phase: number } {
  let mag = 1, phase = -theta * w * 180 / Math.PI;
  for (const f of factors) {
    if (f.kind === 'gain') mag *= f.value;
    else if (f.kind === 'pole0') { mag /= Math.pow(w, f.value); phase -= 90 * f.value; }
    else if (f.kind === 'zero0') { mag *= Math.pow(w, f.value); phase += 90 * f.value; }
    else if (f.kind === 'pole1') { const x = f.value * w; mag /= Math.sqrt(1 + x * x); phase -= Math.atan(x) * 180 / Math.PI; }
    else if (f.kind === 'zero1') { const x = f.value * w; mag *= Math.sqrt(1 + x * x); phase += Math.atan(x) * 180 / Math.PI; }
  }
  return { mag: Math.max(mag, 1e-14), phase };
}

function bodeCalc(factors: BodeFactor[], wLo = 0.01, wHi = 100, pts = 130, theta = 0): {
  w: number[]; magDb: number[]; phase: number[];
} {
  const w: number[] = [], m: number[] = [], p: number[] = [];
  for (let i = 0; i <= pts; i++) {
    const wi = wLo * Math.pow(wHi / wLo, i / pts);
    const r = bodePoint(factors, wi, theta);
    w.push(wi); m.push(20 * Math.log10(r.mag)); p.push(r.phase);
  }
  return { w, magDb: m, phase: p };
}

function bodeMargins(factors: BodeFactor[], wLo = 0.001, wHi = 1000, theta = 0): {
  wgc: number | null; wpc: number | null; gmDb: number | null; pmDeg: number | null;
} {
  const n = 4000;
  let wgc: number | null = null, wpc: number | null = null;
  let prev = bodePoint(factors, wLo, theta);
  for (let i = 1; i <= n; i++) {
    const wi = wLo * Math.pow(wHi / wLo, i / n);
    const cur = bodePoint(factors, wi, theta);
    if (wgc === null && ((prev.mag >= 1 && cur.mag < 1) || (prev.mag < 1 && cur.mag >= 1))) {
      wgc = wi;
    }
    if (wpc === null && prev.phase <= -180 && cur.phase > -180) wpc = wi;
    else if (wpc === null && prev.phase >= -180 && cur.phase < -180) wpc = wi;
    prev = cur;
  }
  let gmDb: number | null = null, pmDeg: number | null = null;
  if (wpc !== null) gmDb = -20 * Math.log10(bodePoint(factors, wpc, theta).mag);
  if (wgc !== null) pmDeg = bodePoint(factors, wgc, theta).phase + 180;
  return { wgc, wpc, gmDb, pmDeg };
}

function bodeStable(m: { gmDb: number | null; pmDeg: number | null }): boolean {
  const gmOk = m.gmDb === null || m.gmDb > 0;
  const pmOk = m.pmDeg === null || m.pmDeg > 0;
  return gmOk && pmOk;
}
// ─── Small UI helpers ────────────────────────────────────────────────────────
function SelectRow({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 group">
      <label className="md:w-64 text-sm font-bold text-slate-500 dark:text-slate-400 group-focus-within:text-indigo-600 transition-colors">
        {label}
        {hint && <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">{hint}</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-grow px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function StatRow({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="py-2.5 flex items-baseline justify-between gap-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
        {label}
        {sub && <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">{sub}</span>}
      </span>
      <span className={`text-sm font-black tabular-nums ${accent ?? 'text-slate-800 dark:text-slate-100'}`}>{value}</span>
    </div>
  );
}

function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{children}</p>
    </div>
  );
}

function WarnNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/15 p-4">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">{children}</p>
    </div>
  );
}

// ─── TAB 1 · PROCESS MODELS ────────────────────────────────────────────────
function ProcessModelsCalc() {
  const [model, setModel] = useState('fopdt');
  const [Kp, setKp] = useState('2');
  const [tau, setTau] = useState('4');
  const [theta, setTheta] = useState('1');
  const [zeta, setZeta] = useState('0.35');
  const [wn, setWn] = useState('1.5');
  const [du, setDu] = useState('1');
  const [tEnd, setTEnd] = useState('30');
  const Kpv = parseFloat(Kp) || 0, tauv = parseFloat(tau) || 0, thv = parseFloat(theta) || 0;
  const zv = parseFloat(zeta) || 0, wnv = parseFloat(wn) || 0, duv = parseFloat(du) || 0;
  const tv = Math.max(1, parseFloat(tEnd) || 10);
  const t = linspace(0, tv, 400);
  let y: number[] = [];
  let final = 0, label = '';
  if (model === 'fopdt') { y = fopdtStep(Kpv, tauv, thv, duv, t); final = Kpv * duv; label = 'G(s) = Kp·e^(−θs)/(τs + 1)'; }
  else if (model === 'integrating') { y = integratorStep(Kpv, duv, t); final = Kpv * duv * tv; label = 'G(s) = Kp/s'; }
  else if (model === 'int-lag') { y = integratorLagStep(Kpv, tauv, duv, t); label = 'G(s) = Kp/[s(τs + 1)]'; }
  else { y = secondOrderStep(Kpv, zv, wnv, duv, t); final = Kpv * duv; label = zetaLabel(zv); }
  const m = stepMetrics(y, t, final);
  const opts = [
    { value: 'fopdt', label: 'First-order + dead time (FOPDT)' },
    { value: 'int-lag', label: 'Integrating + lag' },
    { value: 'integrating', label: 'Pure integrator' },
    { value: 'sopdt', label: 'Second order (ζ, ωn)' },
  ];
  return (
    <CalcCard title="Process Model Step Responses" icon={Timer}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">{label}</p>
      <SelectRow label="Model" value={model} onChange={setModel} options={opts} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <InputRow label="Process gain Kp" unit="−" value={Kp} onChange={setKp} />
        <InputRow label="Time constant τ" unit="min" value={tau} onChange={setTau} />
        {(model === 'fopdt' || model === 'int-lag') && <InputRow label="Dead time θ" unit="min" value={theta} onChange={setTheta} />}
        {model === 'sopdt' && <InputRow label="Damping ratio ζ" unit="−" value={zeta} onChange={setZeta} />}
        {model === 'sopdt' && <InputRow label="Natural freq. ωn" unit="rad/min" value={wn} onChange={setWn} />}
        <InputRow label="Input step Δu" unit="−" value={du} onChange={setDu} />
        <InputRow label="Horizon" unit="min" value={tEnd} onChange={setTEnd} />
      </div>
      <div className="mt-4 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <Plot2D series={[{ id: 'y', color: '#6366f1', pts: t.map((ti, i) => ({ x: ti, y: y[i] })) }]}
          height={330} xLabel="time (min)" yLabel="y(t)" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <ResultBox label="63.2% time" value={fmt(m.t63, 2)} unit="min" color="#6366f1" />
        <ResultBox label="90% time" value={fmt(m.t90, 2)} unit="min" color="#0ea5e9" />
        <ResultBox label="2% settling" value={fmt(m.ts2, 2)} unit="min" color="#10b981" />
        <ResultBox label="Peak overshoot" value={pct(m.overshoot)} unit="−" color="#f59e0b" />
      </div>
      <InfoNote>
        FOPDT is the workhorse model for process-control design: gain Kp, time constant τ and dead time θ are read from an
        open-loop step test. A first-order process reaches 63.2% of its final value in one time constant τ.
      </InfoNote>
    </CalcCard>
  );
}

function zetaLabel(z: number): string {
  if (z < 1) return 'Underdamped second order — G(s) = Kp·ωn²/(s² + 2ζωn·s + ωn²)';
  if (z > 1) return 'Overdamped second order — two real poles';
  return 'Critically damped second order — ζ = 1';
}
// ─── TAB 2 · PID TUNER ──────────────────────────────────────────────────────
function PidTunerCalc() {
  const [method, setMethod] = useState('zn-open');
  const [Kp, setKp] = useState('2');
  const [tau, setTau] = useState('4');
  const [theta, setTheta] = useState('1');
  const [Ku, setKu] = useState('8');
  const [Pu, setPu] = useState('6');
  const [lambda, setLambda] = useState('2');
  const Kpv = parseFloat(Kp) || 0, tauv = parseFloat(tau) || 0, thv = parseFloat(theta) || 0;
  const Kuv = parseFloat(Ku) || 0, Puv = parseFloat(Pu) || 0, lv = parseFloat(lambda) || 0;
  let r: TuningResult;
  switch (method) {
    case 'zn-closed': r = znClosedLoop(Kuv, Puv); break;
    case 'cohen': r = cohenCoon(Kpv, tauv, thv); break;
    case 'imc': r = imcLambda(Kpv, tauv, thv, lv); break;
    default: r = znOpenLoop(Kpv, tauv, thv);
  }
  const compare: { name: string; Kc: number; tauI: number; tauD: number }[] = [
    { name: 'Z–N open loop', ...(znOpenLoop(Kpv, tauv, thv).valid ? znOpenLoop(Kpv, tauv, thv) : { Kc: NaN, tauI: NaN, tauD: NaN }) },
    { name: 'Z–N closed loop', ...(znClosedLoop(Kuv, Puv).valid ? znClosedLoop(Kuv, Puv) : { Kc: NaN, tauI: NaN, tauD: NaN }) },
    { name: 'Cohen–Coon', ...(cohenCoon(Kpv, tauv, thv).valid ? cohenCoon(Kpv, tauv, thv) : { Kc: NaN, tauI: NaN, tauD: NaN }) },
    { name: 'IMC (λ)', ...(imcLambda(Kpv, tauv, thv, lv).valid ? imcLambda(Kpv, tauv, thv, lv) : { Kc: NaN, tauI: NaN, tauD: NaN }) },
  ];
  const methodOpts = [
    { value: 'zn-open', label: 'Ziegler–Nichols open-loop' },
    { value: 'zn-closed', label: 'Ziegler–Nichols closed-loop' },
    { value: 'cohen', label: 'Cohen–Coon' },
    { value: 'imc', label: 'IMC / λ-tuning' },
  ];
  return (
    <CalcCard title="PID Controller Tuning" icon={SlidersHorizontal}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">
        Parallel PID: u = Kc·[e + (1/τI)∫e dt + τD·de/dt]. All four classical tuning rules, side by side.
      </p>
      <SelectRow label="Tuning method" value={method} onChange={setMethod} options={methodOpts} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        {method !== 'zn-closed' && <InputRow label="Process gain Kp" unit="−" value={Kp} onChange={setKp} />}
        {method !== 'zn-closed' && <InputRow label="Time constant τ" unit="min" value={tau} onChange={setTau} />}
        {method !== 'zn-closed' && <InputRow label="Dead time θ" unit="min" value={theta} onChange={setTheta} />}
        {method === 'zn-closed' && <InputRow label="Ultimate gain Ku" unit="−" value={Ku} onChange={setKu} />}
        {method === 'zn-closed' && <InputRow label="Ultimate period Pu" unit="min" value={Pu} onChange={setPu} />}
        {method === 'imc' && <InputRow label="Closed-loop λ" unit="min" value={lambda} onChange={setLambda} />}
      </div>
      {r.valid ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <ResultBox label="Controller gain Kc" value={fmt(r.Kc, 3)} unit="−" color="#6366f1" />
            <ResultBox label="Integral time τI" value={fmt(r.tauI, 3)} unit="min" color="#0ea5e9" />
            <ResultBox label="Derivative time τD" value={fmt(r.tauD, 3)} unit="min" color="#f59e0b" />
          </div>
          <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">{r.note}</p>
          </div>
        </>
      ) : (
        <WarnNote>{r.note}</WarnNote>
      )}
      <div className="mt-8 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">All methods compared</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                <th className="pb-2 pr-4 font-black">Method</th>
                <th className="pb-2 pr-4 font-black">Kc</th>
                <th className="pb-2 pr-4 font-black">τI</th>
                <th className="pb-2 font-black">τD</th>
              </tr>
            </thead>
            <tbody>
              {compare.map(c => (
                <tr key={c.name} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-4 font-bold text-slate-600 dark:text-slate-300">{c.name}</td>
                  <td className="py-2 pr-4 font-black tabular-nums text-indigo-600 dark:text-indigo-400">{fmt(c.Kc, 3)}</td>
                  <td className="py-2 pr-4 font-black tabular-nums">{fmt(c.tauI, 3)}</td>
                  <td className="py-2 font-black tabular-nums">{fmt(c.tauD, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <InfoNote>
        Z–N open-loop and Cohen–Coon need the FOPDT parameters from an open-loop step test. Z–N closed-loop uses the
        ultimate gain experiment. IMC/λ lets you choose the desired closed-loop speed explicitly. In practice start near
        IMC with λ ≈ τ and verify on the Closed-Loop tab.
      </InfoNote>
    </CalcCard>
  );
}
// ─── TAB 3 · CLOSED-LOOP SIMULATION ────────────────────────────────────────
function ClosedLoopCalc() {
  const [model, setModel] = useState('fopdt');
  const [Kp, setKp] = useState('2');
  const [tau, setTau] = useState('4');
  const [theta, setTheta] = useState('1');
  const [Kc, setKc] = useState('1.2');
  const [tauI, setTauI] = useState('2');
  const [tauD, setTauD] = useState('0.5');
  const [sp, setSp] = useState('1');
  const [load, setLoad] = useState('0.2');
  const [tLoad, setTLoad] = useState('15');
  const [tEnd, setTEnd] = useState('40');
  const Kpv = parseFloat(Kp) || 0, tauv = parseFloat(tau) || 0, thv = parseFloat(theta) || 0;
  const Kcv = parseFloat(Kc) || 0, tIv = parseFloat(tauI) || 0, tDv = parseFloat(tauD) || 0;
  const spv = parseFloat(sp) || 0, ldv = parseFloat(load) || 0;
  const tLv = Math.max(0, parseFloat(tLoad) || 0), tEv = Math.max(1, parseFloat(tEnd) || 10);
  const sim = simClosedLoop({
    Kp: Kpv, tau: tauv, theta: thv, model: model as 'fopdt' | 'integrating',
    Kc: Kcv, tauI: tIv, tauD: tDv, sp: spv, load: ldv, tLoad: tLv, tEnd: tEv, dt: Math.min(0.02, tEv / 800),
  });
  const yPts = sim.t.map((ti, i) => ({ x: ti, y: sim.y[i] }));
  const spPts = sim.t.map((ti, i) => ({ x: ti, y: sim.sp[i] }));
  const uPts = sim.t.map((ti, i) => ({ x: ti, y: sim.u[i] }));
  const opts = [
    { value: 'fopdt', label: 'First-order + dead time' },
    { value: 'integrating', label: 'Integrating process' },
  ];
  return (
    <CalcCard title="Closed-Loop PID Simulation" icon={Target}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">
        Servo (setpoint step) + regulatory (load disturbance at t = {fmt(tLv, 1)} min) response of the loop.
      </p>
      <SelectRow label="Process model" value={model} onChange={setModel} options={opts} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <InputRow label="Process gain Kp" unit="−" value={Kp} onChange={setKp} />
        <InputRow label="Time constant τ" unit="min" value={tau} onChange={setTau} />
        {model === 'fopdt' && <InputRow label="Dead time θ" unit="min" value={theta} onChange={setTheta} />}
        <InputRow label="Controller gain Kc" unit="−" value={Kc} onChange={setKc} />
        <InputRow label="Integral time τI" unit="min" value={tauI} onChange={setTauI} />
        <InputRow label="Derivative time τD" unit="min" value={tauD} onChange={setTauD} />
        <InputRow label="Setpoint SP" unit="−" value={sp} onChange={setSp} />
        <InputRow label="Load disturbance" unit="−" value={load} onChange={setLoad} />
        <InputRow label="Disturbance time" unit="min" value={tLoad} onChange={setTLoad} />
        <InputRow label="Horizon" unit="min" value={tEnd} onChange={setTEnd} />
      </div>
      {sim.unstable ? (
        <WarnNote>
          The loop is unstable — the output diverges. Reduce Kc, increase τI, or check that the model parameters are
          realistic. Consider verifying with the Stability / Bode tabs.
        </WarnNote>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Output y(t) vs setpoint</h4>
            <Plot2D series={[
              { id: 'y', color: '#6366f1', pts: yPts },
              { id: 'sp', color: '#10b981', pts: spPts, dashed: true },
            ]} height={300} xLabel="time (min)" yLabel="y(t)" />
          </div>
          <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Controller output u(t)</h4>
            <Plot2D series={[{ id: 'u', color: '#f59e0b', pts: uPts }]} height={180} xLabel="time (min)" yLabel="u(t)" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <ResultBox label="Overshoot" value={sim.unstable ? '∞' : pct(sim.overshoot)} unit="−" color="#f59e0b" />
        <ResultBox label="2% settling" value={sim.unstable ? '—' : fmt(sim.settle, 2)} unit="min" color="#0ea5e9" />
        <ResultBox label="IAE" value={fmt(sim.iae, 3)} unit="−" color="#6366f1" />
        <ResultBox label="Final error" value={sim.unstable ? '∞' : fmt(sim.finalErr, 4)} unit="−" color="#10b981" />
      </div>
      <InfoNote>
        Proportional-only control leaves offset: steady-state error ≈ SP/(1 + Kp·Kc). Integral action removes offset,
        derivative reduces overshoot but amplifies measurement noise. Load disturbances enter at the process input, so
        the controller must wind up the integral term to reject them.
      </InfoNote>
    </CalcCard>
  );
}
// ─── TAB 4 · STABILITY (ROUTH–HURWITZ) ─────────────────────────────────────
const RH_PRESETS = [
  { name: 'Stable 3rd order: (s+1)(s+2)(s+3)', coeffs: [1, 6, 11, 6] },
  { name: 'Unstable: s³ + 2s² + 3s + 10', coeffs: [1, 2, 3, 10] },
  { name: 'Stable 2nd order: s² + 2s + 5', coeffs: [1, 2, 5] },
  { name: 'CSTR cooling loop: s³ + 6s² + 11s + 6', coeffs: [1, 6, 11, 6] },
];

function StabilityCalc() {
  const [preset, setPreset] = useState(RH_PRESETS[0].name);
  const [a5, setA5] = useState('0');
  const [a4, setA4] = useState('0');
  const [a3, setA3] = useState('1');
  const [a2, setA2] = useState('6');
  const [a1, setA1] = useState('11');
  const [a0, setA0] = useState('6');
  const applyPreset = (name: string) => {
    setPreset(name);
    const p = RH_PRESETS.find(x => x.name === name);
    if (!p) return;
    const c = [...p.coeffs];
    while (c.length < 6) c.unshift(0);
    setA5(String(c[0])); setA4(String(c[1])); setA3(String(c[2]));
    setA2(String(c[3])); setA1(String(c[4])); setA0(String(c[5]));
  };
  const coeffs = [parseFloat(a5) || 0, parseFloat(a4) || 0, parseFloat(a3) || 0,
    parseFloat(a2) || 0, parseFloat(a1) || 0, parseFloat(a0) || 0];
  while (coeffs.length > 1 && coeffs[0] === 0) coeffs.shift();
  const r = routhHurwitz(coeffs);
  const deg = coeffs.length - 1;
  const roots = deg > 0 ? polyRoots(coeffs) : [];
  const opts = RH_PRESETS.map(p => ({ value: p.name, label: p.name }));
  return (
    <CalcCard title="Routh–Hurwitz Stability Criterion" icon={Gauge}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">
        The closed-loop characteristic polynomial 1 + Gc·Gp = 0. Stable iff every entry in the first Routh column has
        the same sign and no row degenerates.
      </p>
      <SelectRow label="Preset system" value={preset} onChange={applyPreset} options={opts} />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-2">
        <InputRow label="s⁵" unit="−" value={a5} onChange={setA5} />
        <InputRow label="s⁴" unit="−" value={a4} onChange={setA4} />
        <InputRow label="s³" unit="−" value={a3} onChange={setA3} />
        <InputRow label="s²" unit="−" value={a2} onChange={setA2} />
        <InputRow label="s¹" unit="−" value={a1} onChange={setA1} />
        <InputRow label="s⁰" unit="−" value={a0} onChange={setA0} />
      </div>
      {r.degenerate ? (
        <WarnNote>Routh array degenerates (zero in first column) — ε-perturbation applied; result approximate.</WarnNote>
      ) : null}
      <div className="mt-4 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Routh array</h4>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <tbody>
              {r.table.map((row, i) => (
                <tr key={i}>
                  <td className="pr-4 font-black text-slate-400 text-[10px] uppercase">s{String(deg - i)}</td>
                  {row.map((v, j) => (
                    <td key={j} className={`px-4 py-1.5 font-bold tabular-nums ${i === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {fmt(v, 4)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={`mt-6 flex items-center gap-3 p-4 rounded-2xl border ${r.stable
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40'
        : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/40'}`}>
        {r.stable
          ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          : <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
        <span className={`text-sm font-bold ${r.stable ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
          {r.stable ? 'STABLE — no roots in the right half-plane.'
            : `UNSTABLE — ${r.rhp} root${r.rhp === 1 ? '' : 's'} in the right half-plane.`}
        </span>
      </div>
      {roots.length > 0 && (
        <div className="mt-4 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Characteristic roots</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            {roots.map((rt, i) => (
              <StatRow key={i}
                label={`λ${i + 1}`}
                value={rt.im === 0 ? fmt(rt.re, 4) : fmt(rt.re, 4) + ' ± ' + fmt(Math.abs(rt.im), 4) + 'i'}
                accent={rt.re > 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'} />
            ))}
          </div>
        </div>
      )}
      <InfoNote>
        Routh–Hurwitz decides stability without factoring the polynomial. The number of sign changes in the first column
        equals the number of roots with positive real part. All coefficients must be positive for a stable system — a
        missing or negative coefficient is an immediate red flag.
      </InfoNote>
    </CalcCard>
  );
}
// ─── TAB 5 · ROOT LOCUS ────────────────────────────────────────────────────
const RL_PRESETS = [
  { name: 'Two real poles: K/(s+1)(s+2)', num: [1], den: [1, 3, 2] },
  { name: 'Three poles: K/(s+1)(s+2)(s+4)', num: [1], den: [1, 7, 14, 8] },
  { name: 'Two poles + zero: K(s+2)/(s+1)(s+3)', num: [1, 2], den: [1, 4, 3] },
  { name: 'Integrator + lag: K/[s(s+2)]', num: [1], den: [1, 2, 0] },
];

function RootLocusCalc() {
  const [preset, setPreset] = useState(RL_PRESETS[0].name);
  const [kMax, setKMax] = useState('30');
  const [kMark, setKMark] = useState('4');
  const p = RL_PRESETS.find(x => x.name === preset) ?? RL_PRESETS[0];
  const km = Math.max(0.1, parseFloat(kMax) || 10);
  const Ks: number[] = [];
  const nK = 60;
  for (let i = 0; i <= nK; i++) Ks.push(km * Math.pow(0.001 / km, i / nK));

  const locus = rootLocus(p.num, p.den, Ks);
  const allPts: { x: number; y: number; stable: boolean }[] = [];
  for (let i = 0; i < locus.length; i++) {
    for (const r of locus[i]) {
      allPts.push({ x: r.re, y: r.im, stable: r.re < 0 });
    }
  }
  const markK = Math.min(Math.max(parseFloat(kMark) || 1, 0.001), km);
  const markRoots = rootLocus(p.num, p.den, [markK])[0];
  const opts = RL_PRESETS.map(x => ({ value: x.name, label: x.name }));
  const stableSeries = { id: 'stable', color: '#10b981', pts: allPts.filter(q => q.stable).map(q => ({ x: q.x, y: q.y })) };
  const unstableSeries = { id: 'unstable', color: '#f43f5e', pts: allPts.filter(q => !q.stable).map(q => ({ x: q.x, y: q.y })) };
  const markSeries = { id: 'mark', color: '#6366f1', width: 3, pts: markRoots.map(r => ({ x: r.re, y: r.im })) };
  return (
    <CalcCard title="Root Locus — 1 + K·G(s) = 0" icon={GitBranch}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">
        Closed-loop poles as the loop gain K sweeps from 0 to {fmt(km, 1)}. Green = stable half-plane (Re &lt; 0),
        red = unstable. The locus crosses the imaginary axis at the ultimate gain Ku.
      </p>
      <SelectRow label="Open-loop system G(s)" value={preset} onChange={setPreset} options={opts} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <InputRow label="Max gain K" unit="−" value={kMax} onChange={setKMax} />
        <InputRow label="Marker gain K" unit="−" value={kMark} onChange={setKMark} />
      </div>
      <div className="mt-4 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <Plot2D series={[stableSeries, unstableSeries, markSeries]} height={380}
          xLabel="Re(s)" yLabel="Im(s)" zeroLine />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {markRoots.map((r, i) => (
          <ResultBox key={i}
            label={`Pole at K = ${fmt(markK, 2)}`}
            value={r.im === 0 ? fmt(r.re, 3) : fmt(r.re, 3) + ' ± ' + fmt(Math.abs(r.im), 3) + 'i'}
            unit="−"
            color={r.re < 0 ? '#10b981' : '#f43f5e'} />
        ))}
      </div>
      <InfoNote>
        A second-order system K/((s+1)(s+2)) is stable for all K &gt; 0, but a third-order or integrating system
        becomes unstable once K exceeds the value where a branch crosses into the right half-plane — that K is the
        ultimate gain used by Ziegler–Nichols closed-loop tuning.
      </InfoNote>
    </CalcCard>
  );
}
// ─── TAB 6 · BODE PLOTS & STABILITY MARGINS ────────────────────────────────
const BODE_PRESETS: { name: string; factors: BodeFactor[] }[] = [
  {
    name: 'FOPDT: 2·e^(−0.5s)/(s + 1)',
    factors: [{ kind: 'gain', value: 2 }, { kind: 'pole1', value: 1 }],
  },
  {
    name: 'Two lags: 2.5/(s+1)(s+2)',
    factors: [{ kind: 'gain', value: 2.5 }, { kind: 'pole1', value: 1 }, { kind: 'pole1', value: 0.5 }],
  },
  {
    name: 'Integrator + lag: 1/[s(s+1)]',
    factors: [{ kind: 'gain', value: 1 }, { kind: 'pole0', value: 1 }, { kind: 'pole1', value: 1 }],
  },
  {
    name: 'Two lags + zero: 2(s+1)/[(s+2)(s+5)]',
    factors: [{ kind: 'gain', value: 0.2 }, { kind: 'zero1', value: 1 }, { kind: 'pole1', value: 0.5 }, { kind: 'pole1', value: 0.2 }],
  },
];

function BodeCalc() {
  const [preset, setPreset] = useState(BODE_PRESETS[0].name);
  const [theta, setTheta] = useState('0');
  const p = BODE_PRESETS.find(x => x.name === preset) ?? BODE_PRESETS[0];
  const thv = Math.max(0, parseFloat(theta) || 0);
  const b = bodeCalc(p.factors, 0.01, 100, 130, thv);
  const m = bodeMargins(p.factors, 0.001, 1000, thv);
  const stable = bodeStable(m);
  const magPts = b.w.map((wi, i) => ({ x: wi, y: b.magDb[i] }));
  const phasePts = b.w.map((wi, i) => ({ x: wi, y: b.phase[i] }));
  const zeroMag = b.w.map(wi => ({ x: wi, y: 0 }));
  const opts = BODE_PRESETS.map(x => ({ value: x.name, label: x.name }));
  return (
    <CalcCard title="Bode Plots & Stability Margins" icon={Activity}>
      <p className="text-sm text-slate-500 mb-8 font-medium italic">
        Gain crossover ωgc: |G| = 1 (0 dB). Phase crossover ωpc: phase = −180°. PM = 180° + φ(ωgc), GM = −|G|(ωpc) dB.
      </p>
      <SelectRow label="Open-loop system" value={preset} onChange={setPreset} options={opts} />
      <InputRow label="Dead time θ" unit="min" value={theta} onChange={setTheta} />
      <div className="mt-4 space-y-4">
        <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Magnitude (dB)</h4>
          <Plot2D series={[
            { id: 'mag', color: '#6366f1', pts: magPts },
            { id: 'zero', color: '#f43f5e', pts: zeroMag, dashed: true },
          ]} xLog height={230} xLabel="ω (rad/min)" yLabel="|G| (dB)" />
        </div>
        <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Phase (deg)</h4>
          <Plot2D series={[
            { id: 'ph', color: '#0ea5e9', pts: phasePts },
            { id: 'm180', color: '#f43f5e', pts: b.w.map(wi => ({ x: wi, y: -180 })), dashed: true },
          ]} xLog height={230} xLabel="ω (rad/min)" yLabel="φ (deg)" />
        </div>
      </div>
      <div className={`mt-6 flex items-center gap-3 p-4 rounded-2xl border ${stable
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40'
        : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/40'}`}>
        {stable
          ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          : <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
        <span className={`text-sm font-bold ${stable ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
          {stable ? 'Stable — positive phase & gain margins.' : 'Marginally stable or unstable — negative phase/gain margin.'}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <ResultBox label="Gain crossover ωgc" value={fmt(m.wgc, 3)} unit="rad/min" color="#0ea5e9" />
        <ResultBox label="Phase margin PM" value={m.pmDeg === null ? '∞' : fmt(m.pmDeg, 1)} unit="deg" color="#10b981" />
        <ResultBox label="Phase crossover ωpc" value={fmt(m.wpc, 3)} unit="rad/min" color="#f59e0b" />
        <ResultBox label="Gain margin GM" value={m.gmDb === null ? '∞' : fmt(m.gmDb, 1)} unit="dB" color="#6366f1" />
      </div>
      <InfoNote>
        Rule of thumb: aim for 30–60° phase margin and 6–20 dB gain margin for good robustness. Dead time adds −θ·ω
        phase lag that erodes the phase margin — this is why θ/τ ratio limits how aggressively you can tune.
        Phase/gain-margin criteria assume an open-loop-stable plant; for open-loop-unstable plants use the full
        Nyquist criterion (encirclements), not just these two margins.
      </InfoNote>
    </CalcCard>
  );
}
// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'models', label: 'Process Models', icon: Timer },
  { id: 'tuner', label: 'PID Tuner', icon: SlidersHorizontal },
  { id: 'loop', label: 'Closed Loop', icon: Target },
  { id: 'stability', label: 'Stability', icon: Gauge },
  { id: 'locus', label: 'Root Locus', icon: GitBranch },
  { id: 'bode', label: 'Bode & Margins', icon: Activity },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ProcessControlModule() {
  const [tab, setTab] = useState<TabId>('models');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Process Control</h2>
            <p className="text-sm text-slate-500 font-semibold">Dynamic models · PID tuning · closed-loop simulation · stability analysis</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border ${on
                ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/25 scale-[1.02]'
                : 'bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 hover:text-rose-500'}`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'models' && <ProcessModelsCalc />}
      {tab === 'tuner' && <PidTunerCalc />}
      {tab === 'loop' && <ClosedLoopCalc />}
      {tab === 'stability' && <StabilityCalc />}
      {tab === 'locus' && <RootLocusCalc />}
      {tab === 'bode' && <BodeCalc />}
    </div>
  );
}
