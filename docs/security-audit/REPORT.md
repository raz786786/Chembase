# ChemBase Pro — Multi-Phase Security Audit Report

**Audit Methodology:** `cloudflare/security-audit-skill` (Phases 1–6: Reconnaissance → Coverage-Led Hunting → Independent Adversarial Verification → Machine-Readable Findings → Defensive Remediation)  
**Date:** 2026-11-27  
**Machine-Readable Output:** `docs/security-audit/findings.json`

---

## Executive Summary

| Severity | Confirmed | Remediated in Code / SQL | Owner Action Required |
|---|---:|---:|---:|
| **Critical** | 2 | 1 (`CAND-04`) | 1 (`CAND-01` Play signing keystore rotation & git history purge) |
| **High** | 4 | 4 (`CAND-02`, `CAND-03`, `CAND-06`, `CAND-09`) | Apply updated SQL RLS policy in Supabase SQL Editor (`CAND-06`) & set `CHEMBASE_MASTER_KEY` on Render (`CAND-03`) |
| **Medium** | 6 | 5 (`CAND-05`, `CAND-11`, `CAND-12`, `CAND-13`, `CAND-14`) | 1 partial (`CAND-07` UI toggles) |
| **Low** | 3 | 2 (`CAND-08`, `CAND-15`) | 1 documented low risk (`CAND-10`) |
| **Total** | **15** | **12** | **3 operational follow-ups** |

---

## Immediate Owner Operational Actions

1. **`CAND-01` (Critical — Android Signing Keystore in Git):** `ChemBase - Google Play package/signing.keystore` and `ChemBase - Google Play package/signing-key-info.txt` are tracked in git history. Request an upload key reset in **Google Play Console**, then run `git rm --cached` and purge them from git history with `git filter-repo` before force-pushing.
2. **`CAND-03` (High — Render Master Key):** Set a strong 32-byte random base64 `CHEMBASE_MASTER_KEY` in the Render dashboard environment variables for `chembase-api` (now that `render.yaml` declares `ENVIRONMENT=production`, the backend fails closed if `CHEMBASE_MASTER_KEY` is missing).
3. **`CAND-06` (High — Supabase RLS Policy):** Run the updated `DROP POLICY` + `CREATE POLICY` block from `new_lab_analytics_schema.sql` in the **Supabase SQL Editor** to prevent authenticated users from inserting `is_custom = false` rows into `chembase_equipment_knowledge`.
4. **`CAND-04` (Optional Strict AI Auth):** Once all AI users sign in via Supabase, set `REQUIRE_AI_AUTH=true` in Render env vars to require a valid Supabase JWT on `/api/ai/chat`, `/api/ai/proxy`, and `/api/tutor/solve`.

---

## Verified Findings & Remediation Summary

- **`CAND-01` (Critical):** Tracked Android release keystore & credentials (`signing.keystore`, `signing-key-info.txt`) and `frontend/scripts/keys.json`. Untracked `keys.json`; flagged keystore for immediate rotation.
- **`CAND-02` (High):** Switched Gemini proxy & tutor calls to `x-goog-api-key` header, scrubbed all `/api/ai/proxy` error responses via `scrub_secrets()`, and added `X-MP-API-Key` header support.
- **`CAND-03` (High):** Added `ENVIRONMENT=production` and `CHEMBASE_MASTER_KEY` (`sync: false`) to `render.yaml`.
- **`CAND-04` (Critical):** Enforced `model_id` allowlist against `_effective_models_for_connection(conn)`, capped `max_tokens <= 8192` and `messages <= 50` in `/api/ai/chat`, and added `REQUIRE_AI_AUTH` env toggle.
- **`CAND-05` (Medium):** Made `GET /api/search` strictly read-only on PubChem miss and capped `POST /api/substances/bulk-resolve` to 25 items.
- **`CAND-06` (High):** Fixed RLS policies in `database_setup_lab_analytics.sql` and `new_lab_analytics_schema.sql` to enforce `is_custom = true` on `USING` and `WITH CHECK`.
- **`CAND-07` (Medium):** AI provider/model governance now runs server-side via `/api/admin/providers` and `/api/ai/chat`.
- **`CAND-08` (Low):** Added `_csv_safe()` formula-injection neutralization in `/api/export`.
- **`CAND-09` (High):** Made `validate_safe_outbound_url` fail closed on DNS resolution errors; enforced strict regex validation on `chemsys` (`^[A-Za-z0-9-]+$`) and `model` (`^[A-Za-z0-9._:/-]{1,100}$`).
- **`CAND-10` (Low):** Confirmed zero `eval`/`sympify`/`dangerouslySetInnerHTML` sinks; documented prompt-separation best practice.
- **`CAND-11` (Medium):** Moved SW registration from inline `<script>` in `frontend/index.html` into `frontend/src/main.tsx`, and added CSP + full security headers to both `vercel.json` and `frontend/vercel.json`.
- **`CAND-12` (Medium):** Extracted client IP from `X-Forwarded-For` and added bounded eviction caps to `_RATE_BUCKETS`, `_TOKEN_CACHE`, and `ProblemFingerprinter._cache`.
- **`CAND-13` (Medium):** Added strict upper bounds to `bulk_resolve` (25), `pubchem_enrich` (20), `UniversalChatRequest.messages` (50), and `/api/export` (5000).
- **`CAND-14` (Medium):** Updated `frontend/public/sw.js` (`chembase-pro-v3`) to never cache `/api/*`, cross-origin requests, `Authorization` requests, or `Cache-Control: no-store`/`private` responses.
- **`CAND-15` (Low):** Removed hardcoded personal admin email from the public Access Denied banner in `AdminDashboardPage.tsx`.
