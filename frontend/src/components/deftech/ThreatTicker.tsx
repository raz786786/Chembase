import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export interface ThreatAlert {
  id: string;
  device_id: string;
  threat: string;
  confidence: number;
  timestamp: string;
}

interface Props {
  alerts: ThreatAlert[];
  onDismiss?: (id: string) => void;
}

/** Live alert feed — new threats slide in from the top with spring physics */
export default function ThreatTicker({ alerts, onDismiss }: Props) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-red-400">Threat Feed</span>
        <span className="font-mono text-[10px] font-bold text-slate-500">{alerts.length} active</span>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto p-3">
        <AnimatePresence initial={false}>
          {alerts.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 text-center font-mono text-[11px] text-slate-500"
            >
              NO ACTIVE THREATS — SENSOR MESH NOMINAL
            </motion.div>
          )}
          {alerts.map((a) => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                a.confidence >= 90 ? 'border-red-800 bg-red-950/40' : 'border-amber-800 bg-amber-950/30'
              }`}
            >
              <AlertTriangle className={`h-4 w-4 shrink-0 ${a.confidence >= 90 ? 'text-red-400' : 'text-amber-400'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate font-mono text-sm font-black text-slate-100">{a.threat}</span>
                  <span className={`font-mono text-[10px] font-bold ${a.confidence >= 90 ? 'text-red-400' : 'text-amber-400'}`}>
                    {a.confidence}%
                  </span>
                </div>
                <div className="truncate font-mono text-[10px] text-slate-500">
                  {a.device_id} · {new Date(a.timestamp).toLocaleTimeString()}
                </div>
              </div>
              {onDismiss && (
                <button onClick={() => onDismiss(a.id)} className="text-slate-500 transition-colors hover:text-slate-200">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
