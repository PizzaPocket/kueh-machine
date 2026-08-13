-- Natalia: Care Island habit progress
-- Run this once in the SQL editor (same as 0001-0003 — paste in by hand).

-- One JSON blob per player — { habits: <habit config>, progress: { <YYYY-
-- MM-DD>: <that day's log> } } — mirroring the two localStorage shapes the
-- client already keeps (machines/natalia/script.js: STORAGE_HABITS,
-- ci_progress_<date>). Same private-per-player-save pattern as
-- ruth_profiles/ken_collection/amy_collection — a habit log is nobody
-- else's business.
create table public.natalia_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.natalia_progress enable row level security;
create policy "natalia_progress_owner" on public.natalia_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
