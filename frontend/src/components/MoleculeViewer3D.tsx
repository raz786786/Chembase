import { useEffect, useMemo, useRef } from 'react';

interface Props {
  /** Molecular formula e.g. "H2O", "NH3", "C2H5OH" */
  formula: string;
  size?: number;
  className?: string;
}

interface Atom { el: string; x: number; y: number; z: number }

// ── Minimal 3D ball-and-stick geometry templates for common molecules ────────
// Coordinates in Å (rough VSEPR shapes — schematic, not crystallographic).
type Template = { atoms: [string, number, number, number][]; bonds: [number, number, 1 | 2 | 3][] };

const TEMPLATES: Record<string, Template> = {
  H2O: {
    atoms: [['O', 0, 0.35, 0], ['H', -0.76, -0.3, 0], ['H', 0.76, -0.3, 0]],
    bonds: [[0, 1, 1], [0, 2, 1]],
  },
  CO2: {
    atoms: [['O', 0, 1.16, 0], ['C', 0, 0, 0], ['O', 0, -1.16, 0]],
    bonds: [[0, 1, 2], [1, 2, 2]],
  },
  NH3: {
    atoms: [['N', 0, 0.28, 0.2], ['H', -0.82, -0.3, -0.2], ['H', 0.82, -0.3, -0.2], ['H', 0, 0.1, -0.95]],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]],
  },
  CH4: {
    atoms: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['H', -0.63, -0.63, 0.63], ['H', -0.63, 0.63, -0.63], ['H', 0.63, -0.63, -0.63]],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
  },
  NaCl: {
    atoms: [['Na', 0, 0, 0], ['Cl', 1.4, 0, 0]],
    bonds: [[0, 1, 1]],
  },
  HCl: { atoms: [['Cl', 0, 0, 0], ['H', 0, 0.9, 0]], bonds: [[0, 1, 1]] },
  O2: { atoms: [['O', 0, 0.6, 0], ['O', 0, -0.6, 0]], bonds: [[0, 1, 2]] },
  N2: { atoms: [['N', 0, 0.55, 0], ['N', 0, -0.55, 0]], bonds: [[0, 1, 3]] },
  H2: { atoms: [['H', 0, 0.38, 0], ['H', 0, -0.38, 0]], bonds: [[0, 1, 1]] },
};

// Atomic radii (pm) & CPK-ish colors
const ATOM_STYLE: Record<string, { r: number; color: string }> = {
  H: { r: 0.31, color: '#e5e7eb' },
  C: { r: 0.76, color: '#374151' },
  N: { r: 0.71, color: '#3b82f6' },
  O: { r: 0.66, color: '#ef4444' },
  F: { r: 0.57, color: '#22d3ee' },
  Cl: { r: 1.02, color: '#4ade80' },
  S: { r: 1.05, color: '#facc15' },
  P: { r: 1.07, color: '#f97316' },
  Na: { r: 1.66, color: '#a78bfa' },
};

function parseFormula(formula: string): [string, number][] {
  const out: [string, number][] = [];
  const re = /([A-Z][a-z]?)(\d*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(formula)) !== null) {
    if (!m[1]) continue;
    out.push([m[1], m[2] ? parseInt(m[2], 10) : 1]);
  }
  return out;
}

/** Build a chain geometry for molecules without a template (schematic backbone) */
function buildChain(formula: string): Template {
  const atoms = parseFormula(formula);
  const placed: [string, number, number, number][] = [];
  const bonds: [number, number, 1 | 2 | 3][] = [];
  let idx = 0;
  atoms.forEach(([el, n]) => {
    for (let i = 0; i < Math.min(n, 4); i++) {
      placed.push([el, Math.cos(idx * 2.1) * (0.9 + (idx % 3) * 0.35), Math.sin(idx * 1.7) * 0.8, Math.sin(idx * 2.4) * 0.6]);
      if (idx > 0) bonds.push([idx - 1, idx, 1]);
      idx++;
    }
  });
  return { atoms: placed, bonds };
}

const CPK_COLOR = '#94a3b8';

/**
 * Canvas ball-and-stick molecule viewer with drag-to-rotate, auto-spin and
 * depth-sorted rendering. Zero dependencies — pure 2D canvas with 3D math.
 */
export default function MoleculeViewer3D({ formula, size = 280, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ rotX: -0.35, rotY: 0.4, drag: false, lastX: 0, lastY: 0, spin: true });
  const template = useMemo(() => TEMPLATES[formula] || buildChain(formula), [formula]);

  const project = (p: { x: number; y: number; z: number }) => {
    const { rotX, rotY } = stateRef.current;
    // Rotate Y then X
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x1 = p.x * cosY - p.z * sinY;
    const z1 = p.x * sinY + p.z * cosY;
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y2 = p.y * cosX - z1 * sinX;
    const z2 = p.y * sinX + z1 * cosX;
    const persp = 1 / (1 + Math.max(0, (z2 + 2.2)) * 0.12);
    return { x: p.x * 0 + x1 * persp, y: y2 * persp, z: z2, s: persp };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    const SCALE = size / 5.2;

    const draw = () => {
      const st = stateRef.current;
      if (st.spin && !st.drag) st.rotY += 0.008;

      ctx.clearRect(0, 0, size, size);
      const atoms: Atom[] = template.atoms.map(([el, x, y, z]) => ({ el, x, y, z }));
      const projected = atoms.map((a) => ({ ...a, ...project(a) }));
      projected.sort((a, b) => a.z - b.z);

      const px = (a: { x: number }) => cxy() + a.x * SCALE;
      const py = (a: { y: number }) => cxy() - a.y * SCALE;
      function cxy() { return size / 2; }

      // Bonds first (behind atoms)
      template.bonds.forEach(([ai, bi, order]) => {
        const a = projected[ai], b = projected[bi];
        if (!a || !b) return;
        const dx = px(b) - px(a), dy = py(b) - py(a);
        const len = Math.hypot(dx, dy);
        const nx = -dy / len, ny = dx / len;
        const offsets = order === 1 ? [0] : order === 2 ? [-2.2, 2.2] : [-3.4, 0, 3.4];
        ctx.strokeStyle = 'rgba(148,163,184,0.65)';
        ctx.lineWidth = 3.5 * Math.min(a.s, b.s);
        offsets.forEach((off) => {
          ctx.beginPath();
          ctx.moveTo(px(a) + nx * off, py(a) + ny * off);
          ctx.lineTo(px(b) + nx * off, py(b) + ny * off);
          ctx.stroke();
        });
      });

      // Atoms depth-sorted
      projected.forEach((a) => {
        const style = ATOM_STYLE[a.el] || { r: 0.9, color: CPK_COLOR };
        const r = Math.max(4, style.r * SCALE * 0.9 * a.s);
        const depth = (a.z + 2) / 4; // 0..1
        const grad = ctx.createRadialGradient(px(a) - r * 0.35, py(a) - r * 0.35, r * 0.1, px(a), py(a), r);
        grad.addColorStop(0, style.color);
        grad.addColorStop(1, shade(style.color, 0.45 + depth * 0.2));
        ctx.globalAlpha = 0.55 + depth * 0.45;
        ctx.beginPath();
        ctx.arc(px(a), py(a), r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (r > 9) {
          ctx.fillStyle = isLight(style.color) ? '#111827' : '#f8fafc';
          ctx.font = `bold ${Math.round(r * 0.9)}px ui-sans-serif, system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(a.el, px(a), py(a));
        }
      });

      raf = requestAnimationFrame(draw);
    };

    const shade = (hex: string, amt: number) => {
      const n = parseInt(hex.slice(1), 16);
      const r = Math.round(((n >> 16) & 255) * (1 - amt));
      const g = Math.round(((n >> 8) & 255) * (1 - amt));
      const b = Math.round((n & 255) * (1 - amt));
      return `rgb(${r},${g},${b})`;
    };
    const isLight = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 150;
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [template, size]);

  const onPointerDown = (e: React.PointerEvent) => {
    const st = stateRef.current;
    st.drag = true; st.lastX = e.clientX; st.lastY = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const st = stateRef.current;
    if (!st.drag) return;
    st.rotY += (e.clientX - st.lastX) * 0.01;
    st.rotX += (e.clientY - st.lastY) * 0.01;
    st.lastX = e.clientX; st.lastY = e.clientY;
  };
  const onPointerUp = () => { stateRef.current.drag = false; };

  return (
    <div className={`relative select-none ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, cursor: 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="rounded-2xl"
      />
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest text-surface-400 pointer-events-none">
        drag to rotate
      </span>
    </div>
  );
}
