-- Kueh Machine: The Great Reverse Makan — HDB Panic
-- Private per-player progress (high score), following DATABASE.md's
-- "own project folder" workflow: this file goes in the zip handed to
-- Leonard, who runs it against the shared Supabase project and adds it
-- to supabase/migrations/ during integration.
--
-- Shape: one row per signed-in user, single jsonb column, RLS locked to
-- auth.uid() — same pattern as the ken_collection example in DATABASE.md.

create table if not exists kueh_hdb_panic_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table kueh_hdb_panic_progress enable row level security;

create policy "select own progress"
  on kueh_hdb_panic_progress for select
  using (auth.uid() = user_id);

create policy "insert own progress"
  on kueh_hdb_panic_progress for insert
  with check (auth.uid() = user_id);

create policy "update own progress"
  on kueh_hdb_panic_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public fastest-time leaderboard — a separate table from the private
-- progress row above, per DATABASE.md's Private/Public split. One row per
-- player (their personal best), publicly readable by anyone so the board
-- can be shown to signed-out visitors too; writable only by the row's own
-- owner, same auth.uid() pattern as every other table here.

create table if not exists kueh_hdb_panic_leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  best_time_ms integer not null,
  achieved_at timestamptz not null default now()
);

alter table kueh_hdb_panic_leaderboard enable row level security;

create policy "select all leaderboard entries"
  on kueh_hdb_panic_leaderboard for select
  using (true);

create policy "insert own leaderboard entry"
  on kueh_hdb_panic_leaderboard for insert
  with check (auth.uid() = user_id);

create policy "update own leaderboard entry"
  on kueh_hdb_panic_leaderboard for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
