-- Amy: kueh collection
-- Run this once in the SQL editor (same as 0001/0002 — paste in by hand,
-- no migration runner wired up for this repo).

-- Same shape and same reasoning as ken_collection (0002_ken_collection.sql):
-- one JSON blob per player — { [kuehId]: count } — matching the client's
-- own localStorage state (machines/amy/js/app.js). Private per-player save,
-- not a leaderboard, so it uses ruth_profiles' single-owner-row template.
create table public.amy_collection (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.amy_collection enable row level security;
create policy "amy_collection_owner" on public.amy_collection
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
