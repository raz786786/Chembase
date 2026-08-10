const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface SubstanceSummary {
  id: string;
  name: string;
  formula: string;
  type: string;
  symbol?: string;
  atomic_number?: number;
  category?: string;
  molar_mass?: number;
  period?: number;
  group_number?: number;
}

export interface HazardData {
  id: string;
  ghs_pictograms?: string[];
  ghs_signal_word?: string;
  h_statements?: string[];
  p_statements?: string[];
  nfpa_health?: number;
  nfpa_flammability?: number;
  nfpa_instability?: number;
  nfpa_special?: string;
}

export interface SubstanceDetail extends SubstanceSummary {
  cas_number?: string;
  description?: string;
  state_at_room_temp?: string;
  color?: string;
  density?: number;
  melting_point?: number;
  boiling_point?: number;
  electronegativity?: number;
  group_number?: number;
  period?: number;
  electron_configuration?: string;
  block?: string;
  oxidation_states?: number[];
  year_discovered?: string;
  is_radioactive?: boolean;
  atomic_radius?: number;
  hazard_data?: HazardData;
}

export interface Reaction {
  id: string;
  name: string;
  equation: string;
  reaction_type?: string;
  conditions?: string;
  enthalpy_change?: number;
  is_reversible: boolean;
  description?: string;
  balanced: boolean;
  industrial_value_tier?: number;
  verification_status?: string;
  safety_notes?: string;
  reactants: SubstanceSummary[];
  products: SubstanceSummary[];
}

export interface StatsOut {
  elements: number;
  compounds: number;
  reactions: number;
  total_substances: number;
}

export interface SearchResult {
  substances: SubstanceSummary[];
  reactions: Reaction[];
  total: number;
}

async function fetchJSON<T>(url: string, timeoutMs = 4000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Fallback Elements Dataset for zero-latency UI rendering
const FALLBACK_ELEMENTS: SubstanceSummary[] = [
  { id: 'el_1', name: 'Hydrogen', formula: 'H', type: 'element', symbol: 'H', atomic_number: 1, category: 'nonmetal', molar_mass: 1.008, period: 1, group_number: 1 },
  { id: 'el_2', name: 'Helium', formula: 'He', type: 'element', symbol: 'He', atomic_number: 2, category: 'noble gas', molar_mass: 4.0026, period: 1, group_number: 18 },
  { id: 'el_3', name: 'Lithium', formula: 'Li', type: 'element', symbol: 'Li', atomic_number: 3, category: 'alkali metal', molar_mass: 6.94, period: 2, group_number: 1 },
  { id: 'el_4', name: 'Beryllium', formula: 'Be', type: 'element', symbol: 'Be', atomic_number: 4, category: 'alkaline earth', molar_mass: 9.0122, period: 2, group_number: 2 },
  { id: 'el_5', name: 'Boron', formula: 'B', type: 'element', symbol: 'B', atomic_number: 5, category: 'metalloid', molar_mass: 10.81, period: 2, group_number: 13 },
  { id: 'el_6', name: 'Carbon', formula: 'C', type: 'element', symbol: 'C', atomic_number: 6, category: 'nonmetal', molar_mass: 12.011, period: 2, group_number: 14 },
  { id: 'el_7', name: 'Nitrogen', formula: 'N', type: 'element', symbol: 'N', atomic_number: 7, category: 'nonmetal', molar_mass: 14.007, period: 2, group_number: 15 },
  { id: 'el_8', name: 'Oxygen', formula: 'O', type: 'element', symbol: 'O', atomic_number: 8, category: 'nonmetal', molar_mass: 15.999, period: 2, group_number: 16 },
  { id: 'el_9', name: 'Fluorine', formula: 'F', type: 'element', symbol: 'F', atomic_number: 9, category: 'halogen', molar_mass: 18.998, period: 2, group_number: 17 },
  { id: 'el_10', name: 'Neon', formula: 'Ne', type: 'element', symbol: 'Ne', atomic_number: 10, category: 'noble gas', molar_mass: 20.180, period: 2, group_number: 18 },
  { id: 'el_11', name: 'Sodium', formula: 'Na', type: 'element', symbol: 'Na', atomic_number: 11, category: 'alkali metal', molar_mass: 22.990, period: 3, group_number: 1 },
  { id: 'el_12', name: 'Magnesium', formula: 'Mg', type: 'element', symbol: 'Mg', atomic_number: 12, category: 'alkaline earth', molar_mass: 24.305, period: 3, group_number: 2 },
  { id: 'el_13', name: 'Aluminium', formula: 'Al', type: 'element', symbol: 'Al', atomic_number: 13, category: 'post-transition', molar_mass: 26.982, period: 3, group_number: 13 },
  { id: 'el_14', name: 'Silicon', formula: 'Si', type: 'element', symbol: 'Si', atomic_number: 14, category: 'metalloid', molar_mass: 28.085, period: 3, group_number: 14 },
  { id: 'el_15', name: 'Phosphorus', formula: 'P', type: 'element', symbol: 'P', atomic_number: 15, category: 'nonmetal', molar_mass: 30.974, period: 3, group_number: 15 },
  { id: 'el_16', name: 'Sulfur', formula: 'S', type: 'element', symbol: 'S', atomic_number: 16, category: 'nonmetal', molar_mass: 32.06, period: 3, group_number: 16 },
  { id: 'el_17', name: 'Chlorine', formula: 'Cl', type: 'element', symbol: 'Cl', atomic_number: 17, category: 'halogen', molar_mass: 35.45, period: 3, group_number: 17 },
  { id: 'el_18', name: 'Argon', formula: 'Ar', type: 'element', symbol: 'Ar', atomic_number: 18, category: 'noble gas', molar_mass: 39.948, period: 3, group_number: 18 },
  { id: 'el_19', name: 'Potassium', formula: 'K', type: 'element', symbol: 'K', atomic_number: 19, category: 'alkali metal', molar_mass: 39.098, period: 4, group_number: 1 },
  { id: 'el_20', name: 'Calcium', formula: 'Ca', type: 'element', symbol: 'Ca', atomic_number: 20, category: 'alkaline earth', molar_mass: 40.078, period: 4, group_number: 2 },
  { id: 'el_26', name: 'Iron', formula: 'Fe', type: 'element', symbol: 'Fe', atomic_number: 26, category: 'transition metal', molar_mass: 55.845, period: 4, group_number: 8 },
  { id: 'el_29', name: 'Copper', formula: 'Cu', type: 'element', symbol: 'Cu', atomic_number: 29, category: 'transition metal', molar_mass: 63.546, period: 4, group_number: 11 },
  { id: 'el_30', name: 'Zinc', formula: 'Zn', type: 'element', symbol: 'Zn', atomic_number: 30, category: 'transition metal', molar_mass: 65.38, period: 4, group_number: 12 },
  { id: 'el_47', name: 'Silver', formula: 'Ag', type: 'element', symbol: 'Ag', atomic_number: 47, category: 'transition metal', molar_mass: 107.87, period: 5, group_number: 11 },
  { id: 'el_79', name: 'Gold', formula: 'Au', type: 'element', symbol: 'Au', atomic_number: 79, category: 'transition metal', molar_mass: 196.97, period: 6, group_number: 11 },
  { id: 'el_80', name: 'Mercury', formula: 'Hg', type: 'element', symbol: 'Hg', atomic_number: 80, category: 'transition metal', molar_mass: 200.59, period: 6, group_number: 12 },
  { id: 'el_92', name: 'Uranium', formula: 'U', type: 'element', symbol: 'U', atomic_number: 92, category: 'actinide', molar_mass: 238.03, period: 7, group_number: 3 },
];

const FALLBACK_COMPOUNDS: SubstanceSummary[] = [
  { id: 'cp_1', name: 'Water', formula: 'H2O', type: 'compound', category: 'inorganic', molar_mass: 18.015 },
  { id: 'cp_2', name: 'Carbon Dioxide', formula: 'CO2', type: 'compound', category: 'oxide', molar_mass: 44.009 },
  { id: 'cp_3', name: 'Methane', formula: 'CH4', type: 'compound', category: 'organic', molar_mass: 16.043 },
  { id: 'cp_4', name: 'Sodium Chloride', formula: 'NaCl', type: 'compound', category: 'salt', molar_mass: 58.44 },
  { id: 'cp_5', name: 'Sulfuric Acid', formula: 'H2SO4', type: 'compound', category: 'acid', molar_mass: 98.079 },
  { id: 'cp_6', name: 'Ammonia', formula: 'NH3', type: 'compound', category: 'base', molar_mass: 17.031 },
  { id: 'cp_7', name: 'Ethanol', formula: 'C2H5OH', type: 'compound', category: 'alcohol', molar_mass: 46.069 },
  { id: 'cp_8', name: 'Acetone', formula: 'CH3COCH3', type: 'compound', category: 'ketone', molar_mass: 58.08 },
  { id: 'cp_9', name: 'Hydrochloric Acid', formula: 'HCl', type: 'compound', category: 'acid', molar_mass: 36.46 },
  { id: 'cp_10', name: 'Sodium Hydroxide', formula: 'NaOH', type: 'compound', category: 'base', molar_mass: 39.997 },
  { id: 'cp_11', name: 'Benzene', formula: 'C6H6', type: 'compound', category: 'aromatic', molar_mass: 78.11 },
  { id: 'cp_12', name: 'Toluene', formula: 'C7H8', type: 'compound', category: 'aromatic', molar_mass: 92.14 },
  { id: 'cp_13', name: 'Acetic Acid', formula: 'CH3COOH', type: 'compound', category: 'organic acid', molar_mass: 60.05 },
  { id: 'cp_14', name: 'Glucose', formula: 'C6H12O6', type: 'compound', category: 'carbohydrate', molar_mass: 180.16 },
];

export const api = {
  getElements: async (): Promise<SubstanceSummary[]> => {
    try {
      const res = await fetchJSON<SubstanceSummary[]>(`${API_BASE}/elements`, 3000);
      if (res && res.length > 0) return res;
    } catch { /* ignore fallback */ }
    return FALLBACK_ELEMENTS;
  },
  getCompounds: async (): Promise<SubstanceSummary[]> => {
    try {
      const res = await fetchJSON<SubstanceSummary[]>(`${API_BASE}/compounds`, 3000);
      if (res && res.length > 0) return res;
    } catch { /* ignore fallback */ }
    return FALLBACK_COMPOUNDS;
  },
  getSubstance: (id: string) => fetchJSON<SubstanceDetail>(`${API_BASE}/substances/${id}`),
  getElementBySymbol: (symbol: string) => fetchJSON<SubstanceDetail>(`${API_BASE}/elements/by-symbol/${symbol}`),
  getReactions: () => fetchJSON<Reaction[]>(`${API_BASE}/reactions`),
  getReaction: (id: string) => fetchJSON<Reaction>(`${API_BASE}/reactions/${id}`),
  queryReactions: (r1: string, r2?: string) => {
    const params = new URLSearchParams({ reactant1: r1 });
    if (r2) params.set('reactant2', r2);
    return fetchJSON<Reaction[]>(`${API_BASE}/reactions/query/pair?${params}`);
  },
  predictReaction: (reactantIds: string[]) => {
    const params = new URLSearchParams();
    reactantIds.forEach(id => params.append('reactant_ids', id));
    return fetchJSON<Reaction[]>(`${API_BASE}/reactions/predict?${params.toString()}`);
  },
  search: (q: string) => fetchJSON<SearchResult>(`${API_BASE}/search?q=${encodeURIComponent(q)}`),
  getSubstanceReactions: (id: string) => fetchJSON<Reaction[]>(`${API_BASE}/substances/${id}/reactions`),
  getStats: () => fetchJSON<StatsOut>(`${API_BASE}/stats`),
  getCompoundsByElements: (elements: string) => fetchJSON<{compounds: SubstanceDetail[], reactions: Reaction[]}>(`${API_BASE}/compounds/by-elements?elements=${encodeURIComponent(elements)}`),
  exportData: (format: 'csv' | 'json' = 'csv') => {
    window.location.href = `${API_BASE}/export?format=${format}`;
  },
  
  // High-performance Batch Resolution
  bulkResolveSubstances: (items: string[]) => {
    return fetch(`${API_BASE}/substances/bulk-resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    }).then(res => res.json() as Promise<SubstanceSummary[]>);
  },

  // AI Proxy — supports per-model selection via optional 'model' field
  aiProxy: (payload: { provider: string; api_key: string; prompt: string; model?: string }) => {
    return fetch(`${API_BASE}/ai/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json() as Promise<{ text: string; model?: string; error?: string }>);
  },

  // Materials Project Proxy with Key
  getMaterialsProjectData: (chemsys: string, apiKey: string) => {
    return fetchJSON<MaterialsProjectResponse>(`${API_BASE}/proxy/materialsproject?chemsys=${encodeURIComponent(chemsys)}&api_key=${encodeURIComponent(apiKey)}`);
  },

  // PubChem Enrichment — batch enrich compounds with physical/hazard data
  pubchemEnrich: (compounds: { name: string, formula: string }[]) => {
    return fetch(`${API_BASE}/pubchem/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compounds)
    }).then(res => res.json() as Promise<PubChemEnrichedCompound[]>);
  }
};

export interface MaterialsProjectEntry {
  formula_pretty?: string;
  density?: number;
  is_stable?: boolean;
}

export interface MaterialsProjectResponse {
  data?: MaterialsProjectEntry[];
}

export interface PubChemEnrichedCompound {
  name?: string;
  formula?: string;
  molarMass?: number;
  iupacName?: string;
  ghsPictograms?: string[];
  pubchemCid?: number;
}
