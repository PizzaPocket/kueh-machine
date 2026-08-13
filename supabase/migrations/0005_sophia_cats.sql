-- Sophia: CatScan sightings
-- Run this once in the SQL editor (same as 0001-0004 — paste in by hand).

-- One row per cat — a genuinely shared community log, not a private save
-- (unlike ken_collection/amy_collection/natalia_progress), so this follows
-- the public-read-and-write shape ruth_scores/liwei_scores already use
-- rather than the single-owner-row template. id keeps the client's own
-- makeId() format ("cat-xxxxx") as the primary key instead of introducing
-- a second id scheme. names/sightings stay as jsonb arrays, matching
-- machines/sophia/js/app.js's own cat object shape exactly, so a row here
-- maps straight onto what the client already renders — no reshaping needed
-- at the call sites (see pushCatToServer/syncCatsFromServer in app.js).
--
-- sophia_cats_update_all is deliberately wide open (any signed-in-or-not
-- caller can update any row), not narrowed to "append your own sighting
-- only" — appending a new name or sighting to somebody ELSE's
-- already-discovered cat is the whole point of a crowdsourced map, and
-- there's no per-row owner concept here the way ruth_profiles/
-- ken_collection have. A real production version of this would want a
-- security-definer RPC that only allows appending to the names/sightings
-- arrays (not overwriting lat/lng/photo wholesale) — a good next step for
-- Sophia to build, not something this first pass tries to solve.
create table public.sophia_cats (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  vibe text,
  photo text,
  names jsonb not null default '[]'::jsonb,
  discovered_by text,
  discovered_date timestamptz not null default now(),
  sightings jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.sophia_cats enable row level security;
create policy "sophia_cats_read_all" on public.sophia_cats for select using (true);
create policy "sophia_cats_insert_all" on public.sophia_cats for insert with check (true);
create policy "sophia_cats_update_all" on public.sophia_cats for update using (true) with check (true);
