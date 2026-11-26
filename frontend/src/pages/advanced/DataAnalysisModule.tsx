import { useMemo, useRef, useState } from 'react';
import {
  Upload, Table2, BarChart3, TrendingUp, FileSpreadsheet, Trash2,
  Download, Sigma, LineChart as LineChartIcon, Calculator, Info
} from 'lucide-react';
import {
  ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, Legend
} from 'recharts';
import { CalcCard } from './SharedComponents';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Dataset {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

type RegressionType = 'linear' | 'exponential' | 'power' | 'logarithmic' | 'polynomial';

interface RegressionResult {
  type: RegressionType;
  equation: string;
  r2: number;
  predict: (x: number) => number;
  usedCount: number;
  excludedCount: number;
  domainWarning?: string;
}

const STRICT_NUM_RE = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

function fmtCoef(v: number): string {
  if (!Number.isFinite(v)) return '0';
  if (v === 0) return '0.0000';
  const abs = Math.abs(v);
  if (abs < 1e-3 || abs >= 1e5) return v.toExponential(3);
  return v.toFixed(4);
}

// ─── Parsing helpers ────────────────────────────────────────────────────────
function parseCSV(text: string, fileName = 'upload.csv'): Dataset | null {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return null;
  const split = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const headers = split(lines[0]);
  const rows = lines.slice(1).map(l => {
    const cells = split(l);
    return cells.map(c => {
      const trimmed = c.trim();
      if (trimmed === '') return '';
      const noCommas = trimmed.replace(/,/g, '');
      if (STRICT_NUM_RE.test(noCommas)) {
        const num = Number(noCommas);
        if (Number.isFinite(num)) return num;
      }
      return trimmed;
    });
  });
  return { name: fileName, headers, rows };
}

async function parseExcel(file: File): Promise<Dataset | null> {
  // Lazy-load the sheet parser only when an Excel file is actually chosen
  const XLSX = await import('xlsx');
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as (string | number)[][];
        if (!matrix.length) { resolve(null); return; }
        const headers = matrix[0].map(h => String(h).trim());
        const rows = matrix.slice(1).map(r => r.map(c => {
          if (typeof c === 'number') return c;
          const s = String(c).trim();
          const noCommas = s.replace(/,/g, '');
          if (s !== '' && STRICT_NUM_RE.test(noCommas)) {
            const num = Number(noCommas);
            if (Number.isFinite(num)) return num;
          }
          return s;
        }));
        resolve({ name: file.name, headers, rows });
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

// ─── Statistics ─────────────────────────────────────────────────────────────
function stats(arr: number[]) {
  const n = arr.length;
  if (!n) return null;
  const mean = arr.reduce((s, v) => s + v, 0) / n;
  const variance = n > 1 ? arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
  const sd = Math.sqrt(variance);
  const sorted = [...arr].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const cv = mean !== 0 ? (sd / Math.abs(mean)) * 100 : null;
  return {
    n, mean, sd, median, min: sorted[0], max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0], cv,
  };
}

function fitLinear(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const slope = sxx ? sxy / sxx : 0;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

function rSquared(xs: number[], ys: number[], predict: (x: number) => number) {
  const n = xs.length;
  if (n < 2) return 0;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const p = predict(xs[i]);
    if (!Number.isFinite(p)) continue;
    ssRes += (ys[i] - p) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  return ssTot ? 1 - ssRes / ssTot : 0;
}

function fitPolynomial(xs: number[], ys: number[], degree: number): RegressionResult {
  const m = degree + 1;
  const A: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  const b: number[] = Array(m).fill(0);
  const powers: number[][] = xs.map(x => Array.from({ length: 2 * m - 1 }, (_, k) => x ** k));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) A[i][j] = powers.reduce((s, p) => s + p[i + j], 0);
    b[i] = ys.reduce((s, y, k) => s + y * powers[k][i], 0);
  }
  // Gaussian elimination with partial pivoting
  for (let col = 0; col < m; col++) {
    let piv = col;
    for (let r = col + 1; r < m; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    for (let r = col + 1; r < m; r++) {
      const f = A[r][col] / (A[col][col] || 1e-12);
      for (let c = col; c < m; c++) A[r][c] -= f * A[col][c];
      b[r] -= f * b[col];
    }
  }
  const coef = Array(m).fill(0);
  for (let r = m - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < m; c++) s -= A[r][c] * coef[c];
    coef[r] = s / (A[r][r] || 1e-12);
  }
  const predict = (x: number) => coef.reduce((s, c, k) => s + c * x ** k, 0);
  const eq = coef
    .map((c, k) => `${c >= 0 ? '+' : '−'} ${fmtCoef(Math.abs(c))}${k === 0 ? '' : k === 1 ? '·x' : `·x^${k}`}`)
    .reverse()
    .join(' ')
    .replace(/^\+ /, '');
  return {
    type: 'polynomial',
    predict,
    equation: `y = ${eq}`,
    r2: rSquared(xs, ys, predict),
    usedCount: xs.length,
    excludedCount: 0,
  };
}

function fitRegression(type: RegressionType, xs: number[], ys: number[]): RegressionResult {
  const safe = (v: number) => (Number.isFinite(v) ? v : NaN);
  if (type === 'linear') {
    const { slope, intercept } = fitLinear(xs, ys);
    const predict = (x: number) => safe(slope * x + intercept);
    return {
      type,
      equation: `y = ${fmtCoef(slope)}·x ${intercept >= 0 ? '+' : '−'} ${fmtCoef(Math.abs(intercept))}`,
      r2: rSquared(xs, ys, predict),
      predict,
      usedCount: xs.length,
      excludedCount: 0,
    };
  }
  if (type === 'exponential') {
    const fx: number[] = [];
    const fy: number[] = [];
    for (let i = 0; i < xs.length; i++) {
      if (ys[i] > 0) { fx.push(xs[i]); fy.push(ys[i]); }
    }
    const excludedCount = xs.length - fx.length;
    if (fx.length < 2) {
      return {
        type,
        equation: 'Requires ≥ 2 points with y > 0',
        r2: 0,
        predict: () => NaN,
        usedCount: fx.length,
        excludedCount,
        domainWarning: 'Exponential regression requires strictly positive y values (y > 0).',
      };
    }
    const ly = fy.map(y => Math.log(y));
    const { slope, intercept } = fitLinear(fx, ly);
    const a = Math.exp(intercept);
    const predict = (x: number) => safe(a * Math.exp(slope * x));
    return {
      type,
      equation: `y = ${fmtCoef(a)}·e^(${fmtCoef(slope)}·x)`,
      r2: rSquared(fx, fy, predict),
      predict,
      usedCount: fx.length,
      excludedCount,
      domainWarning: excludedCount > 0 ? `${excludedCount} non-positive y point(s) excluded (y ≤ 0 not in ln domain).` : undefined,
    };
  }
  if (type === 'power') {
    const fx: number[] = [];
    const fy: number[] = [];
    for (let i = 0; i < xs.length; i++) {
      if (xs[i] > 0 && ys[i] > 0) { fx.push(xs[i]); fy.push(ys[i]); }
    }
    const excludedCount = xs.length - fx.length;
    if (fx.length < 2) {
      return {
        type,
        equation: 'Requires ≥ 2 points with x > 0 and y > 0',
        r2: 0,
        predict: () => NaN,
        usedCount: fx.length,
        excludedCount,
        domainWarning: 'Power-law regression requires strictly positive x and y values (x > 0, y > 0).',
      };
    }
    const lx = fx.map(x => Math.log(x));
    const ly = fy.map(y => Math.log(y));
    const { slope, intercept } = fitLinear(lx, ly);
    const a = Math.exp(intercept);
    const predict = (x: number) => (x > 0 ? safe(a * Math.pow(x, slope)) : NaN);
    return {
      type,
      equation: `y = ${fmtCoef(a)}·x^(${fmtCoef(slope)})`,
      r2: rSquared(fx, fy, predict),
      predict,
      usedCount: fx.length,
      excludedCount,
      domainWarning: excludedCount > 0 ? `${excludedCount} non-positive (x ≤ 0 or y ≤ 0) point(s) excluded for power fit.` : undefined,
    };
  }
  if (type === 'logarithmic') {
    const fx: number[] = [];
    const fy: number[] = [];
    for (let i = 0; i < xs.length; i++) {
      if (xs[i] > 0) { fx.push(xs[i]); fy.push(ys[i]); }
    }
    const excludedCount = xs.length - fx.length;
    if (fx.length < 2) {
      return {
        type,
        equation: 'Requires ≥ 2 points with x > 0',
        r2: 0,
        predict: () => NaN,
        usedCount: fx.length,
        excludedCount,
        domainWarning: 'Logarithmic regression requires strictly positive x values (x > 0).',
      };
    }
    const lx = fx.map(x => Math.log(x));
    const { slope, intercept } = fitLinear(lx, fy);
    const predict = (x: number) => (x > 0 ? safe(slope * Math.log(x) + intercept) : NaN);
    return {
      type,
      equation: `y = ${fmtCoef(slope)}·ln(x) ${intercept >= 0 ? '+' : '−'} ${fmtCoef(Math.abs(intercept))}`,
      r2: rSquared(fx, fy, predict),
      predict,
      usedCount: fx.length,
      excludedCount,
      domainWarning: excludedCount > 0 ? `${excludedCount} non-positive x point(s) excluded (x ≤ 0 not in ln domain).` : undefined,
    };
  }
  return fitPolynomial(xs, ys, 2);
}

// ─── Sample datasets ────────────────────────────────────────────────────────
const SAMPLES: Dataset[] = [
  {
    name: 'Rate constant vs Temperature (Arrhenius)',
    headers: ['T (K)', 'k (1/s)'],
    rows: [[300, 0.0012], [310, 0.0031], [320, 0.0078], [330, 0.018], [340, 0.041], [350, 0.089], [360, 0.187], [370, 0.38]],
  },
  {
    name: 'Vapor Pressure vs Temperature (Clausius–Clapeyron)',
    headers: ['T (C)', 'P (kPa)'],
    rows: [[30, 4.24], [40, 7.38], [50, 12.35], [60, 19.92], [70, 31.16], [80, 47.36], [90, 70.1], [100, 101.3]],
  },
  {
    name: 'Reactor Conversion vs Time',
    headers: ['t (min)', 'Conversion X'],
    rows: [[0, 0], [5, 0.22], [10, 0.39], [15, 0.52], [20, 0.62], [30, 0.75], [45, 0.85], [60, 0.9], [90, 0.94], [120, 0.96]],
  },
  {
    name: 'Pressure Drop vs Flow Rate',
    headers: ['Flow (L/min)', 'dP (kPa)'],
    rows: [[1, 0.8], [2, 3.1], [3, 7.0], [4, 12.5], [5, 19.5], [6, 28.1], [7, 38.2], [8, 49.9]],
  },
];

// ─── Main module ────────────────────────────────────────────────────────────
const REG_TYPES: { id: RegressionType; label: string }[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'exponential', label: 'Exponential' },
  { id: 'power', label: 'Power' },
  { id: 'logarithmic', label: 'Logarithmic' },
  { id: 'polynomial', label: 'Quadratic' },
];

function formatCell(v: string | number): string {
  return typeof v === 'number' ? (Math.abs(v) >= 10000 || (Math.abs(v) < 0.001 && v !== 0) ? v.toExponential(3) : v.toFixed(4)) : v;
}

function DataAnalysisModule() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xCol, setXCol] = useState(0);
  const [yCol, setYCol] = useState(1);
  const [regType, setRegType] = useState<RegressionType>('linear');
  const [showTable, setShowTable] = useState(false);

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const name = file.name.toLowerCase();
    const ds = name.endsWith('.csv')
      ? parseCSV(await file.text(), file.name)
      : name.endsWith('.xlsx') || name.endsWith('.xls')
        ? await parseExcel(file)
        : null;
    if (!ds || !ds.headers.length) { setError('Could not parse the file. Use a CSV with a header row, or an .xlsx spreadsheet.'); return; }
    if (ds.rows.length === 0) { setError('The file has no data rows.'); return; }
    setDataset(ds);
    setXCol(0);
    setYCol(Math.min(1, ds.headers.length - 1));
    setShowTable(false);
  };

  const loadSample = (s: Dataset) => {
    setError(null);
    setDataset(s);
    setXCol(0); setYCol(1);
  };

  const analysis = useMemo(() => {
    if (!dataset) return null;
    const xs: number[] = [];
    const ys: number[] = [];
    const points: { x: number; y: number }[] = [];
    for (const row of dataset.rows) {
      const rx = row[xCol];
      const ry = row[yCol];
      if (rx === '' || ry === '' || rx === undefined || ry === undefined) continue;
      const x = typeof rx === 'number' ? rx : Number(rx);
      const y = typeof ry === 'number' ? ry : Number(ry);
      if (Number.isFinite(x) && Number.isFinite(y)) { xs.push(x); ys.push(y); points.push({ x, y }); }
    }
    if (xs.length < 3) return null;
    const fit = fitRegression(regType, xs, ys);

    // Build smooth 50-point sorted curve over the valid fit domain
    const validXs = (regType === 'power' || regType === 'logarithmic') ? xs.filter(x => x > 0) : xs;
    const curve: { x: number; y_fit: number }[] = [];
    if (validXs.length >= 2 && fit.usedCount >= 2) {
      const xMin = Math.min(...validXs);
      const xMax = Math.max(...validXs);
      const steps = 50;
      for (let i = 0; i <= steps; i++) {
        const xVal = xMin + ((xMax - xMin) * i) / steps;
        const yVal = fit.predict(xVal);
        if (Number.isFinite(yVal)) {
          curve.push({ x: Number(xVal.toPrecision(6)), y_fit: Number(yVal.toPrecision(6)) });
        }
      }
    }

    const sortedPoints = [...points].sort((a, b) => a.x - b.x);
    const xStats = stats(xs);
    const yStats = stats(ys);
    const denom = xStats && yStats ? xStats.sd * yStats.sd * (xs.length - 1) : 0;
    const corr = xStats && yStats && denom > 0
      ? xs.reduce((s, x, i) => s + (x - xStats.mean) * (ys[i] - yStats.mean), 0) / denom
      : 0;
    return { xs, ys, points: sortedPoints, fit, curve, xStats, yStats, corr };
  }, [dataset, xCol, yCol, regType]);

  const exportCSV = () => {
    if (!dataset) return;
    const esc = (v: string | number) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headerRow = [...dataset.headers, 'y_fit', 'residual (y - y_fit)'].map(esc).join(',');
    const dataLines = dataset.rows.map(r => {
      const rx = Number(r[xCol]);
      const ry = Number(r[yCol]);
      let yFitStr = '';
      let resStr = '';
      if (analysis && Number.isFinite(rx) && Number.isFinite(ry)) {
        const yf = analysis.fit.predict(rx);
        if (Number.isFinite(yf)) {
          yFitStr = yf.toPrecision(6);
          resStr = (ry - yf).toPrecision(6);
        }
      }
      return [...r, yFitStr, resStr].map(esc).join(',');
    });
    const summaryLines = analysis
      ? [
          '',
          `# Regression Model,${esc(analysis.fit.type)}`,
          `# Equation,${esc(analysis.fit.equation)}`,
          `# R-squared,${analysis.fit.r2.toFixed(6)}`,
          `# Pearson r,${analysis.corr.toFixed(6)}`,
          `# Valid Points Used,${analysis.fit.usedCount}`,
          `# X Mean / SD,${analysis.xStats?.mean.toPrecision(6) ?? ''} / ${analysis.xStats?.sd.toPrecision(6) ?? ''}`,
          `# Y Mean / SD,${analysis.yStats?.mean.toPrecision(6) ?? ''} / ${analysis.yStats?.sd.toPrecision(6) ?? ''}`,
        ]
      : [];
    const blob = new Blob([[headerRow, ...dataLines, ...summaryLines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name.replace(/\.[^.]+$/, '')}_analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const interpretation = useMemo(() => {
    if (!analysis) return null;
    const { fit, corr } = analysis;
    const parts: string[] = [];
    parts.push(`The best-fit ${fit.type} model is ${fit.equation} with R² = ${fit.r2.toFixed(4)}.`);
    if (fit.r2 > 0.97) parts.push('R² above 0.97 indicates the model explains almost all variance — an excellent fit for engineering design.');
    else if (fit.r2 > 0.85) parts.push('R² above 0.85 is a good fit; residuals are small but a different model form may improve it slightly.');
    else if (fit.r2 > 0.6) parts.push('R² is moderate — the trend is real but scatter is significant; check for outliers or a different model form.');
    else parts.push('The fit is poor (low R²). Consider another model form, log-transform the data, or review measurement quality.');
    parts.push(`The Pearson correlation between the two columns is r = ${corr.toFixed(3)} (${Math.abs(corr) > 0.8 ? 'strong' : Math.abs(corr) > 0.5 ? 'moderate' : 'weak'} ${corr >= 0 ? 'positive' : 'negative'} linear association).`);
    if (fit.type === 'linear') parts.push('The slope quantifies sensitivity: for each +1 unit of x, y changes by the slope of the line.');
    if (fit.type === 'exponential') parts.push('An exponential fit suggests first-order kinetics or similar multiplicative growth/decay behaviour.');
    if (fit.type === 'power') parts.push('A power fit indicates a scaling law — common for heat transfer, friction and settling correlations.');
    if (fit.type === 'polynomial') parts.push('A quadratic fit captures curvature — useful for pump curves, pressure-drop and equilibrium data.');
    return parts;
  }, [analysis]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-surface-50 flex items-center justify-center shadow-lg shadow-fuchsia-500/25">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-surface-800 dark:text-surface-50">Data Analysis Studio</h1>
            <p className="text-xs text-surface-500 dark:text-surface-400">Upload experimental data (CSV / Excel), fit regression models with R², inspect statistics and get plain-English interpretation.</p>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <CalcCard title="1 · Load Your Data" icon={Upload}>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={e => { loadFile(e.target.files?.[0]); e.target.value = ''; }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-fuchsia-300 dark:border-fuchsia-800 hover:border-fuchsia-500 hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10 transition-all p-6 flex flex-col items-center justify-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-fuchsia-500" />
            <span className="text-xs font-black text-surface-700 dark:text-surface-200">Upload CSV / Excel</span>
            <span className="text-[10px] text-surface-400">Header row required — numbers auto-detected</span>
          </button>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Or try a sample dataset
            </h4>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((s, i) => (
                <button key={i} onClick={() => loadSample(s)}
                  className="px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-[10px] font-black text-surface-600 dark:text-surface-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 hover:text-fuchsia-600 transition-all">
                  {s.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 p-6 flex flex-col justify-center">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Works best with
            </h4>
            <p className="text-[10px] text-surface-500 leading-relaxed">Two or more numeric columns. First row = headers. The tool auto-detects numbers, preserves text labels, and handles quoted CSV fields &amp; Excel sheets.</p>
          </div>
        </div>
        {error && <div className="rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/10 p-3 text-xs font-bold text-rose-600 dark:text-rose-400">{error}</div>}
      </CalcCard>

      {dataset && analysis && (
        <>
          <CalcCard title="2 · Configure Analysis" icon={Calculator}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-2">X-axis column</label>
                <select value={xCol} onChange={e => setXCol(Number(e.target.value))}
                  className="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 p-2.5 text-xs font-bold text-surface-700 dark:text-surface-200 focus:border-fuchsia-400 focus:outline-none">
                  {dataset.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-2">Y-axis column</label>
                <select value={yCol} onChange={e => setYCol(Number(e.target.value))}
                  className="w-full rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 p-2.5 text-xs font-bold text-surface-700 dark:text-surface-200 focus:border-fuchsia-400 focus:outline-none">
                  {dataset.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 block mb-2">Regression model</label>
                <div className="flex flex-wrap gap-2">
                  {REG_TYPES.map(r => (
                    <button key={r.id} onClick={() => setRegType(r.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${regType === r.id ? 'bg-fuchsia-600 text-surface-50 border-fuchsia-600' : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-fuchsia-400'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowTable(s => !s)}
                className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-300 text-xs font-black hover:border-fuchsia-400 transition-all flex items-center gap-2">
                <Table2 className="w-4 h-4" /> {showTable ? 'Hide' : 'Show'} Data Table
              </button>
              <button onClick={exportCSV}
                className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-300 text-xs font-black hover:border-fuchsia-400 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Export CSV (with Fit &amp; Residuals)
              </button>
              <button onClick={() => { setDataset(null); setError(null); }}
                className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-500 text-xs font-black hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            </div>
          </CalcCard>

          <CalcCard title="3 · Scatter Plot & Model Fit" icon={LineChartIcon}>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={dataset.headers[xCol]}
                    domain={['auto', 'auto']}
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <YAxis
                    type="number"
                    name={dataset.headers[yCol]}
                    domain={['auto', 'auto']}
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Scatter name="Data" data={analysis.points} dataKey="y" fill="#d946ef" />
                  {analysis.curve.length > 0 && (
                    <Line
                      name="Fit"
                      data={analysis.curve}
                      dataKey="y_fit"
                      stroke="#7c3aed"
                      dot={false}
                      strokeWidth={2.5}
                      isAnimationActive={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 rounded-2xl border border-fuchsia-200 dark:border-fuchsia-900/40 bg-fuchsia-50/50 dark:bg-fuchsia-900/10">
              <p className="text-xs font-black text-fuchsia-700 dark:text-fuchsia-400 mb-1">Fitted model</p>
              <p className="text-sm font-mono text-surface-800 dark:text-surface-100">{analysis.fit.equation}</p>
              <p className="text-xs text-surface-500 mt-1">
                R² = {analysis.fit.r2.toFixed(4)} · {analysis.fit.usedCount} valid points used
                {analysis.fit.excludedCount > 0 ? ` (${analysis.fit.excludedCount} excluded)` : ''}
              </p>
              {analysis.fit.domainWarning && (
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1.5">⚠ {analysis.fit.domainWarning}</p>
              )}
            </div>
          </CalcCard>

          <CalcCard title="4 · Descriptive Statistics" icon={Sigma}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: `x-${xCol}`, label: dataset.headers[xCol], s: analysis.xStats },
                { key: `y-${yCol}`, label: dataset.headers[yCol], s: analysis.yStats },
              ].map(({ key, label, s }) => (
                <div key={key} className="rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500 mb-3">{label}</p>
                  <div className="space-y-1.5 text-[11px]">
                    <p className="flex justify-between"><span className="text-surface-400">n</span><span className="font-black text-surface-700 dark:text-surface-200">{s?.n ?? 0}</span></p>
                    <p className="flex justify-between"><span className="text-surface-400">Mean</span><span className="font-black text-surface-700 dark:text-surface-200">{s ? s.mean.toFixed(4) : '—'}</span></p>
                    <p className="flex justify-between"><span className="text-surface-400">Std dev</span><span className="font-black text-surface-700 dark:text-surface-200">{s ? s.sd.toFixed(4) : '—'}</span></p>
                    <p className="flex justify-between"><span className="text-surface-400">Median</span><span className="font-black text-surface-700 dark:text-surface-200">{s ? s.median.toFixed(4) : '—'}</span></p>
                    <p className="flex justify-between"><span className="text-surface-400">Min / Max</span><span className="font-black text-surface-700 dark:text-surface-200">{s ? `${s.min.toFixed(3)} / ${s.max.toFixed(3)}` : '—'}</span></p>
                    <p className="flex justify-between"><span className="text-surface-400">CV %</span><span className="font-black text-surface-700 dark:text-surface-200">{s && s.cv !== null ? s.cv.toFixed(1) : '—'}</span></p>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500 mb-3">Correlation r</p>
                <p className="text-2xl font-black text-surface-800 dark:text-surface-50">{analysis.corr.toFixed(4)}</p>
                <p className="text-[10px] text-surface-400 mt-1">Pearson linear correlation between the selected columns.</p>
              </div>
              <div className="rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500 mb-3">Goodness of fit</p>
                <p className="text-2xl font-black text-surface-800 dark:text-surface-50">{analysis.fit.r2.toFixed(4)}</p>
                <p className="text-[10px] text-surface-400 mt-1">R² for the selected {regType} model — higher is better.</p>
              </div>
            </div>
          </CalcCard>

          <CalcCard title="5 · Plain-English Interpretation" icon={TrendingUp}>
            <div className="space-y-3">
              {interpretation?.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </CalcCard>

          {showTable && (
            <CalcCard title="Data Table" icon={Table2}>
              <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-surface-200 dark:border-surface-800">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface-50 dark:bg-surface-900">
                    <tr>
                      {dataset.headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-black text-surface-500 text-[10px] uppercase tracking-widest border-b border-surface-200 dark:border-surface-800">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.rows.map((r, ri) => (
                      <tr key={ri} className="hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10 transition-colors">
                        {r.map((c, ci) => <td key={ci} className="px-3 py-1.5 text-surface-600 dark:text-surface-300 border-b border-surface-100 dark:border-surface-800/60">{formatCell(c)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CalcCard>
          )}
        </>
      )}

      {dataset && !analysis && (
        <div className="rounded-2xl border border-accent-200 dark:border-accent-900/40 bg-accent-50/50 dark:bg-accent-900/10 p-5 text-xs font-bold text-accent-700 dark:text-accent-400">
          Need at least 3 numeric rows in both selected columns to run the analysis.
        </div>
      )}
    </div>
  );
}

export default DataAnalysisModule;
