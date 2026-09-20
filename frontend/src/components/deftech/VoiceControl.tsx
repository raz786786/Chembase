import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { playSound } from '../../lib/sound';

interface Props {
  onCommand: (intent: string) => void;
}

type SpeechRecognitionLike = {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const INTENTS: { re: RegExp; intent: string; say: string }[] = [
  { re: /\b(show|all)\b.*\b(threat|map)\b|\bmap\b/i, intent: 'focus-map', say: 'Focusing threat map' },
  { re: /\b(inventory|precursor|registry)\b/i, intent: 'focus-registry', say: 'Opening precursor registry' },
  { re: /\b(fleet|drone|drones|devices)\b/i, intent: 'focus-fleet', say: 'Showing fleet status' },
  { re: /\b(audit|ledger|log)\b/i, intent: 'focus-audit', say: 'Opening audit ledger' },
  { re: /\b(leak|simulate|drill)\b/i, intent: 'simulate-leak', say: 'Simulating leak drill' },
  { re: /\b(restore|reset|stand down)\b/i, intent: 'restore', say: 'Restoring nominal state' },
];

/** Voice control via Web Speech API (Chrome/Edge). Degrades gracefully elsewhere. */
export default function VoiceControl({ onCommand }: Props) {
  const [supported] = useState(() => typeof window !== 'undefined' && !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!supported) return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec: SpeechRecognitionLike = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const match = INTENTS.find((i) => i.re.test(text));
      if (match) { playSound('ping'); onCommand(match.intent); }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.stop(); } catch { /* ignore */ } };
  }, [supported, onCommand]);

  const toggle = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) { rec.stop(); setListening(false); }
    else { try { rec.start(); setListening(true); } catch { /* already started */ } }
  };

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {transcript && (
        <span className="max-w-[220px] truncate rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-2.5 py-1 font-mono text-[10px] text-emerald-400">
          “{transcript}”
        </span>
      )}
      <button
        onClick={toggle}
        title={listening ? 'Stop voice control' : 'Voice control: try "show map", "open fleet", "simulate leak"'}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
          listening
            ? 'border-red-700 bg-red-950/40 text-red-400 animate-pulse'
            : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
        }`}
      >
        {listening ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
        {listening ? 'Listening' : 'Voice'}
      </button>
    </div>
  );
}
