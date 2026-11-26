import { useState } from 'react';
import {
  Atom, Scale, Beaker, Droplets, FlaskConical, Equal, FunctionSquare, Table2, TrendingUp, Ruler,
  AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── Atomic masses (g/mol), IUPAC standard weights ───
const ATOMIC_MASSES: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.94, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06,
  Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996,
  Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.63,
  As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,
  Nb: 92.906, Mo: 95.95, Tc: 98, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41,
  In: 114.82, Sn: 118.71, Sb: 121.76, Te: 127.6, I: 126.9, Xe: 131.29, Cs: 132.91, Ba: 137.33,
  La: 138.91, Ce: 140.12, Pr: 140.91, Nd: 144.24, Pm: 145, Sm: 150.36, Eu: 151.96, Gd: 157.25,
  Tb: 158.93, Dy: 162.5, Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05, Lu: 174.97, Hf: 178.49,
  Ta: 180.95, W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97, Hg: 200.59,
  Tl: 204.38, Pb: 207.2, Bi: 208.98, Po: 209, At: 210, Rn: 222, Fr: 223, Ra: 226, Ac: 227,
  Th: 232.04, Pa: 231.04, U: 238.03, Np: 237, Pu: 244, Am: 243, Cm: 247, Bk: 247, Cf: 251,
  Es: 252, Fm: 257, Md: 258, No: 259, Lr: 266
};

const fmt = (n: number, digits = 4) => {
  if (!isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e6 || abs < 1e-6)) return n.toExponential(3);
  return n.toFixed(digits);
};
// ─── Formula parser: subscripts, nested parentheses, hydrates ───
interface ParseOutcome { counts: Map<string, number>; ok: boolean; error?: string }

function parseFragment(expr: string): Map<string, number> | null {
  const m = expr.match(/^(\d*)([\s\S]*)$/);
  const coeff = m && m[1] ? parseInt(m[1], 10) : 1;
  if (coeff <= 0) return null;
  const body = (m && m[2]) || '';
  if (!body) return null;
  const tokens: string[] = [];
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === '(' || ch === ')' || ch === '[' || ch === ']') { tokens.push(ch); i++; }
    else if (/[A-Z]/.test(ch)) {
      let sym = ch; i++;
      if (i < body.length && /[a-z]/.test(body[i])) { sym += body[i]; i++; }
      tokens.push(sym);
    }
    else if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < body.length && /[0-9]/.test(body[i])) { num += body[i]; i++; }
      tokens.push(num);
    }
    else return null;
  }
  const stack: Map<string, number>[] = [new Map()];
  const bracketStack: string[] = [];
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (tok === '(' || tok === '[') {
      stack.push(new Map());
      bracketStack.push(tok);
    }
    else if (tok === ')' || tok === ']') {
      const expected = tok === ')' ? '(' : '[';
      if (stack.length === 1 || bracketStack[bracketStack.length - 1] !== expected) return null;
      bracketStack.pop();
      const inner = stack.pop()!;
      if (inner.size === 0) return null;
      let mult = 1;
      if (t + 1 < tokens.length && /^\d+$/.test(tokens[t + 1])) {
        mult = parseInt(tokens[++t], 10);
        if (mult <= 0) return null;
      }
      for (const [el, n] of inner) {
        const top = stack[stack.length - 1];
        top.set(el, (top.get(el) || 0) + n * mult);
      }
    }
    else if (/^\d+$/.test(tok)) { return null; }
    else {
      if (!ATOMIC_MASSES[tok]) return null;
      let mult = 1;
      if (t + 1 < tokens.length && /^\d+$/.test(tokens[t + 1])) {
        mult = parseInt(tokens[++t], 10);
        if (mult <= 0) return null;
      }
      stack[stack.length - 1].set(tok, (stack[stack.length - 1].get(tok) || 0) + mult);
    }
  }
  if (stack.length !== 1 || bracketStack.length !== 0) return null;
  const result = stack[0];
  if (result.size === 0) return null;
  if (coeff !== 1) {
    for (const [el, n] of result) result.set(el, n * coeff);
  }
  return result;
}

function parseFormula(input: string): ParseOutcome {
  const cleaned = input.replace(/\s+/g, '');
  if (!cleaned) return { counts: new Map(), ok: false, error: 'Enter a chemical formula.' };
  const fragments = cleaned.split(/[·.]/);
  if (fragments.some(f => f.length === 0)) {
    return { counts: new Map(), ok: false, error: 'Invalid hydrate separator in "' + input + '".' };
  }
  const total = new Map<string, number>();
  for (const frag of fragments) {
    const part = parseFragment(frag);
    if (!part) return { counts: total, ok: false, error: 'Could not parse "' + frag + '". Use symbols like H2SO4, Ca(OH)2, or K4[Fe(CN)6].' };
    for (const [el, n] of part) total.set(el, (total.get(el) || 0) + n);
  }
  if (total.size === 0) return { counts: total, ok: false, error: 'No valid elements found in formula.' };
  return { counts: total, ok: true };
}

function formulaMass(formula: string): number | null {
  const { counts, ok } = parseFormula(formula);
  if (!ok) return null;
  let mass = 0;
  for (const [el, n] of counts) mass += (ATOMIC_MASSES[el] || 0) * n;
  return mass;
}

function formulaBreakdown(formula: string): string {
  const { counts, ok } = parseFormula(formula);
  if (!ok) return '';
  return Array.from(counts.entries()).map(([el, n]) => el + (n > 1 ? n : '')).join(' · ');
}
// ─── TAB 1 · MOLECULAR WEIGHT ───
function MolecularWeightCalc() {
  const [formula, setFormula] = useState('H2SO4');
  const { counts, ok, error } = parseFormula(formula);
  const mass = ok ? formulaMass(formula) : null;
  return (
    <CalcCard title="Molecular Weight Calculator" icon={Atom}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">M = Σ (atomic weight × subscript) — parses subscripts, parentheses and hydrates.</p>
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-10">
        <input type="text" value={formula} onChange={e => setFormula(e.target.value)}
          placeholder="Enter formula, e.g. Ca(OH)2, Fe2(SO4)3, CuSO4·5H2O..."
          className="flex-grow px-5 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-bold text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all" />
        {ok && <span className="px-4 py-2 rounded-xl bg-accent-50 dark:bg-accent-900/20 text-accent-600 text-xs font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Parsed</span>}
      </div>
      {!ok && error && (
        <div className="mb-8 flex items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 text-sm font-bold text-rose-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {ok && mass !== null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ResultBox label="Molar Mass" value={mass.toFixed(4)} unit="g/mol" color="#6366f1" />
          <ResultBox label="Elements" value={counts.size} unit="distinct" color="#10b981" />
          <ResultBox label="Total Atoms" value={Array.from(counts.values()).reduce((a, b) => a + b, 0)} unit="atoms" color="#f59e0b" />
        </div>
      )}
      {ok && counts.size > 0 && (
        <div className="mt-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3 block">Element Breakdown</span>
          <div className="flex flex-wrap gap-2">
            {Array.from(counts.entries()).map(([el, n]) => (
              <span key={el} className="px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-sm font-bold text-surface-700 dark:text-surface-200 font-mono">
                {el}<sub className="text-[10px]">{n > 1 ? n : ''}</sub>
                <span className="ml-2 text-surface-400 text-xs">= {(ATOMIC_MASSES[el] * n).toFixed(3)} g/mol</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </CalcCard>
  );
}
// ─── Balancing engine (algebraic null-space method) ───
function gaussJordanNullspace(mat: number[][]): number[][] {
  const m = mat.length, n = mat[0].length;
  const M = mat.map(r => [...r]);
  let row = 0;
  const pivotCols: number[] = [];
  for (let col = 0; col < n && row < m; col++) {
    let sel = row;
    for (let r = row + 1; r < m; r++) if (Math.abs(M[r][col]) > Math.abs(M[sel][col])) sel = r;
    if (Math.abs(M[sel][col]) < 1e-9) continue;
    [M[row], M[sel]] = [M[sel], M[row]];
    const pv = M[row][col];
    for (let c = 0; c < n; c++) M[row][c] /= pv;
    for (let r = 0; r < m; r++) {
      if (r === row) continue;
      const f = M[r][col];
      if (Math.abs(f) < 1e-12) continue;
      for (let c = 0; c < n; c++) M[r][c] -= f * M[row][c];
    }
    pivotCols.push(col);
    row++;
  }
  const freeCols: number[] = [];
  for (let c = 0; c < n; c++) if (!pivotCols.includes(c)) freeCols.push(c);
  const basis: number[][] = [];
  for (const f of freeCols) {
    const v = new Array(n).fill(0);
    v[f] = 1;
    for (let i = 0; i < pivotCols.length; i++) v[pivotCols[i]] = -M[i][f];
    basis.push(v);
  }
  return basis;
}

function toIntegerCoeffs(v: number[]): number[] | null {
  for (let s = 1; s <= 10000; s++) {
    const scaled = v.map(x => x * s);
    const maxErr = Math.max(...scaled.map(x => Math.abs(x - Math.round(x))));
    if (maxErr < 1e-6) {
      const ints = scaled.map(x => Math.round(x));
      if (ints.some(x => x <= 0)) continue;
      const g = ints.reduce((acc, x) => (acc === 0 ? Math.abs(x) : gcd(acc, Math.abs(x))), 0);
      return g > 1 ? ints.map(x => x / g) : ints;
    }
  }
  return null;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

interface BalanceResult {
  ok: boolean;
  coeffs?: number[];
  compounds?: string[];
  reactantCount?: number;
  error?: string;
}
function balanceEquation(equation: string): BalanceResult {
  const sides = equation.split(/<=>|<->|⇌|->|→|=>|=/).map(s => s.trim());
  if (sides.length !== 2) return { ok: false, error: 'Use an arrow — e.g.  H2 + O2 -> H2O' };
  const parseSide = (s: string) => s.split('+').map(c => c.trim().replace(/^\d+\s*/, '')).filter(Boolean);
  const reactants = parseSide(sides[0]);
  const products = parseSide(sides[1]);
  if (reactants.length === 0 || products.length === 0) return { ok: false, error: 'Both sides of the equation need at least one species.' };
  const compounds = [...reactants, ...products];
  const elementOrder: string[] = [];
  const matrices: { el: string; n: number }[][] = compounds.map(c => {
    const { counts, ok } = parseFormula(c);
    if (!ok) return [];
    return Array.from(counts.entries()).map(([el, n]) => ({ el, n }));
  });
  for (const entry of matrices) {
    if (entry.length === 0) return { ok: false, error: 'Could not parse one of the species in the equation.' };
    for (const { el } of entry) if (!elementOrder.includes(el)) elementOrder.push(el);
  }
  const A: number[][] = elementOrder.map(el =>
    compounds.map((_, j) => {
      const entry = matrices[j].find(e => e.el === el);
      if (!entry) return 0;
      return j < reactants.length ? entry.n : -entry.n;
    })
  );
  const basis = gaussJordanNullspace(A);
  if (basis.length === 0) return { ok: false, error: 'No non-trivial solution — check that all elements balance or appear on both sides.' };
  if (basis.length > 1) return { ok: false, error: 'Equation has multiple independent solutions (underdetermined system) — cannot uniquely balance.' };
  let v = basis[0];
  if (v.some(x => x < -1e-6)) v = v.map(x => -x);
  if (!v.every(x => x > 1e-6)) return { ok: false, error: 'Equation cannot be balanced with strictly positive coefficients (check species and arrow direction).' };
  const ints = toIntegerCoeffs(v);
  if (!ints) return { ok: false, error: 'Could not resolve integer coefficients.' };
  const verify = elementOrder.map(el =>
    compounds.reduce((acc, _, j) => {
      const entry = matrices[j].find(e => e.el === el);
      const n = entry ? entry.n : 0;
      return acc + (j < reactants.length ? 1 : -1) * ints[j] * n;
    }, 0)
  );
  if (verify.some(x => Math.abs(x) > 1e-6)) return { ok: false, error: 'Verification failed — equation likely invalid.' };
  return { ok: true, coeffs: ints, compounds, reactantCount: reactants.length };
}

function formatBalanced(res: BalanceResult): string {
  if (!res.ok || !res.coeffs) return '';
  const render = (i: number) => {
    const c = res.coeffs![i];
    return (c === 1 ? '' : c) + res.compounds![i];
  };
  const left = res.compounds!.slice(0, res.reactantCount).map((_, i) => render(i)).join(' + ');
  const right = res.compounds!.slice(res.reactantCount).map((_, i) => render(res.reactantCount! + i)).join(' + ');
  return left + '  →  ' + right;
}
// ─── TAB 2 · EQUATION BALANCER ───
const BALANCE_PRESETS = [
  'H2 + O2 -> H2O',
  'Fe + O2 -> Fe2O3',
  'C3H8 + O2 -> CO2 + H2O',
  'Al + HCl -> AlCl3 + H2',
  'NH3 + O2 -> NO + H2O',
  'Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O',
  'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O',
  'Fe2(SO4)3 + NaOH -> Fe(OH)3 + Na2SO4'
];

function EquationBalancer() {
  const [eq, setEq] = useState('H2 + O2 -> H2O');
  const res = balanceEquation(eq);
  return (
    <CalcCard title="Chemical Equation Balancer" icon={Scale}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Balances by solving the element conservation system — works for redox, acid-base and combustion reactions with up to ~8 species.</p>
      <input type="text" value={eq} onChange={e => setEq(e.target.value)}
        placeholder="Enter equation, e.g.  C3H8 + O2 -> CO2 + H2O"
        className="w-full px-5 py-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-bold text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all mb-4" />
      <div className="flex flex-wrap gap-2 mb-8">
        {BALANCE_PRESETS.map(p => (
          <button key={p} onClick={() => setEq(p)}
            className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all font-mono">{p}</button>
        ))}
      </div>
      {!res.ok && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 text-sm font-bold text-rose-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {res.error}
        </div>
      )}
      {res.ok && (
        <div>
          <div className="p-6 rounded-[24px] bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 text-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-2 block">Balanced Equation</span>
            <p className="text-lg font-black font-mono text-surface-900 dark:text-surface-50 tracking-tight">{formatBalanced(res)}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent-600"><CheckCircle2 className="w-4 h-4" /> Verified — atom conservation holds on both sides</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {res.compounds!.map((c, i) => (
              <div key={c + i} className="p-4 rounded-2xl bg-surface-50/50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">{i < res.reactantCount! ? 'Reactant' : 'Product'}</p>
                <p className="text-sm font-black font-mono text-surface-900 dark:text-surface-50">{res.coeffs![i]} {c}</p>
                <p className="text-[10px] text-surface-400 font-bold mt-1">{formulaBreakdown(c)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </CalcCard>
  );
}
// ─── TAB 3 · STOICHIOMETRY & LIMITING REAGENT ───
function StoichiometryCalc() {
  const [eq, setEq] = useState('N2 + H2 -> NH3');
  const [massA, setMassA] = useState('28');
  const [massB, setMassB] = useState('');
  const bal = balanceEquation(eq);
  const massAv = parseFloat(massA), massBv = massB.trim() !== '' ? parseFloat(massB) : NaN;
  let result: { limiting: string; products: { formula: string; mass: number; moles: number }[]; excess: { formula: string; mass: number }[] } | null = null;
  let error: string | null = null;
  if (bal.ok) {
    const coeffs = bal.coeffs!, compounds = bal.compounds!, nR = bal.reactantCount!;
    if (!isFinite(massAv) || massAv < 0) error = 'Enter a valid non-negative mass for the first reactant.';
    else if (nR >= 2 && massB.trim() !== '' && (!isFinite(massBv) || massBv < 0)) {
      error = 'Enter a valid non-negative mass for the second reactant.';
    } else {
      const mws = compounds.map(c => formulaMass(c));
      if (mws.some(m => m === null)) error = 'Could not determine molar mass of every species.';
      else {
        const molesA = massAv / mws[0]!;
        let limitingIdx = 0;
        let ratioMin = molesA / coeffs[0];
        if (nR >= 2 && !isNaN(massBv) && massBv >= 0) {
          const molesB = massBv / mws[1]!;
          const ratioB = molesB / coeffs[1];
          if (ratioB < ratioMin) { limitingIdx = 1; ratioMin = ratioB; }
        }
        const progress = ratioMin;
        const products = compounds.slice(nR).map((c, i) => {
          const coeff = coeffs[nR + i];
          return { formula: c, moles: coeff * progress, mass: coeff * progress * mws[nR + i]! };
        });
        const excess: { formula: string; mass: number }[] = [];
        for (let i = 0; i < Math.min(nR, 2); i++) {
          if (i === limitingIdx) continue;
          if (i === 1 && (massB.trim() === '' || isNaN(massBv))) continue;
          const usedMoles = coeffs[i] * progress;
          const totalMoles = (i === 0 ? massAv : massBv) / mws[i]!;
          const left = totalMoles - usedMoles;
          if (left > 1e-9) excess.push({ formula: compounds[i], mass: left * mws[i]! });
        }
        result = { limiting: compounds[limitingIdx], products, excess };
      }
    }
  } else error = bal.error || null;
  return (
    <CalcCard title="Stoichiometry & Limiting Reagent" icon={Beaker}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Converts grams → moles, identifies the limiting reagent, and predicts product masses (assumes 100% conversion of the limiting reagent).</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
        <div>
          <label className="text-sm font-bold text-surface-500 mb-2 block">Balanced Equation</label>
          <input type="text" value={eq} onChange={e => setEq(e.target.value)} placeholder="N2 + H2 -> NH3"
            className="w-full px-5 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-bold text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all" />
          {bal.ok && <p className="text-xs font-mono text-teal-600 mt-2 font-bold">{formatBalanced(bal)}</p>}
          {!bal.ok && bal.error && <p className="text-xs font-bold text-rose-500 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {bal.error}</p>}
          {bal.ok && bal.reactantCount! > 2 && <p className="text-xs font-bold text-accent-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Mass inputs cover the first 2 reactants only — extra reactants are assumed non-limiting.</p>}
        </div>
        <div className="space-y-4">
          <InputRow label={"Mass of " + (bal.ok ? bal.compounds![0] : 'Reactant 1')} unit="g" value={massA} onChange={setMassA} />
          {(!bal.ok || bal.reactantCount! >= 2) && (
            <InputRow label={"Mass of " + (bal.ok && bal.reactantCount! >= 2 ? bal.compounds![1] : 'Reactant 2') + ' (optional)'} unit="g" value={massB} onChange={setMassB} />
          )}
        </div>
      </div>
      {error && (
        <div className="mt-4 flex items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 text-sm font-bold text-rose-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {result && (
        <div className="mt-6">
          <div className="mb-6 flex items-center gap-3 p-5 rounded-[20px] bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50">
            <FlaskConical className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <p className="text-sm font-bold text-teal-700 dark:text-teal-300">
              Limiting Reagent: <span className="font-mono text-base">{result.limiting}</span>
              {result.excess.length > 0 && <span className="block text-xs text-teal-600/80 mt-0.5 font-medium">Reaction proceeds until {result.limiting} is fully consumed.</span>}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {result.products.map(p => <ResultBox key={p.formula} label={p.formula + ' Produced'} value={fmt(p.mass, 2)} unit="g" color="#0d9488" />)}
          </div>
          {result.excess.length > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3 block">Excess Reagent Remaining</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.excess.map(e => <ResultBox key={e.formula} label={e.formula + ' Unreacted'} value={fmt(e.mass, 2)} unit="g" color="#f59e0b" />)}
              </div>
            </div>
          )}
        </div>
      )}
    </CalcCard>
  );
}
// ─── TAB 4 · CONCENTRATION & DILUTION ───
function ConcentrationCalc() {
  const [formula, setFormula] = useState('NaCl');
  const [soluteMass, setSoluteMass] = useState('5.85');
  const [volume, setVolume] = useState('500');
  const [solventMass, setSolventMass] = useState('0.5');
  const [m1, setM1] = useState('2');
  const [v1, setV1] = useState('100');
  const [v2, setV2] = useState('500');
  const mw = formulaMass(formula);
  const m = parseFloat(soluteMass), vol = parseFloat(volume), solv = parseFloat(solventMass);
  const M1 = parseFloat(m1), V1 = parseFloat(v1), V2 = parseFloat(v2);
  const moles = mw && isFinite(m) && m >= 0 ? m / mw : NaN;
  const molarity = isFinite(moles) && isFinite(vol) && vol > 0 ? moles / (vol / 1000) : NaN;
  const molality = isFinite(moles) && isFinite(solv) && solv > 0 ? moles / solv : NaN;
  const massPct = isFinite(m) && m >= 0 && isFinite(solv) && solv >= 0 && m + solv * 1000 > 0 ? (m / (m + solv * 1000)) * 100 : NaN;
  const ppm = isFinite(massPct) && massPct >= 0 ? massPct * 10000 : NaN;
  const diluted = isFinite(M1) && M1 >= 0 && isFinite(V1) && V1 >= 0 && isFinite(V2) && V2 > 0 ? (M1 * V1) / V2 : NaN;
  return (
    <CalcCard title="Molarity, Dilution & Concentration" icon={Droplets}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">M = n/V · molality = n/kg solvent · M₁V₁ = M₂V₂ (dilution law). Assumes ideal solution volumes add.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Preparation from Solute</h4>
          <div className="mb-4">
            <label className="text-sm font-bold text-surface-500 mb-2 block">Solute Formula</label>
            <input type="text" value={formula} onChange={e => setFormula(e.target.value)} placeholder="e.g. NaCl, H2SO4, Ca(OH)2"
              className="w-full px-5 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-bold text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all" />
            {mw ? <p className="text-xs font-mono text-primary-600 mt-2 font-bold">M = {mw.toFixed(3)} g/mol</p> : <p className="text-xs font-bold text-rose-500 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Invalid or unsupported formula</p>}
          </div>
          <InputRow label="Solute Mass" unit="g" value={soluteMass} onChange={setSoluteMass} />
          <InputRow label="Solution Volume" unit="mL" value={volume} onChange={setVolume} />
          <InputRow label="Solvent Mass (for molality)" unit="kg" value={solventMass} onChange={setSolventMass} />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Serial Dilution</h4>
          <InputRow label="Stock Molarity (M₁)" unit="M" value={m1} onChange={setM1} />
          <InputRow label="Stock Volume Taken (V₁)" unit="mL" value={v1} onChange={setV1} />
          <InputRow label="Final Volume (V₂)" unit="mL" value={v2} onChange={setV2} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Molarity" value={!isFinite(molarity) ? '--' : fmt(molarity, 4)} unit="mol/L" color="#3b82f6" />
        <ResultBox label="Molality" value={!isFinite(molality) ? '--' : fmt(molality, 4)} unit="mol/kg" color="#8b5cf6" />
        <ResultBox label="Mass Percent" value={!isFinite(massPct) ? '--' : fmt(massPct, 3)} unit="% w/w" color="#10b981" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <ResultBox label="Concentration" value={!isFinite(ppm) ? '--' : fmt(ppm, 2)} unit="ppm" color="#f59e0b" />
        <ResultBox label="Moles of Solute" value={!isFinite(moles) ? '--' : fmt(moles, 4)} unit="mol" color="#06b6d4" />
        <ResultBox label="Diluted Molarity (M₂)" value={!isFinite(diluted) ? '--' : fmt(diluted, 4)} unit="mol/L" color="#ef4444" />
      </div>
    </CalcCard>
  );
}
// ─── TAB 5 · pH CALCULATOR ───
type pHMode = 'strong-acid' | 'strong-base' | 'weak-acid' | 'weak-base' | 'buffer';

function solveWeakChargeBalance(C: number, K: number): number {
  const Kw = 1e-14;
  if (C === 0) return 1e-7;
  // Exact charge-balance cubic: x^3 + K*x^2 - (K*C + Kw)*x - K*Kw = 0
  const f = (x: number) => x * x * x + K * x * x - (K * C + Kw) * x - K * Kw;
  let uLo = -7;
  let hi = Math.max(C + 1e-6, 1e-6);
  while (f(hi) < 0 && hi < 1e12) hi *= 2;
  let uHi = Math.log10(hi);
  for (let i = 0; i < 100; i++) {
    const uMid = (uLo + uHi) / 2;
    const xMid = Math.pow(10, uMid);
    const fm = f(xMid);
    if (fm === 0) return xMid;
    if (fm < 0) uLo = uMid;
    else uHi = uMid;
  }
  return Math.pow(10, (uLo + uHi) / 2);
}

function PHCalc() {
  const [mode, setMode] = useState<pHMode>('strong-acid');
  const [conc, setConc] = useState('0.01');
  const [ka, setKa] = useState('1.8e-5');
  const [kb, setKb] = useState('1.8e-5');
  const [pka, setPka] = useState('4.75');
  const [baseConc, setBaseConc] = useState('0.1');
  const [acidConc, setAcidConc] = useState('0.1');
  const C = parseFloat(conc), Ka = parseFloat(ka), Kb = parseFloat(kb);
  const pKa = parseFloat(pka), Aminus = parseFloat(baseConc), HA = parseFloat(acidConc);
  let pH = NaN, pOH = NaN, H = NaN, OH = NaN;
  const extra: { label: string; value: string }[] = [];
  if (mode === 'strong-acid') {
    if (isFinite(C) && C >= 0) {
      H = (C + Math.sqrt(C * C + 4e-14)) / 2;
      pH = -Math.log10(H); pOH = 14 - pH; OH = 1e-14 / H;
    }
  } else if (mode === 'strong-base') {
    if (isFinite(C) && C >= 0) {
      OH = (C + Math.sqrt(C * C + 4e-14)) / 2;
      pOH = -Math.log10(OH); pH = 14 - pOH; H = 1e-14 / OH;
    }
  } else if (mode === 'weak-acid') {
    if (isFinite(C) && C >= 0 && isFinite(Ka) && Ka > 0) {
      H = solveWeakChargeBalance(C, Ka);
      pH = -Math.log10(H); pOH = 14 - pH; OH = 1e-14 / H;
      if (C > 0) extra.push({ label: 'Degree of Ionization', value: fmt((Ka / (H + Ka)) * 100, 2) + '%' });
    }
  } else if (mode === 'weak-base') {
    if (isFinite(C) && C >= 0 && isFinite(Kb) && Kb > 0) {
      OH = solveWeakChargeBalance(C, Kb);
      pOH = -Math.log10(OH); pH = 14 - pOH; H = 1e-14 / OH;
      if (C > 0) extra.push({ label: 'Degree of Ionization', value: fmt((Kb / (OH + Kb)) * 100, 2) + '%' });
    }
  } else if (mode === 'buffer') {
    if (isFinite(pKa) && isFinite(Aminus) && Aminus > 0 && isFinite(HA) && HA > 0) {
      pH = pKa + Math.log10(Aminus / HA);
      H = Math.pow(10, -pH); pOH = 14 - pH; OH = 1e-14 / H;
      extra.push({ label: 'Buffer Ratio [A⁻]/[HA]', value: fmt(Aminus / HA, 3) });
    }
  }
  const status = isFinite(pH) ? (Math.abs(pH - 7) < 1e-3 ? 'Neutral' : pH < 7 ? 'Acidic' : 'Basic') : null;
  const statusColor = status === 'Acidic' ? '#ef4444' : status === 'Basic' ? '#3b82f6' : '#10b981';
  return (
    <CalcCard title="pH Calculator" icon={FlaskConical}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">pH = −log[H⁺] · pOH = 14 − pH · Exact charge-balance cubic for weak acids/bases &amp; Henderson–Hasselbalch for buffers (25 °C).</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {([['strong-acid', 'Strong Acid'], ['strong-base', 'Strong Base'], ['weak-acid', 'Weak Acid'], ['weak-base', 'Weak Base'], ['buffer', 'Buffer (HH)']] as [pHMode, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)}
            className={"px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all " + (mode === id ? 'bg-primary-600 text-surface-50 shadow-lg shadow-primary-600/20' : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-primary-600')}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
        <div className="space-y-4">
          {(mode === 'strong-acid' || mode === 'strong-base' || mode === 'weak-acid' || mode === 'weak-base') && <InputRow label="Concentration" unit="mol/L" value={conc} onChange={setConc} />}
          {mode === 'weak-acid' && <InputRow label="Acid Dissociation Constant (Kₐ)" unit="" value={ka} onChange={setKa} />}
          {mode === 'weak-base' && <InputRow label="Base Dissociation Constant (K_b)" unit="" value={kb} onChange={setKb} />}
          {mode === 'buffer' && <InputRow label="pKₐ of Weak Acid" unit="" value={pka} onChange={setPka} />}
        </div>
        <div className="space-y-4">
          {mode === 'buffer' && <InputRow label="Conjugate Base [A⁻]" unit="mol/L" value={baseConc} onChange={setBaseConc} />}
          {mode === 'buffer' && <InputRow label="Weak Acid [HA]" unit="mol/L" value={acidConc} onChange={setAcidConc} />}
          {mode === 'buffer' && (
            <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 text-xs text-surface-500 font-medium flex items-start gap-2">
              <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
              Buffers resist pH change; maximum capacity when [A⁻] = [HA] (pH = pKₐ).
            </div>
          )}
        </div>
      </div>
      {isFinite(pH) && status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ResultBox label="pH" value={fmt(pH, 3)} unit="" color={statusColor} />
          <ResultBox label="pOH" value={fmt(pOH, 3)} unit="" color="#6366f1" />
          <ResultBox label="Solution" value={status} unit="" color={statusColor} />
        </div>
      )}
      {isFinite(pH) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <ResultBox label="[H⁺]" value={H < 0.001 ? H.toExponential(3) : fmt(H, 4)} unit="mol/L" color="#ef4444" />
          <ResultBox label="[OH⁻]" value={OH < 0.001 ? OH.toExponential(3) : fmt(OH, 4)} unit="mol/L" color="#3b82f6" />
          {extra.map(e => <ResultBox key={e.label} label={e.label} value={e.value} unit="" color="#06b6d4" />)}
        </div>
      )}
      {isFinite(pH) && (
        <div className="mt-6">
          <div className="w-full h-3 rounded-full bg-gradient-to-r from-rose-500 via-accent-500 to-primary-600 relative">
            <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-50 border-2 shadow-lg transition-all" style={{ borderColor: statusColor, left: 'calc(' + Math.min(100, Math.max(0, pH / 14 * 100)) + '% - 10px)' }} />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-surface-400 mt-2">
            <span>0 · Strong Acid</span><span>7 · Neutral</span><span>14 · Strong Base</span>
          </div>
        </div>
      )}
    </CalcCard>
  );
}
// ─── TAB 6 · EQUILIBRIUM (ICE SOLVER) ───
function EquilibriumCalc() {
  const [a, setA] = useState('1'); const [b, setB] = useState('1');
  const [c, setC] = useState('2');
  const [a0, setA0] = useState('1'); const [b0, setB0] = useState('1');
  const [c0, setC0] = useState('0');
  const [kc, setKc] = useState('4');
  const av = parseFloat(a), bv = parseFloat(b), cv = parseFloat(c);
  const A0 = parseFloat(a0), B0 = parseFloat(b0), C0 = parseFloat(c0);
  const K = parseFloat(kc);
  let x = NaN, concs: { label: string; value: number }[] = [], error: string | null = null;
  let direction: 'forward' | 'reverse' | 'equilibrium' = 'forward';

  if (
    isFinite(av) && isFinite(bv) && isFinite(cv) &&
    isFinite(A0) && isFinite(B0) && isFinite(C0) && isFinite(K) &&
    av >= 0 && bv >= 0 && (av > 0 || bv > 0) && cv > 0 &&
    A0 >= 0 && B0 >= 0 && C0 >= 0 && K > 0
  ) {
    const xMax = Math.min(av > 0 ? A0 / av : Infinity, bv > 0 ? B0 / bv : Infinity);
    const xMin = -C0 / cv;
    const logK = Math.log(K);

    // Strictly increasing log-residual g(x) = ln(Q(x)) - ln(K)
    const logResidual = (xx: number): number => {
      const cC = C0 + cv * xx;
      const cA = A0 - av * xx;
      const cB = B0 - bv * xx;
      if (cC <= 0) return -Infinity;
      if ((av > 0 && cA <= 0) || (bv > 0 && cB <= 0)) return Infinity;
      let logQ = cv * Math.log(cC);
      if (av > 0) logQ -= av * Math.log(cA);
      if (bv > 0) logQ -= bv * Math.log(cB);
      return logQ - logK;
    };

    if (xMax === 0 && xMin === 0) {
      error = 'Cannot solve — no reactant or product is present to establish equilibrium.';
    } else {
      const g0 = logResidual(0);
      if (Math.abs(g0) < 1e-12) {
        x = 0;
        direction = 'equilibrium';
      } else if (g0 < 0) {
        // Forward shift: Q(0) < K
        direction = 'forward';
        let lo = 0;
        let hi = xMax * (1 - 1e-12);
        if (hi <= lo) {
          x = 0;
        } else if (logResidual(hi) <= 0) {
          x = xMax;
        } else {
          for (let i = 0; i < 200; i++) {
            const mid = (lo + hi) / 2;
            const gm = logResidual(mid);
            if (Math.abs(gm) < 1e-12 || Math.abs(hi - lo) <= 1e-12 * Math.max(Math.abs(lo), Math.abs(hi), 1e-30)) {
              lo = hi = mid;
              break;
            }
            if (gm < 0) lo = mid;
            else hi = mid;
          }
          x = (lo + hi) / 2;
        }
      } else {
        // Reverse shift: Q(0) > K
        direction = 'reverse';
        let lo = (-C0 / cv) * (1 - 1e-12);
        let hi = 0;
        if (lo >= hi) {
          x = 0;
        } else if (logResidual(lo) >= 0) {
          x = xMin;
        } else {
          for (let i = 0; i < 200; i++) {
            const mid = (lo + hi) / 2;
            const gm = logResidual(mid);
            if (Math.abs(gm) < 1e-12 || Math.abs(hi - lo) <= 1e-12 * Math.max(Math.abs(lo), Math.abs(hi), 1e-30)) {
              lo = hi = mid;
              break;
            }
            if (gm < 0) lo = mid;
            else hi = mid;
          }
          x = (lo + hi) / 2;
        }
      }

      if (isFinite(x)) {
        concs = [
          { label: 'A', value: Math.max(0, A0 - av * x) },
          { label: 'B', value: Math.max(0, B0 - bv * x) },
          { label: 'C', value: Math.max(0, C0 + cv * x) },
        ];
      }
    }
  } else {
    error = 'Enter valid non-negative concentrations, positive K, c > 0, and at least one reactant coefficient > 0.';
  }
  return (
    <CalcCard title="Equilibrium ICE Solver" icon={Equal}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">aA + bB ⇌ cC — solves the extent of reaction x from K = [C]ᶜ / ([A]ᵃ[B]ᵇ) in log-space for forward or reverse shifts.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Stoichiometric Coefficients</h4>
          <InputRow label="a (reactant A)" unit="" value={a} onChange={setA} />
          <InputRow label="b (reactant B)" unit="" value={b} onChange={setB} />
          <InputRow label="c (product C)" unit="" value={c} onChange={setC} />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Initial Concentrations (mol/L)</h4>
          <InputRow label="[A]₀" unit="M" value={a0} onChange={setA0} />
          <InputRow label="[B]₀" unit="M" value={b0} onChange={setB0} />
          <InputRow label="[C]₀" unit="M" value={c0} onChange={setC0} />
          <InputRow label="Equilibrium Constant (K)" unit="" value={kc} onChange={setKc} />
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 text-sm font-bold text-rose-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {isFinite(x) && concs.length > 0 && (
        <div>
          <div className="mb-6 flex items-center gap-3 p-5 rounded-[20px] bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/50">
            <CheckCircle2 className="w-5 h-5 text-accent-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-accent-700 dark:text-accent-300">Extent of Reaction: x = {fmt(x, 4)} mol/L</p>
              <p className="text-xs text-accent-600/80 font-medium mt-0.5">
                {direction === 'forward'
                  ? 'Reaction proceeds in the forward direction (Q₀ < K) until equilibrium is reached.'
                  : direction === 'reverse'
                    ? 'Reaction shifts in the reverse direction (Q₀ > K) until equilibrium is reached.'
                    : 'System is already at chemical equilibrium (Q₀ = K).'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {concs.map(cf => <ResultBox key={cf.label} label={'Equilibrium [' + cf.label + ']'} value={fmt(cf.value, 4)} unit="mol/L" color="#10b981" />)}
          </div>
        </div>
      )}
    </CalcCard>
  );
}
// ─── TAB 7 · ROOT FINDER ───
const SUP: Record<number, string> = { 1: '¹', 2: '²', 3: '³', 4: '⁴' };
function evalPoly(coeffs: number[], x: number): number {
  let acc = 0;
  for (const c of coeffs) acc = acc * x + c;
  return acc;
}

function derivPoly(coeffs: number[]): number[] {
  const deg = coeffs.length - 1;
  if (deg <= 0) return [0];
  return coeffs.slice(0, -1).map((c, i) => c * (deg - i));
}

function findRoots(rawCoeffs: number[], lo: number, hi: number): number[] {
  const firstNZ = rawCoeffs.findIndex(c => Math.abs(c) > 1e-12);
  if (firstNZ === -1) return [];
  const coeffs = rawCoeffs.slice(firstNZ);
  const deg = coeffs.length - 1;
  if (deg <= 0) return [];
  if (deg === 1) {
    const r = -coeffs[1] / coeffs[0];
    if (r >= lo - 1e-9 && r <= hi + 1e-9) {
      return [Math.round(Math.min(hi, Math.max(lo, r)) * 1e7) / 1e7];
    }
    return [];
  }

  const roots: number[] = [];
  const maxCoef = Math.max(...coeffs.map(Math.abs), 1);
  const zeroTol = 1e-9 * maxCoef;
  const tangentTol = 1e-7 * maxCoef;

  const push = (r: number) => {
    if (r < lo - 1e-7 || r > hi + 1e-7) return;
    const clamped = Math.min(hi, Math.max(lo, r));
    const rr = Math.round(clamped * 1e7) / 1e7;
    const normalized = Object.is(rr, -0) ? 0 : rr;
    if (!roots.some(ex => Math.abs(ex - normalized) < 1e-5)) roots.push(normalized);
  };

  const N = 4000;
  let prevX = lo, prevF = evalPoly(coeffs, lo);
  if (Math.abs(prevF) < zeroTol) push(lo);
  for (let i = 1; i <= N; i++) {
    const x = lo + (hi - lo) * (i / N);
    const f = evalPoly(coeffs, x);
    if (Math.abs(f) < zeroTol) { push(x); prevX = x; prevF = f; continue; }
    if (prevF * f < 0) {
      let a = prevX, b = x;
      let fa = prevF;
      for (let iter = 0; iter < 80; iter++) {
        const mid = (a + b) / 2;
        const fm = evalPoly(coeffs, mid);
        if (Math.abs(fm) < 1e-12 * maxCoef || Math.abs(b - a) < 1e-12) { a = b = mid; break; }
        if (fa * fm < 0) b = mid;
        else { a = mid; fa = fm; }
      }
      push((a + b) / 2);
    }
    prevX = x; prevF = f;
  }

  // Detect tangent / even-multiplicity roots via critical points of f'(x)
  const critPts = findRoots(derivPoly(coeffs), lo, hi);
  for (const cp of critPts) {
    if (Math.abs(evalPoly(coeffs, cp)) < tangentTol) {
      push(cp);
    }
  }

  return roots.sort((a, b) => a - b);
}

const DEGREE_DEFAULTS: Record<number, string[]> = {
  1: ['1', '-2'],
  2: ['1', '-3', '2'],
  3: ['1', '-6', '11', '-6'],
  4: ['1', '0', '-5', '0', '4'],
};

function RootFinder() {
  const [degree, setDegree] = useState(2);
  const [coeffs, setCoeffs] = useState<string[]>(['1', '-3', '2']);
  const [lo, setLo] = useState('-10');
  const [hi, setHi] = useState('10');
  const setDegreeAndReset = (d: number) => {
    setDegree(d);
    setCoeffs(DEGREE_DEFAULTS[d] ?? Array.from({ length: d + 1 }, (_, i) => (i === 0 ? '1' : i === d ? '-1' : '0')));
  };
  const nums = coeffs.map(c => parseFloat(c));
  const valid = nums.length === degree + 1 && nums.every(n => isFinite(n));
  const loN = parseFloat(lo), hiN = parseFloat(hi);
  const validRange = isFinite(loN) && isFinite(hiN) && loN < hiN;
  const firstNZ = valid ? nums.findIndex(n => Math.abs(n) > 1e-12) : -1;
  const effectiveDegree = !valid ? -2 : firstNZ === -1 ? -1 : nums.length - 1 - firstNZ;
  const roots = valid && validRange && effectiveDegree >= 1 ? findRoots(nums, loN, hiN) : [];

  const display = valid
    ? nums
        .map((n, i) => ({ n, exp: degree - i }))
        .filter(({ n }) => n !== 0)
        .map(({ n, exp }, idx) => {
          const sign = n < 0 ? (idx === 0 ? '−' : ' − ') : (idx === 0 ? '' : ' + ');
          const abs = Math.abs(n);
          const coef = abs === 1 && exp > 0 ? '' : fmt(abs, 4);
          return sign + coef + (exp === 0 ? '' : 'x') + (exp > 1 ? (SUP[exp] || '^' + exp) : '');
        })
        .join('')
    : '';

  return (
    <CalcCard title="Root Finder — Polynomial Solver" icon={FunctionSquare}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Finds all real roots (including repeated/tangent roots) of f(x) = 0 via interval scanning, bisection, and critical-point checks.</p>
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <span className="text-sm font-bold text-surface-500">Degree:</span>
        {[1, 2, 3, 4].map(d => (
          <button key={d} onClick={() => setDegreeAndReset(d)}
            className={'px-4 py-2 rounded-xl text-xs font-black transition-all ' + (degree === d ? 'bg-accent-500 text-surface-50 shadow-lg shadow-accent-500/20' : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-accent-600')}>{d}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {coeffs.map((c, i) => {
          const exp = degree - i;
          const label = exp === 0 ? 'Constant (c)' : exp === 1 ? 'x coefficient' : `x^${exp} coefficient`;
          return (
            <div key={i}>
              <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 block">{label}</label>
              <input type="number" step="any" value={c}
                onChange={e => { const next = [...coeffs]; next[i] = e.target.value; setCoeffs(next); }}
                className="w-full px-4 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-bold text-sm outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all" />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <InputRow label="Search Lower Bound" unit="" value={lo} onChange={setLo} />
        <InputRow label="Search Upper Bound" unit="" value={hi} onChange={setHi} />
      </div>
      {valid && <div className="mb-6 p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 font-mono text-sm font-bold text-surface-700 dark:text-surface-200 overflow-x-auto">f(x) = {display || '0'}</div>}
      {valid && !validRange && (
        <div className="mb-6 flex items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 text-sm font-bold text-rose-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Lower bound must be strictly less than upper bound.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox
          label="Real Roots Found"
          value={effectiveDegree === -1 ? 'All real x' : roots.length > 0 ? roots.map(r => fmt(r, 6)).join(', ') : 'None'}
          unit=""
          color="#f97316"
        />
        <ResultBox label="Root Count" value={effectiveDegree === -1 ? '∞' : roots.length} unit={effectiveDegree === -1 ? 'identity' : 'roots'} color="#6366f1" />
        <ResultBox label="Search Range" value={validRange ? '[' + fmt(loN, 2) + ', ' + fmt(hiN, 2) + ']' : '--'} unit="" color="#10b981" />
      </div>
      {valid && effectiveDegree === -1 && (
        <p className="mt-4 text-xs text-surface-400 font-medium flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> Zero polynomial f(x) ≡ 0 — every real number is a root.
        </p>
      )}
      {valid && effectiveDegree === 0 && (
        <p className="mt-4 text-xs text-surface-400 font-medium flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> Non-zero constant polynomial — f(x) never equals zero and has no roots.
        </p>
      )}
      {valid && validRange && effectiveDegree > 0 && roots.length < effectiveDegree && (
        <p className="mt-4 text-xs text-surface-400 font-medium flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> Remaining roots of this degree-{effectiveDegree} polynomial are either complex, repeated (multiplicity &gt; 1), or lie outside [{fmt(loN, 2)}, {fmt(hiN, 2)}].
        </p>
      )}
    </CalcCard>
  );
}
// ─── Linear algebra helpers ───
function determinant(A: number[][]): number {
  const n = A.length;
  const M = A.map(r => [...r]);
  let det = 1, sign = 1;
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[pivot][i])) pivot = r;
    if (Math.abs(M[pivot][i]) < 1e-12) return 0;
    if (pivot !== i) { [M[i], M[pivot]] = [M[pivot], M[i]]; sign *= -1; }
    det *= M[i][i];
    for (let r = i + 1; r < n; r++) {
      const f = M[r][i] / M[i][i];
      for (let c = i; c < n; c++) M[r][c] -= f * M[i][c];
    }
  }
  return sign * det;
}

function inverseMatrix(A: number[][]): number[][] | null {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[pivot][i])) pivot = r;
    if (Math.abs(M[pivot][i]) < 1e-12) return null;
    [M[i], M[pivot]] = [M[pivot], M[i]];
    const pv = M[i][i];
    for (let c = 0; c < 2 * n; c++) M[i][c] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = M[r][i];
      for (let c = 0; c < 2 * n; c++) M[r][c] -= f * M[i][c];
    }
  }
  return M.map(row => row.slice(n));
}

function solveLinear(A: number[][], b: number[]): { x: number[] | null; status: string } {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  let pivots = 0;
  for (let col = 0; col < n && pivots < n; col++) {
    const row = pivots;
    let pivot = row;
    for (let r = row + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-12) continue;
    [M[row], M[pivot]] = [M[pivot], M[row]];
    const pv = M[row][col];
    for (let c = 0; c <= n; c++) M[row][c] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === row) continue;
      const f = M[r][col];
      if (Math.abs(f) < 1e-12) continue;
      for (let c = 0; c <= n; c++) M[r][c] -= f * M[row][c];
    }
    pivots++;
  }
  if (pivots === n) return { x: M.map(row => row[n]), status: 'Unique solution' };
  for (let r = 0; r < n; r++) {
    let allZero = true;
    for (let c = 0; c < n; c++) if (Math.abs(M[r][c]) > 1e-10) { allZero = false; break; }
    if (allZero && Math.abs(M[r][n]) > 1e-10) return { x: null, status: 'No solution (inconsistent system)' };
  }
  return { x: null, status: 'Infinite solutions (singular matrix)' };
}
// ─── TAB 8 · MATRIX SOLVER ───
function MatrixSolver() {
  const [size, setSize] = useState(2);
  const [entries, setEntries] = useState<string[]>(['2', '1', '1', '3']);
  const [bvec, setBvec] = useState<string[]>(['7', '8']);
  const changeSize = (n: number) => {
    setSize(n);
    if (n === 2) {
      setEntries(['2', '1', '1', '3']);
      setBvec(['7', '8']);
    } else {
      setEntries(Array.from({ length: n * n }, (_, idx) => {
        const r = Math.floor(idx / n);
        const c = idx % n;
        return String(r === c ? n + 1 : 1);
      }));
      setBvec(Array.from({ length: n }, (_, i) => String(i + 1)));
    }
  };
  const A: number[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => parseFloat(entries[r * size + c]))
  );
  const b = bvec.map(v => parseFloat(v));
  const valid = A.flat().every(n => isFinite(n)) && b.every(n => isFinite(n));
  const det = valid ? determinant(A) : NaN;
  const inv = valid ? inverseMatrix(A) : null;
  const sol = valid ? solveLinear(A, b) : null;
  return (
    <CalcCard title="Matrix Solver — Determinant, Inverse & Ax = b" icon={Table2}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Solves linear systems by Gauss–Jordan elimination with partial pivoting. Handles 2×2 to 4×4 systems.</p>
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <span className="text-sm font-bold text-surface-500">Matrix Size:</span>
        {[2, 3, 4].map(n => (
          <button key={n} onClick={() => changeSize(n)}
            className={'px-4 py-2 rounded-xl text-xs font-black transition-all ' + (size === n ? 'bg-primary-600 text-surface-50 shadow-lg shadow-primary-600/20' : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-primary-600')}>{n}×{n}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Matrix A</h4>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(' + size + ', minmax(0, 1fr))' }}>
            {entries.map((v, i) => (
              <input key={i} type="number" step="any" value={v}
                onChange={e => { const next = [...entries]; next[i] = e.target.value; setEntries(next); }}
                className="w-full px-3 py-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-bold text-sm text-center outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all" />
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Vector b (right-hand side)</h4>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(' + size + ', minmax(0, 1fr))' }}>
            {bvec.map((v, i) => (
              <input key={i} type="number" step="any" value={v}
                onChange={e => { const next = [...bvec]; next[i] = e.target.value; setBvec(next); }}
                className="w-full px-3 py-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-bold text-sm text-center outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all" />
            ))}
          </div>
        </div>
      </div>
      {valid && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ResultBox label="Determinant" value={fmt(det, 4)} unit="" color="#6366f1" />
          <ResultBox label="Solution Status" value={sol ? sol.status : '--'} unit="" color={sol && sol.status === 'Unique solution' ? '#10b981' : '#f59e0b'} />
          <ResultBox label="Solution x" value={sol && sol.x ? '(' + sol.x.map(v => fmt(v, 4)).join(', ') + ')' : '—'} unit="" color={sol && sol.x ? '#10b981' : '#ef4444'} />
        </div>
      )}
      {valid && inv && (
        <div className="mt-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3 block">Inverse Matrix A⁻¹</span>
          <div className="inline-grid gap-2 p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800" style={{ gridTemplateColumns: 'repeat(' + size + ', minmax(72px, 1fr))' }}>
            {inv.flat().map((v, i) => (
              <div key={i} className="px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800 text-center font-mono text-xs font-bold text-surface-700 dark:text-surface-200 border border-surface-100 dark:border-surface-700">{fmt(v, 4)}</div>
            ))}
          </div>
        </div>
      )}
      {valid && !inv && (
        <div className="mt-8 flex items-center gap-2 p-4 rounded-2xl bg-accent-50 dark:bg-accent-900/10 border border-accent-200 dark:border-accent-900/50 text-sm font-bold text-accent-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> det(A) = 0 — matrix is singular and has no inverse.
        </div>
      )}
    </CalcCard>
  );
}
// ─── TAB 9 · REGRESSION & STATISTICS ───
type RegressionFit = 'linear' | 'quadratic' | 'exp';

const REGRESSION_PRESETS: { name: string; fit: RegressionFit; points: [string, string][] }[] = [
  { name: 'Linear Trend', fit: 'linear', points: [['1', '2.2'], ['2', '4.1'], ['3', '5.9'], ['4', '8.2'], ['5', '10.1']] },
  { name: 'Parabolic', fit: 'quadratic', points: [['-2', '4'], ['-1', '1'], ['0', '0'], ['1', '1'], ['2', '4']] },
  { name: 'Rising Curve', fit: 'exp', points: [['0', '1'], ['1', '2.7'], ['2', '7.4'], ['3', '20.1'], ['4', '54.6']] },
];

function RegressionCalc() {
  const [points, setPoints] = useState<[string, string][]>([['1', '2'], ['2', '4'], ['3', '5'], ['4', '8'], ['5', '10']]);
  const [fit, setFit] = useState<RegressionFit>('linear');
  const [xPred, setXPred] = useState('6');
  const pts = points.map(([x, y]) => ({ x: parseFloat(x), y: parseFloat(y) })).filter(p => isFinite(p.x) && isFinite(p.y));
  const n = pts.length;
  const minPts = fit === 'quadratic' ? 3 : 2;
  let model: { type: RegressionFit; predict: (x: number) => number; r2: number; equation: string } | null = null;
  let fitError: string | null = null;

  if (n < minPts) {
    fitError = fit === 'quadratic'
      ? 'Need at least 3 valid data points for a quadratic fit.'
      : 'Need at least 2 valid data points.';
  } else {
    const sumX = pts.reduce((a, p) => a + p.x, 0);
    const sumY = pts.reduce((a, p) => a + p.y, 0);
    const sumXY = pts.reduce((a, p) => a + p.x * p.y, 0);
    const sumX2 = pts.reduce((a, p) => a + p.x * p.x, 0);
    const sumX3 = pts.reduce((a, p) => a + p.x ** 3, 0);
    const sumX4 = pts.reduce((a, p) => a + p.x ** 4, 0);
    const sumX2Y = pts.reduce((a, p) => a + p.x * p.x * p.y, 0);
    let predict: ((x: number) => number) | null = null;
    let equation = '';

    if (fit === 'linear') {
      const denom = n * sumX2 - sumX * sumX;
      if (Math.abs(denom) > 1e-12) {
        const m = (n * sumXY - sumX * sumY) / denom;
        const c = (sumY - m * sumX) / n;
        predict = (x: number) => c + m * x;
        equation = 'y = ' + fmt(m, 4) + 'x ' + (c >= 0 ? '+ ' : '− ') + fmt(Math.abs(c), 4);
      } else {
        fitError = 'Cannot fit linear model — all x-values are identical (collinear vertical points).';
      }
    } else if (fit === 'quadratic') {
      const S = solveLinear([[n, sumX, sumX2], [sumX, sumX2, sumX3], [sumX2, sumX3, sumX4]], [sumY, sumXY, sumX2Y]);
      if (S.x) {
        const [c0, c1, c2] = S.x;
        predict = (x: number) => c0 + c1 * x + c2 * x * x;
        equation = 'y = ' + fmt(c2, 4) + 'x² ' + (c1 >= 0 ? '+ ' : '− ') + fmt(Math.abs(c1), 4) + 'x ' + (c0 >= 0 ? '+ ' : '− ') + fmt(Math.abs(c0), 4);
      } else {
        fitError = 'Cannot fit quadratic model — x-values are collinear or fewer than 3 distinct x-values exist.';
      }
    } else {
      if (pts.some(p => p.y <= 0)) {
        fitError = 'Exponential fit requires all y-values to be strictly positive (y > 0).';
      } else {
        const denom = n * sumX2 - sumX * sumX;
        if (Math.abs(denom) > 1e-12) {
          const sumLnY = pts.reduce((a, p) => a + Math.log(p.y), 0);
          const sumXLnY = pts.reduce((a, p) => a + p.x * Math.log(p.y), 0);
          const b = (n * sumXLnY - sumX * sumLnY) / denom;
          const a = Math.exp((sumLnY - b * sumX) / n);
          predict = (x: number) => a * Math.exp(b * x);
          equation = 'y = ' + fmt(a, 4) + ' · e^(' + fmt(b, 4) + 'x)';
        } else {
          fitError = 'Cannot fit exponential model — all x-values are identical (collinear vertical points).';
        }
      }
    }

    if (predict) {
      const yMean = sumY / n;
      const ssTot = pts.reduce((a, p) => a + (p.y - yMean) ** 2, 0);
      const ssRes = pts.reduce((a, p) => a + (p.y - predict!(p.x)) ** 2, 0);
      const r2 = ssTot > 1e-12 ? 1 - ssRes / ssTot : 1;
      model = { type: fit, predict, r2, equation };
    }
  }
  const xp = parseFloat(xPred);
  const predY = model && isFinite(xp) ? model.predict(xp) : NaN;
  const yValues = pts.map(p => p.y);
  const mean = n > 0 ? yValues.reduce((a, b) => a + b, 0) / n : NaN;
  const variance = n > 1 ? yValues.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : NaN;
  const sd = Math.sqrt(variance);
  const sorted = yValues.toSorted((a, b) => a - b);
  const median = n > 0 ? (n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2) : NaN;
  return (
    <CalcCard title="Regression & Curve Fitting" icon={TrendingUp}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">Least-squares fit (linear, quadratic, or exponential) with R², plus descriptive statistics of the y-data.</p>
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-surface-500">Fit Type:</span>
          {([['linear', 'Linear'], ['quadratic', 'Quadratic'], ['exp', 'Exponential']] as [RegressionFit, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFit(f)}
              className={'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ' + (fit === f ? 'bg-accent-600 text-surface-50 shadow-lg shadow-accent-600/20' : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-accent-600')}>{label}</button>
          ))}
        </div>
        {REGRESSION_PRESETS.map(p => (
          <button key={p.name} onClick={() => { setPoints(p.points); setFit(p.fit); }}
            className="px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-500 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-all">{p.name}</button>
        ))}
      </div>
      <div className="mb-8">
        <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3 block">Data Points (x, y)</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {points.map((pt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="number" step="any" value={pt[0]}
                onChange={e => { const next = [...points]; next[i] = [e.target.value, pt[1]]; setPoints(next); }} placeholder="x"
                className="w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-bold text-sm text-center outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all" />
              <input type="number" step="any" value={pt[1]}
                onChange={e => { const next = [...points]; next[i] = [pt[0], e.target.value]; setPoints(next); }} placeholder="y"
                className="w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-surface-900 dark:text-surface-50 font-mono font-bold text-sm text-center outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all" />
              {points.length > 2 && (
                <button
                  type="button"
                  onClick={() => setPoints(points.filter((_, idx) => idx !== i))}
                  title="Remove point"
                  aria-label="Remove point"
                  className="px-2.5 py-2 rounded-xl border border-surface-200 dark:border-surface-800 text-surface-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-800 font-bold text-sm transition-colors flex-shrink-0"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {points.length < 10 && (
            <button onClick={() => setPoints([...points, ['', '']])}
              className="px-3 py-2.5 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-800 text-surface-400 text-xs font-bold hover:border-accent-400 hover:text-accent-500 transition-all">+ Add Point</button>
          )}
        </div>
      </div>
      {model ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <ResultBox label="Fitted Model" value={model.equation} unit="" color="#10b981" />
            <ResultBox label="R² (Goodness of Fit)" value={fmt(model.r2, 4)} unit="" color={model.r2 > 0.95 ? '#10b981' : model.r2 > 0.8 ? '#f59e0b' : '#ef4444'} />
            <ResultBox label="Data Points" value={n} unit="pts" color="#6366f1" />
            <ResultBox label="Std. Deviation (y)" value={fmt(sd, 4)} unit="" color="#06b6d4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <InputRow label="Predict at x =" unit="" value={xPred} onChange={setXPred} />
            <ResultBox label="Predicted y" value={!isFinite(predY) ? '--' : fmt(predY, 4)} unit="" color="#10b981" />
            <ResultBox label="Mean / Median (y)" value={fmt(mean, 3) + ' / ' + fmt(median, 3)} unit="" color="#8b5cf6" />
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-accent-50 dark:bg-accent-900/10 border border-accent-200 dark:border-accent-900/50 text-sm font-bold text-accent-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {fitError || 'Unable to compute regression model.'}
        </div>
      )}
    </CalcCard>
  );
}
// ─── TAB 10 · LINEAR INTERPOLATION ───
function InterpolationCalc() {
  const [x1, setX1] = useState('100'); const [y1, setY1] = useState('0.84');
  const [x2, setX2] = useState('200'); const [y2, setY2] = useState('1.02');
  const [xt, setXt] = useState('150');
  const X1 = parseFloat(x1), Y1 = parseFloat(y1), X2 = parseFloat(x2), Y2 = parseFloat(y2), XT = parseFloat(xt);
  const sameX = isFinite(X1) && isFinite(X2) && X1 === X2;
  const valid = isFinite(X1) && isFinite(Y1) && isFinite(X2) && isFinite(Y2) && isFinite(XT) && !sameX;
  const y = valid ? Y1 + (XT - X1) * ((Y2 - Y1) / (X2 - X1)) : NaN;
  const extrapolating = valid && (XT < Math.min(X1, X2) || XT > Math.max(X1, X2));
  return (
    <CalcCard title="Linear Interpolation" icon={Ruler}>
      <p className="text-sm text-surface-500 mb-8 font-medium italic">y = y₁ + (x − x₁)·(y₂ − y₁)/(x₂ − x₁) — classic steam-table & property-table interpolation.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <InputRow label="Point 1 — x₁" unit="" value={x1} onChange={setX1} />
          <InputRow label="Point 1 — y₁" unit="" value={y1} onChange={setY1} />
        </div>
        <div>
          <InputRow label="Point 2 — x₂" unit="" value={x2} onChange={setX2} />
          <InputRow label="Point 2 — y₂" unit="" value={y2} onChange={setY2} />
        </div>
      </div>
      <div className="max-w-md">
        <InputRow label="Target x" unit="" value={xt} onChange={setXt} />
      </div>
      {sameX && (
        <div className="mb-6 flex items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 text-sm font-bold text-rose-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> x₁ and x₂ must be distinct (x₁ ≠ x₂) to compute linear interpolation.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultBox label="Interpolated y" value={!isFinite(y) ? '--' : fmt(y, 5)} unit="" color="#06b6d4" />
        <ResultBox label="Slope (Δy/Δx)" value={valid ? fmt((Y2 - Y1) / (X2 - X1), 5) : '--'} unit="" color="#8b5cf6" />
        <ResultBox label="Position" value={!isFinite(y) ? '--' : (extrapolating ? 'Extrapolation ⚠' : 'Interpolation ✓')} unit="" color={extrapolating ? '#f59e0b' : '#10b981'} />
      </div>
      {extrapolating && (
        <p className="mt-4 text-xs font-bold text-accent-600 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> x lies outside [x₁, x₂] — result is an extrapolation and may be unreliable.
        </p>
      )}
    </CalcCard>
  );
}

// ─── MAIN MODULE ───
type ToolTab = 'molmass' | 'balancer' | 'stoich' | 'concentration' | 'ph' | 'equilibrium' | 'roots' | 'matrix' | 'regression' | 'interpolate';

export default function MathChemistryModule() {
  const [activeTab, setActiveTab] = useState<ToolTab>('molmass');
  const tabs = [
    { id: 'molmass', label: 'Mol. Weight', icon: Atom },
    { id: 'balancer', label: 'Balancer', icon: Scale },
    { id: 'stoich', label: 'Stoichiometry', icon: Beaker },
    { id: 'concentration', label: 'Concentration', icon: Droplets },
    { id: 'ph', label: 'pH', icon: FlaskConical },
    { id: 'equilibrium', label: 'Equilibrium', icon: Equal },
    { id: 'roots', label: 'Root Finder', icon: FunctionSquare },
    { id: 'matrix', label: 'Matrices', icon: Table2 },
    { id: 'regression', label: 'Regression', icon: TrendingUp },
    { id: 'interpolate', label: 'Interpolation', icon: Ruler },
  ] as const;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-surface-900 dark:text-surface-50 mb-1">Mathematics & Chemistry Tools</h1>
        <p className="text-surface-500 text-xs">Equation balancing, stoichiometry, concentration, pH, roots, and matrices.</p>
      </div>
      <div className="touch-scroll-x flex gap-2 border-b border-surface-200 dark:border-surface-800 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={'flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider pb-2.5 transition-all whitespace-nowrap border-b-2 ' + (activeTab === tab.id ? 'border-fuchsia-600 text-fuchsia-600 dark:text-fuchsia-400' : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200')}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>
      <div className="max-w-5xl">
        {activeTab === 'molmass' && <MolecularWeightCalc />}
        {activeTab === 'balancer' && <EquationBalancer />}
        {activeTab === 'stoich' && <StoichiometryCalc />}
        {activeTab === 'concentration' && <ConcentrationCalc />}
        {activeTab === 'ph' && <PHCalc />}
        {activeTab === 'equilibrium' && <EquilibriumCalc />}
        {activeTab === 'roots' && <RootFinder />}
        {activeTab === 'matrix' && <MatrixSolver />}
        {activeTab === 'regression' && <RegressionCalc />}
        {activeTab === 'interpolate' && <InterpolationCalc />}
      </div>
    </div>
  );
}
