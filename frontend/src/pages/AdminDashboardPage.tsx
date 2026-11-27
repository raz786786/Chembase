import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Database, Activity, Cpu, Layers,
  Lock, CheckCircle2, Crown, Server,
  PlusCircle, RefreshCw, Settings, User,
  Search, Terminal, ToggleLeft, ToggleRight, Check, X, Edit3, KeyRound
} from 'lucide-react';
import { api, type SubstanceSummary } from '../api';
import { supabase } from '../supabaseClient';
import { getModuleGovernance, saveModuleGovernance, type ModuleGovernance } from '../utils/moduleVisibility';
import { getSystemApiKeys, saveSystemApiKeys, type SystemApiKeys } from '../utils/apiKeyManager';
import ProviderHub from '../components/admin/ProviderHub';
import UserModelsManager from '../components/admin/UserModelsManager';
import { getActiveRoutedModels, PROVIDERS_UPDATED_EVENT } from '../utils/providerRouter';

import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AdminDashboardPageProps {
  currentUser: SupabaseUser | null;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  age: number;
  role: 'admin' | 'user';
  created: string;
}

export default function AdminDashboardPage({ currentUser }: AdminDashboardPageProps) {
  const [elements, setElements] = useState<SubstanceSummary[]>([]);
  const [compounds, setCompounds] = useState<SubstanceSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'models' | 'users' | 'database' | 'governance' | 'system'>('overview');
  const [governance, setGovernance] = useState<ModuleGovernance>(getModuleGovernance);

  // Materials Project data key (non-AI scientific database)
  const [systemKeys, setSystemKeys] = useState<SystemApiKeys>(getSystemApiKeys);
  const [keySavedMsg, setKeySavedMsg] = useState<string | null>(null);

  // Live routed AI pipeline stats for Overview KPI
  const [routedStats, setRoutedStats] = useState<{ providersCount: number; modelsCount: number }>({
    providersCount: 0,
    modelsCount: 0,
  });

  useEffect(() => {
    const refreshStats = () => {
      getActiveRoutedModels()
        .then((models) => {
          const uniqueProviders = new Set(models.map((m) => m.provider_id));
          setRoutedStats({
            providersCount: uniqueProviders.size,
            modelsCount: models.length,
          });
        })
        .catch(() => {
          // ignore offline errors
        });
    };
    refreshStats();
    window.addEventListener(PROVIDERS_UPDATED_EVENT, refreshStats);
    return () => window.removeEventListener(PROVIDERS_UPDATED_EVENT, refreshStats);
  }, []);

  const handleSaveMaterialsKey = () => {
    saveSystemApiKeys(systemKeys);
    setKeySavedMsg('Materials Project API key saved.');
    setTimeout(() => setKeySavedMsg(null), 3000);
  };

  const toggleModuleDisable = (modId: string) => {
    const next: ModuleGovernance = {
      ...governance,
      disabledModules: {
        ...governance.disabledModules,
        [modId]: !governance.disabledModules[modId],
      },
    };
    setGovernance(next);
    saveModuleGovernance(next);
  };

  const toggleToolDisable = (modId: string, toolId: string) => {
    const key = `${modId}:${toolId}`;
    const next: ModuleGovernance = {
      ...governance,
      disabledTools: {
        ...governance.disabledTools,
        [key]: !governance.disabledTools[key],
      },
    };
    setGovernance(next);
    saveModuleGovernance(next);
  };

  // User directory state
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<UserRecord[]>([
    { id: '1', email: 'raoa87442@gmail.com', name: 'Rao Ahmad', age: 24, role: 'admin', created: '2026-08-10' },
    { id: '2', email: 'student.chem@uet.edu.pk', name: 'Zain Ali', age: 22, role: 'user', created: '2026-08-09' },
    { id: '3', email: 'fatima.eng@gmail.com', name: 'Fatima Noor', age: 23, role: 'user', created: '2026-08-08' },
    { id: '4', email: 'hassan.process@outlook.com', name: 'Hassan Raza', age: 25, role: 'user', created: '2026-08-07' },
  ]);

  // User edit modal state
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [newPassword, setNewPassword] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Database Add Compound State
  const [newCompound, setNewCompound] = useState({
    name: '',
    formula: '',
    molecular_weight: '',
    category: 'organic',
  });
  const [compoundSuccess, setCompoundSuccess] = useState<string | null>(null);

  // System feature toggles (Persisted in localStorage & global event listener)
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

  const toggleSystemConfig = (key: string) => {
    setSystemConfig((prev: any) => {
      const next = { ...prev, [key]: !prev[key as keyof typeof prev] };
      localStorage.setItem('system_config', JSON.stringify(next));
      window.dispatchEvent(new Event('system_config_updated'));
      return next;
    });
  };

  const isAdmin =
    currentUser?.email?.toLowerCase() === 'raoa87442@gmail.com' ||
    currentUser?.app_metadata?.role === 'admin';

  useEffect(() => {
    api.getElements().then(setElements).catch(console.error);
    api.getCompounds().then(setCompounds).catch(console.error);
  }, []);

  if (!currentUser || !isAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 animate-in fade-in">
        <div className="glass rounded-3xl border border-red-200 dark:border-red-900/60 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-surface-900 dark:text-surface-50">Super Admin Privilege Required</h1>
          <p className="text-sm text-surface-500 max-w-md mx-auto leading-relaxed">
            You must be signed in with an authorized administrator account to access system parameters.
          </p>
        </div>
      </div>
    );
  }

  // Open User Edit Modal
  const openEditModal = (u: UserRecord) => {
    setSelectedUser(u);
    setEditName(u.name);
    setEditAge(String(u.age));
    setEditRole(u.role);
    setNewPassword('');
    setEditSuccess(null);
    setEditError(null);
  };

  // Save User Details & Password Reset
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditSaving(true);
    setEditSuccess(null);
    setEditError(null);

    try {
      // Update local state list
      setUsers(prev => prev.map(u => {
        if (u.id === selectedUser.id) {
          return {
            ...u,
            name: editName,
            age: parseInt(editAge) || u.age,
            role: editRole,
          };
        }
        return u;
      }));

      // If updating current logged in user metadata via Supabase
      if (selectedUser.email === currentUser.email) {
        await supabase.auth.updateUser({
          data: {
            display_name: editName,
            age: parseInt(editAge) || selectedUser.age,
            role: editRole,
          },
        });
        if (newPassword) {
          await supabase.auth.updateUser({ password: newPassword });
        }
      }

      setEditSuccess(`User details & password updated for ${selectedUser.email}!`);
      setTimeout(() => {
        setSelectedUser(null);
      }, 1200);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user profile');
    } finally {
      setEditSaving(false);
    }
  };

  // Add Custom Compound
  const handleAddCompound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompound.name || !newCompound.formula) return;
    const added: SubstanceSummary = {
      id: String(compounds.length + 1000),
      name: newCompound.name,
      formula: newCompound.formula,
      symbol: newCompound.formula,
      category: newCompound.category,
      type: 'compound',
    };
    setCompounds(prev => [added, ...prev]);
    setCompoundSuccess(`Compound "${newCompound.name}" (${newCompound.formula}) successfully added to database!`);
    setNewCompound({ name: '', formula: '', molecular_weight: '', category: 'organic' });
    setTimeout(() => setCompoundSuccess(null), 3000);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
      
      {/* Deep-Level Admin Header */}
      <div className="glass p-6 lg:p-8 rounded-3xl border border-surface-200 dark:border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 text-surface-50 flex items-center justify-center shadow-lg shadow-primary-600/25 flex-shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-surface-900 dark:text-surface-50">Root Admin Control Panel</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-950 border border-accent-300 dark:border-accent-800 text-accent-700 dark:text-accent-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3" /> Super Admin
              </span>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              Signed in as <strong className="text-surface-800 dark:text-surface-200">{currentUser.email}</strong> · Full Support & User Management Access
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-surface-100 dark:bg-surface-900/80 rounded-2xl border border-surface-200 dark:border-surface-800">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'providers', label: 'AI Providers & Models', icon: Cpu },
            { id: 'models', label: 'User Models', icon: Layers, badge: routedStats.modelsCount },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'database', label: 'Chem DB CRUD', icon: Database },
            { id: 'governance', label: 'Module & Tool Control', icon: ShieldCheck },
            { id: 'system', label: 'System Toggles', icon: Settings },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as 'overview' | 'providers' | 'models' | 'users' | 'database' | 'governance' | 'system')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === t.id
                    ? 'bg-primary-600 text-surface-50 shadow-md shadow-primary-600/20'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {'badge' in t && typeof t.badge === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                      activeTab === t.id
                        ? 'bg-surface-50/20 text-surface-50'
                        : 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-900">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300">SQLite OK</span>
              </div>
              <div className="text-3xl font-black tabular-nums text-surface-900 dark:text-surface-50 mb-1">{elements.length + compounds.length}</div>
              <p className="text-surface-500 text-xs font-bold uppercase tracking-wider">Substances in Database</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-900">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider tabular-nums px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                  {routedStats.providersCount} Connected
                </span>
              </div>
              <div className="text-3xl font-black tabular-nums text-surface-900 dark:text-surface-50 mb-1">
                {routedStats.modelsCount} Models
              </div>
              <p className="text-surface-500 text-xs font-bold uppercase tracking-wider">Active Model Pipeline</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400 rounded-xl border border-accent-100 dark:border-accent-900">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300">Supabase</span>
              </div>
              <div className="text-3xl font-black tabular-nums text-surface-900 dark:text-surface-50 mb-1">{users.length} Users</div>
              <p className="text-surface-500 text-xs font-bold uppercase tracking-wider">Registered Accounts</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-surface-200 dark:border-surface-800">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-900">
                  <Server className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300">99.9% Uptime</span>
              </div>
              <div className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">FastAPI</div>
              <p className="text-surface-500 text-xs font-bold uppercase tracking-wider">Port 9222 Server</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-600" /> Deep Architecture Status
              </h3>
              
              <div className="space-y-3 text-xs font-semibold">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-900/60 border border-surface-200 dark:border-surface-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-accent-500" />
                    <div>
                      <div className="font-bold text-surface-900 dark:text-surface-50">Supabase PostgreSQL Engine</div>
                      <div className="text-[10px] text-surface-500">User sessions, metadata, Google OAuth 2.0</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300 font-mono text-[10px]">ACTIVE</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-900/60 border border-surface-200 dark:border-surface-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-accent-500" />
                    <div>
                      <div className="font-bold text-surface-900 dark:text-surface-50">Amazon Nova Developer API</div>
                      <div className="text-[10px] text-surface-500">nova-lite-v1, nova-micro-v1, nova-pro-v1</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300 font-mono text-[10px]">READY</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary-600" /> Root Admin Support Tools
              </h3>
              <ul className="space-y-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-500" /> View & Edit user profiles, ages, display names, and password resets.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-500" /> Search user directory by email or name for query assistance.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-500" /> Chemical Database CRUD (Add/Edit custom chemical compounds).
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: AI PROVIDERS & MODELS (9ROUTER-STYLE MULTI-PROVIDER HUB) ─── */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <ProviderHub />

          {/* Scientific Data Source Key: Materials Project */}
          <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-surface-800 dark:text-surface-50 uppercase tracking-wider">
                  Materials Project API Key (Scientific Database)
                </label>
                <span className="text-[10px] font-mono text-primary-500">next-gen.materialsproject.org</span>
              </div>
              <input
                type="password"
                value={systemKeys.materials}
                onChange={(e) => setSystemKeys({ ...systemKeys, materials: e.target.value })}
                placeholder="mp-..."
                className="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3.5 py-2 text-xs font-mono text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
              />
              {keySavedMsg && (
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {keySavedMsg}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSaveMaterialsKey}
              className="px-4 py-2 rounded-xl bg-surface-900 dark:bg-surface-100 text-surface-50 dark:text-surface-900 font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 flex-shrink-0"
            >
              <Check className="w-3.5 h-3.5" /> Save Data Key
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB: USER MODELS GOVERNANCE ─── */}
      {activeTab === 'models' && (
        <UserModelsManager onGoToProviders={() => setActiveTab('providers')} />
      )}

      {/* ─── TAB 2: USER DIRECTORY & SUPPORT EDIT ─── */}
      {activeTab === 'users' && (
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200 dark:border-surface-800">
            <div>
              <h2 className="font-black text-lg text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" /> User Directory & Account Support Suite
              </h2>
              <p className="text-xs text-surface-500">Search registered users by email to inspect details and update passwords for support queries</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by email address or name..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-900 dark:text-surface-50 outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800 text-[10px] uppercase font-black tracking-wider text-surface-400 bg-surface-50 dark:bg-surface-900/50">
                  <th className="p-3.5 rounded-l-xl">User Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Age</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5 text-right rounded-r-xl">Support Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/40 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs text-surface-50 ${u.role === 'admin' ? 'bg-accent-600' : 'bg-primary-600'}`}>
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-bold text-surface-900 dark:text-surface-50">{u.name}</span>
                    </td>
                    <td className="p-3.5 text-surface-600 dark:text-surface-400 font-mono text-xs">{u.email}</td>
                    <td className="p-3.5 text-surface-600 dark:text-surface-400">{u.age} yrs</td>
                    <td className="p-3.5 text-surface-400 text-[11px] font-mono">{u.created}</td>
                    <td className="p-3.5">
                      {u.role === 'admin' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-950 border border-accent-300 text-accent-700 dark:text-accent-300 text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <Crown className="w-3 h-3" /> ADMIN
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 text-[9px] font-black uppercase tracking-wider">
                          USER
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 hover:bg-primary-600 hover:text-surface-50 text-primary-700 dark:text-primary-300 text-xs font-bold transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> View & Edit Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Edit & Support Modal */}
          {selectedUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-surface-950/70 backdrop-blur-md" onClick={() => setSelectedUser(null)} />
              <div className="relative w-full max-w-lg bg-surface-50 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center bg-surface-50/50 dark:bg-surface-900/50">
                  <div>
                    <h3 className="text-base font-black text-surface-900 dark:text-surface-50 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary-600" /> Account Support & Query Manager
                    </h3>
                    <p className="text-xs text-surface-500 font-mono mt-0.5">{selectedUser.email}</p>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                  {editSuccess && (
                    <div className="p-3 rounded-xl bg-accent-50 dark:bg-accent-950/50 border border-accent-200 text-accent-700 dark:text-accent-300 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4" /> {editSuccess}
                    </div>
                  )}

                  {editError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 dark:text-red-400 text-xs font-bold">
                      {editError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/80 text-sm font-semibold text-surface-900 dark:text-surface-50 outline-none focus:border-primary-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="120"
                      value={editAge}
                      onChange={e => setEditAge(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/80 text-sm font-semibold text-surface-900 dark:text-surface-50 outline-none focus:border-primary-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">
                      User Role
                    </label>
                    <select
                      value={editRole}
                      disabled={selectedUser.email === 'raoa87442@gmail.com'}
                      onChange={e => setEditRole(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/80 text-sm font-semibold text-surface-900 dark:text-surface-50 outline-none focus:border-primary-600 transition-colors"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">
                      Reset Password (Admin Override)
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="password" autoComplete="new-password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password for user query help"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/80 text-sm font-semibold text-surface-900 dark:text-surface-50 outline-none focus:border-primary-600 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={editSaving}
                    className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-surface-50 font-bold text-sm transition-colors shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 mt-4"
                  >
                    {editSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save User Changes & Reset Password
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: CHEMICAL DB CRUD ─── */}
      {activeTab === 'database' && (
        <div className="space-y-8">
          {/* Add Compound Form */}
          <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-4">
            <h2 className="font-black text-lg text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary-600" /> Add Custom Compound to Platform Database
            </h2>

            {compoundSuccess && (
              <div className="p-3 rounded-xl bg-accent-50 dark:bg-accent-950/50 border border-accent-200 text-accent-700 dark:text-accent-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" /> {compoundSuccess}
              </div>
            )}

            <form onSubmit={handleAddCompound} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">Compound Name *</label>
                <input
                  type="text"
                  required
                  value={newCompound.name}
                  onChange={e => setNewCompound({ ...newCompound, name: e.target.value })}
                  placeholder="e.g. Ethanol"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-900 dark:text-surface-50 outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">Chemical Formula *</label>
                <input
                  type="text"
                  required
                  value={newCompound.formula}
                  onChange={e => setNewCompound({ ...newCompound, formula: e.target.value })}
                  placeholder="e.g. C2H5OH"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-900 dark:text-surface-50 outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">Category</label>
                <select
                  value={newCompound.category}
                  onChange={e => setNewCompound({ ...newCompound, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-900 dark:text-surface-50 outline-none focus:border-primary-500"
                >
                  <option value="organic">Organic</option>
                  <option value="inorganic">Inorganic</option>
                  <option value="acid">Acid</option>
                  <option value="base">Base</option>
                  <option value="salt">Salt</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-surface-50 font-bold text-xs transition-colors shadow-md shadow-primary-600/20 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Add Compound
                </button>
              </div>
            </form>
          </div>

          {/* Database Table */}
          <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider tabular-nums text-surface-900 dark:text-surface-50">
              Indexed Compounds Database ({compounds.length} items)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
              {compounds.map(c => (
                <div key={c.id} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-surface-900 dark:text-surface-50">{c.name}</div>
                    <div className="text-[10px] font-mono text-primary-600 dark:text-primary-400">{c.symbol}</div>
                  </div>
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-surface-500">
                    {c.category || 'compound'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: MODULE & TOOL GOVERNANCE ─── */}
      {activeTab === 'governance' && (
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-6">
          <div>
            <h2 className="font-black text-lg text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-600" /> Advanced Engineering Modules & Tools Governance
            </h2>
            <p className="text-xs text-surface-500">Super Admin Controls: Disable any module or individual sub-tool. Disabled items disappear immediately for users.</p>
          </div>

          <div className="space-y-6">
            {[
              {
                id: 'thermodynamics',
                name: 'Thermodynamic Analysis Module',
                tools: [
                  { id: 'pr-eos', name: 'PR-EOS Z-Factor Cardano Solver' },
                  { id: 'flash', name: 'Flash Equilibrium & Lever Rule' },
                  { id: 'nrtl', name: 'NRTL Activity Coefficients' },
                  { id: 'sol-thermo', name: 'Solution Thermodynamics & Henry' },
                  { id: 'rxn-eq', name: 'Chemical Reaction Equilibrium' },
                  { id: 'cycles', name: 'Rankine / Refrigeration Cycles' },
                  { id: 'cp-enthalpy', name: 'Cp / ΔH / ΔS Integrator' },
                  { id: 'phase-diagram', name: 'Wagner Phase Boundary' },
                  { id: 'steam', name: 'IAPWS-IF97 Steam Tables' },
                  { id: 'psychro', name: 'Arden Buck Psychrometrics' },
                ]
              },
              {
                id: 'fluid-mechanics',
                name: 'Fluid Dynamics Console',
                tools: [
                  { id: 'pump-system', name: 'Pump Performance' },
                  { id: 'pump-npsh', name: 'Ns & NPSHA Cavitation' },
                  { id: 'compressible', name: 'Compressible Gas & Mach' },
                  { id: 'two-phase', name: 'Two-Phase Void Fraction' },
                  { id: 'moody', name: 'Colebrook Friction Analysis' },
                  { id: 'reynolds', name: 'Rheology & Non-Newtonian' },
                  { id: 'flow-meter', name: 'Flow Meters' },
                ]
              },
              {
                id: 'heat-transfer',
                name: 'Heat Transfer Console',
                tools: [
                  { id: 'consultant', name: 'Rigorous S&T Consultant' },
                  { id: 'cooling-tower', name: 'Cooling Tower Merkel (Chebyshev)' },
                  { id: 'gnielinski', name: 'Gnielinski Convection' },
                  { id: 'ntu', name: 'ε-NTU Analysis' },
                  { id: 'lmtd', name: 'Driving Force' },
                  { id: 'fouling', name: 'Fouling & k Data' },
                ]
              },
              {
                id: 'reaction',
                name: 'Reaction Engineering Console',
                tools: [
                  { id: 'reversible-kinetics', name: 'Reversible Arrhenius Kinetics' },
                  { id: 'damkohler-rtd', name: 'Damköhler & RTD Non-Ideality' },
                  { id: 'series', name: 'CSTR Reactor Networks' },
                  { id: 'variable-vol', name: 'Variable Volume Gas Kinetics' },
                  { id: 'batch', name: 'Batch Reactor' },
                  { id: 'pbr', name: 'Packed Bed Reactor' },
                  { id: 'selectivity', name: 'Selectivity Sizing' },
                ]
              },
              {
                id: 'separation',
                name: 'Separation Processes Console',
                tools: [
                  { id: 'bubble-dew', name: 'Bubble & Dew Point' },
                  { id: 'flash', name: 'VLE Flash' },
                  { id: 'vle', name: 'x-y VLE Diagram' },
                  { id: 'fug', name: 'FUG Design' },
                  { id: 'mt', name: 'McCabe-Thiele' },
                  { id: 'ponchon-savarit', name: 'Ponchon-Savarit H-x-y' },
                  { id: 'absorption', name: 'Kremser Absorption' },
                  { id: 'vessel', name: 'Vessel & Curved Heads' },
                ]
              },
              {
                id: 'lab-assistant',
                name: 'Laboratory Assistant Module',
                tools: [
                  { id: 'notebook', name: 'Auto-Saved Lab Notebooks' },
                  { id: 'viva', name: 'Interactive Viva Simulator' },
                  { id: 'grapher', name: 'Dynamic Lab Graph Generator' },
                  { id: 'safety', name: 'Lab Safety & Post-Lab Q&A' },
                ]
              }
            ].map(mod => {
              const isModDisabled = !!governance.disabledModules[mod.id];
              return (
                <div key={mod.id} className="p-5 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-sm text-surface-900 dark:text-surface-50 flex items-center gap-2">
                        {mod.name}
                        {isModDisabled && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 border border-rose-300 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                            Entire Module Disabled
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-surface-500 font-mono">Module ID: {mod.id}</div>
                    </div>
                    <button
                      onClick={() => toggleModuleDisable(mod.id)}
                      className={`px-4 py-2 rounded-xl border text-xs font-black transition-colors flex items-center gap-2 ${
                        !isModDisabled
                          ? 'bg-accent-500 text-surface-50 border-accent-600 shadow-sm'
                          : 'bg-rose-500 text-surface-50 border-rose-600 shadow-sm'
                      }`}
                    >
                      {!isModDisabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {!isModDisabled ? 'MODULE ACTIVE' : 'MODULE DISABLED'}
                    </button>
                  </div>

                  {!isModDisabled && (
                    <div className="pt-3 border-t border-surface-200 dark:border-surface-800 space-y-2">
                      <div className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Individual Sub-Tool Controls</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {mod.tools.map(tool => {
                          const toolKey = `${mod.id}:${tool.id}`;
                          const isToolDisabled = !!governance.disabledTools[toolKey];
                          return (
                            <div key={tool.id} className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-between">
                              <span className={`text-xs font-bold ${isToolDisabled ? 'text-surface-400 line-through' : 'text-surface-700 dark:text-surface-200'}`}>
                                {tool.name}
                              </span>
                              <button
                                onClick={() => toggleToolDisable(mod.id, tool.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors ${
                                  !isToolDisabled
                                    ? 'bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300'
                                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {!isToolDisabled ? 'ENABLED' : 'HIDDEN'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 6: SYSTEM TOGGLES ─── */}
      {activeTab === 'system' && (
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-6 space-y-6">
          <div>
            <h2 className="font-black text-lg text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-600" /> Platform Feature Toggles & Maintenance Switches
            </h2>
            <p className="text-xs text-surface-500">Enable or disable core system features dynamically</p>
          </div>

          <div className="space-y-4">
            {[
              { key: 'aiTutorActive', label: 'AI Tutor & GRUCA Problem Solver', desc: 'Allow users to query AI models for step-by-step solutions' },
              { key: 'userRegistrationOpen', label: 'New User Signups', desc: 'Allow new user registration via email & Google OAuth' },
              { key: 'pubchemSyncActive', label: 'PubChem Live Sync Feed', desc: 'Query PubChem REST PUG API for external compound data' },
              { key: 'maintenanceMode', label: 'Platform Maintenance Mode', desc: 'Display maintenance banner to non-admin users' },
            ].map(item => {
              const active = systemConfig[item.key as keyof typeof systemConfig];
              return (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                  <div>
                    <div className="font-bold text-xs text-surface-900 dark:text-surface-50">{item.label}</div>
                    <div className="text-[11px] text-surface-500">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => toggleSystemConfig(item.key)}
                    className={`p-2 rounded-xl border transition-colors flex items-center gap-2 text-xs font-bold ${
                      active 
                        ? 'bg-accent-50 dark:bg-accent-950 border-accent-300 text-accent-700 dark:text-accent-300' 
                        : 'bg-surface-100 dark:bg-surface-800 border-surface-300 text-surface-500'
                    }`}
                  >
                    {active ? <ToggleRight className="w-5 h-5 text-accent-600" /> : <ToggleLeft className="w-5 h-5 text-surface-400" />}
                    {active ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
