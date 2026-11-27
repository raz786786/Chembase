import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  ShieldCheck,
  WifiOff,
  Layers,
  Server,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { TIER_LABELS, type ProviderTier } from '../../data/providerCatalog';
import {
  fetchProviderCatalog,
  updateProviderModels,
  syncProviderModels,
  testProviderModel,
  getAllModelsForProvider,
  getEnabledModelsForProvider,
  PROVIDERS_UPDATED_EVENT,
  type ProviderConnectionView,
  type ProviderMode,
  type TestModelResult,
} from '../../utils/providerRouter';

interface UserModelsManagerProps {
  onGoToProviders?: () => void;
}

type ModelStatusFilter = 'all' | 'enabled' | 'disabled';

const TIER_BADGE_CLASSES: Record<ProviderTier | 'custom', string> = {
  frontier:
    'bg-primary-100 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
  high_speed:
    'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  open_source:
    'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  aggregator:
    'bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  custom:
    'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
};

export default function UserModelsManager({ onGoToProviders }: UserModelsManagerProps) {
  const [providers, setProviders] = useState<ProviderConnectionView[]>([]);
  const [mode, setMode] = useState<ProviderMode>('backend');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ModelStatusFilter>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // Accordion collapse state (expanded by default)
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

  // Action busy states
  const [globalBusy, setGlobalBusy] = useState<'select_all' | 'deselect_all' | null>(null);
  const [providerBusy, setProviderBusy] = useState<Record<string, string | null>>({});
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});
  const [togglingModels, setTogglingModels] = useState<Record<string, boolean>>({});
  const [testingModels, setTestingModels] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestModelResult>>({});

  const loadCatalog = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchProviderCatalog();
      setProviders(res.providers);
      setMode(res.mode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load provider catalog';
      setLoadError(msg);
      if (!silent) toast.error(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
    const handleSyncEvent = () => {
      loadCatalog(true);
    };
    window.addEventListener(PROVIDERS_UPDATED_EVENT, handleSyncEvent);
    return () => window.removeEventListener(PROVIDERS_UPDATED_EVENT, handleSyncEvent);
  }, [loadCatalog]);

  const connectedProviders = useMemo(
    () => providers.filter((p) => p.is_connected),
    [providers]
  );

  // Summary metrics across all connected providers
  const summary = useMemo(() => {
    let totalModels = 0;
    let enabledModels = 0;
    for (const p of connectedProviders) {
      totalModels += getAllModelsForProvider(p).length;
      enabledModels += getEnabledModelsForProvider(p).length;
    }
    return {
      connectedCount: connectedProviders.length,
      totalModels,
      enabledModels,
    };
  }, [connectedProviders]);

  // Filtered provider groups + models
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    return connectedProviders
      .filter((p) => providerFilter === 'all' || p.provider_id === providerFilter)
      .map((p) => {
        const allModels = getAllModelsForProvider(p);
        const disabledSet = new Set(p.disabled_models || []);
        const providerMatchesQuery =
          !q ||
          p.display_name.toLowerCase().includes(q) ||
          p.provider_id.toLowerCase().includes(q);

        const visibleModels = allModels.filter((modelId) => {
          const isEffectivelyEnabled = p.is_enabled && !disabledSet.has(modelId);
          if (statusFilter === 'enabled' && !isEffectivelyEnabled) return false;
          if (statusFilter === 'disabled' && isEffectivelyEnabled) return false;
          if (!q) return true;
          return providerMatchesQuery || modelId.toLowerCase().includes(q);
        });

        return {
          provider: p,
          allModels,
          visibleModels,
          enabledCount: getEnabledModelsForProvider(p).length,
        };
      })
      .filter((group) => {
        if (q || statusFilter !== 'all') {
          return group.visibleModels.length > 0;
        }
        return true;
      });
  }, [connectedProviders, search, statusFilter, providerFilter]);

  const toggleCollapse = (providerId: string) => {
    setCollapsedIds((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  // ─── Global Bulk Actions ──────────────────────────────────────────────────

  const handleGlobalSelectAll = async () => {
    if (connectedProviders.length === 0) return;
    setGlobalBusy('select_all');
    const previous = providers;

    // Optimistic update
    setProviders((prev) =>
      prev.map((p) =>
        p.is_connected ? { ...p, is_enabled: true, disabled_models: [] } : p
      )
    );

    try {
      const results = await Promise.allSettled(
        connectedProviders.map((p) =>
          updateProviderModels(p.id, { is_enabled: true, disabled_models: [] })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed === 0) {
        toast.success(
          `Enabled all ${summary.totalModels} models across ${connectedProviders.length} provider${connectedProviders.length === 1 ? '' : 's'}.`
        );
      } else {
        toast.warning(
          `Enabled models for ${connectedProviders.length - failed}/${connectedProviders.length} providers (${failed} failed).`
        );
        await loadCatalog(true);
      }
    } catch (err) {
      setProviders(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to enable all models');
    } finally {
      setGlobalBusy(null);
    }
  };

  const handleGlobalDeselectAll = async () => {
    if (connectedProviders.length === 0) return;
    setGlobalBusy('deselect_all');
    const previous = providers;

    // Optimistic update
    setProviders((prev) =>
      prev.map((p) =>
        p.is_connected
          ? { ...p, disabled_models: getAllModelsForProvider(p) }
          : p
      )
    );

    try {
      const results = await Promise.allSettled(
        connectedProviders.map((p) =>
          updateProviderModels(p.id, {
            disabled_models: getAllModelsForProvider(p),
          })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed === 0) {
        toast.success(
          `Disabled all models across ${connectedProviders.length} provider${connectedProviders.length === 1 ? '' : 's'}.`
        );
      } else {
        toast.warning(
          `Disabled models for ${connectedProviders.length - failed}/${connectedProviders.length} providers (${failed} failed).`
        );
        await loadCatalog(true);
      }
    } catch (err) {
      setProviders(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to disable all models');
    } finally {
      setGlobalBusy(null);
    }
  };

  // ─── Per-Provider Actions ─────────────────────────────────────────────────

  const handleToggleProviderMaster = async (p: ProviderConnectionView) => {
    const nextEnabled = !p.is_enabled;
    const previous = providers;
    setProviderBusy((prev) => ({ ...prev, [p.provider_id]: 'master' }));

    setProviders((prev) =>
      prev.map((item) =>
        item.provider_id === p.provider_id
          ? { ...item, is_enabled: nextEnabled }
          : item
      )
    );

    try {
      const res = await updateProviderModels(p.id, { is_enabled: nextEnabled });
      setMode(res.mode);
      toast.success(
        `${p.display_name} ${nextEnabled ? 'enabled' : 'disabled'} for website users.`
      );
    } catch (err) {
      setProviders(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to update provider switch');
    } finally {
      setProviderBusy((prev) => ({ ...prev, [p.provider_id]: null }));
    }
  };

  const handleProviderSelectAll = async (p: ProviderConnectionView) => {
    const previous = providers;
    setProviderBusy((prev) => ({ ...prev, [p.provider_id]: 'select_all' }));

    setProviders((prev) =>
      prev.map((item) =>
        item.provider_id === p.provider_id
          ? { ...item, is_enabled: true, disabled_models: [] }
          : item
      )
    );

    try {
      const res = await updateProviderModels(p.id, {
        is_enabled: true,
        disabled_models: [],
      });
      setMode(res.mode);
      toast.success(
        `Enabled all ${getAllModelsForProvider(p).length} models for ${p.display_name}.`
      );
    } catch (err) {
      setProviders(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to enable provider models');
    } finally {
      setProviderBusy((prev) => ({ ...prev, [p.provider_id]: null }));
    }
  };

  const handleProviderDeselectAll = async (p: ProviderConnectionView) => {
    const allModels = getAllModelsForProvider(p);
    const previous = providers;
    setProviderBusy((prev) => ({ ...prev, [p.provider_id]: 'deselect_all' }));

    setProviders((prev) =>
      prev.map((item) =>
        item.provider_id === p.provider_id
          ? { ...item, disabled_models: allModels }
          : item
      )
    );

    try {
      const res = await updateProviderModels(p.id, {
        disabled_models: allModels,
      });
      setMode(res.mode);
      toast.success(`Disabled all models for ${p.display_name}.`);
    } catch (err) {
      setProviders(previous);
      toast.error(err instanceof Error ? err.message : 'Failed to disable provider models');
    } finally {
      setProviderBusy((prev) => ({ ...prev, [p.provider_id]: null }));
    }
  };

  const handleProviderSync = async (p: ProviderConnectionView) => {
    setSyncingIds((prev) => ({ ...prev, [p.provider_id]: true }));
    try {
      const res = await syncProviderModels(p.id);
      setMode(res.mode);
      if (res.ok) {
        toast.success(`${p.display_name}: ${res.message}`);
        await loadCatalog(true);
      } else {
        toast.error(`${p.display_name}: ${res.message}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Model sync failed');
    } finally {
      setSyncingIds((prev) => ({ ...prev, [p.provider_id]: false }));
    }
  };

  // ─── Per-Model Actions ────────────────────────────────────────────────────

  const handleToggleSingleModel = async (
    p: ProviderConnectionView,
    modelId: string
  ) => {
    const key = `${p.provider_id}:${modelId}`;
    const disabledSet = new Set(p.disabled_models || []);
    const willEnable = disabledSet.has(modelId);

    if (willEnable) {
      disabledSet.delete(modelId);
    } else {
      disabledSet.add(modelId);
    }
    const nextDisabled = Array.from(disabledSet);

    const previous = providers;
    setTogglingModels((prev) => ({ ...prev, [key]: true }));
    setProviders((prev) =>
      prev.map((item) =>
        item.provider_id === p.provider_id
          ? { ...item, disabled_models: nextDisabled }
          : item
      )
    );

    try {
      const res = await updateProviderModels(p.id, {
        disabled_models: nextDisabled,
      });
      setMode(res.mode);
    } catch (err) {
      setProviders(previous);
      toast.error(
        err instanceof Error ? err.message : `Failed to update ${modelId}`
      );
    } finally {
      setTogglingModels((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleTestSingleModel = async (
    p: ProviderConnectionView,
    modelId: string
  ) => {
    const key = `${p.provider_id}:${modelId}`;
    setTestingModels((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await testProviderModel(p.id, modelId);
      setMode(res.mode);
      setTestResults((prev) => ({ ...prev, [key]: res }));
      if (res.ok) {
        toast.success(`${modelId} responded in ${res.latency_ms} ms`);
      } else {
        toast.error(`${modelId}: ${res.error || 'Model probe failed'}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Model test failed';
      setTestResults((prev) => ({
        ...prev,
        [key]: {
          ok: false,
          model_id: modelId,
          latency_ms: 0,
          error: msg,
          mode,
        },
      }));
      toast.error(`${modelId}: ${msg}`);
    } finally {
      setTestingModels((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── TOP CONTROL BAR ─── */}
      <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-black text-lg sm:text-xl text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                User Models Governance
              </h2>
              {mode === 'backend' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> Backend Encrypted Proxy
                </span>
              ) : (
                <span
                  title="FastAPI backend is offline or cold-starting. Model visibility changes are stored locally in this browser."
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  <WifiOff className="w-3.5 h-3.5" /> Local Fallback Mode
                </span>
              )}
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Control which AI models are exposed to website users across all connected providers. Toggle individual models, bulk-select per provider, or update everything at once.
            </p>
          </div>

          {/* Global Bulk Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGlobalSelectAll}
              disabled={globalBusy !== null || connectedProviders.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-surface-50 shadow-md shadow-emerald-600/20 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center gap-1.5"
            >
              {globalBusy === 'select_all' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckSquare className="w-3.5 h-3.5" />
              )}
              Select All (Enable All)
            </button>

            <button
              type="button"
              onClick={handleGlobalDeselectAll}
              disabled={globalBusy !== null || connectedProviders.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-950 disabled:opacity-45 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/40 flex items-center gap-1.5"
            >
              {globalBusy === 'deselect_all' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              Deselect All (Disable All)
            </button>

            <button
              type="button"
              onClick={() => loadCatalog()}
              disabled={loading}
              aria-label="Refresh user models"
              className="px-3 py-2 rounded-xl text-xs font-bold border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary KPI Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-900/70 border border-surface-200 dark:border-surface-800 text-xs font-bold text-surface-700 dark:text-surface-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="tabular-nums">{summary.connectedCount}</span>
            <span className="text-surface-400 font-semibold">Connected Providers</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-900/70 border border-surface-200 dark:border-surface-800 text-xs font-bold text-surface-700 dark:text-surface-200 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary-500" />
            <span className="tabular-nums">
              {summary.enabledModels} / {summary.totalModels}
            </span>
            <span className="text-surface-400 font-semibold">Enabled Models for Users</span>
          </div>
        </div>

        {loadError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" /> {loadError}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-surface-200/70 dark:border-surface-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models or providers..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Pills */}
            <div className="flex gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'enabled', label: 'Enabled' },
                  { id: 'disabled', label: 'Disabled' },
                ] as { id: ModelStatusFilter; label: string }[]
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${
                    statusFilter === st.id
                      ? 'bg-primary-600 text-surface-50 shadow-sm'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Provider Filter Dropdown */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              aria-label="Filter by connected provider"
              className="px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs font-bold text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
            >
              <option value="all">All Connected Providers ({connectedProviders.length})</option>
              {connectedProviders.map((p) => (
                <option key={p.provider_id} value={p.provider_id}>
                  {p.display_name} ({getEnabledModelsForProvider(p).length}/{getAllModelsForProvider(p).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── CONTENT AREA ─── */}
      {loading && providers.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-6 h-36 animate-pulse"
            />
          ))}
        </div>
      ) : connectedProviders.length === 0 ? (
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/70 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 flex items-center justify-center mx-auto">
            <Server className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-black text-surface-900 dark:text-surface-50">
              No AI Providers Connected Yet
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Connect at least one AI provider in the AI Providers & Models hub first. Once connected, all its available models will appear here categorized by provider.
            </p>
          </div>
          {onGoToProviders && (
            <button
              type="button"
              onClick={onGoToProviders}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-surface-50 shadow-md shadow-primary-600/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            >
              Go to AI Providers & Models <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-10 text-center space-y-3">
          <p className="text-sm font-bold text-surface-800 dark:text-surface-100">
            No models match your current search or filter
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Try clearing the search query or switching status and provider filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setProviderFilter('all');
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-100 border border-surface-200 dark:border-surface-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(({ provider: p, allModels, visibleModels, enabledCount }) => {
            const isCollapsed = !!collapsedIds[p.provider_id];
            const isSyncing = !!syncingIds[p.provider_id];
            const busyAction = providerBusy[p.provider_id];
            const disabledSet = new Set(p.disabled_models || []);
            const customSet = new Set(p.custom_models || []);

            const statusDotClass = p.is_valid
              ? 'bg-emerald-500'
              : p.last_error
                ? 'bg-rose-500'
                : 'bg-amber-400';

            return (
              <div
                key={p.provider_id}
                className={`glass rounded-2xl border overflow-hidden transition-colors ${
                  p.is_enabled
                    ? 'border-surface-200 dark:border-surface-800'
                    : 'border-surface-200/70 dark:border-surface-800/70 opacity-90'
                }`}
              >
                {/* Provider Category Card Header */}
                <div className="px-4 sm:px-5 py-3.5 bg-surface-50/80 dark:bg-surface-900/60 border-b border-surface-200/70 dark:border-surface-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(p.provider_id)}
                      aria-label={isCollapsed ? `Expand ${p.display_name}` : `Collapse ${p.display_name}`}
                      className="p-1.5 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-surface-50 hover:bg-surface-200/70 dark:hover:bg-surface-800 transition-colors flex-shrink-0"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDotClass}`}
                      title={
                        p.is_valid
                          ? 'Verified connection'
                          : p.last_error || 'Connected (unverified)'
                      }
                    />

                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <h3 className="font-black text-sm sm:text-base text-surface-900 dark:text-surface-50 truncate">
                        {p.display_name}
                      </h3>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${TIER_BADGE_CLASSES[p.tier]}`}
                      >
                        {TIER_LABELS[p.tier]}
                      </span>
                      <span className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md bg-surface-200/70 dark:bg-surface-800 text-surface-700 dark:text-surface-200">
                        {enabledCount} / {allModels.length} enabled
                      </span>
                    </div>
                  </div>

                  {/* Provider Header Controls */}
                  <div className="flex flex-wrap items-center gap-2 pl-9 xl:pl-0">
                    {/* Provider Master Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleProviderMaster(p)}
                      disabled={busyAction !== null && busyAction !== undefined}
                      title="Enable or disable this entire provider for website users"
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${
                        p.is_enabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                          : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700'
                      }`}
                    >
                      {p.is_enabled ? (
                        <ToggleRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                      {p.is_enabled ? 'Provider On' : 'Provider Off'}
                    </button>

                    {/* Per-Provider Select All */}
                    <button
                      type="button"
                      onClick={() => handleProviderSelectAll(p)}
                      disabled={!!busyAction || allModels.length === 0}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-surface-100 dark:bg-surface-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-200 dark:hover:border-emerald-800 disabled:opacity-40 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 transition-colors flex items-center gap-1"
                    >
                      {busyAction === 'select_all' ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckSquare className="w-3 h-3 text-emerald-500" />
                      )}
                      Select All
                    </button>

                    {/* Per-Provider Deselect All */}
                    <button
                      type="button"
                      onClick={() => handleProviderDeselectAll(p)}
                      disabled={!!busyAction || allModels.length === 0}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-surface-100 dark:bg-surface-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800 disabled:opacity-40 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 transition-colors flex items-center gap-1"
                    >
                      {busyAction === 'deselect_all' ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Square className="w-3 h-3 text-rose-500" />
                      )}
                      Deselect All
                    </button>

                    {/* Per-Provider Sync */}
                    <button
                      type="button"
                      onClick={() => handleProviderSync(p)}
                      disabled={isSyncing}
                      title="Sync fresh models from upstream"
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-40 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      Sync
                    </button>
                  </div>
                </div>

                {/* Provider Models Body */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 space-y-3">
                    {!p.is_enabled && (
                      <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-200 text-[11px] font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          Provider master switch is OFF — website users cannot access any {p.display_name} models until you re-enable this provider.
                        </span>
                      </div>
                    )}

                    {visibleModels.length === 0 ? (
                      <div className="p-4 rounded-xl bg-surface-100/70 dark:bg-surface-800/50 text-center text-xs text-surface-500">
                        No models listed for {p.display_name}. Click Sync to fetch upstream models.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {visibleModels.map((modelId) => {
                          const key = `${p.provider_id}:${modelId}`;
                          const isModelDisabled = disabledSet.has(modelId);
                          const isCustom = customSet.has(modelId);
                          const isToggling = !!togglingModels[key];
                          const isTesting = !!testingModels[key];
                          const testRes = testResults[key];
                          const isActiveForUsers = p.is_enabled && !isModelDisabled;

                          return (
                            <div
                              key={modelId}
                              className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-2.5 ${
                                isActiveForUsers
                                  ? 'bg-surface-50 dark:bg-surface-900/70 border-surface-200 dark:border-surface-700/80'
                                  : 'bg-surface-100/60 dark:bg-surface-900/30 border-surface-200/60 dark:border-surface-800/80'
                              }`}
                            >
                              {/* Left: Toggle + Model ID */}
                              <button
                                type="button"
                                onClick={() => handleToggleSingleModel(p, modelId)}
                                disabled={isToggling}
                                className="flex items-center gap-2.5 min-w-0 flex-1 text-left group focus:outline-none"
                              >
                                {isModelDisabled ? (
                                  <ToggleLeft className="w-5 h-5 text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-200 flex-shrink-0 transition-colors" />
                                ) : (
                                  <ToggleRight
                                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                                      p.is_enabled
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-amber-500 dark:text-amber-400'
                                    }`}
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                      className={`font-mono text-xs font-bold truncate ${
                                        isModelDisabled
                                          ? 'line-through text-surface-400 dark:text-surface-500'
                                          : 'text-surface-900 dark:text-surface-50'
                                      }`}
                                      title={modelId}
                                    >
                                      {modelId}
                                    </span>
                                    {isCustom && (
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex-shrink-0">
                                        Custom
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Right: Test result + Test button + Status Pill */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {testRes && (
                                  <span
                                    title={
                                      testRes.ok
                                        ? testRes.preview || 'Model responded'
                                        : testRes.error || 'Model probe failed'
                                    }
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums border ${
                                      testRes.ok
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    }`}
                                  >
                                    {testRes.ok ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3" /> {testRes.latency_ms} ms
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3" /> Error
                                      </>
                                    )}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleTestSingleModel(p, modelId)}
                                  disabled={isTesting}
                                  title={`Run live probe on ${modelId}`}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-40 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 transition-colors flex items-center gap-1"
                                >
                                  {isTesting ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3 text-emerald-500" />
                                  )}
                                  Test
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleSingleModel(p, modelId)}
                                  disabled={isToggling}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${
                                    isModelDisabled
                                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                      : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  }`}
                                >
                                  {isModelDisabled ? 'Disabled' : 'Enabled'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
