import { supabase } from '../supabaseClient';
import {
  PROVIDER_CATALOG,
  PROVIDER_CATALOG_MAP,
  type ProviderProtocol,
  type ProviderTier,
} from '../data/providerCatalog';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const LOCAL_STORAGE_KEY = 'chembase_provider_hub_local_v1';
const REQUEST_TIMEOUT_MS = 15000;

export const PROVIDERS_UPDATED_EVENT = 'chembase-providers-updated';

export type ProviderMode = 'backend' | 'local_fallback';

export interface ProviderConnectionView {
  id: string;
  provider_id: string;
  display_name: string;
  tier: ProviderTier | 'custom';
  protocol: ProviderProtocol;
  base_url: string;
  default_base_url: string;
  description: string;
  api_key_docs_url: string;
  free_tier_available: boolean;
  no_auth_required?: boolean;
  is_custom: boolean;
  is_connected: boolean;
  is_enabled: boolean;
  is_valid: boolean;
  key_masked: string | null;
  last_validated_at: string | null;
  last_latency_ms: number | null;
  last_error: string | null;
  default_models: string[];
  synced_models: string[];
  custom_models: string[];
  disabled_models: string[];
}

export interface CatalogResponse {
  mode: ProviderMode;
  providers: ProviderConnectionView[];
  notice?: string;
}

export interface SaveConnectionInput {
  provider_id: string;
  display_name?: string;
  protocol: ProviderProtocol;
  base_url?: string;
  api_key?: string;
  is_custom?: boolean;
  is_enabled?: boolean;
  custom_models?: string[];
}

export interface UpdateModelsInput {
  is_enabled?: boolean;
  custom_models?: string[];
  disabled_models?: string[];
}

export interface TestUnsavedInput {
  provider_id: string;
  protocol: ProviderProtocol;
  base_url: string;
  api_key: string;
  model_id?: string;
}

export interface SyncModelsResult {
  ok: boolean;
  synced_count: number;
  models: string[];
  latency_ms: number;
  message: string;
  mode: ProviderMode;
}

export interface TestConnectionResult {
  ok: boolean;
  latency_ms: number;
  status_code?: number;
  message: string;
  error?: string;
  mode: ProviderMode;
}

export interface TestModelResult {
  ok: boolean;
  model_id: string;
  latency_ms: number;
  preview?: string;
  error?: string;
  mode: ProviderMode;
}

export interface ActiveRoutedModel {
  provider_id: string;
  display_name: string;
  model_id: string;
  protocol: ProviderProtocol;
  is_custom: boolean;
}

export interface RoutedChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RoutedChatRequest {
  provider_id: string;
  model_id: string;
  messages: RoutedChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface RoutedChatResponse {
  ok: boolean;
  text: string;
  provider_id: string;
  model_id: string;
  latency_ms?: number;
  mode: ProviderMode;
  error?: string;
}

export interface AutoRoutedChatOptions {
  systemPrompt?: string;
  messages: RoutedChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  stripThinking?: boolean; // default true
}

export interface AutoRoutedChatResult {
  ok: boolean;
  text: string;
  provider_id?: string;
  display_name?: string;
  model_id?: string;
  latency_ms?: number;
  mode: 'ai' | 'offline';
  error?: string;
}

interface LocalStoredConnection {
  id: string;
  provider_id: string;
  display_name: string;
  protocol: ProviderProtocol;
  base_url: string;
  api_key: string;
  key_masked: string | null;
  is_custom: boolean;
  is_enabled: boolean;
  is_valid: boolean;
  last_validated_at: string | null;
  last_latency_ms: number | null;
  last_error: string | null;
  synced_models: string[];
  custom_models: string[];
  disabled_models: string[];
  updated_at: string;
}

let lastKnownMode: ProviderMode = 'backend';

export function getLastKnownProviderMode(): ProviderMode {
  return lastKnownMode;
}

export function dispatchProvidersUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROVIDERS_UPDATED_EVENT));
  }
}

export function getAllModelsForProvider(provider: ProviderConnectionView): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  const sources = [
    ...(provider.custom_models || []),
    ...(provider.synced_models || []),
    ...(provider.default_models || []),
  ];
  for (const m of sources) {
    const trimmed = m.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      ordered.push(trimmed);
    }
  }
  return ordered;
}

export function getEnabledModelsForProvider(provider: ProviderConnectionView): string[] {
  if (!provider.is_connected || !provider.is_enabled) return [];
  const disabled = new Set(provider.disabled_models || []);
  return getAllModelsForProvider(provider).filter((m) => !disabled.has(m));
}

export function maskApiKey(key: string): string | null {
  const trimmed = key.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 8) {
    return `••••${trimmed.slice(-2)}`;
  }
  return `${trimmed.slice(0, 6)}••••••••••••${trimmed.slice(-4)}`;
}

function scrubSecretText(text: string, secret?: string): string {
  let clean = text;
  if (secret && secret.trim().length >= 6) {
    clean = clean.split(secret.trim()).join('[REDACTED]');
  }
  clean = clean.replace(/(sk-[a-zA-Z0-9_-]{8,}|AIza[0-9A-Za-z_-]{16,}|gsk_[a-zA-Z0-9_-]{12,}|nvapi-[a-zA-Z0-9_-]{12,})/g, '[REDACTED]');
  return clean;
}

const NON_CHAT_MODEL_PATTERN =
  /(embed|embedding|whisper|tts|dall-e|imagen|veo|moderation|audio|realtime|transcribe|rerank|babbage|davinci-002|text-search|text-similarity|code-search|sora|flux|stable-diffusion|midjourney|omni-moderation|computer-use)/i;

export function filterChatModels(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    if (NON_CHAT_MODEL_PATTERN.test(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

// ─── Local Fallback Storage Helpers ──────────────────────────────────────────

function readLocalConnections(): Record<string, LocalStoredConnection> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, LocalStoredConnection>;
    }
  } catch {
    // ignore corrupt JSON
  }
  return {};
}

function writeLocalConnections(map: Record<string, LocalStoredConnection>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

function findLocalConnectionByIdOrProvider(
  map: Record<string, LocalStoredConnection>,
  idOrProvider: string
): LocalStoredConnection | undefined {
  if (map[idOrProvider]) return map[idOrProvider];
  return Object.values(map).find(
    (c) => c.id === idOrProvider || c.provider_id === idOrProvider
  );
}

function buildLocalCatalogViews(): ProviderConnectionView[] {
  const stored = readLocalConnections();
  const views: ProviderConnectionView[] = [];
  const usedProviderIds = new Set<string>();

  for (const item of PROVIDER_CATALOG) {
    const conn = stored[item.id];
    usedProviderIds.add(item.id);
    views.push({
      id: conn?.id || item.id,
      provider_id: item.id,
      display_name: conn?.display_name || item.display_name,
      tier: item.tier,
      protocol: conn?.protocol || item.protocol,
      base_url: conn?.base_url || item.default_base_url,
      default_base_url: item.default_base_url,
      description: item.description,
      api_key_docs_url: item.api_key_docs_url,
      free_tier_available: item.free_tier_available,
      no_auth_required: item.no_auth_required,
      is_custom: false,
      is_connected: Boolean(conn),
      is_enabled: conn ? conn.is_enabled : true,
      is_valid: conn ? conn.is_valid : false,
      key_masked: conn?.key_masked ?? null,
      last_validated_at: conn?.last_validated_at ?? null,
      last_latency_ms: conn?.last_latency_ms ?? null,
      last_error: conn?.last_error ?? null,
      default_models: item.default_models,
      synced_models: conn?.synced_models || [],
      custom_models: conn?.custom_models || [],
      disabled_models: conn?.disabled_models || [],
    });
  }

  for (const conn of Object.values(stored)) {
    if (usedProviderIds.has(conn.provider_id)) continue;
    views.push({
      id: conn.id,
      provider_id: conn.provider_id,
      display_name: conn.display_name,
      tier: 'custom',
      protocol: conn.protocol,
      base_url: conn.base_url,
      default_base_url: conn.base_url,
      description:
        conn.protocol === 'anthropic_compatible'
          ? 'Custom Anthropic-compatible endpoint'
          : 'Custom OpenAI-compatible endpoint',
      api_key_docs_url: '',
      free_tier_available: false,
      is_custom: true,
      is_connected: true,
      is_enabled: conn.is_enabled,
      is_valid: conn.is_valid,
      key_masked: conn.key_masked,
      last_validated_at: conn.last_validated_at,
      last_latency_ms: conn.last_latency_ms,
      last_error: conn.last_error,
      default_models: [],
      synced_models: conn.synced_models || [],
      custom_models: conn.custom_models || [],
      disabled_models: conn.disabled_models || [],
    });
  }

  return views;
}

// ─── Backend Auth & Fetch Helpers ────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore session errors
  }
  return headers;
}

class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

function isGatewayStatus(status: number): boolean {
  return status === 404 || status === 502 || status === 503 || status === 504;
}

async function backendRequest<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> {
  const headers = requireAuth
    ? await getAuthHeaders()
    : { 'Content-Type': 'application/json' };

  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new BackendUnavailableError(`Backend unreachable: ${msg}`);
  }

  if (isGatewayStatus(res.status)) {
    throw new BackendUnavailableError(`Backend returned HTTP ${res.status}`);
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail || body?.error || body?.message || detail;
    } catch {
      // ignore non-json error body
    }
    throw new Error(detail);
  }

  lastKnownMode = 'backend';
  return (await res.json()) as T;
}

// ─── Normalizer for Backend Catalog Payload ──────────────────────────────────

function normalizeBackendCatalog(raw: unknown): ProviderConnectionView[] {
  const obj = raw as Record<string, unknown>;
  const items: Record<string, unknown>[] = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : Array.isArray(obj?.providers)
      ? (obj.providers as Record<string, unknown>[])
      : Array.isArray(obj?.items)
        ? (obj.items as Record<string, unknown>[])
        : [];

  const connectionsArr: Record<string, unknown>[] = Array.isArray(obj?.connections)
    ? (obj.connections as Record<string, unknown>[])
    : [];

  const connByProvider = new Map<string, Record<string, unknown>>();
  for (const c of connectionsArr) {
    const pid = String(c.provider_id || '');
    if (pid) connByProvider.set(pid, c);
  }

  const views: ProviderConnectionView[] = [];
  const seen = new Set<string>();

  for (const entry of items) {
    const pid = String(entry.provider_id || entry.id || '');
    if (!pid) continue;
    seen.add(pid);

    const catalogItem = PROVIDER_CATALOG_MAP[pid];
    const nestedConn =
      (entry.connection as Record<string, unknown> | null | undefined) ||
      connByProvider.get(pid) ||
      (entry.is_connected || entry.key_masked || entry.encrypted_api_key ? entry : null);

    const isCustom = Boolean(entry.is_custom ?? nestedConn?.is_custom ?? !catalogItem);
    const protocol = (nestedConn?.protocol ||
      entry.protocol ||
      catalogItem?.protocol ||
      'openai_compatible') as ProviderProtocol;

    const defaultBaseUrl = String(
      entry.default_base_url || catalogItem?.default_base_url || nestedConn?.base_url || ''
    );
    const baseUrl = String(nestedConn?.base_url || entry.base_url || defaultBaseUrl);

    views.push({
      id: String(nestedConn?.id || entry.connection_id || entry.id || pid),
      provider_id: pid,
      display_name: String(
        nestedConn?.display_name || entry.display_name || catalogItem?.display_name || pid
      ),
      tier: isCustom
        ? 'custom'
        : ((entry.tier || catalogItem?.tier || 'open_source') as ProviderTier),
      protocol,
      base_url: baseUrl,
      default_base_url: defaultBaseUrl,
      description: String(
        entry.description ||
          catalogItem?.description ||
          (protocol === 'anthropic_compatible'
            ? 'Custom Anthropic-compatible endpoint'
            : 'Custom OpenAI-compatible endpoint')
      ),
      api_key_docs_url: String(entry.api_key_docs_url || catalogItem?.api_key_docs_url || ''),
      free_tier_available: Boolean(
        entry.free_tier_available ?? catalogItem?.free_tier_available ?? false
      ),
      no_auth_required: Boolean(entry.no_auth_required ?? catalogItem?.no_auth_required ?? false),
      is_custom: isCustom,
      is_connected: Boolean(nestedConn || entry.is_connected),
      is_enabled: Boolean(nestedConn?.is_enabled ?? entry.is_enabled ?? true),
      is_valid: Boolean(nestedConn?.is_valid ?? entry.is_valid ?? false),
      key_masked: (nestedConn?.key_masked ?? entry.key_masked ?? null) as string | null,
      last_validated_at: (nestedConn?.last_validated_at ?? entry.last_validated_at ?? null) as
        | string
        | null,
      last_latency_ms: (nestedConn?.last_latency_ms ?? entry.last_latency_ms ?? null) as
        | number
        | null,
      last_error: (nestedConn?.last_error ?? entry.last_error ?? null) as string | null,
      default_models: Array.isArray(entry.default_models)
        ? (entry.default_models as string[])
        : catalogItem?.default_models || [],
      synced_models: Array.isArray(nestedConn?.synced_models ?? entry.synced_models)
        ? ((nestedConn?.synced_models ?? entry.synced_models) as string[])
        : [],
      custom_models: Array.isArray(nestedConn?.custom_models ?? entry.custom_models)
        ? ((nestedConn?.custom_models ?? entry.custom_models) as string[])
        : [],
      disabled_models: Array.isArray(nestedConn?.disabled_models ?? entry.disabled_models)
        ? ((nestedConn?.disabled_models ?? entry.disabled_models) as string[])
        : [],
    });
  }

  // Merge any catalog items missing from backend response
  for (const item of PROVIDER_CATALOG) {
    if (seen.has(item.id)) continue;
    const conn = connByProvider.get(item.id);
    views.push({
      id: String(conn?.id || item.id),
      provider_id: item.id,
      display_name: String(conn?.display_name || item.display_name),
      tier: item.tier,
      protocol: (conn?.protocol || item.protocol) as ProviderProtocol,
      base_url: String(conn?.base_url || item.default_base_url),
      default_base_url: item.default_base_url,
      description: item.description,
      api_key_docs_url: item.api_key_docs_url,
      free_tier_available: item.free_tier_available,
      no_auth_required: item.no_auth_required,
      is_custom: false,
      is_connected: Boolean(conn),
      is_enabled: Boolean(conn?.is_enabled ?? true),
      is_valid: Boolean(conn?.is_valid ?? false),
      key_masked: (conn?.key_masked ?? null) as string | null,
      last_validated_at: (conn?.last_validated_at ?? null) as string | null,
      last_latency_ms: (conn?.last_latency_ms ?? null) as number | null,
      last_error: (conn?.last_error ?? null) as string | null,
      default_models: item.default_models,
      synced_models: Array.isArray(conn?.synced_models) ? (conn.synced_models as string[]) : [],
      custom_models: Array.isArray(conn?.custom_models) ? (conn.custom_models as string[]) : [],
      disabled_models: Array.isArray(conn?.disabled_models)
        ? (conn.disabled_models as string[])
        : [],
    });
  }

  return views;
}

// ─── Browser-Side Direct Probes (Local Fallback Mode Only) ───────────────────

const CORS_HINT =
  'Direct browser call was blocked by the provider CORS policy while the FastAPI backend proxy is offline. Wake or deploy the backend to test/sync this provider securely.';

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

async function browserDiscoverModels(
  protocol: ProviderProtocol,
  baseUrl: string,
  apiKey: string
): Promise<SyncModelsResult> {
  const start = performance.now();
  const base = normalizeBaseUrl(baseUrl);

  try {
    let url = '';
    const headers: Record<string, string> = {};

    if (protocol === 'google') {
      url = `${base}/v1beta/models`;
      if (apiKey) headers['x-goog-api-key'] = apiKey;
    } else if (protocol === 'ollama') {
      url = `${base}/api/tags`;
    } else if (protocol === 'anthropic_compatible') {
      url = `${base}/models`;
      if (apiKey) headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    } else {
      url = `${base}/models`;
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const latency_ms = Math.round(performance.now() - start);

    if (res.status === 404 && protocol === 'openai_compatible') {
      return {
        ok: true,
        synced_count: 0,
        models: [],
        latency_ms,
        message: 'Provider does not expose /models; using catalog and custom models.',
        mode: 'local_fallback',
      };
    }

    if (!res.ok) {
      const errText = scrubSecretText(await res.text().catch(() => ''), apiKey);
      return {
        ok: false,
        synced_count: 0,
        models: [],
        latency_ms,
        message: `HTTP ${res.status}: ${errText.slice(0, 180) || res.statusText}`,
        mode: 'local_fallback',
      };
    }

    const json = await res.json();
    let rawIds: string[] = [];

    if (protocol === 'google') {
      const list = Array.isArray(json?.models) ? json.models : [];
      rawIds = list
        .filter((m: Record<string, unknown>) => {
          const methods = m.supportedGenerationMethods;
          return !Array.isArray(methods) || methods.includes('generateContent');
        })
        .map((m: Record<string, unknown>) => String(m.name || '').replace(/^models\//, ''));
    } else if (protocol === 'ollama') {
      const list = Array.isArray(json?.models) ? json.models : [];
      rawIds = list.map((m: Record<string, unknown>) => String(m.name || ''));
    } else {
      const list = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.models)
          ? json.models
          : [];
      rawIds = list.map((m: Record<string, unknown>) => String(m.id || m.name || ''));
    }

    const filtered = filterChatModels(rawIds);
    return {
      ok: true,
      synced_count: filtered.length,
      models: filtered,
      latency_ms,
      message: `Synced ${filtered.length} chat model${filtered.length === 1 ? '' : 's'} in ${latency_ms} ms.`,
      mode: 'local_fallback',
    };
  } catch (err) {
    const latency_ms = Math.round(performance.now() - start);
    const isCorsOrNetwork = err instanceof TypeError;
    const message = isCorsOrNetwork
      ? CORS_HINT
      : scrubSecretText(err instanceof Error ? err.message : String(err), apiKey);
    return {
      ok: false,
      synced_count: 0,
      models: [],
      latency_ms,
      message,
      mode: 'local_fallback',
    };
  }
}

async function browserChatCompletion(
  protocol: ProviderProtocol,
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: RoutedChatMessage[],
  temperature = 0.2,
  maxTokens = 1024
): Promise<{ ok: boolean; text: string; latency_ms: number; error?: string; status?: number }> {
  const start = performance.now();
  const base = normalizeBaseUrl(baseUrl);

  try {
    let url = '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let body: Record<string, unknown> = {};

    if (protocol === 'google') {
      url = `${base}/v1beta/models/${encodeURIComponent(modelId)}:generateContent`;
      if (apiKey) headers['x-goog-api-key'] = apiKey;
      const systemMsg = messages.find((m) => m.role === 'system')?.content;
      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
      body = {
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens },
        ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg }] } } : {}),
      };
    } else if (protocol === 'anthropic_compatible') {
      url = `${base}/messages`;
      if (apiKey) headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
      const systemMsg = messages.find((m) => m.role === 'system')?.content;
      body = {
        model: modelId,
        max_tokens: maxTokens,
        temperature,
        ...(systemMsg ? { system: systemMsg } : {}),
        messages: messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content })),
      };
    } else if (protocol === 'ollama') {
      url = `${base}/api/chat`;
      body = {
        model: modelId,
        messages,
        stream: false,
        options: { temperature, num_predict: maxTokens },
      };
    } else {
      url = `${base}/chat/completions`;
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      body = {
        model: modelId,
        messages,
        temperature,
        max_tokens: maxTokens,
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const latency_ms = Math.round(performance.now() - start);

    if (!res.ok) {
      const errText = scrubSecretText(await res.text().catch(() => ''), apiKey);
      return {
        ok: false,
        text: '',
        latency_ms,
        status: res.status,
        error: `HTTP ${res.status}: ${errText.slice(0, 220) || res.statusText}`,
      };
    }

    const json = await res.json();
    let text = '';
    if (protocol === 'google') {
      const parts = json?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        text = parts.map((p: Record<string, unknown>) => String(p.text || '')).join('');
      }
    } else if (protocol === 'anthropic_compatible') {
      const content = json?.content;
      if (Array.isArray(content)) {
        text = content.map((c: Record<string, unknown>) => String(c.text || '')).join('');
      }
    } else if (protocol === 'ollama') {
      text = String(json?.message?.content || '');
    } else {
      text = String(json?.choices?.[0]?.message?.content || '');
    }

    return { ok: true, text: text.trim(), latency_ms, status: res.status };
  } catch (err) {
    const latency_ms = Math.round(performance.now() - start);
    const isCors = err instanceof TypeError;
    return {
      ok: false,
      text: '',
      latency_ms,
      error: isCors
        ? CORS_HINT
        : scrubSecretText(err instanceof Error ? err.message : String(err), apiKey),
    };
  }
}

// ─── Public Admin & AI Router API ────────────────────────────────────────────

export async function fetchProviderCatalog(): Promise<CatalogResponse> {
  try {
    const data = await backendRequest<unknown>('/admin/providers/catalog', { method: 'GET' });
    return {
      mode: 'backend',
      providers: normalizeBackendCatalog(data),
    };
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      lastKnownMode = 'local_fallback';
      return {
        mode: 'local_fallback',
        providers: buildLocalCatalogViews(),
        notice: 'Backend offline · Local fallback active',
      };
    }
    throw err;
  }
}

export async function saveProviderConnection(
  input: SaveConnectionInput
): Promise<{ mode: ProviderMode; connection_id: string }> {
  try {
    const res = await backendRequest<Record<string, unknown>>('/admin/providers/connections', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    dispatchProvidersUpdated();
    return {
      mode: 'backend',
      connection_id: String(res?.id || res?.connection_id || input.provider_id),
    };
  } catch (err) {
    if (!(err instanceof BackendUnavailableError)) throw err;

    lastKnownMode = 'local_fallback';
    const map = readLocalConnections();
    const existing = map[input.provider_id];
    const catalogItem = PROVIDER_CATALOG_MAP[input.provider_id];
    const resolvedKey =
      input.api_key !== undefined && input.api_key.trim() !== ''
        ? input.api_key.trim()
        : existing?.api_key || '';

    const record: LocalStoredConnection = {
      id: existing?.id || input.provider_id,
      provider_id: input.provider_id,
      display_name:
        input.display_name?.trim() ||
        existing?.display_name ||
        catalogItem?.display_name ||
        input.provider_id,
      protocol: input.protocol,
      base_url:
        input.base_url?.trim() ||
        existing?.base_url ||
        catalogItem?.default_base_url ||
        '',
      api_key: resolvedKey,
      key_masked: maskApiKey(resolvedKey),
      is_custom: input.is_custom ?? existing?.is_custom ?? !catalogItem,
      is_enabled: input.is_enabled ?? existing?.is_enabled ?? true,
      is_valid: existing?.is_valid ?? false,
      last_validated_at: existing?.last_validated_at ?? null,
      last_latency_ms: existing?.last_latency_ms ?? null,
      last_error: existing?.last_error ?? null,
      synced_models: existing?.synced_models || [],
      custom_models: input.custom_models ?? existing?.custom_models ?? [],
      disabled_models: existing?.disabled_models || [],
      updated_at: new Date().toISOString(),
    };

    map[input.provider_id] = record;
    writeLocalConnections(map);
    dispatchProvidersUpdated();
    return { mode: 'local_fallback', connection_id: record.id };
  }
}

export async function deleteProviderConnection(
  connectionId: string
): Promise<{ mode: ProviderMode }> {
  try {
    await backendRequest<unknown>(`/admin/providers/connections/${encodeURIComponent(connectionId)}`, {
      method: 'DELETE',
    });
    dispatchProvidersUpdated();
    return { mode: 'backend' };
  } catch (err) {
    if (!(err instanceof BackendUnavailableError)) throw err;

    lastKnownMode = 'local_fallback';
    const map = readLocalConnections();
    const found = findLocalConnectionByIdOrProvider(map, connectionId);
    if (found) {
      delete map[found.provider_id];
      writeLocalConnections(map);
    }
    dispatchProvidersUpdated();
    return { mode: 'local_fallback' };
  }
}

export async function testProviderConnection(
  connectionId: string
): Promise<TestConnectionResult> {
  try {
    const res = await backendRequest<Record<string, unknown>>(
      `/admin/providers/connections/${encodeURIComponent(connectionId)}/test`,
      { method: 'POST' }
    );
    dispatchProvidersUpdated();
    return {
      ok: Boolean(res?.ok),
      latency_ms: Number(res?.latency_ms || 0),
      status_code: res?.status_code ? Number(res.status_code) : undefined,
      message: String(res?.message || (res?.ok ? 'Connection verified' : res?.error || 'Test failed')),
      error: res?.error ? String(res.error) : undefined,
      mode: 'backend',
    };
  } catch (err) {
    if (!(err instanceof BackendUnavailableError)) throw err;

    lastKnownMode = 'local_fallback';
    const map = readLocalConnections();
    const conn = findLocalConnectionByIdOrProvider(map, connectionId);
    if (!conn) {
      return {
        ok: false,
        latency_ms: 0,
        message: 'Connection not found in local fallback storage.',
        error: 'Not connected',
        mode: 'local_fallback',
      };
    }

    const syncAttempt = await browserDiscoverModels(conn.protocol, conn.base_url, conn.api_key);
    let ok = syncAttempt.ok;
    let latency_ms = syncAttempt.latency_ms;
    let message = syncAttempt.ok
      ? `Connected (${syncAttempt.latency_ms} ms)`
      : syncAttempt.message;

    // If /models returned 404 or failed non-CORS, try a minimal completion with a known model
    if (!ok && !syncAttempt.message.includes('CORS')) {
      const fallbackModel =
        conn.custom_models[0] ||
        conn.synced_models[0] ||
        PROVIDER_CATALOG_MAP[conn.provider_id]?.default_models[0];
      if (fallbackModel) {
        const probe = await browserChatCompletion(
          conn.protocol,
          conn.base_url,
          conn.api_key,
          fallbackModel,
          [{ role: 'user', content: 'Reply with OK' }],
          0,
          16
        );
        ok = probe.ok;
        latency_ms = probe.latency_ms;
        message = probe.ok ? `Connected via ${fallbackModel} (${probe.latency_ms} ms)` : probe.error || message;
      }
    }

    conn.is_valid = ok;
    conn.last_validated_at = new Date().toISOString();
    conn.last_latency_ms = latency_ms;
    conn.last_error = ok ? null : message;
    map[conn.provider_id] = conn;
    writeLocalConnections(map);
    dispatchProvidersUpdated();

    return {
      ok,
      latency_ms,
      message,
      error: ok ? undefined : message,
      mode: 'local_fallback',
    };
  }
}

export async function syncProviderModels(connectionId: string): Promise<SyncModelsResult> {
  try {
    const res = await backendRequest<Record<string, unknown>>(
      `/admin/providers/connections/${encodeURIComponent(connectionId)}/sync`,
      { method: 'POST' }
    );
    dispatchProvidersUpdated();
    const models = Array.isArray(res?.models) ? (res.models as string[]) : [];
    return {
      ok: Boolean(res?.ok),
      synced_count: Number(res?.synced_count ?? models.length),
      models,
      latency_ms: Number(res?.latency_ms || 0),
      message: String(res?.message || `Synced ${models.length} models`),
      mode: 'backend',
    };
  } catch (err) {
    if (!(err instanceof BackendUnavailableError)) throw err;

    lastKnownMode = 'local_fallback';
    const map = readLocalConnections();
    const conn = findLocalConnectionByIdOrProvider(map, connectionId);
    if (!conn) {
      return {
        ok: false,
        synced_count: 0,
        models: [],
        latency_ms: 0,
        message: 'Save the connection before syncing models.',
        mode: 'local_fallback',
      };
    }

    const result = await browserDiscoverModels(conn.protocol, conn.base_url, conn.api_key);
    if (result.ok) {
      if (result.models.length > 0) {
        conn.synced_models = result.models;
      }
      conn.is_valid = true;
      conn.last_validated_at = new Date().toISOString();
      conn.last_latency_ms = result.latency_ms;
      conn.last_error = null;
      map[conn.provider_id] = conn;
      writeLocalConnections(map);
      dispatchProvidersUpdated();
    }
    return result;
  }
}

export async function testProviderModel(
  connectionId: string,
  modelId: string
): Promise<TestModelResult> {
  try {
    const res = await backendRequest<Record<string, unknown>>(
      `/admin/providers/connections/${encodeURIComponent(connectionId)}/test-model`,
      {
        method: 'POST',
        body: JSON.stringify({ model_id: modelId }),
      }
    );
    return {
      ok: Boolean(res?.ok),
      model_id: String(res?.model_id || modelId),
      latency_ms: Number(res?.latency_ms || 0),
      preview: res?.preview ? String(res.preview) : undefined,
      error: res?.error ? String(res.error) : undefined,
      mode: 'backend',
    };
  } catch (err) {
    if (!(err instanceof BackendUnavailableError)) throw err;

    lastKnownMode = 'local_fallback';
    const map = readLocalConnections();
    const conn = findLocalConnectionByIdOrProvider(map, connectionId);
    if (!conn) {
      return {
        ok: false,
        model_id: modelId,
        latency_ms: 0,
        error: 'Connection not found in local fallback storage.',
        mode: 'local_fallback',
      };
    }

    const probe = await browserChatCompletion(
      conn.protocol,
      conn.base_url,
      conn.api_key,
      modelId,
      [{ role: 'user', content: 'Reply with OK' }],
      0,
      16
    );
    return {
      ok: probe.ok,
      model_id: modelId,
      latency_ms: probe.latency_ms,
      preview: probe.ok ? probe.text.slice(0, 120) || 'OK' : undefined,
      error: probe.error,
      mode: 'local_fallback',
    };
  }
}

export async function updateProviderModels(
  connectionId: string,
  patch: UpdateModelsInput
): Promise<{ mode: ProviderMode }> {
  try {
    await backendRequest<unknown>(
      `/admin/providers/connections/${encodeURIComponent(connectionId)}/models`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    );
    dispatchProvidersUpdated();
    return { mode: 'backend' };
  } catch (err) {
    if (!(err instanceof BackendUnavailableError)) throw err;

    lastKnownMode = 'local_fallback';
    const map = readLocalConnections();
    const conn = findLocalConnectionByIdOrProvider(map, connectionId);
    if (conn) {
      if (patch.is_enabled !== undefined) conn.is_enabled = patch.is_enabled;
      if (patch.custom_models !== undefined) conn.custom_models = patch.custom_models;
      if (patch.disabled_models !== undefined) conn.disabled_models = patch.disabled_models;
      conn.updated_at = new Date().toISOString();
      map[conn.provider_id] = conn;
      writeLocalConnections(map);
    }
    dispatchProvidersUpdated();
    return { mode: 'local_fallback' };
  }
}

export async function testUnsavedProvider(
  input: TestUnsavedInput
): Promise<TestConnectionResult & { preview?: string }> {
  try {
    const res = await backendRequest<Record<string, unknown>>('/admin/providers/test-unsaved', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return {
      ok: Boolean(res?.ok),
      latency_ms: Number(res?.latency_ms || 0),
      status_code: res?.status_code ? Number(res.status_code) : undefined,
      message: String(res?.message || (res?.ok ? 'Endpoint verified' : res?.error || 'Test failed')),
      preview: res?.preview ? String(res.preview) : undefined,
      error: res?.error ? String(res.error) : undefined,
      mode: 'backend',
    };
  } catch (err) {
    if (!(err instanceof BackendUnavailableError)) throw err;

    lastKnownMode = 'local_fallback';
    if (input.model_id) {
      const probe = await browserChatCompletion(
        input.protocol,
        input.base_url,
        input.api_key,
        input.model_id,
        [{ role: 'user', content: 'Reply with OK' }],
        0,
        16
      );
      return {
        ok: probe.ok,
        latency_ms: probe.latency_ms,
        status_code: probe.status,
        message: probe.ok
          ? `Model responded in ${probe.latency_ms} ms`
          : probe.error || 'Model test failed',
        preview: probe.ok ? probe.text.slice(0, 120) || 'OK' : undefined,
        error: probe.error,
        mode: 'local_fallback',
      };
    }

    const syncRes = await browserDiscoverModels(input.protocol, input.base_url, input.api_key);
    return {
      ok: syncRes.ok,
      latency_ms: syncRes.latency_ms,
      message: syncRes.ok
        ? `Verified (${syncRes.synced_count} models discovered in ${syncRes.latency_ms} ms)`
        : syncRes.message,
      error: syncRes.ok ? undefined : syncRes.message,
      mode: 'local_fallback',
    };
  }
}

export async function getActiveRoutedModels(): Promise<ActiveRoutedModel[]> {
  try {
    const raw = await backendRequest<unknown>('/ai/active-models', { method: 'GET' }, false);
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as Record<string, unknown>)?.models)
        ? ((raw as Record<string, unknown>).models as Record<string, unknown>[])
        : [];
    return list
      .map((item) => {
        const rec = item as Record<string, unknown>;
        return {
          provider_id: String(rec.provider_id || ''),
          display_name: String(rec.display_name || rec.provider_id || ''),
          model_id: String(rec.model_id || ''),
          protocol: (rec.protocol || 'openai_compatible') as ProviderProtocol,
          is_custom: Boolean(rec.is_custom),
        };
      })
      .filter((m) => m.provider_id && m.model_id);
  } catch (err) {
    if (!(err instanceof BackendUnavailableError)) {
      return [];
    }

    lastKnownMode = 'local_fallback';
    const views = buildLocalCatalogViews();
    const active: ActiveRoutedModel[] = [];
    for (const p of views) {
      if (!p.is_connected || !p.is_enabled) continue;
      for (const modelId of getEnabledModelsForProvider(p)) {
        active.push({
          provider_id: p.provider_id,
          display_name: p.display_name,
          model_id: modelId,
          protocol: p.protocol,
          is_custom: p.is_custom,
        });
      }
    }
    return active;
  }
}

export async function sendRoutedChat(req: RoutedChatRequest): Promise<RoutedChatResponse> {
  try {
    const res = await backendRequest<Record<string, unknown>>(
      '/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify(req),
      },
      false
    );
    const text = String(res?.text ?? res?.content ?? '');
    return {
      ok: Boolean(res?.ok ?? text.length > 0),
      text,
      provider_id: String(res?.provider_id || req.provider_id),
      model_id: String(res?.model_id || req.model_id),
      latency_ms: res?.latency_ms ? Number(res.latency_ms) : undefined,
      mode: 'backend',
      error: res?.error ? String(res.error) : undefined,
    };
  } catch (err) {
    if (!(err instanceof BackendUnavailableError)) {
      return {
        ok: false,
        text: '',
        provider_id: req.provider_id,
        model_id: req.model_id,
        mode: 'backend',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    lastKnownMode = 'local_fallback';
    const map = readLocalConnections();
    const conn = map[req.provider_id];
    if (!conn) {
      return {
        ok: false,
        text: '',
        provider_id: req.provider_id,
        model_id: req.model_id,
        mode: 'local_fallback',
        error: `Provider "${req.provider_id}" is not configured in local fallback storage.`,
      };
    }

    const probe = await browserChatCompletion(
      conn.protocol,
      conn.base_url,
      conn.api_key,
      req.model_id,
      req.messages,
      req.temperature ?? 0.2,
      req.max_tokens ?? 2048
    );

    return {
      ok: probe.ok,
      text: probe.text,
      provider_id: req.provider_id,
      model_id: req.model_id,
      latency_ms: probe.latency_ms,
      mode: 'local_fallback',
      error: probe.error,
    };
  }
}

export function stripThinkingTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .trim();
}

export function extractCleanJsonObject(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const cleaned = stripThinkingTags(text)
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const tryParse = (raw: string): Record<string, unknown> | null => {
    const noTrailing = raw.replace(/,\s*([}\]])/g, '$1');
    try {
      const parsed = JSON.parse(noTrailing);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // ignore parse errors
    }
    return null;
  };

  // Scan for the first balanced {...} object
  let start = cleaned.indexOf('{');
  while (start !== -1) {
    let depth = 0;
    let inStr = false;
    let escape = false;
    for (let idx = start; idx < cleaned.length; idx++) {
      const ch = cleaned[idx];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\' && inStr) {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inStr = !inStr;
        continue;
      }
      if (!inStr) {
        if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0) {
            const parsed = tryParse(cleaned.slice(start, idx + 1));
            if (parsed) return parsed;
            break;
          }
        }
      }
    }
    start = cleaned.indexOf('{', start + 1);
  }

  // Fallback: outermost {...} match
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    return tryParse(match[0]);
  }
  return null;
}

export async function sendAutoRoutedChat(
  options: AutoRoutedChatOptions
): Promise<AutoRoutedChatResult> {
  const allModels = await getActiveRoutedModels();
  if (allModels.length === 0) {
    return {
      ok: false,
      text: '',
      mode: 'offline',
      error: 'No AI provider connected in Admin Provider Hub.',
    };
  }

  let saved: Record<string, unknown> = {};
  try {
    const raw = localStorage.getItem('active_models');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        saved = parsed as Record<string, unknown>;
      }
    }
  } catch {
    saved = {};
  }

  const filtered = allModels.filter((m) => {
    const key = `${m.provider_id}:${m.model_id}`;
    return saved[key] !== false;
  });
  const candidates = (filtered.length > 0 ? filtered : allModels).slice(0, 4);

  const messages: RoutedChatMessage[] =
    options.systemPrompt && options.messages[0]?.role !== 'system'
      ? [{ role: 'system', content: options.systemPrompt }, ...options.messages]
      : [...options.messages];

  const timeoutMs = options.timeoutMs ?? 25000;
  const shouldStrip = options.stripThinking !== false;
  let lastError = 'All configured AI models failed.';

  for (const candidate of candidates) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<RoutedChatResponse>((resolve) => {
        timer = setTimeout(() => {
          resolve({
            ok: false,
            text: '',
            provider_id: candidate.provider_id,
            model_id: candidate.model_id,
            mode: lastKnownMode,
            error: `Request timed out after ${timeoutMs} ms`,
          });
        }, timeoutMs);
      });

      const res = await Promise.race([
        sendRoutedChat({
          provider_id: candidate.provider_id,
          model_id: candidate.model_id,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        }),
        timeoutPromise,
      ]);

      if (res.ok) {
        const finalText = shouldStrip ? stripThinkingTags(res.text) : res.text.trim();
        if (finalText) {
          return {
            ok: true,
            text: finalText,
            provider_id: res.provider_id || candidate.provider_id,
            display_name: candidate.display_name,
            model_id: res.model_id || candidate.model_id,
            latency_ms: res.latency_ms,
            mode: 'ai',
          };
        }
        lastError = `${candidate.display_name} (${candidate.model_id}) returned an empty response.`;
      } else {
        lastError = res.error || `${candidate.display_name} (${candidate.model_id}) failed.`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  return {
    ok: false,
    text: '',
    mode: 'offline',
    error: lastError,
  };
}
