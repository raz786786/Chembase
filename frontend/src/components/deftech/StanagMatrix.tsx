'use client';

import React, { useState, useMemo } from 'react';
import { MOCK_DEFENSE_DB } from '../../lib/deftech/mockDatabase';
import { evaluateStorageSafety, calculateBlastStandoff } from '../../lib/deftech/hazardEngines';

export default function StanagMatrix() {
  const [c1Id, setC1Id] = useState<string>(MOCK_DEFENSE_DB[0].id);
  const [c2Id, setC2Id] = useState<string>(MOCK_DEFENSE_DB[1].id);
  const [massKg, setMassKg] = useState<number>(500);

  const c1 = MOCK_DEFENSE_DB.find(c => c.id === c1Id) || MOCK_DEFENSE_DB[0];
  const c2 = MOCK_DEFENSE_DB.find(c => c.id === c2Id) || MOCK_DEFENSE_DB[1];

  const evaluation = useMemo(() => evaluateStorageSafety(c1, c2), [c1, c2]);
  const standoff = useMemo(() => calculateBlastStandoff(massKg), [massKg]);

  return (
    <div className="bg-slate-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <h3 className="text-lg font-bold text-slate-200">STANAG 4145 Co-location Matrix</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compound A</label>
          <select 
            value={c1Id} 
            onChange={(e) => setC1Id(e.target.value)}
            className="bg-slate-950 border border-zinc-700 text-slate-200 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {MOCK_DEFENSE_DB.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compound B</label>
          <select 
            value={c2Id} 
            onChange={(e) => setC2Id(e.target.value)}
            className="bg-slate-950 border border-zinc-700 text-slate-200 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {MOCK_DEFENSE_DB.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${evaluation.status === 'FORBIDDEN' ? 'bg-red-950/40 border-red-900/50 text-red-400' : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'}`}>
        <div className="text-xs font-black uppercase tracking-widest mb-1">{evaluation.status}</div>
        <div className="text-sm font-medium">{evaluation.message}</div>
      </div>

      <div className="flex flex-col gap-4 pt-4 border-t border-zinc-800">
        <h4 className="text-sm font-bold text-slate-300">Blast Standoff Calculator</h4>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Combined Mass: {massKg.toLocaleString()} kg</span>
            <span className="text-amber-400 font-bold">Standoff Radius: {standoff} m</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="10000" 
            step="100" 
            value={massKg} 
            onChange={(e) => setMassKg(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
