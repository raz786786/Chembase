import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Columns2, Droplets, ArrowUpDown, Thermometer, GitBranch, Layers, Info,
  Percent, Gauge, Beaker, AlertCircle, CheckCircle2
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── Antoine constants — P in mmHg, T in °C ──────────────────────────────────
interface AntoineComp { name: string; symbol: string; A: number; B: number; C: number; }

const COMPONENTS: AntoineComp[] = [
  { name: 'Water', symbol: 'H₂O', A: 8.07131, B: 1730.63, C: 233.426 },
  { name: 'Benzene', symbol: 'C₆H₆', A: 6.90565, B: 1211.033, C: 220.79 },
  { name: 'Toluene', symbol: 'C₇H₈', A: 6.95464, B: 1344.8, C: 219.482 },
  { name: 'Ethanol', symbol: 'C₂H₅OH', A: 8.20417, B: 1642.89, C: 230.3 },
  { name: 'Methanol', symbol: 'CH₃OH', A: 8.08097, B: 1582.271, C: 239.726 },
  { name: 'Acetone', symbol: '(CH₃)₂CO', A: 7.11714, B: 1210.595, C: 229.664 },
  { name: 'n-Hexane', symbol: 'C₆H₁₄', A: 6.87632, B: 1171.17, C: 224.41 },
  { name: 'n-Heptane', symbol: 'C₇H₁₆', A: 6.89677, B: 1264.9, C: 216.636 },
  { name: 'Chloroform', symbol: 'CHCl₃', A: 6.95465, B: 1170.966, C: 226.232 },
  { name: 'n-Octane', symbol: 'C₈H₁₈', A: 6.91868, B: 1351.99, C: 209.155 },
];

function compOf(name: string): AntoineComp {
  return COMPONENTS.find(c => c.name === name) ?? COMPONENTS[0];
}

function psat(c: AntoineComp, T: number): number {
  return Math.pow(10, c.A - c.B / (c.C + T));
}

// ─── Robust bisection root finder ────────────────────────────────────────────
function bisect(f: (x: number) => number, lo: number, hi: number, tol = 1e-8): number | null {
  let a = lo, b = hi;
  let fa = f(a), fb = f(b);
  if (!isFinite(fa) || !isFinite(fb) || fa * fb > 0) return null;
  for (let i = 0; i < 300; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (Math.abs(fm) < tol || (b - a) / 2 < 1e-7) return m;
    if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

// Bubble point: Σ xᵢ·Pᵢˢᵃᵗ(T) = P
function bubblePoint(P: number, x1: number, c1: AntoineComp, c2: AntoineComp): number | null {
  if (x1 < 0 || x1 > 1 || P <= 0 || !isFinite(x1)) return null;
  return bisect(T => x1 * psat(c1, T) + (1 - x1) * psat(c2, T) - P, 0, 400);
}

// Dew point: Σ yᵢ / Pᵢˢᵃᵗ(T) = 1/P
function dewPoint(P: number, y1: number, c1: AntoineComp, c2: AntoineComp): number | null {
  if (y1 < 0 || y1 > 1 || P <= 0 || !isFinite(y1)) return null;
  return bisect(T => y1 / psat(c1, T) + (1 - y1) / psat(c2, T) - 1 / P, 0, 400);
}
// ─── Isothermal flash — Rachford–Rice ───────────────────────────────────────
interface FlashResult {
  status: string;
  VF: number;
  x1: number; x2: number;
  y1: number; y2: number;
  K1: number; K2: number;
  Tb: number | null;
  Td: number | null;
}

function flashCalc(P: number, T: number, z1: number, c1: AntoineComp, c2: AntoineComp): FlashResult {
  const bad = (msg: string): FlashResult => ({
    status: msg, VF: 0, x1: z1, x2: 1 - z1, y1: 0, y2: 0, K1: NaN, K2: NaN, Tb: null, Td: null,
  });
  if (!(P > 0) || !isFinite(P) || !isFinite(T) || !(z1 >= 0 && z1 <= 1) || !isFinite(z1)) return bad('Invalid input — check pressure, temperature and composition.');
  if (c1.C + T <= 0 || c2.C + T <= 0 || T < -50 || T > 400) return bad('Temperature outside the Antoine validity range.');
  const z2 = 1 - z1;
  const K1 = psat(c1, T) / P;
  const K2 = psat(c2, T) / P;
  if (!isFinite(K1) || !isFinite(K2) || K1 <= 0 || K2 <= 0) return bad('K-values undefined — check pressure and temperature.');
  const Tb = bubblePoint(P, z1, c1, c2);
  const Td = dewPoint(P, z1, c1, c2);
  let status = 'Two-phase (vapor + liquid)';
  let VF = 0, x1 = z1, x2 = z2, y1 = 0, y2 = 0;
  const bubbleK = z1 * K1 + z2 * K2;
  if (bubbleK <= 1) {
    status = 'All liquid — below bubble point';
    x1 = z1; x2 = z2;
    y1 = K1 * x1; y2 = K2 * x2;
  } else if (z1 / K1 + z2 / K2 <= 1) {
    status = 'All vapor — above dew point';
    VF = 1;
    y1 = z1; y2 = z2;
    x1 = y1 / K1; x2 = y2 / K2;
  } else {
    const psi = bisect(
      p => z1 * (K1 - 1) / (1 + p * (K1 - 1)) + z2 * (K2 - 1) / (1 + p * (K2 - 1)),
      0, 1
    );
    VF = psi ?? 0;
    x1 = z1 / (1 + VF * (K1 - 1));
    x2 = z2 / (1 + VF * (K2 - 1));
    y1 = K1 * x1; y2 = K2 * x2;
  }
  return { status, VF, x1, x2, y1, y2, K1, K2, Tb, Td };
}

// ─── Relative volatility & x–y equilibrium curve ─────────────────────────────
function relVolAt(T: number, c1: AntoineComp, c2: AntoineComp): number {
  return psat(c1, T) / psat(c2, T);
}

function xyCurve(c1: AntoineComp, c2: AntoineComp, P: number, points = 60): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= points; i++) {
    const x = i / points;
    const T = bubblePoint(P, x, c1, c2);
    if (T === null) continue;
    pts.push({ x, y: x * psat(c1, T) / P });
  }
  return pts;
}
// ─── FUG distillation design: Fenske · Underwood · Gilliland · Kirkbride ─────
interface FugResult {
  DOverF: number;
  Nmin: number | null;
  theta: number | null;
  Rmin: number | null;
  N: number | null;
  Nfeed: number | null;
  err?: string;
}

function fugCalc(zF: number, xD: number, xB: number, q: number, R: number, alpha: number): FugResult {
  if (xD <= xB) return { DOverF: 0, Nmin: null, theta: null, Rmin: null, N: null, Nfeed: null, err: 'Distillate composition (xD) must exceed bottoms composition (xB).' };
  if (zF <= xB || zF >= xD) return { DOverF: 0, Nmin: null, theta: null, Rmin: null, N: null, Nfeed: null, err: 'Feed composition (zF) must lie strictly between xB and xD.' };
  if (alpha <= 1) return { DOverF: 0, Nmin: null, theta: null, Rmin: null, N: null, Nfeed: null, err: 'Relative volatility must be greater than 1 (check component order).' };

  const DOverF = (zF - xB) / (xD - xB);
  const Nmin = Math.log((xD / (1 - xD)) * ((1 - xB) / xB)) / Math.log(alpha);

  // Underwood: find θ between α(HK)=1 and α(LK)=α solving Σ αᵢzᵢ/(αᵢ−θ) = 1−q
  const g = (th: number) => alpha * zF / (alpha - th) + (1 - zF) / (1 - th) - (1 - q);
  const theta = bisect(g, 1 + 1e-6, alpha - 1e-6);

  let Rmin: number | null = null;
  let N: number | null = null;
  let Nfeed: number | null = null;
  if (theta !== null) {
    Rmin = alpha * xD / (alpha - theta) + (1 - xD) / (1 - theta) - 1;
    if (R > Rmin) {
      const X = Math.max((R - Rmin) / (R + 1), 0.001);
      const Y = 1 - Math.exp(((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X)));
      N = (Nmin + Y) / (1 - Y);
      const BOverD = (1 - DOverF) / DOverF;
      const ratio = Math.pow(BOverD * ((1 - zF) / zF) * Math.pow(xD / (1 - xB), 2), 0.206);
      const NrOverNs = ratio > 0 ? ratio : 1;
      Nfeed = N * NrOverNs / (1 + NrOverNs);
    }
  }
  return { DOverF, Nmin, theta, Rmin, N, Nfeed };
}

// ─── Absorption — Kremser equation ───────────────────────────────────────────
interface KremserResult {
  A: number;
  N: number | null;
  Lmin: number;
  recovery: number;
  feasible: boolean;
}

function kremserCalc(G: number, L: number, y1: number, y2: number, x2: number, m: number): KremserResult {
  const recovery = y1 > 0 ? (y1 - y2) / y1 : 0;
  const feasible = y2 > m * x2 && y1 > y2 && G > 0 && m > 0;
  const Lmin = m * G * (y1 - y2) / (y1 - m * x2);
  const A = L / (m * G);
  let N: number | null = null;
  if (feasible && A > 0) {
    const top = (y1 - m * x2) / (y2 - m * x2);
    if (Math.abs(A - 1) < 1e-6) {
      N = (y1 - y2) / (y2 - m * x2);
    } else {
      N = Math.log(top * (1 - 1 / A) + 1 / A) / Math.log(A);
    }
    if (!isFinite(N) || N <= 0) N = null;
  }
  return { A, N, Lmin, recovery, feasible };
}
// ─── Small UI helpers ────────────────────────────────────────────────────────
function SelectRow({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 group">
      <label className="md:w-64 text-sm font-bold text-surface-500 dark:text-surface-400 group-focus-within:text-primary-600 transition-colors">
        {label}
        {hint && <span className="block text-[10px] font-semibold text-surface-400 mt-0.5">{hint}</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-grow px-5 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-bold text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function StatRow({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-surface-100 dark:border-surface-800 last:border-0 gap-4">
      <span className="text-sm font-medium text-surface-500 flex-shrink-0">{label}</span>
      <span className={`text-sm font-black text-right ${accent || 'text-surface-900 dark:text-surface-50'}`}>
        {value}
        {sub && <span className="block text-[10px] font-bold text-surface-400 mt-0.5">{sub}</span>}
      </span>
    </div>
  );
}

function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 mt-4 p-3.5 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40">
      <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs font-medium text-primary-700 dark:text-primary-300 leading-relaxed">{children}</p>
    </div>
  );
}

function WarnNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40">
      <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 leading-relaxed">{children}</p>
    </div>
  );
}

function fmt(v: number | null | undefined, digits = 3, suffix = ''): string {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return v.toFixed(digits) + suffix;
}
// ─── TAB 1 · BUBBLE & DEW POINT ─────────────────────────────────────────────
function BubbleDewCalc() {
  const [compA, setCompA] = useState('Benzene');
  const [compB, setCompB] = useState('Toluene');
  const [P, setP] = useState('760');
  const [x1, setX1] = useState('0.4');
  const [y1, setY1] = useState('0.6');
  const cA = compOf(compA);
  const cB = compOf(compB);
  const Pv = parseFloat(P);
  const xv = parseFloat(x1);
  const yv = parseFloat(y1);
  const Tb = bubblePoint(Pv, xv, cA, cB);
  const yAtB = Tb !== null ? xv * psat(cA, Tb) / Pv : NaN;
  const Td = dewPoint(Pv, yv, cA, cB);
  const xAtD = Td !== null ? yv * Pv / psat(cA, Td) : NaN;
  const alpha = Tb !== null ? relVolAt(Tb, cA, cB) : NaN;
  const swapped = psat(cA, 100) < psat(cB, 100);
  const compOptions = COMPONENTS.map(c => ({ value: c.name, label: c.name + ' (' + c.symbol + ')' }));
  return (
    <CalcCard title="Bubble & Dew Point — Raoult + Antoine" icon={Thermometer}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">
        Bubble: Σ xᵢ·Pᵢˢᵃᵗ(T) = P &nbsp;·&nbsp; Dew: Σ yᵢ/Pᵢˢᵃᵗ(T) = 1/P &nbsp;·&nbsp; log₁₀(Pᵢˢᵃᵗ) = A − B/(C+T)
      </p>
      <SelectRow label="Component 1" value={compA} onChange={setCompA} options={compOptions} hint="light / more volatile" />
      <SelectRow label="Component 2" value={compB} onChange={setCompB} options={compOptions} hint="heavy / less volatile" />
      <InputRow label="System pressure" unit="mmHg" value={P} onChange={setP} />
      <InputRow label="Liquid mole fraction x₁" unit="−" value={x1} onChange={setX1} />
      <InputRow label="Vapor mole fraction y₁" unit="−" value={y1} onChange={setY1} />

      {swapped && (
        <WarnNote>Component 1 ({(compA)}) is less volatile than Component 2 ({(compB)}) at 100 °C — swap the selection so α &gt; 1.</WarnNote>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <ResultBox label="Bubble Point" value={Tb !== null ? Tb.toFixed(2) : '—'} unit="°C" color="#0ea5e9" />
        <ResultBox label="Dew Point" value={Td !== null ? Td.toFixed(2) : '—'} unit="°C" color="#f59e0b" />
        <ResultBox label="Vapor @ bubble (y₁)" value={isFinite(yAtB) ? yAtB.toFixed(4) : '—'} unit="mole frac" color="#8b5cf6" />
        <ResultBox label="Liquid @ dew (x₁)" value={isFinite(xAtD) ? xAtD.toFixed(4) : '—'} unit="mole frac" color="#10b981" />
      </div>

      <div className="mt-8 glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Key Properties</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <StatRow label="Relative volatility α (at T_bubble)" value={fmt(alpha)} />
          <StatRow label="T_bubble − T_dew spread" value={Tb !== null && Td !== null ? (Td - Tb).toFixed(2) : '—'} sub="Larger spread → easier separation" />
          <StatRow label="P₁ˢᵃᵗ (Component 1 @ bubble)" value={Tb !== null ? psat(cA, Tb).toFixed(1) : '—'} sub="mmHg" />
          <StatRow label="P₂ˢᵃᵗ (Component 2 @ bubble)" value={Tb !== null ? psat(cB, Tb).toFixed(1) : '—'} sub="mmHg" />
        </div>
      </div>
      <InfoNote>
        Pure boiling points at {Pv > 0 ? Pv.toFixed(0) : '—'} mmHg: {(compA)} ≈ {fmt(bubblePoint(Pv, 1, cA, cB), 1, ' °C')}, {(compB)} ≈ {fmt(bubblePoint(Pv, 0, cA, cB), 1, ' °C')}. A small T_bubble−T_dew spread means close-boiling components need many stages.
      </InfoNote>
    </CalcCard>
  );
}
// ─── TAB 2 · ISOTHERMAL FLASH ────────────────────────────────────────────────
function FlashCalc() {
  const [compA, setCompA] = useState('Benzene');
  const [compB, setCompB] = useState('Toluene');
  const [P, setP] = useState('760');
  const [T, setT] = useState('100');
  const [z1, setZ1] = useState('0.5');
  const cA = compOf(compA);
  const cB = compOf(compB);
  const Pv = parseFloat(P);
  const Tv = parseFloat(T);
  const zv = parseFloat(z1);
  const r = flashCalc(Pv, Tv, zv, cA, cB);
  const compOptions = COMPONENTS.map(c => ({ value: c.name, label: c.name + ' (' + c.symbol + ')' }));
  const twoPhase = r.status.startsWith('Two');
  return (
    <CalcCard title="Isothermal Flash — Rachford–Rice" icon={Droplets}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">
        Solve Σ zᵢ(Kᵢ−1)/(1 + ψ(Kᵢ−1)) = 0 for vapor fraction ψ = V/F, then xᵢ = zᵢ/(1+ψ(Kᵢ−1)), yᵢ = Kᵢ·xᵢ.
      </p>
      <SelectRow label="Component 1" value={compA} onChange={setCompA} options={compOptions} hint="light / more volatile" />
      <SelectRow label="Component 2" value={compB} onChange={setCompB} options={compOptions} hint="heavy / less volatile" />
      <InputRow label="Pressure" unit="mmHg" value={P} onChange={setP} />
      <InputRow label="Flash temperature" unit="°C" value={T} onChange={setT} />
      <InputRow label="Feed mole fraction z₁" unit="−" value={z1} onChange={setZ1} />

      <div className={`mt-6 flex items-center gap-2.5 p-4 rounded-2xl border ${twoPhase ? 'bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800/40' : 'bg-surface-50 dark:bg-surface-900/50 border-surface-200 dark:border-surface-800'}`}>
        {twoPhase
          ? <CheckCircle2 className="w-5 h-5 text-accent-500 flex-shrink-0" />
          : <Beaker className="w-5 h-5 text-surface-400 flex-shrink-0" />}
        <span className={`text-sm font-bold ${twoPhase ? 'text-accent-700 dark:text-accent-300' : 'text-surface-600 dark:text-surface-300'}`}>{r.status}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <ResultBox label="Vapor fraction V/F" value={fmt(r.VF, 4)} unit="mol/mol" color="#8b5cf6" />
        <ResultBox label="Liquid x₁" value={fmt(r.x1, 4)} unit="−" color="#0ea5e9" />
        <ResultBox label="Vapor y₁" value={fmt(r.y1, 4)} unit="−" color="#f59e0b" />
        <ResultBox label="K₁ = P₁ˢᵃᵗ/P" value={fmt(r.K1, 3)} unit="−" color="#10b981" />
      </div>

      <div className="mt-8 glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Phase Envelope & Balance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <StatRow label="Feed bubble point" value={fmt(r.Tb, 2, ' °C')} />
          <StatRow label="Feed dew point" value={fmt(r.Td, 2, ' °C')} />
          <StatRow label="K₂ = P₂ˢᵃᵗ/P" value={fmt(r.K2, 3)} />
          <StatRow label="Material balance z₁ = ψy₁+(1−ψ)x₁" value={fmt(twoPhase ? r.VF * r.y1 + (1 - r.VF) * r.x1 : zv, 4)} sub="should equal feed z₁" />
        </div>
      </div>
      <InfoNote>
        If T is below the bubble point the feed is subcooled liquid (V/F = 0); above the dew point it is superheated vapor (V/F = 1). The Rachford–Rice root only exists between those two temperatures.
      </InfoNote>
    </CalcCard>
  );
}
// ─── Generic x–y SVG chart ───────────────────────────────────────────────────
interface Pt { x: number; y: number; }
interface LineDef { id: string; color: string; pts: Pt[]; dashed?: boolean; }

function XYChart({ curve, lines = [], stairs, height = 360, title }: {
  curve: Pt[]; lines?: LineDef[]; stairs?: Pt[]; height?: number; title?: string;
}) {
  const W = 480, H = height, PAD = 38;
  const X = (x: number) => PAD + Math.max(0, Math.min(1, x)) * (W - 2 * PAD);
  const Y = (y: number) => H - PAD - Math.max(0, Math.min(1, y)) * (H - 2 * PAD);
  const path = (pts: Pt[]) => pts.map((p, i) => (i === 0 ? 'M' : 'L') + X(p.x).toFixed(1) + ',' + Y(p.y).toFixed(1)).join(' ');
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
      <rect x={PAD - 10} y={10} width={W - 2 * PAD + 20} height={H - PAD + 8} fill="transparent" />
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(0)} stroke="#94a3b8" strokeWidth="1.2" />
      <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1)} stroke="#94a3b8" strokeWidth="1.2" />
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="#cbd5e1" strokeDasharray="5 4" />
      <path d={path(curve)} fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinejoin="round" />
      {lines.map(l => (
        <path key={l.id} d={path(l.pts)} fill="none" stroke={l.color} strokeWidth="2"
          strokeDasharray={l.dashed ? '6 4' : undefined} strokeLinejoin="round" />
      ))}
      {stairs && stairs.length > 1 && (
        <path d={path(stairs)} fill="none" stroke="#0f172a" strokeWidth="1.6" strokeLinejoin="round" opacity="0.85" />
      )}
      {ticks.map(t => (
        <g key={'t' + t}>
          <line x1={X(t)} y1={Y(0)} x2={X(t)} y2={Y(0) + 5} stroke="#94a3b8" />
          <text x={X(t)} y={Y(0) + 17} textAnchor="middle" fontSize="10" fill="#94a3b8">{t.toFixed(1)}</text>
          <line x1={X(0)} y1={Y(t)} x2={X(0) - 5} y2={Y(t)} stroke="#94a3b8" />
          <text x={X(0) - 9} y={Y(t) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{t.toFixed(1)}</text>
        </g>
      ))}
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold">x — liquid mole fraction</text>
      <text x={16} y={H / 2} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="bold" transform={`rotate(-90 16 ${H / 2})`}>y — vapor mole fraction</text>
      {title && <text x={PAD} y={18} fontSize="11" fill="#64748b" fontWeight="bold">{title}</text>}
    </svg>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-surface-500">
      <span className="inline-block w-4" style={{ borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}` }} />
      {label}
    </span>
  );
}
// ─── TAB 3 · x–y VLE DIAGRAM ────────────────────────────────────────────────
function VleCalc() {
  const [compA, setCompA] = useState('Benzene');
  const [compB, setCompB] = useState('Toluene');
  const [P, setP] = useState('760');
  const cA = compOf(compA);
  const cB = compOf(compB);
  const Pv = parseFloat(P);
  const curve = Pv > 0 ? xyCurve(cA, cB, Pv) : [];
  const alphaAt = (x: number) => { const T = bubblePoint(Pv, x, cA, cB); return T !== null ? relVolAt(T, cA, cB) : NaN; };
  const alphaMid = alphaAt(0.5);
  const azeotrope = curve.length > 2 && Math.abs(curve[Math.floor(curve.length / 2)].y - 0.5) > 0.08;
  const compOptions = COMPONENTS.map(c => ({ value: c.name, label: c.name + ' (' + c.symbol + ')' }));
  return (
    <CalcCard title="x–y Equilibrium Diagram & Relative Volatility" icon={ArrowUpDown}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">
        y = x·P₁ˢᵃᵗ(T_bubble)/P evaluated at every x — the further the curve bulges above the diagonal, the easier the separation.
      </p>
      <SelectRow label="Component 1 (light)" value={compA} onChange={setCompA} options={compOptions} />
      <SelectRow label="Component 2 (heavy)" value={compB} onChange={setCompB} options={compOptions} />
      <InputRow label="System pressure" unit="mmHg" value={P} onChange={setP} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
          <XYChart curve={curve} title={`${compA} / ${compB} @ ${Pv > 0 ? Pv.toFixed(0) : '—'} mmHg`} />
          <div className="flex flex-wrap gap-4 mt-3 px-2">
            <LegendDot color="#6366f1" label="Equilibrium y(x)" />
            <LegendDot color="#cbd5e1" label="Diagonal y = x" dashed />
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> Relative Volatility
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ResultBox label="α at x = 0.5" value={fmt(alphaMid, 2)} unit="−" color="#8b5cf6" />
              <ResultBox label="α at x = 0.9" value={fmt(alphaAt(0.9), 2)} unit="−" color="#0ea5e9" />
              <ResultBox label="α at x = 0.1" value={fmt(alphaAt(0.1), 2)} unit="−" color="#f59e0b" />
            </div>
            <p className="text-xs text-surface-500 mt-4 leading-relaxed">
              α = P₁ˢᵃᵗ/P₂ˢᵃᵗ varies with temperature, so the curve is exact rather than the constant-α model. α &gt; 1 means the light key concentrates in the vapor; higher α → fewer stages.
            </p>
          </div>

          <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Equilibrium Table (sample)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-surface-400 text-[10px] uppercase tracking-wider">
                    <th className="text-left py-2 font-black">x</th>
                    <th className="text-left py-2 font-black">y*</th>
                    <th className="text-left py-2 font-black">T_bubble °C</th>
                  </tr>
                </thead>
                <tbody>
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map(x => {
                    const T = bubblePoint(Pv, x, cA, cB);
                    return (
                      <tr key={x} className="border-t border-surface-100 dark:border-surface-800">
                        <td className="py-1.5 font-mono font-bold text-surface-700 dark:text-surface-200">{x.toFixed(1)}</td>
                        <td className="py-1.5 font-mono font-bold text-primary-600">{T !== null ? (x * psat(cA, T) / Pv).toFixed(4) : '—'}</td>
                        <td className="py-1.5 font-mono font-bold text-surface-500">{T !== null ? T.toFixed(2) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {azeotrope && (
              <p className="text-[11px] font-bold text-rose-500 mt-3">⚠ The curve stays close to the diagonal — expect a difficult separation (low α).</p>
            )}
          </div>
        </div>
      </div>
      <InfoNote>
        For ideal mixtures the x–y curve always lies above the diagonal for the light component. If the curve crosses the diagonal you would have an azeotrope — ideal Raoult's law cannot produce one, so a non-ideal activity-coefficient model would be needed.
      </InfoNote>
    </CalcCard>
  );
}
// ─── TAB 5 · Mc CABE–THIELE step-off solver ─────────────────────────────────
interface MtResult {
  alpha: number | null;
  xq: number | null;
  yq: number | null;
  stages: number;
  frac: number;
  stairs: Pt[];
  curve: Pt[];
  rectPts: Pt[];
  stripPts: Pt[];
  qPts: Pt[];
  pinch: boolean;
  Rmin: number | null;
  err?: string;
}

function mtCalc(xD: number, xF: number, xB: number, q: number, R: number, cA: AntoineComp, cB: AntoineComp, P: number): MtResult {
  const bad = (err: string): MtResult => ({
    alpha: null, xq: null, yq: null, stages: 0, frac: 0,
    stairs: [], curve: [], rectPts: [], stripPts: [], qPts: [], pinch: false, Rmin: null, err,
  });
  if (!(xB > 0 && xF > xB && xD > xF && xD < 1)) return bad('Compositions must satisfy 0 < xB < xF < xD < 1.');
  if (R <= 0) return bad('Reflux ratio must be positive.');
  const TbD = bubblePoint(P, xD, cA, cB);
  const TbB = bubblePoint(P, xB, cA, cB);
  if (TbD === null || TbB === null) return bad('Could not evaluate equilibrium — check pressure.');
  const alpha = Math.sqrt(relVolAt(TbD, cA, cB) * relVolAt(TbB, cA, cB));
  if (alpha <= 1) return bad('Relative volatility must exceed 1 — swap the light/heavy components.');

  const yEq = (x: number) => alpha * x / (1 + (alpha - 1) * x);
  const rect = {
    slope: R / (R + 1),
    intercept: xD / (R + 1),
    y: (x: number) => R / (R + 1) * x + xD / (R + 1),
  };
  let xq: number, yq: number;
  if (Math.abs(q - 1) < 1e-4) {
    xq = xF; yq = rect.y(xF);
  } else {
    const slopeQ = q / (q - 1);
    const bQ = -xF / (q - 1);
    xq = (bQ - rect.intercept) / (rect.slope - slopeQ);
    yq = rect.y(xq);
  }
  if (!(xq > xB && xq < xD)) return bad('q-line intersection falls outside the column composition range — adjust q or compositions.');
  const slopeS = (yq - xB) / (xq - xB);
  const bS = xB - slopeS * xB;
  const strip = {
    y: (x: number) => slopeS * x + bS,
  };

  const curve: Pt[] = [];
  for (let i = 0; i <= 60; i++) { const x = i / 60; curve.push({ x, y: yEq(x) }); }
  const rectPts: Pt[] = [{ x: 0, y: rect.intercept }, { x: xD, y: xD }];
  const stripPts: Pt[] = [{ x: xB, y: xB }, { x: xD, y: strip.y(xD) }];
  const qPts: Pt[] = Math.abs(q - 1) < 1e-4
    ? [{ x: xF, y: 0 }, { x: xF, y: 1 }]
    : [{ x: 0, y: -xF / (q - 1) }, { x: 1, y: q / (q - 1) - xF / (q - 1) }];

  // McCabe-Thiele step-off: start at (xD,xD) on the diagonal. Each iteration is
  // one equilibrium stage: horizontal at vapor y to the equilibrium curve,
  // then vertical down to the operating line.
  let x = xD;
  let y = xD; // vapor from total condenser is in equilibrium with top liquid
  const stairs: Pt[] = [{ x: xD, y: xD }];
  let prevX = xD;
  let stages = 0, frac = 0, pinch = false;
  const xEqInv = (yy: number) => yy / (alpha - (alpha - 1) * yy);
  while (x > xB + 1e-6 && stages < 80) {
    // horizontal: liquid x_n in equilibrium with vapor y
    const xn = xEqInv(y);
    if (!isFinite(xn) || xn <= 0 || xn >= x - 1e-9) { pinch = true; break; }
    x = xn;
    stairs.push({ x: xn, y });
    if (xn <= xB + 1e-6) {
      // fractional stage: interpolate how far past xB this step went
      const f = (prevX - xB) / (prevX - xn);
      frac = isFinite(f) && f > 0 ? Math.min(f, 1) : 0;
      break;
    }
    // vertical: operating line at new liquid composition
    const ynext = xn > xq ? rect.y(xn) : strip.y(xn);
    stairs.push({ x: xn, y: ynext });
    prevX = xn;
    y = ynext;
    stages++;
  }
  if (stages >= 80) pinch = true;

  // Underwood Rmin — solves the feed q-line root so it is valid for any q
  const gU = (th: number) => alpha * xF / (alpha - th) + (1 - xF) / (1 - th) - (1 - q);
  const theta = bisect(gU, 1 + 1e-6, alpha - 1e-6);
  const Rmin = theta !== null
    ? alpha * xD / (alpha - theta) + (1 - xD) / (1 - theta) - 1
    : null;
  return { alpha, xq, yq, stages, frac, stairs, curve, rectPts, stripPts, qPts, pinch, Rmin };
}
// ─── TAB 5 · Mc CABE–THIELE UI ──────────────────────────────────────────────
function MtCalc() {
  const [compA, setCompA] = useState('Benzene');
  const [compB, setCompB] = useState('Toluene');
  const [P, setP] = useState('760');
  const [xD, setXD] = useState('0.95');
  const [xF, setXF] = useState('0.5');
  const [xB, setXB] = useState('0.05');
  const [q, setQ] = useState('1');
  const [R, setR] = useState('2.5');
  const cA = compOf(compA);
  const cB = compOf(compB);
  const r = mtCalc(parseFloat(xD), parseFloat(xF), parseFloat(xB), parseFloat(q), parseFloat(R), cA, cB, parseFloat(P));
  const compOptions = COMPONENTS.map(c => ({ value: c.name, label: c.name + ' (' + c.symbol + ')' }));
  const lines: LineDef[] = [
    { id: 'rect', color: '#0ea5e9', pts: r.rectPts },
    { id: 'strip', color: '#f59e0b', pts: r.stripPts },
    { id: 'q', color: '#10b981', pts: r.qPts, dashed: true },
  ];
  const total = r.stages + (r.frac > 0 && !r.pinch ? r.frac : 0);
  return (
    <CalcCard title="McCabe–Thiele Stage-by-Stage" icon={GitBranch}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">
        Step off stages between the equilibrium curve and the operating lines: rectifying y = Rx/(R+1) + xD/(R+1), q-line, stripping line through (xB, xB).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <SelectRow label="Light key" value={compA} onChange={setCompA} options={compOptions} />
          <SelectRow label="Heavy key" value={compB} onChange={setCompB} options={compOptions} />
          <InputRow label="Pressure" unit="mmHg" value={P} onChange={setP} />
        </div>
        <div>
          <InputRow label="Distillate xD" unit="−" value={xD} onChange={setXD} />
          <InputRow label="Feed xF" unit="−" value={xF} onChange={setXF} />
          <InputRow label="Bottoms xB" unit="−" value={xB} onChange={setXB} />
          <InputRow label="Feed quality q" unit="−" value={q} onChange={setQ} />
          <InputRow label="Reflux ratio R" unit="−" value={R} onChange={setR} />
        </div>
      </div>

      {r.err && <WarnNote>{r.err}</WarnNote>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
          <XYChart curve={r.curve} lines={lines} stairs={r.stairs} title={`${compA} / ${compB} — constant α = ${fmt(r.alpha, 3)}`} />
          <div className="flex flex-wrap gap-4 mt-3 px-2">
            <LegendDot color="#6366f1" label="Equilibrium" />
            <LegendDot color="#0ea5e9" label="Rectifying" />
            <LegendDot color="#f59e0b" label="Stripping" />
            <LegendDot color="#10b981" label="q-line" dashed />
            <LegendDot color="#0f172a" label="Stages" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ResultBox label="Theoretical stages" value={r.pinch ? '∞' : String(total > 0 ? total.toFixed(1) : '—')} unit="(incl. reboiler)" color="#8b5cf6" />
            <ResultBox label="Min. reflux Rmin" value={fmt(r.Rmin, 2)} unit="−" color="#0ea5e9" />
            <ResultBox label="Feed intersection" value={`${fmt(r.xq, 3)}, ${fmt(r.yq, 3)}`} unit="xq, yq" color="#f59e0b" />
            <ResultBox label="Relative volatility α" value={fmt(r.alpha, 3)} unit="geometric mean" color="#10b981" />
          </div>
          {r.pinch && !r.err && (
            <WarnNote>The staircase reaches the pinch point — reflux R is at or below Rmin. Increase R (or move q toward 1) to converge.</WarnNote>
          )}
          {!r.pinch && !r.err && r.stages > 0 && (
            <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Stage Summary</h4>
              <StatRow label="Full stages stepped off" value={String(r.stages)} />
              <StatRow label="Partial final stage" value={fmt(r.frac, 2)} sub="fraction of last stage used" />
              <StatRow label="Rectifying section" value={r.xq !== null ? `${r.stages.toFixed(0)} top stages to x = ${r.xq.toFixed(3)}` : '—'} />
              <StatRow label="Rule of thumb R ≈ 1.2–1.5 × Rmin" value={fmt(r.Rmin !== null && r.Rmin > 0 ? r.Rmin * 1.3 : null, 2)} />
            </div>
          )}
          <InfoNote>
            q = 1 → saturated liquid feed (vertical q-line at xF). q &lt; 1 → feed is partially vapor; q &gt; 1 → subcooled liquid. R must stay above Rmin or the operating lines pinch against the equilibrium curve and stages diverge.
          </InfoNote>
        </div>
      </div>
    </CalcCard>
  );
}
// ─── TAB 4 · FUG DISTILLATION DESIGN ────────────────────────────────────────
function FugDesignCalc() {
  const [compA, setCompA] = useState('Benzene');
  const [compB, setCompB] = useState('Toluene');
  const [P, setP] = useState('760');
  const [F, setF] = useState('100');
  const [zF, setZF] = useState('0.5');
  const [xD, setXD] = useState('0.98');
  const [xB, setXB] = useState('0.02');
  const [q, setQ] = useState('1');
  const [R, setR] = useState('2.0');
  const cA = compOf(compA);
  const cB = compOf(compB);
  const Pv = parseFloat(P);
  const TbF = bubblePoint(Pv, parseFloat(zF), cA, cB);
  const alpha = TbF !== null ? relVolAt(TbF, cA, cB) : NaN;
  const r = fugCalc(parseFloat(zF), parseFloat(xD), parseFloat(xB), parseFloat(q), parseFloat(R), alpha);
  const compOptions = COMPONENTS.map(c => ({ value: c.name, label: c.name + ' (' + c.symbol + ')' }));
  const D = r.DOverF * parseFloat(F);
  return (
    <CalcCard title="FUG Shortcut Distillation Design" icon={Columns2}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">
        Fenske (N_min) → Underwood (R_min) → Gilliland (N) → Kirkbride (feed stage). α evaluated at the feed bubble point.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <SelectRow label="Light key" value={compA} onChange={setCompA} options={compOptions} />
          <SelectRow label="Heavy key" value={compB} onChange={setCompB} options={compOptions} />
          <InputRow label="Column pressure" unit="mmHg" value={P} onChange={setP} />
          <InputRow label="Feed rate F" unit="kmol/h" value={F} onChange={setF} />
        </div>
        <div>
          <InputRow label="Feed composition zF (LK)" unit="−" value={zF} onChange={setZF} />
          <InputRow label="Distillate xD (LK)" unit="−" value={xD} onChange={setXD} />
          <InputRow label="Bottoms xB (LK)" unit="−" value={xB} onChange={setXB} />
          <InputRow label="Feed quality q" unit="−" value={q} onChange={setQ} />
          <InputRow label="Reflux ratio R" unit="−" value={R} onChange={setR} />
        </div>
      </div>

      {r.err && <WarnNote>{r.err}</WarnNote>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <ResultBox label="Minimum stages Nmin" value={fmt(r.Nmin, 2)} unit="Fenske" color="#8b5cf6" />
        <ResultBox label="Minimum reflux Rmin" value={fmt(r.Rmin, 2)} unit="Underwood" color="#0ea5e9" />
        <ResultBox label="Actual stages N" value={fmt(r.N, 1)} unit="Gilliland" color="#f59e0b" />
        <ResultBox label="Feed stage (from top)" value={fmt(r.Nfeed, 1)} unit="Kirkbride" color="#10b981" />
      </div>

      <div className="mt-8 glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Material Balance & Shortcut Detail</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <StatRow label="Distillate rate D" value={fmt(isFinite(D) ? D : null, 2, ' kmol/h')} />
          <StatRow label="Bottoms rate B" value={fmt(isFinite(parseFloat(F) - D) ? parseFloat(F) - D : null, 2, ' kmol/h')} />
          <StatRow label="D/F split" value={fmt(r.DOverF, 4)} />
          <StatRow label="Relative volatility α" value={fmt(alpha, 3)} sub="at feed bubble point" />
          <StatRow label="Underwood root θ" value={fmt(r.theta, 4)} />
          <StatRow label="Efficiency note" value={r.N !== null && r.Nmin !== null ? (r.N / r.Nmin).toFixed(2) : '—'} sub="N / Nmin ratio (typical 1.5–2.5)" />
        </div>
      </div>
      <InfoNote>
        Shortcut methods assume constant relative volatility and sharp separations between key components. For a first estimate use R = 1.2–1.5 × Rmin; the Gilliland correlation then estimates total stages with typical accuracy of ±30%.
      </InfoNote>
    </CalcCard>
  );
}
// ─── TAB 6 · ABSORPTION (KREMSER) ───────────────────────────────────────────
function AbsorptionCalc() {
  const [G, setG] = useState('100');
  const [L, setL] = useState('180');
  const [y1, setY1] = useState('0.02');
  const [y2, setY2] = useState('0.002');
  const [x2, setX2] = useState('0');
  const [m, setM] = useState('0.9');
  const Gv = parseFloat(G), Lv = parseFloat(L);
  const y1v = parseFloat(y1), y2v = parseFloat(y2), x2v = parseFloat(x2), mv = parseFloat(m);
  const r = kremserCalc(Gv, Lv, y1v, y2v, x2v, mv);
  return (
    <CalcCard title="Gas Absorption — Kremser Equation" icon={Layers}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">
        Absorption factor A = L/(m·G); theoretical stages N = ln[(y₁−mx₂)/(y₂−mx₂)·(1−1/A) + 1/A] / ln A.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <InputRow label="Inert gas flow G" unit="kmol/h" value={G} onChange={setG} />
          <InputRow label="Solvent flow L" unit="kmol/h" value={L} onChange={setL} />
          <InputRow label="Equilibrium slope m" unit="−" value={m} onChange={setM} />
        </div>
        <div>
          <InputRow label="Solute in gas feed y₁" unit="mole frac" value={y1} onChange={setY1} />
          <InputRow label="Solute in gas outlet y₂" unit="mole frac" value={y2} onChange={setY2} />
          <InputRow label="Solute in solvent feed x₂" unit="mole frac" value={x2} onChange={setX2} />
        </div>
      </div>

      {!r.feasible && y1v > 0 && y2v > 0 && (
        <WarnNote>Feasibility check failed — you need y₂ &gt; m·x₂ and y₁ &gt; y₂ for absorption to proceed (positive driving force at the top).</WarnNote>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <ResultBox label="Absorption factor A" value={fmt(r.A, 3)} unit="L/(mG)" color="#8b5cf6" />
        <ResultBox label="Theoretical stages N" value={r.N !== null ? r.N.toFixed(2) : '—'} unit="Kremser" color="#0ea5e9" />
        <ResultBox label="Min. solvent Lmin" value={fmt(r.Lmin, 2)} unit="kmol/h" color="#f59e0b" />
        <ResultBox label="Solute recovery" value={fmt(r.recovery * 100, 1, '%')} unit="" color="#10b981" />
      </div>

      <div className="mt-8 glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3 flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5" /> Design Guidance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <StatRow label="Operating A rule of thumb" value="1.25 – 2.0" sub="A = L/(mG) for economic design" />
          <StatRow label="Solvent margin vs Lmin" value={fmt(r.Lmin > 0 ? Lv / r.Lmin : null, 2, '×')} sub="L / Lmin" />
          <StatRow label="Solute absorbed" value={fmt(Gv * (y1v - y2v), 2, ' kmol/h')} />
          <StatRow label="Max. loading in liquid x₁" value={y1v > 0 && mv > 0 ? (Gv * (y1v - y2v) / Lv + x2v).toFixed(4) : '—'} sub="x₁ = G(y₁−y₂)/L + x₂" />
        </div>
      </div>
      <InfoNote>
        A = 1 gives a linear driving-force solution N = (y₁−y₂)/(y₂−mx₂). Raising L above Lmin reduces stages quickly at first, then diminishing returns — the classic absorber design trade-off.
      </InfoNote>
    </CalcCard>
  );
}

// ─── TAB 7 · VESSEL VOLUME & CURVED HEAD GEOMETRY ────────────────────────────
function VesselVolumeHeadCalc() {
  const [headType, setHeadType] = useState<'ellipsoidal' | 'hemispherical' | 'torispherical'>('ellipsoidal');
  const [diameter, setDiameter] = useState('2.0'); // m
  const [length, setLength] = useState('6.0');   // m
  const [fillHeight, setFillHeight] = useState('1.2'); // m

  const D = parseFloat(diameter), L = parseFloat(length), h = parseFloat(fillHeight);
  const R = D / 2;

  let V_shell = NaN;
  let V_head_single = NaN;
  let V_total = NaN;
  let V_liquid = NaN;
  let liquidPercent = NaN;

  if (!isNaN(D) && !isNaN(L) && D > 0 && L > 0 && !isNaN(h) && h >= 0 && h <= D) {
    V_shell = Math.PI * R * R * L; // m^3

    if (headType === 'ellipsoidal') {
      V_head_single = (Math.PI / 24) * Math.pow(D, 3); // 2:1 Ellipsoidal
    } else if (headType === 'hemispherical') {
      V_head_single = (Math.PI / 12) * Math.pow(D, 3); // Hemispherical
    } else {
      V_head_single = 0.0847 * Math.pow(D, 3); // Torispherical (Klopper)
    }

    V_total = V_shell + 2 * V_head_single;

    // Partial fill in horizontal cylindrical shell
    // Area of circular segment = R^2 * acos((R-h)/R) - (R-h)*sqrt(2Rh - h^2)
    const term = (R - h) / R;
    const clampedTerm = Math.max(-1, Math.min(1, term));
    const A_segment = R * R * Math.acos(clampedTerm) - (R - h) * Math.sqrt(Math.max(0, 2 * R * h - h * h));
    const V_shell_liquid = A_segment * L;

    // Partial volume in curved 2:1 ellipsoidal head caps
    // V_head_partial(h) = V_head * (3*(h/D)^2 - 2*(h/D)^3)
    const h_ratio = h / D;
    const V_head_partial = V_head_single * (3 * h_ratio * h_ratio - 2 * Math.pow(h_ratio, 3));

    V_liquid = V_shell_liquid + 2 * V_head_partial;
    liquidPercent = (V_liquid / V_total) * 100;
  }

  return (
    <CalcCard title="Horizontal Vessel Inventory & Curved Head Volume" icon={Gauge}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Partial fill liquid holdup integration for horizontal vessels with 2:1 Ellipsoidal, Hemispherical & Torispherical heads.</p>
      
      <div className="mb-8">
        <label className="block text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Head Geometry</label>
        <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl w-fit">
          {(['ellipsoidal', 'hemispherical', 'torispherical'] as const).map(t => (
            <button key={t} onClick={() => setHeadType(t)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${headType === t ? 'bg-surface-50 dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}>
              {t === 'ellipsoidal' ? '2:1 Ellipsoidal' : t === 'hemispherical' ? 'Hemispherical' : 'Torispherical (Klopper)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <InputRow label="Vessel Diameter (D)" unit="m" value={diameter} onChange={setDiameter} />
        <InputRow label="Cylinder Length (L)" unit="m" value={length} onChange={setLength} />
        <InputRow label="Liquid Fill Height (h)" unit="m" value={fillHeight} onChange={setFillHeight} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ResultBox label="Total Vessel Capacity" value={isNaN(V_total) ? '--' : V_total.toFixed(2)} unit="m³" color="#6366f1" />
        <ResultBox label="Liquid Inventory" value={isNaN(V_liquid) ? '--' : V_liquid.toFixed(2)} unit="m³" color="#3b82f6" />
        <ResultBox label="Liquid Holdup Ratio" value={isNaN(liquidPercent) ? '--' : liquidPercent.toFixed(1)} unit="%" color="#10b981" />
        <ResultBox label="Cap Vol. (Both Heads)" value={isNaN(V_head_single) ? '--' : (2 * V_head_single).toFixed(3)} unit="m³" color="#f59e0b" />
      </div>
    </CalcCard>
  );
}

// ─── TAB 8 · PONCHON-SAVARIT ENTHALPY-CONCENTRATION DISTILLATION ───────────
function PonchonSavaritCalc() {
  const [xD_val, setXDVal] = useState('0.95');
  const [xF_val, setXFVal] = useState('0.45');
  const [xW_val, setXWVal] = useState('0.05');
  const [refluxR, setRefluxR] = useState('2.5');
  const [feedF, setFeedF] = useState('100'); // kmol/h
  const [hLatent1, setHLatent1] = useState('38.5'); // kJ/mol (Light)
  const [hLatent2, setHLatent2] = useState('40.6'); // kJ/mol (Heavy)

  const xD = parseFloat(xD_val), xF = parseFloat(xF_val), xW = parseFloat(xW_val);
  const R = parseFloat(refluxR), F = parseFloat(feedF);
  const dh1 = parseFloat(hLatent1), dh2 = parseFloat(hLatent2);

  let D_rate = NaN, W_rate = NaN, Qc_duty = NaN, Qr_duty = NaN;
  let q_delta_top = NaN;

  if (!isNaN(xD) && !isNaN(xF) && !isNaN(xW) && xD > xF && xF > xW && !isNaN(R) && R > 0 && !isNaN(F) && F > 0) {
    // Overall mole balance: F = D + W => D = F * (xF - xW) / (xD - xW)
    D_rate = F * (xF - xW) / (xD - xW);
    W_rate = F - D_rate;

    // Enthalpy parameters at top stage
    const hD_liquid = 15.0; // kJ/mol
    const H1_vap = hD_liquid + (xD * dh1 + (1 - xD) * dh2);
    
    // Top difference pole Q_delta = H_D + (R + 1)*(H_D - h_D)
    q_delta_top = hD_liquid + (R + 1) * (H1_vap - hD_liquid);
    
    // Condenser duty Qc = D * (q_delta - h_D) (MJ/h)
    Qc_duty = (D_rate * (q_delta_top - hD_liquid)) / 1000;

    // Reboiler duty Qr from overall heat balance (MJ/h)
    const hF_feed = 25.0; // kJ/mol
    const hW_bottom = 35.0; // kJ/mol
    Qr_duty = (D_rate * q_delta_top + W_rate * hW_bottom - F * hF_feed) / 1000;
  }

  return (
    <CalcCard title="Ponchon-Savarit Rigorous Enthalpy-Concentration Distillation" icon={Columns2}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Enthalpy-concentration (H-x-y) pole analysis eliminating Constant Molal Overflow (CMO) assumptions.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <InputRow label="Feed Composition (x_F)" unit="mol/mol" value={xF_val} onChange={setXFVal} />
          <InputRow label="Distillate Spec (x_D)" unit="mol/mol" value={xD_val} onChange={setXDVal} />
          <InputRow label="Bottoms Spec (x_W)" unit="mol/mol" value={xW_val} onChange={setXWVal} />
          <InputRow label="Reflux Ratio (R)" unit="" value={refluxR} onChange={setRefluxR} />
        </div>
        <div className="space-y-4">
          <InputRow label="Feed Rate (F)" unit="kmol/h" value={feedF} onChange={setFeedF} />
          <InputRow label="Light Latent Heat (ΔH₁)" unit="kJ/mol" value={hLatent1} onChange={setHLatent1} />
          <InputRow label="Heavy Latent Heat (ΔH₂)" unit="kJ/mol" value={hLatent2} onChange={setHLatent2} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ResultBox label="Distillate Rate (D)" value={isNaN(D_rate) ? '--' : D_rate.toFixed(2)} unit="kmol/h" color="#6366f1" />
        <ResultBox label="Bottoms Rate (W)" value={isNaN(W_rate) ? '--' : W_rate.toFixed(2)} unit="kmol/h" color="#3b82f6" />
        <ResultBox label="Condenser Duty (Q_C)" value={isNaN(Qc_duty) ? '--' : Qc_duty.toFixed(2)} unit="MJ/h" color="#10b981" />
        <ResultBox label="Reboiler Duty (Q_R)" value={isNaN(Qr_duty) ? '--' : Qr_duty.toFixed(2)} unit="MJ/h" color="#f59e0b" />
      </div>
    </CalcCard>
  );
}

// ─── Module shell & tabs ─────────────────────────────────────────────────────
const TABS = [
  { id: 'bubble-dew', label: 'Bubble & Dew', icon: Thermometer },
  { id: 'flash', label: 'Flash', icon: Droplets },
  { id: 'vle', label: 'x–y VLE', icon: ArrowUpDown },
  { id: 'fug', label: 'FUG Design', icon: Columns2 },
  { id: 'mt', label: 'McCabe–Thiele', icon: GitBranch },
  { id: 'ponchon-savarit', label: 'Ponchon-Savarit H-x-y', icon: Columns2 },
  { id: 'absorption', label: 'Absorption', icon: Layers },
  { id: 'vessel', label: 'Vessel & Heads', icon: Gauge },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function SeparationProcessesModule() {
  const [tab, setTab] = useState<TabId>('bubble-dew');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 text-surface-50 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Columns2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50">Separation Processes & Mechanical Operations</h1>
            <p className="text-sm text-surface-500">Ponchon-Savarit H-x-y distillation, McCabe-Thiele, FUG, flash, absorption, and horizontal vessel curved head inventory calculations.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-6">
          {TABS.map(t => {
            const TabIcon = t.icon;
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                  ? 'bg-primary-600 text-surface-50 shadow-lg shadow-primary-500/25'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-primary-600'}`}>
                <TabIcon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {tab === 'bubble-dew' && <BubbleDewCalc />}
      {tab === 'flash' && <FlashCalc />}
      {tab === 'vle' && <VleCalc />}
      {tab === 'fug' && <FugDesignCalc />}
      {tab === 'mt' && <MtCalc />}
      {tab === 'ponchon-savarit' && <PonchonSavaritCalc />}
      {tab === 'absorption' && <AbsorptionCalc />}
      {tab === 'vessel' && <VesselVolumeHeadCalc />}
    </div>
  );
}
