import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Workflow, Boxes, RefreshCw, Settings2, BookOpen, Info,
  CheckCircle2, AlertTriangle, ArrowRightLeft, Play, Recycle, Split, Combine
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── Formatting & numerics ───────────────────────────────────────────────────
function fmt(v: number | null | undefined, digits = 3, suffix = ''): string {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return v.toFixed(digits) + suffix;
}
function bisect(f: (x: number) => number, lo: number, hi: number, tol = 1e-10): number | null {
  let a = lo, b = hi;
  let fa = f(a), fb = f(b);
  if (!isFinite(fa) || !isFinite(fb) || fa * fb > 0) return null;
  for (let i = 0; i < 400; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (Math.abs(fm) < tol || (b - a) / 2 < 1e-11) return m;
    if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

// ─── Generic 2-D SVG plot (linear or log-x) ─────────────────────────────────
interface Pt { x: number; y: number; }
interface Series { id: string; color: string; pts: Pt[]; dashed?: boolean; width?: number; }

function Plot2D({ series, xLog = false, height = 300, xLabel = 'x', yLabel = 'y',
  xMin, xMax, yMin, yMax, zeroLine = true }: {
  series: Series[]; xLog?: boolean; height?: number;
  xLabel?: string; yLabel?: string;
  xMin?: number; xMax?: number; yMin?: number; yMax?: number; zeroLine?: boolean;
}) {
  const W = 560, H = height, PL = 54, PR = 16, PT = 12, PB = 34;
  const toX = (x: number) => xLog ? Math.log10(x) : x;
  const toY = (y: number) => (Number.isFinite(y) ? y : 0);
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
            <text x={PL - 6} y={yy + 3} textAnchor="end" className="fill-slate-400 text-[9px] font-semibold">{disp(t)}</text>
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

// ─── Small UI helpers ────────────────────────────────────────────────────────
function SelectRow({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 group">
      <label className="md:w-64 text-sm font-bold text-surface-500 dark:text-surface-400 group-focus-within:text-accent-600 transition-colors">
        {label}
        {hint && <span className="block text-[10px] font-semibold text-surface-400 mt-0.5">{hint}</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-grow px-5 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-bold text-sm outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function StatRow({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="py-2.5 flex items-baseline justify-between gap-4 border-b border-surface-100 dark:border-surface-800 last:border-0">
      <span className="text-xs font-bold text-surface-500 dark:text-surface-400">
        {label}
        {sub && <span className="block text-[10px] font-semibold text-surface-400 mt-0.5">{sub}</span>}
      </span>
      <span className={`text-sm font-black tabular-nums ${accent ?? 'text-surface-800 dark:text-surface-100'}`}>{value}</span>
    </div>
  );
}

function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
      <Info className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-surface-500 dark:text-surface-400 font-medium leading-relaxed">{children}</p>
    </div>
  );
}

function WarnNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent-200 dark:border-accent-800/40 bg-accent-50 dark:bg-accent-900/15 p-4">
      <AlertTriangle className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-accent-700 dark:text-accent-300 font-semibold leading-relaxed">{children}</p>
    </div>
  );
}
// ─── Process flowsheet solver: sequential modular + recycle convergence ─────
// Streams carry molar flows [A, B, C] in mol/s. Units are evaluated in order;
// a torn recycle stream is iterated with Wegstein acceleration.

interface Stream { a: number; b: number; c: number; }

type Unit =
  | { kind: 'feed'; outs: number[]; values: Stream }
  | { kind: 'mixer'; ins: number[]; outs: number[] }
  | { kind: 'reactor'; ins: number[]; outs: number[]; conv: number }   // A + B -> C, conversion of A
  | { kind: 'separator'; ins: number[]; outs: number[]; splits: number[] } // fraction of each comp to outs[0]
  | { kind: 'splitter'; ins: number[]; outs: number[]; frac: number }  // fraction to outs[0]
  | { kind: 'flash'; ins: number[]; outs: number[]; K: number[]; vf: number }; // outs[0]=vapor, outs[1]=liquid

interface FlowsheetResult {
  streams: Stream[];
  converged: boolean;
  iterations: number;
  history: number[];
  err?: string;
}

const ZERO: Stream = { a: 0, b: 0, c: 0 };

function solveFlowsheet(units: Unit[], tear: number, opts: { tol?: number; maxIter?: number; wegstein?: boolean } = {}): FlowsheetResult {
  const tol = opts.tol ?? 1e-10;
  const maxIter = opts.maxIter ?? 300;
  const wegstein = opts.wegstein ?? true;
  const nStreams = units.flatMap(u => [...('ins' in u ? u.ins : []), ...u.outs]).reduce((m, x) => Math.max(m, x + 1), 0);
  const streams: Stream[] = Array.from({ length: nStreams }, () => ({ ...ZERO }));
  const sum = (idx: number[]): Stream => {
    const s: Stream = { ...ZERO };
    for (const i of idx) { s.a += streams[i].a; s.b += streams[i].b; s.c += streams[i].c; }
    return s;
  };
  const setOuts = (outs: number[], s: Stream) => { for (const o of outs) streams[o] = { ...s }; };
  const evalPass = () => {
    for (const u of units) {
      if (u.kind === 'feed') { setOuts(u.outs, u.values); }
      else if (u.kind === 'mixer') { setOuts(u.outs, sum(u.ins)); }
      else if (u.kind === 'reactor') {
        const s = sum(u.ins);
        const xi = s.a * u.conv;
        setOuts(u.outs, { a: s.a - xi, b: s.b - xi, c: s.c + xi });
      } else if (u.kind === 'separator') {
        const s = sum(u.ins);
        const o0: Stream = { a: s.a * u.splits[0], b: s.b * u.splits[1], c: s.c * u.splits[2] };
        const o1: Stream = { a: s.a * (1 - u.splits[0]), b: s.b * (1 - u.splits[1]), c: s.c * (1 - u.splits[2]) };
        streams[u.outs[0]] = o0; streams[u.outs[1]] = o1;
      } else if (u.kind === 'splitter') {
        const s = sum(u.ins);
        streams[u.outs[0]] = { a: s.a * u.frac, b: s.b * u.frac, c: s.c * u.frac };
        streams[u.outs[1]] = { a: s.a * (1 - u.frac), b: s.b * (1 - u.frac), c: s.c * (1 - u.frac) };
      } else if (u.kind === 'flash') {
        const s = sum(u.ins);
        const zt = s.a + s.b + s.c;
        if (zt <= 0) { setOuts(u.outs, { ...ZERO }); continue; }
        let vf = u.vf;
        if (vf < 0) {
          const f0 = s.a * (u.K[0] - 1) + s.b * (u.K[1] - 1) + s.c * (u.K[2] - 1);
          const f1 = s.a * (u.K[0] - 1) / u.K[0] + s.b * (u.K[1] - 1) / u.K[1] + s.c * (u.K[2] - 1) / u.K[2];
          if (f0 <= 0) vf = 0;                    // at/below bubble -> all liquid
          else if (f1 >= 0) vf = 1;               // at/above dew -> all vapor
          else {
            const psi = bisect(
              p => s.a * (u.K[0] - 1) / (1 + p * (u.K[0] - 1)) + s.b * (u.K[1] - 1) / (1 + p * (u.K[1] - 1)) + s.c * (u.K[2] - 1) / (1 + p * (u.K[2] - 1)),
              0, 1);
            vf = psi ?? 0;
          }
        }
        const vfc = Math.min(Math.max(vf, 0), 1);
        const liqX = (zi: number, Ki: number) => zi / (1 + vfc * (Ki - 1));
        const vapor: Stream = { a: vfc * u.K[0] * liqX(s.a, u.K[0]), b: vfc * u.K[1] * liqX(s.b, u.K[1]), c: vfc * u.K[2] * liqX(s.c, u.K[2]) };
        const liquid: Stream = { a: (1 - vfc) * liqX(s.a, u.K[0]), b: (1 - vfc) * liqX(s.b, u.K[1]), c: (1 - vfc) * liqX(s.c, u.K[2]) };
        streams[u.outs[0]] = vapor; streams[u.outs[1]] = liquid;
      }
    }
  };
  const comps = (s: Stream): number[] => [s.a, s.b, s.c];
  const history: number[] = [];
  let prevGuess: number[] | null = null;
  let prevG: number[] | null = null;
  if (tear < 0) {
    evalPass();
    return { streams, converged: true, iterations: 1, history: [] };
  }
  for (let it = 0; it < maxIter; it++) {
    const guess = comps(streams[tear]);
    evalPass();
    const g = comps(streams[tear]);
    const delta = Math.max(Math.abs(g[0] - guess[0]), Math.abs(g[1] - guess[1]), Math.abs(g[2] - guess[2]));
    history.push(delta);
    if (delta < tol) return { streams, converged: true, iterations: it + 1, history };
    if (wegstein) {
      for (let k = 0; k < 3; k++) {
        let slope = 1;
        if (prevGuess && prevG) {
          const dx = guess[k] - prevGuess[k];
          const dg = g[k] - prevG[k];
          if (Math.abs(dx) > 1e-15) slope = dg / dx;
        }
        const q = Math.abs(1 - slope) > 1e-12 ? 1 / (1 - slope) : 1;
        const qc = Math.min(Math.max(q, -50), 50);
        const val = guess[k] + qc * (g[k] - guess[k]);
        const ts = streams[tear];
        if (k === 0) ts.a = val; else if (k === 1) ts.b = val; else ts.c = val;
      }
    } else {
      streams[tear] = { a: g[0], b: g[1], c: g[2] };
    }
    prevGuess = guess;
    prevG = g;
  }
  return { streams, converged: false, iterations: maxIter, history };
}

// ─── Pre-built flowsheet templates ──────────────────────────────────────────
interface FlowTemplate {
  id: string;
  name: string;
  desc: string;
  labels: string[];
  tear: number;
  make: (p: Record<string, number>) => Unit[];
  keys: { key: string; label: string; min: number; max: number; step: number; def: number }[];
}

// R1: feed -> mixer -> reactor -> separator -> product / recycle -> splitter -> purge + recycle
const REACTOR_RECYCLE: FlowTemplate = {
  id: 'recycle-reactor',
  name: 'Recycle Reactor with Purge',
  desc: 'A + B → C in a CSTR, product recovered, unconverted A/B recycled with purge to prevent build-up.',
  labels: ['Feed', 'Mixer out', 'Reactor out', 'Product', 'Recycle raw', 'Purge', 'Recycle back'],
  tear: 6,
  keys: [
    { key: 'FA', label: 'Feed A', min: 1, max: 500, step: 1, def: 100 },
    { key: 'FB', label: 'Feed B', min: 1, max: 500, step: 1, def: 100 },
    { key: 'conv', label: 'Conversion of A', min: 0.05, max: 0.95, step: 0.05, def: 0.6 },
    { key: 'recycle', label: 'Recycle fraction', min: 0.5, max: 0.98, step: 0.01, def: 0.9 },
  ],
  make: p => [
    { kind: 'feed', outs: [0], values: { a: p.FA, b: p.FB, c: 0 } },
    { kind: 'mixer', ins: [0, 6], outs: [1] },
    { kind: 'reactor', ins: [1], outs: [2], conv: p.conv },
    { kind: 'separator', ins: [2], outs: [3, 4], splits: [0, 0, 1] },   // all C to product
    { kind: 'splitter', ins: [4], outs: [6, 5], frac: p.recycle },
  ],
};

// R2: feed -> mixer -> flash (vapor out, liquid recycled) -> splitter
const FLASH_RECYCLE: FlowTemplate = {
  id: 'recycle-flash',
  name: 'Flash Separation with Recycle',
  desc: 'A light / B middle / C heavy feed flashed; liquid bottoms recycled to recover light components.',
  labels: ['Feed', 'Mixer out', 'Vapor product', 'Liquid', 'Recycle', 'Purge'],
  tear: 4,
  keys: [
    { key: 'FA', label: 'Feed A (light)', min: 1, max: 500, step: 1, def: 60 },
    { key: 'FB', label: 'Feed B (mid)', min: 1, max: 500, step: 1, def: 30 },
    { key: 'FC', label: 'Feed C (heavy)', min: 1, max: 500, step: 1, def: 10 },
    { key: 'recycle', label: 'Recycle fraction', min: 0.5, max: 0.98, step: 0.01, def: 0.9 },
  ],
  make: p => [
    { kind: 'feed', outs: [0], values: { a: p.FA, b: p.FB, c: p.FC } },
    { kind: 'mixer', ins: [0, 4], outs: [1] },
    { kind: 'flash', ins: [1], outs: [2, 3], K: [2.5, 1.0, 0.4], vf: -1 },
    { kind: 'splitter', ins: [3], outs: [4, 5], frac: p.recycle },
  ],
};

// R3: two CSTRs in series, no recycle
const REACTOR_TRAIN: FlowTemplate = {
  id: 'reactor-train',
  name: 'CSTR Train (no recycle)',
  desc: 'Two CSTRs in series, each converting a share of A. No recycle — solved in a single pass.',
  labels: ['Feed', 'CSTR-1 out', 'CSTR-2 out (Product)'],
  tear: -1,
  keys: [
    { key: 'FA', label: 'Feed A', min: 1, max: 500, step: 1, def: 100 },
    { key: 'FB', label: 'Feed B', min: 1, max: 500, step: 1, def: 120 },
    { key: 'conv1', label: 'CSTR-1 conversion', min: 0.05, max: 0.9, step: 0.05, def: 0.5 },
    { key: 'conv2', label: 'CSTR-2 conversion', min: 0.05, max: 0.9, step: 0.05, def: 0.5 },
  ],
  make: p => [
    { kind: 'feed', outs: [0], values: { a: p.FA, b: p.FB, c: 0 } },
    { kind: 'reactor', ins: [0], outs: [1], conv: p.conv1 },
    { kind: 'reactor', ins: [1], outs: [2], conv: p.conv2 },
  ],
};
// ─── Unit-operation calculators (standalone) ────────────────────────────────
interface RRResult { vf: number; x: number[]; y: number[]; phase: 'all-liquid' | 'two-phase' | 'all-vapor'; }

// Rachford–Rice isothermal flash: Σ zᵢ(Kᵢ−1)/(1+ψ(Kᵢ−1)) = 0
function rrFlash(zi: number[], K: number[]): RRResult {
  const zt = zi.reduce((s, v) => s + v, 0);
  if (!(zt > 0) || K.some(k => !isFinite(k) || k <= 0)) {
    return { vf: 0, x: zi.slice(), y: zi.slice(), phase: 'all-liquid' };
  }
  const zb = zi.map(z => z / zt);
  const at0 = zb.reduce((s, z, i) => s + K[i] * z, 0);        // Σ Kᵢzᵢ → bubble check
  if (at0 <= 1 + 1e-9) return { vf: 0, x: zb.slice(), y: zb.slice(), phase: 'all-liquid' };
  const at1 = zb.reduce((s, z, i) => s + z / K[i], 0);        // Σ zᵢ/Kᵢ → dew check
  if (at1 <= 1 + 1e-9) return { vf: 1, x: zb.slice(), y: zb.slice(), phase: 'all-vapor' };
  const f = (v: number) => zb.reduce((s, z, i) => s + z * (K[i] - 1) / (1 + v * (K[i] - 1)), 0);
  const df = (v: number) => zb.reduce((s, z, i) => s - z * (K[i] - 1) * (K[i] - 1) / ((1 + v * (K[i] - 1)) * (1 + v * (K[i] - 1))), 0);
  let vf = 0.5;
  for (let it = 0; it < 120; it++) {
    const fv = f(vf);
    const d = df(vf);
    if (!isFinite(d) || Math.abs(d) < 1e-14) break;
    const nv = vf - fv / d;
    if (!isFinite(nv)) break;
    vf = Math.min(Math.max(nv, 1e-9), 1 - 1e-9);
    if (Math.abs(fv) < 1e-13) break;
  }
  const x = zb.map((z, i) => z / (1 + vf * (K[i] - 1)));
  const y = x.map((xi, i) => K[i] * xi);
  return { vf, x, y, phase: 'two-phase' };
}

// Reactor A + B → C (1:1 stoichiometry), first order in A
interface ReactorIn { type: 'cstr' | 'pfr'; FA0: number; FB0: number; k: number; tau: number; }
interface ReactorOut { X: number; out: Stream; note: string; valid: boolean; }

function reactorCalc(o: ReactorIn): ReactorOut {
  const bad = (m: string): ReactorOut => ({ X: 0, out: { a: o.FA0, b: o.FB0, c: 0 }, note: m, valid: false });
  if (!(o.FA0 > 0) || !(o.FB0 > 0)) return bad('Feed flows F_A0 and F_B0 must be positive.');
  if (!(o.k > 0) || !(o.tau > 0)) return bad('Rate constant k and space time τ must be positive.');
  const da = o.k * o.tau;
  const X = o.type === 'pfr' ? 1 - Math.exp(-da) : da / (1 + da);
  const x = Math.min(Math.max(X, 0), 0.999);
  return {
    X: x,
    out: { a: o.FA0 * (1 - x), b: o.FB0 - o.FA0 * x, c: o.FA0 * x },
    note: o.type === 'pfr'
      ? 'PFR design: τ = ∫₀^X dX/(k·C_A0·(1−X)) ⇒ X = 1 − e^(−kτ) for first order, constant density.'
      : 'CSTR design: V/F_A0 = X/(k·C_A0·(1−X)) ⇒ X = kτ/(1+kτ). Valid for liquid phase, constant density.',
    valid: o.FB0 >= o.FA0 * x - 1e-9,
  };
}

// Splitter / separator: fraction of each component to the top outlet
function separatorCalc(feed: Stream, splits: number[]): { top: Stream; bottom: Stream } {
  const s0 = splits[0] ?? 0, s1 = splits[1] ?? 0, s2 = splits[2] ?? 0;
  return {
    top: { a: feed.a * s0, b: feed.b * s1, c: feed.c * s2 },
    bottom: { a: feed.a * (1 - s0), b: feed.b * (1 - s1), c: feed.c * (1 - s2) },
  };
}

function mixerCalc(s1: Stream, s2: Stream): Stream {
  return { a: s1.a + s2.a, b: s1.b + s2.b, c: s1.c + s2.c };
}

// Feed vs product boundary balance for a solved flowsheet
function boundaryStreams(units: Unit[], streams: Stream[]): { feeds: Stream; products: Stream } {
  const used = new Set<number>();
  for (const u of units) for (const i of ('ins' in u ? u.ins : [])) used.add(i);
  const feeds: Stream = { ...ZERO };
  const products: Stream = { ...ZERO };
  for (const u of units) {
    if (u.kind === 'feed') {
      feeds.a += u.values.a; feeds.b += u.values.b; feeds.c += u.values.c;
    }
    for (const o of u.outs) {
      if (!used.has(o)) {
        products.a += streams[o].a; products.b += streams[o].b; products.c += streams[o].c;
      }
    }
  }
  return { feeds, products };
}
// ─── Convergence lab: direct substitution vs Wegstein acceleration ─────────
function convergeCompare(tpl: FlowTemplate, p: Record<string, number>, tol = 1e-10, maxIter = 400): {
  direct: number[]; wegstein: number[];
  dIter: number; wIter: number; dConv: boolean; wConv: boolean;
} {
  const d = solveFlowsheet(tpl.make(p), tpl.tear, { tol, maxIter, wegstein: false });
  const w = solveFlowsheet(tpl.make(p), tpl.tear, { tol, maxIter, wegstein: true });
  return {
    direct: d.history, wegstein: w.history,
    dIter: d.iterations, wIter: w.iterations,
    dConv: d.converged, wConv: w.converged,
  };
}

// Estimate the contraction factor (spectral radius) of the iteration map from
// the ratio of successive residuals at the tail of the history.
function contractionFactor(hist: number[]): number | null {
  if (hist.length < 3) return null;
  const tail = hist.slice(-6);
  let r = 0;
  for (let i = 1; i < tail.length; i++) {
    const ri = tail[i] / tail[i - 1];
    if (isFinite(ri) && ri > 0 && ri < 1) r = Math.max(r, ri);
  }
  return r > 0 ? r : null;
}
// ─── Cubic equations of state (PR / SRK) ────────────────────────────────────
const R_BAR = 83.14472; // cm³·bar·mol⁻¹·K⁻¹

interface PureComp { name: string; Tc: number; Pc: number; omega: number; }

const THERMO_COMPS: PureComp[] = [
  { name: 'Methane', Tc: 190.6, Pc: 46.0, omega: 0.011 },
  { name: 'Ethane', Tc: 305.4, Pc: 48.8, omega: 0.099 },
  { name: 'Propane', Tc: 369.8, Pc: 42.5, omega: 0.152 },
  { name: 'n-Butane', Tc: 425.1, Pc: 37.96, omega: 0.200 },
  { name: 'Carbon dioxide', Tc: 304.1, Pc: 73.8, omega: 0.239 },
  { name: 'Nitrogen', Tc: 126.2, Pc: 33.98, omega: 0.037 },
  { name: 'Water', Tc: 647.1, Pc: 220.6, omega: 0.345 },
];

// Real roots of z³ + a2·z² + a1·z + a0 = 0 (Newton from multiple seeds)
function cubicRealRoots(a2: number, a1: number, a0: number): number[] {
  const seeds = [1.0, 0.35, 0.08, 0.03, 1.8, 8.0];
  const out: number[] = [];
  for (const s of seeds) {
    let z = s;
    for (let i = 0; i < 300; i++) {
      const f = ((z + a2) * z + a1) * z + a0;
      const df = (3 * z + 2 * a2) * z + a1;
      if (Math.abs(df) < 1e-14) break;
      const nz = z - f / df;
      if (Math.abs(nz - z) < 1e-11) { z = nz; break; }
      z = nz;
    }
    if (isFinite(z) && z > 1e-6 && z < 30) {
      const r = Number(z.toFixed(8));
      if (!out.some(v => Math.abs(v - r) < 1e-6)) out.push(r);
    }
  }
  return out.sort((x, y) => x - y);
}

function cubicEosZ(T: number, P: number, c: PureComp, eos: 'PR' | 'SRK'): { Zv: number | null; Zl: number | null; valid: boolean; note: string } {
  if (!(T > 0) || !(P > 0)) return { Zv: null, Zl: null, valid: false, note: 'Temperature and pressure must be positive.' };
  if (T > 4 * c.Tc || P > 2000) return { Zv: null, Zl: null, valid: false, note: 'State outside the practical cubic-EOS range (T ≤ 4·T_c, P ≤ 2000 bar).' };
  const Tr = T / c.Tc;
  const m = eos === 'PR'
    ? 0.37464 + 1.54226 * c.omega - 0.26992 * c.omega * c.omega
    : 0.480 + 1.574 * c.omega - 0.176 * c.omega * c.omega;
  const alpha = Math.pow(1 + m * (1 - Math.sqrt(Tr)), 2);
  let A: number, B: number, a2: number, a1: number, a0: number;
  if (eos === 'PR') {
    const ac = 0.45724 * R_BAR * R_BAR * c.Tc * c.Tc / c.Pc;
    const b = 0.07780 * R_BAR * c.Tc / c.Pc;
    A = ac * alpha * P / (R_BAR * R_BAR * T * T);
    B = b * P / (R_BAR * T);
    a2 = -(1 - B);
    a1 = A - 2 * B - 3 * B * B;
    a0 = -(A * B - B * B - B * B * B);
  } else {
    const ac = 0.42748 * R_BAR * R_BAR * c.Tc * c.Tc / c.Pc;
    const b = 0.08664 * R_BAR * c.Tc / c.Pc;
    A = ac * alpha * P / (R_BAR * R_BAR * T * T);
    B = b * P / (R_BAR * T);
    a2 = -1;
    a1 = A - B - B * B;
    a0 = -A * B;
  }
  const roots = cubicRealRoots(a2, a1, a0);
  const single = roots.length === 1 ? roots[0] : null;
  const Zv = roots.length > 1 ? roots[roots.length - 1] : (single !== null && single >= 0.3 ? single : null);
  const Zl = roots.length > 1 ? roots[0] : (single !== null && single < 0.3 ? single : null);
  if (Zv === null && Zl === null) return { Zv: null, Zl: null, valid: false, note: 'No physical root found at this state.' };
  const state = roots.length > 1
    ? 'Two-phase region — vapor root (largest Z) and liquid root (smallest Z) coexist.'
    : (Zl !== null ? 'Single liquid root — compressed liquid.' : 'Single root — vapor-like / supercritical state.');
  return {
    Zv, Zl, valid: true,
    note: `${eos === 'PR' ? 'Peng–Robinson' : 'Soave–Redlich–Kwong'} at T_r = ${fmt(Tr, 2)}, P_r = ${fmt(P / c.Pc, 2)}. ${state}`,
  };
}

function fugacityCoeff(T: number, P: number, Z: number, c: PureComp, eos: 'PR' | 'SRK'): number {
  const Tr = T / c.Tc;
  const m = eos === 'PR'
    ? 0.37464 + 1.54226 * c.omega - 0.26992 * c.omega * c.omega
    : 0.480 + 1.574 * c.omega - 0.176 * c.omega * c.omega;
  const alpha = Math.pow(1 + m * (1 - Math.sqrt(Tr)), 2);
  const ac = (eos === 'PR' ? 0.45724 : 0.42748) * R_BAR * R_BAR * c.Tc * c.Tc / c.Pc;
  const b = (eos === 'PR' ? 0.07780 : 0.08664) * R_BAR * c.Tc / c.Pc;
  const A = ac * alpha * P / (R_BAR * R_BAR * T * T);
  const B = b * P / (R_BAR * T);
  if (!(Z - B > 0)) return NaN;
  if (eos === 'PR') {
    const rt2 = Math.sqrt(2);
    const inner = (Z + (1 + rt2) * B) / (Z + (1 - rt2) * B);
    if (!(inner > 0)) return NaN;
    return Math.exp(Z - 1 - Math.log(Z - B) - (A / (2 * rt2 * B)) * Math.log(inner));
  }
  if (!(1 + B / Z > 0)) return NaN;
  return Math.exp(Z - 1 - Math.log(Z - B) - (A / B) * Math.log(1 + B / Z));
}

// Z vs P sweep for the compressibility chart
function zSweep(c: PureComp, T: number, eos: 'PR' | 'SRK', Pmax: number) {
  const P: number[] = [], Zv: (number | null)[] = [], Zl: (number | null)[] = [];
  const n = 64;
  for (let i = 0; i <= n; i++) {
    const p = Math.max(0.01, Pmax * i / n);
    const r = cubicEosZ(T, p, c, eos);
    P.push(p); Zv.push(r.Zv); Zl.push(r.Zl);
  }
  return { P, Zv, Zl };
}

// ─── Antoine vapor-pressure library + binary K-value flash ─────────────────
interface AntoineComp { name: string; A: number; B: number; C: number; }

const ANTOINE_COMPS: AntoineComp[] = [
  { name: 'Water', A: 8.07131, B: 1730.63, C: 233.426 },
  { name: 'Benzene', A: 6.90565, B: 1211.033, C: 220.790 },
  { name: 'Toluene', A: 6.95464, B: 1344.8, C: 219.48 },
  { name: 'Ethanol', A: 8.20417, B: 1642.89, C: 230.3 },
  { name: 'Methanol', A: 8.08097, B: 1582.27, C: 239.7 },
  { name: 'Acetone', A: 7.11714, B: 1210.595, C: 229.664 },
];

// Psat in mmHg, T in °C
function psatAntoine(c: AntoineComp, T: number): number {
  return Math.pow(10, c.A - c.B / (T + c.C));
}

// Raoult's law K-values; bubble/dew temperatures via bisection on T (°C)
function antoineK(c1: AntoineComp, c2: AntoineComp, T: number, Pmmhg: number): [number, number] {
  return [psatAntoine(c1, T) / Pmmhg, psatAntoine(c2, T) / Pmmhg];
}

function bubbleTAntoine(P: number, z1: number, c1: AntoineComp, c2: AntoineComp): number | null {
  return bisect(T => (psatAntoine(c1, T) / P) * z1 + (psatAntoine(c2, T) / P) * (1 - z1) - 1, -40, 320);
}

function dewTAntoine(P: number, z1: number, c1: AntoineComp, c2: AntoineComp): number | null {
  return bisect(T => z1 / (psatAntoine(c1, T) / P) + (1 - z1) / (psatAntoine(c2, T) / P) - 1, -40, 320);
}
// ─── Simulator guide (static best-practice content) ─────────────────────────
const GUIDE_STEPS = [
  { n: '01', t: 'Define components & property package', d: 'Enter every chemical present in the flowsheet. Choose the thermodynamics first — it drives every unit operation. For hydrocarbons, Peng–Robinson; for non-ideal liquid mixtures, NRTL or UNIQUAC with binary parameters.' },
  { n: '02', t: 'Draw the flowsheet', d: 'Place feeds, mixers, reactors, separators and product streams. Number every stream and give each unit a unique name — your future self will thank you.' },
  { n: '03', t: 'Specify degrees of freedom', d: 'Each unit needs exactly the right number of specifications: feed composition / temperature / pressure, reactor conversion or kinetics, column stages / pressure / reflux.' },
  { n: '04', t: 'Solve (sequential modular)', d: 'Units are evaluated in flowsheet order. Recycles are torn and iterated until the torn-stream values stop changing.' },
  { n: '05', t: 'Check convergence & mass balance', d: 'Verify the recycle residue is below tolerance and Σproducts − Σfeeds ≈ 0. A converged run with a broken balance means a wrong specification.' },
  { n: '06', t: 'Sensitivities & optimization', d: 'Once converged, run case studies (conversion, reflux, temperature) and use design specs to hit targets such as 95% recovery.' },
];

const GUIDE_UNITS = [
  { duty: 'Chemical reaction in liquid phase', unit: 'CSTR / PFR', why: 'Residence time and temperature control kinetics; a PFR gives higher conversion for positive-order reactions.' },
  { duty: 'Boiling-point separation', unit: 'Distillation column', why: 'Exploits relative volatility — the workhorse of chemical plants.' },
  { duty: 'Non-boiling liquid–liquid extraction', unit: 'Liquid–liquid extractor', why: 'Separates by solubility difference when distillation is impractical or expensive.' },
  { duty: 'Gas cleanup', unit: 'Absorber (packed / tray)', why: 'Contacts gas with solvent; Kremser analysis sizes the column.' },
  { duty: 'Solid–liquid separation', unit: 'Filter / centrifuge', why: 'Mechanical separation based on particle size or density.' },
  { duty: 'Heat exchange between streams', unit: 'Shell-and-tube / plate HX', why: 'Thermal integration cuts utility cost; pinch analysis sets the target.' },
];

const GUIDE_CONV: { symptom: string; cause: string; fix: string }[] = [
  { symptom: 'Slow convergence, residual decays linearly', cause: 'Recycle loop has a spectral radius close to 1 (near-singular iteration map).', fix: 'Turn on Wegstein acceleration; improve the initial guess; tear the loop at a better stream.' },
  { symptom: 'Oscillating residuals that never settle', cause: 'Poor initialization or an over-specified unit (conflicting specs).', fix: 'Relax specs; initialize from a converged case with the recycle closed manually.' },
  { symptom: 'Divergence / NaN values', cause: 'Physically impossible state — negative flows, T > T_c, or a bad property package.', fix: 'Check the property package; clamp specs; start at low recycle and ramp it up.' },
  { symptom: 'Converged but mass balance is off', cause: 'Wrong specs or an unconnected stream (the classic hidden leak).', fix: 'Run the balance report; trace every stream; look for duplicate names.' },
];

const GUIDE_THERMO = [
  { pkg: 'Peng–Robinson', best: 'Hydrocarbons, gases, refinery, NGL', why: 'Accurate VLE for non-polar mixtures up to high pressure.' },
  { pkg: 'Soave–Redlich–Kwong', best: 'Cryogenic systems, light gases', why: 'Better near-critical vapor-phase behavior for light ends.' },
  { pkg: 'NRTL / UNIQUAC', best: 'Non-ideal liquids: alcohols, water, acids', why: 'Activity-coefficient models for azeotropic mixtures.' },
  { pkg: 'Steam tables (IAPWS)', best: 'Steam cycles, power, utility systems', why: 'Exact steam properties without component VLE.' },
];

const GUIDE_CHECKLIST = [
  'All components defined with correct CAS numbers',
  'Property package consistent with the chemistry',
  'Every unit has the right number of specs (zero degrees of freedom)',
  'Recycle streams torn and accelerated',
  'Convergence tolerance set (default 1e-5 relative)',
  'Mass & energy balances verified after convergence',
  'Case studies documented before scale-up',
];

function SimGuide() {
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Simulation workflow" icon={BookOpen}>
        <div className="space-y-5">
          {GUIDE_STEPS.map(s => (
            <div key={s.n} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center text-xs font-black flex-shrink-0">{s.n}</div>
              <div>
                <p className="text-sm font-black text-surface-800 dark:text-surface-100">{s.t}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 font-medium mt-1 leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </CalcCard>
      <div className="space-y-6">
        <CalcCard title="Unit operation selection" icon={Boxes}>
          <div className="space-y-3">
            {GUIDE_UNITS.map(u => (
              <div key={u.unit} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-surface-600 dark:text-surface-300">{u.duty}</p>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 flex-shrink-0">{u.unit}</span>
                </div>
                <p className="text-[11px] text-surface-400 dark:text-surface-500 font-medium mt-1">{u.why}</p>
              </div>
            ))}
          </div>
        </CalcCard>
        <CalcCard title="Convergence troubleshooting" icon={RefreshCw}>
          <div className="space-y-3">
            {GUIDE_CONV.map((c, i) => (
              <div key={i} className="rounded-xl border border-accent-200/70 dark:border-accent-800/40 bg-accent-50/60 dark:bg-accent-900/10 p-3">
                <p className="text-xs font-black text-accent-700 dark:text-accent-300">{c.symptom}</p>
                <p className="text-[11px] text-accent-600/80 dark:text-accent-400/80 font-medium mt-1">{c.cause}</p>
                <p className="text-[11px] text-surface-500 dark:text-surface-400 font-semibold mt-1">→ {c.fix}</p>
              </div>
            ))}
          </div>
        </CalcCard>
      </div>
      <CalcCard title="Property package selection" icon={Settings2}>
        <div className="space-y-3">
          {GUIDE_THERMO.map(t => (
            <div key={t.pkg} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
              <p className="text-xs font-black text-surface-800 dark:text-surface-100">{t.pkg}</p>
              <p className="text-[11px] text-accent-600 dark:text-accent-400 font-bold mt-0.5">{t.best}</p>
              <p className="text-[11px] text-surface-400 dark:text-surface-500 font-medium mt-1">{t.why}</p>
            </div>
          ))}
        </div>
      </CalcCard>
      <CalcCard title="Steady-state simulation checklist" icon={CheckCircle2}>
        <div className="space-y-2.5">
          {GUIDE_CHECKLIST.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-surface-500 dark:text-surface-400 font-semibold leading-relaxed">{c}</p>
            </div>
          ))}
        </div>
      </CalcCard>
    </div>
  );
}
// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'flowsheet', label: 'Flowsheet', icon: Workflow },
  { id: 'convergence', label: 'Convergence', icon: RefreshCw },
  { id: 'unitops', label: 'Unit Ops', icon: Boxes },
  { id: 'thermo', label: 'Thermo', icon: Settings2 },
  { id: 'guide', label: 'Sim Guide', icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]['id'];

const FLOW_TEMPLATES = [REACTOR_RECYCLE, FLASH_RECYCLE, REACTOR_TRAIN];

export default function ProcessSimulationModule() {
  const [tab, setTab] = useState<TabId>('flowsheet');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-teal-600 text-surface-50 flex items-center justify-center shadow-lg shadow-accent-500/25">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-surface-900 dark:text-surface-50">Process Simulation</h1>
            <p className="text-sm font-semibold text-surface-500 dark:text-surface-400 mt-0.5">
              Sequential-modular flowsheets · recycle convergence · unit operations · cubic equations of state
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${tab === t.id
                ? 'bg-accent-500 text-surface-50 shadow-lg shadow-accent-500/30 scale-[1.03]'
                : 'bg-surface-50 dark:bg-surface-900/60 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-800 hover:border-accent-400/60 hover:text-accent-600 hover:-translate-y-0.5'}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'flowsheet' && <FlowsheetCalc />}
      {tab === 'convergence' && <ConvergenceCalc />}
      {tab === 'unitops' && <UnitOpsCalc />}
      {tab === 'thermo' && <ThermoCalc />}
      {tab === 'guide' && <SimGuide />}
    </div>
  );
}

// ─── Shared template sliders ────────────────────────────────────────────────
function TemplateSliders({ tpl, params, onParam }: {
  tpl: FlowTemplate; params: Record<string, number>; onParam: (key: string, v: number) => void;
}) {
  return (
    <div className="space-y-4">
      {tpl.keys.map(k => (
        <div key={k.key}>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="text-xs font-bold text-surface-500 dark:text-surface-400">{k.label}</label>
            <span className="text-xs font-black tabular-nums text-accent-600 dark:text-accent-400">
              {fmt(params[k.key] ?? k.def, k.step < 1 ? 2 : 0)}
            </span>
          </div>
          <input
            type="range" min={k.min} max={k.max} step={k.step}
            value={params[k.key] ?? k.def}
            onChange={e => onParam(k.key, parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>
      ))}
    </div>
  );
}
// ─── TAB 1 · FLOWSHEET SOLVER ───────────────────────────────────────────────
function FlowsheetCalc() {
  const [tplId, setTplId] = useState(FLOW_TEMPLATES[0].id);
  const [params, setParams] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    FLOW_TEMPLATES[0].keys.forEach(k => { p[k.key] = k.def; });
    return p;
  });
  const [wegstein, setWegstein] = useState(true);
  const [maxIter, setMaxIter] = useState('300');
  const tpl = FLOW_TEMPLATES.find(t => t.id === tplId) ?? FLOW_TEMPLATES[0];
  const res = solveFlowsheet(tpl.make(params), tpl.tear, {
    tol: 1e-10,
    maxIter: Math.max(10, parseInt(maxIter, 10) || 300),
    wegstein,
  });
  const mb = boundaryStreams(tpl.make(params), res.streams);
  const totIn = mb.feeds.a + mb.feeds.b + mb.feeds.c;
  const totOut = mb.products.a + mb.products.b + mb.products.c;
  const mbRel = totIn > 0 ? Math.abs(totOut - totIn) / totIn : 0;
  const isReacting = tpl.id !== 'recycle-flash';
  const mbColor = isReacting ? '#94a3b8' : (mbRel < 1e-6 ? '#10b981' : '#f59e0b');
  const mbUnit = isReacting ? '% reaction Δ' : '% offset';
  const residue = res.history.length ? res.history[res.history.length - 1] : 0;
  const applyTpl = (id: string) => {
    setTplId(id);
    const t = FLOW_TEMPLATES.find(x => x.id === id);
    if (!t) return;
    const p: Record<string, number> = {};
    t.keys.forEach(k => { p[k.key] = k.def; });
    setParams(p);
  };
  const setP = (key: string, v: number) => setParams(prev => ({ ...prev, [key]: v }));
  const histPts: Pt[] = res.history.map((d, i) => ({ x: i + 1, y: Math.log10(Math.max(d, 1e-16)) }));
  return (
    <div className="grid lg:grid-cols-[minmax(0,430px)_1fr] gap-6 items-start">
      <CalcCard title="Flowsheet & parameters" icon={Workflow}>
        <SelectRow
          label="Template"
          value={tplId}
          onChange={applyTpl}
          options={FLOW_TEMPLATES.map(t => ({ value: t.id, label: t.name }))}
          hint={tpl.desc}
        />
        <TemplateSliders tpl={tpl} params={params} onParam={setP} />
        <div className="mt-5 pt-4 border-t border-surface-100 dark:border-surface-800">
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-bold text-surface-500 dark:text-surface-400">Wegstein acceleration</label>
            <button
              onClick={() => setWegstein(!wegstein)}
              aria-label="Toggle Wegstein acceleration"
              className={`relative w-11 h-6 rounded-full transition-colors ${wegstein ? 'bg-accent-500' : 'bg-surface-300 dark:bg-surface-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-50 shadow transition-all ${wegstein ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
          <InputRow label="Max iterations" unit="iter" value={maxIter} onChange={setMaxIter} />
          <p className="mt-4 flex items-center gap-2 text-[11px] font-bold text-accent-600 dark:text-accent-400">
            <Play className="w-3.5 h-3.5" /> Live solve — results update on every change
          </p>
        </div>
      </CalcCard>

      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <ResultBox
            label={res.converged ? 'Converged' : 'Not converged'}
            value={res.converged ? '✓' : '✗'}
            unit={res.converged ? `in ${res.iterations} iterations` : `after ${res.iterations} iterations`}
            color={res.converged ? '#10b981' : '#f59e0b'}
          />
          <ResultBox label="Recycle residue" value={residue.toExponential(1)} unit="max|Δ|" color="#6366f1" />
          <ResultBox label="Molar balance" value={fmt(mbRel * 100, 3)} unit={mbUnit} color={mbColor} />
        </div>

        <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-surface-800 dark:text-surface-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-accent-500" /> Iteration history · log₁₀ residue
            </h3>
            {res.converged
              ? <span className="flex items-center gap-1.5 text-[10px] font-black text-accent-600 dark:text-accent-400"><CheckCircle2 className="w-3.5 h-3.5" /> CONVERGED</span>
              : <span className="flex items-center gap-1.5 text-[10px] font-black text-accent-600 dark:text-accent-400"><AlertTriangle className="w-3.5 h-3.5" /> CHECK OPTIONS</span>}
          </div>
          {tpl.tear >= 0 ? (
            <Plot2D series={[{ id: 'hist', color: '#10b981', pts: histPts, width: 2.4 }]} xLabel="iteration" yLabel="log₁₀ residue" height={220} />
          ) : (
            <InfoNote>No recycle stream — this flowsheet solves in a single forward pass.</InfoNote>
          )}
        </div>

        <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-5 overflow-x-auto">
          <h3 className="text-sm font-black text-surface-800 dark:text-surface-100 mb-3 flex items-center gap-2">
            <Recycle className="w-4 h-4 text-accent-500" /> Stream table · mol/s
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-wider text-surface-400">
                <th className="pb-2">Stream</th>
                <th className="pb-2 text-right">A</th>
                <th className="pb-2 text-right">B</th>
                <th className="pb-2 text-right">C</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {tpl.labels.map((label, i) => {
                const s = res.streams[i] ?? { a: 0, b: 0, c: 0 };
                const isTear = i === tpl.tear;
                const tot = s.a + s.b + s.c;
                return (
                  <tr key={i} className={`border-t border-surface-100 dark:border-surface-800 ${isTear ? 'bg-accent-500/5' : ''}`}>
                    <td className="py-2 font-bold text-surface-600 dark:text-surface-300">
                      <span className="flex items-center gap-1.5">
                        {isTear && <Recycle className="w-3 h-3 text-accent-500" />}
                        {label}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-surface-500 dark:text-surface-400">{fmt(s.a, 2)}</td>
                    <td className="py-2 text-right tabular-nums text-surface-500 dark:text-surface-400">{fmt(s.b, 2)}</td>
                    <td className="py-2 text-right tabular-nums text-surface-500 dark:text-surface-400">{fmt(s.c, 2)}</td>
                    <td className="py-2 text-right tabular-nums font-black text-surface-800 dark:text-surface-100">{fmt(tot, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-5">
          <h3 className="text-sm font-black text-surface-800 dark:text-surface-100 mb-2 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-accent-500" /> Boundary balance
          </h3>
          <StatRow label="Feed total" value={`${fmt(totIn, 2)} mol/s`} accent="text-surface-800 dark:text-surface-100" />
          <StatRow label="Products total" value={`${fmt(totOut, 2)} mol/s`} accent="text-surface-800 dark:text-surface-100" />
          <StatRow label="Offset" value={`${fmt(mbRel * 100, 3)} %`} accent={mbRel < 1e-6 ? 'text-accent-600' : 'text-accent-600'} sub="Σ products − Σ feeds" />
          <InfoNote>
            Molar flow is not conserved across reactions (A + B → C reduces the mole count), so a non-zero offset on
            reacting templates is expected — it equals the net moles consumed. Switch to the Flash template to see a
            perfectly closed balance. Sequential-modular solution: units run in order; the torn recycle is iterated{' '}
            {wegstein ? 'with Wegstein acceleration' : 'by direct substitution'} until the residue falls below 1e-10.
          </InfoNote>
        </div>
      </div>
    </div>
  );
}
// ─── TAB 2 · CONVERGENCE LAB ────────────────────────────────────────────────
function ConvergenceCalc() {
  const [tplId, setTplId] = useState('recycle-reactor');
  const [params, setParams] = useState<Record<string, number>>({ FA: 100, FB: 100, conv: 0.6, recycle: 0.9 });
  const tpl = FLOW_TEMPLATES.find(t => t.id === tplId) ?? FLOW_TEMPLATES[0];
  const p: Record<string, number> = {};
  tpl.keys.forEach(k => { p[k.key] = params[k.key] ?? k.def; });
  const setP = (key: string, v: number) => setParams(prev => ({ ...prev, [key]: v }));
  const applyTpl = (id: string) => {
    setTplId(id);
    const t = FLOW_TEMPLATES.find(x => x.id === id);
    if (!t) return;
    const np: Record<string, number> = {};
    t.keys.forEach(k => { np[k.key] = k.def; });
    setParams(prev => ({ ...prev, ...np }));
  };
  const cmp = convergeCompare(tpl, p);
  const dCf = contractionFactor(cmp.direct);
  const wCf = contractionFactor(cmp.wegstein);
  const dPts: Pt[] = cmp.direct.map((d, i) => ({ x: i + 1, y: Math.log10(Math.max(d, 1e-16)) }));
  const wPts: Pt[] = cmp.wegstein.map((d, i) => ({ x: i + 1, y: Math.log10(Math.max(d, 1e-16)) }));
  return (
    <div className="grid lg:grid-cols-[minmax(0,430px)_1fr] gap-6 items-start">
      <CalcCard title="Lab setup" icon={Split}>
        <SelectRow
          label="Flowsheet"
          value={tplId}
          onChange={applyTpl}
          options={FLOW_TEMPLATES.filter(t => t.tear >= 0).map(t => ({ value: t.id, label: t.name }))}
          hint={tpl.desc}
        />
        <TemplateSliders tpl={tpl} params={params} onParam={setP} />
        <InfoNote>
          Both solvers start from the same zero-flow guess with the identical tolerance (1e-10) and iteration cap
          (400). Only the update rule differs: direct substitution recycles the latest values; Wegstein extrapolates
          the secant slope between the last two passes.
        </InfoNote>
      </CalcCard>
      <div className="space-y-6">
        <div className="grid sm:grid-cols-4 gap-4">
          <ResultBox label="Direct iterations" value={String(cmp.dIter)} unit={cmp.dConv ? 'converged' : 'capped'} color="#6366f1" />
          <ResultBox label="Wegstein iterations" value={String(cmp.wIter)} unit={cmp.wConv ? 'converged' : 'capped'} color="#10b981" />
          <ResultBox label="Direct factor" value={dCf === null ? '—' : dCf.toFixed(3)} unit="contraction" color="#6366f1" />
          <ResultBox label="Wegstein factor" value={wCf === null ? '—' : wCf.toFixed(3)} unit="contraction" color="#10b981" />
        </div>
        <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-5">
          <h3 className="text-sm font-black text-surface-800 dark:text-surface-100 mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-accent-500" /> Residual history — direct vs Wegstein
          </h3>
          <div className="flex flex-wrap gap-4 mb-2 text-[10px] font-black">
            <span className="flex items-center gap-1.5 text-primary-500"><span className="w-4 h-1 rounded-full bg-primary-500 inline-block" /> direct substitution</span>
            <span className="flex items-center gap-1.5 text-accent-500"><span className="w-4 h-1 rounded-full bg-accent-500 inline-block" /> Wegstein</span>
          </div>
          <Plot2D series={[
            { id: 'direct', color: '#6366f1', pts: dPts, width: 2.2 },
            { id: 'weg', color: '#10b981', pts: wPts, width: 2.4 },
          ]} xLabel="iteration" yLabel="log₁₀ residue" height={260} />
        </div>
        {dCf !== null && (
          <WarnNote>
            Direct substitution contracts with factor ≈ {dCf.toFixed(3)} — each pass removes only{' '}
            {fmt((1 - dCf) * 100, 0)}% of the remaining error. A contraction factor close to 1 (a slow loop) is
            exactly where Wegstein acceleration pays off — here converging in {cmp.wIter} passes versus{' '}
            {cmp.dIter} for direct substitution.
          </WarnNote>
        )}
        {dCf === null && (
          <InfoNote>
            No reliable contraction factor could be estimated from this history — the loop may have diverged or
            converged in too few passes to measure.
          </InfoNote>
        )}
      </div>
    </div>
  );
}
// ─── TAB 3 · UNIT OPERATIONS ────────────────────────────────────────────────
const UNIT_SUBS = [
  { id: 'reactor', label: 'Reactor', icon: Boxes },
  { id: 'flash', label: 'Flash', icon: Split },
  { id: 'separator', label: 'Separator', icon: Split },
  { id: 'mixer', label: 'Mixer', icon: Combine },
] as const;

type UnitSub = (typeof UNIT_SUBS)[number]['id'];

function UnitOpsCalc() {
  const [sub, setSub] = useState<UnitSub>('reactor');
  const [rType, setRType] = useState('cstr');
  const [rFA, setRFA] = useState('100');
  const [rFB, setRFB] = useState('120');
  const [rk, setRk] = useState('0.5');
  const [rtau, setRtau] = useState('2');
  const [f1, setF1] = useState('Benzene');
  const [f2, setF2] = useState('Toluene');
  const [fT, setFT] = useState('90');
  const [fP, setFP] = useState('760');
  const [fz, setFz] = useState('0.4');
  const [sA, setSA] = useState('50');
  const [sB, setSB] = useState('30');
  const [sC, setSC] = useState('20');
  const [spA, setSpA] = useState('5');
  const [spB, setSpB] = useState('30');
  const [spC, setSpC] = useState('95');
  const [m1a, setM1a] = useState('40');
  const [m1b, setM1b] = useState('10');
  const [m1c, setM1c] = useState('5');
  const [m2a, setM2a] = useState('0');
  const [m2b, setM2b] = useState('60');
  const [m2c, setM2c] = useState('0');

  const r = reactorCalc({ type: rType as 'cstr' | 'pfr', FA0: parseFloat(rFA) || 0, FB0: parseFloat(rFB) || 0, k: parseFloat(rk) || 0, tau: parseFloat(rtau) || 0 });
  const Tf = parseFloat(fT) || 0;
  const Pf = parseFloat(fP) || 0;
  const z1f = Math.min(Math.max(parseFloat(fz) || 0, 0), 1);
  const cA1 = ANTOINE_COMPS.find(c => c.name === f1) ?? ANTOINE_COMPS[0];
  const cA2 = ANTOINE_COMPS.find(c => c.name === f2) ?? ANTOINE_COMPS[1];
  const Kf = antoineK(cA1, cA2, Tf, Pf);
  const fr = rrFlash([z1f, 1 - z1f], Kf);
  const Tb = bubbleTAntoine(Pf, z1f, cA1, cA2);
  const Td = dewTAntoine(Pf, z1f, cA1, cA2);
  const feed: Stream = { a: parseFloat(sA) || 0, b: parseFloat(sB) || 0, c: parseFloat(sC) || 0 };
  const sep = separatorCalc(feed, [
    Math.min(Math.max(parseFloat(spA) || 0, 0), 100) / 100,
    Math.min(Math.max(parseFloat(spB) || 0, 0), 100) / 100,
    Math.min(Math.max(parseFloat(spC) || 0, 0), 100) / 100,
  ]);
  const m1: Stream = { a: parseFloat(m1a) || 0, b: parseFloat(m1b) || 0, c: parseFloat(m1c) || 0 };
  const m2: Stream = { a: parseFloat(m2a) || 0, b: parseFloat(m2b) || 0, c: parseFloat(m2c) || 0 };
  const mix = mixerCalc(m1, m2);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {UNIT_SUBS.map(s => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${sub === s.id
              ? 'bg-accent-500 text-surface-50 shadow-lg shadow-accent-500/25'
              : 'bg-surface-50 dark:bg-surface-900/60 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-800 hover:border-accent-400/60'}`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {sub === 'reactor' && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <CalcCard title="Reactor · A + B → C (1:1, first order in A)" icon={Boxes}>
            <SelectRow label="Type" value={rType} onChange={setRType} options={[
              { value: 'cstr', label: 'CSTR — X = kτ/(1+kτ)' },
              { value: 'pfr', label: 'PFR — X = 1 − e^(−kτ)' },
            ]} />
            <InputRow label="Feed A (F_A0)" unit="mol/s" value={rFA} onChange={setRFA} />
            <InputRow label="Feed B (F_B0)" unit="mol/s" value={rFB} onChange={setRFB} />
            <InputRow label="Rate constant k" unit="s⁻¹" value={rk} onChange={setRk} />
            <InputRow label="Space time τ" unit="s" value={rtau} onChange={setRtau} />
            {r.valid ? <InfoNote>{r.note}</InfoNote> : <WarnNote>{r.note}</WarnNote>}
          </CalcCard>
          <div>
            <div className="grid grid-cols-2 gap-4">
              <ResultBox label="Conversion X" value={fmt(r.X * 100, 1)} unit="%" color="#10b981" />
              <ResultBox label="A out" value={fmt(r.out.a, 2)} unit="mol/s" color="#6366f1" />
              <ResultBox label="B out" value={fmt(r.out.b, 2)} unit="mol/s" color="#8b5cf6" />
              <ResultBox label="C out" value={fmt(r.out.c, 2)} unit="mol/s" color="#f59e0b" />
            </div>
            <InfoNote>
              The PFR always outperforms a CSTR of equal space time for positive-order kinetics: concentration is
              highest at the inlet and decays along the tube, so the average rate is higher.
            </InfoNote>
          </div>
        </div>
      )}

      {sub === 'flash' && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <CalcCard title="Binary flash · Raoult's law K-values" icon={Split}>
            <SelectRow label="Light component" value={f1} onChange={setF1} options={ANTOINE_COMPS.map(c => ({ value: c.name, label: c.name }))} />
            <SelectRow label="Heavy component" value={f2} onChange={setF2} options={ANTOINE_COMPS.map(c => ({ value: c.name, label: c.name }))} />
            <InputRow label="Temperature" unit="°C" value={fT} onChange={setFT} />
            <InputRow label="Pressure" unit="mmHg" value={fP} onChange={setFP} />
            <InputRow label="Feed z₁ (light)" unit="mol frac" value={fz} onChange={setFz} />
            <InfoNote>Kᵢ = P_satᵢ(T)/P via Antoine. Bubble and dew temperatures are the roots of Σ zᵢKᵢ = 1 and Σ zᵢ/Kᵢ = 1.</InfoNote>
          </CalcCard>
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <ResultBox label="Vapor fraction" value={fmt(fr.vf, 4)} unit="" color="#10b981" />
              <ResultBox label="Phase" value={fr.phase} unit="" color={fr.phase === 'two-phase' ? '#10b981' : '#6366f1'} />
              <ResultBox label="Bubble point" value={Tb === null ? '—' : fmt(Tb, 1)} unit="°C" color="#6366f1" />
              <ResultBox label="Dew point" value={Td === null ? '—' : fmt(Td, 1)} unit="°C" color="#8b5cf6" />
              <ResultBox label="K₁ / K₂" value={`${fmt(Kf[0], 3)} / ${fmt(Kf[1], 3)}`} unit="" color="#f59e0b" />
              <ResultBox label="x₁ (liq)" value={fmt(fr.x[0], 4)} unit="" color="#6366f1" />
              <ResultBox label="y₁ (vap)" value={fmt(fr.y[0], 4)} unit="" color="#8b5cf6" />
              <ResultBox label="x₂ / y₂" value={`${fmt(fr.x[1], 4)} / ${fmt(fr.y[1], 4)}`} unit="" color="#f59e0b" />
            </div>
            <InfoNote>
              At the bubble point the first vapor appears (vapor fraction → 0); at the dew point the last liquid
              disappears (vapor fraction → 1). Between them the Rachford–Rice equation fixes ψ.
            </InfoNote>
          </div>
        </div>
      )}

      {sub === 'separator' && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <CalcCard title="Splitter · fraction to top product" icon={Split}>
            <InputRow label="Feed A" unit="mol/s" value={sA} onChange={setSA} />
            <InputRow label="Feed B" unit="mol/s" value={sB} onChange={setSB} />
            <InputRow label="Feed C" unit="mol/s" value={sC} onChange={setSC} />
            <InputRow label="Split A → top" unit="%" value={spA} onChange={setSpA} />
            <InputRow label="Split B → top" unit="%" value={spB} onChange={setSpB} />
            <InputRow label="Split C → top" unit="%" value={spC} onChange={setSpC} />
            <InfoNote>The complement (100 − split) leaves with the bottom stream — mass is conserved component by component.</InfoNote>
          </CalcCard>
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <ResultBox label="Top A" value={fmt(sep.top.a, 2)} unit="mol/s" color="#6366f1" />
              <ResultBox label="Bottom A" value={fmt(sep.bottom.a, 2)} unit="mol/s" color="#8b5cf6" />
              <ResultBox label="Top B" value={fmt(sep.top.b, 2)} unit="mol/s" color="#6366f1" />
              <ResultBox label="Bottom B" value={fmt(sep.bottom.b, 2)} unit="mol/s" color="#8b5cf6" />
              <ResultBox label="Top C" value={fmt(sep.top.c, 2)} unit="mol/s" color="#6366f1" />
              <ResultBox label="Bottom C" value={fmt(sep.bottom.c, 2)} unit="mol/s" color="#8b5cf6" />
              <ResultBox label="Top total" value={fmt(sep.top.a + sep.top.b + sep.top.c, 2)} unit="mol/s" color="#10b981" />
              <ResultBox label="Bottom total" value={fmt(sep.bottom.a + sep.bottom.b + sep.bottom.c, 2)} unit="mol/s" color="#10b981" />
            </div>
            <InfoNote>
              In a real process the split vector follows from the unit's design — e.g., distillate recovery per
              component from relative volatility and reflux — not from an arbitrary choice.
            </InfoNote>
          </div>
        </div>
      )}

      {sub === 'mixer' && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <CalcCard title="Mixer · two streams in, one out" icon={Combine}>
            <div className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Stream 1</div>
            <InputRow label="A" unit="mol/s" value={m1a} onChange={setM1a} />
            <InputRow label="B" unit="mol/s" value={m1b} onChange={setM1b} />
            <InputRow label="C" unit="mol/s" value={m1c} onChange={setM1c} />
            <div className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 mt-4">Stream 2</div>
            <InputRow label="A" unit="mol/s" value={m2a} onChange={setM2a} />
            <InputRow label="B" unit="mol/s" value={m2b} onChange={setM2b} />
            <InputRow label="C" unit="mol/s" value={m2c} onChange={setM2c} />
          </CalcCard>
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <ResultBox label="Mixed A" value={fmt(mix.a, 2)} unit="mol/s" color="#6366f1" />
              <ResultBox label="Mixed B" value={fmt(mix.b, 2)} unit="mol/s" color="#8b5cf6" />
              <ResultBox label="Mixed C" value={fmt(mix.c, 2)} unit="mol/s" color="#f59e0b" />
              <ResultBox label="Mixed total" value={fmt(mix.a + mix.b + mix.c, 2)} unit="mol/s" color="#10b981" />
            </div>
            <InfoNote>
              Component flows add linearly; the outlet mole fraction is component flow ÷ total flow. An energy
              balance (mixing enthalpy) is a separate check — mixing is never a thermodynamic no-op unless the
              streams are identical.
            </InfoNote>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── TAB 4 · THERMO (CUBIC EOS) ─────────────────────────────────────────────
function ThermoCalc() {
  const [comp, setComp] = useState('Propane');
  const [eos, setEos] = useState<'PR' | 'SRK'>('PR');
  const [T, setT] = useState('300');
  const [P, setP] = useState('20');
  const [pMax, setPMax] = useState('100');
  const c = THERMO_COMPS.find(x => x.name === comp) ?? THERMO_COMPS[0];
  const Tv = parseFloat(T) || 0;
  const Pv = parseFloat(P) || 0;
  const zr = cubicEosZ(Tv, Pv, c, eos);
  const phiV = zr.Zv !== null ? fugacityCoeff(Tv, Pv, zr.Zv, c, eos) : NaN;
  const phiL = zr.Zl !== null ? fugacityCoeff(Tv, Pv, zr.Zl, c, eos) : NaN;
  const sweep = zSweep(c, Tv, eos, Math.max(1, parseFloat(pMax) || 100));
  const sweepPtsV: Pt[] = [];
  const sweepPtsL: Pt[] = [];
  sweep.P.forEach((p, i) => {
    if (sweep.Zv[i] !== null) sweepPtsV.push({ x: p, y: sweep.Zv[i] as number });
    if (sweep.Zl[i] !== null) sweepPtsL.push({ x: p, y: sweep.Zl[i] as number });
  });
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Compressibility & fugacity" icon={Settings2}>
        <SelectRow label="Component" value={comp} onChange={setComp} options={THERMO_COMPS.map(c => ({ value: c.name, label: c.name }))} />
        <SelectRow label="Equation of state" value={eos} onChange={v => setEos(v as 'PR' | 'SRK')} options={[
          { value: 'PR', label: 'Peng–Robinson (1976)' },
          { value: 'SRK', label: 'Soave–Redlich–Kwong (1972)' },
        ]} />
        <InputRow label="Temperature" unit="K" value={T} onChange={setT} />
        <InputRow label="Pressure" unit="bar" value={P} onChange={setP} />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <ResultBox label="Z (vapor)" value={zr.Zv === null ? '—' : zr.Zv.toFixed(4)} unit="" color="#6366f1" />
          <ResultBox label="Z (liquid)" value={zr.Zl === null ? '—' : zr.Zl.toFixed(4)} unit="" color="#8b5cf6" />
          <ResultBox label="φ (vapor)" value={isFinite(phiV) ? phiV.toFixed(4) : '—'} unit="" color="#6366f1" />
          <ResultBox label="φ (liquid)" value={isFinite(phiL) ? phiL.toFixed(4) : '—'} unit="" color="#8b5cf6" />
        </div>
        {zr.valid ? <InfoNote>{zr.note}</InfoNote> : <WarnNote>{zr.note}</WarnNote>}
      </CalcCard>
      <div className="space-y-6">
        <CalcCard title="Z vs pressure sweep" icon={Boxes}>
          <InputRow label="Max pressure" unit="bar" value={pMax} onChange={setPMax} />
          <div className="flex flex-wrap gap-4 mb-2 text-[10px] font-black">
            <span className="flex items-center gap-1.5 text-primary-500"><span className="w-4 h-1 rounded-full bg-primary-500 inline-block" /> vapor Z</span>
            <span className="flex items-center gap-1.5 text-violet-500"><span className="w-4 h-1 rounded-full bg-violet-500 inline-block" /> liquid Z</span>
            <span className="flex items-center gap-1.5 text-surface-400"><span className="w-4 h-1 rounded-full bg-surface-400 inline-block" /> ideal gas Z = 1</span>
          </div>
          <Plot2D series={[
            ...(sweepPtsV.length ? [{ id: 'zv', color: '#6366f1', pts: sweepPtsV }] : []),
            ...(sweepPtsL.length ? [{ id: 'zl', color: '#8b5cf6', pts: sweepPtsL }] : []),
            { id: 'ideal', color: '#94a3b8', dashed: true, pts: [{ x: sweep.P[0], y: 1 }, { x: sweep.P[sweep.P.length - 1], y: 1 }] },
          ]} xLabel="P (bar)" yLabel="Z" height={260} />
          <InfoNote>
            Near the critical temperature the vapor branch dips below Z = 1 as pressure rises (attractive forces
            dominate), then climbs steeply at high pressure (repulsion). Below T_c the liquid root appears — two
            roots bracketing the two-phase envelope.
          </InfoNote>
        </CalcCard>
        <InfoNote>
          Fugacity coefficients come from the same cubic EOS (analytical ln φ expressions). φ → 1 as P → 0 recovers
          ideal-gas behavior; deviations from 1 measure non-ideality at the chosen state.
        </InfoNote>
      </div>
    </div>
  );
}
