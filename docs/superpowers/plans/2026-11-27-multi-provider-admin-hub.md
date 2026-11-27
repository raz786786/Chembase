# Track A — 9Router-Style Multi-Provider AI Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a 9Router-style Multi-Provider AI Hub (40+ built-in providers + custom OpenAI/Anthropic-compatible endpoints, encrypted backend storage, live Sync Models, live Test Connection / Test Model, and AI pipeline wiring) in ChemBase Pro.

**Architecture:** FastAPI backend package (`backend/app/providers/`) provides AES-256-GCM key encryption, SSRF-protected outbound requests, Supabase JWT admin auth, live upstream model discovery, and `/api/ai/chat` proxying; React frontend (`ProviderHub.tsx` + `providerRouter.ts` + `providerCatalog.ts`) provides the 9Router-style Admin UI with transparent local fallback if Render sleeps.

**Tech Stack:** FastAPI, SQLAlchemy, httpx, cryptography (AES-256-GCM + HKDF-SHA256), React 19, TypeScript, Tailwind CSS, Lucide Icons, Vitest/pytest.

**Spec:** `docs/superpowers/specs/2026-11-27-multi-provider-admin-hub-design.md`

## Global Constraints
- Plaintext API keys are NEVER returned by any backend endpoint or logged in error messages (`scrub_secrets`).
- Admin endpoints require Supabase Bearer JWT checked against `ADMIN_EMAILS` or `app_metadata.role == "admin"` (never user-editable `user_metadata`).
- All custom/overridden `base_url` values pass `validate_safe_outbound_url` (blocking loopback, metadata, private/reserved IPs, DNS-resolved private IPs, and HTTP redirects).
- Frontend production builds MUST run from `D:\my projects\Chemical_Analysis\frontend` (`npm run build`).
- Zero DefTech references anywhere.

## Review Focus
- Render cold start / offline backend: frontend falls back cleanly without crashing or losing admin inputs.
- Non-standard `/models` 404 on OpenAI-compatible proxies: Sync returns a non-fatal warning while allowing custom model IDs and live Test Model.
- Unsaved provider key testing (`test-unsaved`) never stores the key and scrubs any echoed key from upstream error text.
- Editing an existing provider without re-entering the API key preserves the stored encrypted key.
- SSRF bypass attempts (IPv6 loopback `::1`, cloud metadata `169.254.169.254`, `http://localhost:8000`, `file://`, redirect to private IP) are rejected with HTTP 400.

---

### Task 1: Backend Provider Security, Crypto, Catalog & Universal Client
**Files:**
- Create: `backend/app/providers/__init__.py`
- Create: `backend/app/providers/catalog.py`
- Create: `backend/app/providers/crypto.py`
- Create: `backend/app/providers/security.py`
- Create: `backend/app/providers/universal_client.py`
- Test: `backend/tests/test_providers.py`

- [ ] Implement AES-256-GCM + HKDF-SHA256 encryption and masking (`crypto.py`).
- [ ] Implement SSRF + DNS IP validation + secret scrubbing (`security.py`).
- [ ] Implement 40+ 9Router-style provider catalog (`catalog.py`).
- [ ] Implement unified async client for `openai_compatible`, `anthropic_compatible`, `google`, and `ollama` with `discover_models`, `validate_credentials`, `test_model`, `chat_completion`, and `filter_chat_models` (`universal_client.py`).
- [ ] Run pytest unit tests verifying encryption, SSRF blocking, chat model filtering, and mocked upstream discovery/testing.

### Task 2: Backend DB Model, Admin Auth Guard & FastAPI Router
**Files:**
- Modify: `backend/app/models.py` (add `AIProviderConnection` table)
- Create: `backend/app/providers/admin_auth.py`
- Create: `backend/app/providers/router.py`
- Modify: `backend/app/main.py` (mount router, add `https://chembasepro.vercel.app` to default CORS origins, allow `PATCH`/`DELETE`, rate-limit `/api/admin/providers` & `/api/ai`)
- Test: `backend/tests/test_providers.py`

- [ ] Add `AIProviderConnection` SQLAlchemy model.
- [ ] Implement `require_admin` verifying Supabase Bearer JWT via `/auth/v1/user` (with 60s token-hash cache) and checking `ADMIN_EMAILS` / `app_metadata.role`.
- [ ] Implement all 10 endpoints (`catalog`, `connections` POST/DELETE, `test`, `sync`, `test-model`, `models` PATCH, `test-unsaved`, `/api/ai/active-models`, `/api/ai/chat`).
- [ ] Run pytest API tests covering auth rejection (401/403), CRUD, sync, test, and chat proxy.

### Task 3: Frontend Provider Catalog, Router Client & 9Router-Style Admin Hub UI
**Files:**
- Create: `frontend/src/data/providerCatalog.ts`
- Create: `frontend/src/utils/providerRouter.ts`
- Create: `frontend/src/components/admin/ProviderHub.tsx`
- Modify: `frontend/src/pages/AdminDashboardPage.tsx`

- [ ] Mirror 40+ catalog definitions in `providerCatalog.ts`.
- [ ] Implement `providerRouter.ts` calling `/api/admin/providers/*` & `/api/ai/*` with Supabase Bearer token + automatic local fallback mode when Render is unreachable.
- [ ] Build `ProviderHub.tsx` with search, tier & status filters, `+ Add OpenAI-Compatible` & `+ Add Anthropic-Compatible` modals, `Test All Connected`, per-card `Sync` & `Test` buttons, and Provider Detail Modal (API key, Base URL, Sync Models, Add Custom Model, per-model toggle, per-model live Test with `ms` latency + preview).
- [ ] Replace legacy 6-key form & fake `setTimeout` benchmark in `AdminDashboardPage.tsx` with `ProviderHub`.

### Task 4: Wire Multi-Provider Router into AI Tutor & Settings Pipeline
**Files:**
- Modify: `frontend/src/pages/TutorPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] Load active routed models from `providerRouter.ts` alongside legacy fallback.
- [ ] Route AI Tutor inference through `sendRoutedChat()` so any connected provider (OpenAI, Claude, DeepSeek, Groq, Gemini, OpenRouter, Mistral, custom endpoints) works seamlessly.
- [ ] Run `tsc -b && vite build` from `D:\my projects\Chemical_Analysis\frontend` and verify exit code 0.
