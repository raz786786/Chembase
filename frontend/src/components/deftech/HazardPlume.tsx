import { useEffect, useRef } from 'react';

interface Props {
  /** Detected chemical name, e.g. "Ammonia" */
  threat: string;
  /** Hazard radius in meters */
  radiusM: number;
  /** Confidence 0-100 */
  confidence?: number;
  height?: number;
}

interface Puff { x: number; y: number; vx: number; vy: number; r: number; life: number; maxLife: number }

const RADIUS_PX = 160;

/**
 * Animated gas-dispersion plume — particle puffs drift downwind and expand to
 * the hazard radius. Pure canvas, self-contained demo widget.
 */
export default function HazardPlume({ threat, radiusM, confidence = 90, height = 220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const puffsRef = useRef<Puff[]>([]);
  const propsRef = useRef({ threat, radiusM, confidence });
  propsRef.current = { threat, radiusM, confidence };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth, H = height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const originX = W * 0.22, originY = H * 0.72;
    const maxR = RADIUS_PX;

    const spawn = () => {
      const p: Puff = {
        x: originX,
        y: originY,
        vx: 0.6 + Math.random() * 0.5,
        vy: -(0.15 + Math.random() * 0.3),
        r: 6 + Math.random() * 8,
        life: 0,
        maxLife: 220 + Math.random() * 120,
      };
      puffsRef.current.push(p);
    };

    let raf = 0;
    let frame = 0;
    const draw = () => {
      frame++;
      if (frame % 6 === 0 && puffsRef.current.length < 90) spawn();

      ctx.clearRect(0, 0, W, H);

      // Grid backdrop
      ctx.strokeStyle = 'rgba(148,163,184,0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Hazard boundary ring
      const danger = propsRef.current.radiusM;
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(239,68,68,0.5)';
      ctx.beginPath();
      ctx.arc(originX, originY, Math.min(maxR, (danger / Math.max(1, danger)) * maxR * 0.9 + 40), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(239,68,68,0.85)';
      ctx.font = 'bold 10px ui-monospace, monospace';
      ctx.fillText(`R = ${danger} m`, originX + maxR * 0.55, originY - maxR * 0.72);

      // Puffs
      ctx.globalCompositeOperation = 'lighter';
      puffsRef.current.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy + Math.sin(p.life * 0.05 + p.r) * 0.12;
        p.r += 0.22;
        const alpha = Math.max(0, 1 - p.life / p.maxLife) * 0.16;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(250,204,21,${alpha})`);
        g.addColorStop(0.6, `rgba(239,68,68,${alpha * 0.7})`);
        g.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      puffsRef.current = puffsRef.current.filter((p) => p.life < p.maxLife && p.x < W + 40);

      // Source marker
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(originX, originY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(226,232,240,0.9)';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.fillText(`⚠ ${propsRef.current.threat.toUpperCase()} LEAK SOURCE`, originX + 10, originY - 10);

      // Wind indicator
      ctx.strokeStyle = 'rgba(148,163,184,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W - 70, 28);
      ctx.lineTo(W - 30, 28);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 30, 28); ctx.lineTo(W - 38, 24); ctx.lineTo(W - 38, 32); ctx.closePath();
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.fill();
      ctx.fillText('WIND', W - 66, 18);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [height]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-red-400">Hazard Plume Simulation</span>
        <span className="font-mono text-[10px] font-bold text-slate-500">
          CONF {propsRef.current.confidence}% · GAUSSIAN DISPERSION MODEL
        </span>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height }} />
    </div>
  );
}
