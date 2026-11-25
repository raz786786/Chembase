import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * Aceternity-inspired SpotlightCard:
 * Interactive radial spotlight border & inner glow that tracks pointer position.
 */
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className = '',
  onClick,
  spotlightColor = 'rgba(56, 189, 248, 0.14)',
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c111b]/90 backdrop-blur-xl transition-all duration-300 hover:border-sky-400/50 dark:hover:border-sky-400/40 hover:shadow-lg hover:shadow-sky-500/10 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(360px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 65%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

/**
 * Skipper / Aceternity-inspired ShimmerLink CTA button
 */
interface ShimmerLinkProps {
  to: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function ShimmerLink({ to, children, variant = 'primary', className = '' }: ShimmerLinkProps) {
  const base =
    variant === 'primary'
      ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-teal-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 border border-sky-400/30'
      : 'bg-slate-100/90 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-white/10 hover:border-sky-400/50 hover:bg-sky-50/70 dark:hover:bg-sky-500/10';

  return (
    <Link
      to={to}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold no-underline transition-all duration-200 active:scale-[0.97] ${base} ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Link>
  );
}

/**
 * TNR AgentOS-inspired live status pill
 */
export function StatusPill({
  label,
  value,
  dotColor = 'bg-emerald-400',
}: {
  label: string;
  value?: string;
  dotColor?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#0d131f]/90 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-xs backdrop-blur-md">
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotColor}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
      </span>
      <span>{label}</span>
      {value && <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-bold">· {value}</span>}
    </div>
  );
}

/**
 * Skipper-inspired Animated Pill Tab Selector with Framer Motion layoutId
 */
export function AnimatedTabBar<T extends string>({
  tabs,
  active,
  onChange,
  layoutId = 'active-pill-tab',
}: {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
  layoutId?: string;
}) {
  return (
    <div className="touch-scroll-x flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/80 dark:bg-[#0c111b]/80 p-1 no-scrollbar">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              isActive
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 shadow-sm shadow-sky-500/25"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
