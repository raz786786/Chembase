import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ShieldAlert, Shield, ShieldCheck, Flame, AlertOctagon, BookOpen,
  ClipboardList, HardHat, Eye, Info, CheckCircle2, X,
  ArrowRight, Plus, Siren, Lock, Ban
} from 'lucide-react';
import { CalcCard, InputRow, ResultBox } from './SharedComponents';

// ─── Formatting helpers ─────────────────────────────────────────────────────
function fmt(v: number | null | undefined, digits = 3, suffix = ''): string {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  return v.toFixed(digits) + suffix;
}

function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
      <Info className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{children}</p>
    </div>
  );
}

// ─── Risk matrix (ISO 31010-style 5×5) ──────────────────────────────────────
// Risk = Likelihood × Consequence. Levels: Low / Medium / High / Extreme.
const LIKELIHOODS = [
  { n: 1, name: 'Rare', desc: 'May occur only in exceptional circumstances' },
  { n: 2, name: 'Unlikely', desc: 'Could occur at some time' },
  { n: 3, name: 'Possible', desc: 'Might occur at some time' },
  { n: 4, name: 'Likely', desc: 'Will probably occur in most circumstances' },
  { n: 5, name: 'Almost certain', desc: 'Expected to occur in most circumstances' },
];
const CONSEQUENCES = [
  { n: 1, name: 'Negligible', desc: 'First-aid only, minor downtime' },
  { n: 2, name: 'Minor', desc: 'Medical treatment, localised release' },
  { n: 3, name: 'Moderate', desc: 'Lost-time injury, on-site release' },
  { n: 4, name: 'Major', desc: 'Fatality / permanent disability, off-site release' },
  { n: 5, name: 'Catastrophic', desc: 'Multiple fatalities, major off-site impact' },
];

function riskLevel(L: number, C: number): { level: string; color: string; action: string } {
  const s = L * C;
  if (s >= 15) return { level: 'Extreme', color: '#dc2626', action: 'Immediate action required — stop the activity, apply multiple independent safeguards.' };
  if (s >= 10) return { level: 'High', color: '#f97316', action: 'High priority — senior management attention and strong engineered controls required.' };
  if (s >= 5) return { level: 'Medium', color: '#eab308', action: 'Manageable — specific responsibility and documented controls.' };
  return { level: 'Low', color: '#22c55e', action: 'Acceptable — routine monitoring is sufficient.' };
}

interface RiskRow { id: number; activity: string; L: number; C: number; }
// TAB 1 · RISK ASSESSMENT & MATRIX
const cellColor = (s: number) => {
  if (s >= 15) return 'bg-red-500 text-surface-50';
  if (s >= 10) return 'bg-accent-400 text-surface-50';
  if (s >= 5) return 'bg-accent-400 text-accent-950';
  return 'bg-accent-500 text-surface-50';
};

const DEFAULT_RISKS: RiskRow[] = [
  { id: 1, activity: 'Opening a reactor manway for cleaning', L: 3, C: 3 },
  { id: 2, activity: 'Loading caustic drums by hand', L: 2, C: 4 },
  { id: 3, activity: 'Hot work near solvent storage', L: 3, C: 5 },
  { id: 4, activity: 'Routine valve line-up on HP gas', L: 4, C: 4 },
  { id: 5, activity: 'Office ergonomics', L: 2, C: 1 },
];

function RiskMatrixTab() {
  const [L, setL] = useState(3);
  const [C, setC] = useState(3);
  const [rows, setRows] = useState<RiskRow[]>(DEFAULT_RISKS);
  const idRef = useRef(6);
  const r = riskLevel(L, C);
  const setRow = (id: number, patch: Partial<RiskRow>) =>
    setRows(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  const addRow = () => setRows(prev => [...prev, { id: idRef.current++, activity: 'New activity', L: 2, C: 2 }]);
  const delRow = (id: number) => setRows(prev => prev.filter(x => x.id !== id));
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Risk matrix · likelihood × consequence" icon={ShieldAlert}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="pb-2 text-[10px] font-black uppercase text-surface-400 text-left">Likelihood ↓ / Consequence →</th>
                {CONSEQUENCES.map(c => (
                  <th key={c.n} className="pb-2 text-center">
                    <div className="text-[10px] font-black text-surface-500 dark:text-surface-400">{c.n}</div>
                    <div className="text-[9px] text-surface-400">{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...LIKELIHOODS].reverse().map(lk => (
                <tr key={lk.n}>
                  <td className="pr-2">
                    <div className="text-[10px] font-black text-surface-500 dark:text-surface-400">{lk.n} · {lk.name}</div>
                  </td>
                  {CONSEQUENCES.map(c => {
                    const s = lk.n * c.n;
                    const sel = lk.n === L && c.n === C;
                    return (
                      <td key={c.n}>
                        <button onClick={() => { setL(lk.n); setC(c.n); }}
                          className={`w-12 h-10 rounded-lg text-[10px] font-black transition-all ${cellColor(s)} ${sel
                            ? 'ring-2 ring-surface-900 dark:ring-white scale-110 shadow-lg'
                            : 'opacity-85 hover:opacity-100 hover:scale-105'}`}>
                          {s}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 rounded-2xl border" style={{ borderColor: r.color + '44', background: r.color + '14' }}>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" style={{ color: r.color }} />
            <p className="text-sm font-black" style={{ color: r.color }}>
              {LIKELIHOODS[L - 1].name} × {CONSEQUENCES[C - 1].name} → {r.level} (score {L * C})
            </p>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1.5">{r.action}</p>
        </div>
        <InfoNote>Risk = Likelihood × Consequence on a 5×5 grid (ISO 31010 / BS 8800 style). The score is a screening tool — ALARP judgements and tolerability criteria always need context.</InfoNote>
      </CalcCard>

      <CalcCard title="Risk register" icon={ClipboardList}>
        <div className="space-y-2.5">
          {rows.map(row => {
            const rr = riskLevel(row.L, row.C);
            return (
              <div key={row.id} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input value={row.activity} onChange={e => setRow(row.id, { activity: e.target.value })}
                    className="flex-grow bg-transparent text-xs font-bold text-surface-700 dark:text-surface-200 outline-none border-b border-transparent focus:border-red-400" />
                  <button onClick={() => delRow(row.id)} className="text-surface-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select value={row.L} onChange={e => setRow(row.id, { L: parseInt(e.target.value) })}
                    className="px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[10px] font-black text-surface-600 dark:text-surface-300 outline-none">
                    {LIKELIHOODS.map(lk => <option key={lk.n} value={lk.n}>L{lk.n}</option>)}
                  </select>
                  <select value={row.C} onChange={e => setRow(row.id, { C: parseInt(e.target.value) })}
                    className="px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[10px] font-black text-surface-600 dark:text-surface-300 outline-none">
                    {CONSEQUENCES.map(c => <option key={c.n} value={c.n}>C{c.n}</option>)}
                  </select>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black text-surface-50" style={{ background: rr.color }}>
                    {rr.level} · {row.L * row.C}
                  </span>
                  <span className="ml-auto text-[9px] text-surface-400">{rr.action.split('—')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={addRow}
          className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-surface-300 dark:border-surface-700 text-xs font-black text-surface-500 dark:text-surface-400 hover:border-red-400 hover:text-red-500 transition-all flex items-center justify-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Add activity
        </button>
        <p className="text-[10px] text-surface-400 mt-3">A live register: rank every activity, then use the matrix to drive the risk-reduction conversation.</p>
      </CalcCard>
    </div>
  );
}
// ─── HAZOP: guidewords, parameters & deviation library ─────────────────────
const GUIDE_WORDS = ['NO / NOT', 'MORE', 'LESS', 'AS WELL AS', 'PART OF', 'REVERSE', 'OTHER THAN'];
const HAZOP_PARAMS = ['Flow', 'Pressure', 'Temperature', 'Level', 'Composition', 'Reaction', 'Phase', 'Utility'];
const HAZOP_NODES = [
  'Feed line to reactor', 'Reactor vessel', 'Distillation column', 'Reboiler',
  'Separator / flash drum', 'Product transfer line', 'Cooling water supply',
];

// cause / consequence / safeguard recommendations keyed by parameter
const HAZOP_KNOWLEDGE: Record<string, { causes: string[]; consequences: string[]; safeguards: string[] }> = {
  Flow: {
    causes: ['Valve closed/blocked', 'Pump failure', 'Line plugged', 'Control valve stuck', 'Leak / rupture'],
    consequences: ['Reactor starvation → off-spec product', 'Cavitation damage', 'Over/under pressure in downstream', 'Loss of cooling → runaway risk'],
    safeguards: ['Flow transmitters + low-flow alarm', 'Pump redundancy & spare', 'Check valves', 'Interlock on low flow', 'Routine line inspection'],
  },
  Pressure: {
    causes: ['Blocked outlet', 'Thermal expansion', 'Overfill of vessel', 'Control failure', 'External fire'],
    consequences: ['Vessel rupture', 'PSV lifting / relief event', 'Pipe flange leaks', 'Burst disc activation'],
    safeguards: ['Pressure relief valves', 'High-pressure alarms & trips', 'Burst discs', 'Deflagration venting', 'Fire-rated isolation'],
  },
  Temperature: {
    causes: ['Heat-exchanger fouling', 'Cooling failure', 'Runaway reaction', 'Steam trap failure', 'Solar heating of storage'],
    consequences: ['Polymerisation / decomposition', 'Overpressure from vapour expansion', 'Metallurgy degradation', 'Auto-ignition'],
    safeguards: ['Temperature alarms & trips', 'Emergency cooling', 'Thermal relief', 'Material of construction review', 'Inhibitor dosing'],
  },
  Level: {
    causes: ['Level transmitter fails', 'Under/overfeeding', 'Blocked outlet', 'Instrument air failure', 'Mis-operation'],
    consequences: ['Liquid carryover to compressor', 'Gas blow-through to pumps', 'Vessel overfill → spill', 'Flooded reboiler'],
    safeguards: ['Independent level transmitters', 'High/low level trips', 'Dedicated drain/flare', 'Operator training & procedures'],
  },
  Composition: {
    causes: ['Feed contamination', 'Wrong material charged', 'Incomplete reaction', 'Recycle impurity build-up', 'Analyzer drift'],
    consequences: ['Toxic/flammable mixture', 'Off-spec product', 'Explosive vapour composition', 'Catalyst poisoning'],
    safeguards: ['On-line analyzers', 'Feed quality specs', 'Sampling schedule', 'Composition interlocks', 'Purge / blowdown'],
  },
  Reaction: {
    causes: ['Initiator overcharge', 'Cooling loss', 'Wrong charge order', 'Impurities catalyze', 'Ageing catalyst'],
    consequences: ['Runaway reaction → venting or rupture', 'Pressure surge', 'Decomposition gases', 'Fire/explosion'],
    safeguards: ['Reaction calorimetry studies', 'Emergency venting & quench', 'Inhibitor system', 'Kickback/rupture disk', 'Procedure verification'],
  },
  Phase: {
    causes: ['Temperature/pressure shift', 'Two-phase flow in single-phase line', 'Condensation in vapour line', 'Gas evolution in liquid line'],
    consequences: ['Water hammer', 'Slug flow damage', 'Overpressure', 'Pump cavitation'],
    safeguards: ['Line sizing for two-phase', 'Condensate pots / knock-out drums', 'Phase monitors', 'System hydraulics review'],
  },
  Utility: {
    causes: ['Cooling water failure', 'Steam failure', 'Instrument air loss', 'Power outage', 'Nitrogen supply loss'],
    consequences: ['Loss of containment', 'Process upset / shutdown', 'Loss of inerting → flammable atmosphere'],
    safeguards: ['Utility monitoring & alarms', 'Emergency shutdown systems', 'Backup nitrogen', 'UPS / diesel backup'],
  },
};

// TAB 2 · HAZOP WORKSHEET
interface HazopRow { id: number; node: string; param: string; guide: string; deviation: string; cause: string; consequence: string; safeguard: string; recommendation: string; }

function HazopTab() {
  const [node, setNode] = useState(HAZOP_NODES[0]);
  const [param, setParam] = useState('Flow');
  const [guide, setGuide] = useState('NO / NOT');
  const [rows, setRows] = useState<HazopRow[]>(() => {
    const k = HAZOP_KNOWLEDGE.Flow;
    return [{
      id: 1, node: HAZOP_NODES[0], param: 'Flow', guide: 'NO / NOT',
      deviation: 'No flow', cause: k.causes[0], consequence: k.consequences[0],
      safeguard: k.safeguards[0], recommendation: 'Add low-flow interlock on feed pump.',
    }];
  });
  const nextId = Math.max(0, ...rows.map(r => r.id)) + 1;
  const setRow = (id: number, patch: Partial<HazopRow>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const k = HAZOP_KNOWLEDGE[param] ?? HAZOP_KNOWLEDGE.Flow;
  const deviationText = guide === 'NO / NOT' ? `No ${param.toLowerCase()}`
    : guide === 'MORE' ? `More ${param.toLowerCase()}`
    : guide === 'LESS' ? `Less ${param.toLowerCase()}`
    : guide === 'REVERSE' ? `Reverse ${param.toLowerCase()}`
    : guide === 'AS WELL AS' ? `${param} plus something else`
    : guide === 'PART OF' ? `Only part of ${param.toLowerCase()}`
    : `${param} other than intended`;
  const addRow = () => setRows(prev => [...prev, {
    id: nextId, node, param, guide, deviation: deviationText,
    cause: k.causes[prev.length % k.causes.length],
    consequence: k.consequences[prev.length % k.consequences.length],
    safeguard: k.safeguards[prev.length % k.safeguards.length],
    recommendation: 'Verify this safeguard is functional and tested.',
  }]);
  const delRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="HAZOP study set-up" icon={ShieldCheck}>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Node under study</p>
            <select value={node} onChange={e => setNode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-xs font-bold text-surface-700 dark:text-surface-200 outline-none focus:border-red-500">
              {HAZOP_NODES.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Parameter</p>
              <select value={param} onChange={e => setParam(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-xs font-bold text-surface-700 dark:text-surface-200 outline-none focus:border-red-500">
                {HAZOP_PARAMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Guideword</p>
              <select value={guide} onChange={e => setGuide(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-xs font-bold text-surface-700 dark:text-surface-200 outline-none focus:border-red-500">
                {GUIDE_WORDS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Deviation</p>
            <p className="text-sm font-black text-red-700 dark:text-red-300">{deviationText}</p>
          </div>
          <button onClick={addRow}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-surface-50 text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Add deviation row to worksheet
          </button>
        </div>
        <InfoNote>HAZOP (HAZard and OPerability) is the structured brain-storm: guideword × parameter creates a deviation, then the team challenges it with cause → consequence → safeguard → recommendation. Usually a 2–4 hour session per node with a scribe.</InfoNote>
      </CalcCard>

      <CalcCard title="HAZOP worksheet" icon={ClipboardList}>
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {rows.length === 0 && <p className="text-xs text-surface-400 py-8 text-center">No rows yet — build a deviation on the left.</p>}
          {rows.map(r => (
            <div key={r.id} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-surface-50 bg-red-500 rounded-lg px-2 py-1">{r.node}</span>
                <span className="text-[10px] font-black text-red-600 bg-red-500/10 rounded-lg px-2 py-1">{r.guide} {r.param}</span>
                <button onClick={() => delRow(r.id)} className="ml-auto text-surface-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs font-black text-surface-700 dark:text-surface-200">{r.deviation}</p>
              {([['Cause', 'cause'], ['Consequence', 'consequence'], ['Safeguard', 'safeguard'], ['Recommendation', 'recommendation']] as const).map(([label, key]) => (
                <div key={key}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-surface-400">{label}</p>
                  <input value={r[key]} onChange={e => setRow(r.id, { [key]: e.target.value } as Partial<HazopRow>)}
                    className="w-full bg-transparent text-[11px] font-medium text-surface-600 dark:text-surface-300 outline-none border-b border-transparent focus:border-red-400" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </CalcCard>
    </div>
  );
}
// ─── LOPA: Layers of Protection Analysis ───────────────────────────────────
// Mitigated frequency = initiating event frequency × Π(PFD of each IPL)
function lopaMitigated(initFreq: number, pfds: number[]): number {
  return pfds.reduce((f, pfd) => f * Math.max(pfd, 0), Math.max(initFreq, 0));
}
function lopaRRF(mig: number, target: number): number | null {
  if (mig <= 0 || target <= 0) return null;
  return Math.max(mig / target, 1);
}

const IPL_PRESETS = [
  { name: 'BPCS / DCS control loop', pfd: 1e-1 },
  { name: 'SIF (SIL-1 safety function)', pfd: 1e-1 },
  { name: 'SIF (SIL-2)', pfd: 1e-2 },
  { name: 'SIF (SIL-3)', pfd: 1e-3 },
  { name: 'Operator action (well-trained)', pfd: 1e-1 },
  { name: 'Mechanical relief valve (PSV)', pfd: 1e-2 },
  { name: 'Rupture disc', pfd: 1e-2 },
  { name: 'Physical containment / dike', pfd: 1e-2 },
];

interface Ipl { id: number; name: string; pfd: number; }

function LopaTab() {
  const [initFreq, setInitFreq] = useState('0.1');
  const [target, setTarget] = useState('1e-4');
  const [conseq, setConseq] = useState('2');
  const [ipls, setIpls] = useState<Ipl[]>([
    { id: 1, name: 'BPCS / DCS control loop', pfd: 1e-1 },
    { id: 2, name: 'SIF (SIL-2 safety function)', pfd: 1e-2 },
  ]);
  const nextId = Math.max(0, ...ipls.map(i => i.id)) + 1;
  const addIpl = (name: string, pfd: number) => setIpls(prev => [...prev, { id: nextId, name, pfd }]);
  const delIpl = (id: number) => setIpls(prev => prev.filter(i => i.id !== id));
  const fInit = parseFloat(initFreq) || 0;
  const fTarget = parseFloat(target) || 0;
  const fMig = lopaMitigated(fInit, ipls.map(i => i.pfd));
  const rrf = lopaRRF(fMig, fTarget);
  const riskPerYear = fMig * (parseFloat(conseq) || 0);
  const ok = fTarget > 0 && fMig <= fTarget;
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="LOPA · layers of protection" icon={Siren}>
        <InputRow label="Initiating event frequency" unit="/yr" value={initFreq} onChange={setInitFreq} />
        <InputRow label="Consequence severity" unit="fatalities (est.)" value={conseq} onChange={setConseq} />
        <InputRow label="Target mitigated frequency" unit="/yr" value={target} onChange={setTarget} />
        <div className="grid grid-cols-3 gap-3 mt-2">
          <ResultBox label="Mitigated freq." value={fMig < 1e-4 ? fMig.toExponential(1) : fmt(fMig, 4)} unit="/yr" color="#ef4444" />
          <ResultBox label="Risk reduction" value={fmt(rrf, 0, '×')} unit="required" color="#f97316" />
          <ResultBox label="Risk / yr" value={riskPerYear < 1e-4 ? riskPerYear.toExponential(1) : fmt(riskPerYear, 3)} unit="fatalities·yr⁻¹" color="#eab308" />
        </div>
        <div className={`mt-4 p-4 rounded-2xl border ${ok
          ? 'border-accent-300 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40'
          : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40'}`}>
          <p className={`text-sm font-black ${ok ? 'text-accent-700 dark:text-accent-300' : 'text-red-700 dark:text-red-300'}`}>
            {ok ? '✓ Risk is within the target — layers are sufficient.' : '✗ Risk exceeds target — add a protection layer or strengthen an SIF.'}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
            {fTarget <= 0
              ? 'Enter a target frequency to judge the layers.'
              : ok
                ? `Mitigated ${fMig.toExponential(1)} /yr ≤ target ${fTarget.toExponential(1)} /yr`
                : `Need ≈ ${fmt(rrf, 0, '×')} more risk reduction (${(fMig / Math.max(fTarget, 1e-99)).toExponential(1)} /yr vs ${fTarget.toExponential(1)} /yr target)`}
          </p>
        </div>
        <InfoNote>LOPA quantifies the bow-tie: start with the initiating event frequency, then multiply by the PFD of each Independent Protection Layer. Only truly independent, auditable layers count — a shared transmitter feeding two trips is one layer, not two.</InfoNote>
      </CalcCard>

      <CalcCard title="Protection layers" icon={Shield}>
        <div className="space-y-2.5 mb-4">
          {ipls.map(ip => (
            <div key={ip.id} className="flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-800 p-2.5">
              <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs font-bold text-surface-700 dark:text-surface-200 flex-grow">{ip.name}</span>
              <span className="text-[10px] font-black text-red-600 bg-red-500/10 rounded-lg px-2 py-1">PFD {ip.pfd.toExponential(0)}</span>
              <button onClick={() => delIpl(ip.id)} className="text-surface-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {ipls.length === 0 && <p className="text-xs text-surface-400 py-4 text-center">No layers — this is the unprotected case.</p>}
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Add an independent layer</p>
        <div className="flex flex-wrap gap-2">
          {IPL_PRESETS.map(p => (
            <button key={p.name} onClick={() => addIpl(p.name, p.pfd)}
              className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-[10px] font-black text-surface-600 dark:text-surface-300 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 transition-colors">
              {p.name} · {p.pfd.toExponential(0)}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-surface-400 mt-4">Total risk reduction = Π(1/PFD). Each SIL-2 layer (PFD 0.01) cuts the frequency 100×; two of them give 10,000× — that's why layers are multiplied, not added.</p>
      </CalcCard>
    </div>
  );
}
// ─── JSA worksheet & bow-tie ────────────────────────────────────────────────
interface JsaRow { id: number; step: string; hazard: string; control: string; L: number; C: number; }

const JSA_PRESET: JsaRow[] = [
  { id: 1, step: 'Isolate & depressurise the line', hazard: 'Residual pressure / trapped fluid', control: 'Double-block-and-bleed, verify zero energy', L: 3, C: 4 },
  { id: 2, step: 'Break the flange connection', hazard: 'Toxic / flammable release', control: 'Gas test, respiratory protection, wind direction check', L: 2, C: 5 },
  { id: 3, step: 'Fit blinds & purge with nitrogen', hazard: 'Oxygen-deficient atmosphere', control: 'Confined-space permit, continuous O₂ monitoring', L: 3, C: 4 },
  { id: 4, step: 'Hand over for maintenance', hazard: 'Inadvertent start-up', control: 'Permit-to-work + LOTO tags on all energy sources', L: 2, C: 4 },
];

function JsaTab() {
  const [rows, setRows] = useState<JsaRow[]>(JSA_PRESET);
  const nextId = Math.max(0, ...rows.map(r => r.id)) + 1;
  const setRow = (id: number, patch: Partial<JsaRow>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const addRow = () => setRows(prev => [...prev, { id: nextId, step: 'Next job step', hazard: 'Describe the hazard', control: 'Describe the control', L: 2, C: 3 }]);
  const delRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));
  const hasExtreme = rows.some(r => riskLevel(r.L, r.C).level === 'Extreme');
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Job Safety Analysis (JSA)" icon={HardHat}>
        <p className="text-xs text-surface-500 dark:text-surface-400 mb-4 leading-relaxed">
          Break a job into steps, name the hazard of each, and pin a <b className="text-surface-700 dark:text-surface-200">specific control</b> to it. Generic advice like "be careful" is not a control.
        </p>
        <div className="space-y-3">
          {rows.map(r => {
            const rr = riskLevel(r.L, r.C);
            return (
              <div key={r.id} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-surface-50 bg-surface-700 dark:bg-surface-200 dark:text-surface-900 rounded-lg px-2 py-1">Step {r.id}</span>
                  <input value={r.step} onChange={e => setRow(r.id, { step: e.target.value })}
                    className="flex-grow bg-transparent text-xs font-bold text-surface-700 dark:text-surface-200 outline-none border-b border-transparent focus:border-red-400" />
                  <button onClick={() => delRow(r.id)} className="text-surface-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-surface-400">Hazard</p>
                    <input value={r.hazard} onChange={e => setRow(r.id, { hazard: e.target.value })}
                      className="w-full bg-transparent text-[11px] font-medium text-surface-600 dark:text-surface-300 outline-none border-b border-transparent focus:border-red-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-surface-400">Control</p>
                    <input value={r.control} onChange={e => setRow(r.id, { control: e.target.value })}
                      className="w-full bg-transparent text-[11px] font-medium text-surface-600 dark:text-surface-300 outline-none border-b border-transparent focus:border-red-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-surface-400">Risk</span>
                  <select value={r.L} onChange={e => setRow(r.id, { L: parseInt(e.target.value) })}
                    className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-[9px] font-black text-surface-600 dark:text-surface-300 outline-none">L{''}{r.L}</select>
                  <span className="text-[9px] font-black text-surface-400">×</span>
                  <select value={r.C} onChange={e => setRow(r.id, { C: parseInt(e.target.value) })}
                    className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-[9px] font-black text-surface-600 dark:text-surface-300 outline-none">C{''}{r.C}</select>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black text-surface-50" style={{ background: rr.color }}>{rr.level}</span>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={addRow}
          className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-surface-300 dark:border-surface-700 text-xs font-black text-surface-500 dark:text-surface-400 hover:border-red-400 hover:text-red-500 transition-all flex items-center justify-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Add step
        </button>
        <p className="text-[10px] text-surface-400 mt-3">{hasExtreme ? '⚠ One or more steps are Extreme — reconsider the job before proceeding.' : 'Every step is below Extreme — proceed with the documented controls.'}</p>
      </CalcCard>

      <BowtieCard />
    </div>
  );
}

// ─── Bow-tie ────────────────────────────────────────────────────────────────
const BOWTIE_PRESETS = [
  {
    name: 'Loss of containment', top: 'Loss of containment',
    threats: ['Overpressure', 'Corrosion / wall thinning', 'External impact', 'Valve left open'],
    barriers: ['Pressure relief + high-trip', 'Inspection & corrosion loops', 'Physical protection & routing', 'Permit-to-work verification'],
    consequences: ['Toxic cloud', 'Fire / jet flame', 'Pool fire', 'Environmental release'],
    mitigations: ['Gas detectors + alarms', 'Deluge / fire water', 'Isolation & blowdown', 'Bund / secondary containment'],
  },
  {
    name: 'Reaction runaway', top: 'Uncontrolled reaction',
    threats: ['Cooling failure', 'Initiator overcharge', 'Wrong charge order', 'Impurity ingress'],
    barriers: ['Temperature trips', 'Redundant cooling', 'Procedure checklists', 'Raw material specs'],
    consequences: ['Pressure surge / venting', 'Vessel rupture', 'Decomposition fire'],
    mitigations: ['Emergency quench', 'Rupture disc + vent', 'Fire-fighting systems', 'Emergency response plan'],
  },
  {
    name: 'Hot work fire', top: 'Ignition of flammable vapours',
    threats: ['Flammable vapour present', 'Hot surface nearby', 'Welding sparks', 'Untested confined space'],
    barriers: ['Gas testing before & during', 'Hot-work permit zone', 'Fire watch posted', 'Ventilation & cooling'],
    consequences: ['Flash fire', 'Explosion', 'Major plant fire'],
    mitigations: ['Flame detectors', 'Deluge activation', 'Emergency shutdown', 'Evacuation plan'],
  },
];

function BowtieCard() {
  const [idx, setIdx] = useState(0);
  const bt = BOWTIE_PRESETS[idx];
  return (
    <div className="space-y-6">
      <CalcCard title="Bow-tie analysis" icon={AlertOctagon}>
        <div className="flex flex-wrap gap-2 mb-5">
          {BOWTIE_PRESETS.map((b, i) => (
            <button key={b.name} onClick={() => setIdx(i)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${idx === i
                ? 'bg-red-600 text-surface-50 shadow-lg shadow-red-500/25'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-red-100 dark:hover:bg-red-900/40'}`}>
              {b.name}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1.5">Threats → preventive barriers</p>
            <div className="flex flex-wrap gap-2">
              {bt.threats.map(t => (
                <span key={t} className="px-2.5 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-[10px] font-bold text-surface-600 dark:text-surface-300">{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {bt.barriers.map(b => (
                <span key={b} className="px-2.5 py-1.5 rounded-lg bg-accent-100 dark:bg-accent-900/40 text-[10px] font-black text-accent-700 dark:text-accent-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {b}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/10 p-4 text-center">
            <AlertOctagon className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-sm font-black text-red-600 dark:text-red-300">{bt.top}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-accent-500 mb-1.5">Mitigative barriers → consequences</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {bt.mitigations.map(m => (
                <span key={m} className="px-2.5 py-1.5 rounded-lg bg-accent-100 dark:bg-accent-900/40 text-[10px] font-black text-accent-700 dark:text-accent-300 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {m}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {bt.consequences.map(c => (
                <span key={c} className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[10px] font-bold text-red-600 dark:text-red-300">{c}</span>
              ))}
            </div>
          </div>
        </div>
        <InfoNote>Left of the knot: what can cause it and what stops it. Right: what it can do and what limits the damage. Barriers must be specific, maintained and independently verified — a rusty valve is not a barrier.</InfoNote>
      </CalcCard>
    </div>
  );
}
// ─── Process safety fundamentals: PtW, LOTO, confined space, PPE, fire ─────
const SAFETY_CARDS = [
  {
    icon: ClipboardList, title: 'Permit to Work (PtW)', color: 'text-red-500',
    points: ['Authorises non-routine work after a risk assessment', 'Specifies isolation, gas testing, PPE and supervision', 'Issued by an authorised person, for a defined time window', 'Hand-back step verifies the plant is safe to restart'],
    note: 'The permit is a control, not a ritual — it must be read, understood and physically present at the job.',
  },
  {
    icon: Lock, title: 'Lockout / Tagout (LOTO)', color: 'text-accent-500',
    points: ['Isolate ALL energy sources: electrical, pneumatic, hydraulic, thermal, stored', 'Apply personal locks + tags to each isolation point', 'Try to start / verify zero energy before touching equipment', 'One person = one lock; only the lock owner removes it'],
    note: 'Inadvertent start-up kills. LOTO makes it physically impossible, not just unlikely.',
  },
  {
    icon: Eye, title: 'Confined-space entry', color: 'text-violet-500',
    points: ['Defined as: limited entry/exit + not designed for occupancy + possible hazardous atmosphere', 'Atmosphere testing: O₂ 19.5–23.5%, LFL < 10%, toxics below limits', 'Continuous monitoring + standby attendant + rescue plan', 'Entry permit, isolation and ventilation are mandatory'],
    note: 'Most confined-space deaths are would-be rescuers — never enter without the full system in place.',
  },
  {
    icon: HardHat, title: 'PPE & chemical handling', color: 'text-primary-500',
    points: ['Hierarchy first: eliminate → substitute → engineer → administrate → PPE (last line)', 'Read the SDS before handling: hazards, first aid, spill response', 'Match gloves/material to the chemical — one glove does not fit all', 'Eye wash & safety shower must be reachable within 10 seconds'],
    note: 'PPE is the final defence, not the plan. Chemicals also need storage segregation — acids away from bases, oxidisers away from flammables.',
  },
  {
    icon: Flame, title: 'Fire safety & emergency response', color: 'text-accent-500',
    points: ['Fire tetrahedron: fuel + oxidiser + heat + chain reaction — remove any one', 'Classes: A solids, B liquids, C gases, D metals, F cooking oils — use the right extinguisher', 'Fight only incipient fires; sound the alarm and evacuate beyond that', 'Assembly point, headcount, and the emergency contact tree must be drilled'],
    note: 'A B-class fire (flammable liquid) needs foam/CO₂/dry powder — water can spread it or cause a boil-over.',
  },
  {
    icon: Siren, title: 'Process safety fundamentals', color: 'text-rose-500',
    points: ['Inherently safer design: minimise, substitute, moderate, simplify', 'Layer of protection: process design → BPCS → alarms → SIS → relief → mitigation', 'Management of change (MOC): any change in chemistry, people, procedure or plant', 'Operational discipline: procedures, verification, and reporting near-misses'],
    note: 'Process safety prevents major accidents; personal safety prevents minor ones — both matter, and near-miss reporting is the early-warning radar.',
  },
];

function FundamentalsTab() {
  const [open, setOpen] = useState(0);
  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          {SAFETY_CARDS.map((c, i) => (
            <button key={c.title} onClick={() => setOpen(i)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${open === i
                ? 'border-red-400/60 bg-red-50 dark:bg-red-950/40 shadow-lg shadow-red-500/10'
                : 'border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/40 hover:border-red-300 dark:hover:border-red-800'}`}>
              <div className="flex items-center gap-3">
                <c.icon className={`w-5 h-5 ${c.color} flex-shrink-0`} />
                <p className="text-sm font-black text-surface-800 dark:text-surface-100">{c.title}</p>
                <CheckCircle2 className={`w-4 h-4 ml-auto ${open === i ? 'text-red-500' : 'text-surface-300 dark:text-surface-600'}`} />
              </div>
              {open === i && (
                <div className="mt-3 space-y-2">
                  {c.points.map(p => (
                    <p key={p} className="text-xs text-surface-600 dark:text-surface-300 flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /> {p}
                    </p>
                  ))}
                  <p className="text-[11px] italic text-surface-400 mt-2">{c.note}</p>
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="space-y-6">
          <CalcCard title="Safety triangle & layer model" icon={Ban}>
            <div className="flex items-center justify-center gap-4">
              {[{ n: '1', l: 'Fatality' }, { n: '30', l: 'Lost-time injuries' }, { n: '300', l: 'First-aid cases' }, { n: '3000', l: 'Near misses' }].map((t, i) => (
                <div key={t.l} className="text-center">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-lg font-black ${i === 0 ? 'bg-red-500 text-surface-50' : i === 1 ? 'bg-accent-400 text-surface-50' : i === 2 ? 'bg-accent-400 text-accent-950' : 'bg-accent-500 text-surface-50'}`}>
                    {t.n}
                  </div>
                  <p className="text-[9px] font-black text-surface-400 mt-1.5 max-w-16">{t.l}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-4 text-center leading-relaxed">
              Heinrich-style ratio: for every fatality there are ~3000 near misses. Acting on near-misses is how you keep the triangle from growing.
            </p>
          </CalcCard>
          <CalcCard title="Emergency response sequence" icon={Siren}>
            <div className="space-y-2">
              {['Detect & alarm — raise the alarm immediately', 'Evacuate upwind to the assembly point', 'Headcount & report missing persons', 'Isolate / stop feed — emergency shutdown if trained', 'Fight incipient fire only, await the responders'].map((s, i) => (
                <div key={s} className="flex items-center gap-3 rounded-xl border border-surface-200 dark:border-surface-800 p-2.5">
                  <span className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <p className="text-xs font-medium text-surface-600 dark:text-surface-300">{s}</p>
                </div>
              ))}
            </div>
          </CalcCard>
        </div>
      </div>
    </div>
  );
}
// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'risk', label: 'Risk Matrix', icon: ShieldAlert },
  { id: 'hazop', label: 'HAZOP', icon: ShieldCheck },
  { id: 'lopa', label: 'LOPA', icon: Siren },
  { id: 'jsa', label: 'JSA & Bow-tie', icon: HardHat },
  { id: 'fundamentals', label: 'Fundamentals', icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ProcessSafetyModule() {
  const [tab, setTab] = useState<TabId>('risk');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-surface-50 flex items-center justify-center shadow-lg shadow-red-500/25">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-surface-900 dark:text-surface-50">HSE & Process Safety</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Risk assessment, HAZOP, LOPA, JSA, bow-tie and the fundamentals that keep plants safe.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${tab === t.id
                ? 'bg-red-600 text-surface-50 shadow-lg shadow-red-500/30'
                : 'bg-surface-50 dark:bg-surface-900/60 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-800 hover:border-red-400/50 hover:text-red-600 dark:hover:text-red-300'}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'risk' && <RiskMatrixTab />}
      {tab === 'hazop' && <HazopTab />}
      {tab === 'lopa' && <LopaTab />}
      {tab === 'jsa' && <JsaTab />}
      {tab === 'fundamentals' && <FundamentalsTab />}
    </div>
  );
}
