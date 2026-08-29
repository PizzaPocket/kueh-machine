-- Kueh-verse account characters and contributor claims.
-- Apply after 0001_init.sql. Invitation administration intentionally stays
-- backend-only for v1; no public admin UI or service-role credential is needed.

create extension if not exists pgcrypto;

create table public.character_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  appearance jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1 check (schema_version > 0),
  has_customized boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.character_profiles enable row level security;

-- Character appearance is intentionally public: it is rendered for other
-- visitors when its owner represents a contributor in the Kueh-verse.
create policy "character_profiles_read_public" on public.character_profiles
  for select using (true);
create policy "character_profiles_insert_own" on public.character_profiles
  for insert with check (auth.uid() = user_id);
create policy "character_profiles_update_own" on public.character_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.contributor_characters (
  contributor_key text primary key check (contributor_key ~ '^[a-z0-9_-]+$'),
  display_name text not null,
  owner_user_id uuid unique references auth.users(id) on delete set null,
  default_appearance jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.contributor_characters enable row level security;
create policy "contributor_characters_read_public" on public.contributor_characters
  for select using (true);

create table public.character_claim_invites (
  id uuid primary key default gen_random_uuid(),
  contributor_key text not null references public.contributor_characters(contributor_key) on delete cascade,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.character_claim_invites enable row level security;
-- No table policies: invite rows are reachable only through the narrow RPCs.

insert into public.contributor_characters (contributor_key, display_name) values
  ('amanda', 'Amanda Ng'), ('amy', 'Amy Fu'), ('azri', 'Azri'),
  ('geraldine', 'Geraldine Chua'), ('jesslyn', 'Jesslyn Teo'),
  ('kaixin', 'Kaixin Cai'), ('ken', 'Ken Lee'), ('kevin', 'Kevin Dreher'),
  ('liwei', 'Li Wei Lim'), ('meijun', 'Mei Jun Chew'),
  ('natalia', 'Natalia Lionardy'), ('nicole', 'Nicole Ng'),
  ('ruth', 'Ruth Yong'), ('samantha', 'Samantha Tan'),
  ('sophia', 'Sophia Himawan'), ('viki', 'Viki Yap')
on conflict (contributor_key) do update set display_name = excluded.display_name;

-- Called only from trusted backend access (SQL editor/service role). Returns
-- the plaintext token once; only its SHA-256 digest is retained.
create or replace function public.admin_create_character_invite(
  p_contributor_key text,
  p_valid_for interval default interval '30 days'
) returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text := encode(gen_random_bytes(24), 'hex');
begin
  if not exists (
    select 1 from public.contributor_characters
    where contributor_key = p_contributor_key and owner_user_id is null
  ) then
    raise exception 'Contributor does not exist or is already claimed';
  end if;
  update public.character_claim_invites
    set revoked_at = now()
    where contributor_key = p_contributor_key
      and claimed_at is null and revoked_at is null;
  insert into public.character_claim_invites (contributor_key, token_hash, expires_at)
    values (p_contributor_key, digest(v_token, 'sha256'), now() + p_valid_for);
  return v_token;
end;
$$;
revoke all on function public.admin_create_character_invite(text, interval) from public, anon, authenticated;
grant execute on function public.admin_create_character_invite(text, interval) to service_role;

-- A holder of the unguessable link may preview only the invited character's
-- public name before signing in; no invite row or account data is exposed.
create or replace function public.preview_character_claim(p_token text)
returns table(contributor_key text, display_name text)
language sql
security definer
set search_path = public, extensions
as $$
  select c.contributor_key, c.display_name
  from public.character_claim_invites i
  join public.contributor_characters c using (contributor_key)
  where i.token_hash = digest(p_token, 'sha256')
    and i.claimed_at is null and i.revoked_at is null and i.expires_at > now()
    and c.owner_user_id is null
  limit 1;
$$;
revoke all on function public.preview_character_claim(text) from public;
grant execute on function public.preview_character_claim(text) to anon, authenticated;

-- Authenticated redemption is atomic and never exposes invite-table rows.
create or replace function public.claim_contributor_character(p_token text)
returns table(contributor_key text, display_name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.character_claim_invites;
  v_character public.contributor_characters;
begin
  if v_uid is null then raise exception 'Sign in before claiming a character'; end if;

  select * into v_invite
  from public.character_claim_invites
  where token_hash = digest(p_token, 'sha256')
    and claimed_at is null and revoked_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Invite is invalid, expired, or already used'; end if;

  select * into v_character
  from public.contributor_characters
  where contributor_characters.contributor_key = v_invite.contributor_key
  for update;
  if v_character.owner_user_id is not null then raise exception 'Character is already claimed'; end if;
  if exists (select 1 from public.contributor_characters where owner_user_id = v_uid) then
    raise exception 'This account already owns a contributor character';
  end if;

  insert into public.character_profiles (user_id, appearance, schema_version, has_customized)
    values (v_uid, v_character.default_appearance, 1, false)
    on conflict (user_id) do nothing;
  update public.contributor_characters
    set owner_user_id = v_uid, updated_at = now()
    where contributor_characters.contributor_key = v_invite.contributor_key;
  update public.character_claim_invites
    set claimed_at = now(), claimed_by = v_uid
    where id = v_invite.id;

  return query select v_character.contributor_key, v_character.display_name;
end;
$$;
revoke all on function public.claim_contributor_character(text) from public, anon;
grant execute on function public.claim_contributor_character(text) to authenticated;

-- Backend-only recovery path for an incorrect claim.
create or replace function public.admin_release_contributor_character(p_contributor_key text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.contributor_characters
  set owner_user_id = null, updated_at = now()
  where contributor_key = p_contributor_key;
$$;
revoke all on function public.admin_release_contributor_character(text) from public, anon, authenticated;
grant execute on function public.admin_release_contributor_character(text) to service_role;
