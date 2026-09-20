-- ═══════════════════════════════════════════════════════════════
-- ChemBase DEFTECH — Supabase schema (Phase 1)
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. chemical_profiles (lean — extends existing substances table) ──
create table if not exists public.chemical_profiles (
  id uuid primary key default gen_random_uuid(),
  substance_id uuid,                          -- FK wired in step 6 (after you confirm PK type)
  name text not null,                         -- denormalized for fast join-free reads
  toxicity_level text not null default 'MODERATE'
    check (toxicity_level in ('LOW','MODERATE','HIGH','EXTREME')),
  hazard_radius_m int not null default 0,
  exposure_limits jsonb,                      -- {"twa_ppm":25,"stel_ppm":35,"idlh_ppm":300}
  detection_threshold_ppm numeric,
  created_at timestamptz not null default now(),
  unique (name)
);

-- ── 2. fleet_devices ──
create table if not exists public.fleet_devices (
  device_id text primary key,                 -- e.g. 'Drone_01'
  status text not null default 'OFFLINE'
    check (status in ('ACTIVE','OFFLINE','MAINTENANCE')),
  assigned_model text,                        -- model_artifacts.version currently flashed
  mode text not null default 'DEFENSE' check (mode in ('DEFENSE','COMMERCIAL')),
  device_secret_hash text not null,           -- sha256 hex of the per-device secret (never store plaintext)
  last_seen_at timestamptz,
  firmware_version text,
  model_version text,
  created_at timestamptz not null default now()
);

-- ── 3. telemetry_logs (time-series) ──
create table if not exists public.telemetry_logs (
  id bigint generated always as identity primary key,
  device_ts timestamptz not null,             -- when the device sensed it
  received_at timestamptz not null default now(),
  device_id text not null references public.fleet_devices(device_id) on delete cascade,
  threat_detected text,
  confidence_score numeric not null check (confidence_score between 0 and 100),
  latitude double precision,
  longitude double precision,
  raw_payload jsonb
);

-- The index that matters for "latest per device" queries
create index if not exists telemetry_device_time_idx
  on public.telemetry_logs (device_id, device_ts desc);

create index if not exists telemetry_time_idx
  on public.telemetry_logs (device_ts desc);

-- 30-day retention: run via pg_cron (enable in Database → Extensions), or
-- call this function from any scheduled job.
create or replace function public.purge_old_telemetry(retention_days int default 30)
returns void language plpgsql as $$
begin
  delete from public.telemetry_logs where device_ts < now() - (retention_days || ' days')::interval;
end $$;

-- ── 4. model_artifacts (OTA) ──
create table if not exists public.model_artifacts (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  storage_path text not null,                 -- object path inside the tinyml-models bucket
  sha256 text not null,
  size_bytes bigint not null,
  target_arch text not null default 'esp32',
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','REVOKED')),
  created_at timestamptz not null default now()
);

-- ── 5. Realtime: broadcast new telemetry inserts to the frontend ──
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'telemetry_logs'
  ) then
    alter publication supabase_realtime add table public.telemetry_logs;
  end if;
end $$;

-- ── 6. Wire chemical_profiles.substance_id → substances.id ──
-- Your substances PK is a String uuid, so a plain FK works. Uncomment after verifying:
-- alter table public.chemical_profiles
--   add constraint chemical_profiles_substance_fk
--   foreign key (substance_id) references public.substances(id) on delete set null;

-- ── 7. Row Level Security ──
alter table public.chemical_profiles enable row level security;
alter table public.fleet_devices      enable row level security;
alter table public.telemetry_logs     enable row level security;
alter table public.model_artifacts    enable row level security;

-- chemical_profiles: public read
drop policy if exists "public read profiles" on public.chemical_profiles;
create policy "public read profiles" on public.chemical_profiles for select using (true);

-- telemetry_logs: public read (dashboard), NO anon insert — backend uses service key
drop policy if exists "public read telemetry" on public.telemetry_logs;
create policy "public read telemetry" on public.telemetry_logs for select using (true);

-- fleet_devices: public read of device list (no secrets leak — hash column only)
drop policy if exists "public read fleet" on public.fleet_devices;
create policy "public read fleet" on public.fleet_devices for select using (true);

-- model_artifacts: public read of manifest metadata (bin access only via signed URLs)
drop policy if exists "public read artifacts" on public.model_artifacts;
create policy "public read artifacts" on public.model_artifacts for select using (true);

-- ── 8. Seed: 2 demo devices (secrets: 'dev-secret-drone-01' / 'dev-secret-drone-02') ──
insert into public.fleet_devices (device_id, status, mode, device_secret_hash, firmware_version)
values
  ('Drone_01', 'OFFLINE', 'DEFENSE',
   '839d51042c3aee2de25d545f0449afe52b5080a3e0b24f01c9b7e5502e379b17', 'v0.1.0'),
  ('Drone_02', 'OFFLINE', 'DEFENSE',
   '8791edc9620c99c2b4fc59c6fcb4eebb36c6136339534d3d93db1c325d754915', 'v0.1.0')
on conflict (device_id) do nothing;

-- ── 9. Seed: chemical profiles used by the simulator & evacuation widget ──
insert into public.chemical_profiles (name, toxicity_level, hazard_radius_m, exposure_limits, detection_threshold_ppm)
values
  ('Ammonia',          'HIGH',    500, '{"twa_ppm":25,"stel_ppm":35,"idlh_ppm":300}',  25),
  ('Chlorine',         'EXTREME', 800, '{"twa_ppm":0.5,"stel_ppm":1,"idlh_ppm":10}',   0.5),
  ('Hydrogen Sulfide', 'EXTREME', 700, '{"twa_ppm":1,"stel_ppm":5,"idlh_ppm":100}',    1),
  ('Sulfur Dioxide',   'HIGH',    400, '{"twa_ppm":2,"stel_ppm":5,"idlh_ppm":100}',    2),
  ('Benzene Vapor',    'HIGH',    350, '{"twa_ppm":1,"stel_ppm":5,"idlh_ppm":500}',    1),
  ('VOC Complex',      'MODERATE',300, '{"twa_ppm":100,"stel_ppm":150,"idlh_ppm":1000}', 100)
on conflict (name) do nothing;

-- ── 10. Storage bucket for TinyML binaries (private, signed-URL access) ──
insert into storage.buckets (id, name, public)
values ('tinyml-models', 'tinyml-models', false)
on conflict (id) do nothing;
