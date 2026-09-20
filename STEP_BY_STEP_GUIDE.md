# Chembase → DEFTECH: Step-by-Step Guide

One file, two parts:
- **Part A** — everything I already implemented (context; no action needed)
- **Part B** — everything **you** must do manually, in order, with verification checkpoints

Do Part B strictly top-to-bottom. Every step is independently verifiable — you never move
forward on a broken step. Hardware is last; you can demo the entire system before touching it.

---

# PART A — What is already done (code only, no action)

## A1. Frontend "extraordinary" UI (all building clean)

| Feature | File |
|---|---|
| Web Audio sound engine (ping/warning/critical/success/boot, mute persisted) | `frontend/src/lib/sound.ts` |
| Animated electron shells (Bohr model, SVG) | `frontend/src/components/ElectronShells.tsx` |
| 3D molecule viewer (canvas, drag-rotate, no dependencies) | `frontend/src/components/MoleculeViewer3D.tsx` |
| Streaming telemetry sparkline (Recharts rolling window) | `frontend/src/components/deftech/TelemetryChart.tsx` |
| ⌘K command palette (cmdk, substance search + navigation) | `frontend/src/components/CommandPalette.tsx` |
| Dark tactical threat map (MapLibre, free CARTO tiles, pulsing hazard rings) | `frontend/src/components/ThreatMap.tsx` |
| Hazard plume simulation (canvas gas dispersion) | `frontend/src/components/deftech/HazardPlume.tsx` |
| Mission HUD (UTC clock, LINK heartbeat, sound + kiosk toggles) | `frontend/src/components/deftech/MissionHud.tsx` |
| Tactical boot sequence (2s, skippable) | `frontend/src/components/deftech/BootSequence.tsx` |
| Voice control (Web Speech: "show map", "open fleet", "stand down") | `frontend/src/components/deftech/VoiceControl.tsx` |
| Animated threat ticker (Framer Motion spring physics) | `frontend/src/components/deftech/ThreatTicker.tsx` |

## A2. The 4-phase implementation

**Phase 1 (Supabase schema)** — `backend/supabase_schema.sql`
`chemical_profiles` (lean, FK to `substances.id`), `fleet_devices` (with
`device_secret_hash`, `last_seen_at`, `firmware_version`, `model_version`),
`telemetry_logs` (`device_ts` vs `received_at`, `(device_id, device_ts DESC)` index,
`purge_old_telemetry()` retention function), `model_artifacts` (sha256 + size + status).
RLS policies, Realtime publication, `tinyml-models` storage bucket, seed rows — all in the file.

**Phase 2 (ESP32 firmware)** — `firmware/chembase_drone/chembase_drone.ino`
MOS preheat tracking, `EI_HOOK` markers for your Edge Impulse int8 model, NVS offline
buffer with flush-on-reconnect, TLS-capable ingest with device auth headers,
6h OTA manifest polling with sha256-verify guidance.

**Phase 3 (Backend API)** — `backend/app/deftech.py` (wired into `main.py`)
- `POST /api/telemetry` — per-device secret auth (`X-Device-Id` / `X-Device-Secret`),
  range validation, auto-updates fleet `status` + `last_seen_at`
- `GET /api/fleet` — device list with status and versions
- `GET /api/firmware/latest?arch=esp32` — poll-based OTA manifest (no inbound push)
- `POST /api/update-fleet` — deploy trigger from the frontend
- `GET /api/chemical-profiles` — toxicity/radius data for the evacuation widget
- CORS is now env-driven (`ALLOWED_ORIGINS`)
- Simulator: `backend/scripts/simulate_drone.py` (moving GPS drones, weighted threats)

**Phase 4 (Frontend wiring)**
- `frontend/src/hooks/useUserRole.ts` — role from Supabase Auth metadata →
  `user_profiles` table fallback; drives the tactical badge
- `frontend/src/hooks/useRealtimeTelemetry.ts` — Supabase Realtime INSERT subscription
  + 100-row backfill; automatic sim fallback when Supabase isn't configured
- `BunkerTelemetry` — live subscription layered over the existing leak sim (kept as fallback)
- `hazardEngines.ts` — evacuation radius now resolved via `chemical_profiles` lookup
  (API first, bundled fallback second)
- `supabaseClient.ts` — hardcoded key removed, env-driven, degrades gracefully

**Verified end-to-end locally:** authenticated ingest ✅ · wrong secret → 401 ✅ ·
fleet status/last_seen update ✅ · profiles list ✅ · simulator → storage → query ✅ ·
`tsc -b` and `vite build` both pass ✅

---

# PART B — Your manual steps, in order

## Step 0 — Security first (30 min) ⚠️ DO NOT SKIP

Your Supabase anon key is committed to git history.

- [ ] Supabase Dashboard → **Settings → API → Rotate anon key** (do this as soon as the
      project exists in Step 1 — then come back to the rest of this step)
- [ ] Optionally purge the old key from history with
      [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/), or start a fresh repo

✅ **Checkpoint:** old key returns 401 from `https://YOUR-PROJECT.supabase.co/rest/v1/`.

## Step 1 — Supabase project (30–45 min)

1. [ ] Create a project at **supabase.com** (free tier works).
2. [ ] **SQL Editor** → paste the entire contents of `backend/supabase_schema.sql` → **Run**.
      Creates all 4 tables, indexes, retention function, RLS, seed rows, and the bucket.
3. [ ] **Settings → API** — copy three values:
      | Dashboard value | Goes to |
      |---|---|
      | Project URL | `VITE_SUPABASE_URL` (frontend) + `SUPABASE_URL` (backend) |
      | `anon` public key | `VITE_SUPABASE_ANON_KEY` (frontend only) |
      | `service_role` key | `SUPABASE_SERVICE_KEY` (backend only — **never** frontend) |
4. [ ] **Authentication → Providers → Email** → enable.
5. [ ] Register yourself via your app's login (or Auth → Add user), then set your role:
      ```sql
      update auth.users
      set raw_user_meta_data = raw_user_meta_data || '{"role":"defense"}'
      where email = 'you@example.com';
      ```
      (`useUserRole` checks auth metadata first, then a `public.user_profiles` table.)
6. [ ] **Table Editor** — confirm the shield icon (RLS) shows on all 4 new tables.

✅ **Checkpoint:** `GET https://YOUR-PROJECT.supabase.co/rest/v1/chemical_profiles?select=*`
with your anon key returns 6 seeded chemicals.

## Step 2 — Local environment files (10 min)

```bash
# frontend
cp frontend/.env.example frontend/.env.local   # fill both VITE_ vars from Step 1

# backend
cp backend/.env.example backend/.env           # fill:
#   DATABASE_URL          → Supabase "Connect" → Session pooler string (port 5432)
#   SUPABASE_URL          → Project URL
#   SUPABASE_SERVICE_KEY  → service_role key
#   ALLOWED_ORIGINS       → http://localhost:5800 (add your Vercel domain in prod)
```

Notes:
- Leaving `DATABASE_URL` empty keeps SQLite locally — fine for dev.
- Dev device credentials default to `Drone_01/dev-secret-drone-01` and
  `Drone_02/dev-secret-drone-02` when `DEVICE_CREDENTIALS` is unset. Set real ones
  (`python -c "import secrets; print(secrets.token_hex(32))"`, sha256-hashed) before
  anything goes public — format: `Drone_01:<sha256-hex>,Drone_02:<sha256-hex>`.

✅ **Checkpoint:** `cd frontend && npm run dev` starts without a missing-env error, and
the DEFTECH page loads with the boot sequence.

## Step 3 — Verify the whole pipeline locally (15 min, zero hardware)

Three terminals:

```bash
# Terminal 1 — backend
cd backend && python -m uvicorn app.main:app --port 8000

# Terminal 2 — drone simulator
cd backend && python scripts/simulate_drone.py --interval 3

# Terminal 3 — frontend
cd frontend && npm run dev
```

Then verify:

- [ ] `curl http://localhost:8000/api/health` → `{"status":"ok",...}`
- [ ] `curl http://localhost:8000/api/chemical-profiles` → 6 chemicals
- [ ] A POST to `/api/telemetry` with a **wrong** secret → `401 Invalid device secret`
- [ ] Open `http://localhost:5800/deftech-demo` → map markers appear from the simulator,
      ticker updates, CRITICAL alerts play sound
- [ ] Supabase **Table Editor → telemetry_logs** → rows arriving every ~3s
- [ ] Insert a row manually into `telemetry_logs` → map updates **without refresh**
      (proves Realtime works end-to-end)

✅ **Checkpoint:** all boxes above. The full system now works before any deployment.

## Step 4 — Deploy backend to Render (10 min)

- [ ] Render → your service → **Environment** → add every variable from `backend/.env`
      (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ALLOWED_ORIGINS`,
      `DEVICE_CREDENTIALS`).
      Setting `DATABASE_URL` to the Supabase pooler **is** the Postgres migration — no
      code change needed. (If Render free-tier sleeping breaks always-on ingestion,
      that's the one good reason to move this service to Railway.)
- [ ] Set real `DEVICE_CREDENTIALS` (generated secrets, not the dev ones).
- [ ] Redeploy.
- [ ] `ALLOWED_ORIGINS` → your real Vercel domain (no `*` in production).

✅ **Checkpoint:** `https://YOUR-BACKEND.onrender.com/api/chemical-profiles` → 6 chemicals.

## Step 5 — Deploy frontend to Vercel (5 min)

- [ ] Vercel → Project → **Settings → Environment Variables** →
      `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → redeploy.
- [ ] `vercel.json` already proxies `/api/*` → Render. No WebSocket issue — the live feed
      uses Supabase Realtime, which connects browser → Supabase directly.

✅ **Checkpoint:** production site → DEFTECH page → map live, no console errors.

## Step 6 — Production end-to-end test (10 min)

- [ ] Point the simulator at prod:
      ```bash
      cd backend && python scripts/simulate_drone.py --interval 5 --api-base https://YOUR-BACKEND.onrender.com
      ```
- [ ] Repeat every checkpoint from Step 3 against the live URLs.
- [ ] Log in with the user from Step 1.5 → tactical role badge appears.

## Step 7 — OTA pipeline (when you have a trained model)

7.1 — Prepare the binary:
- [ ] Edge Impulse → **Deployment → Arduino Library → Quantized (int8)** → unzip to
      `Documents/Arduino/libraries/chembase_inferencing` → uncomment the `EI_HOOK` block
      in the sketch → compile.
- [ ] Arduino IDE → **Sketch → Export Compiled Binary** → the `.bin` is in
      `build/esp32.esp32.esp32dev/`.

7.2 — Publish the artifact:
- [ ] Windows checksum: `certutil -hashfile chembase_v1.0.0.bin SHA256`
- [ ] Supabase **Storage → tinyml-models** → upload the `.bin`.
- [ ] SQL Editor:
      ```sql
      insert into model_artifacts (version, storage_path, sha256, size_bytes, status)
      values ('v1.0.0', 'chembase_v1.0.0.bin', '<sha256-hex>', <file-size>, 'PUBLISHED');
      ```

7.3 — Wire signed URLs (the one remaining code TODO):
- [ ] `GET /api/firmware/latest` currently returns `download_url: null` — devices skip
      the update gracefully. Add to the backend (needs `pip install supabase`):
      ```python
      from supabase import create_client
      sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
      url = sb.storage.from_("tinyml-models").create_signed_url(storage_path, 3600)
      ```
- [ ] Trigger: `POST /api/update-fleet {"version": "v1.0.0"}` → devices pick it up on
      their next poll (up to 6h, or immediately on reboot).
- [ ] Implement the flash step at the `OTA_HOOK` marker in the firmware sketch
      (manifest polling + sha256 guidance already in place).

✅ **Checkpoint:** device reports new `firmware_version` via `GET /api/fleet`.

## Step 8 — ESP32 hardware bring-up (last)

- [ ] Wire sensors: MQ-series (MOS) → GPIO34, PID → GPIO35, electrochemical → GPIO32,
      MOS heater via MOSFET → GPIO25 — adjust `PIN_*` constants to your actual wiring.
- [ ] Fill in `WIFI_SSID`, `WIFI_PASS`, `API_HOST` (**https://** in prod), `DEVICE_ID`,
      `DEVICE_SECRET` in `firmware/chembase_drone/chembase_drone.ino`.
- [ ] Flash, open Serial @115200. Expected order: Wi-Fi connect → "[MOS] preheat
      complete" (~2 min) → alerts appear on your dashboard.
- [ ] Add GPS (NEO-6M) later — `lat`/`lng` are placeholders until then.

## Step 9 — Final security pass (before public demo)

- [ ] Anon key rotated (Step 0) and purged from git history.
- [ ] `ALLOWED_ORIGINS` = real Vercel domain only.
- [ ] Real per-device secrets set on Render **and** flashed into each device.
- [ ] RLS confirmed on all 4 tables (Step 1.6).
- [ ] Telemetry inserts only happen through the backend (service key) — verify the anon
      key cannot INSERT: attempted insert from the browser should fail.

---

# Appendix A — Demo-features test script (for your presentation)

| Feature | How to test | Needs |
|---|---|---|
| Boot sequence | Enter DEFTECH page | — (skippable by click) |
| ⌘K palette | `Ctrl+K` → type a chemical name | — |
| Electron shells | Open any element page | — |
| 3D molecule | Open any compound page (desktop width) | — |
| Live map + ticker | Simulator running | Steps 1–3 |
| Realtime no-refresh | Insert row in Supabase Table Editor | Steps 1–3 |
| Sounds | CRITICAL alert in feed; mute toggle persists after reload | — |
| Voice control | "show map" / "open fleet" / "simulate leak" / "stand down" | Chrome/Edge |
| Kiosk mode | HUD toggle → views auto-cycle every 10s | — |
| Plume + evac widget | Threat drill / live CRITICAL alert | — |

# Appendix B — Troubleshooting

| Symptom | Fix |
|---|---|
| Frontend shows sim data only | `.env.local` missing/misspelled `VITE_SUPABASE_*`; restart dev server |
| No live updates despite rows in Supabase | Check Realtime publication exists (in schema SQL); check browser console for channel errors |
| Simulator → `401 Invalid device secret` | Secret in script doesn't match `DEVICE_CREDENTIALS` (sha256 hex) or dev default |
| Backend 500 on fleet endpoints with Supabase DB | `DATABASE_URL` must be the **pooler** string; run `supabase_schema.sql` first |
| Vercel `/api` returns 404 | Render backend asleep (free tier) or `vercel.json` proxy target wrong |
| Map tiles blank | CARTO tiles need internet; corporate proxies may block them |
