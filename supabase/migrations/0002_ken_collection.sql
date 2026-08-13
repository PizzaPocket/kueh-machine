-- Ken: kueh collection
-- Run this once in the SQL editor (same as 0001_init.sql — this repo has no
-- Supabase CLI/migration runner wired up, so each numbered file here is
-- something to paste in by hand, not something that runs automatically).

-- ── Ken: kueh collection ────────────────────────────────────────────────
-- One JSON blob per player — { [kuehId]: count } — the exact same shape as
-- the client's own localStorage state (machines/ken/js/app.js's
-- `state.collection`), so syncing is a straight read/write of the whole
-- object rather than reconciling individual rows per kueh. Same private-
-- per-player-save pattern ruth_profiles already uses (AUTH.md's own
-- template for "not a public leaderboard") — a collection is nobody
-- else's business the way a leaderboard score is.
create table public.ken_collection (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.ken_collection enable row level security;
create policy "ken_collection_owner" on public.ken_collection
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
