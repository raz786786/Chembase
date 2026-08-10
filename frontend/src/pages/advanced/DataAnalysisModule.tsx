import { useMemo, useRef, useState } from 'react';
import {
  Upload, Table2, BarChart3, TrendingUp, FileSpreadsheet, Trash2,
  Download, Sigma, LineChart as LineChartIcon, Calculator, Info
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
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
}

// ─── Parsing helpers ────────────────────────────────────────────────────────
function parseCSV(text: string): Dataset | null {
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
      const num = Number(c.replace(/,/g, '').replace(/[^0-9.\-eE]/g, ''));
      return isNaN(num) || c.trim() === '' ? c : num;
    });
  });
  return { name: 'upload.csv', headers, rows };
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
          const num = Number(s.replace(/,/g, ''));
          return s === '' || isNaN(num) ? s : num;
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
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1 || 1);
  const sd = Math.sqrt(variance);
  const sorted = [...arr].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  return {
    n, mean, sd, median, min: sorted[0], max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0], cv: (sd / (mean || 1e-12)) * 100,
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
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (ys[i] - predict(xs[i])) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  return ssTot ? 1 - ssRes / ssTot : 0;
}

function fitPolynomial(xs: number[], ys: number[], degree: number) {
  const m = degree + 1;
  const A: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  const b: number[] = Array(m).fill(0);
  const powers: number[][] = xs.map(x => Array.from({ length: 2 * m - 1 }, (_, k) => x ** k));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) A[i][j] = powers.reduce((s, p, k) => s + p[i + j] * (ys[k] ** 0), 0);
    b[i] = ys.reduce((s, y, k) => s + y * powers[k][i], 0);
  }
  // Gaussian elimination
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
  const eq = coef.map((c, k) => `${c >= 0 ? '+' : '-'} ${Math.abs(c).toFixed(4)}·x${k === 0 ? '' : k === 1 ? '' : `^${k}`}`).reverse().join(' ').replace(/^\+ /, '').replace(/·x$/, '·x');
  return { type: 'polynomial' as const, predict, equation: `y = ${eq}`, r2: rSquared(xs, ys, predict) };
}

function fitRegression(type: RegressionType, xs: number[], ys: number[]): RegressionResult {
  const safe = (v: number) => (isFinite(v) ? v : 0);
  if (type === 'linear') {
    const { slope, intercept } = fitLinear(xs, ys);
    return { type, equation: `y = ${slope.toFixed(4)}·x ${intercept >= 0 ? '+' : '−'} ${Math.abs(intercept).toFixed(4)}`, r2: rSquared(xs, ys, x => safe(slope * x + intercept)), predict: x => safe(slope * x + intercept) };
  }
  if (type === 'exponential') {
    const ly = ys.map(y => Math.log(Math.max(y, 1e-12)));
    const { slope, intercept } = fitLinear(xs, ly);
    const a = Math.exp(intercept);
    return { type, equation: `y = ${a.toFixed(4)}·e^(${slope.toFixed(4)}·x)`, r2: rSquared(xs, ys, x => safe(a * Math.exp(slope * x))), predict: x => safe(a * Math.exp(slope * x)) };
  }
  if (type === 'power') {
    const lx = xs.map(x => Math.log(Math.max(x, 1e-12)));
    const ly = ys.map(y => Math.log(Math.max(y, 1e-12)));
    const { slope, intercept } = fitLinear(lx, ly);
    const a = Math.exp(intercept);
    return { type, equation: `y = ${a.toFixed(4)}·x^(${slope.toFixed(4)})`, r2: rSquared(xs, ys, x => safe(a * Math.pow(x, slope))), predict: x => safe(a * Math.pow(x, slope)) };
  }
  if (type === 'logarithmic') {
    const lx = xs.map(x => Math.log(Math.max(x, 1e-12)));
    const { slope, intercept } = fitLinear(lx, ys);
    return { type, equation: `y = ${slope.toFixed(4)}·ln(x) ${intercept >= 0 ? '+' : '−'} ${Math.abs(intercept).toFixed(4)}`, r2: rSquared(xs, ys, x => safe(slope * Math.log(Math.max(x, 1e-12)) + intercept)), predict: x => safe(slope * Math.log(Math.max(x, 1e-12)) + intercept) };
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
    const ds = name.endsWith('.csv') ? parseCSV(await file.text()) : name.endsWith('.xlsx') || name.endsWith('.xls') ? await parseExcel(file) : null;
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
      const x = Number(row[xCol]);
      const y = Number(row[yCol]);
      if (isFinite(x) && isFinite(y)) { xs.push(x); ys.push(y); points.push({ x, y }); }
    }
    if (xs.length < 3) return null;
    const fit = fitRegression(regType, xs, ys);
    const curve = xs.map(x => ({ x, y_fit: fit.predict(x) }));
    const xStats = stats(xs);
    const yStats = stats(ys);
    const corr = xStats && yStats ? xs.reduce((s, x, i) => s + (x - xStats.mean) * (ys[i] - yStats.mean), 0) / ((xStats.sd * yStats.sd) * (xs.length - 1) || 1) : 0;
    return { xs, ys, points, fit, curve, xStats, yStats, corr };
  }, [dataset, xCol, yCol, regType]);

  const exportCSV = () => {
    if (!dataset) return;
    const lines = [dataset.headers.join(','), ...dataset.rows.map(r => r.join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/25">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Data Analysis Studio</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Upload experimental data (CSV / Excel), fit regression models with R², inspect statistics and get plain-English interpretation.</p>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <CalcCard title="1 · Load Your Data" icon={Upload}>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={e => loadFile(e.target.files?.[0])} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-fuchsia-300 dark:border-fuchsia-800 hover:border-fuchsia-500 hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10 transition-all p-6 flex flex-col items-center justify-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-fuchsia-500" />
            <span className="text-xs font-black text-slate-700 dark:text-slate-200">Upload CSV / Excel</span>
            <span className="text-[10px] text-slate-400">Header row required — numbers auto-detected</span>
          </button>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Or try a sample dataset
            </h4>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((s, i) => (
                <button key={i} onClick={() => loadSample(s)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 hover:text-fuchsia-600 transition-all">
                  {s.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-center">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Works best with
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">Two or more numeric columns. First row = headers. The tool auto-detects numbers, handles quoted CSV fields and Excel sheets.</p>
          </div>
        </div>
        {error && <div className="rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/10 p-3 text-xs font-bold text-rose-600 dark:text-rose-400">{error}</div>}
      </CalcCard>

      {dataset && analysis && (
        <>
          <CalcCard title="2 · Configure Analysis" icon={Calculator}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">X-axis column</label>
                <select value={xCol} onChange={e => setXCol(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-fuchsia-400 focus:outline-none">
                  {dataset.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Y-axis column</label>
                <select value={yCol} onChange={e => setYCol(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-fuchsia-400 focus:outline-none">
                  {dataset.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Regression model</label>
                <div className="flex flex-wrap gap-2">
                  {REG_TYPES.map(r => (
                    <button key={r.id} onClick={() => setRegType(r.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${regType === r.id ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-fuchsia-400'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowTable(s => !s)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black hover:border-fuchsia-400 transition-all flex items-center gap-2">
                <Table2 className="w-4 h-4" /> {showTable ? 'Hide' : 'Show'} Data Table
              </button>
              <button onClick={exportCSV}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black hover:border-fuchsia-400 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Export CSV
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
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="x" name={dataset.headers[xCol]} stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="y" name={dataset.headers[yCol]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Scatter name="Data" data={analysis.points} fill="#d946ef" />
                  <Line name="Fit" data={analysis.curve} dataKey="y_fit" stroke="#7c3aed" dot={false} strokeWidth={2.5} isAnimationActive={false} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 rounded-2xl border border-fuchsia-200 dark:border-fuchsia-900/40 bg-fuchsia-50/50 dark:bg-fuchsia-900/10">
              <p className="text-xs font-black text-fuchsia-700 dark:text-fuchsia-400 mb-1">Fitted model</p>
              <p className="text-sm font-mono text-slate-800 dark:text-slate-100">{analysis.fit.equation}</p>
              <p className="text-xs text-slate-500 mt-1">R² = {analysis.fit.r2.toFixed(4)} · {analysis.points.length} valid points used</p>
            </div>
          </CalcCard>

          <CalcCard title="4 · Descriptive Statistics" icon={Sigma}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{ label: dataset.headers[xCol], s: analysis.xStats }, { label: dataset.headers[yCol], s: analysis.yStats }].map(({ label, s }) => (
                <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500 mb-3">{label}</p>
                  <div className="space-y-1.5 text-[11px]">
                    <p className="flex justify-between"><span className="text-slate-400">n</span><span className="font-black text-slate-700 dark:text-slate-200">{s?.n ?? 0}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">Mean</span><span className="font-black text-slate-700 dark:text-slate-200">{s ? s.mean.toFixed(4) : '—'}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">Std dev</span><span className="font-black text-slate-700 dark:text-slate-200">{s ? s.sd.toFixed(4) : '—'}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">Median</span><span className="font-black text-slate-700 dark:text-slate-200">{s ? s.median.toFixed(4) : '—'}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">Min / Max</span><span className="font-black text-slate-700 dark:text-slate-200">{s ? `${s.min.toFixed(3)} / ${s.max.toFixed(3)}` : '—'}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">CV %</span><span className="font-black text-slate-700 dark:text-slate-200">{s ? s.cv.toFixed(1) : '—'}</span></p>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500 mb-3">Correlation r</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{analysis.corr.toFixed(4)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Pearson linear correlation between the selected columns.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500 mb-3">Goodness of fit</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{analysis.fit.r2.toFixed(4)}</p>
                <p className="text-[10px] text-slate-400 mt-1">R² for the selected {regType} model — higher is better.</p>
              </div>
            </div>
          </CalcCard>

          <CalcCard title="5 · Plain-English Interpretation" icon={TrendingUp}>
            <div className="space-y-3">
              {interpretation?.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </CalcCard>

          {showTable && (
            <CalcCard title="Data Table" icon={Table2}>
              <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                    <tr>
                      {dataset.headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-black text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.rows.map((r, ri) => (
                      <tr key={ri} className="hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10 transition-colors">
                        {r.map((c, ci) => <td key={ci} className="px-3 py-1.5 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60">{formatCell(c)}</td>)}
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
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10 p-5 text-xs font-bold text-amber-700 dark:text-amber-400">
          Need at least 3 numeric rows in both selected columns to run the analysis.
        </div>
      )}
    </div>
  );
}

export default DataAnalysisModule;
