import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";

interface MolecularCanvasProps {
  isDark: boolean;
  accentColor: string; // Dynamic hex color driven by scroll
}

export default function MolecularCanvas({ isDark, accentColor }: MolecularCanvasProps) {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (_container: Container | undefined) => {
    // Optional: Do something when loaded
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-40 transition-opacity duration-1000">
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          fullScreen: { enable: false, zIndex: 0 },
          fpsLimit: 60,
          particles: {
            color: {
              value: accentColor,
            },
            links: {
              color: accentColor,
              distance: 150,
              enable: true,
              opacity: isDark ? 0.2 : 0.4,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 0.6, // Slow, elegant drift
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 70, // More dots, but connected
            },
            opacity: {
              value: isDark ? 0.5 : 0.8,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 2.5 },
            },
          },
          detectRetina: true,
        }}
        className="w-full h-full"
      />
    </div>
  );
}
