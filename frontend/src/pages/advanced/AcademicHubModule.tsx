import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  BookOpen, CalendarDays, ClipboardList, ListChecks, Sigma, Gauge, CheckCircle2,
  X, Plus, Trash2, RefreshCw, Target, Lightbulb, Award, AlertTriangle, Info,
  Brain, Repeat, BookMarked, CalendarClock, FlaskConical, Atom, Waves, Flame,
  Droplets, Beaker, Zap, Compass, GraduationCap, NotebookPen
} from 'lucide-react';
import { CalcCard } from './SharedComponents';

// ─── Helpers ────────────────────────────────────────────────────────────────
function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr + 'T23:59:59');
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
}

// ─── Study Planner: weekly blocks with progress ─────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type Day = (typeof DAYS)[number];

interface StudyBlock { id: number; day: Day; time: string; subject: string; topic: string; done: boolean; }

const DEFAULT_BLOCKS: StudyBlock[] = [
  { id: 1, day: 'Monday', time: '09:00–10:30', subject: 'Thermodynamics', topic: 'Entropy & 2nd law', done: false },
  { id: 2, day: 'Monday', time: '14:00–15:30', subject: 'Fluid Mechanics', topic: 'Bernoulli problems', done: false },
  { id: 3, day: 'Tuesday', time: '09:00–10:30', subject: 'Heat Transfer', topic: 'Conduction fins', done: false },
  { id: 4, day: 'Tuesday', time: '16:00–17:00', subject: 'Mass Transfer', topic: 'Diffusion coefficients', done: false },
  { id: 5, day: 'Wednesday', time: '09:00–10:30', subject: 'Reaction Eng.', topic: 'Batch reactor design', done: false },
  { id: 6, day: 'Wednesday', time: '14:00–15:30', subject: 'Thermodynamics', topic: 'Phase equilibria', done: false },
  { id: 7, day: 'Thursday', time: '10:00–11:30', subject: 'Fluid Mechanics', topic: 'Pump selection', done: false },
  { id: 8, day: 'Friday', time: '09:00–10:00', subject: 'Heat Transfer', topic: 'Exchanger LMTD', done: false },
  { id: 9, day: 'Saturday', time: '11:00–13:00', subject: 'Mass Transfer', topic: 'McCabe-Thiele', done: false },
  { id: 10, day: 'Sunday', time: 'Free / catch-up', subject: 'Flexible', topic: 'Review weak topics', done: false },
];

const SUBJECT_COLORS: Record<string, string> = {
  'Thermodynamics': 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300',
  'Fluid Mechanics': 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300',
  'Heat Transfer': 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300',
  'Mass Transfer': 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300',
  'Reaction Eng.': 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300',
  'Flexible': 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

function subjectColor(s: string): string {
  return SUBJECT_COLORS[s] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
}

function StudyPlannerTab() {
  const [blocks, setBlocks] = useState<StudyBlock[]>(DEFAULT_BLOCKS);
  const [day, setDay] = useState<Day>('Monday');
  const [time, setTime] = useState('09:00–10:30');
  const [subject, setSubject] = useState('Thermodynamics');
  const [topic, setTopic] = useState('');
  const toggle = (id: number) => setBlocks(prev => prev.map(b => (b.id === id ? { ...b, done: !b.done } : b)));
  const del = (id: number) => setBlocks(prev => prev.filter(b => b.id !== id));
  const add = () => {
    if (!topic.trim()) return;
    setBlocks(prev => [...prev, { id: Math.max(0, ...prev.map(b => b.id)) + 1, day, time, subject, topic: topic.trim(), done: false }]);
    setTopic('');
  };
  const doneCount = blocks.filter(b => b.done).length;
  const pct = Math.round((doneCount / blocks.length) * 100);
  const hours = blocks.length;
  const inputCls = 'px-3 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-indigo-500" /> Study Planner
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Plan the week in blocks, tick them off, and watch your consistency grow.</p>
      </div>
      <CalcCard title={`Weekly plan · ${doneCount}/${blocks.length} blocks done (${pct}%)`} icon={CalendarDays}>
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-6">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          <select className={inputCls} value={day} onChange={e => setDay(e.target.value as Day)}>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className={inputCls} value={time} onChange={e => setTime(e.target.value)}>
            {['09:00–10:30', '10:00–11:30', '11:00–13:00', '14:00–15:30', '16:00–17:00'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select className={inputCls} value={subject} onChange={e => setSubject(e.target.value)}>
            {Object.keys(SUBJECT_COLORS).filter(s => s !== 'Flexible').map(s => <option key={s}>{s}</option>)}
          </select>
          <input className={`${inputCls} flex-1 min-w-[180px]`} placeholder="Topic to study…" value={topic} onChange={e => setTopic(e.target.value)} />
          <button onClick={add} className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add block
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {DAYS.map(d => {
            const dayBlocks = blocks.filter(b => b.day === d);
            if (dayBlocks.length === 0) return null;
            return (
              <div key={d} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{d}</p>
                <div className="space-y-2">
                  {dayBlocks.map(b => (
                    <div key={b.id} className={`flex items-center gap-2 rounded-lg p-2 transition-all ${b.done ? 'bg-emerald-50 dark:bg-emerald-900/10 opacity-60' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
                      <button onClick={() => toggle(b.id)} className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${b.done ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-400'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold truncate ${b.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{b.topic}</p>
                        <p className="text-[9px] text-slate-400">{b.time}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${subjectColor(b.subject)}`}>{b.subject}</span>
                      <button onClick={() => del(b.id)} className="text-slate-300 hover:text-red-500 transition-all"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setBlocks(prev => prev.map(b => ({ ...b, done: true })))} className="px-3 py-2 rounded-xl text-[10px] font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-all">Mark all done</button>
          <button onClick={() => setBlocks(prev => prev.map(b => ({ ...b, done: false })))} className="px-3 py-2 rounded-xl text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">Reset</button>
        </div>
      </CalcCard>
      <InfoNote>Consistency beats intensity: {hours} planned blocks is a sustainable habit. If you miss a block, move it, don't delete it — the plan is a tool, not a test.</InfoNote>
    </>
  );
}
// ─── Exam Planner: countdown to exams with topic coverage ───────────────────
interface Exam { id: number; subject: string; date: string; topics: string[]; newTopic: string; done: boolean; }

const DEFAULT_EXAMS: Exam[] = [
  { id: 1, subject: 'Thermodynamics', date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), topics: ['Entropy & 2nd law', 'Power cycles'], newTopic: '', done: false },
  { id: 2, subject: 'Fluid Mechanics', date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10), topics: ['Bernoulli', 'Pumps & NPSH'], newTopic: '', done: false },
  { id: 3, subject: 'Heat Transfer', date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), topics: ['Conduction fins', 'LMTD exchangers'], newTopic: '', done: false },
  { id: 4, subject: 'Mass Transfer', date: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10), topics: ['Diffusion', 'McCabe-Thiele'], newTopic: '', done: false },
];

const DEFAULT_NEW_EXAM_DATE = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

function ExamPlannerTab() {
  const [exams, setExams] = useState<Exam[]>(DEFAULT_EXAMS);
  const [subject, setSubject] = useState('Reaction Eng.');
  const [date, setDate] = useState(DEFAULT_NEW_EXAM_DATE);
  const addTopic = (id: number, t: string) => {
    if (!t.trim()) return;
    setExams(prev => prev.map(e => (e.id === id ? { ...e, topics: [...e.topics, t.trim()], newTopic: '' } : e)));
  };
  const rmTopic = (id: number, t: string) => setExams(prev => prev.map(e => (e.id === id ? { ...e, topics: e.topics.filter(x => x !== t) } : e)));
  const addExam = () => {
    setExams(prev => [...prev, { id: Math.max(0, ...prev.map(e => e.id)) + 1, subject, date, topics: [], newTopic: '', done: false }]);
  };
  const delExam = (id: number) => setExams(prev => prev.filter(e => e.id !== id));
  const urgency = (d: number) => d <= 3 ? 'text-red-600 dark:text-red-400' : d <= 7 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
  const inputCls = 'px-3 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <CalendarClock className="w-6 h-6 text-indigo-500" /> Exam Countdown
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Track every exam, its topic checklist and exactly how many days remain.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <select className={inputCls} value={subject} onChange={e => setSubject(e.target.value)}>
          {['Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Mass Transfer', 'Reaction Eng.', 'Process Control'].map(s => <option key={s}>{s}</option>)}
        </select>
        <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
        <button onClick={addExam} className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add exam
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {exams.map(e => {
          const d = daysUntil(e.date);
          return (
            <div key={e.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-400 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-black text-slate-800 dark:text-white">{e.subject}</p>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ml-auto ${urgency(d)}`}>
                  {d === 0 ? 'TODAY' : `${d} day${d === 1 ? '' : 's'} left`}
                </span>
                <button onClick={() => delExam(e.id)} className="text-slate-300 hover:text-red-500 transition-all"><X className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[10px] text-slate-400 mb-3">{e.date}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {e.topics.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[9px] font-bold flex items-center gap-1">
                    {t}
                    <button onClick={() => rmTopic(e.id, t)} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
                {e.topics.length === 0 && <span className="text-[9px] text-slate-400 italic">No topics yet — add the syllabus items.</span>}
              </div>
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="Add a topic…" value={e.newTopic} onChange={ev => setExams(prev => prev.map(x => (x.id === e.id ? { ...x, newTopic: ev.target.value } : x)))} />
                <button onClick={() => addTopic(e.id, e.newTopic)} className="px-3 py-2 rounded-xl text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 transition-all"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>
      <InfoNote>Work backwards from exam dates: one topic mastered per day beats a last-week cram. Use the countdown colour as your priority signal — red topics first.</InfoNote>
    </>
  );
}

// ─── Assignment Planner: tracker with due dates and status ──────────────────
type AssignStatus = 'todo' | 'doing' | 'done';
interface Assignment { id: number; name: string; subject: string; due: string; status: AssignStatus; }

const DEFAULT_ASSIGNS: Assignment[] = [
  { id: 1, name: 'Finned surface design', subject: 'Heat Transfer', due: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), status: 'doing' },
  { id: 2, name: 'Distillation column report', subject: 'Mass Transfer', due: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10), status: 'todo' },
  { id: 3, name: 'Pump selection memo', subject: 'Fluid Mechanics', due: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), status: 'todo' },
];

function AssignmentTab() {
  const [items, setItems] = useState<Assignment[]>(DEFAULT_ASSIGNS);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Thermodynamics');
  const [due, setDue] = useState(DEFAULT_NEW_EXAM_DATE);
  const [status, setStatus] = useState<AssignStatus>('todo');
  const add = () => {
    if (!name.trim()) return;
    setItems(prev => [...prev, { id: Math.max(0, ...prev.map(a => a.id)) + 1, name: name.trim(), subject, due, status }]);
    setName('');
  };
  const patch = (id: number, p: Partial<Assignment>) => setItems(prev => prev.map(a => (a.id === id ? { ...a, ...p } : a)));
  const del = (id: number) => setItems(prev => prev.filter(a => a.id !== id));
  const overdue = items.filter(a => a.status !== 'done' && daysUntil(a.due) === 0 && a.due < new Date().toISOString().slice(0, 10));
  const inputCls = 'px-3 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-indigo-500" /> Assignment Tracker
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Never miss a deadline — log assignments, watch due dates and move them to done.</p>
      </div>
      {overdue.length > 0 && (
        <div className="mb-5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-300">{overdue.length} assignment{overdue.length > 1 ? 's' : ''} overdue — submit or talk to your teacher today.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-6">
        <input className={`${inputCls} flex-1 min-w-[200px]`} placeholder="Assignment name…" value={name} onChange={e => setName(e.target.value)} />
        <select className={inputCls} value={subject} onChange={e => setSubject(e.target.value)}>
          {['Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Mass Transfer', 'Reaction Eng.', 'Process Control'].map(s => <option key={s}>{s}</option>)}
        </select>
        <input type="date" className={inputCls} value={due} onChange={e => setDue(e.target.value)} />
        <select className={inputCls} value={status} onChange={e => setStatus(e.target.value as AssignStatus)}>
          <option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option>
        </select>
        <button onClick={add} className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"><Plus className="w-3.5 h-3.5 inline" /> Add</button>
      </div>
      <div className="space-y-2">
        {items.map(a => {
          const d = daysUntil(a.due);
          const isOverdue = a.status !== 'done' && a.due < new Date().toISOString().slice(0, 10);
          return (
            <div key={a.id} className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all ${a.status === 'done' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 opacity-70' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'}`}>
              <button onClick={() => patch(a.id, { status: a.status === 'done' ? 'todo' : 'done' })} className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${a.status === 'done' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-400'}`}>
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black truncate ${a.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>{a.name}</p>
                <p className="text-[9px] text-slate-400">{a.subject} · due {a.due}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${isOverdue ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300' : d <= 3 && a.status !== 'done' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300' : 'text-slate-400'}`}>
                {isOverdue ? 'OVERDUE' : a.status === 'done' ? '✓' : `${d} day${d === 1 ? '' : 's'}`}
              </span>
              <select className="px-2 py-1 rounded-lg text-[9px] font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none" value={a.status} onChange={e => patch(a.id, { status: e.target.value as AssignStatus })}>
                <option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option>
              </select>
              <button onClick={() => del(a.id)} className="text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          );
        })}
      </div>
      <InfoNote>The two-minute rule: if an assignment takes under two minutes, do it immediately — it keeps the tracker honest and the list small.</InfoNote>
    </>
  );
}
// ─── Flashcards: Leitner spaced repetition ──────────────────────────────────
interface Card { id: number; box: 1 | 2 | 3; front: string; back: string; }
type CardCat = 'Thermodynamics' | 'Fluid Mechanics' | 'Heat Transfer' | 'Mass Transfer' | 'Reaction Eng.' | 'General';

const CARD_CATS: CardCat[] = ['Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Mass Transfer', 'Reaction Eng.', 'General'];

interface Deck { cat: CardCat; cards: Card[]; }

const DEFAULT_DECKS: Deck[] = [
  {
    cat: 'Thermodynamics',
    cards: [
      { id: 101, box: 1, front: 'First law of thermodynamics', back: 'Energy cannot be created or destroyed — ΔU = Q − W for a closed system.' },
      { id: 102, box: 1, front: 'Entropy change for reversible process', back: 'dS = δQ_rev / T. Irreversible processes always increase total entropy (ΔS ≥ 0).' },
      { id: 103, box: 2, front: 'Isentropic process', back: 'Constant entropy (reversible + adiabatic). For ideal gas: TV^(γ−1) = const.' },
    ],
  },
  {
    cat: 'Fluid Mechanics',
    cards: [
      { id: 201, box: 1, front: 'Bernoulli equation', back: 'P/ρg + v²/2g + z = const along a streamline (inviscid, steady, incompressible).' },
      { id: 202, box: 1, front: 'NPSH available vs required', back: 'NPSH_a must exceed NPSH_r or the pump cavitates. NPSH_a = (P_s − P_v)/ρg + velocity head.' },
    ],
  },
  {
    cat: 'Heat Transfer',
    cards: [
      { id: 301, box: 1, front: 'Fourier conduction law', back: 'q = −k·A·dT/dx. Heat flows down the temperature gradient.' },
      { id: 302, box: 2, front: 'Log mean temperature difference', back: 'ΔT_lm = (ΔT1 − ΔT2) / ln(ΔT1/ΔT2). Used for counter/parallel flow exchangers.' },
    ],
  },
  {
    cat: 'Mass Transfer',
    cards: [
      { id: 401, box: 1, front: 'Fick first law', back: 'J = −D·dC/dx. Molar flux proportional to concentration gradient.' },
      { id: 402, box: 2, front: 'Relative volatility', back: 'α = (y/x)/((1−y)/(1−x)). α → 1 means separation becomes impossible.' },
    ],
  },
  {
    cat: 'Reaction Eng.',
    cards: [
      { id: 501, box: 1, front: 'Conversion in a CSTR', back: 'V = F_A0·X / (−r_A) at steady state — well-mixed, outlet = reactor conditions.' },
      { id: 502, box: 2, front: 'Arrhenius equation', back: 'k = A·exp(−Ea/RT). Higher T and lower Ea both increase rate constant.' },
    ],
  },
];

const BOX_SCHEDULE: Record<number, string> = {
  1: 'Review daily',
  2: 'Review every 3 days',
  3: 'Review weekly',
};

function FlashcardsTab() {
  const [decks, setDecks] = useState<Deck[]>(DEFAULT_DECKS);
  const [cat, setCat] = useState<CardCat>('Thermodynamics');
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const deck = decks.find(d => d.cat === cat) ?? decks[0];
  const card = deck.cards[idx];
  const total = decks.reduce((a, d) => a + d.cards.length, 0);

  const answer = (knew: boolean) => {
    setDecks(prev => prev.map(d => {
      if (d.cat !== cat) return d;
      return { ...d, cards: d.cards.map(c => (c.id === card.id ? { ...c, box: (knew ? Math.min(3, c.box + 1) : 1) as 1 | 2 | 3 } : c)) };
    }));
    setFlipped(false);
    if (idx + 1 >= deck.cards.length) setIdx(0);
    else setIdx(idx + 1);
  };
  const addCard = () => {
    if (!front.trim() || !back.trim()) return;
    setDecks(prev => prev.map(d => d.cat === cat ? { ...d, cards: [...d.cards, { id: Math.max(1000, ...d.cards.map(c => c.id)) + 1, box: 1 as const, front: front.trim(), back: back.trim() }] } : d));
    setFront(''); setBack('');
  };
  const delCard = (id: number) => setDecks(prev => prev.map(d => d.cat === cat ? { ...d, cards: d.cards.filter(c => c.id !== id) } : d));
  const boxCounts = [1, 2, 3].map(b => deck.cards.filter(c => c.box === b).length);
  const inputCls = 'px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Brain className="w-6 h-6 text-indigo-500" /> Flashcards · Spaced Repetition
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Leitner system: cards you know move up a box and get reviewed less often; ones you miss go back to box 1.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {CARD_CATS.map(c => {
          const n = decks.find(d => d.cat === c)?.cards.length ?? 0;
          return (
            <button key={c} onClick={() => { setCat(c); setIdx(0); setFlipped(false); }}
              className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${cat === c ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'}`}>
              {c} <span className="opacity-60">({n})</span>
            </button>
          );
        })}
      </div>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map(b => (
          <div key={b} className={`rounded-xl border p-3 text-center ${b === 1 ? 'border-rose-200 dark:border-rose-800' : b === 2 ? 'border-amber-200 dark:border-amber-800' : 'border-emerald-200 dark:border-emerald-800'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Box {b}</p>
            <p className={`text-lg font-black ${b === 1 ? 'text-rose-500' : b === 2 ? 'text-amber-500' : 'text-emerald-500'}`}>{boxCounts[b - 1]}</p>
            <p className="text-[9px] text-slate-400">{BOX_SCHEDULE[b]}</p>
          </div>
        ))}
      </div>
      {card ? (
        <div className="mb-6">
          <button onClick={() => setFlipped(f => !f)}
            className="w-full min-h-[180px] rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-8 text-left hover:shadow-xl hover:shadow-indigo-500/10 transition-all bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-3">{flipped ? 'ANSWER' : 'QUESTION'} · card {idx + 1} of {deck.cards.length}</p>
            <p className={`text-base font-black leading-relaxed ${flipped ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-white'}`}>{flipped ? card.back : card.front}</p>
            <p className="text-[10px] text-slate-400 mt-4">Click to {flipped ? 'see the question' : 'flip the card'}</p>
          </button>
          {flipped && (
            <div className="flex gap-2 mt-4">
              <button onClick={() => answer(false)} className="flex-1 px-4 py-3 rounded-xl text-xs font-black bg-rose-600 text-white hover:bg-rose-700 transition-all">Still learning (→ Box 1)</button>
              <button onClick={() => answer(true)} className="flex-1 px-4 py-3 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-all">I knew it (→ next box)</button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-8 text-center">No cards in this deck yet — add one below.</p>
      )}
      <CalcCard title={`Add card to ${cat}`} icon={Repeat}>
        <div className="flex flex-col gap-2">
          <input className={inputCls} placeholder="Front (question / term)…" value={front} onChange={e => setFront(e.target.value)} />
          <input className={inputCls} placeholder="Back (answer / definition)…" value={back} onChange={e => setBack(e.target.value)} />
          <button onClick={addCard} className="px-4 py-2.5 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add card
          </button>
        </div>
        <div className="mt-4 max-h-40 overflow-y-auto space-y-1.5 pr-1">
          {deck.cards.map(c => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
              <span className={`w-4 h-4 rounded text-[8px] font-black flex items-center justify-center flex-shrink-0 ${c.box === 1 ? 'bg-rose-500' : c.box === 2 ? 'bg-amber-500' : 'bg-emerald-500'} text-white`}>{c.box}</span>
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex-1 truncate">{c.front}</p>
              <button onClick={() => delCard(c.id)} className="text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3">{total} cards across all decks. Consistency beats volume — 10 cards a day beats 70 on Sunday.</p>
      </CalcCard>
    </>
  );
}
// ─── Quiz Lab: MCQ question banks + quiz engine ─────────────────────────────
interface QuizQ { id: number; sub: string; q: string; options: string[]; ans: number; why: string; }

const QUIZ_QS: QuizQ[] = [
  { id: 1, sub: 'Thermodynamics', q: 'For a reversible adiabatic process of an ideal gas, which quantity stays constant?', options: ['Enthalpy', 'Entropy', 'Temperature', 'Pressure'], ans: 1, why: 'Reversible + adiabatic ⇒ isentropic (ΔS = 0). Enthalpy stays constant only for throttling.' },
  { id: 2, sub: 'Thermodynamics', q: 'The second law states that for any spontaneous process the total entropy of the universe…', options: ['Decreases', 'Stays constant', 'Increases', 'Reaches a minimum'], ans: 2, why: 'ΔS_universe ≥ 0; equality only for reversible processes.' },
  { id: 3, sub: 'Thermodynamics', q: 'A throttling valve is approximately…', options: ['Isentropic', 'Isenthalpic', 'Isothermal', 'Isentropic and isenthalpic'], ans: 1, why: 'No work and negligible heat ⇒ h ≈ const; entropy increases due to irreversibility.' },
  { id: 4, sub: 'Thermodynamics', q: 'The efficiency of a Carnot engine between 300 K and 600 K is…', options: ['50%', '33%', '66%', '75%'], ans: 0, why: 'η = 1 − Tc/Th = 1 − 300/600 = 0.5.' },
  { id: 5, sub: 'Fluid Mechanics', q: 'In the Bernoulli equation, the term v²/2g has units of…', options: ['Pressure', 'Velocity', 'Length (head)', 'Power'], ans: 2, why: 'Each term is a head: pressure head, velocity head, elevation head — all in metres.' },
  { id: 6, sub: 'Fluid Mechanics', q: 'Cavitation in a pump occurs when…', options: ['NPSH_a > NPSH_r', 'NPSH_a < NPSH_r', 'NPSH_a = NPSH_r always', 'Flow is laminar'], ans: 1, why: 'When available NPSH falls below required, local pressure drops below vapour pressure and bubbles collapse on the impeller.' },
  { id: 7, sub: 'Fluid Mechanics', q: 'For fully developed laminar flow in a pipe, the velocity profile is…', options: ['Flat', 'Parabolic', 'Linear', 'Triangular'], ans: 1, why: 'Parabolic profile: v(r) = v_max(1 − (r/R)²). Turbulent flow has a flatter profile.' },
  { id: 8, sub: 'Fluid Mechanics', q: 'Reynolds number is the ratio of…', options: ['Viscous to inertial forces', 'Inertial to viscous forces', 'Pressure to viscous forces', 'Gravity to inertial forces'], ans: 1, why: 'Re = ρvD/μ — inertial forces over viscous forces; low Re = laminar.' },
  { id: 9, sub: 'Heat Transfer', q: 'Heat conduction through a wall follows…', options: ['Newton law of cooling', 'Fourier law', 'Stefan-Boltzmann law', 'Fick law'], ans: 1, why: 'Fourier: q = −kA dT/dx. Newton applies to convection, Stefan-Boltzmann to radiation.' },
  { id: 10, sub: 'Heat Transfer', q: 'The log mean temperature difference is used because temperature difference along an exchanger…', options: ['Is constant', 'Varies non-linearly', 'Is zero', 'Depends on flow rate only'], ans: 1, why: 'ΔT changes along the exchanger; LMTD gives the correct average driving force.' },
  { id: 11, sub: 'Heat Transfer', q: 'Which insulation thickness question: adding insulation to a small pipe can sometimes…', options: ['Reduce heat loss then increase it', 'Always reduce heat loss', 'Never change heat loss', 'Increase convective coefficient'], ans: 0, why: 'Critical radius of insulation: below r_cr adding insulation increases loss because surface area grows faster than resistance.' },
  { id: 12, sub: 'Heat Transfer', q: 'A black body has emissivity…', options: ['0', '1', '0.5', 'Depends on temperature'], ans: 1, why: 'A perfect black body absorbs and emits everything: ε = 1.' },
  { id: 13, sub: 'Mass Transfer', q: 'McCabe-Thiele stepping assumes…', options: ['Constant molar overflow', 'Ideal gas', 'Zero reflux', 'Plug flow'], ans: 0, why: 'CMO: molar liquid and vapour flows are constant between stages — the assumption behind the simple stepping construction.' },
  { id: 14, sub: 'Mass Transfer', q: 'Relative volatility α close to 1 means…', options: ['Easy separation', 'Separation impossible/very hard', 'High boiling point', 'Zero pressure'], ans: 1, why: 'α = 1 ⇒ no composition difference between phases, so distillation cannot separate.' },
  { id: 15, sub: 'Mass Transfer', q: 'Fick first law relates molar flux to…', options: ['Temperature gradient', 'Concentration gradient', 'Pressure gradient', 'Velocity gradient'], ans: 1, why: 'J = −D dC/dx: flux is proportional to the concentration gradient (diffusion).' },
  { id: 16, sub: 'Mass Transfer', q: 'Higher reflux ratio in distillation generally means…', options: ['Fewer stages, more energy', 'More stages, less energy', 'No effect on stages', 'Lower product purity'], ans: 0, why: 'More reflux = more driving force per stage, so fewer stages — but higher reboiler duty.' },
  { id: 17, sub: 'Reaction Eng.', q: 'For a first-order reaction in a batch reactor, the time to reach 90% conversion is…', options: ['ln(10)/k', 'ln(2)/k', '10/k', '0.9/k'], ans: 0, why: 't = (1/k)·ln(1/(1−X)) = (1/k)·ln(10) for X = 0.9.' },
  { id: 18, sub: 'Reaction Eng.', q: 'In the Arrhenius equation, increasing activation energy Ea makes the rate constant…', options: ['Increase at all T', 'More sensitive to temperature', 'Less sensitive to temperature', 'Temperature independent'], ans: 1, why: 'High Ea ⇒ stronger exponential temperature dependence: k changes more with T.' },
  { id: 19, sub: 'Reaction Eng.', q: 'A CSTR operating at steady state has the reaction rate evaluated at…', options: ['Feed concentration', 'Outlet concentration', 'Average concentration', 'Maximum concentration'], ans: 1, why: 'Perfect mixing means reactor = outlet conditions, so −r_A is evaluated at the outlet concentration.' },
  { id: 20, sub: 'Reaction Eng.', q: 'Space time τ for a CSTR is defined as…', options: ['V/ν (reactor volume over volumetric flow)', 'ν/V', 'F_A0/V', 'C_A0·V'], ans: 0, why: 'τ = V/ν: the time a fluid element spends in the reactor based on inlet flow.' },
];

const QUIZ_SUBS = ['Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Mass Transfer', 'Reaction Eng.'];

function QuizLabTab() {
  const [sub, setSub] = useState('Thermodynamics');
  const [phase, setPhase] = useState<'idle' | 'run' | 'done'>('idle');
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean[]>([]);
  const bank = QUIZ_QS.filter(q => q.sub === sub);
  const q = bank[idx];
  const start = () => { setIdx(0); setPicked(null); setScore(0); setAnswered([]); setPhase('run'); };
  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setAnswered(prev => [...prev, i === q.ans]);
    if (i === q.ans) setScore(s => s + 1);
  };
  const next = () => {
    if (idx + 1 >= bank.length) { setPhase('done'); return; }
    setIdx(idx + 1); setPicked(null);
  };
  const retry = () => { setPhase('idle'); };
  const pct = bank.length > 0 ? Math.round((score / bank.length) * 100) : 0;
  const verdict = pct >= 80 ? 'Excellent — exam-ready on this topic.' : pct >= 60 ? 'Solid — review the questions you missed.' : 'Needs work — hit the Formula Sheets and re-quiz.';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <ListChecks className="w-6 h-6 text-indigo-500" /> Quiz Lab
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">20 exam-style MCQs across 5 subjects with instant feedback and explanations.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {QUIZ_SUBS.map(s => (
          <button key={s} onClick={() => { setSub(s); setPhase('idle'); }}
            className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${sub === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'}`}>
            {s} <span className="opacity-60">({QUIZ_QS.filter(q => q.sub === s).length})</span>
          </button>
        ))}
      </div>
      {phase === 'idle' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <FlaskConical className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-800 dark:text-white mb-1">{bank.length} questions · {sub}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-5">No timer, no pressure — instant feedback after every answer.</p>
          <button onClick={start} className="px-6 py-3 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25">Start quiz</button>
        </div>
      )}
      {phase === 'run' && q && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-slate-400">Question {idx + 1} of {bank.length}</span>
            <span className="ml-auto text-[10px] font-black text-indigo-500">{score} correct</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-5">
            <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${((idx + (picked !== null ? 1 : 0)) / bank.length) * 100}%` }} />
          </div>
          <p className="text-sm font-black text-slate-800 dark:text-white mb-4">{q.q}</p>
          <div className="grid gap-2">
            {q.options.map((o, i) => {
              let cls = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400';
              if (picked !== null) {
                if (i === q.ans) cls = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-700 dark:text-emerald-300';
                else if (i === picked) cls = 'bg-rose-50 dark:bg-rose-900/20 border-rose-400 text-rose-700 dark:text-rose-300';
                else cls = 'opacity-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500';
              }
              return (
                <button key={i} onClick={() => pick(i)} disabled={picked !== null}
                  className={`text-left rounded-xl border px-4 py-3 text-xs font-bold transition-all ${cls}`}>
                  <span className="mr-2 font-black">{String.fromCharCode(65 + i)}.</span> {o}
                  {picked !== null && i === q.ans && <CheckCircle2 className="w-3.5 h-3.5 inline ml-2 text-emerald-500" />}
                  {picked !== null && i === picked && i !== q.ans && <X className="w-3.5 h-3.5 inline ml-2 text-rose-500" />}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed"><Lightbulb className="w-3.5 h-3.5 inline text-amber-500 mr-1" />{q.why}</p>
              <button onClick={next} className="mt-3 px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                {idx + 1 >= bank.length ? 'See result' : 'Next question'} →
              </button>
            </div>
          )}
        </div>
      )}
      {phase === 'done' && (
        <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-8 text-center bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
          <Award className={`w-12 h-12 mx-auto mb-3 ${pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-rose-500'}`} />
          <p className="text-3xl font-black text-slate-800 dark:text-white mb-1">{score}/{bank.length} <span className="text-base text-slate-400">({pct}%)</span></p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-6">{verdict}</p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {answered.map((ok, i) => (
              <span key={i} className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center ${ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{i + 1}</span>
            ))}
          </div>
          <div className="flex justify-center gap-2">
            <button onClick={retry} className="px-5 py-2.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">Change topic</button>
            <button onClick={start} className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      )}
    </>
  );
}
// --- Formula Sheets: curated per-subject quick reference ----------------------
interface Formula { name: string; formula: string; vars: string; note: string; }
interface FormulaSub { sub: string; icon: ReactNode; color: string; formulas: Formula[]; }

const FORMULA_SUBS: FormulaSub[] = [
  {
    sub: 'Thermodynamics', color: 'text-orange-500', icon: <Atom className="w-4 h-4" />,
    formulas: [
      { name: 'First law (closed)', formula: 'dU = Q - W', vars: 'U internal energy, Q heat added, W work done by system', note: 'Sign convention matters: W positive = work leaving the system.' },
      { name: 'Ideal gas', formula: 'PV = nRT', vars: 'P Pa, V m3, n mol, R 8.314 J/mol.K, T K', note: 'Always convert to Kelvin and SI units before plugging in.' },
      { name: 'Carnot efficiency', formula: 'eta = 1 - Tc/Th', vars: 'Tc cold reservoir, Th hot reservoir (K)', note: 'Maximum possible efficiency between two reservoirs; real cycles are lower.' },
      { name: 'Entropy change', formula: 'dS = integral(dQrev/T)', vars: 'dQrev reversible heat, T absolute temperature', note: 'dS_universe >= 0 for any process - the second law.' },
      { name: 'Isentropic relations', formula: 'T2/T1 = (P2/P1)^((gamma-1)/gamma)', vars: 'gamma = Cp/Cv (about 1.4 for air)', note: 'Valid for reversible adiabatic ideal-gas processes only.' },
    ],
  },
  {
    sub: 'Fluid Mechanics', color: 'text-sky-500', icon: <Waves className="w-4 h-4" />,
    formulas: [
      { name: 'Bernoulli', formula: 'P/rg + v2/2g + z = const', vars: 'P pressure, r density, v velocity, z elevation', note: 'Along a streamline; inviscid, steady, incompressible flow.' },
      { name: 'Reynolds number', formula: 'Re = rvD/mu', vars: 'D pipe diameter, mu dynamic viscosity', note: 'Re < 2300 laminar, > 4000 turbulent (pipe flow).' },
      { name: 'Darcy friction loss', formula: 'hf = f.(L/D).(v2/2g)', vars: 'f friction factor, L length, D diameter', note: 'Use Moody chart or Colebrook equation to find f.' },
      { name: 'NPSH available', formula: 'NPSHa = (Ps - Pv)/rg + v2/2g - zs', vars: 'Ps suction pressure, Pv vapour pressure, zs suction lift', note: 'Must be greater than NPSHr or the pump cavitates.' },
      { name: 'Pump power', formula: 'P = rgQH/eta', vars: 'Q volumetric flow, H head, eta efficiency', note: 'Result in watts when using SI units.' },
    ],
  },
  {
    sub: 'Heat Transfer', color: 'text-rose-500', icon: <Flame className="w-4 h-4" />,
    formulas: [
      { name: 'Fourier conduction', formula: 'q = -kA.dT/dx', vars: 'k thermal conductivity, A area', note: 'Steady 1-D conduction through a plane wall: q = kA.dT/L.' },
      { name: 'Newton cooling', formula: 'q = hA(Ts - Tinf)', vars: 'h convective coefficient, Ts surface, Tinf fluid', note: 'h depends on flow regime, geometry and fluid.' },
      { name: 'LMTD', formula: 'dTlm = (dT1 - dT2)/ln(dT1/dT2)', vars: 'dT1, dT2 temperature differences at the two ends', note: 'For counterflow, dT1 and dT2 are the two end differences.' },
      { name: 'Overall heat transfer', formula: 'Q = UA.dTlm', vars: 'U overall coefficient, A area', note: '1/UA = sum of resistances: convection + conduction + fouling.' },
      { name: 'Stefan-Boltzmann', formula: 'q = eps.sigma.A.T4', vars: 'eps emissivity, sigma = 5.67e-8 W/m2K4', note: 'Radiation grows with T4 - dominant at high temperature.' },
    ],
  },
  {
    sub: 'Mass Transfer', color: 'text-teal-500', icon: <Droplets className="w-4 h-4" />,
    formulas: [
      { name: 'Fick first law', formula: 'J = -D.dC/dx', vars: 'D diffusivity, C concentration', note: 'Steady diffusion through a film: J = D.dC/L.' },
      { name: 'Relative volatility', formula: 'a = (yA/xA)/((1-yA)/(1-xA))', vars: 'y vapour mole fraction, x liquid mole fraction', note: 'a -> 1 means separation becomes impossible.' },
      { name: 'Equilibrium line', formula: 'y = ax/(1 + (a-1)x)', vars: 'binary ideal system', note: 'Base curve for McCabe-Thiele stepping.' },
      { name: 'Minimum reflux', formula: 'Rmin = (xD - yq)/(yq - xq)', vars: 'xD distillate, q-line intersection point', note: 'Infinite stages at Rmin; real design uses 1.2-1.5 x Rmin.' },
      { name: 'Fenske (total reflux)', formula: 'Nmin = ln[(xD/(1-xD)).((1-xB)/xB)] / ln a_avg', vars: 'xB bottoms composition', note: 'Minimum stages at total reflux - a design bound.' },
    ],
  },
  {
    sub: 'Reaction Eng.', color: 'text-purple-500', icon: <Beaker className="w-4 h-4" />,
    formulas: [
      { name: 'Rate law (first order)', formula: '-rA = k.CA', vars: 'k rate constant, CA concentration', note: 'Units of k: per second for first order.' },
      { name: 'Arrhenius', formula: 'k = A.exp(-Ea/RT)', vars: 'A pre-exponential, Ea activation energy, R gas constant', note: 'Plot ln k vs 1/T gives slope = -Ea/R.' },
      { name: 'Batch (first order)', formula: 't = (1/k).ln(1/(1-X))', vars: 'X conversion', note: 'Half-life: t05 = ln 2 / k.' },
      { name: 'CSTR design', formula: 'V = FA0.X/(-rA)', vars: 'FA0 molar feed rate, -rA rate at outlet', note: 'Rate evaluated at outlet conditions (perfect mixing).' },
      { name: 'PFR design', formula: 'V = FA0 . integral(dX/(-rA))', vars: 'integral from X=0 to X_out', note: 'Concentration changes along the tube - integrate the rate.' },
    ],
  },
]

function FormulaSheetsTab() {
  const [sub, setSub] = useState('Thermodynamics');
  const [copied, setCopied] = useState<string | null>(null);
  const current = FORMULA_SUBS.find(f => f.sub === sub)!;
  const copy = (f: Formula) => {
    try {
      void navigator.clipboard.writeText(f.name + ': ' + f.formula + ' - ' + f.note);
      setCopied(f.name);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Sigma className="w-6 h-6 text-indigo-500" /> Formula Sheets
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">The 5 most examinable formulas per subject, with variable keys and traps to avoid.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {FORMULA_SUBS.map(f => (
          <button key={f.sub} onClick={() => setSub(f.sub)}
            className={`px-3 py-2 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${sub === f.sub ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'}`}>
            {f.icon} {f.sub}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {current.formulas.map(f => (
          <div key={f.name} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-400 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-black text-slate-800 dark:text-white">{f.name}</p>
              <button onClick={() => copy(f)} className={`ml-auto px-2 py-1 rounded-lg text-[9px] font-black transition-all ${copied === f.name ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500'}`}>
                {copied === f.name ? 'Copied OK' : 'Copy'}
              </button>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 mb-3 overflow-x-auto">
              <p className="font-mono text-sm font-black text-slate-800 dark:text-white whitespace-nowrap">{f.formula}</p>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1"><b>Variables:</b> {f.vars}</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400"><b>Watch out:</b> {f.note}</p>
          </div>
        ))}
      </div>
      <InfoNote>Print or screenshot the sheet for your subject before the exam - but the best revision is writing each formula from memory, then checking against this list.</InfoNote>
    </>
  );
}
// --- Mastery Dashboard: subject scores -> weak-area recommendations (#30) -----
interface Subject { id: string; label: string; mastery: number; }

const DEFAULT_MASTERY: Subject[] = [
  { id: 'thermo', label: 'Thermodynamics', mastery: 72 },
  { id: 'fluid', label: 'Fluid Mechanics', mastery: 85 },
  { id: 'heat', label: 'Heat Transfer', mastery: 61 },
  { id: 'mass', label: 'Mass Transfer', mastery: 43 },
  { id: 'reaction', label: 'Reaction Eng.', mastery: 78 },
];

function MasteryDashboardTab({ onNav }: { onNav: (t: TabId) => void }) {
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_MASTERY);
  const setMastery = (id: string, v: number) => setSubjects(prev => prev.map(s => (s.id === id ? { ...s, mastery: v } : s)));
  const weak = [...subjects].filter(s => s.mastery < 60).sort((a, b) => a.mastery - b.mastery);
  const avg = Math.round(subjects.reduce((a, s) => a + s.mastery, 0) / subjects.length);
  const level = avg >= 75 ? 'On track' : avg >= 60 ? 'Developing' : 'At risk';
  const levelColor = avg >= 75 ? 'text-emerald-500' : avg >= 60 ? 'text-amber-500' : 'text-rose-500';
  const gaugeColor = (m: number) => m >= 75 ? 'bg-emerald-500' : m >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  const barColor = (m: number) => m >= 75 ? 'text-emerald-600 dark:text-emerald-400' : m >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Gauge className="w-6 h-6 text-indigo-500" /> Mastery Dashboard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rate your command of each subject - ChemBase finds the weak areas and builds your revision path.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Overall mastery</p>
          <p className={`text-4xl font-black ${levelColor}`}>{avg}%</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[10px] font-black ${level === 'On track' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' : level === 'Developing' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300'}`}>{level}</span>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Per-subject mastery</p>
          <div className="space-y-3">
            {subjects.map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-28 text-[10px] font-black text-slate-600 dark:text-slate-300 flex-shrink-0">{s.label}</span>
                <input type="range" min={0} max={100} value={s.mastery} onChange={e => setMastery(s.id, parseInt(e.target.value, 10))} className="flex-1 accent-indigo-500" />
                <span className={`w-10 text-right text-[11px] font-black ${barColor(s.mastery)}`}>{s.mastery}%</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-400 mt-3">Slide each subject to your latest test or self-assessment score.</p>
        </div>
      </div>
      {weak.length > 0 ? (
        <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-800 p-5 bg-rose-50/50 dark:bg-rose-950/20">
          <p className="text-xs font-black text-rose-600 dark:text-rose-300 flex items-center gap-2 mb-4"><AlertTriangle className="w-4 h-4" /> Weak areas found - here is your revision path</p>
          <div className="space-y-3">
            {weak.map(w => (
              <div key={w.id} className="rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 p-4">
                <p className="text-xs font-black text-slate-800 dark:text-white mb-2">{w.label} - <span className={barColor(w.mastery)}>{w.mastery}%</span></p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${gaugeColor(w.mastery)} text-white`}>Focus area</span>
                </div>
                <ul className="grid md:grid-cols-2 gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-1.5"><Compass className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" /> Study the Formula Sheet for {w.label} (1 hr) <button onClick={() => onNav('formulas')} className="ml-auto px-2 py-0.5 rounded-md text-[8px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 transition-all">Open</button></li>
                  <li className="flex items-start gap-1.5"><Zap className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" /> Run the {w.label} quiz in Quiz Lab (15 min) <button onClick={() => onNav('quiz')} className="ml-auto px-2 py-0.5 rounded-md text-[8px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 transition-all">Open</button></li>
                  <li className="flex items-start gap-1.5"><Target className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" /> Do 5 practice problems from the unit <button onClick={() => onNav('study')} className="ml-auto px-2 py-0.5 rounded-md text-[8px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 transition-all">Open</button></li>
                  <li className="flex items-start gap-1.5"><BookMarked className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" /> Revise its flashcards 2 days in a row <button onClick={() => onNav('cards')} className="ml-auto px-2 py-0.5 rounded-md text-[8px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 transition-all">Open</button></li>
                  <li className="flex items-start gap-1.5 md:col-span-2"><CalendarDays className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" /> Add a {w.label} block to next week's Study Planner and re-test in 7 days <button onClick={() => onNav('study')} className="ml-auto px-2 py-0.5 rounded-md text-[8px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 transition-all">Open</button></li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-6 text-center bg-emerald-50/50 dark:bg-emerald-950/20">
          <Award className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">No weak areas - every subject is above 60%.</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Keep it there: maintenance revision is 15 minutes per subject per week.</p>
        </div>
      )}
      <InfoNote>Mastery is a self-assessment tool, not a gradebook - update it after every quiz, test and assignment so the recommendations stay honest.</InfoNote>
    </>
  );
}
// --- Notes: quick capture per subject (spec #29) -------------------------------
interface Note { id: number; subject: string; text: string; }

const NOTE_SUBS = ['Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Mass Transfer', 'Reaction Eng.', 'General'];

const DEFAULT_NOTES: Note[] = [
  { id: 1, subject: 'Thermodynamics', text: 'Entropy is not disorder - it is the number of accessible microstates. dS = dQrev/T only along reversible paths.' },
  { id: 2, subject: 'Heat Transfer', text: 'For the exam: draw the temperature profile first. Where the lines are parallel (counterflow) the LMTD is larger.' },
  { id: 3, subject: 'Mass Transfer', text: 'Relative volatility near 1 means nearly identical boiling points - check for azeotropes before choosing distillation.' },
];

function NotesTab() {
  const [notes, setNotes] = useState<Note[]>(DEFAULT_NOTES);
  const [subj, setSubj] = useState('General');
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('All');
  const add = () => {
    if (!text.trim()) return;
    setNotes(prev => [...prev, { id: Math.max(0, ...prev.map(n => n.id)) + 1, subject: subj, text: text.trim() }]);
    setText('');
  };
  const del = (id: number) => setNotes(prev => prev.filter(n => n.id !== id));
  const edit = (id: number, v: string) => setNotes(prev => prev.map(n => (n.id === id ? { ...n, text: v } : n)));
  const subs = ['All', ...NOTE_SUBS];
  const visible = notes.filter(n => filter === 'All' || n.subject === filter);
  const inputCls = 'px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <NotebookPen className="w-6 h-6 text-indigo-500" /> Notes
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quick capture for definitions, traps and insights - editable, filterable by subject.</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {subs.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${filter === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'}`}>
            {s} <span className="opacity-60">({s === 'All' ? notes.length : notes.filter(n => n.subject === s).length})</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <select className={inputCls} value={subj} onChange={e => setSubj(e.target.value)}>
          {NOTE_SUBS.map(s => <option key={s}>{s}</option>)}
        </select>
        <input className={`${inputCls} flex-1 min-w-[220px]`} placeholder="Write a note…" value={text} onChange={e => setText(e.target.value)} />
        <button onClick={add} className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add note
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {visible.map(n => (
          <div key={n.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-indigo-400 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black ${subjectColor(n.subject)}`}>{n.subject}</span>
              <button onClick={() => del(n.id)} className="ml-auto text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <textarea rows={4} className="w-full text-[11px] font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none resize-none" value={n.text} onChange={e => edit(n.id, e.target.value)} />
          </div>
        ))}
        {visible.length === 0 && <p className="text-xs text-slate-400 py-10 text-center col-span-2">No notes here yet - capture your first one above.</p>}
      </div>
      <InfoNote>Reviewing your own notes right before an exam beats rereading the book - your notes already know which parts you found confusing.</InfoNote>
    </>
  );
}

// --- Module shell & tabs -------------------------------------------------------
const TABS = [
  { id: 'study', label: 'Study Planner', icon: BookOpen },
  { id: 'exams', label: 'Exam Countdown', icon: CalendarClock },
  { id: 'assign', label: 'Assignments', icon: ClipboardList },
  { id: 'cards', label: 'Flashcards', icon: Brain },
  { id: 'quiz', label: 'Quiz Lab', icon: ListChecks },
  { id: 'formulas', label: 'Formula Sheets', icon: Sigma },
  { id: 'notes', label: 'Notes', icon: NotebookPen },
  { id: 'mastery', label: 'Mastery', icon: Gauge },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AcademicHubModule() {
  const [tab, setTab] = useState<TabId>('study');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Academic Hub</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Study, exam and assignment planning - flashcards with spaced repetition, quizzes, formula sheets and a mastery dashboard.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${tab === t.id
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'study' && <StudyPlannerTab />}
      {tab === 'exams' && <ExamPlannerTab />}
      {tab === 'assign' && <AssignmentTab />}
      {tab === 'cards' && <FlashcardsTab />}
      {tab === 'quiz' && <QuizLabTab />}
      {tab === 'formulas' && <FormulaSheetsTab />}
      {tab === 'notes' && <NotesTab />}
      {tab === 'mastery' && <MasteryDashboardTab onNav={setTab} />}
    </div>
  );
}
