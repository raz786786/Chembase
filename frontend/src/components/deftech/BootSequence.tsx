import { useEffect, useState } from 'react';

const LINES = [
  'INITIALIZING SENSOR MESH .................. OK',
  'EDGE AI MODELS LOADED (v2.4.1) ............ OK',
  'MQTT UPLINK HANDSHAKE ..................... OK',
  'GEO-FENCE CALIBRATION .................... OK',
  'CHEMBASE KNOWLEDGE GRAPH SYNC ............ OK',
  'ALL SYSTEMS NOMINAL — WELCOME, OPERATOR',
];

/** 2-second tactical boot overlay — pure theater, exits itself */
export default function BootSequence({ onDone }: { onDone?: () => void }) {
  const [visible, setVisible] = useState(true);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= LINES.length) {
      const t = setTimeout(() => { setVisible(false); onDone?.(); }, 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 250 : 280);
    return () => clearTimeout(t);
  }, [shown, onDone]);

  useEffect(() => {
    const skip = () => setVisible(false);
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950" onClick={() => setVisible(false)}>
      {/* scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(16,185,129,0.06) 0 2px, transparent 2px 4px)' }}
      />
      <div className="w-full max-w-lg px-6 font-mono">
        <div className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">CHEMBASE C2 · SECURE TERMINAL</div>
        {LINES.slice(0, shown).map((l, i) => (
          <div key={i} className={`py-0.5 text-xs ${i === LINES.length - 1 ? 'font-black text-emerald-400' : 'text-slate-400'}`}>
            <span className="text-emerald-600">›</span> {l}
          </div>
        ))}
        <div className="mt-6 h-1 w-full overflow-hidden rounded bg-slate-800">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(shown / LINES.length) * 100}%` }} />
        </div>
        <div className="mt-2 text-right text-[9px] uppercase tracking-widest text-slate-600">click or press any key to skip</div>
      </div>
    </div>
  );
}
