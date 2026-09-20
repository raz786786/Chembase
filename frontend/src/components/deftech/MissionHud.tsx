import { useEffect, useState } from 'react';
import { Radio, Volume2, VolumeX, Presentation, Clock } from 'lucide-react';
import { isSoundMuted, toggleSoundMuted, playSound } from '../../lib/sound';

interface Props {
  linkOk?: boolean;
  /** Enable kiosk/demo auto-cycle (10s per view) */
  onKioskToggle?: () => void;
  kioskActive?: boolean;
}

/** Persistent HUD strip: UTC mission clock + link heartbeat + sound/kiosk controls */
export default function MissionHud({ linkOk = true, onKioskToggle, kioskActive }: Props) {
  const [utc, setUtc] = useState(() => new Date());
  const [muted, setMuted] = useState(isSoundMuted());
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setUtc(new Date());
      setBeat((b) => (b + 1) % 2);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2 font-mono backdrop-blur">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-200">{utc.toISOString().slice(11, 19)}Z</span>
          <span className="text-slate-500">{utc.toISOString().slice(0, 10)}</span>
        </span>
        <span className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest ${linkOk ? 'text-emerald-400' : 'text-red-400'}`}>
          <Radio className={`h-3.5 w-3.5 ${linkOk ? (beat ? 'opacity-100' : 'opacity-30') : 'animate-pulse'}`} />
          LINK: {linkOk ? 'SECURE' : 'LOST'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setMuted(toggleSoundMuted())}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
          title="Toggle alert sounds"
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
          {muted ? 'Sound Off' : 'Sound On'}
        </button>
        {onKioskToggle && (
          <button
            onClick={() => { playSound('click'); onKioskToggle(); }}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              kioskActive
                ? 'border-amber-600 bg-amber-950/40 text-amber-400'
                : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
            title="Cycle views automatically every 10s (demo mode)"
          >
            <Presentation className="h-3.5 w-3.5" />
            Kiosk
          </button>
        )}
      </div>
    </div>
  );
}
