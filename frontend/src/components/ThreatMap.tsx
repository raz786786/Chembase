import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { StyleSpecification, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface ThreatMarker {
  id: string;
  device_id: string;
  threat: string;
  confidence: number;
  lat: number;
  lng: number;
  timestamp: string;
  /** Hazard radius in meters — drives the pulsing ring */
  hazardRadiusM?: number;
}

interface Props {
  markers: ThreatMarker[];
  /** Fly to latest marker when it changes */
  focusLatest?: boolean;
  height?: number | string;
  className?: string;
}

/** Free dark basemap style (no token required) */
const DARK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#020617' } }, { id: 'tiles', type: 'raster', source: 'basemap' }],
};

const DEFAULT_RADIUS = 500;

export default function ThreatMap({ markers, focusLatest = true, height = 420, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<ThreatMarker[]>(markers);
  markersRef.current = markers;

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [73.04, 33.68],
      zoom: 11,
      attributionControl: false,
      interactive: true,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      map.addSource('threats', { type: 'geojson', data: emptyFC() });
      // Pulsing ring animation via paint property driven by a time uniform
      map.addLayer({
        id: 'hazard-ring',
        type: 'circle',
        source: 'threats',
        paint: {
          'circle-radius': ['coalesce', ['get', 'radiusPx'], 24],
          'circle-color': '#ef4444',
          'circle-opacity': 0.35,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ef4444',
          'circle-stroke-opacity': 0.35,
        },
      });
      map.addLayer({
        id: 'threat-core',
        type: 'circle',
        source: 'threats',
        paint: {
          'circle-radius': ['coalesce', ['get', 'radiusPx'], 10],
          'circle-color': '#ef4444',
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fecaca',
        },
      });

      animatePulse();
      setData(markersRef.current);
      if (markersRef.current.length) flyToLatest();
    });

    // Pulse the ring radius/opacity between two keyframes via JS clock
    function animatePulse() {
      const tick = (now: number) => {
        const t = (now % 1600) / 1600; // 0..1
        if (mapRef.current?.getLayer('hazard-ring')) {
          mapRef.current.setPaintProperty('hazard-ring', 'circle-radius', [
            'interpolate', ['linear'], t,
            0, 12,
            1, 34,
          ]);
          mapRef.current.setPaintProperty('hazard-ring', 'circle-opacity', 0.45 * (1 - t));
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update data when markers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded?.()) {
      // map not ready yet — the load handler picks up markersRef
      return;
    }
    setData(markers);
    if (focusLatest && markers.length) {
      const latest = markers[0];
      map.flyTo({ center: [latest.lng, latest.lat], zoom: Math.max(map.getZoom(), 12), duration: 1200, essential: true });
    }
  }, [markers, focusLatest]);

  function setData(list: ThreatMarker[]) {
    const map = mapRef.current;
    if (!map || !map.getSource('threats')) return;
    (map.getSource('threats') as GeoJSONSource | undefined)?.setData(toFC(list) as never);
  }

  function flyToLatest() {
    const latest = markersRef.current[0];
    if (latest && mapRef.current) {
      mapRef.current.flyTo({ center: [latest.lng, latest.lat], zoom: 12, duration: 1400 });
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 ${className}`} style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      {/* HUD overlay */}
      <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1">
        <span className="pointer-events-auto w-fit rounded-md border border-red-900/60 bg-slate-950/80 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-red-400 backdrop-blur">
          ● LIVE THREAT GRID
        </span>
        <span className="pointer-events-auto w-fit rounded-md border border-slate-800 bg-slate-950/80 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-400 backdrop-blur">
          {markers.length} marker{markers.length === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}

interface FeatureCollectionLike { type: 'FeatureCollection'; features: unknown[] }

function toFC(list: ThreatMarker[]): FeatureCollectionLike {
  return {
    type: 'FeatureCollection',
    features: list.map((m) => ({
      type: 'Feature',
      properties: {
        id: m.id,
        device_id: m.device_id,
        threat: m.threat,
        confidence: m.confidence,
        // radius in pixels grows slightly with hazard radius
        radiusPx: Math.max(8, Math.min(22, 8 + (m.hazardRadiusM ?? DEFAULT_RADIUS) / 60)),
        ageMs: 0,
      },
      geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
    })),
  };
}

function emptyFC(): FeatureCollectionLike {
  return { type: 'FeatureCollection', features: [] };
}
