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

// Complete 118 Periodic Table Elements Data
const RAW_ELEMENTS_DATA: [number, string, string, string, number, number, number][] = [
  [1, 'H', 'Hydrogen', 'nonmetal', 1.008, 1, 1],
  [2, 'He', 'Helium', 'noble gas', 4.0026, 1, 18],
  [3, 'Li', 'Lithium', 'alkali metal', 6.94, 2, 1],
  [4, 'Be', 'Beryllium', 'alkaline earth', 9.0122, 2, 2],
  [5, 'B', 'Boron', 'metalloid', 10.81, 2, 13],
  [6, 'C', 'Carbon', 'nonmetal', 12.011, 2, 14],
  [7, 'N', 'Nitrogen', 'nonmetal', 14.007, 2, 15],
  [8, 'O', 'Oxygen', 'nonmetal', 15.999, 2, 16],
  [9, 'F', 'Fluorine', 'halogen', 18.998, 2, 17],
  [10, 'Ne', 'Neon', 'noble gas', 20.180, 2, 18],
  [11, 'Na', 'Sodium', 'alkali metal', 22.990, 3, 1],
  [12, 'Mg', 'Magnesium', 'alkaline earth', 24.305, 3, 2],
  [13, 'Al', 'Aluminium', 'post-transition', 26.982, 3, 13],
  [14, 'Si', 'Silicon', 'metalloid', 28.085, 3, 14],
  [15, 'P', 'Phosphorus', 'nonmetal', 30.974, 3, 15],
  [16, 'S', 'Sulfur', 'nonmetal', 32.06, 3, 16],
  [17, 'Cl', 'Chlorine', 'halogen', 35.45, 3, 17],
  [18, 'Ar', 'Argon', 'noble gas', 39.948, 3, 18],
  [19, 'K', 'Potassium', 'alkali metal', 39.098, 4, 1],
  [20, 'Ca', 'Calcium', 'alkaline earth', 40.078, 4, 2],
  [21, 'Sc', 'Scandium', 'transition metal', 44.956, 4, 3],
  [22, 'Ti', 'Titanium', 'transition metal', 47.867, 4, 4],
  [23, 'V', 'Vanadium', 'transition metal', 50.942, 4, 5],
  [24, 'Cr', 'Chromium', 'transition metal', 51.996, 4, 6],
  [25, 'Mn', 'Manganese', 'transition metal', 54.938, 4, 7],
  [26, 'Fe', 'Iron', 'transition metal', 55.845, 4, 8],
  [27, 'Co', 'Cobalt', 'transition metal', 58.933, 4, 9],
  [28, 'Ni', 'Nickel', 'transition metal', 58.693, 4, 10],
  [29, 'Cu', 'Copper', 'transition metal', 63.546, 4, 11],
  [30, 'Zn', 'Zinc', 'transition metal', 65.38, 4, 12],
  [31, 'Ga', 'Gallium', 'post-transition', 69.723, 4, 13],
  [32, 'Ge', 'Germanium', 'metalloid', 72.630, 4, 14],
  [33, 'As', 'Arsenic', 'metalloid', 74.922, 4, 15],
  [34, 'Se', 'Selenium', 'nonmetal', 78.971, 4, 16],
  [35, 'Br', 'Bromine', 'halogen', 79.904, 4, 17],
  [36, 'Kr', 'Krypton', 'noble gas', 83.798, 4, 18],
  [37, 'Rb', 'Rubidium', 'alkali metal', 85.468, 5, 1],
  [38, 'Sr', 'Strontium', 'alkaline earth', 87.62, 5, 2],
  [39, 'Y', 'Yttrium', 'transition metal', 88.906, 5, 3],
  [40, 'Zr', 'Zirconium', 'transition metal', 91.224, 5, 4],
  [41, 'Nb', 'Niobium', 'transition metal', 92.906, 5, 5],
  [42, 'Mo', 'Molybdenum', 'transition metal', 95.95, 5, 6],
  [43, 'Tc', 'Technetium', 'transition metal', 98, 5, 7],
  [44, 'Ru', 'Ruthenium', 'transition metal', 101.07, 5, 8],
  [45, 'Rh', 'Rhodium', 'transition metal', 102.91, 5, 9],
  [46, 'Pd', 'Palladium', 'transition metal', 106.42, 5, 10],
  [47, 'Ag', 'Silver', 'transition metal', 107.87, 5, 11],
  [48, 'Cd', 'Cadmium', 'transition metal', 112.41, 5, 12],
  [49, 'In', 'Indium', 'post-transition', 114.82, 5, 13],
  [50, 'Sn', 'Tin', 'post-transition', 118.71, 5, 14],
  [51, 'Sb', 'Antimony', 'metalloid', 121.76, 5, 15],
  [52, 'Te', 'Tellurium', 'metalloid', 127.60, 5, 16],
  [53, 'I', 'Iodine', 'halogen', 126.90, 5, 17],
  [54, 'Xe', 'Xenon', 'noble gas', 131.29, 5, 18],
  [55, 'Cs', 'Caesium', 'alkali metal', 132.91, 6, 1],
  [56, 'Ba', 'Barium', 'alkaline earth', 137.33, 6, 2],
  [57, 'La', 'Lanthanum', 'lanthanide', 138.91, 6, 3],
  [58, 'Ce', 'Cerium', 'lanthanide', 140.12, 6, 3],
  [59, 'Pr', 'Praseodymium', 'lanthanide', 140.91, 6, 3],
  [60, 'Nd', 'Neodymium', 'lanthanide', 144.24, 6, 3],
  [61, 'Pm', 'Promethium', 'lanthanide', 145, 6, 3],
  [62, 'Sm', 'Samarium', 'lanthanide', 150.36, 6, 3],
  [63, 'Eu', 'Europium', 'lanthanide', 151.96, 6, 3],
  [64, 'Gd', 'Gadolinium', 'lanthanide', 157.25, 6, 3],
  [65, 'Tb', 'Terbium', 'lanthanide', 158.93, 6, 3],
  [66, 'Dy', 'Dysprosium', 'lanthanide', 162.50, 6, 3],
  [67, 'Ho', 'Holmium', 'lanthanide', 164.93, 6, 3],
  [68, 'Er', 'Erbium', 'lanthanide', 167.26, 6, 3],
  [69, 'Tm', 'Thulium', 'lanthanide', 168.93, 6, 3],
  [70, 'Yb', 'Ytterbium', 'lanthanide', 173.05, 6, 3],
  [71, 'Lu', 'Lutetium', 'lanthanide', 174.97, 6, 3],
  [72, 'Hf', 'Hafnium', 'transition metal', 178.49, 6, 4],
  [73, 'Ta', 'Tantalum', 'transition metal', 180.95, 6, 5],
  [74, 'W', 'Tungsten', 'transition metal', 183.84, 6, 6],
  [75, 'Re', 'Rhenium', 'transition metal', 186.21, 6, 7],
  [76, 'Os', 'Osmium', 'transition metal', 190.23, 6, 8],
  [77, 'Ir', 'Iridium', 'transition metal', 192.22, 6, 9],
  [78, 'Pt', 'Platinum', 'transition metal', 195.08, 6, 10],
  [79, 'Au', 'Gold', 'transition metal', 196.97, 6, 11],
  [80, 'Hg', 'Mercury', 'transition metal', 200.59, 6, 12],
  [81, 'Tl', 'Thallium', 'post-transition', 204.38, 6, 13],
  [82, 'Pb', 'Lead', 'post-transition', 207.2, 6, 14],
  [83, 'Bi', 'Bismuth', 'post-transition', 208.98, 6, 15],
  [84, 'Po', 'Polonium', 'post-transition', 209, 6, 16],
  [85, 'At', 'Astatine', 'metalloid', 210, 6, 17],
  [86, 'Rn', 'Radon', 'noble gas', 222, 6, 18],
  [87, 'Fr', 'Francium', 'alkali metal', 223, 7, 1],
  [88, 'Ra', 'Radium', 'alkaline earth', 226, 7, 2],
  [89, 'Ac', 'Actinium', 'actinide', 227, 7, 3],
  [90, 'Th', 'Thorium', 'actinide', 232.04, 7, 3],
  [91, 'Pa', 'Protactinium', 'actinide', 231.04, 7, 3],
  [92, 'U', 'Uranium', 'actinide', 238.03, 7, 3],
  [93, 'Np', 'Neptunium', 'actinide', 237, 7, 3],
  [94, 'Pu', 'Plutonium', 'actinide', 244, 7, 3],
  [95, 'Am', 'Americium', 'actinide', 243, 7, 3],
  [96, 'Cm', 'Curium', 'actinide', 247, 7, 3],
  [97, 'Bk', 'Berkelium', 'actinide', 247, 7, 3],
  [98, 'Cf', 'Californium', 'actinide', 251, 7, 3],
  [99, 'Es', 'Einsteinium', 'actinide', 252, 7, 3],
  [100, 'Fm', 'Fermium', 'actinide', 257, 7, 3],
  [101, 'Md', 'Mendelevium', 'actinide', 258, 7, 3],
  [102, 'No', 'Nobelium', 'actinide', 259, 7, 3],
  [103, 'Lr', 'Lawrencium', 'actinide', 266, 7, 3],
  [104, 'Rf', 'Rutherfordium', 'transition metal', 267, 7, 4],
  [105, 'Db', 'Dubnium', 'transition metal', 268, 7, 5],
  [106, 'Sg', 'Seaborgium', 'transition metal', 269, 7, 6],
  [107, 'Bh', 'Bohrium', 'transition metal', 270, 7, 7],
  [108, 'Hs', 'Hassium', 'transition metal', 277, 7, 8],
  [109, 'Mt', 'Meitnerium', 'transition metal', 278, 7, 9],
  [110, 'Ds', 'Darmstadtium', 'transition metal', 281, 7, 10],
  [111, 'Rg', 'Roentgenium', 'transition metal', 282, 7, 11],
  [112, 'Cn', 'Copernicium', 'transition metal', 285, 7, 12],
  [113, 'Nh', 'Nihonium', 'post-transition', 286, 7, 13],
  [114, 'Fl', 'Flerovium', 'post-transition', 289, 7, 14],
  [115, 'Mc', 'Moscovium', 'post-transition', 290, 7, 15],
  [116, 'Lv', 'Livermorium', 'post-transition', 293, 7, 16],
  [117, 'Ts', 'Tennessine', 'halogen', 294, 7, 17],
  [118, 'Og', 'Oganesson', 'noble gas', 294, 7, 18],
];

const FALLBACK_ELEMENTS: SubstanceSummary[] = RAW_ELEMENTS_DATA.map(([num, sym, name, cat, mw, p, g]) => ({
  id: `el_${num}`,
  name,
  formula: sym,
  type: 'element',
  symbol: sym,
  atomic_number: num,
  category: cat,
  molar_mass: mw,
  period: p,
  group_number: g,
}));

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
    try {
      return await fetchJSON<SubstanceDetail>(`${API_BASE}/substances/${id}`, 3000);
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
  getSubstanceReactions: async (id: string): Promise<Reaction[]> => {
    try {
      return await fetchJSON<Reaction[]>(`${API_BASE}/substances/${id}/reactions`, 3000);
    } catch {
      return [];
    }
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

  aiProxy: (payload: { provider?: string; api_key?: string; prompt: string; model?: string; system_prompt?: string }) => {
    let prov = payload.provider;
    let key = payload.api_key;
    let mod = payload.model;

    // Retrieve from active_models if key or provider is missing
    if (!key || !prov) {
      try {
        const saved = JSON.parse(localStorage.getItem('active_models') || '{}');
        const firstActiveKey = Object.keys(saved).find(k => saved[k] === true);
        const apiKeysObj = JSON.parse(localStorage.getItem('chembase_system_api_keys') || '{}');
        
        if (firstActiveKey) {
          const [parsedProv, parsedMod] = firstActiveKey.split(':');
          prov = parsedProv;
          key = apiKeysObj[parsedProv] || localStorage.getItem(`${parsedProv}_api_key`) || '';
          mod = mod || parsedMod;
        } else {
          prov = 'gemini';
          key = apiKeysObj['gemini'] || localStorage.getItem('gemini_api_key') || '';
        }
      } catch (e) {
        prov = 'gemini';
        key = localStorage.getItem('gemini_api_key') || '';
      }
    }

    // Backend ignores system_prompt, so merge it into prompt
    let finalPrompt = payload.prompt;
    if (payload.system_prompt) {
      finalPrompt = `System Instructions: ${payload.system_prompt}\n\nUser Request: ${payload.prompt}`;
    }

    return fetch(`${API_BASE}/ai/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        provider: prov,
        api_key: key,
        prompt: finalPrompt,
        model: mod
      })
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
