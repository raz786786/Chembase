'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DualUseToggle from '../../components/deftech/DualUseToggle';
import PrecursorRegistry from '../../components/deftech/PrecursorRegistry';
import StanagMatrix from '../../components/deftech/StanagMatrix';
import BunkerTelemetry from '../../components/deftech/BunkerTelemetry';
import AuditLedger from '../../components/deftech/AuditLedger';
import BootSequence from '../../components/deftech/BootSequence';
import MissionHud from '../../components/deftech/MissionHud';
import VoiceControl from '../../components/deftech/VoiceControl';
import ThreatMap, { type ThreatMarker } from '../../components/ThreatMap';
import ThreatTicker from '../../components/deftech/ThreatTicker';
import HazardPlume from '../../components/deftech/HazardPlume';
import { playSound } from '../../lib/sound';
import { useRealtimeTelemetry } from '../../hooks/useRealtimeTelemetry';
import { useUserRole, canAccessTactical } from '../../hooks/useUserRole';
import {
  lookupEvacuationRadiusM,
  ensureChemicalProfiles,
} from '../../lib/deftech/hazardEngines';

type ViewId = 'map' | 'fleet' | 'audit';

const MOCK_MARKERS: ThreatMarker[] = [
  { id: 't1', device_id: 'Drone_01', threat: 'Ammonia', confidence: 92, lat: 33.68, lng: 73.04, timestamp: new Date().toISOString(), hazardRadiusM: 500 },
  { id: 't2', device_id: 'Drone_04', threat: 'Chlorine', confidence: 87, lat: 33.72, lng: 73.09, timestamp: new Date(Date.now() - 9 * 60000).toISOString(), hazardRadiusM: 800 },
  { id: 't3', device_id: 'Drone_02', threat: 'VOC Complex', confidence: 74, lat: 33.63, lng: 72.98, timestamp: new Date(Date.now() - 23 * 60000).toISOString(), hazardRadiusM: 300 },
];

const INTENT_TO_VIEW: Record<string, ViewId> = {
  'focus-map': 'map',
  'focus-fleet': 'fleet',
  'focus-audit': 'audit',
};

export default function DeftechDemoPage() {
  const [mode, setMode] = useState<'academic' | 'tactical'>('tactical');
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState<ViewId>('map');
  const [drillAlerts, setDrillAlerts] = useState<ThreatMarker[]>([]);
  const [activeThreat, setActiveThreat] = useState<ThreatMarker>(MOCK_MARKERS[0]);
  const [drill, setDrill] = useState(false);
  const [kiosk, setKiosk] = useState(false);
  const alertSeq = useRef(4);

  // ── Phase 4 wiring ─────────────────────────────────────────────
  // Realtime telemetry: Supabase INSERTs when configured, sim fallback otherwise.
  const live = useRealtimeTelemetry(12);
  const hasLive = live.markers.length > 0;

  // Role gate: Supabase Auth when configured; demo fallback keeps the toggle.
  const { role } = useUserRole();
  const gated = canAccessTactical(role);

  // Chemical profiles → evacuation widget (API-backed with bundled fallback)
  useEffect(() => {
    ensureChemicalProfiles();
  }, []);

  const displayAlerts = hasLive
    ? live.markers
    : [...drillAlerts, ...MOCK_MARKERS].slice(0, 12);

  // Evacuation radius: chemical_profiles lookup → marker's own radius → 500m default
  const evacuationRadiusM = useMemo(() => {
    const fromProfile = lookupEvacuationRadiusM(activeThreat.threat);
    return fromProfile ?? activeThreat.hazardRadiusM ?? 500;
  }, [activeThreat]);

  // Kiosk auto-cycle: map → fleet → audit every 10s
  useEffect(() => {
    if (!kiosk || mode !== 'tactical') return;
    const order: ViewId[] = ['map', 'fleet', 'audit'];
    const id = setInterval(() => {
      setView((v) => order[(order.indexOf(v) + 1) % order.length]);
    }, 10000);
    return () => clearInterval(id);
  }, [kiosk, mode]);

  // Drill mode: escalating alerts with sound
  useEffect(() => {
    if (!drill || mode !== 'tactical') return;
    const sounds = ['ping', 'warning', 'critical'] as const;
    let i = 0;
    const id = setInterval(() => {
      playSound(sounds[Math.min(i, 2)]);
      i++;
      const devices = ['Drone_03', 'Drone_05', 'Drone_06'];
      const threats = ['Hydrogen Sulfide', 'Sulfur Dioxide', 'Benzene Vapor'];
      const device = devices[alertSeq.current % devices.length];
      const threat = threats[alertSeq.current % threats.length];
      const m: ThreatMarker = {
        id: `drill-${alertSeq.current++}`,
        device_id: device,
        threat,
        confidence: 88 + (alertSeq.current % 10),
        lat: 33.62 + Math.random() * 0.12,
        lng: 72.95 + Math.random() * 0.16,
        timestamp: new Date().toISOString(),
        hazardRadiusM: 250 + Math.floor(Math.random() * 900),
      };
      setDrillAlerts((prev) => [m, ...prev].slice(0, 12));
      setActiveThreat(m);
    }, 6000);
    return () => clearInterval(id);
  }, [drill, mode]);

  const dismissAlert = (id: string) => {
    setDrillAlerts((prev) => prev.filter((a) => a.id !== id));
    playSound('click');
  };

  const handleCommand = useCallback((intent: string) => {
    if (INTENT_TO_VIEW[intent]) setView(INTENT_TO_VIEW[intent]);
    if (intent === 'simulate-leak') setDrill(true);
    if (intent === 'restore') { setDrill(false); setDrillAlerts([]); }
  }, []);

  const tacticalSectors = useMemo(() => [
    { id: 'map', label: 'THREAT GRID' },
    { id: 'fleet', label: 'FLEET & SENSORS' },
    { id: 'audit', label: 'AUDIT & COMMS' },
  ], []);

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-sans sm:p-8">
      {mode === 'tactical' && !booted && <BootSequence onDone={() => setBooted(true)} />}

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-100">DEFTECH Incubation</h1>
              <span
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest ${
                  gated
                    ? 'border-emerald-800 bg-emerald-950/50 text-emerald-400'
                    : 'border-slate-700 bg-slate-900 text-slate-500'
                }`}
              >
                {gated ? 'operator · defense' : 'demo · auth off'}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-400">Dual-Use Infrastructure Management Demo</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <VoiceControl onCommand={handleCommand} />
            <DualUseToggle mode={mode} setMode={(m) => { setMode(m); playSound('click'); }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'academic' ? (
            <motion.div
              key="academic"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="mt-12 flex w-full items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 p-20"
            >
              <div className="flex max-w-md flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 shadow-inner">
                  <Lock className="h-10 w-10 text-slate-400" />
                </div>
                <h2 className="mb-3 text-xl font-bold text-slate-200">Military Clearance Required</h2>
                <p className="text-sm leading-relaxed text-slate-400">
                  Military Clearance Required for Tactical Infrastructure. Please switch to Tactical mode to view this restricted demo.
                </p>
                <div className="mt-6 font-mono text-[10px] uppercase tracking-widest text-slate-600">
                  clearance level insufficient · access denied
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tactical"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col gap-6"
            >
              {/* Mission HUD */}
              <MissionHud linkOk={!drill} kioskActive={kiosk} onKioskToggle={() => setKiosk((k) => !k)} />

              {/* View tabs */}
              <div className="flex gap-2">
                {tacticalSectors.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setView(s.id as ViewId); playSound('click'); }}
                    className={`rounded-lg border px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest transition-all ${
                      view === s.id
                        ? 'border-red-800 bg-red-950/50 text-red-400'
                        : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* VIEW: MAP */}
              {view === 'map' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="flex flex-col gap-6 lg:col-span-2">
                    <ThreatMap markers={displayAlerts} height={420} />
                    <HazardPlume threat={activeThreat.threat} radiusM={activeThreat.hazardRadiusM ?? 500} confidence={activeThreat.confidence} />
                  </div>
                  <div className="flex flex-col gap-6">
                    <ThreatTicker alerts={displayAlerts} onDismiss={dismissAlert} />
                    {/* Evacuation widget */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                      <div className="mb-3 font-mono text-[10px] font-black uppercase tracking-widest text-slate-500">Evacuation Radius</div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-4xl font-black text-red-400">{evacuationRadiusM}</span>
                        <span className="font-mono text-sm font-bold text-slate-400">m</span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500">
                        {activeThreat.threat} · conf {activeThreat.confidence}% · {activeThreat.device_id}
                      </div>
                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500"
                          animate={{ width: `${Math.min(100, activeThreat.confidence)}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        />
                      </div>
                    </div>
                    {/* Drill control */}
                    <button
                      onClick={() => { setDrill((d) => !d); playSound(drill ? 'click' : 'warning'); }}
                      className={`w-full rounded-xl py-3 font-mono text-sm font-black uppercase tracking-widest transition-all ${
                        drill
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'border border-red-900/50 bg-red-900/50 text-red-400 hover:bg-red-900/80'
                      }`}
                    >
                      {drill ? 'Stand Down — Restore Sensors' : 'Simulate Live Threat Drill'}
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW: FLEET */}
              {view === 'fleet' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <BunkerTelemetry />
                  <PrecursorRegistry />
                  <StanagMatrix />
                </div>
              )}

              {/* VIEW: AUDIT */}
              {view === 'audit' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <AuditLedger />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
