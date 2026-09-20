import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ThreatMarker } from '../components/ThreatMap';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * Live threat markers from telemetry_logs.
 *
 * Supabase configured:
 *   - backfills the latest 100 rows on mount
 *   - subscribes to INSERTs via Realtime and prepends new markers
 *
 * Supabase not configured (local dev):
 *   - falls back to a light simulation so the map/ticker stay demoable
 */
export function useRealtimeTelemetry(maxMarkers = 12) {
  const [markers, setMarkers] = useState<ThreatMarker[]>([]);
  const [connected, setConnected] = useState(false);
  const [source, setSource] = useState<'realtime' | 'sim' | 'loading'>('loading');
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // ── Sim fallback (keeps the demo alive without Supabase) ──
      setSource('sim');
      const threats = ['Ammonia', 'Chlorine', 'VOC Complex', 'Hydrogen Sulfide'];
      const devices = ['Drone_01', 'Drone_02', 'Drone_03', 'Drone_04'];
      let n = 0;
      const id = setInterval(() => {
        n++;
        const m: ThreatMarker = {
          id: `sim-${n}`,
          device_id: devices[n % devices.length],
          threat: threats[n % threats.length],
          confidence: 74 + (n * 7) % 24,
          lat: 33.62 + Math.random() * 0.12,
          lng: 72.95 + Math.random() * 0.16,
          timestamp: new Date().toISOString(),
          hazardRadiusM: 250 + Math.floor(Math.random() * 900),
        };
        setMarkers((prev) => [m, ...prev].slice(0, maxMarkers));
      }, 5000);
      return () => clearInterval(id);
    }

    // ── Real Supabase path ──
    let cancelled = false;

    const backfill = async () => {
      const { data, error } = await supabase!
        .from('telemetry_logs')
        .select('*')
        .order('device_ts', { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (error) { console.error('[telemetry] backfill failed', error.message); }
      if (data) setMarkers(data.map(toMarker).slice(0, maxMarkers));
    };

    const channel = supabase!
      .channel('telemetry-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telemetry_logs' },
        (payload) => {
          const m = toMarker(payload.new);
          setMarkers((prev) => [m, ...prev].slice(0, maxMarkers));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnected(true);
      });

    channelRef.current = channel;
    backfill();

    return () => {
      cancelled = true;
      supabase!.removeChannel(channel);
    };
  }, [maxMarkers]);

  return { markers, connected, source };
}

// ── helpers ─────────────────────────────────────────
function toMarker(row: any): ThreatMarker {
  return {
    id: String(row.id),
    device_id: row.device_id,
    threat: row.threat_detected ?? 'Unknown',
    confidence: Number(row.confidence_score ?? 0),
    lat: Number(row.latitude ?? 0),
    lng: Number(row.longitude ?? 0),
    timestamp: row.device_ts ?? row.received_at ?? new Date().toISOString(),
    hazardRadiusM: undefined, // joined separately via /api/chemical-profiles
  }
}
