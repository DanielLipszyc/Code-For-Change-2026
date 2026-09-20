-- Swamp Spotter schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- submissions (plant sightings submitted from /submit, shown on /map and /log)
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id              uuid primary key default gen_random_uuid(),
  plant_name      text not null,
  scientific_name text,
  lat             double precision not null,
  lng             double precision not null,
  timestamp_ms    bigint not null,             -- when the plant was spotted (epoch ms)
  notes           text,
  image_data      text,                        -- base64 data URL
  user_id         text,                        -- Clerk user ID
  created_by      text,                        -- display name at time of submission
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  status          text not null default 'pending'
                  check (status in ('pending', 'approved')),
  approved_at     timestamptz,
  approved_by     text                         -- Clerk user ID of approving admin
);

create index if not exists submissions_timestamp_ms_idx on public.submissions (timestamp_ms desc);
create index if not exists submissions_user_id_idx      on public.submissions (user_id);
create index if not exists submissions_status_idx       on public.submissions (status);

-- ---------------------------------------------------------------------------
-- sightings (used by /api/sightings and /test-sightings)
-- ---------------------------------------------------------------------------
create table if not exists public.sightings (
  id                  uuid primary key default gen_random_uuid(),
  species_id          text,
  lat                 double precision not null,
  lng                 double precision not null,
  location_accuracy_m double precision,
  address_approx      text,
  observed_at         timestamptz not null default now(),
  reported_at         timestamptz not null default now(),
  notes               text not null default '',
  status              text not null default 'pending',
  user_id             text,
  created_by          text,
  updated_at          timestamptz
);

create index if not exists sightings_reported_at_idx on public.sightings (reported_at desc);
create index if not exists sightings_status_idx      on public.sightings (status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The app talks to Supabase only from the server using the service role key
-- (auth is handled by Clerk). Enabling RLS with no policies means the public
-- anon key can't read or write anything if it ever leaks.
-- ---------------------------------------------------------------------------
alter table public.submissions enable row level security;
alter table public.sightings   enable row level security;
