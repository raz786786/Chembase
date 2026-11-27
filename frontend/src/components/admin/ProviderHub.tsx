import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Play,
  Settings2,
  ShieldCheck,
  WifiOff,
  X,
  Zap,
  Server,
  Clock,
  Layers,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TIER_LABELS,
  type ProviderProtocol,
  type ProviderTier,
} from '../../data/providerCatalog';
import {
  fetchProviderCatalog,
  saveProviderConnection,
  deleteProviderConnection,
  testProviderConnection,
  syncProviderModels,
  testProviderModel,
  updateProviderModels,
  testUnsavedProvider,
  getAllModelsForProvider,
  getEnabledModelsForProvider,
  type ProviderConnectionView,
  type ProviderMode,
  type TestModelResult,
} from '../../utils/providerRouter';

type TierFilter = 'all' | ProviderTier | 'custom';
type StatusFilter = 'all' | 'connected' | 'not_connected';

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

const PROTOCOL_LABELS: Record<ProviderProtocol, string> = {
  openai_compatible: 'OpenAI API',
  anthropic_compatible: 'Anthropic API',
  google: 'Google Gemini',
  ollama: 'Ollama',
};

function slugifyProviderId(name: string, protocol: ProviderProtocol): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  const prefix = protocol === 'anthropic_compatible' ? 'custom-anthropic' : 'custom-openai';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${base || 'endpoint'}-${suffix}`;
}

export default function ProviderHub() {
  const [providers, setProviders] = useState<ProviderConnectionView[]>([]);
  const [mode, setMode] = useState<ProviderMode>('backend');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Card-level action states
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});
  const [testingIds, setTestingIds] = useState<Record<string, boolean>>({});
  const [syncCounts, setSyncCounts] = useState<Record<string, number>>({});
  const [batchTesting, setBatchTesting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  // Provider Detail Modal state
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailDeleting, setDetailDeleting] = useState(false);
  const [detailTesting, setDetailTesting] = useState(false);
  const [detailSyncing, setDetailSyncing] = useState(false);
  const [detailFeedback, setDetailFeedback] = useState<{
    kind: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [customModelInput, setCustomModelInput] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [modelTesting, setModelTesting] = useState<Record<string, boolean>>({});
  const [modelTestResults, setModelTestResults] = useState<Record<string, TestModelResult>>({});

  // Custom Compatible Provider Modal state
  const [customModalProtocol, setCustomModalProtocol] = useState<
    'openai_compatible' | 'anthropic_compatible' | null
  >(null);
  const [customName, setCustomName] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [customModelsText, setCustomModelsText] = useState('');
  const [customTesting, setCustomTesting] = useState(false);
  const [customSaving, setCustomSaving] = useState(false);
  const [customFeedback, setCustomFeedback] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

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
      toast.error(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const selectedProvider = useMemo(
    () => providers.find((p) => p.provider_id === selectedProviderId) || null,
    [providers, selectedProviderId]
  );

  // Open detail modal and hydrate fields
  const openDetailModal = (p: ProviderConnectionView) => {
    setSelectedProviderId(p.provider_id);
    setApiKeyInput('');
    setShowKey(false);
    setBaseUrlInput(p.base_url || p.default_base_url);
    setDetailFeedback(null);
    setCustomModelInput('');
    setModelSearch('');
    setModelTestResults({});
  };

  const closeDetailModal = () => {
    setSelectedProviderId(null);
    setDetailFeedback(null);
  };

  // Open custom compatible modal
  const openCustomModal = (protocol: 'openai_compatible' | 'anthropic_compatible') => {
    setCustomModalProtocol(protocol);
    setCustomName('');
    setCustomBaseUrl(
      protocol === 'anthropic_compatible'
        ? 'https://api.anthropic.com/v1'
        : 'https://api.example.com/v1'
    );
    setCustomApiKey('');
    setShowCustomKey(false);
    setCustomModelsText('');
    setCustomFeedback(null);
  };

  // Summary metrics
  const stats = useMemo(() => {
    const connected = providers.filter((p) => p.is_connected);
    const enabledModelsCount = connected.reduce(
      (sum, p) => sum + getEnabledModelsForProvider(p).length,
      0
    );
    return {
      total: providers.length,
      connected: connected.length,
      enabledModels: enabledModelsCount,
    };
  }, [providers]);

  // Filtered providers
  const filteredProviders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return providers.filter((p) => {
      if (tierFilter !== 'all' && p.tier !== tierFilter) return false;
      if (statusFilter === 'connected' && !p.is_connected) return false;
      if (statusFilter === 'not_connected' && p.is_connected) return false;
      if (!q) return true;
      const allModels = getAllModelsForProvider(p);
      return (
        p.display_name.toLowerCase().includes(q) ||
        p.provider_id.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        allModels.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [providers, search, tierFilter, statusFilter]);

  // Card Quick Sync
  const handleCardSync = async (p: ProviderConnectionView) => {
    if (!p.is_connected) {
      openDetailModal(p);
      return;
    }
    setSyncingIds((prev) => ({ ...prev, [p.provider_id]: true }));
    try {
      const res = await syncProviderModels(p.id);
      setMode(res.mode);
      if (res.ok) {
        setSyncCounts((prev) => ({ ...prev, [p.provider_id]: res.synced_count }));
        toast.success(`${p.display_name}: ${res.message}`);
        await loadCatalog(true);
      } else {
        toast.error(`${p.display_name}: ${res.message}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncingIds((prev) => ({ ...prev, [p.provider_id]: false }));
    }
  };

  // Card Quick Test
  const handleCardTest = async (p: ProviderConnectionView) => {
    if (!p.is_connected) {
      openDetailModal(p);
      return;
    }
    setTestingIds((prev) => ({ ...prev, [p.provider_id]: true }));
    try {
      const res = await testProviderConnection(p.id);
      setMode(res.mode);
      if (res.ok) {
        toast.success(`${p.display_name}: Verified (${res.latency_ms} ms)`);
      } else {
        toast.error(`${p.display_name}: ${res.error || res.message}`);
      }
      await loadCatalog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setTestingIds((prev) => ({ ...prev, [p.provider_id]: false }));
    }
  };

  // Batch Test All Connected
  const handleTestAllConnected = async () => {
    const connected = providers.filter((p) => p.is_connected);
    if (connected.length === 0) {
      toast.info('No connected providers to test.');
      return;
    }
    setBatchTesting(true);
    setBatchProgress({ done: 0, total: connected.length });
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < connected.length; i++) {
      const p = connected[i];
      setTestingIds((prev) => ({ ...prev, [p.provider_id]: true }));
      try {
        const res = await testProviderConnection(p.id);
        setMode(res.mode);
        if (res.ok) passed++;
        else failed++;
      } catch {
        failed++;
      } finally {
        setTestingIds((prev) => ({ ...prev, [p.provider_id]: false }));
        setBatchProgress({ done: i + 1, total: connected.length });
      }
    }

    await loadCatalog(true);
    setBatchTesting(false);
    if (failed === 0) {
      toast.success(`All ${passed} connected provider${passed === 1 ? '' : 's'} verified.`);
    } else {
      toast.warning(`Batch test finished: ${passed} passed, ${failed} failed.`);
    }
  };

  // Detail Modal: Save Connection
  const handleDetailSave = async () => {
    if (!selectedProvider) return;
    const trimmedKey = apiKeyInput.trim();
    if (!selectedProvider.is_connected && !selectedProvider.no_auth_required && !trimmedKey) {
      setDetailFeedback({ kind: 'error', text: 'Please enter an API key before saving.' });
      return;
    }

    setDetailSaving(true);
    setDetailFeedback(null);
    try {
      const res = await saveProviderConnection({
        provider_id: selectedProvider.provider_id,
        display_name: selectedProvider.display_name,
        protocol: selectedProvider.protocol,
        base_url: baseUrlInput.trim() || selectedProvider.default_base_url,
        api_key: trimmedKey || undefined,
        is_custom: selectedProvider.is_custom,
        is_enabled: selectedProvider.is_enabled,
      });
      setMode(res.mode);
      setApiKeyInput('');
      setDetailFeedback({
        kind: 'success',
        text:
          res.mode === 'backend'
            ? 'Connection saved and API key encrypted on backend.'
            : 'Connection saved in Local Fallback Mode.',
      });
      toast.success(`${selectedProvider.display_name} saved`);
      await loadCatalog(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save connection';
      setDetailFeedback({ kind: 'error', text: msg });
    } finally {
      setDetailSaving(false);
    }
  };

  // Detail Modal: Test Connection (saved OR unsaved!)
  const handleDetailTest = async () => {
    if (!selectedProvider) return;
    setDetailTesting(true);
    setDetailFeedback(null);
    try {
      const trimmedKey = apiKeyInput.trim();
      const trimmedUrl = baseUrlInput.trim() || selectedProvider.default_base_url;
      const isModifiedOrUnsaved =
        !selectedProvider.is_connected ||
        trimmedKey.length > 0 ||
        trimmedUrl !== selectedProvider.base_url;

      const res = isModifiedOrUnsaved
        ? await testUnsavedProvider({
            provider_id: selectedProvider.provider_id,
            protocol: selectedProvider.protocol,
            base_url: trimmedUrl,
            api_key: trimmedKey,
          })
        : await testProviderConnection(selectedProvider.id);

      setMode(res.mode);
      if (res.ok) {
        setDetailFeedback({
          kind: 'success',
          text: `${res.message} · ${res.latency_ms} ms`,
        });
      } else {
        setDetailFeedback({
          kind: 'error',
          text: res.error || res.message,
        });
      }
      if (!isModifiedOrUnsaved) {
        await loadCatalog(true);
      }
    } catch (err) {
      setDetailFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setDetailTesting(false);
    }
  };

  // Detail Modal: Delete Connection
  const handleDetailDelete = async () => {
    if (!selectedProvider || !selectedProvider.is_connected) return;
    setDetailDeleting(true);
    try {
      const res = await deleteProviderConnection(selectedProvider.id);
      setMode(res.mode);
      toast.success(`Removed ${selectedProvider.display_name} connection`);
      await loadCatalog(true);
      if (selectedProvider.is_custom) {
        closeDetailModal();
      } else {
        setDetailFeedback({ kind: 'info', text: 'Connection deleted.' });
      }
    } catch (err) {
      setDetailFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete connection',
      });
    } finally {
      setDetailDeleting(false);
    }
  };

  // Detail Modal: Sync Models
  const handleDetailSync = async () => {
    if (!selectedProvider) return;
    if (!selectedProvider.is_connected) {
      setDetailFeedback({ kind: 'error', text: 'Save the connection first to sync upstream models.' });
      return;
    }
    setDetailSyncing(true);
    setDetailFeedback(null);
    try {
      const res = await syncProviderModels(selectedProvider.id);
      setMode(res.mode);
      if (res.ok) {
        setSyncCounts((prev) => ({ ...prev, [selectedProvider.provider_id]: res.synced_count }));
        setDetailFeedback({
          kind: res.synced_count > 0 ? 'success' : 'info',
          text: `${res.message} (${res.latency_ms} ms)`,
        });
        await loadCatalog(true);
      } else {
        setDetailFeedback({ kind: 'error', text: res.message });
      }
    } catch (err) {
      setDetailFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Model sync failed',
      });
    } finally {
      setDetailSyncing(false);
    }
  };

  // Detail Modal: Toggle Provider Enabled
  const handleToggleProviderEnabled = async (p: ProviderConnectionView) => {
    if (!p.is_connected) return;
    try {
      const res = await updateProviderModels(p.id, { is_enabled: !p.is_enabled });
      setMode(res.mode);
      await loadCatalog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update provider');
    }
  };

  // Detail Modal: Toggle single model enabled/disabled
  const handleToggleModel = async (modelId: string) => {
    if (!selectedProvider || !selectedProvider.is_connected) return;
    const disabledSet = new Set(selectedProvider.disabled_models || []);
    if (disabledSet.has(modelId)) {
      disabledSet.delete(modelId);
    } else {
      disabledSet.add(modelId);
    }
    try {
      const res = await updateProviderModels(selectedProvider.id, {
        disabled_models: Array.from(disabledSet),
      });
      setMode(res.mode);
      await loadCatalog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update model toggle');
    }
  };

  // Detail Modal: Add Custom Model ID
  const handleAddCustomModel = async () => {
    if (!selectedProvider || !selectedProvider.is_connected) {
      setDetailFeedback({ kind: 'error', text: 'Save the connection before adding custom models.' });
      return;
    }
    const modelId = customModelInput.trim();
    if (!modelId) return;
    const existing = selectedProvider.custom_models || [];
    if (existing.includes(modelId)) {
      setCustomModelInput('');
      return;
    }
    try {
      const res = await updateProviderModels(selectedProvider.id, {
        custom_models: [modelId, ...existing],
      });
      setMode(res.mode);
      setCustomModelInput('');
      toast.success(`Added model "${modelId}"`);
      await loadCatalog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add model');
    }
  };

  // Detail Modal: Remove Custom Model ID
  const handleRemoveCustomModel = async (modelId: string) => {
    if (!selectedProvider || !selectedProvider.is_connected) return;
    const next = (selectedProvider.custom_models || []).filter((m) => m !== modelId);
    try {
      const res = await updateProviderModels(selectedProvider.id, { custom_models: next });
      setMode(res.mode);
      await loadCatalog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove model');
    }
  };

  // Detail Modal: Test Individual Model
  const handleTestSingleModel = async (modelId: string) => {
    if (!selectedProvider) return;
    setModelTesting((prev) => ({ ...prev, [modelId]: true }));
    try {
      const trimmedKey = apiKeyInput.trim();
      const trimmedUrl = baseUrlInput.trim() || selectedProvider.default_base_url;
      let result: TestModelResult;

      if (!selectedProvider.is_connected || trimmedKey.length > 0) {
        const r = await testUnsavedProvider({
          provider_id: selectedProvider.provider_id,
          protocol: selectedProvider.protocol,
          base_url: trimmedUrl,
          api_key: trimmedKey,
          model_id: modelId,
        });
        result = {
          ok: r.ok,
          model_id: modelId,
          latency_ms: r.latency_ms,
          preview: r.preview,
          error: r.error || (r.ok ? undefined : r.message),
          mode: r.mode,
        };
      } else {
        result = await testProviderModel(selectedProvider.id, modelId);
      }

      setMode(result.mode);
      setModelTestResults((prev) => ({ ...prev, [modelId]: result }));
    } catch (err) {
      setModelTestResults((prev) => ({
        ...prev,
        [modelId]: {
          ok: false,
          model_id: modelId,
          latency_ms: 0,
          error: err instanceof Error ? err.message : 'Model test failed',
          mode,
        },
      }));
    } finally {
      setModelTesting((prev) => ({ ...prev, [modelId]: false }));
    }
  };

  // Custom Provider Modal: Test Endpoint
  const handleTestCustomEndpoint = async () => {
    if (!customModalProtocol) return;
    if (!customBaseUrl.trim()) {
      setCustomFeedback({ kind: 'error', text: 'Base URL is required.' });
      return;
    }
    setCustomTesting(true);
    setCustomFeedback(null);
    const parsedModels = customModelsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await testUnsavedProvider({
        provider_id: slugifyProviderId(customName || 'custom', customModalProtocol),
        protocol: customModalProtocol,
        base_url: customBaseUrl.trim(),
        api_key: customApiKey.trim(),
        model_id: parsedModels[0],
      });
      setMode(res.mode);
      if (res.ok) {
        setCustomFeedback({
          kind: 'success',
          text: `${res.message} · ${res.latency_ms} ms${res.preview ? ` ("${res.preview}")` : ''}`,
        });
      } else {
        setCustomFeedback({ kind: 'error', text: res.error || res.message });
      }
    } catch (err) {
      setCustomFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Endpoint test failed',
      });
    } finally {
      setCustomTesting(false);
    }
  };

  // Custom Provider Modal: Save
  const handleSaveCustomProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModalProtocol) return;
    if (!customName.trim() || !customBaseUrl.trim()) {
      setCustomFeedback({ kind: 'error', text: 'Display name and Base URL are required.' });
      return;
    }
    setCustomSaving(true);
    setCustomFeedback(null);

    const parsedModels = customModelsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const providerId = slugifyProviderId(customName, customModalProtocol);

    try {
      const res = await saveProviderConnection({
        provider_id: providerId,
        display_name: customName.trim(),
        protocol: customModalProtocol,
        base_url: customBaseUrl.trim(),
        api_key: customApiKey.trim(),
        is_custom: true,
        is_enabled: true,
        custom_models: parsedModels,
      });
      setMode(res.mode);
      toast.success(`Added custom provider "${customName.trim()}"`);
      setCustomModalProtocol(null);
      await loadCatalog(true);
    } catch (err) {
      setCustomFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Failed to save custom provider',
      });
    } finally {
      setCustomSaving(false);
    }
  };

  // Models for selected provider in detail modal
  const selectedProviderModels = useMemo(() => {
    if (!selectedProvider) return [];
    const all = getAllModelsForProvider(selectedProvider);
    const q = modelSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter((m) => m.toLowerCase().includes(q));
  }, [selectedProvider, modelSearch]);

  return (
    <div className="space-y-6">
      {/* ─── HEADER & CONTROLS ─── */}
      <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-black text-lg sm:text-xl text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <Server className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Multi-Provider AI Hub
              </h2>
              {mode === 'backend' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> Backend Encrypted Proxy
                </span>
              ) : (
                <span
                  title="FastAPI backend is offline or cold-starting. Connections are stored locally in this browser."
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  <WifiOff className="w-3.5 h-3.5" /> Local Fallback Mode
                </span>
              )}
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Connect 44+ pre-configured AI providers or custom OpenAI/Anthropic-compatible endpoints, sync live model catalogs, and run real latency probes.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openCustomModal('openai_compatible')}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-100 border border-surface-200 dark:border-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-primary-500" /> Add OpenAI-Compatible
            </button>
            <button
              type="button"
              onClick={() => openCustomModal('anthropic_compatible')}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-100 border border-surface-200 dark:border-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-sky-500" /> Add Anthropic-Compatible
            </button>
            <button
              type="button"
              onClick={handleTestAllConnected}
              disabled={batchTesting || stats.connected === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-surface-50 shadow-md shadow-primary-600/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center gap-1.5"
            >
              {batchTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Testing ({batchProgress.done}/{batchProgress.total})
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" /> Test All Connected
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => loadCatalog()}
              disabled={loading}
              aria-label="Refresh providers"
              className="p-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metrics & Local Fallback Notice */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-900/70 border border-surface-200 dark:border-surface-800 text-xs font-bold text-surface-700 dark:text-surface-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{stats.connected}</span>
            <span className="text-surface-400 font-semibold">Connected</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-900/70 border border-surface-200 dark:border-surface-800 text-xs font-bold text-surface-700 dark:text-surface-200 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary-500" />
            <span>{stats.enabledModels}</span>
            <span className="text-surface-400 font-semibold">Active Routed Models</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-900/70 border border-surface-200 dark:border-surface-800 text-xs font-bold text-surface-700 dark:text-surface-200 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-surface-400" />
            <span>{stats.total}</span>
            <span className="text-surface-400 font-semibold">Providers Available</span>
          </div>
        </div>

        {mode === 'local_fallback' && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Backend offline · Local Fallback Mode active.</strong> Provider configurations are saved locally in your browser so you can keep working uninterrupted. CORS-enabled providers (OpenAI, Gemini, Groq, OpenRouter, etc.) support live sync and testing directly from the browser.
            </span>
          </div>
        )}

        {loadError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" /> {loadError}
          </div>
        )}

        {/* Search + Tier Tabs + Status Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-surface-200/70 dark:border-surface-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers, protocols, or model IDs..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tier Tabs */}
            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'frontier', label: 'Frontier' },
                  { id: 'high_speed', label: 'High Speed' },
                  { id: 'open_source', label: 'Open Source' },
                  { id: 'aggregator', label: 'Aggregator' },
                  { id: 'custom', label: 'Custom' },
                ] as { id: TierFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTierFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${
                    tierFilter === tab.id
                      ? 'bg-primary-600 text-surface-50 shadow-sm'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'connected', label: 'Connected' },
                  { id: 'not_connected', label: 'Not Connected' },
                ] as { id: StatusFilter; label: string }[]
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${
                    statusFilter === st.id
                      ? 'bg-surface-900 dark:bg-surface-100 text-surface-50 dark:text-surface-900'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── PROVIDER GRID ─── */}
      {loading && providers.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-5 h-48 animate-pulse"
            />
          ))}
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="glass rounded-2xl border border-surface-200 dark:border-surface-800 p-10 text-center space-y-2">
          <p className="text-sm font-bold text-surface-800 dark:text-surface-100">
            No providers match your current filters
          </p>
          <p className="text-xs text-surface-500">
            Try clearing the search query or switching tier/status filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProviders.map((p) => {
            const totalModels = getAllModelsForProvider(p).length;
            const enabledModels = getEnabledModelsForProvider(p).length;
            const isSyncing = !!syncingIds[p.provider_id];
            const isTesting = !!testingIds[p.provider_id];
            const syncedBadge = syncCounts[p.provider_id];

            const statusDotClass = !p.is_connected
              ? 'bg-surface-300 dark:bg-surface-700'
              : p.is_valid
                ? 'bg-emerald-500'
                : p.last_error
                  ? 'bg-rose-500'
                  : 'bg-amber-400';

            return (
              <div
                key={p.provider_id}
                className={`glass rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors ${
                  p.is_connected
                    ? 'border-primary-300/70 dark:border-primary-800/70'
                    : 'border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Name + Status Dot + Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDotClass}`}
                          title={
                            !p.is_connected
                              ? 'Not connected'
                              : p.is_valid
                                ? 'Verified connection'
                                : p.last_error || 'Saved (unverified)'
                          }
                        />
                        <h3 className="font-black text-sm text-surface-900 dark:text-surface-50 truncate">
                          {p.display_name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-surface-500 dark:text-surface-400 line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${TIER_BADGE_CLASSES[p.tier]}`}
                      >
                        {TIER_LABELS[p.tier]}
                      </span>
                      {p.free_tier_available && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-950/70 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800">
                          Free Tier
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connection Metadata */}
                  <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900/70 border border-surface-200/70 dark:border-surface-800 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-surface-400 font-semibold">Credentials</span>
                      <span className="font-mono text-surface-700 dark:text-surface-200 truncate max-w-[180px]">
                        {p.is_connected
                          ? p.key_masked || (p.no_auth_required ? 'Local (No Auth)' : 'Encrypted Key')
                          : 'Not connected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-surface-400 font-semibold">Models</span>
                      <span className="font-bold text-surface-700 dark:text-surface-200">
                        {p.is_connected ? `${enabledModels} / ${totalModels} active` : `${totalModels} catalog`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-surface-400 font-semibold">Latency / Protocol</span>
                      <span className="font-mono text-[10px] text-surface-600 dark:text-surface-300 flex items-center gap-1.5">
                        {p.last_latency_ms !== null && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Clock className="w-3 h-3" /> {p.last_latency_ms} ms
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-surface-200/70 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                          {PROTOCOL_LABELS[p.protocol]}
                        </span>
                      </span>
                    </div>
                  </div>

                  {p.last_error && p.is_connected && !p.is_valid && (
                    <p
                      className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 rounded-lg px-2.5 py-1.5 line-clamp-2"
                      title={p.last_error}
                    >
                      {p.last_error}
                    </p>
                  )}
                </div>

                {/* Action Footer */}
                <div className="flex items-center gap-2 pt-2 border-t border-surface-200/60 dark:border-surface-800">
                  <button
                    type="button"
                    onClick={() => openDetailModal(p)}
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-surface-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center justify-center gap-1.5"
                  >
                    <Settings2 className="w-3.5 h-3.5" /> Configure
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCardSync(p)}
                    disabled={!p.is_connected || isSyncing}
                    title={p.is_connected ? 'Sync live models from upstream' : 'Configure connection first'}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-40 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                    {syncedBadge !== undefined && (
                      <span className="px-1 py-0.2 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-[10px] font-mono">
                        {syncedBadge}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCardTest(p)}
                    disabled={!p.is_connected || isTesting}
                    title={p.is_connected ? 'Test live connection' : 'Configure connection first'}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-40 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center gap-1"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>Test</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── PROVIDER DETAIL MODAL ─── */}
      {selectedProvider && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-surface-950/70 backdrop-blur-sm"
            onClick={closeDetailModal}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface-50 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-surface-900 dark:text-surface-50 truncate">
                    {selectedProvider.display_name}
                  </h3>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${TIER_BADGE_CLASSES[selectedProvider.tier]}`}
                  >
                    {TIER_LABELS[selectedProvider.tier]}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                    {PROTOCOL_LABELS[selectedProvider.protocol]}
                  </span>
                </div>
                <p className="text-xs text-surface-500 mt-0.5 truncate">
                  {selectedProvider.description}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedProvider.is_connected && (
                  <button
                    type="button"
                    onClick={() => handleToggleProviderEnabled(selectedProvider)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${
                      selectedProvider.is_enabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-500 border-surface-200 dark:border-surface-700'
                    }`}
                  >
                    {selectedProvider.is_enabled ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                    {selectedProvider.is_enabled ? 'Enabled' : 'Disabled'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDetailModal}
                  aria-label="Close provider settings"
                  className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Credentials & Endpoint Section */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300">
                      API Key {selectedProvider.no_auth_required ? '(Optional for Local)' : ''}
                    </label>
                    {selectedProvider.api_key_docs_url && (
                      <a
                        href={selectedProvider.api_key_docs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                      >
                        Get API Key <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      autoComplete="off"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={
                        selectedProvider.is_connected && selectedProvider.key_masked
                          ? `Current: ${selectedProvider.key_masked} (leave blank to keep)`
                          : 'Paste your API key...'
                      }
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-mono text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      aria-label={showKey ? 'Hide API key' : 'Show API key'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300 mb-1.5">
                    Base URL Override
                  </label>
                  <input
                    type="url"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    placeholder={selectedProvider.default_base_url}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-mono text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors"
                  />
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDetailTest}
                    disabled={detailTesting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-100 border border-surface-200 dark:border-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center gap-1.5"
                  >
                    {detailTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    Test Connection
                  </button>

                  <button
                    type="button"
                    onClick={handleDetailSave}
                    disabled={detailSaving}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-surface-50 shadow-md shadow-primary-600/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center gap-1.5"
                  >
                    {detailSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Save Connection
                  </button>

                  {selectedProvider.is_connected && (
                    <button
                      type="button"
                      onClick={handleDetailDelete}
                      disabled={detailDeleting}
                      className="ml-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/40 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {detailDeleting ? 'Deleting...' : 'Delete Connection'}
                    </button>
                  )}
                </div>

                {detailFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                      detailFeedback.kind === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : detailFeedback.kind === 'error'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                          : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200'
                    }`}
                  >
                    {detailFeedback.kind === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : detailFeedback.kind === 'error' ? (
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="break-words">{detailFeedback.text}</span>
                  </div>
                )}
              </div>

              {/* Models Discovery & Governance Section */}
              <div className="pt-5 border-t border-surface-200 dark:border-surface-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-surface-800 dark:text-surface-100">
                      Models & Live Diagnostics ({selectedProviderModels.length})
                    </h4>
                    <p className="text-[11px] text-surface-500">
                      Sync upstream models, add custom IDs, toggle pipeline visibility, or run live inference checks.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetailSync}
                    disabled={!selectedProvider.is_connected || detailSyncing}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-900 dark:bg-surface-100 text-surface-50 dark:text-surface-900 hover:opacity-90 disabled:opacity-40 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500/40 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${detailSyncing ? 'animate-spin' : ''}`} />
                    Sync Models from Upstream
                  </button>
                </div>

                {/* Add Custom Model ID + Search Models */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomModel();
                        }
                      }}
                      placeholder="+ Add Custom Model ID..."
                      className="flex-1 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-mono text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomModel}
                      disabled={!customModelInput.trim() || !selectedProvider.is_connected}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-surface-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="Filter models..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Model List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedProviderModels.length === 0 ? (
                    <div className="p-4 rounded-xl bg-surface-100/70 dark:bg-surface-800/50 text-center text-xs text-surface-500">
                      No models listed yet. Click Sync Models from Upstream or add a custom Model ID.
                    </div>
                  ) : (
                    selectedProviderModels.map((modelId) => {
                      const isDisabled = (selectedProvider.disabled_models || []).includes(modelId);
                      const isCustomModel = (selectedProvider.custom_models || []).includes(modelId);
                      const isSyncedModel = (selectedProvider.synced_models || []).includes(modelId);
                      const testing = !!modelTesting[modelId];
                      const testRes = modelTestResults[modelId];

                      return (
                        <div
                          key={modelId}
                          className="p-3 rounded-xl bg-surface-100/70 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/70 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`font-mono text-xs font-bold truncate ${
                                  isDisabled
                                    ? 'line-through text-surface-400'
                                    : 'text-surface-900 dark:text-surface-50'
                                }`}
                              >
                                {modelId}
                              </span>
                              {isCustomModel ? (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                                  Custom
                                </span>
                              ) : isSyncedModel ? (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  Synced
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                                  Catalog
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleTestSingleModel(modelId)}
                                disabled={testing || (!selectedProvider.is_connected && !apiKeyInput.trim() && !selectedProvider.no_auth_required)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-surface-50 dark:bg-surface-900 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-40 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 transition-colors flex items-center gap-1"
                              >
                                {testing ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3 text-emerald-500" />
                                )}
                                Test
                              </button>

                              {selectedProvider.is_connected && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleModel(modelId)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-colors border ${
                                    isDisabled
                                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                      : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  }`}
                                >
                                  {isDisabled ? 'Disabled' : 'Enabled'}
                                </button>
                              )}

                              {isCustomModel && selectedProvider.is_connected && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomModel(modelId)}
                                  aria-label={`Remove ${modelId}`}
                                  className="p-1 rounded-lg text-surface-400 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {testRes && (
                            <div
                              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-mono flex items-start justify-between gap-2 ${
                                testRes.ok
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              <span className="break-words">
                                {testRes.ok
                                  ? `OK · "${testRes.preview || 'Response received'}"`
                                  : testRes.error || 'Model test failed'}
                              </span>
                              <span className="font-bold flex-shrink-0">{testRes.latency_ms} ms</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOM COMPATIBLE PROVIDER MODAL ─── */}
      {customModalProtocol && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-surface-950/70 backdrop-blur-sm"
            onClick={() => setCustomModalProtocol(null)}
          />
          <div className="relative w-full max-w-lg bg-surface-50 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-surface-900 dark:text-surface-50">
                  Add Custom{' '}
                  {customModalProtocol === 'anthropic_compatible'
                    ? 'Anthropic-Compatible'
                    : 'OpenAI-Compatible'}{' '}
                  Provider
                </h3>
                <p className="text-xs text-surface-500 mt-0.5">
                  Connect any self-hosted gateway, proxy, or regional LLM endpoint.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomModalProtocol(null)}
                aria-label="Close custom provider modal"
                className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomProvider} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300 mb-1">
                  Provider Name *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Corporate vLLM Gateway"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300 mb-1">
                  Base URL *
                </label>
                <input
                  type="url"
                  required
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="https://your-endpoint.example.com/v1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-mono text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showCustomKey ? 'text' : 'password'}
                    autoComplete="off"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-mono text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomKey((v) => !v)}
                    aria-label={showCustomKey ? 'Hide key' : 'Show key'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                  >
                    {showCustomKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300 mb-1">
                  Initial Model IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={customModelsText}
                  onChange={(e) => setCustomModelsText(e.target.value)}
                  placeholder="gpt-4o-mini, deepseek-r1, qwen2.5-72b"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-mono text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                />
              </div>

              {customFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                    customFeedback.kind === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {customFeedback.kind === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="break-words">{customFeedback.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestCustomEndpoint}
                  disabled={customTesting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-100 border border-surface-200 dark:border-surface-700 transition-colors flex items-center gap-1.5"
                >
                  {customTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  Test Endpoint
                </button>

                <button
                  type="submit"
                  disabled={customSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-surface-50 shadow-md shadow-primary-600/20 transition-colors flex items-center gap-1.5"
                >
                  {customSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Save Custom Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
