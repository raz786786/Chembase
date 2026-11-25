import { useCallback, useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";

interface MolecularCanvasProps {
  isDark: boolean;
  accentColor: string;
}

export default function MolecularCanvas({ isDark, accentColor }: MolecularCanvasProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isSmallScreen = window.innerWidth < 768;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (isSmallScreen || prefersReduced) return;

    const timer = window.setTimeout(() => setEnabled(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (_container: Container | undefined) => {}, []);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-45 dark:opacity-35 transition-opacity duration-1000">
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          fullScreen: { enable: false, zIndex: 0 },
          fpsLimit: 30,
          particles: {
            color: { value: accentColor },
            links: {
              color: accentColor,
              distance: 140,
              enable: true,
              opacity: isDark ? 0.18 : 0.3,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: { default: "bounce" },
              random: false,
              speed: 0.5,
              straight: false,
            },
            number: {
              density: { enable: true, area: 900 },
              value: 36,
            },
            opacity: { value: isDark ? 0.45 : 0.65 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 2.2 } },
          },
          detectRetina: false,
        }}
        className="w-full h-full"
      />
    </div>
  );
}
