import { useEffect, useRef, useState } from 'react';
import { Line, LineChart, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  /** Latest ppm value pushed each interval */
  value: number;
  /** Critical threshold for the red reference line */
  threshold?: number;
  window?: number;
  height?: number;
}

interface Point { t: number; ppm: number }

/** Streaming sparkline — keeps a sliding window of telemetry values */
export default function TelemetryChart({ value, threshold = 100, window: win = 40, height = 90 }: Props) {
  const [data, setData] = useState<Point[]>(() =>
    Array.from({ length: win }, (_, i) => ({ t: i, ppm: 12 })),
  );
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => [...prev.slice(1), { t: Date.now(), ppm: latest.current }]);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const critical = latest.current >= threshold;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <YAxis domain={[0, Math.max(120, threshold * 1.2)]} hide />
          <ReferenceLine y={threshold} stroke="rgba(239,68,68,0.5)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="ppm"
            stroke={critical ? '#ef4444' : '#34d399'}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
