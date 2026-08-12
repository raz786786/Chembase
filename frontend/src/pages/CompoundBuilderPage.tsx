import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Microscope, 
  History, 
  FlaskConical, 
  X, 
  ArrowRight, 
  Database,
  Beaker,
  TrendingUp,
  Download,
  Printer,
  ShieldAlert
} from 'lucide-react';
import { FormulaDisplay } from '../components/FormulaDisplay';
import { resolveInputTokens, extractElementsFromFormula, isStrictSubset } from '../utils/chemistry';
import { LOCAL_COMPOUNDS, type UnifiedCompound } from '../data/localCompounds';
import { api } from '../api';

// --- Module-scope types ---
interface SearchHistoryEntry {
  elements: string[];
  results: UnifiedCompound[];
  timestamp: number;
  resultCount: number;
}

// --- Helper: extract a readable message from an unknown error ---
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// --- Helper: normalize formula for deduplication ---
function normalizeFormula(formula: string): string {
  const parsed: Record<string, number> = {};
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match;
  while ((match = regex.exec(formula)) !== null) {
    const el = match[1];
    const count = match[2] ? parseInt(match[2]) : 1;
    parsed[el] = (parsed[el] || 0) + count;
  }
  return Object.keys(parsed).sort().map(k => k + parsed[k]).join('');
}

// --- Helpers: read settings from localStorage ---
function getActiveSources(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem('active_sources') || '{"local":true,"materials":true}'); }
  catch { return { local: true, materials: true }; } // ignore corrupt JSON
}

// Returns list of { provider, modelId, label } for all checked models
function getActiveAIModels(): { provider: string; modelId: string; label: string }[] {
  const active: { provider: string; modelId: string; label: string }[] = [];
  try {
    const saved = JSON.parse(localStorage.getItem('active_models') || '{}');
    // Import PROVIDER_MODELS catalog inline to avoid circular imports
    const catalog: Record<string, { id: string; label: string }[]> = {
      gemini:     [{ id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }, { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' }],
      groq:       [
        { id: 'llama-3.3-70b-versatile', label: 'Groq Llama 3.3 70B' },
        { id: 'llama-3.1-8b-instant', label: 'Groq Llama 3.1 8B' },
        { id: 'qwen/qwen3.6-27b', label: 'Groq Qwen 3.6 27B' },
        { id: 'openai/gpt-oss-120b', label: 'Groq GPT OSS 120B' },
        { id: 'groq/compound', label: 'Groq Compound' }
      ],
      openrouter: [
        { id: 'nvidia/nemotron-3-nano-30b-a3b:free', label: 'OR Nemotron Nano 30B (Free)' },
        { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'OR Nemotron Super 120B (Free)' },
        { id: 'openai/gpt-oss-20b:free', label: 'OR GPT OSS 20B (Free)' },
        { id: 'google/gemma-4-26b-a4b-it:free', label: 'OR Gemma 4 26B (Free)' },
        { id: 'cohere/north-mini-code:free', label: 'OR Cohere North Code (Free)' }
      ],
      nvidia:     [
        { id: 'meta/llama-3.1-8b-instruct', label: 'Nvidia Llama 3.1 8B' },
        { id: 'meta/llama-3.1-70b-instruct', label: 'Nvidia Llama 3.1 70B' }
      ],
      nova:       [
        { id: 'nova-lite-v1', label: 'Amazon Nova Lite' },
        { id: 'nova-micro-v1', label: 'Amazon Nova Micro' },
        { id: 'nova-pro-v1', label: 'Amazon Nova Pro' }
      ]
    };
    for (const [provider, models] of Object.entries(catalog)) {
      for (const m of models) {
        if (saved[`${provider}:${m.id}`]) {
          active.push({ provider, modelId: m.id, label: m.label });
        }
      }
    }
    // If nothing selected, fall back to first of each provider that has a key
    if (active.length === 0) {
      for (const [provider, models] of Object.entries(catalog)) {
        active.push({ provider, modelId: models[0].id, label: models[0].label });
      }
    }
  } catch { /* ignore malformed settings */ }
  return active;
}

function getApiKey(provider: string): string {
  const keyMap: Record<string, string> = {
    gemini: 'gemini_api_key',
    groq: 'groq_api_key', openrouter: 'openrouter_api_key', materials: 'materials_api_key',
    nvidia: 'nvidia_api_key'
  };
  return localStorage.getItem(keyMap[provider] || '') || '';
}

// Compact but exhaustive prompt — stays under Groq's 6K TPM (prompt ~200 + max_tokens 4096 = ~4300)
function buildAIPrompt(elements: string[]): string {
  const el = elements.join(', ');
  return `List ALL possible chemical compounds made ONLY from: ${el}. Be exhaustive. List up to 30 unique compounds.
CRITICAL: To save tokens, keep all text fields (explanations, conditions, uses) under 5 words!
Return ONLY a valid JSON object with a single key "compounds" containing an array of objects. No markdown.
Format: {"compounds": [ {"name":"...","formula":"...","molarMass":0,"state":"solid|liquid|gas","valuableProduct":true,"valuableExplanation":"...","synthesis":{"equation":"...","conditions":"...","enthalpy":0,"reactionType":"..."},"ghsPictograms":[],"industrialUses":[]} ]}
ONLY elements: ${el}. No other elements allowed.`;
}

export default function CompoundBuilderPage() {
  const [input, setInput] = useState('');
  const [activeElements, setActiveElements] = useState<string[]>([]);
  
  // Pipeline State
  const [isSearching, setIsSearching] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [results, setResults] = useState<UnifiedCompound[]>([]);
  // Per-model status: "provider:modelId" → "working" | error string
  const [providerStatus, setProviderStatus] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('model_status') || '{}'); } catch { return {}; }
  });

  // Filters
  const [filterQuery] = useState('');
  const [sortMode] = useState<'Relevance' | 'Name' | 'Mass'>('Relevance');
  const [showValuableOnly] = useState(false);

  // Detail Modal
  const [selectedCompound, setSelectedCompound] = useState<UnifiedCompound | null>(null);
  type DetailTab = 'overview' | 'physical' | 'synthesis' | 'hazards';
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  // Search History
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem('compound_search_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const saveToHistory = (elements: string[], compounds: UnifiedCompound[]) => {
    const entry: SearchHistoryEntry = {
      elements,
      results: compounds,
      timestamp: Date.now(),
      resultCount: compounds.length,
    };
    setSearchHistory(prev => {
      const updated = [entry, ...prev.filter(h => h.elements.sort().join(',') !== elements.sort().join(','))].slice(0, 10);
      localStorage.setItem('compound_search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const loadFromHistory = (entry: SearchHistoryEntry) => {
    setActiveElements(entry.elements);
    setResults(entry.results);
    setStatusLog([`📂 Loaded from history: ${entry.elements.join(', ')} (${entry.resultCount} compounds)`]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('compound_search_history');
  };

  // Persist model status so App.tsx can read it for badges
  useEffect(() => {
    localStorage.setItem('model_status', JSON.stringify(providerStatus));
  }, [providerStatus]);

  // Auto-load from homepage navigation (reads history directly from localStorage so
  // the mount-only effect stays dependency-free and defers state updates off the sync path)
  useEffect(() => {
    const idx = localStorage.getItem('load_history_index');
    if (idx === null) return;
    localStorage.removeItem('load_history_index');
    const historyIndex = parseInt(idx, 10);
    const stored = localStorage.getItem('compound_search_history');
    if (!stored) return;
    let history: SearchHistoryEntry[];
    try { history = JSON.parse(stored); } catch { return; }
    const entry = history[historyIndex];
    if (!entry) return;
    const t = setTimeout(() => {
      setActiveElements(entry.elements);
      setResults(entry.results);
      setStatusLog([`📂 Loaded from history: ${entry.elements.join(', ')} (${entry.resultCount} compounds)`]);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const addLog = (msg: string) => setStatusLog(prev => [...prev, msg]);

  const removeElement = (el: string) => {
    setActiveElements(prev => prev.filter(x => x !== el));
  };

  const parseInput = () => {
    const tokens = resolveInputTokens(input);
    const newElements = Array.from(new Set([...activeElements, ...tokens]));
    setActiveElements(newElements);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      parseInput();
    }
  };

  const executePipeline = async () => {
    let finalElements: string[] = [];
    const combinedResults = new Map<string, UnifiedCompound>();
    const newStatus: Record<string, string> = {};
    try {
      // --- New logic: Auto-parse input if user clicked search without hitting Enter ---
      finalElements = [...activeElements];
      if (input.trim()) {
        const tokens = resolveInputTokens(input);
        finalElements = Array.from(new Set([...finalElements, ...tokens]));
        setActiveElements(finalElements);
        setInput('');
      }

      if (finalElements.length === 0) return;
      
      localStorage.setItem('lastSearchedElements', JSON.stringify(finalElements));
      setIsSearching(true);
      setResults([]);
      setStatusLog([]);
      setProviderStatus({});
      addLog(`🚀 Starting pipeline for: ${finalElements.join(', ')}`);

      const activeSources = getActiveSources();

      // Formula-normalized deduplication + data merging with strict sanitization
      const mergeCompound = (c: unknown) => {
        if (!c || typeof c !== 'object' || Array.isArray(c)) return;
        const obj = c as Record<string, unknown>;
        const formula = obj.formula;
        if (typeof formula !== 'string' || !formula) return;
        if (!isStrictSubset(formula, finalElements)) return;
        
        const key = normalizeFormula(formula);
        
        // Sanitize: Force numbers and handle strings/nulls
        const toNum = (v: unknown): number | undefined => {
          if (v === undefined || v === null || v === '') return undefined;
          const n = Number(v);
          return Number.isFinite(n) ? n : undefined;
        };
        const toStr = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
        const toStrArray = (v: unknown): string[] =>
          Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
        // Accept true, 1, or "true" — models return booleans inconsistently
        const toBool = (v: unknown): boolean => v === true || v === 1 || v === 'true';

        let cleanState: 'solid' | 'liquid' | 'gas' | undefined = undefined;
        if (obj.state === 'solid' || obj.state === 'liquid' || obj.state === 'gas') {
          cleanState = obj.state;
        }

        const sanitized: UnifiedCompound = {
          name: toStr(obj.name, 'Unknown Compound'),
          formula,
          molarMass: toNum(obj.molarMass),
          density: toNum(obj.density),
          meltingPoint: toNum(obj.meltingPoint),
          boilingPoint: toNum(obj.boilingPoint),
          state: cleanState,
          source: toStr(obj.source, 'Unknown Source'),
          valuableProduct: toBool(obj.valuableProduct),
          valuableExplanation: toStr(obj.valuableExplanation),
          synthesis: (obj.synthesis && typeof obj.synthesis === 'object' && !Array.isArray(obj.synthesis))
            ? (obj.synthesis as UnifiedCompound['synthesis'])
            : undefined,
          iupacName: toStr(obj.iupacName),
          ghsPictograms: toStrArray(obj.ghsPictograms),
          industrialUses: toStrArray(obj.industrialUses),
          pubchemCid: toNum(obj.pubchemCid)
        };
        
        if (!combinedResults.has(key)) {
          combinedResults.set(key, sanitized);
        } else {
          const existing = combinedResults.get(key)!;
          combinedResults.set(key, {
            ...existing,
            molarMass: sanitized.molarMass || existing.molarMass,
            density: sanitized.density || existing.density,
            meltingPoint: sanitized.meltingPoint || existing.meltingPoint,
            boilingPoint: sanitized.boilingPoint || existing.boilingPoint,
            state: sanitized.state || existing.state,
            ghsPictograms: (sanitized.ghsPictograms && sanitized.ghsPictograms.length > 0) ? sanitized.ghsPictograms : existing.ghsPictograms,
            industrialUses: (sanitized.industrialUses && sanitized.industrialUses.length > 0) ? sanitized.industrialUses : existing.industrialUses,
            valuableProduct: sanitized.valuableProduct || existing.valuableProduct,
            valuableExplanation: sanitized.valuableExplanation || existing.valuableExplanation,
            synthesis: sanitized.synthesis || existing.synthesis,
            iupacName: sanitized.iupacName || existing.iupacName,
            source: existing.source.includes(sanitized.source) ? existing.source : existing.source + ' + ' + sanitized.source
          });
        }
      };

    const promises: Promise<void>[] = [];
    const aiPrompt = buildAIPrompt(finalElements);

    // Per-model AI call — passes exact model ID to backend, tracks status by "provider:modelId"
    const callModel = async (provider: string, modelId: string, label: string) => {
      const key = getApiKey(provider);
      const statusKey = `${provider}:${modelId}`;
      if (!key) {
        newStatus[statusKey] = 'No API key';
        addLog(`⚠️ ${label}: No API key configured — skipping.`);
        return;
      }
      addLog(`✨ Querying ${label}...`);
      try {
        const aiRes = await api.aiProxy({ provider, api_key: key, model: modelId, prompt: aiPrompt });
        if (aiRes.error) {
          newStatus[statusKey] = aiRes.error;
          addLog(`❌ ${label}: ${aiRes.error}`);
          return;
        }
        if (aiRes.text) {
          // Robust cleaning: strip ALL thinking/reasoning blocks, code fences, markdown
          let cleaned = aiRes.text
              .replace(/<think>[\s\S]*?<\/think>/gi, '')  // Qwen3 thinking
              .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')  // other thinking
              .replace(/```json\s*/gi, '').replace(/```\s*/gi, '')  // code fences
              .replace(/^[\s\S]*?(?=[{[])/m, '')  // strip everything before first [ or {
              .trim();

          // Handle models that output {"compounds": [...]} instead of [...]
          if (cleaned.startsWith('{')) {
            try {
              const wrapper = JSON.parse(cleaned);
              const arr = wrapper.compounds || wrapper.results || wrapper.data || wrapper.chemicals;
              if (Array.isArray(arr)) {
                cleaned = JSON.stringify(arr);
              }
            } catch {
              // Extract array from inside the object
              const innerArr = cleaned.match(/\[[\s\S]*\]/s);
              if (innerArr) cleaned = innerArr[0];
            }
          }

          // Try to repair truncated JSON (model ran out of tokens mid-response)
          if (cleaned.startsWith('[') && !cleaned.endsWith(']')) {
            const lastBrace = cleaned.lastIndexOf('}');
            if (lastBrace > 0) cleaned = cleaned.substring(0, lastBrace + 1) + ']';
          } else if (cleaned.startsWith('{') && !cleaned.endsWith('}')) {
            const lastBrace = cleaned.lastIndexOf('}');
            if (lastBrace > 0) cleaned = cleaned.substring(0, lastBrace + 1) + ']}';
          }

          // Fix common JSON issues: trailing commas
          cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

          const jsonMatch = cleaned.match(/\[.*\]/s);
          if (jsonMatch) {
            try {
              const aiCompounds = JSON.parse(jsonMatch[0]);
              let aiFound = 0;
              for (const c of aiCompounds) {
                mergeCompound({ ...c, source: label });
                aiFound++;
              }
              newStatus[statusKey] = 'working';
              addLog(`✅ ${label} → ${aiFound} compounds.`);
              setResults(Array.from(combinedResults.values()));
            } catch {
              // Last resort: try to extract individual JSON objects
              const objMatches = cleaned.matchAll(/\{[^{}]*"name"\s*:\s*"[^"]+"[^{}]*\}/g);
              let rescued = 0;
              for (const om of objMatches) {
                try {
                  const obj = JSON.parse(om[0]);
                  mergeCompound({ ...obj, source: label });
                  rescued++;
                } catch { /* skip malformed object */ }
              }
              if (rescued > 0) {
                newStatus[statusKey] = 'working';
                addLog(`✅ ${label} → ${rescued} compounds (partial parse).`);
                setResults(Array.from(combinedResults.values()));
              } else {
                newStatus[statusKey] = 'JSON parse failed';
                addLog(`⚠️ ${label}: Could not parse JSON response.`);
              }
            }
          } else {
            newStatus[statusKey] = 'No JSON in response';
            addLog(`⚠️ ${label}: Response contained no JSON array.`);
          }
        }
      } catch (err: unknown) {
        newStatus[statusKey] = errMsg(err).slice(0, 80) || 'Unknown error';
        addLog(`❌ ${label}: ${errMsg(err)}`);
      }
    };

    // 1. LOCAL SEARCH
    if (activeSources.local) {
      promises.push((async () => {
        addLog('⚡ Searching local database...');
        let found = 0;
        for (const lc of LOCAL_COMPOUNDS) {
          if (isStrictSubset(lc.formula, finalElements)) {
            mergeCompound(lc);
            found++;
          }
        }
        addLog(`✅ Local DB yielded ${found} compounds.`);
        setResults(Array.from(combinedResults.values()));
      })());
    }

    // 2. MATERIALS PROJECT
    if (activeSources.materials) {
      const mpKey = getApiKey('materials');
      if (mpKey) {
        promises.push((async () => {
          addLog('🔬 Querying Materials Project API...');
          try {
            const chemsys = finalElements.join('-');
            const data = await api.getMaterialsProjectData(chemsys, mpKey);
            if (data && data.data) {
              let mpFound = 0;
              for (const item of data.data) {
                if (!item.formula_pretty) continue;
                mergeCompound({
                  name: item.formula_pretty + ' (Crystal)',
                  formula: item.formula_pretty,
                  density: item.density,
                  source: 'Materials Project',
                  valuableExplanation: item.is_stable ? 'Stable crystalline structure' : undefined
                });
                mpFound++;
              }
              addLog(`✅ Materials Project yielded ${mpFound} crystal structures.`);
              setResults(Array.from(combinedResults.values()));
            }
          } catch (err: unknown) {
            addLog(`❌ Materials Project error: ${errMsg(err)}`);
          }
        })());
      }
    }

    // 3. AI MODELS — fire each selected model in parallel
    const activeAIModels = getActiveAIModels();
    if (activeAIModels.length === 0) {
      addLog('⚠️ No AI models selected. Enable models in Pipeline Settings.');
    } else {
      addLog(`✨ Querying ${activeAIModels.length} AI model(s) in parallel...`);
      for (const { provider, modelId, label } of activeAIModels) {
        promises.push(callModel(provider, modelId, label));
      }
    }

    // Wait for all sources
    await Promise.allSettled(promises);
    addLog(`📊 Phase 1 complete: ${combinedResults.size} unique compounds from all sources.`);

    // 4. PUBCHEM ENRICHMENT PHASE — enrich AI-discovered compounds with authoritative data
    const compoundsToEnrich = Array.from(combinedResults.values())
      .filter(c => !c.source.includes('Local')) // Local already has good data
      .map(c => ({ name: c.name, formula: c.formula }));

    if (compoundsToEnrich.length > 0) {
      addLog(`🧪 Enriching ${compoundsToEnrich.length} compounds via PubChem...`);
      try {
        const enriched = await api.pubchemEnrich(compoundsToEnrich);
        if (Array.isArray(enriched)) {
          for (const e of enriched) {
            mergeCompound({
              name: e.name,
              formula: e.formula,
              molarMass: e.molarMass,
              iupacName: e.iupacName,
              ghsPictograms: e.ghsPictograms,
              pubchemCid: e.pubchemCid,
              source: 'PubChem'
            });
          }
          addLog(`✅ PubChem enriched ${enriched.length} compounds with authoritative data.`);
        } else {
          addLog('⚠️ PubChem enrichment returned invalid format.');
        }
        setResults(Array.from(combinedResults.values()));
      } catch (err: unknown) {
        addLog(`⚠️ PubChem enrichment partial: ${errMsg(err)}`);
      }
    }

    // Finalize
    const finalResults = Array.from(combinedResults.values());
    setResults(finalResults);
    setProviderStatus(newStatus);
    addLog(`🎉 Pipeline Complete! Discovered ${combinedResults.size} unique compounds.`);
    if (finalResults.length > 0) saveToHistory([...finalElements], finalResults);
    } catch (err: unknown) {
      addLog(`❌ Pipeline failed: ${errMsg(err)}`);
      // Still save partial results to history if we got any
      const partialResults = Array.from(combinedResults.values());
      if (partialResults.length > 0) {
        setResults(partialResults);
        saveToHistory([...finalElements], partialResults);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const displayedResults = results
    .filter(c => showValuableOnly ? c.valuableProduct : true)
    .filter(c => filterQuery ? c.name.toLowerCase().includes(filterQuery.toLowerCase()) || c.formula.toLowerCase().includes(filterQuery.toLowerCase()) : true)
    .sort((a, b) => {
      if (sortMode === 'Name') return a.name.localeCompare(b.name);
      if (sortMode === 'Mass') return (b.molarMass || 0) - (a.molarMass || 0);
      const setA = a.formula ? extractElementsFromFormula(a.formula).length : 0;
      const setB = b.formula ? extractElementsFromFormula(b.formula).length : 0;
      return setB - setA;
    });

  return (
    <div className="animate-in fade-in duration-700">
      
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Microscope className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50 mb-2">Universal Compound Finder</h1>
        <p className="text-surface-500">Discover compounds by entering elemental symbols or names. Powered by AI and real-time databases.</p>
      </div>

      {/* Main Search Card */}
      <div className="glass p-8 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-xl max-w-4xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Enter elements (e.g. C, Hydrogen, Fe) and hit Enter..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching}
              className="w-full bg-surface-50 dark:bg-surface-900 border-2 border-surface-100 dark:border-surface-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none text-surface-900 dark:text-surface-50"
            />
          </div>
          <button 
            onClick={executePipeline}
            disabled={(activeElements.length === 0 && !input.trim()) || isSearching}
            className="bg-primary-600 hover:bg-primary-700 text-surface-50 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {isSearching ? <div className="w-5 h-5 border-2 border-surface-50/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isSearching ? 'SEARCHING...' : 'FIND COMPOUNDS'}
          </button>
        </div>
        
        {/* Chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {activeElements.length === 0 ? (
            <span className="px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-full text-xs font-medium text-surface-500">No elements selected.</span>
          ) : (
            activeElements.map(el => (
              <div key={el} className="px-4 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-bold flex items-center gap-2 border border-primary-100 dark:border-primary-800/50">
                {el}
                <button onClick={() => removeElement(el)} className="hover:text-rose-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Status Log */}
        {statusLog.length > 0 && (
          <div className="mt-8 pt-8 border-t border-surface-100 dark:border-surface-800">
            <div className="bg-surface-50 dark:bg-surface-900/50 rounded-xl p-4 font-mono text-[10px] text-surface-500 max-h-32 overflow-y-auto scrollbar-hide">
              {statusLog.map((log, i) => <div key={i}>{log}</div>)}
              {isSearching && <div className="text-primary-500 animate-pulse mt-1">Processing pipeline...</div>}
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-3">
              <Beaker className="w-6 h-6 text-primary-600" /> Discovered {results.length} Compounds
            </h2>
            <div className="flex gap-3">
              <button className="p-2 glass rounded-xl text-surface-500 hover:text-primary-600 transition-colors"><Download className="w-5 h-5" /></button>
              <button className="p-2 glass rounded-xl text-surface-500 hover:text-primary-600 transition-colors"><Printer className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {displayedResults.map(c => (
              <div 
                key={c.formula + c.name} 
                onClick={() => setSelectedCompound(c)}
                className="glass p-6 rounded-3xl border border-surface-200 dark:border-surface-800 hover:border-primary-500 hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black tracking-tight text-surface-900 dark:text-surface-50 group-hover:text-primary-600 transition-colors">
                      <FormulaDisplay formula={c.formula} />
                    </span>
                    <span className="text-xs font-bold text-surface-400 mt-1 uppercase tracking-wider">{c.source}</span>
                  </div>
                  {c.valuableProduct && (
                    <div className="px-2 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-600 rounded text-[10px] font-bold uppercase">Valuable</div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-2">{c.name}</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
                    <Database className="w-3.5 h-3.5" /> {typeof c.molarMass === 'number' ? c.molarMass.toFixed(2) : '--'} g/mol
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" /> {typeof c.density === 'number' ? c.density.toFixed(2) : '--'} g/cm³
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 text-xs font-bold text-primary-600 group-hover:bg-primary-600 group-hover:text-surface-50 transition-all flex items-center justify-center gap-2">
                  View Full Report <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      {searchHistory.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2 text-surface-900 dark:text-surface-50">
              <History className="w-4 h-4 text-primary-500" /> Recent Discoveries
            </h3>
            <button onClick={clearHistory} className="text-xs font-bold text-surface-400 hover:text-primary-500 transition-colors">Clear history</button>
          </div>
          <div className="space-y-4">
            {searchHistory.map((entry, i) => (
              <div 
                key={i}
                onClick={() => loadFromHistory(entry)}
                className="flex items-center gap-4 p-4 glass rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-400 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-surface-50 transition-colors">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-sm text-surface-900 dark:text-surface-50">{entry.elements.join(' + ')}</h4>
                  <p className="text-xs text-surface-500">{entry.resultCount} compounds discovered</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-surface-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compound Detail Drawer (Same as Element Drawer) */}
      {selectedCompound && (
        <div className="fixed inset-y-0 right-0 z-[110] w-full max-w-lg animate-in slide-in-from-right duration-300">
          <div className="absolute inset-0 bg-surface-900/20 backdrop-blur-sm" onClick={() => setSelectedCompound(null)}></div>
          <div className="relative h-full glass border-l border-surface-200 dark:border-surface-800 shadow-2xl flex flex-col">
            <div className="p-8 border-b border-surface-100 dark:border-surface-800">
              <div className="flex justify-between items-start mb-8">
                <button onClick={() => setSelectedCompound(null)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-surface-500" />
                </button>
                <div className="px-3 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-600 rounded-full text-xs font-black uppercase">Verified Data</div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-primary-600 flex items-center justify-center text-3xl font-black text-surface-50 shadow-xl shadow-primary-500/30">
                  <FormulaDisplay formula={selectedCompound.formula} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-surface-900 dark:text-surface-50 leading-tight">{selectedCompound.name}</h2>
                  <p className="text-lg font-medium text-surface-500">{selectedCompound.iupacName || selectedCompound.formula}</p>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="flex gap-4 border-b border-surface-100 dark:border-surface-800 pb-2">
                <button className={`text-xs font-bold pb-2 ${detailTab === 'overview' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-surface-400'}`} onClick={() => setDetailTab('overview')}>Overview</button>
                <button className={`text-xs font-bold pb-2 ${detailTab === 'physical' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-surface-400'}`} onClick={() => setDetailTab('physical')}>Properties</button>
                <button className={`text-xs font-bold pb-2 ${detailTab === 'synthesis' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-surface-400'}`} onClick={() => setDetailTab('synthesis')}>Synthesis</button>
                <button className={`text-xs font-bold pb-2 ${detailTab === 'hazards' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-surface-400'}`} onClick={() => setDetailTab('hazards')}>Hazards</button>
              </div>

              {detailTab === 'overview' && (
                <div className="space-y-6">
                  {selectedCompound.valuableExplanation && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Industrial Value</h4>
                      <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/40 rounded-2xl p-4">
                        <p className="text-sm text-accent-700 dark:text-accent-300 font-medium">{selectedCompound.valuableExplanation}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Industrial Uses</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompound.industrialUses?.map(use => (
                        <span key={use} className="px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg text-xs font-semibold text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700">{use}</span>
                      )) || <span className="text-sm text-surface-500 italic">No industrial data available.</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Data Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompound.source.split(' + ').map(s => (
                        <span key={s} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg text-xs font-bold border border-primary-200 dark:border-primary-800">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'physical' && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400">Physical Constants</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-surface-50 dark:border-surface-800/50">
                      <span className="text-sm font-medium text-surface-500">Molar Mass</span>
                      <span className="text-sm font-bold text-surface-900 dark:text-surface-50">{selectedCompound.molarMass || '--'} g/mol</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-surface-50 dark:border-surface-800/50">
                      <span className="text-sm font-medium text-surface-500">State (Room Temp)</span>
                      <span className="text-sm font-bold text-surface-900 dark:text-surface-50 capitalize">{selectedCompound.state || '--'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-surface-50 dark:border-surface-800/50">
                      <span className="text-sm font-medium text-surface-500">Density</span>
                      <span className="text-sm font-bold text-surface-900 dark:text-surface-50">{selectedCompound.density || '--'} g/cm³</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-surface-50 dark:border-surface-800/50">
                      <span className="text-sm font-medium text-surface-500">Melting Point</span>
                      <span className="text-sm font-bold text-surface-900 dark:text-surface-50">{selectedCompound.meltingPoint || '--'} °C</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-surface-50 dark:border-surface-800/50">
                      <span className="text-sm font-medium text-surface-500">Boiling Point</span>
                      <span className="text-sm font-bold text-surface-900 dark:text-surface-50">{selectedCompound.boilingPoint || '--'} °C</span>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'synthesis' && (
                <div className="space-y-6">
                  {selectedCompound.synthesis ? (
                    <>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Balanced Equation</h4>
                        <div className="bg-surface-50 dark:bg-surface-900/50 p-5 rounded-2xl border border-surface-100 dark:border-surface-800">
                          <div className="font-mono text-lg text-primary-600 dark:text-primary-400 font-bold">{selectedCompound.synthesis.equation}</div>
                        </div>
                      </div>
                      {selectedCompound.synthesis.reactionType && (
                        <div className="flex justify-between py-2 border-b border-surface-50 dark:border-surface-800/50">
                          <span className="text-sm font-medium text-surface-500">Reaction Type</span>
                          <span className="text-sm font-bold text-surface-900 dark:text-surface-50">{selectedCompound.synthesis.reactionType}</span>
                        </div>
                      )}
                      {selectedCompound.synthesis.conditions && (
                        <div className="flex justify-between py-2 border-b border-surface-50 dark:border-surface-800/50">
                          <span className="text-sm font-medium text-surface-500">Conditions</span>
                          <span className="text-sm font-bold text-surface-900 dark:text-surface-50 text-right max-w-[200px]">{selectedCompound.synthesis.conditions}</span>
                        </div>
                      )}
                      {selectedCompound.synthesis.enthalpy != null && (
                        <div className="flex justify-between py-2 border-b border-surface-50 dark:border-surface-800/50">
                          <span className="text-sm font-medium text-surface-500">Enthalpy (ΔH)</span>
                          <span className={`text-sm font-bold ${selectedCompound.synthesis.enthalpy < 0 ? 'text-primary-500' : 'text-red-500'}`}>
                            {selectedCompound.synthesis.enthalpy} kJ/mol ({selectedCompound.synthesis.enthalpy < 0 ? 'Exothermic' : 'Endothermic'})
                          </span>
                        </div>
                      )}
                      {selectedCompound.synthesis.kinetics && (
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Kinetics</h4>
                          <p className="text-sm text-surface-600 dark:text-surface-400">{selectedCompound.synthesis.kinetics}</p>
                        </div>
                      )}
                      {selectedCompound.synthesis.process && (
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-3">Industrial Process</h4>
                          <p className="text-sm text-surface-600 dark:text-surface-400">{selectedCompound.synthesis.process}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-surface-500 py-12 italic">No synthesis data available for this compound.</div>
                  )}
                </div>
              )}

              {detailTab === 'hazards' && (
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400">GHS Classification</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCompound.ghsPictograms?.map(p => (
                      <div key={p} className="p-4 glass rounded-2xl flex flex-col items-center gap-2 border border-rose-200 dark:border-rose-900/30">
                        <ShieldAlert className="w-8 h-8 text-rose-500" />
                        <span className="text-[10px] font-black uppercase text-rose-500">{p}</span>
                      </div>
                    )) || <div className="col-span-2 text-center text-surface-500 py-8 italic">No hazard data reported.</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

