-- Swamp Spotter schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: it also upgrades databases created from older versions of this file.

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
  location_accuracy_m double precision,        -- GPS accuracy radius reported by the device
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

-- Upgrades for databases created before these columns existed
alter table public.submissions add column if not exists location_accuracy_m double precision;

-- The old `sightings` table was a prototype superseded by `submissions`
drop table if exists public.sightings;

-- created_by is shown publicly; older rows fell back to the user's email address
update public.submissions set created_by = 'Observer' where created_by like '%@%';

-- ---------------------------------------------------------------------------
-- follows (observer follow graph used by /api/dashboard)
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  text not null,                  -- Clerk user ID of the follower
  following_id text not null,                  -- Clerk user ID being followed
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id)
);

create index if not exists follows_follower_id_idx on public.follows (follower_id);

-- ---------------------------------------------------------------------------
-- rate_limits (fixed-window request counters used by src/lib/rateLimit.ts)
-- key is e.g. "submit:user:<clerk id>" or "submit:ip:<sha256 of IP>"
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  hits         integer     not null default 0,
  primary key (key, window_start)
);

create index if not exists rate_limits_window_start_idx on public.rate_limits (window_start);

-- Counts one hit for p_key in the current window and returns true while the
-- key is still within p_limit. The upsert makes concurrent hits count correctly.
create or replace function public.hit_rate_limit(
  p_key            text,
  p_limit          integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
as $$
declare
  v_window timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;

  -- Windows older than a day are never read again
  delete from public.rate_limits where window_start < now() - interval '1 day';

  return v_hits <= p_limit;
end;
$$;

-- Only the server (service role) may call it
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The app talks to Supabase only from the server using the service role key
-- (auth is handled by Clerk). Enabling RLS with no policies means the public
-- anon key can't read or write anything if it ever leaks.
-- ---------------------------------------------------------------------------
alter table public.submissions enable row level security;
alter table public.follows     enable row level security;
alter table public.rate_limits enable row level security;
