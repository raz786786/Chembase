import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Home, LayoutGrid, TestTube2, Search, Settings2,
  Sun, Moon, Settings, Atom, X, CheckSquare
} from 'lucide-react';
import SearchBar from './components/SearchBar';
import HomePage from './pages/HomePage';
import PeriodicTablePage from './pages/PeriodicTablePage';
import CompoundsPage from './pages/CompoundsPage';
import ReactionsPage from './pages/ReactionsPage';
import SubstanceDetailPage from './pages/SubstanceDetailPage';
import ReactionDetailPage from './pages/ReactionDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ReactionPredictorPage from './pages/ReactionPredictorPage';
import CompoundBuilderPage from './pages/CompoundBuilderPage';
import AdvancedDashboard from './pages/advanced/AdvancedDashboard';
import './index.css';

// ─── Free model catalog per provider ─────────────────────────────────────────
export const PROVIDER_MODELS: Record<string, { id: string; label: string; tag: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash',       label: 'Gemini 2.5 Flash',       tag: 'Recommended' },
    { id: 'gemini-2.5-flash-lite',  label: 'Gemini 2.5 Flash Lite',  tag: 'Fastest'     },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile',        label: 'Llama 3.3 70B Versatile', tag: 'Best' },
    { id: 'llama-3.1-8b-instant',           label: 'Llama 3.1 8B Instant',    tag: 'Fast' },
    { id: 'qwen/qwen3-32b',                 label: 'Qwen3 32B',               tag: 'New'  },
  ],
  openrouter: [
    { id: 'google/gemma-4-26b-a4b-it:free',              label: 'Gemma 4 26B',       tag: 'Best'  },
    { id: 'google/gemma-3-27b-it:free',                   label: 'Gemma 3 27B',       tag: 'Free'  },
    { id: 'meta-llama/llama-3.2-3b-instruct:free',        label: 'Llama 3.2 3B',      tag: 'Fast'  },
  ],
  nvidia: [
    { id: 'nvidia/nemotron-3-nano-30b-a3b',        label: 'Nemotron Nano 30B',  tag: 'Fast'  },
    { id: 'meta/llama-3.3-70b-instruct',            label: 'Llama 3.3 70B',       tag: 'Pro'   },
    { id: 'meta/llama-3.1-70b-instruct',            label: 'Llama 3.1 70B',       tag: 'Versatile' },
    { id: 'meta/llama-3.1-8b-instruct',             label: 'Llama 3.1 8B',        tag: 'Fast'  },
    { id: 'deepseek-ai/deepseek-v4-flash',          label: 'DeepSeek V4 Flash',   tag: 'Coding' },
    { id: 'mistralai/mixtral-8x22b-instruct-v0.1',   label: 'Mixtral 8x22B',      tag: 'MOE'    },
    { id: 'mistralai/mixtral-8x7b-instruct-v0.1',    label: 'Mixtral 8x7B',       tag: 'Fast'   },
  ],
  nova: [
    { id: 'us.amazon.nova-lite-v1:0',   label: 'Nova Lite',  tag: 'Multimodal' },
    { id: 'us.amazon.nova-micro-v1:0',  label: 'Nova Micro', tag: 'Fastest'    },
  ],
};

const PROVIDER_META: Record<string, { label: string; accent: string; link: string; keyLabel: string; placeholder: string }> = {
  gemini: {
    label: 'Google Gemini',
    accent: 'text-purple-400',
    link: 'https://aistudio.google.com/api-keys',
    keyLabel: 'Gemini API Key',
    placeholder: 'AIza...',
  },
  groq: {
    label: 'Groq',
    accent: 'text-emerald-400',
    link: 'https://console.groq.com/keys',
    keyLabel: 'Groq API Key',
    placeholder: 'gsk_...',
  },
  openrouter: {
    label: 'OpenRouter',
    accent: 'text-blue-400',
    link: 'https://openrouter.ai/workspaces/default/keys',
    keyLabel: 'OpenRouter Key',
    placeholder: 'sk-or-v1-...',
  },
  nvidia: {
    label: 'NVIDIA NIM API',
    accent: 'text-green-400',
    link: 'https://build.nvidia.com',
    keyLabel: 'NVIDIA API Key',
    placeholder: 'nvapi-...',
  },
  nova: {
    label: 'Amazon Nova',
    accent: 'text-orange-400',
    link: 'https://nova.amazon.com/dev/api',
    keyLabel: 'Nova Bearer Token',
    placeholder: 'Bearer token...',
  },
};

function buildDefaultActiveModels(): Record<string, boolean> {
  const d: Record<string, boolean> = {};
  Object.entries(PROVIDER_MODELS).forEach(([p, models]) => {
    models.forEach((m, i) => { d[`${p}:${m.id}`] = i === 0; });
  });
  return d;
}

// ─── Checkbox component ───────────────────────────────────────────────────────
function ModelCheckbox({
  checked, onChange, label, tag, statusKey, modelStatus
}: {
  checked: boolean; onChange: () => void;
  label: string; tag: string;
  statusKey: string; modelStatus: Record<string, string>;
}) {
  const status = modelStatus[statusKey];
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1.5 px-2 rounded-xl hover:bg-white/5 transition-colors">
      <div className="relative flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer hidden" />
        <div className="w-4 h-4 rounded border-2 border-slate-600 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white scale-0 peer-checked:scale-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors flex-grow min-w-0 truncate">{label}</span>
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 flex-shrink-0">{tag}</span>
      {status === 'working' && (
        <span className="text-[9px] font-black text-emerald-400 flex-shrink-0">● OK</span>
      )}
      {status && status !== 'working' && (
        <span className="text-[9px] font-black text-amber-400 flex-shrink-0 truncate max-w-[80px]" title={status}>⚠ ERR</span>
      )}
    </label>
  );
}

// ─── Simple checkbox for non-AI sources ──────────────────────────────────────
function SourceCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1.5 px-2 rounded-xl hover:bg-white/5 transition-colors">
      <div className="relative flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer hidden" />
        <div className="w-4 h-4 rounded border-2 border-slate-600 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white scale-0 peer-checked:scale-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────
function ProviderCard({
  providerKey, apiKey, setApiKey, activeModels, toggleModel, modelStatus, setActiveModels
}: {
  providerKey: string;
  apiKey: string; setApiKey: (v: string) => void;
  activeModels: Record<string, boolean>;
  toggleModel: (k: string) => void;
  modelStatus: Record<string, string>;
  setActiveModels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const meta = PROVIDER_META[providerKey];
  const models = PROVIDER_MODELS[providerKey];
  const selectedCount = models.filter(m => activeModels[`${providerKey}:${m.id}`]).length;

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase tracking-wider ${meta.accent}`}>{meta.label}</span>
          {selectedCount > 0 && (
            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">{selectedCount} active</span>
          )}
        </div>
        <a href={meta.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 transition-colors">Get Free Key ↗</a>
      </div>

      <div className="px-4 pt-3 pb-2">
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder={meta.placeholder}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 placeholder-slate-600"
        />
      </div>

      <div className="px-3 pb-3 space-y-0.5">
        <div className="flex justify-between items-center px-2 mb-1">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Free Models</p>
          {providerKey === 'nvidia' && (
            <button
              type="button"
              onClick={() => {
                const newActive = { ...activeModels };
                const allChecked = models.every(m => activeModels[`nvidia:${m.id}`]);
                models.forEach(m => {
                  newActive[`nvidia:${m.id}`] = !allChecked;
                });
                setActiveModels(newActive);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {models.every(m => activeModels[`nvidia:${m.id}`]) ? 'Uncheck All' : 'Check All'}
            </button>
          )}
        </div>
        {models.map(m => (
          <ModelCheckbox
            key={m.id}
            checked={!!activeModels[`${providerKey}:${m.id}`]}
            onChange={() => toggleModel(`${providerKey}:${m.id}`)}
            label={m.label}
            tag={m.tag}
            statusKey={`${providerKey}:${m.id}`}
            modelStatus={modelStatus}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [isDark, setIsDark] = useState(() =>
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // API Keys
  const [novaKey,        setNovaKey]        = useState(() => localStorage.getItem('nova_api_key') || '');
  const [geminiKey,      setGeminiKey]      = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [materialsKey,   setMaterialsKey]   = useState(() => localStorage.getItem('materials_api_key') || '');
  const [groqKey,        setGroqKey]        = useState(() => localStorage.getItem('groq_api_key') || '');
  const [openRouterKey,  setOpenRouterKey]  = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [nvidiaKey,      setNvidiaKey]      = useState(() => localStorage.getItem('nvidia_api_key') || '');

  // Non-AI data source toggles
  const [activeSources, setActiveSources] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('active_sources') || '{"local":true,"materials":true}'); } catch { return { local: true, materials: true }; }
  });

  // Per-model selection: "provider:modelId" → boolean
  const [activeModels, setActiveModels] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('active_models');
      if (saved) return JSON.parse(saved);
    } catch {}
    return buildDefaultActiveModels();
  });

  // Per-model status: "provider:modelId" → "working" | error string
  const [modelStatus, setModelStatus] = useState<Record<string, string>>({});
  useEffect(() => {
    const sync = () => {
      try { setModelStatus(JSON.parse(localStorage.getItem('model_status') || '{}')); } catch {}
    };
    sync();
    window.addEventListener('storage', sync);
    const id = setInterval(sync, 2000);
    return () => { window.removeEventListener('storage', sync); clearInterval(id); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Auto-save API keys and settings so user never loses them
  useEffect(() => {
    localStorage.setItem('nova_api_key', novaKey);
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('materials_api_key', materialsKey);
    localStorage.setItem('groq_api_key', groqKey);
    localStorage.setItem('openrouter_api_key', openRouterKey);
    localStorage.setItem('nvidia_api_key', nvidiaKey);
    localStorage.setItem('active_sources', JSON.stringify(activeSources));
    localStorage.setItem('active_models', JSON.stringify(activeModels));
  }, [novaKey, geminiKey, materialsKey, groqKey, openRouterKey, nvidiaKey, activeSources, activeModels]);

  const toggleTheme = () => setIsDark(d => !d);
  const toggleModel = (key: string) => setActiveModels(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleSource = (source: string) => setActiveSources(prev => ({ ...prev, [source]: !prev[source] }));

  const resetSettings = () => {
    setNovaKey('');
    setGeminiKey('');
    setMaterialsKey('');
    setGroqKey('');
    setOpenRouterKey('');
    setNvidiaKey('');
    localStorage.removeItem('nova_api_key');
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('materials_api_key');
    localStorage.removeItem('groq_api_key');
    localStorage.removeItem('openrouter_api_key');
    localStorage.removeItem('nvidia_api_key');
  };

  const saveSettings = () => {
    setIsSettingsOpen(false);
  };

  const keyMap: Record<string, [string, (v: string) => void]> = {
    gemini:     [geminiKey,     setGeminiKey],
    groq:       [groqKey,       setGroqKey],
    openrouter: [openRouterKey, setOpenRouterKey],
    nvidia:     [nvidiaKey,     setNvidiaKey],
    nova:       [novaKey,       setNovaKey],
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 glass border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-full mx-auto px-6 lg:px-12">
            <div className="flex justify-between items-center h-16">
              <NavLink to="/" className="flex items-center gap-2 no-underline">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <Atom className="w-6 h-6" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ChemBase</span>
                  <span className="text-indigo-600 font-bold">Pro</span>
                </div>
              </NavLink>

              <nav className="hidden md:flex space-x-1">
                {[
                  { to: '/', icon: <Home className="w-4 h-4" />, label: 'Home', end: true },
                  { to: '/periodic-table', icon: <LayoutGrid className="w-4 h-4" />, label: 'Periodic Table' },
                  { to: '/compounds', icon: <TestTube2 className="w-4 h-4" />, label: 'Compounds' },
                  { to: '/build-compound', icon: <Search className="w-4 h-4" />, label: 'Finder' },
                  { to: '/advanced', icon: <Settings2 className="w-4 h-4" />, label: 'Advanced' },
                ].map(({ to, icon, label, end }) => (
                  <NavLink
                    key={to} to={to} end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`
                    }
                  >
                    {icon} {label}
                  </NavLink>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                <div className="relative hidden lg:block"><SearchBar /></div>
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                  <Settings className="w-5 h-5" />
                  {/* Dot indicator if any model is in error state */}
                  {Object.values(modelStatus).some(s => s && s !== 'working') && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-full mx-auto px-6 lg:px-12 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/periodic-table" element={<PeriodicTablePage />} />
            <Route path="/compounds" element={<CompoundsPage />} />
            <Route path="/reactions" element={<ReactionsPage />} />
            <Route path="/substances/:id" element={<SubstanceDetailPage />} />
            <Route path="/reactions/:id" element={<ReactionDetailPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/predict" element={<ReactionPredictorPage />} />
            <Route path="/build-compound" element={<CompoundBuilderPage />} />
            <Route path="/advanced/*" element={<AdvancedDashboard />} />
          </Routes>
        </main>

        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
          <p>ChemBase Pro © 2026 — Chemical Reaction Database Platform</p>
        </footer>

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
            <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">Pipeline Settings</h2>
                  <span className="text-[10px] bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded font-bold border border-indigo-600/40">
                    {Object.values(activeModels).filter(Boolean).length} models active
                  </span>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-grow p-6 space-y-4 scrollbar-hide">

                {/* Non-AI Sources */}
                <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Data Sources</span>
                  </div>
                  <div className="px-3 py-2 grid grid-cols-2 gap-1">
                    <SourceCheckbox checked={!!activeSources.local} onChange={() => toggleSource('local')} label="Local Database" />
                    <div className="flex items-center gap-2">
                      <SourceCheckbox checked={!!activeSources.materials} onChange={() => toggleSource('materials')} label="Materials Project" />
                    </div>
                  </div>
                  {activeSources.materials && (
                    <div className="px-4 pb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Materials Project Key</span>
                        <a href="https://next-gen.materialsproject.org/api" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-400 hover:underline">Get Free Key ↗</a>
                      </div>
                      <input
                        type="password" value={materialsKey} onChange={e => setMaterialsKey(e.target.value)}
                        placeholder="mp-..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 placeholder-slate-600"
                      />
                    </div>
                  )}
                </div>

                {/* AI Provider Cards */}
                {Object.keys(PROVIDER_MODELS).map(providerKey => {
                  const [apiKey, setApiKey] = keyMap[providerKey];
                  return (
                    <ProviderCard
                      key={providerKey}
                      providerKey={providerKey}
                      apiKey={apiKey}
                      setApiKey={setApiKey}
                      activeModels={activeModels}
                      toggleModel={toggleModel}
                      modelStatus={modelStatus}
                      setActiveModels={setActiveModels}
                    />
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-800 flex gap-3 flex-shrink-0">
                <button onClick={resetSettings} className="px-4 py-2.5 rounded-xl font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm border border-transparent hover:border-red-500/20">
                  Reset Keys
                </button>
                <div className="flex-1 flex gap-3 justify-end">
                  <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors text-sm">
                    Close
                  </button>
                  <button onClick={saveSettings} className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm shadow-lg shadow-indigo-500/20">
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
