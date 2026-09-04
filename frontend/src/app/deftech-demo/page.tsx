'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import DualUseToggle from '../../components/deftech/DualUseToggle';
import PrecursorRegistry from '../../components/deftech/PrecursorRegistry';
import StanagMatrix from '../../components/deftech/StanagMatrix';
import BunkerTelemetry from '../../components/deftech/BunkerTelemetry';
import AuditLedger from '../../components/deftech/AuditLedger';

export default function DeftechDemoPage() {
  const [mode, setMode] = useState<'academic' | 'tactical'>('tactical');

  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">DEFTECH Incubation</h1>
            <p className="text-sm text-slate-400 mt-2 font-medium">Dual-Use Infrastructure Management Demo</p>
          </div>
          <DualUseToggle mode={mode} setMode={setMode} />
        </div>

        {/* Content Area */}
        {mode === 'academic' ? (
          <div className="w-full flex items-center justify-center p-20 bg-slate-900 border border-slate-800 rounded-3xl mt-12">
            <div className="flex flex-col items-center justify-center text-center max-w-md">
              <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-700">
                <Lock className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-200 mb-3">Military Clearance Required</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Military Clearance Required for Tactical Infrastructure. Please switch to Tactical mode to view this restricted demo.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              <PrecursorRegistry />
              <StanagMatrix />
            </div>
            <div className="flex flex-col gap-6">
              <BunkerTelemetry />
              <AuditLedger />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
