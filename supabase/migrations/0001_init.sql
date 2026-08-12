-- kueh-machine shared account system
-- Run this once in the new project's SQL editor (Supabase → SQL Editor → New query).
-- No Supabase CLI is wired up for this repo — this file is documentation-as-code,
-- not an automated migration pipeline.

-- ── Shared identity ─────────────────────────────────────────────────────
-- One row per signed-up user, auto-provisioned by the trigger below. Every
-- per-game table below references auth.users(id) directly rather than this
-- table, so this is purely the "who is this person" layer (display name),
-- not a foreign-key hub.
-- avatar_illustration is one of a curated set of ids, each a real
-- illustration pulled from a contributor's own project (see
-- shared/account-widget.js's AVATAR_ILLUSTRATIONS — ids there must match
-- these), not a generated/abstract avatar. avatar_color is the background
-- swatch behind it, one of AVATAR_COLORS there. Both get a random default
-- on signup (handle_new_user() below) and stay user-editable after —
-- see AUTH.md/the widget's avatar-editor panel.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_illustration text,
  avatar_color text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
-- Publicly readable — display_name/avatar are meant to be shown to other
-- people (leaderboards, friends lists), not just the owner. Nothing in this
-- table is sensitive (no email, no auth data); profiles_select_own below is
-- now a redundant subset of this but harmless to leave (RLS policies OR
-- together).
create policy "profiles_select_public" on public.profiles for select using (true);
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Keep this array in sync with AVATAR_ILLUSTRATIONS' ids in
-- shared/account-widget.js by hand — there's no shared source of truth
-- between SQL and JS in this no-build-step setup.
create or replace function public.random_avatar_illustration() returns text as $$
  select (array[
    'amy-ang-ku-kueh', 'amy-kueh-salat', 'amy-onde-onde', 'amy-bird',
    'ken-kueh-bahulu', 'ken-kueh-dadar', 'ken-kueh-talam',
    'viki-tutukueh', 'viki-kueh-lapis',
    'amanda-kueh-bunga', 'amanda-kueh-build', 'amanda-kueh-story', 'amanda-kueh-photobook',
    'liwei-snake-head', 'liwei-kopi'
  ])[floor(random() * 15 + 1)];
$$ language sql volatile;

create or replace function public.random_avatar_color() returns text as $$
  select (array[
    '#F2B8C6', '#8FBF7F', '#F0B429', '#D97B66',
    '#B8D8B8', '#FBF6EC', '#C4933F', '#5B3A29'
  ])[floor(random() * 8 + 1)];
$$ language sql volatile;

create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_illustration, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    public.random_avatar_illustration(),
    public.random_avatar_color()
  );
  return new;
end; $$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Ruth: profile blob ──────────────────────────────────────────────────
-- 1:1 port of her existing save_profile(p_token, p_data) / load_profile(p_token)
-- RPC contract — data keeps the same shape her client already sends:
-- { bakerName, unlockedLevels, levelStars, highScores, score, collectedRecipes, friends }
-- baker_id is a short stable public code (assigned once, see the trigger
-- below) for "add me as a friend" — display_name/user_id already exist
-- elsewhere, but neither is meant to be typed in by hand or shared as a
-- lookup key the way this is.
create table public.ruth_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  baker_id text unique,
  updated_at timestamptz not null default now()
);
alter table public.ruth_profiles enable row level security;
create policy "ruth_profiles_owner" on public.ruth_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Random 4-digit code, regenerated on collision (astronomically rare at
-- this player count, but the loop makes it correct regardless of scale).
create or replace function public.ruth_generate_baker_id() returns text as $$
declare
  candidate text;
begin
  loop
    candidate := lpad(floor(random() * 9000 + 1000)::text, 4, '0');
    exit when not exists (select 1 from public.ruth_profiles where baker_id = candidate);
  end loop;
  return candidate;
end; $$ language plpgsql volatile;

-- Fires only on a brand-new row (INSERT), never on the upsert-driven
-- updates pushProfileToServer() sends afterward — so a player's baker_id
-- is assigned once and never changes.
create or replace function public.ruth_profiles_set_baker_id() returns trigger as $$
begin
  if new.baker_id is null then
    new.baker_id := public.ruth_generate_baker_id();
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists ruth_profiles_baker_id on public.ruth_profiles;
create trigger ruth_profiles_baker_id before insert on public.ruth_profiles
  for each row execute procedure public.ruth_profiles_set_baker_id();

-- Minimal public lookup for "add a friend by Baker ID" — deliberately
-- returns only { user_id, baker_name }, not the full data blob (which holds
-- this player's own scores/recipes/friends list — private, see
-- ruth_profiles_owner above).
create or replace function public.ruth_lookup_baker(p_baker_id text)
returns table(user_id uuid, baker_name text) as $$
  select ruth_profiles.user_id, ruth_profiles.data->>'bakerName'
  from public.ruth_profiles
  where baker_id = p_baker_id
  limit 1;
$$ language sql security definer stable;

-- ── Ruth: leaderboard ───────────────────────────────────────────────────
-- One cumulative row per player (upsert by player_id — same shape as
-- Liwei's liwei_scores/upsert_score below), not append-only: every level
-- completion re-submits the running total_score(), and a fresh insert per
-- submission would leave old, lower totals sitting on the board as separate
-- entries for the same person. player_id is auth.uid()::text when signed
-- in, or a per-device localStorage guest id otherwise (ruth's main script).
create table public.ruth_scores (
  id bigint generated always as identity primary key,
  player_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  score int not null check (score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ruth_scores enable row level security;
create policy "ruth_scores_read_all" on public.ruth_scores for select using (true);
create policy "ruth_scores_write_own_or_anon" on public.ruth_scores
  for all using (user_id is null or user_id = auth.uid())
  with check (user_id is null or user_id = auth.uid());

-- security definer + reading auth.uid() itself (not the p_player_id
-- argument) so a signed-in user can never upsert under someone else's row —
-- identical pattern to Liwei's upsert_score below.
create or replace function public.ruth_upsert_score(p_player_id text, p_name text, p_score int)
returns public.ruth_scores as $$
declare
  v_uid uuid := auth.uid();
  v_pid text;
  result public.ruth_scores;
begin
  v_pid := case when v_uid is not null then v_uid::text else p_player_id end;
  insert into public.ruth_scores (player_id, user_id, name, score, updated_at)
  values (v_pid, v_uid, left(p_name, 24), greatest(0, p_score), now())
  on conflict (player_id) do update
    set name = excluded.name,
        score = greatest(ruth_scores.score, excluded.score),
        updated_at = now()
  returning * into result;
  return result;
end; $$ language plpgsql security definer;

-- ── Liwei: leaderboard ──────────────────────────────────────────────────
-- Keeps the existing upsert-by-player_id shape. player_id is the anonymous
-- localStorage UUID when signed out, or auth.uid()::text when signed in —
-- same column, same meaning as her current scores table.
create table public.liwei_scores (
  id bigint generated always as identity primary key,
  player_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  score int not null check (score >= 0),
  updated_at timestamptz not null default now()
);
alter table public.liwei_scores enable row level security;
create policy "liwei_scores_read_all" on public.liwei_scores for select using (true);
create policy "liwei_scores_write_own_or_anon" on public.liwei_scores
  for all using (user_id is null or user_id = auth.uid())
  with check (user_id is null or user_id = auth.uid());

-- security definer + reading auth.uid() itself (rather than trusting the
-- p_player_id argument for signed-in callers) so a signed-in user can never
-- upsert under someone else's row by passing a foreign id.
create function public.upsert_score(p_player_id text, p_name text, p_score int)
returns public.liwei_scores as $$
declare
  v_uid uuid := auth.uid();
  v_pid text;
  result public.liwei_scores;
begin
  v_pid := case when v_uid is not null then v_uid::text else p_player_id end;
  insert into public.liwei_scores (player_id, user_id, name, score, updated_at)
  values (v_pid, v_uid, left(p_name, 24), greatest(0, p_score), now())
  on conflict (player_id) do update
    set name = excluded.name,
        score = greatest(liwei_scores.score, excluded.score),
        updated_at = now()
  returning * into result;
  return result;
end; $$ language plpgsql security definer;
