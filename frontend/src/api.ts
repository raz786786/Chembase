const API_BASE = '/api';

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

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
  getElements: () => fetchJSON<SubstanceSummary[]>(`${API_BASE}/elements`),
  getCompounds: () => fetchJSON<SubstanceSummary[]>(`${API_BASE}/compounds`),
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
    return fetchJSON<any>(`${API_BASE}/proxy/materialsproject?chemsys=${encodeURIComponent(chemsys)}&api_key=${encodeURIComponent(apiKey)}`);
  },

  // PubChem Enrichment — batch enrich compounds with physical/hazard data
  pubchemEnrich: (compounds: { name: string, formula: string }[]) => {
    return fetch(`${API_BASE}/pubchem/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compounds)
    }).then(res => res.json() as Promise<any[]>);
  }
};
