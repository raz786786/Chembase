import { FULL_ELEMENTS_CATALOG, findCatalogElement } from './data/elementsCatalog';
import { sendAutoRoutedChat } from './utils/providerRouter';

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


  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (err) {

    throw err;
  }
}

const FALLBACK_ELEMENTS: SubstanceSummary[] = FULL_ELEMENTS_CATALOG;

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

function getLocalSubstanceDetail(id: string): SubstanceDetail {
  const catalogEl = findCatalogElement(id);
  if (catalogEl) return catalogEl;
  const foundEl = FALLBACK_ELEMENTS.find(e => e.id === id || e.symbol === id || e.name.toLowerCase() === id.toLowerCase());
  if (foundEl) {
    const atNum = foundEl.atomic_number || 1;
    const catStr = foundEl.category || 'nonmetal';
    return {
      ...foundEl,
      cas_number: `CAS-${atNum * 1024}-01`,
      description: `${foundEl.name} is a chemical element with symbol ${foundEl.symbol} and atomic number ${atNum}.`,
      state_at_room_temp: catStr.includes('noble gas') || foundEl.formula === 'H' || foundEl.formula === 'N' || foundEl.formula === 'O' || foundEl.formula === 'F' || foundEl.formula === 'Cl' ? 'gas' : foundEl.formula === 'Hg' || foundEl.formula === 'Br' ? 'liquid' : 'solid',
      color: 'Characteristic',
      hazard_data: {
        id: `h_${foundEl.id}`,
        ghs_pictograms: catStr.includes('alkali') || foundEl.formula === 'H' ? ['GHS02'] : [],
        ghs_signal_word: 'Warning',
        nfpa_health: 1,
        nfpa_flammability: foundEl.formula === 'H' ? 4 : 0,
        nfpa_instability: 0
      }
    };
  }

  const foundCp = FALLBACK_COMPOUNDS.find(c => c.id === id || c.name.toLowerCase() === id.toLowerCase() || c.formula === id);
  if (foundCp) {
    return {
      ...foundCp,
      cas_number: 'CAS-7732-18-5',
      description: `${foundCp.name} (${foundCp.formula}) is a major industrial chemical compound.`,
      state_at_room_temp: foundCp.formula === 'CO2' || foundCp.formula === 'CH4' || foundCp.formula === 'NH3' ? 'gas' : 'liquid',
      hazard_data: {
        id: `h_${foundCp.id}`,
        ghs_pictograms: ['GHS07'],
        ghs_signal_word: 'Warning',
        nfpa_health: 1,
        nfpa_flammability: 1,
        nfpa_instability: 0
      }
    };
  }

  // Generic fallback
  return {
    id,
    name: id.replace('el_', 'Element ').replace('cp_', 'Compound '),
    formula: id.toUpperCase(),
    type: id.startsWith('el_') ? 'element' : 'compound',
    category: 'general',
    molar_mass: 100.0,
    description: `Substance record for ${id}`,
  };
}

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
  getSubstance: async (id: string): Promise<SubstanceDetail> => {
    const localMatch = findCatalogElement(id);
    if (id.startsWith('el_') && localMatch) {
      return localMatch;
    }
    try {
      const remote = await fetchJSON<SubstanceDetail>(`${API_BASE}/substances/${id}`, 3000);
      const enrich = findCatalogElement(remote.symbol || remote.name || id);
      if (enrich && remote.type === 'element') {
        return {
          ...enrich,
          ...Object.fromEntries(Object.entries(remote).filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== 'unknown')),
          hazard_data: remote.hazard_data || enrich.hazard_data,
        } as SubstanceDetail;
      }
      return remote;
    } catch {
      return getLocalSubstanceDetail(id);
    }
  },
  getElementBySymbol: async (symbol: string): Promise<SubstanceDetail> => {
    try {
      return await fetchJSON<SubstanceDetail>(`${API_BASE}/elements/by-symbol/${symbol}`, 3000);
    } catch {
      return getLocalSubstanceDetail(symbol);
    }
  },
  getReactions: async (): Promise<Reaction[]> => {
    try {
      return await fetchJSON<Reaction[]>(`${API_BASE}/reactions`, 3000);
    } catch {
      return [];
    }
  },
  getReaction: async (id: string): Promise<Reaction> => {
    if (id.startsWith('rxn_')) {
      const { findFiftyCatalogReaction } = await import('./data/elementReactions');
      const hit = findFiftyCatalogReaction(id);
      if (hit) return hit;
    }
    return fetchJSON<Reaction>(`${API_BASE}/reactions/${id}`, 3000);
  },
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
  search: async (q: string): Promise<SearchResult> => {
    try {
      return await fetchJSON<SearchResult>(`${API_BASE}/search?q=${encodeURIComponent(q)}`, 3000);
    } catch {
      const filteredEls = FALLBACK_ELEMENTS.filter(e => e.name.toLowerCase().includes(q.toLowerCase()) || e.formula.toLowerCase().includes(q.toLowerCase()));
      const filteredCps = FALLBACK_COMPOUNDS.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.formula.toLowerCase().includes(q.toLowerCase()));
      return {
        substances: [...filteredEls, ...filteredCps],
        reactions: [],
        total: filteredEls.length + filteredCps.length
      };
    }
  },
  getSubstanceReactions: async (id: string, fallbackKey?: string): Promise<Reaction[]> => {
    const { getFiftyReactionsForElement } = await import('./data/elementReactions');
    const fifty = getFiftyReactionsForElement(fallbackKey || id);
    if (id.startsWith('el_') && fifty.length > 0) {
      return fifty;
    }
    try {
      const res = await fetchJSON<Reaction[]>(`${API_BASE}/substances/${id}/reactions`, 3000);
      if (res && res.length >= 50) return res;
      if (res && res.length > 0 && fifty.length > 0) {
        const seen = new Set(res.map(r => r.equation.replace(/\s+/g, '').toLowerCase()));
        const merged = [...res, ...fifty.filter(r => !seen.has(r.equation.replace(/\s+/g, '').toLowerCase()))];
        return merged.slice(0, 50);
      }
      if (res && res.length > 0) return res;
    } catch { /* fallback below */ }
    return fifty;
  },
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

  aiProxy: async (payload: { provider?: string; api_key?: string; prompt: string; model?: string; system_prompt?: string; json_mode?: boolean }) => {
    if (!(payload.provider && payload.api_key)) {
      const autoRes = await sendAutoRoutedChat({
        systemPrompt: payload.system_prompt,
        messages: [{ role: 'user', content: payload.prompt }],
        timeoutMs: 25000,
      });
      if (autoRes.ok) {
        return { text: autoRes.text, provider: autoRes.provider_id, model: autoRes.model_id };
      }
    }

    const saved = JSON.parse(localStorage.getItem('active_models') || '{}');
    const apiKeysObj = JSON.parse(localStorage.getItem('chembase_system_api_keys') || '{}');
    
    // Ordered fallback list
    let availableModels = Object.keys(saved).filter(k => saved[k] === true);
    if (availableModels.length === 0) {
      availableModels = ['gemini:gemini-2.5-flash'];
    }

    // Move the requested provider/model to the front of the queue if specified
    if (payload.provider) {
      const explicitKey = `${payload.provider}:${payload.model || ''}`;
      availableModels = availableModels.filter(m => !m.startsWith(payload.provider!));
      availableModels.unshift(explicitKey);
    }

    let lastError: any = null;

    for (const modelKey of availableModels) {
      const sep = modelKey.indexOf(':');
      const prov = sep >= 0 ? modelKey.slice(0, sep) : modelKey;
      const mod = sep >= 0 ? modelKey.slice(sep + 1) : '';
      let key = payload.api_key;
      
      if (!key) {
        key = apiKeysObj[prov] || localStorage.getItem(`${prov}_api_key`) || '';
      }

      if (!key) continue; // skip if no key for this provider

      try {
        const res = await fetch(`${API_BASE}/ai/proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(25000),
          body: JSON.stringify({
            ...payload,
            provider: prov,
            api_key: key,
            prompt: payload.prompt,
            system_prompt: payload.system_prompt,
            model: mod || payload.model
          })
        });
        
        const data = await res.json() as { text: string; provider?: string; model?: string; error?: string };
        
        // If the backend returns an error message containing a 429 or quota limit, try the next model
        if (data.error && (data.error.includes('429') || data.error.toLowerCase().includes('quota') || data.error.toLowerCase().includes('rate limit') || data.error.toLowerCase().includes('exceeded'))) {
          lastError = data.error;
          console.warn(`[AI Proxy] Model ${modelKey} failed due to quota/rate limit: ${data.error}. Falling back to next available model...`);
          continue; // Try next model
        }
        
        // Return successful response or a non-rate-limit error
        return data;
      } catch (e) {
        lastError = e;
        console.warn(`[AI Proxy] Fetch failed for ${modelKey}:`, e);
      }
    }

    // If all models failed or no keys were available
    return { text: "", error: `All configured AI providers failed. Last error: ${lastError}` };
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
  },

  // Multi-AI Verified Tutor Solver
  tutorSolve: async (payload: {
    problem: string;
    subject?: string;
    difficulty?: string;
    active_providers?: string[];
    api_keys?: Record<string, string>;
    force_fresh?: boolean;
  }): Promise<TutorSolveResponse> => {
    const res = await fetch(`${API_BASE}/tutor/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tutor Solver Error (${res.status}): ${errText}`);
    }
    return res.json();
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

export interface TutorGruca {
  given: string[];
  required: string[];
  assumptions: string[];
  equations: string[];
  calculations: string[];
  units: string[];
  answer: string;
  summary?: string;
}

export interface VerificationAuditData {
  solvers_checked: { solver: string; type: string; value: string; unit: string; status: string }[];
  agreement_score: number;
  disagreement_detected: boolean;
  disagreement_notes?: string;
  calculation_engine_verified: boolean;
  deterministic_result?: string;
  units_verified: boolean;
  units_notes?: string;
  sanity_checked: boolean;
  sanity_notes: string[];
  confidence_status: 'Verified' | 'Verified with stated assumptions' | 'Needs clarification';
  cache_hit: boolean;
  stages_count: number;
  problem_decomposition?: string[];
}

export interface TutorSolveResponse {
  problem_hash: string;
  subject: string;
  difficulty: string;
  gruca: TutorGruca;
  audit: VerificationAuditData;
  error?: string;
}
