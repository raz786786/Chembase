import PfdFlowchartEditor from './PfdFlowchartEditor';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  BookOpen, Workflow, Gauge, MousePointer2, GraduationCap,
  Info, CheckCircle2, AlertTriangle, Lightbulb, ArrowRight
} from 'lucide-react';
import { CalcCard, InputRow } from './SharedComponents';

// ─── Small UI helpers ───────────────────────────────────────────────────────
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

function TagPill({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${color ?? 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400'}`}>
      {children}
    </span>
  );
}
// ─── ISA-style PFD / P&ID glyphs (simplified line symbols) ─────────────────
const GLYPHS: Record<string, ReactNode> = {
  pump: (
    <g>
      <circle cx="20" cy="20" r="9" />
      <path d="M14 20 L26 13.5 L26 26.5 Z" />
      <line x1="6" y1="20" x2="11" y2="20" />
      <line x1="29" y1="20" x2="34" y2="20" />
    </g>
  ),
  compressor: (
    <g>
      <circle cx="20" cy="20" r="9" />
      <path d="M13 13 L26 13 L20 20 Z" />
      <path d="M13 27 L26 27 L20 20 Z" />
      <line x1="6" y1="20" x2="11" y2="20" />
      <line x1="29" y1="20" x2="34" y2="20" />
    </g>
  ),
  exchanger: (
    <g>
      <rect x="5" y="9" width="11" height="22" rx="1" />
      <rect x="24" y="9" width="11" height="22" rx="1" />
      <path d="M16 20 q2 -6 4 0 t4 0" />
      <line x1="16" y1="9" x2="16" y2="31" />
      <line x1="24" y1="9" x2="24" y2="31" />
    </g>
  ),
  reactor: (
    <g>
      <circle cx="20" cy="21" r="9" />
      <rect x="17" y="6" width="6" height="5" rx="1" />
      <line x1="20" y1="11" x2="20" y2="15" />
      <line x1="20" y1="15" x2="16" y2="18" />
      <line x1="20" y1="15" x2="24" y2="18" />
    </g>
  ),
  column: (
    <g>
      <rect x="13" y="10" width="14" height="22" />
      <path d="M13 10 q7 -6 14 0 Z" />
      <line x1="13" y1="16" x2="27" y2="16" />
      <line x1="13" y1="22" x2="27" y2="22" />
      <line x1="13" y1="28" x2="27" y2="28" />
    </g>
  ),
  tank: (
    <g>
      <rect x="8" y="16" width="24" height="14" rx="1" />
      <path d="M8 16 q12 -8 24 0" />
      <line x1="20" y1="16" x2="20" y2="13" />
      <line x1="20" y1="13" x2="20" y2="9" />
    </g>
  ),
  separator: (
    <g>
      <rect x="6" y="15" width="28" height="12" rx="6" />
      <line x1="6" y1="21" x2="0" y2="21" />
      <line x1="34" y1="19" x2="40" y2="19" />
      <line x1="34" y1="23" x2="40" y2="23" />
    </g>
  ),
  valve: (
    <g>
      <path d="M12 10 L28 10 L20 20 Z" />
      <path d="M28 30 L12 30 L20 20 Z" />
      <line x1="6" y1="10" x2="12" y2="10" />
      <line x1="28" y1="10" x2="34" y2="10" />
    </g>
  ),
  controlvalve: (
    <g>
      <path d="M12 16 L28 16 L20 26 Z" />
      <path d="M28 36 L12 36 L20 26 Z" />
      <rect x="17" y="4" width="6" height="7" rx="1" />
      <line x1="20" y1="11" x2="20" y2="16" />
      <line x1="6" y1="16" x2="12" y2="16" />
      <line x1="28" y1="16" x2="34" y2="16" />
    </g>
  ),
  furnace: (
    <g>
      <rect x="7" y="16" width="26" height="14" rx="1" />
      <path d="M20 28 q-5 -6 0 -10 q5 4 0 10 Z" />
      <line x1="24" y1="16" x2="24" y2="9" />
      <line x1="20" y1="9" x2="28" y2="9" />
    </g>
  ),
  mixer: (
    <g>
      <circle cx="20" cy="22" r="8" />
      <rect x="17" y="8" width="6" height="5" rx="1" />
      <line x1="20" y1="13" x2="20" y2="16" />
      <path d="M13 22 h4 M23 22 h4" />
      <line x1="6" y1="22" x2="12" y2="22" />
      <line x1="28" y1="22" x2="34" y2="22" />
    </g>
  ),
  filter: (
    <g>
      <circle cx="20" cy="20" r="9" />
      <line x1="13" y1="20" x2="27" y2="20" />
      <circle cx="17" cy="20" r="1.6" />
      <circle cx="23" cy="20" r="1.6" />
    </g>
  ),
  psv: (
    <g>
      <rect x="14" y="18" width="12" height="7" rx="1" />
      <rect x="16" y="8" width="8" height="4" rx="1" />
      <line x1="20" y1="12" x2="20" y2="18" />
      <line x1="20" y1="25" x2="20" y2="31" />
    </g>
  ),
  instrument: (
    <g>
      <circle cx="20" cy="20" r="8" />
      <line x1="20" y1="12" x2="20" y2="28" />
    </g>
  ),
  transmitter: (
    <g>
      <circle cx="20" cy="20" r="7" />
      <circle cx="20" cy="20" r="1.6" />
    </g>
  ),
  orifice: (
    <g>
      <line x1="6" y1="20" x2="14" y2="20" />
      <rect x="14" y="15" width="3" height="10" />
      <rect x="23" y="15" width="3" height="10" />
      <line x1="26" y1="20" x2="34" y2="20" />
    </g>
  ),
  thermocouple: (
    <g>
      <line x1="6" y1="20" x2="14" y2="20" />
      <rect x="14" y="17" width="6" height="6" rx="1" />
      <line x1="20" y1="20" x2="34" y2="20" />
    </g>
  ),
  levelgauge: (
    <g>
      <rect x="12" y="10" width="16" height="20" rx="1" />
      <path d="M12 16 L28 16 M12 22 L28 22" />
    </g>
  ),
  motor: (
    <g>
      <circle cx="20" cy="20" r="9" />
      <path d="M16 24 l4 -8 l4 8 Z" />
    </g>
  ),
  line: (
    <g>
      <line x1="4" y1="14" x2="36" y2="14" />
      <line x1="4" y1="22" x2="36" y2="22" strokeDasharray="5 3" />
      <line x1="4" y1="30" x2="36" y2="30" strokeDasharray="1.5 2.5" />
    </g>
  ),
};

function PfdGlyph({ type, size = 40 }: { type: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {GLYPHS[type] ?? <circle cx="20" cy="20" r="9" />}
    </svg>
  );
}
// ─── Symbol library data ────────────────────────────────────────────────────
interface PfdSymbol { id: string; name: string; cat: 'PFD' | 'P&ID'; glyph: string; desc: string; usage: string; }

const SYMBOLS: PfdSymbol[] = [
  { id: 'pump', name: 'Centrifugal pump', cat: 'PFD', glyph: 'pump', desc: 'Transfers energy to a liquid, raising its pressure (head) to overcome friction and elevation.', usage: 'Draw as a circle with an inscribed triangle; always label with a pump tag such as P-101.' },
  { id: 'compressor', name: 'Compressor', cat: 'PFD', glyph: 'compressor', desc: 'Raises gas pressure for transport, liquefaction or high-pressure reaction.', usage: 'Circle with two inward-pointing triangles; tag as C-101 or K-101.' },
  { id: 'exchanger', name: 'Heat exchanger', cat: 'PFD', glyph: 'exchanger', desc: 'Transfers heat between two streams without mixing them — the heart of energy integration.', usage: 'Two parallel rectangles with a wavy line between; shows both hot and cold process lines.' },
  { id: 'reactor', name: 'Reactor (CSTR)', cat: 'PFD', glyph: 'reactor', desc: 'Vessel where chemical conversion occurs; agitation keeps composition uniform.', usage: 'Vessel with an agitator shaft and motor cap on top; tag as R-101.' },
  { id: 'column', name: 'Distillation column', cat: 'PFD', glyph: 'column', desc: 'Separates components by boiling point through staged vapor-liquid contact.', usage: 'Tall vessel with internal tray lines; overhead goes to a condenser, bottoms to a reboiler.' },
  { id: 'tank', name: 'Storage tank', cat: 'PFD', glyph: 'tank', desc: 'Holds inventory between units and buffers feed or product.', usage: 'Rectangle with a domed roof; tag as T-101 or V-101 depending on service.' },
  { id: 'separator', name: 'Separator vessel', cat: 'PFD', glyph: 'separator', desc: 'Disengages a vapor phase from a liquid phase by gravity or demisting.', usage: 'Horizontal or vertical cylinder with vapor outlet at top and liquid outlet at the bottom.' },
  { id: 'valve', name: 'Isolation / gate valve', cat: 'PFD', glyph: 'valve', desc: 'Stops or allows flow in a line (on-off duty, not throttling).', usage: 'Bow-tie symbol on the line; in P&IDs each valve gets a unique tag.' },
  { id: 'furnace', name: 'Fired heater', cat: 'PFD', glyph: 'furnace', desc: 'Supplies large heat duties by burning fuel; used to vaporize crude or heat reaction feeds.', usage: 'Rectangular box with a flame and a stack; the process coil runs through the firebox.' },
  { id: 'mixer', name: 'Mixer / blender', cat: 'PFD', glyph: 'mixer', desc: 'Combines two or more streams into a uniform outlet composition.', usage: 'Circle with a small impeller; often upstream of a reactor or storage.' },
  { id: 'filter', name: 'Filter', cat: 'PFD', glyph: 'filter', desc: 'Removes suspended solids from a liquid or gas stream.', usage: 'Circle with a horizontal line and two dots indicating the filter medium.' },
  { id: 'psv', name: 'Pressure safety valve', cat: 'P&ID', glyph: 'psv', desc: 'Automatically relieves overpressure to protect equipment and personnel.', usage: 'Required on every vessel that can be isolated and pressurized; tags are PSV-xxx.' },
  { id: 'instrument', name: 'Instrument bubble', cat: 'P&ID', glyph: 'instrument', desc: 'ISA-5.1 bubble: the first letter is the measured variable, following letters the functions.', usage: 'Circle on the process line or on a signal line; e.g. TIC-103 inside the bubble.' },
  { id: 'transmitter', name: 'Transmitter', cat: 'P&ID', glyph: 'transmitter', desc: 'Converts a sensor reading into an analog signal (typically 4–20 mA) for the controller.', usage: 'Letter T as the last function letter, e.g. FT (flow transmitter), PT, TT, LT.' },
  { id: 'controlvalve', name: 'Control valve', cat: 'P&ID', glyph: 'controlvalve', desc: 'The final control element: adjusts flow continuously in response to the controller output.', usage: 'Bow-tie with an actuator box on top; tag with V, e.g. FV-101, TV-201.' },
  { id: 'orifice', name: 'Orifice plate', cat: 'P&ID', glyph: 'orifice', desc: 'Primary flow element: a restriction whose pressure drop is proportional to flow squared.', usage: 'Two small blocks on the line, often drawn beside an FT transmitter.' },
  { id: 'thermocouple', name: 'Thermocouple / TE', cat: 'P&ID', glyph: 'thermocouple', desc: 'Primary temperature element that senses temperature at the process point.', usage: 'A tee on the line connecting to a TT or directly to an indicator.' },
  { id: 'levelgauge', name: 'Level gauge / glass', cat: 'P&ID', glyph: 'levelgauge', desc: 'Direct visual indication of liquid level in a vessel.', usage: 'Vertical rectangle bridged between two nozzles on a tank or drum.' },
  { id: 'motor', name: 'Motor', cat: 'P&ID', glyph: 'motor', desc: 'Prime mover that drives pumps, compressors and agitators.', usage: 'Circle with an M; the driven machine is tagged, e.g. P-101 driven by M-101.' },
  { id: 'line', name: 'Line types', cat: 'P&ID', glyph: 'line', desc: 'Solid = process line; dashed = electrical signal; dotted/dash-dot = pneumatic or hydraulic signal.', usage: 'Signal lines connect instruments without carrying process fluid.' },
];
// ─── ISA-5.1 instrument tags & line identification ──────────────────────────
const ISA_VARS: Record<string, string> = {
  F: 'Flow', T: 'Temperature', P: 'Pressure', L: 'Level', A: 'Analysis',
  Q: 'Quantity / total', S: 'Speed / frequency', V: 'Viscosity', D: 'Density',
  M: 'Moisture / humidity', H: 'Hand (manual)', W: 'Weight / mass',
};
const ISA_FUNCS: Record<string, string> = {
  I: 'Indicator', C: 'Controller', R: 'Recorder', T: 'Transmitter', A: 'Alarm',
  S: 'Switch', V: 'Valve / self-actuating', E: 'Primary element', G: 'Gauge / glass',
  K: 'Time / rate', Y: 'Relay / compute', W: 'Well',
};
const ISA_MODS: Record<string, string> = {
  H: 'High', L: 'Low', HH: 'High–high', LL: 'Low–low', I: 'Intermediate',
  D: 'Differential', O: 'Open', C: 'Close', M: 'Middle',
};

interface TagPart { kind: 'variable' | 'function' | 'modifier'; code: string; name: string; }
interface TagDecode { tag: string; loop: string; parts: TagPart[]; ok: boolean; msg?: string; }

function decodeTag(raw: string): TagDecode {
  const t = raw.trim().toUpperCase().replace(/[-\s]/g, '');
  const m = t.match(/^([A-Z]+)(\d+)([A-Z]*)$/);
  if (!m) return { tag: t, loop: '', parts: [], ok: false, msg: 'Use the ISA form: letters + loop number + optional suffix, e.g. TIC-103 or PSHH-101.' };
  const letters = m[1], loop = m[2], suffix = m[3];
  const parts: TagPart[] = [];
  parts.push({ kind: 'variable', code: letters[0], name: ISA_VARS[letters[0]] ?? 'Unknown variable — check ISA-5.1' });
  let i = 1;
  while (i < letters.length) {
    const ch = letters[i];
    if (ch === 'H' || ch === 'L') {
      // consecutive H/L letters are alarm/trip modifiers: PSHH-101 = Pressure Switch High–High
      let j = i;
      while (j < letters.length && (letters[j] === 'H' || letters[j] === 'L')) j++;
      const run = letters.slice(i, j);
      const code = run.length >= 2 ? run[0] + run[1] : run;
      parts.push({ kind: 'modifier', code, name: ISA_MODS[code] ?? 'High/low modifier' });
      i = j;
    } else {
      const f = ISA_FUNCS[ch];
      parts.push(f ? { kind: 'function', code: ch, name: f } : { kind: 'modifier', code: ch, name: ISA_MODS[ch] ?? 'Function modifier' });
      i++;
    }
  }
  let s = suffix;
  if (s.startsWith('HH')) { parts.push({ kind: 'modifier', code: 'HH', name: 'High–high' }); s = s.slice(2); }
  else if (s.startsWith('LL')) { parts.push({ kind: 'modifier', code: 'LL', name: 'Low–low' }); s = s.slice(2); }
  else if (s.startsWith('H')) { parts.push({ kind: 'modifier', code: 'H', name: 'High' }); s = s.slice(1); }
  else if (s.startsWith('L')) { parts.push({ kind: 'modifier', code: 'L', name: 'Low' }); s = s.slice(1); }
  if (s) parts.push({ kind: 'modifier', code: s, name: ISA_MODS[s] ?? 'Loop suffix — duplicate/variant instrument on the same loop' });
  return { tag: t, loop, parts, ok: true };
}

const LINE_MATERIALS: Record<string, string> = {
  CS: 'Carbon steel', SS: 'Stainless steel', CU: 'Copper', AL: 'Aluminium',
  PE: 'Polyethylene', PP: 'Polypropylene', PV: 'PVC', TI: 'Titanium', NI: 'Nickel alloy',
};
const LINE_TYPES: Record<string, string> = {
  PL: 'Process line', SL: 'Steam line', CW: 'Cooling water', RW: 'Raw water',
  WW: 'Waste water', CA: 'Instrument air', NG: 'Natural gas', FO: 'Fuel oil',
  INS: 'Instrument line', DR: 'Drain', VENT: 'Vent', REC: 'Recycle', LN: 'Lube oil',
};

interface LineDecode { ok: boolean; msg?: string; parts: { code: string; name: string; hint: string }[]; }

// 8"-CS-1-PL-1010-A1 : size - material - unit/area - line type - sequence - class
function decodeLine(raw: string): LineDecode {
  const t = raw.trim().toUpperCase().replace(/\s+/g, '');
  const m = t.match(/^([\d.]+)"?-([A-Z0-9]{1,4})-(\d+)-([A-Z]{2,4})-(\d+)-([A-Z0-9]+)$/);
  if (!m) return { ok: false, msg:  'Expected: Diameter-Material-Unit-LineType-Sequence-Class, e.g. 8"-CS-1-PL-1010-A1.', parts: [] };
  const [, size, mat, unit, type, seq, cls] = m;
  return {
    ok: true,
    parts: [
      { code: size + '"', name: 'Nominal diameter', hint: '8" ≈ DN200; the pipe bore size, not the outside diameter.' },
      { code: mat, name: LINE_MATERIALS[mat] ?? 'Material', hint: 'First material letter(s) of the pipe spec.' },
      { code: unit, name: 'Unit / process area', hint: 'Number of the unit, plant area or battery limit block.' },
      { code: type, name: LINE_TYPES[type] ?? 'Line type', hint: 'Two letters describing the fluid service.' },
      { code: seq, name: 'Sequence number', hint: 'Unique sequential number within the unit.' },
      { code: cls, name: 'Line class', hint: 'Piping class/spec reference that fixes wall thickness, flanges and rating.' },
    ],
  };
}

const TAG_EXAMPLES = ['TIC-103', 'FIC-101', 'LIC-301', 'PIC-401', 'PSHH-101', 'PDIT-104', 'FT-101A', 'TAH-203'];
const LINE_EXAMPLES = ['8"-CS-1-PL-1010-A1', '6"-SS-2-PL-3012-B2', '3"-CS-2-CW-1100-A1', '1"-CS-1-CA-0501-A1', '12"-CS-3-SL-2001-A1', '2"-SS-2-INS-4005-B1'];
// ─── Control-loop anatomy (P&ID segments) ───────────────────────────────────
interface LoopData {
  id: string; name: string; sensorCode: string; controllerTag: string;
  valveTag: string; element: string; desc: string;
}

const LOOPS: LoopData[] = [
  {
    id: 'flow', name: 'Flow · FIC-101', sensorCode: 'FT', controllerTag: 'FIC-101', valveTag: 'FV-101',
    element: 'Orifice plate',
    desc: 'The orifice plate creates a differential pressure proportional to flow². The FT transmitter converts it to a 4–20 mA signal; the FIC controller compares it to the setpoint and moves FV-101 to restore the setpoint flow.',
  },
  {
    id: 'temp', name: 'Temperature · TIC-201', sensorCode: 'TT', controllerTag: 'TIC-201', valveTag: 'TV-201',
    element: 'Thermocouple / RTD',
    desc: 'The TT senses the outlet temperature. TIC-201 compares it with the setpoint and throttles TV-201 on the heating medium (e.g. steam to a reboiler). Temperature loops are inherently slower than flow loops.',
  },
  {
    id: 'level', name: 'Level · LIC-301', sensorCode: 'LT', controllerTag: 'LIC-301', valveTag: 'LV-301',
    element: 'Differential-pressure level sensor',
    desc: 'The LT measures vessel level via the hydrostatic head. LIC-301 adjusts LV-301 on the inlet (or outlet) so inflow balances outflow at the desired level — protecting pumps from starvation and vessels from overflow.',
  },
  {
    id: 'pressure', name: 'Pressure · PIC-401', sensorCode: 'PT', controllerTag: 'PIC-401', valveTag: 'PV-401',
    element: 'Pressure tap',
    desc: 'The PT senses vessel or line pressure. PIC-401 manipulates PV-401 (e.g. on a vent or a bypass) to hold pressure — often cascaded with a temperature or level loop.',
  },
];

function LoopDiagram({ loop }: { loop: LoopData }) {
  const lineY = 176;
  const sensorX = 150, ctrlX = 150, ctrlY = 66, valveX = 330;
  return (
    <svg viewBox="0 0 640 260" className="w-full h-auto select-none">
      {/* process line */}
      <line x1={28} y1={lineY} x2={612} y2={lineY} className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="2.4" />
      <polygon points={`${612},${lineY - 5} ${612},${lineY + 5} ${622},${lineY}`} className="fill-slate-500 dark:fill-slate-400" />
      {/* primary element (orifice / tee) */}
      <rect x={112} y={lineY - 9} width="5" height="18" className="fill-slate-400 dark:fill-slate-500" />
      <rect x={124} y={lineY - 9} width="5" height="18" className="fill-slate-400 dark:fill-slate-500" />
      <text x={118} y={lineY - 16} textAnchor="middle" className="fill-slate-400 text-[9px] font-bold">{loop.element}</text>
      {/* sensor bubble on the line */}
      <circle cx={sensorX} cy={lineY} r={17} className="fill-white dark:fill-slate-800 stroke-slate-500 dark:stroke-slate-400" strokeWidth="1.8" />
      <text x={sensorX} y={lineY + 3} textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-[10px] font-black">{loop.sensorCode}</text>
      <text x={sensorX} y={lineY - 24} textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">sensor</text>
      {/* signal to controller */}
      <line x1={sensorX} y1={lineY - 17} x2={sensorX} y2={ctrlY + 22} className="stroke-sky-500" strokeWidth="1.6" strokeDasharray="5 4" />
      {/* controller bubble */}
      <circle cx={ctrlX} cy={ctrlY} r={21} className="fill-white dark:fill-slate-800 stroke-sky-500" strokeWidth="1.8" />
      <text x={ctrlX} y={ctrlY - 2} textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-[10px] font-black">{loop.controllerTag.split('-')[0]}</text>
      <text x={ctrlX} y={ctrlY + 11} textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">{loop.controllerTag.split('-')[1]}</text>
      <text x={ctrlX} y={ctrlY - 30} textAnchor="middle" className="fill-sky-500 text-[8px] font-bold">controller</text>
      {/* signal to valve */}
      <path d={`M ${ctrlX + 16} ${ctrlY} C ${valveX - 70} ${ctrlY}, ${ctrlX + 16} ${lineY - 30}, ${valveX} ${lineY - 34}`} className="stroke-sky-500" fill="none" strokeWidth="1.6" strokeDasharray="5 4" />
      {/* control valve on the line */}
      <path d={`M ${valveX - 14} ${lineY - 16} L ${valveX + 14} ${lineY - 16} L ${valveX} ${lineY} Z`} className="fill-white dark:fill-slate-800 stroke-amber-500" strokeWidth="1.6" />
      <path d={`M ${valveX + 14} ${lineY + 16} L ${valveX - 14} ${lineY + 16} L ${valveX} ${lineY} Z`} className="fill-white dark:fill-slate-800 stroke-amber-500" strokeWidth="1.6" />
      <rect x={valveX - 9} y={lineY - 44} width="18" height="10" rx="2" className="fill-white dark:fill-slate-800 stroke-amber-500" strokeWidth="1.6" />
      <line x1={valveX} y1={lineY - 34} x2={valveX} y2={lineY - 24} className="stroke-amber-500" strokeWidth="1.6" />
      <text x={valveX} y={lineY - 50} textAnchor="middle" className="fill-amber-600 text-[8px] font-bold">{loop.valveTag}</text>
      <text x={valveX} y={lineY + 36} textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">final element</text>
      {/* legend */}
      <line x1={30} y1={236} x2={70} y2={236} className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="2" />
      <text x={78} y={239} className="fill-slate-400 text-[8px] font-bold">process line</text>
      <line x1={180} y1={236} x2={220} y2={236} className="stroke-sky-500" strokeWidth="1.6" strokeDasharray="5 4" />
      <text x={228} y={239} className="fill-slate-400 text-[8px] font-bold">signal (electrical)</text>
      <line x1={380} y1={236} x2={420} y2={236} className="stroke-amber-500" strokeWidth="2" />
      <text x={428} y={239} className="fill-slate-400 text-[8px] font-bold">control valve</text>
    </svg>
  );
}
// ─── Quiz data ──────────────────────────────────────────────────────────────
interface QuizQ { q: string; options: string[]; a: number; explain: string; }

const QUIZ: QuizQ[] = [
  { q: 'On a P&ID, a circle containing TIC represents…', options: ['A temperature indicating controller', 'A flow transmitter', 'A tank inlet connection', 'A temperature recorder only'], a: 0, explain: 'T = temperature (measured variable), I = indicator, C = controller — the bubble that reads the process and acts on it.' },
  { q: 'Which symbol is used for a centrifugal pump on a PFD?', options: ['A bow-tie on the line', 'A circle with an inscribed triangle', 'A rectangle with a flame', 'A tall vessel with tray lines'], a: 1, explain: 'The circle-with-triangle is the classic PFD pump symbol; the triangle points in the flow direction.' },
  { q: 'In 8"-CS-1-PL-1010-A1, what does PL mean?', options: ['Piping layout', 'Pressure line', 'Process line', 'Polyethylene'], a: 2, explain: 'PL = process line. Other examples: SL (steam), CW (cooling water), CA (instrument air), FO (fuel oil).' },
  { q: 'The first letter of an ISA instrument tag (the T in TIC-103) denotes…', options: ['The alarm type', 'The loop number', 'The controller brand', 'The measured variable'], a: 3, explain: 'ISA-5.1: the first letter is the measured/initiating variable (F flow, T temperature, P pressure, L level, A analysis…).' },
  { q: 'A dashed line on a P&ID between instruments usually represents…', options: ['A drain', 'An electrical or signal connection', 'A steam trace line', 'A spare process line'], a: 1, explain: 'Dashed lines carry signals (electrical, pneumatic or hydraulic); solid lines carry process fluid.' },
  { q: 'Which component is the final control element of a flow loop?', options: ['The control valve', 'The orifice plate', 'The flow transmitter', 'The recorder'], a: 0, explain: 'The control valve (FV) is the final element — it physically changes the flow in response to the controller output.' },
  { q: 'A circle with two inward-pointing triangles is a…', options: ['Pump', 'Filter', 'Compressor', 'Heat exchanger'], a: 2, explain: 'The double-triangle circle is the compressor symbol; a single triangle denotes a pump.' },
  { q: 'CS in a line number stands for…', options: ['Carbon steel', 'Compressed steam', 'Chemical service', 'Control signal'], a: 0, explain: 'CS = carbon steel — the pipe material. SS = stainless steel, CU = copper, AL = aluminium.' },
  { q: 'Which of these belongs on a P&ID but NOT on a PFD?', options: ['Heat exchanger', 'Distillation column', 'Storage tank', 'Instrument bubble (e.g. TIC-103)'], a: 3, explain: 'PFDs show the process topology; P&IDs add the instrumentation, control loops and utility connections.' },
  { q: 'HH in PSHH-101 means…', options: ['Hand-held', 'High pressure header', 'High–high (alarm/action setpoint)', 'Hydraulic heater'], a: 2, explain: 'Modifier letters after the number: HH = high–high, LL = low–low — a separate alarm or trip setpoint above the normal high alarm.' },
];

// ─── Generic PFD train renderer (SVG) ───────────────────────────────────────
const FEED_ID = '__FEED__';
const PROD_ID = '__PROD__';

interface TrainItem { id: string; type: string; label: string; }
interface TrainStream { from: string; to: string; label: string; dashed?: boolean; arc?: 'top' | 'bottom'; }

function PfdTrain({ items, streams, selected, onSelect, height = 340 }: {
  items: TrainItem[]; streams: TrainStream[]; selected: string | null;
  onSelect: (id: string) => void; height?: number;
}) {
  const nodeW = 120, nodeH = 74, gap = 86;
  const W = Math.max(520, 80 + items.length * (nodeW + gap));
  const yNode = 178;
  const yBot = yNode + nodeH;
  const midY = yNode + nodeH / 2;
  const idxOf = (id: string) => items.findIndex(i => i.id === id);
  const leftX = (id: string) => 40 + idxOf(id) * (nodeW + gap);
  const rightX = (id: string) => leftX(id) + nodeW;
  const hasFeed = streams.some(s => s.from === FEED_ID);
  const hasProd = streams.some(s => s.to === PROD_ID);
  const feedX = 4, prodX = W + 8;
  const fromPt = (id: string) => id === FEED_ID ? { x: feedX, y: midY } : id === PROD_ID ? { x: prodX, y: midY } : { x: rightX(id), y: midY };
  const toPt = (id: string) => id === PROD_ID ? { x: prodX, y: midY } : { x: leftX(id), y: midY };
  return (
    <svg viewBox={`0 0 ${W + 20} ${height}`} className="w-full h-auto select-none">
      {hasFeed && <line x1={4} y1={midY} x2={items.length ? leftX(items[0].id) : 10} y2={midY} className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="2" />}
      {hasProd && <line x1={items.length ? rightX(items[items.length - 1].id) : W - 10} y1={midY} x2={prodX} y2={midY} className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="2" />}
      {/* dashed arcs (recycle top / bottoms bottom) */}
      {streams.filter(s => s.dashed).map((s, i) => {
        const fi = idxOf(s.from), ti = idxOf(s.to);
        if (fi < 0 || ti < 0) return null;
        const fx = rightX(s.from), tx = leftX(s.to);
        if (s.arc === 'bottom') {
          const lift = 60 + Math.abs(fi - ti) * 14;
          return (
            <g key={'rec' + i}>
              <path d={`M ${fx} ${yBot} C ${fx} ${yBot + lift}, ${tx} ${yBot + lift}, ${tx} ${yBot}`}
                className="stroke-indigo-500" fill="none" strokeWidth="2" strokeDasharray="6 4" />
              <polygon points={`${tx - 6},${yBot + 5} ${tx + 6},${yBot + 5} ${tx},${yBot}`} className="fill-indigo-500" />
              <text x={(fx + tx) / 2} y={yBot + lift + 16} textAnchor="middle" className="fill-indigo-500 text-[9px] font-bold">{s.label}</text>
            </g>
          );
        }
        const lift = 70 + Math.abs(fi - ti) * 16;
        return (
          <g key={'rec' + i}>
            <path d={`M ${fx} ${yNode} C ${fx} ${yNode - lift}, ${tx} ${yNode - lift}, ${tx} ${yNode}`}
              className="stroke-amber-500" fill="none" strokeWidth="2" strokeDasharray="6 4" />
            <polygon points={`${tx - 7},${yNode - 3} ${tx - 7},${yNode + 3} ${tx},${yNode}`} className="fill-amber-500" />
            <text x={(fx + tx) / 2} y={yNode - lift - 8} textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[9px] font-bold">{s.label}</text>
          </g>
        );
      })}
      {/* straight streams */}
      {streams.filter(s => !s.dashed).map((s, i) => {
        const p1 = fromPt(s.from), p2 = toPt(s.to);
        return (
          <g key={'st' + i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="2.2" />
            <polygon points={`${p2.x},${p2.y - 5} ${p2.x},${p2.y + 5} ${p2.x + 9},${p2.y}`} className="fill-slate-500 dark:fill-slate-400" />
            <text x={(p1.x + p2.x) / 2} y={p2.y - 10} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[9px] font-bold">{s.label}</text>
          </g>
        );
      })}
      {/* nodes */}
      {items.map(it => {
        const x = leftX(it.id);
        const sel = selected === it.id;
        return (
          <g key={it.id} onClick={() => onSelect(it.id)} className="cursor-pointer">
            <rect x={x} y={yNode} width={nodeW} height={nodeH} rx={12}
              className={sel
                ? 'fill-amber-100 dark:fill-amber-900/30 stroke-amber-500'
                : 'fill-white dark:fill-slate-900/70 stroke-slate-300 dark:stroke-slate-700 hover:stroke-amber-400'}
              strokeWidth={sel ? 2.4 : 1.6} />
            <g transform={`translate(${x + nodeW / 2 - 17} ${yNode + 9})`} className="text-accent-600 dark:text-accent-400">
              <PfdGlyph type={it.type} size={34} />
            </g>
            <text x={x + nodeW / 2} y={yNode + nodeH - 10} textAnchor="middle"
              className="fill-slate-700 dark:fill-slate-200 text-[9px] font-bold">{it.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
// ─── Example PFDs ───────────────────────────────────────────────────────────
interface PfdExample {
  id: string; name: string; tagline: string;
  items: (TrainItem & { purpose: string })[];
  streams: TrainStream[];
  note: string;
}

const PFD_EXAMPLES: PfdExample[] = [
  {
    id: 'ammonia',
    name: 'Ammonia Synthesis Loop',
    tagline: 'The textbook high-pressure recycle process.',
    items: [
      { id: 'cmpr', type: 'compressor', label: 'Compressor', purpose: 'Raises the synthesis gas to 150–300 bar, where the ammonia equilibrium is favourable.' },
      { id: 'hx', type: 'exchanger', label: 'Heat exchanger', purpose: 'Recovers heat from the reactor effluent to preheat the cold feed — the classic loop energy integration.' },
      { id: 'rx', type: 'reactor', label: 'NH₃ converter', purpose: 'Fixed-bed catalyst converts N₂ + 3H₂ ⇌ 2NH₃; single-pass conversion is only ~15–25%.' },
      { id: 'sep', type: 'separator', label: 'Product separator', purpose: 'Cools the effluent so NH₃ condenses; unreacted gas is recycled back to the loop.' },
    ],
    streams: [
      { from: FEED_ID, to: 'cmpr', label: 'N₂ + 3H₂' },
      { from: 'cmpr', to: 'hx', label: 'high pressure' },
      { from: 'hx', to: 'rx', label: 'hot feed' },
      { from: 'rx', to: 'sep', label: 'NH₃ + unreacted' },
      { from: 'sep', to: PROD_ID, label: 'NH₃ product' },
      { from: 'sep', to: 'hx', label: 'recycle H₂ + N₂', dashed: true },
    ],
    note: 'Because single-pass conversion is low, the process is a loop: fresh synthesis gas plus recycle enter the compressor, and the separator splits product from unconverted gas. The dashed amber arc is the recycle stream.',
  },
  {
    id: 'crude',
    name: 'Crude Oil Distillation',
    tagline: 'The front end of every refinery.',
    items: [
      { id: 'furnace', type: 'furnace', label: 'Fired heater', purpose: 'Vaporizes the crude to the column feed temperature (~350 °C) with a large fired duty.' },
      { id: 'column', type: 'column', label: 'Atmospheric column', purpose: 'Separates by boiling point over 30–50 trays at 1–2 bar; side draws take naphtha, kerosene and gas oil.' },
      { id: 'cond', type: 'exchanger', label: 'Overhead condenser', purpose: 'Condenses the overhead vapor against cooling water to produce reflux and distillate.' },
      { id: 'drum', type: 'separator', label: 'Reflux drum', purpose: 'Disengages the condensed overhead; part returns as reflux, the rest leaves as distillate.' },
      { id: 'res', type: 'tank', label: 'Residue drum', purpose: 'Collects the atmospheric residue (bottoms) for vacuum distillation or fuel blending.' },
    ],
    streams: [
      { from: FEED_ID, to: 'furnace', label: 'crude oil' },
      { from: 'furnace', to: 'column', label: 'partially vaporized' },
      { from: 'column', to: 'cond', label: 'overhead vapor' },
      { from: 'cond', to: 'drum', label: 'condensed' },
      { from: 'drum', to: PROD_ID, label: 'distillate' },
      { from: 'drum', to: 'column', label: 'reflux', dashed: true },
      { from: 'column', to: 'res', label: 'bottoms', dashed: true, arc: 'bottom' },
      { from: 'res', to: PROD_ID, label: 'residue' },
    ],
    note: 'The column needs a condenser (overhead) and a reboiler (bottoms) — neither appears on a simple block diagram. Reflux returns a portion of the condensed overhead to the top tray, and the indigo dashed arc is the bottoms line.',
  },
  {
    id: 'glycol',
    name: 'Ethylene Glycol Plant',
    tagline: 'Reactor + separation with a water recycle.',
    items: [
      { id: 'mix', type: 'mixer', label: 'Mixer', purpose: 'Blends ethylene oxide with water (and recycled water) to the reaction ratio.' },
      { id: 'rx', type: 'reactor', label: 'Glycol reactor', purpose: 'EO + H₂O → monoethylene glycol; an excess of water suppresses the di- and tri-glycol side reactions.' },
      { id: 'flash', type: 'separator', label: 'Flash', purpose: 'Removes most of the excess water as vapor for recycle.' },
      { id: 'col', type: 'column', label: 'Glycol column', purpose: 'Final purification: glycol is the bottom product, light ends leave overhead.' },
      { id: 'prod', type: 'tank', label: 'Product tank', purpose: 'Stores the purified monoethylene glycol before shipment.' },
    ],
    streams: [
      { from: FEED_ID, to: 'mix', label: 'EO + water' },
      { from: 'mix', to: 'rx', label: 'mixed feed' },
      { from: 'rx', to: 'flash', label: 'crude product' },
      { from: 'flash', to: 'col', label: 'crude glycol' },
      { from: 'col', to: 'prod', label: 'MEG product' },
      { from: 'prod', to: PROD_ID, label: 'shipping' },
      { from: 'flash', to: 'mix', label: 'recycle water', dashed: true },
    ],
    note: 'Excess water is deliberately fed to the reactor to control selectivity, then flashed off and recycled — a classic trade-off between reactor performance and separation cost.',
  },
];
// ─── TAB 1 · SYMBOL LIBRARY ────────────────────────────────────────────────
function SymbolsTab() {
  const [cat, setCat] = useState<'All' | 'PFD' | 'P&ID'>('All');
  const [q, setQ] = useState('');
  const list = SYMBOLS.filter(s => (cat === 'All' || s.cat === cat))
    .filter(s => !q || (s.name + ' ' + s.desc + ' ' + s.usage).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2">
          {(['All', 'PFD', 'P&ID'] as const).map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${cat === c
                ? 'bg-accent-500 text-surface-50 shadow-lg shadow-accent-500/25'
                : 'bg-surface-50 dark:bg-surface-900/60 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-800 hover:border-accent-400/60'}`}>
              {c === 'All' ? 'All symbols' : c}
            </button>
          ))}
        </div>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search symbols…"
          className="flex-grow px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-sm font-bold text-surface-900 dark:text-surface-50 outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all"
        />
        <TagPill>{String(list.length)} symbols</TagPill>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map(s => (
          <div key={s.id} className="rounded-3xl border border-surface-200 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-900/40 p-5 hover:border-accent-400/60 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center flex-shrink-0">
                <PfdGlyph type={s.glyph} size={38} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-surface-800 dark:text-surface-100 leading-tight">{s.name}</p>
                <TagPill color={s.cat === 'PFD' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'}>{s.cat}</TagPill>
              </div>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium leading-relaxed">{s.desc}</p>
            <p className="text-[11px] text-surface-400 dark:text-surface-500 font-semibold mt-2 border-t border-surface-100 dark:border-surface-800 pt-2">
              <Lightbulb className="w-3 h-3 inline -mt-0.5 mr-1 text-accent-500" />{s.usage}
            </p>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm font-bold text-surface-400 col-span-full">No symbols match your search.</p>}
      </div>
      <InfoNote>
        Symbols follow ISA-5.1 (instruments) and ISO 10628 / common company PFD conventions. The same equipment
        glyph appears on PFDs and P&IDs; the difference is the level of detail — P&IDs add every instrument,
        valve, utility connection and drain.
      </InfoNote>
    </div>
  );
}

// ─── TAB 2 · EXAMPLE PFDS ───────────────────────────────────────────────────
function ExamplesTab() {
  const [exId, setExId] = useState(PFD_EXAMPLES[0].id);
  const [sel, setSel] = useState<string | null>(PFD_EXAMPLES[0].items[0].id);
  const ex = PFD_EXAMPLES.find(e => e.id === exId) ?? PFD_EXAMPLES[0];
  const pickEx = (id: string) => { setExId(id); const e = PFD_EXAMPLES.find(x => x.id === id); setSel(e ? e.items[0].id : null); };
  const detail = ex.items.find(i => i.id === sel) ?? null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PFD_EXAMPLES.map(e => (
          <button key={e.id} onClick={() => pickEx(e.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${exId === e.id
              ? 'bg-accent-500 text-surface-50 shadow-lg shadow-accent-500/25'
              : 'bg-surface-50 dark:bg-surface-900/60 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-800 hover:border-accent-400/60'}`}>
            {e.name}
          </button>
        ))}
      </div>
      <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-5">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="text-sm font-black text-surface-800 dark:text-surface-100">{ex.name}</h3>
          <span className="text-[10px] font-bold text-surface-400">{ex.tagline}</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-accent-600 dark:text-accent-400 mb-3">Tap a unit to read its purpose</p>
        <div className="overflow-x-auto">
          <PfdTrain items={ex.items} streams={ex.streams} selected={sel} onSelect={setSel} height={360} />
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {detail && (
          <div className="rounded-3xl border border-accent-200 dark:border-accent-800/40 bg-accent-50/70 dark:bg-accent-900/15 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-surface-50 dark:bg-surface-900 text-accent-600 dark:text-accent-400 flex items-center justify-center">
                <PfdGlyph type={detail.type} size={30} />
              </div>
              <p className="text-sm font-black text-surface-800 dark:text-surface-100">{detail.label}</p>
            </div>
            <p className="text-xs text-surface-600 dark:text-surface-300 font-medium leading-relaxed">{detail.purpose}</p>
          </div>
        )}
        <div className="glass rounded-3xl border border-surface-200 dark:border-surface-800 p-5">
          <h3 className="text-sm font-black text-surface-800 dark:text-surface-100 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent-500" /> Reading this PFD
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 font-medium leading-relaxed">{ex.note}</p>
          <div className="flex flex-wrap gap-3 mt-4 text-[10px] font-black">
            <span className="flex items-center gap-1.5 text-surface-500"><span className="w-5 h-0.5 bg-surface-500 inline-block" /> process stream</span>
            <span className="flex items-center gap-1.5 text-accent-600"><span className="w-5 border-t-2 border-dashed border-accent-500 inline-block" /> recycle</span>
            <span className="flex items-center gap-1.5 text-primary-500"><span className="w-5 border-t-2 border-dashed border-primary-500 inline-block" /> bottoms / utility</span>
          </div>
        </div>
      </div>
      <InfoNote>
        A PFD shows the major equipment, the main process streams and the control-relevant temperatures and
        pressures — but deliberately omits minor valves, instruments, drains and utility lines. Those appear only
        on the P&ID.
      </InfoNote>
    </div>
  );
}
// ─── TAB 3 · P&ID LOOPS & TAG DECODER ──────────────────────────────────────
function LoopsTab() {
  const [tag, setTag] = useState('TIC-103');
  const [loopId, setLoopId] = useState(LOOPS[0].id);
  const dec = decodeTag(tag);
  const loop = LOOPS.find(l => l.id === loopId) ?? LOOPS[0];
  const sentence = dec.ok
    ? dec.parts.map(p => p.name.toLowerCase()).join(' ') + ' — loop ' + dec.loop + '.'
    : '';
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="ISA-5.1 tag decoder" icon={Gauge}>
        <InputRow label="Instrument tag" unit="ISA" value={tag} onChange={setTag} />
        <div className="flex flex-wrap gap-2 mb-5">
          {TAG_EXAMPLES.map(t => (
            <button key={t} onClick={() => setTag(t)}
              className="px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[10px] font-black text-surface-600 dark:text-surface-300 hover:bg-accent-500/20 hover:text-accent-600 transition-colors">
              {t}
            </button>
          ))}
        </div>
        {dec.ok ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {dec.parts.map((p, i) => (
                <span key={i}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${p.kind === 'variable'
                    ? 'border-accent-400/60 bg-accent-500/10 text-accent-700 dark:text-accent-300'
                    : p.kind === 'function'
                      ? 'border-primary-400/60 bg-primary-500/10 text-primary-700 dark:text-primary-300'
                      : 'border-violet-400/60 bg-violet-500/10 text-violet-700 dark:text-violet-300'}`}>
                  {p.code} · {p.name}
                </span>
              ))}
            </div>
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-900/40 p-4">
              <p className="text-sm font-black text-surface-800 dark:text-surface-100">{dec.tag}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400 font-semibold mt-1 leading-relaxed">{sentence}</p>
            </div>
          </>
        ) : (
          <WarnNote>{dec.msg}</WarnNote>
        )}
        <InfoNote>
          First letter = measured variable (F flow, T temperature, P pressure, L level, A analysis). Following
          letters = functions (T transmitter, I indicator, C controller, A alarm, R recorder, S switch, V valve).
          The number identifies the loop; trailing H / L / HH / LL set alarm or trip levels.
        </InfoNote>
      </CalcCard>

      <div className="space-y-6">
        <CalcCard title="Control-loop anatomy" icon={Gauge}>
          <div className="flex flex-wrap gap-2 mb-4">
            {LOOPS.map(l => (
              <button key={l.id} onClick={() => setLoopId(l.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${loopId === l.id
                  ? 'bg-accent-500 text-surface-50'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-accent-500/20'}`}>
                {l.name}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <LoopDiagram loop={loop} />
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 font-medium leading-relaxed mt-3">{loop.desc}</p>
        </CalcCard>
        <InfoNote>
          Every control loop has four parts: a sensor (primary element), a transmitter (or direct indicator),
          a controller that compares measurement to setpoint, and a final control element (usually a control
          valve). Signal lines are dashed: electrical (4–20 mA), pneumatic (3–15 psi) or digital (HART /
          fieldbus).
        </InfoNote>
      </div>
    </div>
  );
}
// ─── TAB 4 · INTERACTIVE PFD BUILDER ───────────────────────────────────────
/* const BUILDER_TYPES = [
  { type: 'pump', label: 'Pump' }, { type: 'compressor', label: 'Compressor' },
  { type: 'exchanger', label: 'Heat exchanger' }, { type: 'reactor', label: 'Reactor' },
  { type: 'separator', label: 'Separator' }, { type: 'column', label: 'Column' },
  { type: 'tank', label: 'Tank' }, { type: 'mixer', label: 'Mixer' },
];

const BUILDER_PRESETS = [
  { name: 'Reaction train', types: ['mixer', 'reactor', 'separator', 'tank'] },
  { name: 'Distillation train', types: ['pump', 'exchanger', 'column', 'tank'] },
  { name: 'Gas loop', types: ['compressor', 'exchanger', 'reactor', 'separator'] },
];

const PAIR_NOTES: Record<string, string> = {
  'pump|exchanger': 'The pump provides the head to push the liquid through the exchanger; the exchanger then transfers heat (heating or cooling) before the next unit.',
  'exchanger|reactor': 'The exchanger pre-heats the feed to reaction temperature so the reactor can operate at its design kinetics.',
  'reactor|separator': 'Reactor effluent enters the separator, where product and unconverted material (or vapor and liquid) are disengaged.',
  'separator|tank': 'The separated product is routed to storage or to the next separation stage.',
  'mixer|reactor': 'The mixer blends reactants (and any recycle) into a uniform feed before conversion.',
  'reactor|tank': 'Product from the reactor is collected in the tank for downstream processing or storage.',
  'pump|column': 'The pump feeds liquid to the column at the required pressure and reflux conditions.',
  'exchanger|column': 'The exchanger sets the column feed temperature, controlling the vapor/liquid split at the feed tray.',
  'column|tank': 'Column bottoms or distillate product is routed to the tank.',
  'compressor|reactor': 'The compressor raises gas pressure into the reactor — equilibrium-limited reactions need high pressure.',
};

*/
function BuilderTab() { return <div className="w-full h-full min-h-[600px]"><PfdFlowchartEditor /></div>; }

  function LinesQuizTab() {
  const [line, setLine] = useState('8"-CS-1-PL-1010-A1');
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const ld = decodeLine(line);
  const q = QUIZ[qi];
  const next = () => {
    setQi(prev => (prev + 1) % QUIZ.length);
    setPicked(null);
  };
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <CalcCard title="Line number decoder" icon={GraduationCap}>
        <InputRow label="Line number" unit="ISO/company spec" value={line} onChange={setLine} />
        <div className="flex flex-wrap gap-2 mb-5">
          {LINE_EXAMPLES.map(l => (
            <button key={l} onClick={() => setLine(l)}
              className="px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[10px] font-black text-surface-600 dark:text-surface-300 hover:bg-accent-100 dark:hover:bg-accent-900/40 hover:text-accent-600 transition-all">
              {l}
            </button>
          ))}
        </div>
        {ld.ok ? (
          <div className="space-y-2">
            {ld.parts.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-surface-200 dark:border-surface-800 p-2.5">
                <span className="text-[11px] font-black text-accent-600 bg-accent-500/10 rounded-lg px-2 py-1 w-16 text-center">{p.code}</span>
                <div>
                  <p className="text-xs font-bold text-surface-700 dark:text-surface-200">{p.name}</p>
                  <p className="text-[10px] text-surface-400">{p.hint}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-600 dark:text-rose-300">
            {ld.msg}
          </div>
        )}
        <InfoNote>Format: diameter - material - unit - line type - sequence - class, e.g. 8&quot;-CS-1-PL-1010-A1. The line class ties the pipe to a spec sheet (wall thickness, flanges, rating).</InfoNote>
      </CalcCard>

      <CalcCard title={`Symbol quiz · ${qi + 1}/${QUIZ.length}`} icon={CheckCircle2}>
        <p className="text-sm font-bold text-surface-800 dark:text-surface-100 mb-4">{q.q}</p>
        <div className="space-y-2 mb-4">
          {q.options.map((o, i) => {
            const state = picked === null ? 'idle'
              : i === q.a ? 'correct' : i === picked ? 'wrong' : 'muted';
            return (
              <button key={i} disabled={picked !== null} onClick={() => setPicked(i)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${state === 'idle'
                  ? 'border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-300 hover:border-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20'
                  : state === 'correct'
                    ? 'border-accent-400 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300'
                    : state === 'wrong'
                      ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300'
                      : 'border-surface-100 dark:border-surface-800/50 text-surface-400 dark:text-surface-600'}`}>
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className={`rounded-xl p-3.5 text-xs border ${picked === q.a
            ? 'border-accent-200 dark:border-accent-900 bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300'
            : 'border-accent-200 dark:border-accent-900 bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300'}`}>
            <p className="font-black mb-1">{picked === q.a ? '✓ Correct' : '✗ Not quite'}</p>
            <p>{q.explain}</p>
          </div>
        )}
        {picked !== null && (
          <button onClick={next}
            className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-surface-50 text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-accent-500/25 flex items-center justify-center gap-2">
            <ArrowRight className="w-3.5 h-3.5" /> Next question
          </button>
        )}
      </CalcCard>
    </div>
  );
}
// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'symbols', label: 'Symbols', icon: BookOpen },
  { id: 'examples', label: 'Example PFDs', icon: Workflow },
  { id: 'loops', label: 'P&ID Loops', icon: Gauge },
  { id: 'builder', label: 'PFD Builder', icon: MousePointer2 },
  { id: 'quiz', label: 'Lines & Quiz', icon: GraduationCap },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function PfdPidModule() {
  const [tab, setTab] = useState<TabId>('symbols');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 text-surface-50 flex items-center justify-center shadow-lg shadow-accent-500/25">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-surface-900 dark:text-surface-50">PFD & P&ID Learning</h1>
            <p className="text-sm font-semibold text-surface-500 dark:text-surface-400 mt-0.5">
              Process flow diagrams · instrument symbols & tags · control loops · line identification
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
      {tab === 'symbols' && <SymbolsTab />}
      {tab === 'examples' && <ExamplesTab />}
      {tab === 'loops' && <LoopsTab />}
      {tab === 'builder' && <BuilderTab />}
      {tab === 'quiz' && <LinesQuizTab />}
    </div>
  );
}
