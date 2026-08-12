import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  GraduationCap, BookOpen, Lightbulb, Target, ListChecks, Ruler, ClipboardList,
  Copy, Check, History, Sparkles, MessageSquare, ChevronDown, Brain, Send,
  Trash2, Layers, HelpCircle, Bot, Atom,
  FlaskConical, Thermometer, Wind, Waves, Repeat, Settings2, RefreshCw
} from 'lucide-react';
import { api } from '../api';
import SmartConnectPanel from './SmartConnect';

// ─── Subjects & difficulty ───────────────────────────────────────────────────
const SUBJECTS = [
  { id: 'general', label: 'General', icon: FlaskConical },
  { id: 'thermo', label: 'Thermodynamics', icon: Thermometer },
  { id: 'fluids', label: 'Fluid Mechanics', icon: Wind },
  { id: 'heat', label: 'Heat Transfer', icon: Waves },
  { id: 'mass', label: 'Mass Transfer', icon: Layers },
  { id: 'reaction', label: 'Reaction Eng.', icon: Repeat },
  { id: 'process', label: 'Process Design', icon: Settings2 },
] as const;

const DIFFICULTIES = ['Basic', 'Intermediate', 'Advanced'] as const;

// ─── GRUCA methodology (Given → Required → Assumptions → Equation → Calculation → Units → Answer) ───
const GRUCA_STEPS = [
  { key: 'given', label: 'Given', icon: ListChecks, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900', desc: 'Every known value with units' },
  { key: 'required', label: 'Required', icon: Target, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900', desc: 'What exactly to find' },
  { key: 'assumptions', label: 'Assumptions', icon: Lightbulb, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900', desc: 'Simplifying assumptions made' },
  { key: 'equations', label: 'Equations', icon: BookOpen, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900', desc: 'The governing equations' },
  { key: 'calculations', label: 'Calculations', icon: Brain, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900', desc: 'Step-by-step arithmetic' },
  { key: 'units', label: 'Units', icon: Ruler, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', desc: 'Dimensional consistency check' },
  { key: 'answer', label: 'Answer', icon: ClipboardList, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900', desc: 'Final boxed result with units' },
] as const;

// ─── localStorage helpers (same pattern as CompoundBuilder) ──────────────────
import { getSingleSystemApiKey } from '../utils/apiKeyManager';
import { isModelEnabledForUser } from '../utils/modelGovernance';

function getActiveAIModels(): { provider: string; modelId: string; label: string }[] {
  const active: { provider: string; modelId: string; label: string }[] = [];
  try {
    const saved = JSON.parse(localStorage.getItem('active_models') || '{}');
    const catalog: Record<string, { id: string; label: string }[]> = {
      gemini: [{ id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }, { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' }],
      groq: [
        { id: 'llama-3.3-70b-versatile', label: 'Groq Llama 3.3 70B' },
        { id: 'llama-3.1-8b-instant', label: 'Groq Llama 3.1 8B' },
        { id: 'qwen/qwen3.6-27b', label: 'Groq Qwen 3.6 27B' },
        { id: 'openai/gpt-oss-120b', label: 'Groq GPT OSS 120B' },
        { id: 'groq/compound', label: 'Groq Compound' }
      ],
      openrouter: [
        { id: 'nvidia/nemotron-3-nano-30b-a3b:free', label: 'OR Nemotron Nano 30B (Free)' },
        { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'OR Nemotron Super 120B (Free)' },
        { id: 'openai/gpt-oss-20b:free', label: 'OR GPT OSS 20B (Free)' },
        { id: 'google/gemma-4-26b-a4b-it:free', label: 'OR Gemma 4 26B (Free)' },
        { id: 'cohere/north-mini-code:free', label: 'OR Cohere North Code (Free)' }
      ],
      nvidia: [
        { id: 'meta/llama-3.1-8b-instruct', label: 'Nvidia Llama 3.1 8B' },
        { id: 'meta/llama-3.1-70b-instruct', label: 'Nvidia Llama 3.1 70B' }
      ],
      nova: [
        { id: 'nova-lite-v1', label: 'Amazon Nova Lite' },
        { id: 'nova-micro-v1', label: 'Amazon Nova Micro' },
        { id: 'nova-pro-v1', label: 'Amazon Nova Pro' }
      ],
    };
    for (const [provider, models] of Object.entries(catalog)) {
      for (const m of models) {
        if (isModelEnabledForUser(provider, m.id) && saved[`${provider}:${m.id}`]) {
          active.push({ provider, modelId: m.id, label: m.label });
        }
      }
    }
    if (active.length === 0) {
      for (const [provider, models] of Object.entries(catalog)) {
        for (const m of models) {
          if (isModelEnabledForUser(provider, m.id)) {
            active.push({ provider, modelId: m.id, label: m.label });
            break;
          }
        }
      }
    }
  } catch { /* ignore */ }
  return active;
}

function getApiKey(provider: string): string {
  return getSingleSystemApiKey(provider as any);
}

function cleanAIResponse(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .replace(/,\s*([\]}])/g, '$1')
    .trim();
}
// ─── GRUCA answer shape + parser ────────────────────────────────────────────
interface GrucaAnswer {
  given: string[];
  required: string[];
  assumptions: string[];
  equations: string[];
  calculations: string[];
  units: string[];
  answer: string;
  summary?: string;
}

function buildTutorPrompt(problem: string, subject: string, difficulty: string): string {
  return `You are a professional chemical engineering tutor. Solve the problem below using the GRUCA method and return ONLY valid JSON. No markdown, no code fences, no text outside the JSON object.

Problem: ${problem}
Subject: ${subject}
Difficulty: ${difficulty}

GRUCA steps to follow:
1. given — every known value with its units
2. required — what must be found
3. assumptions — every simplifying assumption you make
4. equations — the governing equations in plain math notation (e.g. Q = m·Cp·ΔT, Re = ρ·v·D/μ)
5. calculations — step-by-step arithmetic with numbers substituted; at least 2 clear steps; never skip algebra
6. units — dimensional check of the final units
7. answer — the final result with units and a one-line engineering meaning

Rules:
- Always use SI units unless the problem says otherwise.
- Show every numeric substitution.
- Use plain text math notation only. No markdown tables. Bullet lists are allowed.
- Return ONLY this JSON shape:
{"given":["..."],"required":["..."],"assumptions":["..."],"equations":["..."],"calculations":["..."],"units":["..."],"answer":"...","summary":"..."}
Each of given/required/assumptions/equations/calculations/units is an ARRAY of strings. answer and summary are single strings.`;
}

const GRUCA_KEYS = ['given', 'required', 'assumptions', 'equations', 'calculations', 'units'] as const;

function toStrArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x ?? '')).filter(s => s.trim());
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
}

function parseGruca(text: string): GrucaAnswer | null {
  const cleaned = cleanAIResponse(text);
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!objMatch) return null;
  let raw: Record<string, unknown> | null = null;
  try {
    raw = JSON.parse(objMatch[0]);
  } catch {
    try {
      // Repair truncated JSON: drop the last incomplete property
      const repaired = objMatch[0].replace(/,\s*"[^}]*$/s, '');
      raw = JSON.parse(repaired);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== 'object') return null;
  const g: GrucaAnswer = {
    given: toStrArray(raw.given), required: toStrArray(raw.required),
    assumptions: toStrArray(raw.assumptions), equations: toStrArray(raw.equations),
    calculations: toStrArray(raw.calculations), units: toStrArray(raw.units),
    answer: typeof raw.answer === 'string' ? raw.answer : toStrArray(raw.answer).join(' '),
    summary: typeof raw.summary === 'string' ? raw.summary : undefined,
  };
  if (!g.answer && GRUCA_KEYS.every(k => g[k].length === 0)) return null;
  return g;
}
// ─── Tiny dependency-free markdown renderer ──────────────────────────────────
function inlineFormat(s: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = regex.exec(s)) !== null) {
    if (m.index > last) nodes.push(s.slice(last, m.index));
    const tok = m[0];
    const key = keyPrefix + i;
    if (tok.startsWith('**')) nodes.push(<strong key={key} className="font-bold">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) nodes.push(<code key={key} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[0.85em] text-indigo-600 dark:text-indigo-400">{tok.slice(1, -1)}</code>);
    else nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
    i++;
  }
  if (last < s.length) nodes.push(s.slice(last));
  return nodes;
}

type MDBlock =
  | { kind: 'p' | 'h' | 'pre'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] };

function mdToBlocks(text: string): MDBlock[] {
  const lines = text.split('\n');
  const blocks: MDBlock[] = [];
  let i = 0;
  const pushList = (ordered: boolean, item: string) => {
    const kind = ordered ? 'ol' : 'ul';
    const last = blocks[blocks.length - 1];
    if (last && last.kind === kind) { last.items.push(item); return; }
    blocks.push({ kind, items: [item] });
  };
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) { i++; continue; }
    if (trimmed.startsWith('```')) {
      i++;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) { buf.push(lines[i]); i++; }
      i++;
      blocks.push({ kind: 'pre', text: buf.join('\n') });
      continue;
    }
    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) { blocks.push({ kind: 'h', text: h[2] }); i++; continue; }
    const ul = trimmed.match(/^[-*]\s+(.*)$/);
    const ol = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (ul || ol) { pushList(!!ol, (ul ? ul[1] : ol![1])); i++; continue; }
    blocks.push({ kind: 'p', text: trimmed });
    i++;
  }
  return blocks;
}

function MiniMarkdown({ text }: { text: string }) {
  const blocks = mdToBlocks(text);
  if (blocks.length === 0) return <p className="text-sm text-slate-400 italic">—</p>;
  return (
    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
      {blocks.map((b, idx) => {
        switch (b.kind) {
          case 'pre':
            return <pre key={idx} className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap">{b.text}</pre>;
          case 'h':
            return <h4 key={idx} className="font-bold text-slate-900 dark:text-white">{inlineFormat(b.text, 'h' + idx)}</h4>;
          case 'ul':
          case 'ol': {
            const ListTag = b.kind === 'ul' ? 'ul' : 'ol';
            return (
              <ListTag key={idx} className={b.kind === 'ul' ? 'list-disc pl-5 space-y-1.5' : 'list-decimal pl-5 space-y-1.5'}>
                {b.items.map((it, j) => <li key={j}>{inlineFormat(it, b.kind + idx + '-' + j)}</li>)}
              </ListTag>
            );
          }
          default:
            return <p key={idx}>{inlineFormat(b.text, 'p' + idx)}</p>;
        }
      })}
    </div>
  );
}

// ─── GRUCA section card ──────────────────────────────────────────────────────
type GrucaStep = (typeof GRUCA_STEPS)[number];

function GrucaSection({ step, items }: { step: GrucaStep; items: string[] }) {
  if (items.length === 0) return null;
  const StepIcon = step.icon;
  return (
    <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className={`w-8 h-8 rounded-xl ${step.bg} flex items-center justify-center ${step.color}`}>
          <StepIcon className="w-4 h-4" />
        </span>
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{step.label}</h4>
          <p className="text-[10px] font-medium text-slate-400">{step.desc}</p>
        </div>
        <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      <MiniMarkdown text={items.join('\n')} />
    </div>
  );
}

function AnswerBox({ answer, summary }: { answer: string; summary?: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700/50 p-5 shadow-lg shadow-green-500/5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-md shadow-green-500/30">
          <ClipboardList className="w-4 h-4" />
        </span>
        <h4 className="font-black uppercase tracking-widest text-[11px] text-green-600 dark:text-green-400">Final Answer</h4>
      </div>
      <div className="text-[15px] font-semibold text-emerald-900 dark:text-emerald-100 leading-relaxed">
        <MiniMarkdown text={answer} />
      </div>
      {summary && (
        <p className="mt-3 pt-3 border-t border-green-200 dark:border-green-800/40 text-xs text-green-700 dark:text-green-300/80 italic">
          💡 {summary}
        </p>
      )}
    </div>
  );
}
// ─── Example problem library ─────────────────────────────────────────────────
interface ExampleProblem { title: string; subject: string; difficulty: string; problem: string; }

const EXAMPLES: ExampleProblem[] = [
  {
    title: 'Pump Power', subject: 'Fluid Mechanics', difficulty: 'Intermediate',
    problem: 'Water at 20°C (density 998 kg/m³, viscosity 1.002e-3 Pa·s) flows at 0.05 m³/s through a 200 m long, 10 cm diameter commercial steel pipe (roughness ε = 0.045 mm). The outlet is 15 m above the inlet and both are open to atmosphere. Calculate the pump power required in kW, assuming a pump efficiency of 70%.',
  },
  {
    title: 'LMTD Heat Exchanger', subject: 'Heat Transfer', difficulty: 'Intermediate',
    problem: 'A counterflow shell-and-tube heat exchanger heats 2 kg/s of water (Cp = 4.18 kJ/kg·K) from 20°C to 60°C using 3 kg/s of hot oil (Cp = 2.1 kJ/kg·K) entering at 150°C. The overall heat transfer coefficient is 300 W/m²·K. Calculate the required heat transfer area in m².',
  },
  {
    title: 'CSTR Design', subject: 'Reaction Eng.', difficulty: 'Advanced',
    problem: 'A liquid-phase first-order reaction A → B with rate constant k = 0.05 min⁻¹ is carried out in a CSTR. The feed is 10 L/min of 2 mol/L A. Determine the reactor volume in liters needed for 90% conversion of A.',
  },
  {
    title: 'Ammonia Diffusion', subject: 'Mass Transfer', difficulty: 'Basic',
    problem: 'Ammonia diffuses through a stagnant 1 cm layer of air at 25°C and 1 atm total pressure. The partial pressure of ammonia is 0.1 atm at one boundary and negligible at the other. The diffusivity of NH₃ in air is 2.3e-5 m²/s. Calculate the molar flux of ammonia in kmol/m²·s.',
  },
  {
    title: 'Ideal Gas Volume', subject: 'Thermodynamics', difficulty: 'Basic',
    problem: 'A rigid cylinder contains 5 kg of nitrogen (molar mass 28 g/mol) at 300 K and 2 MPa. Treating nitrogen as an ideal gas, calculate the volume occupied in liters. R = 8.314 J/mol·K.',
  },
  {
    title: 'Distillation Balance', subject: 'Process Design', difficulty: 'Basic',
    problem: 'A distillation column separates 1000 kg/h of a feed containing 40 wt% benzene and 60 wt% toluene. The distillate is 95 wt% benzene and the bottoms are 5 wt% benzene. Calculate the distillate and bottoms flow rates in kg/h.',
  },
];
// ─── Main Tutor component ────────────────────────────────────────────────────
interface ModelResult { label: string; statusKey: string; raw: string; gruca: GrucaAnswer | null; }
interface HistoryEntry { id: number; problem: string; subject: string; difficulty: string; timestamp: number; model: string; summary: string; }

const DEFAULT_PROBLEM = EXAMPLES[0].problem;

const FOLLOW_UPS = [
  { label: 'Re-solve + explain assumptions', prompt: 'FOLLOW-UP: Explain each assumption in more detail and state what would change if it was relaxed.' },
  { label: 'Re-solve + units check', prompt: 'FOLLOW-UP: Show the dimensional analysis explicitly, canceling each unit step by step.' },
  { label: 'Re-solve, harder version', prompt: 'FOLLOW-UP: Make the problem harder — add a real-world twist, e.g. non-ideal behavior or a second unit in series.' },
];

export default function TutorPage() {
  const [problem, setProblem] = useState(DEFAULT_PROBLEM);
  const [subject, setSubject] = useState<string>(EXAMPLES[0].subject);
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [isAsking, setIsAsking] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('tutor_history') || '[]'); } catch { return []; }
  });

  const addLog = (msg: string) => setStatusLog(prev => [...prev, msg]);

  const saveHistory = (entry: HistoryEntry) => {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 12);
      localStorage.setItem('tutor_history', JSON.stringify(updated));
      return updated;
    });
  };

  const loadExample = (ex: ExampleProblem) => {
    setProblem(ex.problem);
    setSubject(ex.subject);
    setDifficulty(ex.difficulty);
    setResults([]);
    setActiveTab(0);
    setStatusLog([]);
    setShowExamples(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadFromHistory = (h: HistoryEntry) => {
    setProblem(h.problem);
    setSubject(h.subject);
    setDifficulty(h.difficulty);
    setResults([]);
    setStatusLog([`📂 Loaded from history: ${h.summary || h.problem.slice(0, 60)}`]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tutor_history');
  };

  const ask = async (override?: string) => {
    const text = (override ?? problem).trim();
    if (!text || isAsking) return;
    const models = getActiveAIModels();
    setIsAsking(true);
    setResults([]);
    setStatusLog([]);
    setProviderStatus({});
    setCopied(false);
    addLog(`🚀 Sending problem to ${models.length} AI model(s): ${subject} · ${difficulty}`);
    if (models.length === 0) {
      addLog('⚠️ No AI models selected. Open Pipeline Settings (⚙️) and enable at least one model + paste a key.');
      setIsAsking(false);
      return;
    }
    const prompt = buildTutorPrompt(text, subject, difficulty);
    const newResults: ModelResult[] = [];
    const newStatus: Record<string, string> = {};
    const addResult = (r: ModelResult) => { newResults.push(r); setResults([...newResults]); };

    await Promise.allSettled(models.map(async ({ provider, modelId, label }) => {
      const key = getApiKey(provider);
      const statusKey = `${provider}:${modelId}`;
      if (!key) {
        newStatus[statusKey] = 'No API key';
        addLog(`⚠️ ${label}: no API key configured — skipping. Add one in Pipeline Settings.`);
        return;
      }
      addLog(`✨ ${label} is solving...`);
      try {
        const aiRes = await api.aiProxy({ provider, api_key: key, model: modelId, prompt });
        if (aiRes.error) {
          newStatus[statusKey] = aiRes.error;
          addLog(`❌ ${label}: ${aiRes.error}`);
          return;
        }
        const raw = aiRes.text || '';
        const gruca = parseGruca(raw);
        addResult({ label, statusKey, raw, gruca });
        if (gruca) {
          newStatus[statusKey] = 'working';
          addLog(`✅ ${label} → structured GRUCA answer.`);
        } else {
          newStatus[statusKey] = 'Plain text';
          addLog(`⚠️ ${label} → unstructured text (shown as-is).`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        newStatus[statusKey] = msg.slice(0, 80);
        addLog(`❌ ${label}: ${msg}`);
      }
    }));

    setProviderStatus(newStatus);
    const firstGood = newResults.findIndex(r => r.gruca !== null);
    setActiveTab(firstGood >= 0 ? firstGood : 0);
    addLog(`📊 ${newResults.length} response(s) received.`);
    if (newResults.length > 0) {
      const good = newResults[firstGood >= 0 ? firstGood : 0];
      saveHistory({
        id: Date.now(), problem: text, subject, difficulty, timestamp: Date.now(),
        model: good.label, summary: good.gruca ? good.gruca.summary || good.gruca.answer.slice(0, 120) : good.raw.slice(0, 120),
      });
    }
    setIsAsking(false);
  };
  const activeResult = results[activeTab] || null;
  const copyAnswer = async () => {
    if (!activeResult) return;
    const txt = activeResult.gruca
      ? GRUCA_STEPS.map(s => `## ${s.label}\n${activeResult.gruca![s.key as keyof GrucaAnswer]}`).join('\n\n')
      : activeResult.raw;
    try { await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">AI Chemical Engineering Tutor</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
          Paste any chemical engineering problem. Multiple free AI models solve it together using the professional
          <span className="font-bold text-indigo-600 dark:text-indigo-400"> GRUCA </span>
          method — <b>G</b>iven · <b>R</b>equired · <b>A</b>ssumptions · <b>E</b>quations · <b>C</b>alculations · <b>U</b>nits · <b>A</b>nswer.
        </p>
      </div>

      {/* GRUCA methodology strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-10">
        {GRUCA_STEPS.map((s, i) => {
          const StepIcon = s.icon;
          return (
            <div key={s.key} className="glass rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors group">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-[9px] font-black text-slate-400">{i + 1}</span>
                <StepIcon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-[11px] font-black uppercase tracking-wide ${s.color}`}>{s.label}</p>
              <p className="hidden md:block text-[9px] text-slate-400 mt-1 leading-tight">{s.desc}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-16">
        {/* ─── Left: problem input ─── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 dark:text-white">Your Problem</h2>
            </div>
            <textarea
              value={problem}
              onChange={e => setProblem(e.target.value)}
              placeholder="Describe a chemical engineering problem with all given values and units..."
              rows={6}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-y scrollbar-hide"
            />

            {/* Subject chips */}
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4 mb-2">Subject</p>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => {
                const SubIcon = s.icon;
                const active = subject === s.label;
                return (
                  <button key={s.id} onClick={() => setSubject(s.label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600'}`}>
                    <SubIcon className="w-3.5 h-3.5" /> {s.label}
                  </button>
                );
              })}
            </div>

            {/* Difficulty */}
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4 mb-2">Difficulty</p>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${difficulty === d
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                  {d}
                </button>
              ))}
            </div>

            <button onClick={() => ask()}
              disabled={!problem.trim() || isAsking}
              className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
              {isAsking
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> SOLVING...</>
                : <><Send className="w-4 h-4" /> ASK THE TUTOR</>}
            </button>

            {/* Follow-up quick chips */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick follow-ups</p>
              {FOLLOW_UPS.map(f => (
                <button key={f.label} disabled={isAsking}
                  onClick={() => setProblem(prev => `${prev.trim()}\n\n${f.prompt}`)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50">
                  <MessageSquare className="w-3 h-3 inline mr-1.5" />{f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Connect: routes the question to the right tools */}
          <SmartConnectPanel text={problem} />

          {/* Examples library */}
          <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setShowExamples(v => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
              <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <BookOpen className="w-4 h-4 text-amber-500" /> Example Problems
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showExamples ? 'rotate-180' : ''}`} />
            </button>
            {showExamples && (
              <div className="px-3 pb-3 space-y-1.5">
                {EXAMPLES.map(ex => (
                  <button key={ex.title} onClick={() => loadExample(ex)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{ex.title}</span>
                      <span className="text-[9px] font-bold uppercase text-slate-400">{ex.difficulty}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400">{ex.subject} · {ex.problem.slice(0, 70)}…</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <History className="w-4 h-4 text-indigo-500" /> Recent Sessions
                </span>
                <button onClick={clearHistory} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="px-3 pb-3 space-y-1.5 max-h-52 overflow-y-auto scrollbar-hide">
                {history.map(h => (
                  <button key={h.id} onClick={() => loadFromHistory(h)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{h.summary}</p>
                    <p className="text-[9px] font-semibold text-slate-400">{h.subject} · {h.difficulty} · {h.model} · {new Date(h.timestamp).toLocaleTimeString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* ─── Right: results ─── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Status log */}
          {statusLog.length > 0 && (
            <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isAsking ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Pipeline Log</span>
              </div>
              <div className="p-4 font-mono text-[10px] text-slate-500 max-h-36 overflow-y-auto scrollbar-hide space-y-1">
                {statusLog.map((log, i) => <div key={i} className="leading-relaxed">{log}</div>)}
                {isAsking && <div className="text-indigo-500 animate-pulse">Processing...</div>}
              </div>
            </div>
          )}

          {/* Empty state */}
          {results.length === 0 && !isAsking && statusLog.length === 0 && (
            <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Ready when you are</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Type or paste a problem (or load an example), pick a subject and difficulty, then press
                <span className="font-bold text-indigo-600 dark:text-indigo-400"> Ask the Tutor</span>.
                Every enabled AI model answers in parallel using the GRUCA framework.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {Object.keys(providerStatus).length === 0 && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    ⚙️ Manage models & keys in Pipeline Settings
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Model tabs */}
          {results.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {results.map((r, i) => {
                const st = providerStatus[r.statusKey];
                const isGood = r.gruca !== null;
                return (
                  <button key={r.statusKey} onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === i
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${isGood ? 'bg-emerald-500' : st && st !== 'working' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                    {r.label}
                  </button>
                );
              })}
              <button onClick={copyAnswer}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-80 transition-opacity">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
          {/* GRUCA answer */}
          {activeResult && activeResult.gruca && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeResult.gruca.summary && (
                <div className="flex items-start gap-3 glass rounded-2xl border border-indigo-200 dark:border-indigo-800/40 p-4">
                  <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">{activeResult.gruca.summary}</p>
                </div>
              )}
              {GRUCA_STEPS.map(s => s.key === 'answer' ? null : (
                <GrucaSection key={s.key} step={s} items={activeResult.gruca![s.key as keyof GrucaAnswer] as unknown as string[]} />
              ))}
              <AnswerBox answer={activeResult.gruca.answer} summary={activeResult.gruca.summary} />
            </div>
          )}

          {/* Plain-text fallback */}
          {activeResult && !activeResult.gruca && (
            <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in duration-500">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{activeResult.label} — unstructured response</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-[560px] overflow-y-auto scrollbar-hide">
                {activeResult.raw || '(empty response)'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How it works footer */}
      <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Atom className="w-5 h-5 text-indigo-600" /> How the Tutor works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex gap-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black text-xs flex-shrink-0">1</span>
            <p className="text-xs text-slate-500 leading-relaxed">You describe a problem with all given values and units.</p>
          </div>
          <div className="flex gap-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black text-xs flex-shrink-0">2</span>
            <p className="text-xs text-slate-500 leading-relaxed">Every AI model you enabled in Pipeline Settings solves it in parallel through the GRUCA framework.</p>
          </div>
          <div className="flex gap-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black text-xs flex-shrink-0">3</span>
            <p className="text-xs text-slate-500 leading-relaxed">Answers are parsed into Given → Required → Assumptions → Equations → Calculations → Units → Answer cards.</p>
          </div>
          <div className="flex gap-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black text-xs flex-shrink-0">4</span>
            <p className="text-xs text-slate-500 leading-relaxed">Compare models side by side, copy the full solution, or fire a follow-up for deeper explanations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
