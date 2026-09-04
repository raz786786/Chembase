'use client';

import React, { useState, useEffect } from 'react';
import { Radiation, Activity } from 'lucide-react';
import { TelemetryFeed } from '../../types/deftech';

export default function BunkerTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryFeed>({
    bunkerId: 'BUNKER-ALPHA-09',
    tempC: 22.0,
    humidity: 45.0,
    vocPpm: 12.5,
    status: 'NOMINAL'
  });
  
  const [isLeakForced, setIsLeakForced] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        if (isLeakForced) {
          return {
            ...prev,
            vocPpm: 800,
            status: 'CRITICAL'
          };
        }
        
        return {
          ...prev,
          tempC: Number((22.0 + (Math.random() * 0.8 - 0.4)).toFixed(1)),
          humidity: Number((45.0 + (Math.random() * 2.0 - 1.0)).toFixed(1)),
          vocPpm: Number((12.5 + (Math.random() * 1.5 - 0.75)).toFixed(1)),
          status: 'NOMINAL'
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isLeakForced]);

  const isCritical = telemetry.status === 'CRITICAL';

  return (
    <div className={`bg-slate-900 rounded-2xl p-6 shadow-xl transition-all duration-300 ${isCritical ? 'border-2 border-red-500 shadow-red-900/20' : 'border border-zinc-800'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          {isCritical ? (
            <Radiation className="w-5 h-5 text-red-500 animate-pulse" />
          ) : (
            <Activity className="w-5 h-5 text-emerald-500" />
          )}
          Live Sensor Telemetry
        </h3>
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
          {telemetry.bunkerId}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-950 rounded-xl p-4 border border-zinc-800 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Temp</span>
          <span className="text-xl font-mono text-slate-200">{telemetry.tempC.toFixed(1)}°C</span>
        </div>
        <div className="bg-slate-950 rounded-xl p-4 border border-zinc-800 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Humidity</span>
          <span className="text-xl font-mono text-slate-200">{telemetry.humidity.toFixed(1)}%</span>
        </div>
        <div className={`rounded-xl p-4 border flex flex-col items-center justify-center transition-colors duration-300 ${isCritical ? 'bg-red-950 border-red-800' : 'bg-slate-950 border-zinc-800'}`}>
          <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isCritical ? 'text-red-400' : 'text-slate-500'}`}>VOCs</span>
          <span className={`text-xl font-mono ${isCritical ? 'text-red-400 animate-pulse font-bold' : 'text-slate-200'}`}>{telemetry.vocPpm.toFixed(1)} ppm</span>
        </div>
      </div>

      <button
        onClick={() => setIsLeakForced(prev => !prev)}
        className={`w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
          isLeakForced 
            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
            : 'bg-red-900/50 text-red-400 border border-red-900/50 hover:bg-red-900/80'
        }`}
      >
        {isLeakForced ? 'Restore Sensors' : 'Simulate VOC Leak'}
      </button>
    </div>
  );
}
