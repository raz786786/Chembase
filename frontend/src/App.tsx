import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Home, LayoutGrid, TestTube2, Search, Settings2,
  Sun, Moon, Settings, Atom, X, CheckSquare, GraduationCap, Menu,
  User as UserIcon, LogOut, ChevronDown, ShieldCheck, Lock, Activity
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
import TutorPage from './pages/TutorPage';
import LabAnalyticsDashboard from './pages/lab-analytics/LabAnalyticsDashboard';
import LabSubjectHub from './pages/lab-analytics/LabSubjectHub';
import LabWorkspace from './pages/lab-analytics/LabWorkspace';
import AdvancedDashboard from './pages/advanced/AdvancedDashboard';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AuthModal from './components/AuthModal';
import MolecularCanvas from './components/MolecularCanvas';
import { supabase } from './supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSystemApiKeys } from './utils/apiKeyManager';
import { isModelEnabledForUser } from './utils/modelGovernance';
import './index.css';

// ─── Free model catalog per provider ─────────────────────────────────────────
const PROVIDER_MODELS: Record<string, { id: string; label: string; tag: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash',       label: 'Gemini 2.5 Flash',       tag: 'Recommended' },
    { id: 'gemini-2.5-flash-lite',  label: 'Gemini 2.5 Flash Lite',  tag: 'Fastest'     },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile',        label: 'Llama 3.3 70B Versatile', tag: 'Recommended' },
    { id: 'llama-3.1-8b-instant',           label: 'Llama 3.1 8B Instant',    tag: 'Fastest' },
    { id: 'qwen/qwen3.6-27b',               label: 'Qwen 3.6 27B',            tag: 'New'  },
    { id: 'openai/gpt-oss-120b',            label: 'GPT OSS 120B',            tag: 'Pro'  },
    { id: 'groq/compound',                  label: 'Groq Compound',           tag: 'Smart' },
  ],
  openrouter: [
    { id: 'nvidia/nemotron-3-nano-30b-a3b:free',          label: 'Nemotron Nano 30B (Free)',   tag: 'Recommended'  },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free',       label: 'Nemotron Super 120B (Free)',  tag: 'Pro'  },
    { id: 'openai/gpt-oss-20b:free',                      label: 'GPT OSS 20B (Free)',         tag: 'Fast'  },
    { id: 'google/gemma-4-26b-a4b-it:free',              label: 'Gemma 4 26B (Free)',         tag: 'Google' },
    { id: 'cohere/north-mini-code:free',                  label: 'Cohere North Code (Free)',   tag: 'Code' },
  ],
  nvidia: [
    { id: 'meta/llama-3.1-8b-instruct',             label: 'Llama 3.1 8B Instruct',  tag: 'Recommended'  },
    { id: 'meta/llama-3.1-70b-instruct',            label: 'Llama 3.1 70B Instruct', tag: 'Pro' },
  ],
  nova: [
    { id: 'nova-lite-v1',   label: 'Amazon Nova Lite',  tag: 'Recommended' },
    { id: 'nova-micro-v1',  label: 'Amazon Nova Micro', tag: 'Fastest'    },
    { id: 'nova-pro-v1',    label: 'Amazon Nova Pro',   tag: 'Pro'        },
  ],
};

const PROVIDER_META: Record<string, { label: string; accent: string; link: string; keyLabel: string; placeholder: string }> = {
  gemini: {
    label: 'Google Gemini',
    accent: 'text-primary-400',
    link: 'https://aistudio.google.com/api-keys',
    keyLabel: 'Gemini API Key',
    placeholder: 'AIza...',
  },
  groq: {
    label: 'Groq',
    accent: 'text-accent-400',
    link: 'https://console.groq.com/keys',
    keyLabel: 'Groq API Key',
    placeholder: 'gsk_...',
  },
  openrouter: {
    label: 'OpenRouter',
    accent: 'text-primary-400',
    link: 'https://openrouter.ai/workspaces/default/keys',
    keyLabel: 'OpenRouter Key',
    placeholder: 'sk-or-v1-...',
  },
  nvidia: {
    label: 'NVIDIA NIM API',
    accent: 'text-accent-400',
    link: 'https://build.nvidia.com',
    keyLabel: 'NVIDIA API Key',
    placeholder: 'nvapi-...',
  },
  nova: {
    label: 'Amazon Nova (Dev)',
    accent: 'text-accent-400',
    link: 'https://nova.amazon.com/act',
    keyLabel: 'Nova Developer API Key',
    placeholder: 'UUID key...',
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
    <label className="flex items-center gap-3 cursor-pointer group py-1.5 px-2 rounded-xl hover:bg-surface-50/5 transition-colors">
      <div className="relative flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer hidden" />
        <div className="w-4 h-4 rounded border-2 border-surface-600 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-surface-50 scale-0 peer-checked:scale-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <span className="text-sm font-semibold text-surface-300 group-hover:text-surface-50 transition-colors flex-grow min-w-0 truncate">{label}</span>
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-700 text-surface-400 flex-shrink-0">{tag}</span>
      {status === 'working' && (
        <span className="text-[9px] font-black text-accent-400 flex-shrink-0">● OK</span>
      )}
      {status && status !== 'working' && (
        <span className="text-[9px] font-black text-accent-400 flex-shrink-0 truncate max-w-[80px]" title={status}>⚠ ERR</span>
      )}
    </label>
  );
}

// ─── Simple checkbox for non-AI sources ──────────────────────────────────────
function SourceCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1.5 px-2 rounded-xl hover:bg-surface-50/5 transition-colors">
      <div className="relative flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer hidden" />
        <div className="w-4 h-4 rounded border-2 border-surface-600 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-surface-50 scale-0 peer-checked:scale-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <span className="text-sm font-semibold text-surface-300 group-hover:text-surface-50 transition-colors">{label}</span>
    </label>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────
function ProviderCard({
  providerKey, activeModels, toggleModel, modelStatus, setActiveModels
}: {
  providerKey: string;
  activeModels: Record<string, boolean>;
  toggleModel: (k: string) => void;
  modelStatus: Record<string, string>;
  setActiveModels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const meta = PROVIDER_META[providerKey];
  const models = PROVIDER_MODELS[providerKey].filter(m => isModelEnabledForUser(providerKey, m.id));
  if (models.length === 0) return null;
  const selectedCount = models.filter(m => activeModels[`${providerKey}:${m.id}`]).length;

  return (
    <div className="bg-surface-900/60 rounded-2xl border border-surface-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase tracking-wider ${meta.accent}`}>{meta.label}</span>
          {selectedCount > 0 && (
            <span className="text-[9px] bg-primary-600 text-surface-50 px-1.5 py-0.5 rounded font-bold">{selectedCount} active</span>
          )}
        </div>
        <span className="text-[10px] font-bold text-accent-400 bg-accent-950/60 border border-accent-800/60 px-2 py-0.5 rounded">Central Key Active</span>
      </div>

      <div className="px-3 pb-3 space-y-0.5">
        <div className="flex justify-between items-center px-2 mb-1">
          <p className="text-[9px] uppercase tracking-widest text-surface-500 font-bold">Free Models</p>
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
              className="text-[10px] font-bold uppercase tracking-wider text-primary-400 hover:text-primary-300 transition-colors"
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Scroll-Driven Dynamic Theme Color (F+ Style)
  const [scrollAccent, setScrollAccent] = useState('#8acbc1');
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollPercent = scrollY / maxScroll;
      
      // F+ inspired smooth color stops based on scroll depth
      let color1, color2, hexColor;
      
      if (scrollPercent < 0.33) {
        // Top: Teal & Gold
        color1 = '138, 203, 193'; // #8acbc1
        color2 = '219, 176, 87';  // #dbb057
        hexColor = '#8acbc1';
      } else if (scrollPercent < 0.66) {
        // Middle: Indigo & Cyan
        color1 = '99, 102, 241'; // #6366f1
        color2 = '6, 182, 212';  // #06b6d4
        hexColor = '#6366f1';
      } else {
        // Bottom: Violet & Rose
        color1 = '139, 92, 246'; // #8b5cf6
        color2 = '244, 63, 94';  // #f43f5e
        hexColor = '#8b5cf6';
      }
      
      document.documentElement.style.setProperty('--scroll-color-1', color1);
      document.documentElement.style.setProperty('--scroll-color-2', color2);
      setScrollAccent(hexColor);
    };
    
    // Initial setup
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Mouse Tracker for F+ Dynamic Aura
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auth Listener with Supabase Role & Session Verification
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      if (currentUser) {
        // Auto-verify super admin role for raoa87442@gmail.com
        if (currentUser.email?.toLowerCase() === 'raoa87442@gmail.com' && currentUser.user_metadata?.role !== 'admin') {
          await supabase.auth.updateUser({ data: { role: 'admin' } });
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sUser = session?.user || null;
      if (sUser && sUser.email?.toLowerCase() === 'raoa87442@gmail.com' && sUser.user_metadata?.role !== 'admin') {
        supabase.auth.updateUser({ data: { role: 'admin' } });
      }
      setUser(sUser);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsUserMenuOpen(false);
  };

  // API Keys (Centralized System Keys configured by Super Admin)
  const systemKeys = getSystemApiKeys();
  const [novaKey,        setNovaKey]        = useState(systemKeys.nova);
  const [geminiKey,      setGeminiKey]      = useState(systemKeys.gemini);
  const [materialsKey,   setMaterialsKey]   = useState(systemKeys.materials);
  const [groqKey,        setGroqKey]        = useState(systemKeys.groq);
  const [openRouterKey,  setOpenRouterKey]  = useState(systemKeys.openrouter);
  const [nvidiaKey,      setNvidiaKey]      = useState(systemKeys.nvidia);

  useEffect(() => {
    const handleUpdate = () => {
      const updated = getSystemApiKeys();
      setNovaKey(updated.nova);
      setGeminiKey(updated.gemini);
      setMaterialsKey(updated.materials);
      setGroqKey(updated.groq);
      setOpenRouterKey(updated.openrouter);
      setNvidiaKey(updated.nvidia);
    };
    window.addEventListener('chembase-apikeys-updated', handleUpdate);
    return () => window.removeEventListener('chembase-apikeys-updated', handleUpdate);
  }, []);

  // Non-AI data source toggles
  const [activeSources, setActiveSources] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('active_sources') || '{"local":true,"materials":true}'); } catch { return { local: true, materials: true }; }
  });

  // Per-model selection: "provider:modelId" → boolean
  const [activeModels, setActiveModels] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('active_models');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore corrupt JSON */ }
    return buildDefaultActiveModels();
  });

  // Per-model status: "provider:modelId" → "working" | error string
  const [modelStatus, setModelStatus] = useState<Record<string, string>>({});
  useEffect(() => {
    const sync = () => {
      try { setModelStatus(JSON.parse(localStorage.getItem('model_status') || '{}')); } catch { /* ignore */ }
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

  // System Config State & Event Listener
  const [systemConfig, setSystemConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('system_config');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      aiTutorActive: true,
      userRegistrationOpen: true,
      pubchemSyncActive: true,
      maintenanceMode: false,
    };
  });

  useEffect(() => {
    const syncSystemConfig = () => {
      try {
        const saved = localStorage.getItem('system_config');
        if (saved) setSystemConfig(JSON.parse(saved));
      } catch { /* ignore */ }
    };
    window.addEventListener('system_config_updated', syncSystemConfig);
    window.addEventListener('storage', syncSystemConfig);
    return () => {
      window.removeEventListener('system_config_updated', syncSystemConfig);
      window.removeEventListener('storage', syncSystemConfig);
    };
  }, []);

  const isAdminUser = user?.email?.toLowerCase() === 'raoa87442@gmail.com' || user?.user_metadata?.role === 'admin';

  const saveSettings = () => {
    setIsSettingsOpen(false);
  };

  const navItems = [
    { to: '/', icon: <Home className="w-4 h-4" />, label: 'Home', end: true },
    { to: '/periodic-table', icon: <LayoutGrid className="w-4 h-4" />, label: 'Periodic Table' },
    { to: '/compounds', icon: <TestTube2 className="w-4 h-4" />, label: 'Compounds' },
    { to: '/build-compound', icon: <Search className="w-4 h-4" />, label: 'Finder' },
    { to: '/tutor', icon: <GraduationCap className="w-4 h-4" />, label: 'Tutor' },
    { to: '/lab-analytics', icon: <Activity className="w-4 h-4" />, label: 'Lab Analytics' },
    { to: '/advanced', icon: <Settings2 className="w-4 h-4" />, label: 'Advanced' },
  ];

  const userDisplayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userAge = user?.user_metadata?.age;

  return (
    <BrowserRouter>
      {/* GLOBAL F+ DYNAMIC AURA CANVAS */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 bg-surface-50 dark:bg-surface-900"
      >
        <MolecularCanvas isDark={isDark} accentColor={scrollAccent} />
        
        <div 
          className="absolute inset-0 opacity-100 transition-colors duration-1000"
          style={{
            background: 'radial-gradient(circle 900px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--scroll-color-1, 138, 203, 193), 0.12), transparent 70%), radial-gradient(circle 1200px at calc(100% - var(--mouse-x, 0%)) calc(100% - var(--mouse-y, 0%)), rgba(var(--scroll-color-2, 219, 176, 87), 0.08), transparent 70%)'
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen text-surface-900 dark:text-surface-100 transition-colors duration-300">
        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          currentUser={user}
          onAuthSuccess={() => setIsAuthOpen(false)}
        />

        {/* Navigation Header */}
        <header className="sticky top-0 z-50 bg-surface-50/90 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-50/5 transition-colors">
          <div className="w-full px-3 sm:px-6">
            <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
              
              {/* Brand Logo */}
              <NavLink to="/" className="flex items-center gap-2 flex-shrink-0 no-underline group" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-primary-500 to-accent-400 rounded-xl flex items-center justify-center text-surface-50 shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
                  <Atom className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex items-center gap-1 font-black text-base sm:text-lg tracking-tight">
                  <span className="text-surface-900 dark:text-surface-50">ChemBase</span>
                  <span className="text-primary-500">Pro</span>
                </div>
              </NavLink>

              {/* Desktop Nav Links (Visible on 1280px+ viewports to prevent overflow) */}
              <nav className="hidden xl:flex items-center space-x-1 flex-shrink-0">
                {navItems.map(({ to, icon, label, end }) => (
                  <NavLink
                    key={to} to={to} end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all btn-tactile ${
                        isActive 
                          ? 'bg-surface-100 dark:bg-surface-50/10 text-surface-900 dark:text-surface-50 shadow-sm ring-1 ring-surface-200 dark:ring-white/10' 
                          : 'hover:bg-surface-50 dark:hover:bg-surface-50/5 text-surface-500 dark:text-surface-400'
                      }`
                    }
                  >
                    {icon} {label}
                  </NavLink>
                ))}
              </nav>

              {/* Action Buttons & User Menu */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <div className="relative hidden md:block"><SearchBar /></div>
                
                <button 
                  onClick={toggleTheme} 
                  aria-label="Toggle Theme"
                  className="p-2 rounded-xl border border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300 transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button 
                  onClick={() => setIsSettingsOpen(true)} 
                  aria-label="Open Pipeline Settings"
                  className="p-2 rounded-xl border border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300 transition-colors relative"
                >
                  <Settings className="w-4 h-4" />
                  {Object.values(modelStatus).some(s => s && s !== 'working') && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-400 border-2 border-surface-50 dark:border-surface-900" />
                  )}
                </button>

                {/* User Dropdown */}
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-primary-600 text-surface-50 font-bold text-xs flex items-center justify-center">
                        {userDisplayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-surface-800 dark:text-surface-200 max-w-[80px] sm:max-w-[100px] truncate hidden sm:inline">
                        {userDisplayName}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800 mb-2">
                          <p className="text-xs font-black text-surface-900 dark:text-surface-50 truncate">{userDisplayName}</p>
                          <p className="text-[11px] text-surface-500 truncate">{user.email}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {user.email?.toLowerCase() === 'raoa87442@gmail.com' ? (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300 border border-accent-300">ADMIN</span>
                            ) : (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">USER</span>
                            )}
                            {userAge && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">Age: {userAge}</span>}
                          </div>
                        </div>
                        
                        {(user.email?.toLowerCase() === 'raoa87442@gmail.com' || user.user_metadata?.role === 'admin') && (
                          <NavLink
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors mb-1 no-underline"
                          >
                            <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                          </NavLink>
                        )}

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-surface-50 font-bold text-xs transition-all shadow-md shadow-primary-600/20 flex items-center gap-1.5"
                  >
                    <UserIcon className="w-3.5 h-3.5" /> Sign In
                  </button>
                )}

                {/* Mobile/Tablet Hamburger Toggle */}
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                  className="xl:hidden p-2 rounded-xl border border-surface-200 dark:border-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Navigation Drawer */}
          {isMobileMenuOpen && (
            <div className="xl:hidden px-4 pb-4 pt-2 border-t border-surface-200 dark:border-surface-800 bg-surface-50/95 dark:bg-surface-950/95 backdrop-blur-md animate-in slide-in-from-top duration-200">
              <div className="mb-3 md:hidden"><SearchBar className="w-full" /></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {navItems.map(({ to, icon, label, end }) => (
                  <NavLink
                    key={to} to={to} end={end}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isActive ? 'bg-primary-600 text-surface-50' : 'bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'
                      }`
                    }
                  >
                    {icon} {label}
                  </NavLink>
                ))}
                {(user?.email?.toLowerCase() === 'raoa87442@gmail.com' || user?.user_metadata?.role === 'admin') && (
                  <NavLink
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-accent-600 text-surface-50 col-span-2 sm:col-span-3 no-underline"
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                  </NavLink>
                )}
              </div>
            </div>
          )}
        </header>

            <main className="max-w-full mx-auto px-3 sm:px-6 lg:px-12 py-4 sm:py-8">
              {systemConfig.maintenanceMode && !isAdminUser ? (
                <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-6 animate-in fade-in">
                  <div className="w-20 h-20 rounded-3xl bg-accent-500/10 text-accent-500 flex items-center justify-center mx-auto border border-accent-500/20 shadow-xl">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h1 className="text-3xl font-black text-surface-900 dark:text-surface-50">Platform Maintenance Active</h1>
                  <p className="text-surface-500 text-sm max-w-md mx-auto leading-relaxed">
                    ChemBase Pro is currently undergoing scheduled system maintenance enabled by the Administrator. Access to platform URLs is restricted for non-admin users.
                  </p>
                  <div className="text-xs font-mono text-surface-400 bg-surface-100 dark:bg-surface-900 px-4 py-2 rounded-xl inline-block border border-surface-200 dark:border-surface-800">
                    HTTP 503 Maintenance Mode · Check back shortly
                  </div>
                </div>
              ) : (
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/tutor" element={<TutorPage />} />
                  <Route path="/lab-analytics" element={<LabAnalyticsDashboard />} />
                  <Route path="/lab-analytics/:subjectId" element={<LabSubjectHub />} />
                  <Route path="/lab-analytics/:subjectId/workspace" element={<LabWorkspace />} />
                  <Route path="/advanced" element={<AdvancedDashboard />} />
                  <Route path="/compounds" element={<CompoundsPage />} />
                  <Route path="/reactions" element={<ReactionsPage />} />
                  <Route path="/substances/:id" element={<SubstanceDetailPage />} />
                  <Route path="/reactions/:id" element={<ReactionDetailPage />} />
                  <Route path="/search" element={<SearchResultsPage />} />
                  <Route path="/periodic-table" element={<PeriodicTablePage />} />
                  <Route path="/predict" element={<ReactionPredictorPage />} />
                  <Route path="/build-compound" element={<CompoundBuilderPage />} />
                  <Route 
                    path="/tutor" 
                    element={
                      systemConfig.aiTutorActive ? (
                        <TutorPage />
                      ) : (
                        <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in">
                          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-200 dark:border-red-900">
                            <Lock className="w-8 h-8" />
                          </div>
                          <h1 className="text-2xl font-black text-surface-900 dark:text-surface-50">AI Tutor Feature Disabled</h1>
                          <p className="text-surface-500 text-sm max-w-md mx-auto leading-relaxed">
                            The AI Tutor & GRUCA Problem Solver has been disabled by the System Administrator. URL access to <code className="text-primary-600 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">/tutor</code> is blocked.
                          </p>
                        </div>
                      )
                    } 
                  />
                  <Route path="/advanced/*" element={<AdvancedDashboard />} />
                  <Route path="/admin" element={<AdminDashboardPage currentUser={user} />} />
                </Routes>
              )}
            </main>

        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-surface-200 dark:border-surface-800 text-center text-surface-500 text-sm">
          <p>ChemBase Pro © 2026 — Chemical Reaction Database Platform</p>
        </footer>

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
            <div className="relative w-full max-w-2xl bg-surface-900 rounded-3xl border border-surface-700 shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-surface-800 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary-400" />
                  <h2 className="text-lg font-bold text-surface-50">Pipeline Settings</h2>
                  <span className="text-[10px] bg-primary-600/30 text-primary-300 px-2 py-0.5 rounded font-bold border border-primary-600/40">
                    {Object.values(activeModels).filter(Boolean).length} models active
                  </span>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-surface-800 rounded-full transition-colors">
                  <X className="w-4 h-4 text-surface-400" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-grow p-6 space-y-4 scrollbar-hide">

                {/* Non-AI Sources */}
                <div className="bg-surface-800/60 rounded-2xl border border-surface-700/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-surface-700/50">
                    <span className="text-xs font-black uppercase tracking-wider text-surface-400">Data Sources</span>
                  </div>
                  <div className="px-3 py-2 grid grid-cols-2 gap-1">
                    <SourceCheckbox checked={!!activeSources.local} onChange={() => toggleSource('local')} label="Local Database" />
                    <div className="flex items-center gap-2">
                      <SourceCheckbox checked={!!activeSources.materials} onChange={() => toggleSource('materials')} label="Materials Project" />
                    </div>
                  </div>
                </div>

                {/* AI Provider Cards */}
                {Object.keys(PROVIDER_MODELS).map(providerKey => (
                  <ProviderCard
                    key={providerKey}
                    providerKey={providerKey}
                    activeModels={activeModels}
                    toggleModel={toggleModel}
                    modelStatus={modelStatus}
                    setActiveModels={setActiveModels}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-surface-800 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-accent-400 font-medium flex items-center gap-1.5 bg-accent-950/40 px-3 py-1.5 rounded-xl border border-accent-800/40 w-full sm:w-auto justify-center sm:justify-start">
                  <ShieldCheck className="w-3.5 h-3.5" /> System API Keys Managed Centrally
                </span>
                <div className="flex gap-3 justify-end w-full sm:w-auto">
                  <button onClick={() => setIsSettingsOpen(false)} className="px-4 sm:px-6 py-2.5 rounded-xl font-bold text-surface-400 hover:bg-surface-800 transition-colors text-sm flex-1 sm:flex-none">
                    Close
                  </button>
                  <button onClick={saveSettings} className="px-4 sm:px-6 py-2.5 rounded-xl font-bold bg-primary-600 text-surface-50 hover:bg-primary-700 transition-colors text-sm shadow-lg shadow-primary-500/20 flex-1 sm:flex-none">
                    Save Pipeline Choices
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
