import type { DefenseCompound } from '../../types/deftech';

export function evaluateStorageSafety(c1: DefenseCompound, c2: DefenseCompound): { status: string; message: string } {
  const isOxidizerAndFuel = 
    (c1.explosiveClass === 'Oxidizer' && c2.explosiveClass === 'Fuel') || 
    (c1.explosiveClass === 'Fuel' && c2.explosiveClass === 'Oxidizer');

  if (isOxidizerAndFuel) {
    return { 
      status: 'FORBIDDEN', 
      message: 'CRITICAL: Hypergolic/Combustion Risk. Violates STANAG 4145.' 
    };
  }

  return { 
    status: 'SAFE', 
    message: 'STANAG 4145 Compliant Co-location.' 
  };
}

export function calculateBlastStandoff(massKg: number): string {
  return (4.5 * Math.pow(massKg, 1/3)).toFixed(2);
}

// ─────────────────────────────────────────────────────────────
// Toxicity tier → evacuation radius (backed by chemical_profiles)
// ─────────────────────────────────────────────────────────────

export type ToxicityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

/** Defaults per toxicity tier — overridden by chemical_profiles values when loaded */
const TIER_EVACUATION_M: Record<ToxicityLevel, number> = {
  LOW: 100,
  MODERATE: 300,
  HIGH: 500,
  EXTREME: 800,
};

/**
 * Mirror of the seeded chemical_profiles rows (backend/supabase_schema.sql §9).
 * Used as offline fallback until /api/chemical-profiles responds.
 */
const FALLBACK_PROFILES: ChemicalProfile[] = [
  { name: 'Ammonia',          toxicity_level: 'HIGH',    hazard_radius_m: 500 },
  { name: 'Chlorine',         toxicity_level: 'EXTREME', hazard_radius_m: 800 },
  { name: 'Hydrogen Sulfide', toxicity_level: 'EXTREME', hazard_radius_m: 700 },
  { name: 'Sulfur Dioxide',   toxicity_level: 'HIGH',    hazard_radius_m: 400 },
  { name: 'Benzene Vapor',    toxicity_level: 'HIGH',    hazard_radius_m: 350 },
  { name: 'VOC Complex',      toxicity_level: 'MODERATE', hazard_radius_m: 300 },
];

export interface ChemicalProfile {
  name: string;
  toxicity_level: ToxicityLevel;
  hazard_radius_m: number;
}

let profilesCache: ChemicalProfile[] | null = null;

/** Fetch chemical profiles from the backend API; caches result. Safe to call repeatedly. */
export async function ensureChemicalProfiles(apiBase = import.meta.env.VITE_API_BASE_URL ?? ''): Promise<ChemicalProfile[]> {
  if (profilesCache) return profilesCache;
  try {
    const res = await fetch(`${apiBase}/api/chemical-profiles`);
    if (res.ok) {
      const data = (await res.json()) as ChemicalProfile[];
      if (Array.isArray(data) && data.length > 0) {
        profilesCache = data;
        return profilesCache;
      }
    }
  } catch {
    // backend not reachable — fall back to bundled data
  }
  profilesCache = FALLBACK_PROFILES;
  return profilesCache;
}

/**
 * Evacuation radius in meters for a detected threat.
 * Lookup order: chemical_profiles (live) → bundled fallback → toxicity tier default.
 */
export function lookupEvacuationRadiusM(threatName: string | undefined | null): number | null {
  if (!threatName) return null;
  const source = profilesCache ?? FALLBACK_PROFILES;
  const match = source.find(
    (p) => p.name.toLowerCase() === threatName.toLowerCase()
  );
  if (match) return match.hazard_radius_m;
  // Tier default for unknown chemicals when toxicity is embedded in the name
  const tier = (Object.keys(TIER_EVACUATION_M) as ToxicityLevel[]).find((t) =>
    threatName.toUpperCase().includes(t)
  );
  return tier ? TIER_EVACUATION_M[tier] : null;
}
