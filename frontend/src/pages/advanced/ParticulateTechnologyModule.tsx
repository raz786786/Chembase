import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Grid3x3, Boxes, Waves, Wind, Filter,
  Info
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── Formatting helpers ─────────────────────────────────────────────────────
function fmt(v: number | null | undefined, digits = 3, suffix = ''): string {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return v.toFixed(digits) + suffix;
}
function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}

// ─── Minimal SVG chart (log-x line + bars) ──────────────────────────────────
interface Pt { x: number; y: number; }
function Plot2D({ line, bars, logX, xLabel, yLabel, height = 210 }: {
  line?: Pt[]; bars?: Pt[]; logX?: boolean; xLabel?: string; yLabel?: string; height?: number;
}) {
  const W = 640, H = height, ml = 46, mr = 12, mt = 12, mb = 30;
  const iw = W - ml - mr, ih = H - mt - mb;
  const xs = (line ?? []).concat(bars ?? []).map(p => p.x);
  const ys = (line ?? []).concat(bars ?? []).map(p => p.y);
  if (!xs.length) return <div className="text-xs text-slate-400 py-8 text-center">No data yet.</div>;
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y1 = Math.max(...ys, 1e-9) * 1.1;
  const logSpan = x1 > x0 ? Math.log(x1 / x0) : 1;
  const sx = (x: number) => ml + (logX ? Math.log(x / x0) / logSpan : (x - x0) / (x1 - x0 || 1)) * iw;
  const sy = (y: number) => mt + ih - (y / y1) * ih;
  const nTicks = 5;
  const ticks: { v: number; t: string }[] = [];
  for (let i = 0; i <= nTicks; i++) {
    const v = y1 * i / nTicks;
    ticks.push({ v, t: v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : v.toFixed(v < 10 ? 1 : 0) });
  }
  const xTicks: { v: number; t: string }[] = [];
  for (let i = 0; i <= 5; i++) {
    const f = i / 5;
    const v = logX ? x0 * Math.pow(x1 / x0, f) : x0 + (x1 - x0) * f;
    xTicks.push({ v, t: v >= 1000 ? Math.round(v / 1000) + 'k' : v >= 10 ? v.toFixed(0) : v.toFixed(1) });
  }
  const path = (line ?? []).map((p, i) => (i ? 'L' : 'M') + sx(p.x).toFixed(1) + ' ' + sy(p.y).toFixed(1)).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {ticks.map((t, i) => (
        <g key={'y' + i}>
          <line x1={ml} x2={W - mr} y1={sy(t.v)} y2={sy(t.v)} stroke="currentColor" strokeOpacity="0.08" />
          <text x={ml - 6} y={sy(t.v) + 3} textAnchor="end" className="fill-slate-400 text-[9px] font-bold">{t.t}</text>
        </g>
      ))}
      {xTicks.map((t, i) => (
        <g key={'x' + i}>
          <line x1={sx(t.v)} x2={sx(t.v)} y1={mt + ih} y2={mt + ih + 4} stroke="currentColor" strokeOpacity="0.2" />
          <text x={sx(t.v)} y={H - 10} textAnchor="middle" className="fill-slate-400 text-[9px] font-bold">{t.t}</text>
        </g>
      ))}
      {(bars ?? []).map((b, i) => (
        <rect key={'b' + i} x={sx(b.x) - 6} y={sy(b.y)} width={12} height={mt + ih - sy(b.y)}
          rx={2} className="fill-violet-400/50" />
      ))}
      {line && <path d={path} fill="none" className="stroke-violet-500" strokeWidth="2.4" strokeLinejoin="round" />}
      {(line ?? []).map((p, i) => (
        <circle key={'p' + i} cx={sx(p.x)} cy={sy(p.y)} r="3" className="fill-violet-600" />
      ))}
      {xLabel && <text x={ml + iw / 2} y={H - 2} textAnchor="middle" className="fill-slate-400 text-[9px] font-bold">{xLabel}</text>}
      {yLabel && <text x={12} y={mt + ih / 2} textAnchor="middle" transform={`rotate(-90 12 ${mt + ih / 2})`} className="fill-slate-400 text-[9px] font-bold">{yLabel}</text>}
    </svg>
  );
}
// ─── Particle size distribution (sieve analysis) ─────────────────────────────
// Standard ASTM/Tyler sieve apertures (μm) — the mesh number ↔ opening table.
const MESH_APERTURE: [number, number][] = [
  [4, 4760], [6, 3360], [8, 2380], [10, 1680], [14, 1190], [20, 840],
  [28, 590], [35, 420], [48, 297], [65, 210], [100, 149], [150, 105],
  [200, 74], [270, 53], [325, 44], [400, 37],
];
const DEFAULT_MESHES = [20, 28, 35, 48, 65, 100, 150, 200];
const DEFAULT_MASSES: Record<number, number> = { 20: 4, 28: 14, 35: 26, 48: 34, 65: 22, 100: 12, 150: 6, 200: 3 };

interface PsdRow { mesh: number; aperture: number; mass: number; }
interface PsdResult {
  rows: PsdRow[];
  total: number;
  passing: { aperture: number; pass: number }[]; // cumulative % finer vs aperture (log-x)
  d10: number | null; d50: number | null; d60: number | null; d90: number | null;
  d32: number | null; span: number | null; cu: number | null;
}

function psdPercentile(pts: { aperture: number; pass: number }[], target: number): number | null {
  // pts sorted by aperture ascending; pass ascending; interpolate in log(size)
  if (!pts.length) return null;
  if (target <= pts[0].pass) return pts[0].aperture;
  if (target >= pts[pts.length - 1].pass) return pts[pts.length - 1].aperture;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].pass >= target) {
      const a = pts[i - 1], b = pts[i];
      const f = (target - a.pass) / (b.pass - a.pass || 1);
      return Math.exp(Math.log(a.aperture) + f * (Math.log(b.aperture) - Math.log(a.aperture)));
    }
  }
  return pts[pts.length - 1].aperture;
}

function psdAnalysis(masses: Record<number, number>): PsdResult {
  const rows: PsdRow[] = DEFAULT_MESHES.map(m => ({
    mesh: m,
    aperture: MESH_APERTURE.find(x => x[0] === m)?.[1] ?? 0,
    mass: Math.max(0, masses[m] ?? 0),
  })).filter(r => r.aperture > 0).sort((a, b) => a.aperture - b.aperture);
  const total = rows.reduce((s, r) => s + r.mass, 0);
  const pass: { aperture: number; pass: number }[] = [];
  if (total > 0) {
    let cum = 0;
    for (const r of [...rows].reverse()) {
      cum += r.mass;
      pass.push({ aperture: r.aperture, pass: 100 * (1 - cum / total) });
    }
    pass.reverse();
  }
  const d10 = psdPercentile(pass, 10);
  const d50 = psdPercentile(pass, 50);
  const d60 = psdPercentile(pass, 60);
  const d90 = psdPercentile(pass, 90);
  // Sauter mean: d32 = Σw / Σ(w/d̄) with d̄ the geometric mean of class boundaries
  let sW = 0, sWd = 0;
  for (let i = 0; i < rows.length; i++) {
    const w = rows[i].mass;
    if (w <= 0) continue;
    const lower = i + 1 < rows.length ? rows[i + 1].aperture : rows[i].aperture * 0.7;
    const dm = Math.sqrt(rows[i].aperture * Math.max(lower, 1));
    sW += w; sWd += w / dm;
  }
  const d32 = sWd > 0 ? sW / sWd : null;
  const span = d10 && d50 && d90 ? (d90 - d10) / d50 : null;
  const cu = d10 !== null && d60 !== null ? d60 / d10 : null;
  return { rows, total, passing: pass, d10, d50, d60, d90, d32, span, cu };
}

// TAB 1 · PARTICLE SIZE & SIEVE ANALYSIS
function PSDTab() {
  const [masses, setMasses] = useState<Record<number, number>>({ ...DEFAULT_MASSES });
  const [showPass, setShowPass] = useState(true);
  const r = psdAnalysis(masses);
  const setM = (mesh: number, v: string) => setMasses(prev => ({ ...prev, [mesh]: parseFloat(v) || 0 }));
  const bars = r.rows.filter(x => x.mass > 0).map(x => ({ x: x.aperture, y: x.mass }));
  const line = r.passing.map(p => ({ x: p.aperture, y: p.pass }));
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Sieve analysis input" icon={Grid3x3}>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Mass retained per sieve (g)</p>
        <div className="space-y-2 mb-4">
          {r.rows.map(row => (
            <div key={row.mesh} className="flex items-center gap-3">
              <span className="w-24 text-xs font-bold text-slate-500 dark:text-slate-400">No. {row.mesh}</span>
              <span className="w-24 text-[10px] font-black text-slate-400">{row.aperture} μm</span>
              <input type="number" value={masses[row.mesh] ?? 0} onChange={e => setM(row.mesh, e.target.value)}
                className="flex-grow px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMasses({ ...DEFAULT_MASSES })}
            className="px-4 py-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300 text-[10px] font-black hover:bg-violet-500/20 transition-colors">
            Reset preset
          </button>
          <button onClick={() => setShowPass(p => !p)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {showPass ? 'Hide passing %' : 'Show passing %'}
          </button>
        </div>
        <InfoNote>Sieve numbers follow ASTM E11: No. 200 = 74 μm, No. 100 = 149 μm, No. 48 = 297 μm… Every sieve retains everything coarser than its opening.</InfoNote>
      </CalcCard>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <ResultBox label="d₁₀" value={fmt(r.d10, 0, ' μm')} unit="10% finer" color="#8b5cf6" />
          <ResultBox label="d₅₀ (median)" value={fmt(r.d50, 0, ' μm')} unit="50% finer" color="#6366f1" />
          <ResultBox label="d₉₀" value={fmt(r.d90, 0, ' μm')} unit="90% finer" color="#a78bfa" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ResultBox label="Sauter mean d₃₂" value={fmt(r.d32, 0, ' μm')} unit="surface/volume" color="#8b5cf6" />
          <ResultBox label="Span" value={fmt(r.span, 2)} unit="(d₉₀−d₁₀)/d₅₀" color="#6366f1" />
          <ResultBox label="Uniformity Cu" value={fmt(r.cu, 2)} unit="d₆₀ / d₁₀" color="#a78bfa" />
          <ResultBox label="Sample mass" value={fmt(r.total, 1, ' g')} unit="retained" color="#8b5cf6" />
        </div>
        <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Grid3x3 className="w-4 h-4 text-violet-500" /> Sieve-analysis graph · log aperture
          </h3>
          {showPass
            ? <Plot2D line={line} bars={bars} logX xLabel="Aperture (μm)" yLabel="mass / % passing" />
            : <Plot2D bars={bars} logX xLabel="Aperture (μm)" yLabel="mass retained (g)" />}
          <p className="text-[10px] text-slate-400 mt-2">Bars = mass retained on each sieve; violet line = cumulative % passing (finer than).</p>
        </div>
      </div>
    </div>
  );
}
// ─── Size reduction: Bond / Rittinger / Kick laws ────────────────────────────
// Bond: W = 10·Wi·(1/√P80 − 1/√F80), kWh/t; F80/P80 in μm.
function bondEnergy(F80: number, P80: number, Wi: number): number | null {
  if (F80 <= 0 || P80 <= 0 || F80 <= P80) return null;
  return 10 * Wi * (1 / Math.sqrt(P80) - 1 / Math.sqrt(F80));
}
// Rittinger: W = KR·(1/P − 1/F) — energy ∝ new surface area.
function rittingerEnergy(F: number, P: number, KR: number): number | null {
  if (F <= 0 || P <= 0 || F <= P) return null;
  return KR * (1 / P - 1 / F);
}
// Kick: W = KK·ln(F/P) — energy ∝ size reduction ratio (log).
function kickEnergy(F: number, P: number, KK: number): number | null {
  if (F <= 0 || P <= 0 || F <= P) return null;
  return KK * Math.log(F / P);
}
// Ball mill critical speed (rpm): Nc = 42.3/√D, D in metres.
function ballMillCriticalSpeed(D: number): number | null {
  if (D <= 0) return null;
  return 42.3 / Math.sqrt(D);
}
// Ball mill power (Bond-based estimate, kW): P = W·Q/3600·1000 … W in kWh/t, Q in t/h.

// TAB 2 · SIZE REDUCTION
const BOND_MATERIALS = [
  { name: 'Limestone', wi: 12.7 }, { name: 'Quartz', wi: 13.6 }, { name: 'Bauxite', wi: 9.0 },
  { name: 'Coal (anthracite)', wi: 16.0 }, { name: 'Cement clinker', wi: 13.5 }, { name: 'Gypsum', wi: 8.2 },
];
function SizeReductionTab() {
  const [mat, setMat] = useState(0);
  const [F80, setF80] = useState('20000');
  const [P80, setP80] = useState('200');
  const [Q, setQ] = useState('100');
  const [D, setD] = useState('2.4');
  const [jawGape, setJawGape] = useState('1000');
  const [jawSet, setJawSet] = useState('150');
  const m = BOND_MATERIALS[mat];
  const Fv = parseFloat(F80) || 0, Pv = parseFloat(P80) || 0;
  const Wi = m.wi;
  const E = bondEnergy(Fv, Pv, Wi);
  const KR = Wi * 10;   // heuristic: Rittinger const ≈ 10·Wi
  const KK = Wi * 7;    // heuristic: Kick const ≈ 7·Wi
  const Er = rittingerEnergy(Fv, Pv, KR);
  const Ek = kickEnergy(Fv, Pv, KK);
  const RR = Fv > 0 && Pv > 0 && Fv > Pv ? Fv / Pv : null;
  const millPower = E !== null ? E * (parseFloat(Q) || 0) : null;
  const Nc = ballMillCriticalSpeed(parseFloat(D) || 0);
  const Gv = parseFloat(jawGape) || 0, Sv = parseFloat(jawSet) || 0;
  const jrr = Gv > 0 && Sv > 0 && Gv > Sv ? Gv / Sv : null;
  // empirical jaw crusher capacity: Q ≈ 0.6·G·S (G,S in cm, medium rock)
  const jcap = Gv > 0 && Sv > 0 ? 0.6 * (Gv / 10) * (Sv / 10) * 1000 : null; // kg/h scale
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Bond work index · ball mill" icon={Boxes}>
        <div className="flex flex-wrap gap-2 mb-5">
          {BOND_MATERIALS.map((b, i) => (
            <button key={b.name} onClick={() => setMat(i)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${mat === i
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/40'}`}>
              {b.name} · {b.wi}
            </button>
          ))}
        </div>
        <InputRow label="Feed F80" unit="μm" value={F80} onChange={setF80} />
        <InputRow label="Product P80" unit="μm" value={P80} onChange={setP80} />
        <InputRow label="Throughput" unit="t/h" value={Q} onChange={setQ} />
        <InputRow label="Mill diameter" unit="m" value={D} onChange={setD} />
        <div className="grid grid-cols-2 gap-3 mt-2">
          <ResultBox label="Bond energy" value={fmt(E, 2, ' kWh/t')} unit="W = 10·Wi(1/√P80−1/√F80)" color="#8b5cf6" />
          <ResultBox label="Mill power" value={fmt(millPower, 0, ' kW')} unit="E × throughput" color="#6366f1" />
          <ResultBox label="Reduction ratio" value={fmt(RR, 0, '×')} unit="F80 / P80" color="#a78bfa" />
          <ResultBox label="Critical speed" value={fmt(Nc, 1, ' rpm')} unit="Nc = 42.3/√D" color="#8b5cf6" />
        </div>
        <InfoNote>Bond's third law is the standard mill-sizing tool: Wi (work index, kWh/t) is a material property — quartz ≈ 13.6, coal ≈ 16. Operating ball mills run at 60–75% of critical speed.</InfoNote>
      </CalcCard>

      <div className="space-y-6">
        <CalcCard title="Rittinger vs Kick comparison" icon={Boxes}>
          <div className="grid grid-cols-3 gap-3">
            <ResultBox label="Bond" value={fmt(E, 2, ' kWh/t')} unit="3rd law" color="#8b5cf6" />
            <ResultBox label="Rittinger" value={fmt(Er, 2, ' kWh/t')} unit="∝ new surface" color="#6366f1" />
            <ResultBox label="Kick" value={fmt(Ek, 2, ' kWh/t')} unit="∝ ln(F/P)" color="#a78bfa" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Rittinger & Kick constants shown are illustrative (scaled from Wi) so the three laws are comparable — real values need lab calibration.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            All three predict <b className="text-slate-700 dark:text-slate-200">{fmt(RR, 0, '×')}</b> reduction from {fmt(Fv, 0, ' μm')} to {fmt(Pv, 0, ' μm')}. Rittinger (1887) suits fine grinding (surface area dominates), Kick (1885) suits coarse crushing (volume dominates); Bond (1952) is the accepted middle ground for most industrial mills.
          </p>
        </CalcCard>
        <CalcCard title="Jaw crusher" icon={Boxes}>
          <InputRow label="Gape (feed opening)" unit="mm" value={jawGape} onChange={setJawGape} />
          <InputRow label="Set (discharge opening)" unit="mm" value={jawSet} onChange={setJawSet} />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <ResultBox label="Reduction ratio" value={fmt(jrr, 1, '×')} unit="gape / set" color="#8b5cf6" />
            <ResultBox label="Capacity est." value={fmt(jcap, 0, ' kg/h')} unit="0.6·G·S (cm)" color="#6366f1" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            <span>With the feed rate at <b className="text-slate-700 dark:text-slate-200">150 t/h</b>, the crusher must swallow particles up to the gape ({fmt(Gv, 0, ' mm')}) and discharge below the set ({fmt(Sv, 0, ' mm')}). Typical primary crushers run ratios of 4:1 to 8:1.</span>
          </p>
        </CalcCard>
      </div>
    </div>
  );
}
// ─── Sedimentation: terminal settling velocity ───────────────────────────────
// Stokes: vt = d²(ρp−ρf)g / (18μ), valid for Re < ~0.3. Beyond Stokes we iterate
// with the standard drag-curve correlations (Allen / Newton regimes).
function dragCoeff(Re: number): number {
  if (Re < 0.3) return 24 / Re;
  if (Re < 1000) return 18.5 / Math.pow(Re, 0.6);
  return 0.44;
}

function terminalVelocity(d: number, rhoP: number, rhoF: number, mu: number): {
  vt: number | null; Re: number | null; regime: string; stokesOk: boolean;
} {
  const g = 9.81;
  if (d <= 0 || rhoP <= rhoF || mu <= 0) return { vt: null, Re: null, regime: '—', stokesOk: false };
  // start from Stokes estimate, then fixed-point iterate the general drag law
  let vt = (d * d) * (rhoP - rhoF) * g / (18 * mu);
  for (let i = 0; i < 80; i++) {
    const Re = rhoF * vt * d / mu;
    const Cd = dragCoeff(Re);
    const vtNew = Math.sqrt(4 * d * (rhoP - rhoF) * g / (3 * Cd * rhoF));
    if (Math.abs(vtNew - vt) / Math.max(vtNew, 1e-12) < 1e-7) { vt = vtNew; break; }
    vt = vtNew;
  }
  const Re = rhoF * vt * d / mu;
  const regime = Re < 0.3 ? 'Stokes' : Re < 1000 ? 'Allen (intermediate)' : 'Newton (turbulent)';
  return { vt, Re, regime, stokesOk: Re < 0.3 };
}

// hindered settling (Richardson–Zaki): vt,ε = vt·(1−ε)^n, n≈4.7 for Re→0
function hinderedVelocity(vt: number, eps: number, n = 4.7): number {
  return vt * Math.pow(1 - eps, n);
}

// TAB 3 · SEDIMENTATION & THICKENING
const SED_FLUIDS = [
  { name: 'Water @ 20°C', rho: 998, mu: 0.001002 },
  { name: 'Water @ 80°C', rho: 972, mu: 0.000355 },
  { name: 'Air @ 20°C', rho: 1.204, mu: 0.0000181 },
  { name: 'Oil (SAE 30)', rho: 880, mu: 0.44 },
];
function SedimentationTab() {
  const [fluid, setFluid] = useState(0);
  const [d, setD] = useState('120');
  const [rhoP, setRhoP] = useState('2650');
  const [height, setHeight] = useState('2');
  const [eps, setEps] = useState('0.6');
  const fl = SED_FLUIDS[fluid];
  const dM = (parseFloat(d) || 0) * 1e-6;
  const rp = parseFloat(rhoP) || 0;
  const res = terminalVelocity(dM, rp, fl.rho, fl.mu);
  const tSettle = res.vt !== null && (parseFloat(height) || 0) > 0 ? (parseFloat(height) || 0) / res.vt : null;
  const vHind = res.vt !== null ? hinderedVelocity(res.vt, Math.min(0.99, Math.max(0, parseFloat(eps) || 0))) : null;
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Terminal settling velocity" icon={Waves}>
        <div className="flex flex-wrap gap-2 mb-5">
          {SED_FLUIDS.map((f, i) => (
            <button key={f.name} onClick={() => setFluid(i)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${fluid === i
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/40'}`}>
              {f.name}
            </button>
          ))}
        </div>
        <InputRow label="Particle diameter" unit="μm" value={d} onChange={setD} />
        <InputRow label="Particle density" unit="kg/m³" value={rhoP} onChange={setRhoP} />
        <InputRow label="Settling height" unit="m" value={height} onChange={setHeight} />
        <InputRow label="Solids volume fraction" unit="ε" value={eps} onChange={setEps} />
        <div className="grid grid-cols-2 gap-3 mt-2">
          <ResultBox label="Terminal velocity" value={fmt(res.vt !== null ? res.vt * 100 : null, 3, ' cm/s')} unit="vt" color="#8b5cf6" />
          <ResultBox label="Reynolds number" value={fmt(res.Re, 1)} unit="Re = ρf·vt·d/μ" color="#6366f1" />
          <ResultBox label="Regime" value={res.regime} unit="drag law" color="#a78bfa" />
          <ResultBox label="Settling time" value={tSettle !== null ? fmt(tSettle, 1, ' s') : '—'} unit="H / vt" color="#8b5cf6" />
        </div>
        <InfoNote>
          Stokes' law ({'{'}vt = d²(ρp−ρf)g/18μ{'}'}) assumes creeping flow, Re &lt; 0.3. Above that the code iterates the full drag curve (Cd = 24/Re → 18.5/Re^0.6 → 0.44) so the answer stays valid into the Allen and Newton regimes.
        </InfoNote>
      </CalcCard>

      <div className="space-y-6">
        <CalcCard title="Hindered settling · thickening" icon={Waves}>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            In a thickener the slurry is dense, so particles slow each other down. Richardson–Zaki: <b className="text-slate-700 dark:text-slate-200">v = vt·(1−ε)^n</b> with n ≈ 4.7 in the Stokes regime.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <ResultBox label="Free settling" value={fmt(res.vt !== null ? res.vt * 100 : null, 3, ' cm/s')} unit="ε → 0" color="#8b5cf6" />
            <ResultBox label="Hindered" value={fmt(vHind !== null ? vHind * 100 : null, 3, ' cm/s')} unit={`ε = ${fmt(parseFloat(eps) || 0, 2)}`} color="#6366f1" />
            <ResultBox label="Slowdown" value={res.vt !== null && vHind !== null ? fmt(100 * (1 - vHind / res.vt), 0, '%') : '—'} unit="vs free" color="#a78bfa" />
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Thickeners exploit this: they run at high solids so the clarified overflow rises slowly and the underflow leaves as a dense sludge. The area needed scales with feed rate ÷ settling velocity.
          </p>
        </CalcCard>
        <CalcCard title="Settling regimes" icon={Waves}>
          <div className="space-y-2">
            {[
              ['Re < 0.3', 'Stokes', 'Drag = 24/Re. Fine dust, viscous liquids. vt ∝ d².'],
              ['0.3 < Re < 1000', 'Allen', 'Intermediate law Cd = 18.5/Re^0.6. Typical mineral slurries.'],
              ['Re > 1000', 'Newton', 'Turbulent, Cd ≈ 0.44. Large pebbles, fast fall.'],
            ].map(([r, n, t]) => (
              <div key={n} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-start gap-3">
                <span className="text-[10px] font-black text-violet-600 bg-violet-500/10 rounded-lg px-2 py-1 w-28 text-center flex-shrink-0">{r}</span>
                <div>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200">{n}</p>
                  <p className="text-[11px] text-slate-400">{t}</p>
                </div>
              </div>
            ))}
          </div>
        </CalcCard>
      </div>
    </div>
  );
}
// ─── Cyclone separators ──────────────────────────────────────────────────────
// Lapple cut size: d50 = √(9·μ·Wc / (2π·N·vt·(ρp−ρf))), Wc = inlet width (m),
// N = effective number of turns (≈5 for a standard cyclone).
function cycloneD50(Wc: number, vt: number, mu: number, rhoP: number, rhoF: number, N = 5): number | null {
  const denom = 2 * Math.PI * N * vt * (rhoP - rhoF);
  if (denom <= 0 || Wc <= 0) return null;
  return Math.sqrt(9 * mu * Wc / denom);
}
// Lapple fractional efficiency: η(d) = 1 / (1 + (d50/d)²)
function cycloneEff(d: number, d50: number): number {
  if (d <= 0) return 0;
  return 1 / (1 + Math.pow(d50 / d, 2));
}
// Pressure drop (Shepherd–Lapple): ΔP = 0.003·(H·W/De²)·(ρ·vt²/2) … simplified
// velocity-head form: ΔP = K·ρ·vt²/2 with K = 8·(H·W/De²)+ … here a practical K≈6.
function cycloneDp(rhoF: number, vt: number, K = 6): number {
  return K * rhoF * vt * vt / 2; // Pa
}

// TAB 4 · CYCLONES & GAS–SOLID SEPARATION
function CycloneTab() {
  const [Wc, setWc] = useState('0.15');
  const [vt, setVt] = useState('15');
  const [rhoP, setRhoP] = useState('2000');
  const [N, setN] = useState('5');
  const [dSample, setDSample] = useState('10');
  const rhoF = 1.2;
  const mu = 1.8e-5;
  const d50 = cycloneD50(parseFloat(Wc) || 0, parseFloat(vt) || 0, mu, parseFloat(rhoP) || 0, rhoF, parseFloat(N) || 5);
  const effCurve: { x: number; y: number }[] = [];
  if (d50) for (let d = 1; d <= 60; d += 1) effCurve.push({ x: d, y: 100 * cycloneEff(d, d50 * 1e6) });
  const effSample = d50 ? 100 * cycloneEff((parseFloat(dSample) || 0) * 1e-6, d50) : null;
  const dp = cycloneDp(rhoF, parseFloat(vt) || 0);
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Lapple cut diameter" icon={Wind}>
        <InputRow label="Inlet width Wc" unit="m" value={Wc} onChange={setWc} />
        <InputRow label="Inlet velocity" unit="m/s" value={vt} onChange={setVt} />
        <InputRow label="Particle density" unit="kg/m³" value={rhoP} onChange={setRhoP} />
        <InputRow label="Effective turns N" unit="—" value={N} onChange={setN} />
        <div className="grid grid-cols-3 gap-3 mt-2">
          <ResultBox label="Cut size d₅₀" value={fmt(d50 !== null ? d50 * 1e6 : null, 1, ' μm')} unit="50% collected" color="#8b5cf6" />
          <ResultBox label="Pressure drop" value={fmt(dp, 0, ' Pa')} unit="K·ρvt²/2" color="#6366f1" />
          <ResultBox label="η at sample d" value={fmt(effSample, 1, '%')} unit={`d = ${fmt(parseFloat(dSample) || 0, 0, ' μm')}`} color="#a78bfa" />
        </div>
        <InputRow label="Sample particle diameter" unit="μm" value={dSample} onChange={setDSample} />
        <InfoNote>Smaller Wc or faster inlet gas → smaller d50 → captures finer dust, but ΔP climbs with vt². This is the classic cyclone design trade-off: efficiency vs pressure drop.</InfoNote>
      </CalcCard>

      <div className="space-y-6">
        <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Wind className="w-4 h-4 text-violet-500" /> Fractional collection efficiency
          </h3>
          <Plot2D line={effCurve} xLabel="Particle diameter (μm)" yLabel="Efficiency (%) · linear-x" />
          <p className="text-[10px] text-slate-400 mt-2">Lapple model: η = 1/(1+(d50/d)²). The S-curve steepens as d50 drops — sharp cut-off means a good separator.</p>
        </div>
        <CalcCard title="Why cyclones work" icon={Wind}>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tangential inlet spins the gas, and centrifugal force ({'{'}F = m·v²/r{'}'}) flings dense particles to the wall, where they slide down to the dust hopper. No moving parts, cheap, robust — but they cannot reach sub-micron collection; that needs bag filters or scrubbers.
          </p>
        </CalcCard>
      </div>
    </div>
  );
}
// ─── Filtration (constant-pressure cake) & fluidization ──────────────────────
// Ruth equation for incompressible cake filtration:
//   t/V = (μ·α·c / (2·A²·ΔP))·V + μ·Rm / (A·ΔP)
// Solve quadratic: a·V² + b·V − t = 0 with a = μ·α·c/(2A²ΔP), b = μ·Rm/(A·ΔP)
function filtrationV(t: number, A: number, dP: number, mu: number, alpha: number, c: number, Rm: number): number | null {
  const a = mu * alpha * c / (2 * A * A * dP);
  const b = mu * Rm / (A * dP);
  if (a <= 0 && b <= 0) return null;
  if (a <= 1e-30) return t / (b || 1); // no cake — medium resistance only
  const disc = b * b + 4 * a * t;
  if (disc < 0) return null;
  return (-b + Math.sqrt(disc)) / (2 * a);
}
function filtrationT(V: number, A: number, dP: number, mu: number, alpha: number, c: number, Rm: number): number | null {
  const a = mu * alpha * c / (2 * A * A * dP);
  const b = mu * Rm / (A * dP);
  return a * V * V + b * V;
}
// Minimum fluidization velocity (Wen–Yu): Re_mf = √(33.7² + 0.0408·Ar) − 33.7
function minFluidizationV(d: number, rhoP: number, rhoF: number, mu: number): number | null {
  const g = 9.81;
  const Ar = d * d * d * rhoF * (rhoP - rhoF) * g / (mu * mu);
  if (Ar <= 0 || mu <= 0) return null;
  const ReMf = Math.sqrt(33.7 * 33.7 + 0.0408 * Ar) - 33.7;
  return ReMf * mu / (rhoF * d);
}

// TAB 5 · FILTRATION & FLUIDIZATION
function FiltrationTab() {
  const [V, setV] = useState('0.5');
  const [A, setA] = useState('2');
  const [dP, setDP] = useState('100');
  const [alpha, setAlpha] = useState('1e11');
  const [c, setC] = useState('80');
  const [tTarget, setTTarget] = useState('300');
  const mu = 0.001;
  const Rm = 1e10;
  const dPpa = (parseFloat(dP) || 0) * 1000;
  const tForV = filtrationT(parseFloat(V) || 0, parseFloat(A) || 0, dPpa, mu, parseFloat(alpha) || 0, parseFloat(c) || 0, Rm);
  const vForT = filtrationV(parseFloat(tTarget) || 0, parseFloat(A) || 0, dPpa, mu, parseFloat(alpha) || 0, parseFloat(c) || 0, Rm);
  const curve: { x: number; y: number }[] = [];
  for (let i = 1; i <= 20; i++) {
    const v = i * 0.05;
    const t = filtrationT(v, parseFloat(A) || 0, dPpa, mu, parseFloat(alpha) || 0, parseFloat(c) || 0, Rm);
    if (t !== null && isFinite(t)) curve.push({ x: v, y: t });
  }
  const meanRate = tForV !== null && tForV > 0 ? (parseFloat(V) || 0) / tForV : null;
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Constant-pressure cake filtration" icon={Filter}>
        <InputRow label="Filtrate volume target" unit="m³" value={V} onChange={setV} />
        <InputRow label="Filter area A" unit="m²" value={A} onChange={setA} />
        <InputRow label="Pressure drop ΔP" unit="kPa" value={dP} onChange={setDP} />
        <InputRow label="Cake resistance α" unit="m/kg" value={alpha} onChange={setAlpha} />
        <InputRow label="Slurry solids c" unit="kg/m³" value={c} onChange={setC} />
        <InputRow label="Filter time (back-solve)" unit="s" value={tTarget} onChange={setTTarget} />
        <div className="grid grid-cols-3 gap-3 mt-2">
          <ResultBox label="Time to filter V" value={fmt(tForV, 0, ' s')} unit="Ruth eqn" color="#8b5cf6" />
          <ResultBox label="Volume in t" value={fmt(vForT, 3, ' m³')} unit="back-solve" color="#6366f1" />
          <ResultBox label="Mean rate" value={meanRate !== null ? fmt(meanRate * 3600, 1, ' m³/h') : '—'} unit="V / t" color="#a78bfa" />
        </div>
        <InfoNote>Ruth: t = (μαc/2A²ΔP)·V² + (μRm/AΔP)·V. The V² term is the growing cake; the linear term is the medium. Doubling cake resistance quadruples the time term — that's why cake washing is a science.</InfoNote>
      </CalcCard>

      <div className="space-y-6">
        <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-violet-500" /> Filtrate volume vs time
          </h3>
          <Plot2D line={curve} xLabel="Filtrate volume V (m³)" yLabel="Time t (s)" />
          <p className="text-[10px] text-slate-400 mt-2">The parabolic shape is the signature of cake filtration — the rate falls as the cake thickens.</p>
        </div>
        <FluidizationCard />
      </div>
    </div>
  );
}

function FluidizationCard() {
  const [d, setD] = useState('300');
  const [rhoP, setRhoP] = useState('2500');
  const [rhoF, setRhoF] = useState('1.2');
  const [mu, setMu] = useState('1.8e-5');
  const dM = (parseFloat(d) || 0) * 1e-6;
  const Umf = minFluidizationV(dM, parseFloat(rhoP) || 0, parseFloat(rhoF) || 0, parseFloat(mu) || 0);
  const vt = terminalVelocity(dM, parseFloat(rhoP) || 0, parseFloat(rhoF) || 0, parseFloat(mu) || 0).vt;
  return (
    <CalcCard title="Minimum fluidization velocity" icon={Filter}>
      <InputRow label="Particle diameter" unit="μm" value={d} onChange={setD} />
      <InputRow label="Solid density" unit="kg/m³" value={rhoP} onChange={setRhoP} />
      <InputRow label="Fluid density" unit="kg/m³" value={rhoF} onChange={setRhoF} />
      <InputRow label="Fluid viscosity" unit="Pa·s" value={mu} onChange={setMu} />
      <div className="grid grid-cols-3 gap-3 mt-2">
        <ResultBox label="U_mf (Wen–Yu)" value={fmt(Umf, 4, ' m/s')} unit="start of bed" color="#8b5cf6" />
        <ResultBox label="Terminal vt" value={fmt(vt !== null ? vt : null, 3, ' m/s')} unit="entrainment" color="#6366f1" />
        <ResultBox label="Bed range" value={Umf !== null && vt !== null && vt > Umf ? fmt(vt / Umf, 0, '×') : '—'} unit="vt / U_mf" color="#a78bfa" />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
        Below <b className="text-slate-700 dark:text-slate-200">U_mf</b> the bed is fixed; above it, the particles lift and the bed behaves like a boiling liquid (pressure drop = bed weight per area). Between U_mf and vt is the fluidization window — FCC reactors, fluid beds and pneumatic conveyors all live here.
      </p>
    </CalcCard>
  );
}
// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'psd', label: 'Particle Size', icon: Grid3x3 },
  { id: 'reduction', label: 'Size Reduction', icon: Boxes },
  { id: 'sedimentation', label: 'Sedimentation', icon: Waves },
  { id: 'cyclone', label: 'Cyclones', icon: Wind },
  { id: 'filtration', label: 'Filtration & Fluid.', icon: Filter },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ParticulateTechnologyModule() {
  const [tab, setTab] = useState<TabId>('psd');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Grid3x3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Particulate Technology</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Solids handling: size analysis, crushing & grinding, settling, cyclones, filtration and fluid beds.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${tab === t.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                : 'bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-violet-400/50 hover:text-violet-600 dark:hover:text-violet-300'}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'psd' && <PSDTab />}
      {tab === 'reduction' && <SizeReductionTab />}
      {tab === 'sedimentation' && <SedimentationTab />}
      {tab === 'cyclone' && <CycloneTab />}
      {tab === 'filtration' && <FiltrationTab />}
    </div>
  );
}
