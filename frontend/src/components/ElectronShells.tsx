import { useRef, useState } from 'react';

interface Props {
  /** Electron configuration string e.g. "1s2 2s2 2p6 3s1" — optional */
  electronConfiguration?: string | null;
  /** Number of electrons to draw (defaults to atomic number) */
  electrons?: number;
  size?: number;
  className?: string;
}

const SHELL_CAPACITY = [2, 8, 18, 32, 32, 18, 8];

function parseShellCounts(config?: string | null, fallback = 0): number[] {
  if (!config) return fillByCapacity(fallback);
  const shells: number[] = [];
  const re = /(\d+)([spdf])(\d+)/g;
  let m: RegExpExecArray | null;
  let total = 0;
  while ((m = re.exec(config)) !== null) {
    const n = parseInt(m[1], 10);
    const count = parseInt(m[3], 10);
    shells[n - 1] = (shells[n - 1] || 0) + count;
    total += count;
  }
  // pad missing shells
  for (let i = 0; i < shells.length; i++) if (!shells[i]) shells[i] = 0;
  if (total < fallback) {
    // fill remaining into outer shells by capacity
    let rem = fallback - total;
    for (let i = 0; i < shells.length && rem > 0; i++) {
      const cap = SHELL_CAPACITY[i] ?? 32;
      const add = Math.min(cap - shells[i], rem);
      shells[i] += add;
      rem -= add;
    }
  }
  return shells.filter((_, i) => shells[i] > 0 || i < shells.length - 1 && shells.slice(i + 1).some((x) => x > 0));
}

function fillByCapacity(electrons: number): number[] {
  const shells: number[] = [];
  let rem = electrons;
  for (let i = 0; i < SHELL_CAPACITY.length && rem > 0; i++) {
    const put = Math.min(SHELL_CAPACITY[i], rem);
    shells.push(put);
    rem -= put;
  }
  return shells;
}

/** Animated Bohr-model electron shells — pure SVG + CSS, no deps */
export default function ElectronShells({
  electronConfiguration,
  electrons,
  size = 260,
  className = '',
}: Props) {
  const [spin, setSpin] = useState(true);
  const uid = useRef(`es-${Math.random().toString(36).slice(2, 9)}`).current;
  const shellCounts = parseShellCounts(electronConfiguration, electrons ?? 0);
  const shells = shellCounts.filter((c) => c > 0);
  const cxy = size / 2;

  return (
    <div className={`relative select-none ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#6366f1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0.25" />
          </radialGradient>
        </defs>

        {/* Nucleus */}
        <circle cx={cxy} cy={cxy} r={size * 0.07} fill={`url(#${uid}-glow)`} />
        <circle cx={cxy} cy={cxy} r={size * 0.055} className="fill-indigo-500/80 dark:fill-indigo-400/80" />
        <text x={cxy} y={cxy + 3} textAnchor="middle" className="fill-white text-[9px] font-black">+</text>

        {/* Orbit rings */}
        {shells.map((_, i) => (
          <circle
            key={`ring-${i}`}
            cx={cxy}
            cy={cxy}
            r={size * (0.16 + i * 0.105)}
            fill="none"
            stroke="currentColor"
            className="text-surface-300 dark:text-surface-600"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.7"
          />
        ))}

        {/* Electrons */}
        {shells.map((count, si) => {
          const r = size * (0.16 + si * 0.105);
          return Array.from({ length: count }).map((_, ei) => {
            const angle = (2 * Math.PI * ei) / count;
            const x = cxy + r * Math.cos(angle);
            const y = cxy + r * Math.sin(angle);
            return (
              <g key={`e-${si}-${ei}`}>
                <circle cx={x} cy={y} r={size * 0.016} className="fill-indigo-500" opacity="0.9" />
                {spin && (
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${cxy} ${cxy}`}
                    to={`360 ${cxy} ${cxy}`}
                    dur={`${9 + si * 4}s`}
                    repeatCount="indefinite"
                  />
                )}
              </g>
            );
          });
        })}
      </svg>

      <button
        type="button"
        onClick={() => setSpin((s) => !s)}
        className="absolute bottom-0 right-1/2 translate-x-1/2 text-[9px] font-bold uppercase tracking-widest text-surface-400 hover:text-primary-500 transition-colors"
        style={{ transform: 'translateX(50%)' }}
      >
        {spin ? '⏸ Pause orbit' : '▶ Resume orbit'}
      </button>
    </div>
  );
}
