# Track A Design Spec — 9Router-Style Multi-Provider AI Hub in Admin Panel

**Date:** 2026-11-27  
**Status:** Draft for User Review  
**Scope:** Backend Encrypted Multi-Provider Engine + Admin Panel Provider Hub UI + Live Sync/Test + AI Pipeline Wiring

---

## 1. Purpose & Success Criteria

Replace ChemBase Pro's legacy 6-key `localStorage` API key form and simulated `setTimeout` benchmark in `AdminDashboardPage.tsx` with a production-grade, **9Router-style Multi-Provider AI Hub** modeled after `D:\My Projects\SOW`:

- **40+ Pre-Configured Providers** across 4 tiers (`frontier`, `high_speed`, `open_source`, `aggregator`) plus unlimited **Custom OpenAI-Compatible** and **Custom Anthropic-Compatible** endpoints.
- **Working Sync Models Button** per provider that queries the live upstream `/models` (OpenAI-compatible), `/v1/models` (Anthropic), `/v1beta/models` (Gemini), or `/api/tags` (Ollama) endpoint, filters out non-chat models (embeddings, TTS, image, video, moderation, retired models), and persists the discovered models.
- **Working Test Connection & Test Model Buttons** (plus **Test All Connected**) that execute real HTTP probes and report actual HTTP status, latency in milliseconds, and response preview (zero simulated delays).
- **Server-Side Encrypted Storage & Proxy** via FastAPI (`backend/app/providers/`) using AES-256-GCM + HKDF-SHA256 and SSRF protection so API keys stay off the browser and cross-origin providers (Anthropic, DeepSeek, Mistral, Cohere, etc.) work without CORS errors, paired with a transparent **local fallback mode** if Render sleeps or is offline.
- **Unified AI Routing**: Enabled providers and models propagate to ChemBase Pro's Settings Pipeline, AI Tutor, and module assistants through `/api/ai/active-models` and `/api/ai/chat`.

---

## 2. Backend Architecture (`backend/app/providers/`)

### 2.1 Module Breakdown

| File | Responsibility |
|---|---|
| `backend/app/providers/catalog.py` | 40+ pre-configured `ProviderCatalogItem` definitions (ID, display name, tier, protocol, default base URL, description, default models, docs URL, `free_tier_available`). |
| `backend/app/providers/crypto.py` | AES-256-GCM encryption (`encrypt_api_key`, `decrypt_api_key`) using HKDF-SHA256 derived from `CHEMBASE_MASTER_KEY` env var (failing closed when `ENVIRONMENT=production` and key is unset; deterministic dev key only in local dev), plus `mask_api_key` (`prefix + •••••••••••• + last4`). |
| `backend/app/providers/security.py` | Outbound SSRF validator (`validate_safe_outbound_url` blocking non-HTTP(S) schemes, loopback, cloud metadata, `.local`/`.internal`, and private/reserved/link-local IPv4/IPv6 ranges including DNS-resolved IPs; disabling redirects on all outbound calls) + `scrub_secrets` redacting key patterns from errors and logs. |
| `backend/app/providers/universal_client.py` | Async `httpx` client supporting `openai_compatible`, `anthropic_compatible`, `google`, and `ollama` protocols: `discover_models()`, `validate_credentials()`, `test_model()`, and `chat_completion()`, plus `filter_chat_models()`. |
| `backend/app/providers/admin_auth.py` | FastAPI dependency `require_admin()` validating Supabase Bearer JWT via Supabase `/auth/v1/user` (with short-lived 60s token-hash cache) and checking `email in ADMIN_EMAILS` or `app_metadata.role == "admin"` (never trusting user-writable `user_metadata`). |
| `backend/app/providers/router.py` | REST endpoints mounted in `backend/app/main.py` for catalog, CRUD connections, Sync Models, Test Connection, Test Model, Test Unsaved, Model Governance, Active Models, and AI Chat Proxy. |

### 2.2 Database Persistence (`backend/app/models.py`)

Add SQLAlchemy model `AIProviderConnection` (`ai_provider_connections` table, created automatically in `lifespan`):

- `id: String` (UUID primary key)
- `provider_id: String(80)` (indexed, unique per custom or built-in connection ID)
- `display_name: String(120)`
- `protocol: String(40)` (`openai_compatible` | `anthropic_compatible` | `google` | `ollama`)
- `base_url: String(500)` (nullable; overrides catalog default)
- `encrypted_api_key: Text` (AES-256-GCM envelope `v1:<nonce>:<ct_tag>`, nullable for `noAuth` endpoints like local Ollama)
- `key_masked: String(64)` (safe display string only)
- `is_custom: Boolean` (default `False`)
- `is_enabled: Boolean` (default `True`)
- `is_valid: Boolean` (default `False`)
- `last_validated_at: String(64)` (ISO-8601 UTC)
- `last_latency_ms: Integer` (nullable)
- `last_error: Text` (scrubbed, nullable)
- `synced_models: JSON` (`List[str]`, default `[]`)
- `custom_models: JSON` (`List[str]`, default `[]`)
- `disabled_models: JSON` (`List[str]`, default `[]`)
- `created_at / updated_at: String(64)`

### 2.3 API Contract

All admin routes require `Authorization: Bearer <supabase_access_token>` verified by `require_admin`. Plaintext keys are **never** returned in any response.

- `GET /api/admin/providers/catalog` — Returns full catalog merged with stored connections (masked keys, synced/custom/disabled models, validation timestamps, latencies).
- `POST /api/admin/providers/connections` — Creates or updates a built-in or custom provider connection. Validates `base_url` with SSRF guard, encrypts `api_key`, updates mask, preserves existing key if `api_key` is omitted on edit.
- `DELETE /api/admin/providers/connections/{connection_id}` — Deletes connection.
- `POST /api/admin/providers/connections/{connection_id}/test` — Live credential & endpoint ping; updates `is_valid`, `last_validated_at`, `last_latency_ms`, `last_error`.
- `POST /api/admin/providers/connections/{connection_id}/sync` — Live upstream model discovery; filters non-chat models; updates `synced_models` and returns `{ ok, synced_count, models, latency_ms, message }`.
- `POST /api/admin/providers/connections/{connection_id}/test-model` — Body `{ model_id }`; runs a minimal completion (`max_tokens=16`, prompt `"Reply with OK"`) and returns `{ ok, model_id, latency_ms, preview, error }`.
- `PATCH /api/admin/providers/connections/{connection_id}/models` — Updates `is_enabled`, `custom_models`, and `disabled_models`.
- `POST /api/admin/providers/test-unsaved` — Live test for `{ provider_id, protocol, base_url, api_key, model_id? }` before saving.
- `GET /api/ai/active-models` — Public/authenticated list of enabled providers + enabled models (`provider_id`, `display_name`, `model_id`, `protocol`, `is_custom`) with zero secrets.
- `POST /api/ai/chat` — Rate-limited universal chat proxy `{ provider_id, model_id, messages, temperature?, max_tokens? }` using the server-stored encrypted key.

### 2.4 CORS & Middleware Update (`backend/app/main.py`)

- Add `https://chembasepro.vercel.app` to `_default_origins`.
- Expand `allow_methods` to `["GET", "POST", "PATCH", "DELETE", "OPTIONS"]`.
- Apply AI rate limiting to `/api/ai/*` and `/api/admin/providers/*` (strictly capped to prevent abuse).

---

## 3. Frontend Architecture

### 3.1 Files

| File | Responsibility |
|---|---|
| `frontend/src/data/providerCatalog.ts` | Client mirror of the 40+ provider catalog (ID, name, tier, protocol, default base URL, default models, docs URL, free-tier flag) so the Admin Hub renders instantly even during Render cold starts. |
| `frontend/src/utils/providerRouter.ts` | Typed client API for `/api/admin/providers/*` and `/api/ai/*`, attaching Supabase session Bearer token, plus automatic **Local Fallback Mode** (clearly flagged to the admin) when Render backend is unreachable, supporting CORS-compatible browser sync/test and local persistence. |
| `frontend/src/components/admin/ProviderHub.tsx` | Full 9Router-style Admin Provider Hub component: search, tier pills, status filters, `+ Add OpenAI-Compatible`, `+ Add Anthropic-Compatible`, `Test All Connected`, provider grid cards (status, masked key, model count, quick `Sync` & `Test` buttons), and Provider Detail Drawer/Modal (key management, Base URL, Sync Models, Add Custom Model, per-model Enable/Disable switch, and per-model live `Test` button with `ms` latency & preview). |
| `frontend/src/pages/AdminDashboardPage.tsx` | Embed `ProviderHub` cleanly inside the Admin Panel (`AI Providers & Models` tab), removing the hardcoded 6-key form and fake `setTimeout` benchmark. |
| `frontend/src/pages/TutorPage.tsx` & `frontend/src/App.tsx` | Consume `getActiveRoutedModels()` and `sendRoutedChat()` from `providerRouter.ts` so any model connected & enabled by the Admin (OpenAI, Claude, DeepSeek, Groq, Gemini, OpenRouter, Mistral, custom endpoints, etc.) works seamlessly in the AI Tutor and Settings Pipeline. |

---

## 4. Error Handling & Edge Cases

- **SSRF Prevention:** Every custom or overridden `base_url` is checked on both Save, Test, Sync, and Chat; DNS resolution errors or private/loopback/metadata IPs return HTTP 400 with a clear message.
- **Secret Scrubbing:** Raw API keys never appear in HTTP responses, browser `localStorage` (in backend mode), or error messages (`scrub_secrets` strips key prefixes/tokens before returning upstream errors).
- **Non-Standard `/models` Endpoints:** Some OpenAI-compatible hosts return `404` on `/models` even when `/chat/completions` works. Sync returns a clear non-fatal notice ("Provider does not expose `/models`; using catalog/custom models") while allowing manual `+ Add Custom Model` and live `Test Model`.
- **Render Free-Tier Cold Start:** Requests use a 15s timeout on first wake; if backend fails to connect, UI surfaces a non-blocking status pill (`Backend offline · Local fallback active`) instead of crashing or losing input.

---

## 5. Testing & Verification Plan

1. **Backend Automated Tests (`backend/tests/test_providers.py`)**:
   - AES-256-GCM encrypt/decrypt round-trip, tamper rejection (`DecryptionError`), key masking.
   - SSRF validator blocking `http://127.0.0.1`, `http://169.254.169.254`, `http://localhost`, `file://`, private CIDR ranges, and allowing valid HTTPS provider URLs.
   - `filter_chat_models` removing embeddings, TTS, image, moderation, and deprecated models while preserving case and deduplicating.
   - Admin auth guard rejecting unauthenticated requests (401) and non-admin tokens (403).
   - Mocked `httpx` unit tests for `Sync Models`, `Test Connection`, `Test Model`, `Create/Delete Connection`, and `/api/ai/chat` proxy.
2. **Frontend Build & Typecheck:** `tsc -b && vite build` exits 0 with zero errors.
3. **Live Verification on `https://chembasepro.vercel.app`:** Verify Admin Panel Provider Hub loads all 40+ providers, Add Custom OpenAI/Anthropic modal works, Sync & Test buttons trigger live requests and display accurate status/latency feedback without console errors.
