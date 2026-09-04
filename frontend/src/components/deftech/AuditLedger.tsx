'use client';

import type { AuditLog } from '../../types/deftech';
import { ShieldCheck } from 'lucide-react';

const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'tx-9921', timestamp: '2026-09-04T14:32:00Z', action: '500kg HTPB Dispensed to Silo A', operatorTier: 'L3-Clearance', hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4' },
  { id: 'tx-9920', timestamp: '2026-09-04T11:15:22Z', action: 'Nitromethane quota updated by Admin', operatorTier: 'L4-Command', hash: 'c9f0f895fb98ab9159f51fd0297e236d52924d140e53a5c1b50035cb67683416' },
  { id: 'tx-9919', timestamp: '2026-09-03T18:45:10Z', action: '200kg Aluminum Powder received', operatorTier: 'L2-Logistics', hash: '4a44dc15364204a80fe80e9039455cc1608281820af2b25114ddfb2be9da0781' },
  { id: 'tx-9918', timestamp: '2026-09-03T09:05:00Z', action: 'Bunker VOC Sensors Recalibrated', operatorTier: 'L3-Clearance', hash: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d' },
  { id: 'tx-9917', timestamp: '2026-09-02T16:20:45Z', action: 'Weekly STANAG Compliance Audit Passed', operatorTier: 'L4-Command', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
];

export default function AuditLedger() {
  return (
    <div className="bg-slate-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
      <h3 className="text-lg font-bold text-slate-200 mb-6">Cryptographic Audit Ledger</h3>
      <div className="space-y-4">
        {MOCK_AUDIT_LOGS.map(log => (
          <div key={log.id} className="p-4 bg-slate-950 rounded-xl border border-zinc-800 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-200">{log.action}</span>
                <span className="text-xs text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()} &bull; {log.operatorTier}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-950/40 border border-emerald-900/50 rounded text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                [SHA-256 VERIFIED]
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-600 bg-black/40 px-3 py-2 rounded-lg break-all">
              {log.hash}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
