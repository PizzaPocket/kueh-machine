-- Add Leonard's Kueh-verse character and attach it to his existing account.
-- The public character table stores only the auth user id; the email remains
-- private in auth.users and is used here solely to resolve that id once.

insert into public.contributor_characters (contributor_key, display_name)
values ('leonard', 'Leonard Reese')
on conflict (contributor_key) do update
set display_name = excluded.display_name,
    updated_at = now();

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower('leonard.d.reese@gmail.com')
  limit 1;

  if v_user_id is null then
    raise notice 'Leonard account not found; contributor row created without an owner';
    return;
  end if;

  if exists (
    select 1 from public.contributor_characters
    where owner_user_id = v_user_id and contributor_key <> 'leonard'
  ) then
    raise exception 'Leonard account already owns a different contributor character';
  end if;

  insert into public.character_profiles (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  update public.contributor_characters
  set owner_user_id = v_user_id,
      updated_at = now()
  where contributor_key = 'leonard';
end;
$$;
