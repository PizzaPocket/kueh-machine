-- Sophia / Cat Scan: move new photos to Storage and restrict shared writes.
-- Existing values in `photo` remain readable; new uploads use `photo_url`.

alter table public.sophia_cats
  add column if not exists photo_url text;

-- The map is public, but only signed-in accounts may create shared cats.
-- Names and sightings are appended through the RPCs below, so clients do
-- not receive unrestricted UPDATE access to whole cat rows.
drop policy if exists "sophia_cats_read_all" on public.sophia_cats;
drop policy if exists "sophia_cats_insert_all" on public.sophia_cats;
drop policy if exists "sophia_cats_update_all" on public.sophia_cats;

revoke all on table public.sophia_cats from anon, authenticated;
grant select on table public.sophia_cats to anon, authenticated;
grant insert on table public.sophia_cats to authenticated;

create policy "sophia_cats_public_read"
  on public.sophia_cats for select
  to anon, authenticated
  using (true);

create policy "sophia_cats_authenticated_insert"
  on public.sophia_cats for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create or replace function public.sophia_append_name(
  p_cat_id text,
  p_name text,
  p_by text
)
returns public.sophia_cats
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cat public.sophia_cats;
  v_now timestamptz := now();
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to add a name' using errcode = '42501';
  end if;
  if length(trim(p_name)) not between 1 and 80
     or length(trim(p_by)) not between 1 and 80 then
    raise exception 'Name and credit must be between 1 and 80 characters'
      using errcode = '22023';
  end if;

  update public.sophia_cats
  set names = names || jsonb_build_array(jsonb_build_object(
        'name', trim(p_name),
        'by', trim(p_by),
        'date', v_now
      )),
      updated_at = v_now
  where id = p_cat_id
  returning * into v_cat;

  if not found then
    raise exception 'Cat not found' using errcode = 'P0002';
  end if;
  return v_cat;
end;
$$;

create or replace function public.sophia_append_sighting(
  p_cat_id text,
  p_note text,
  p_by text
)
returns public.sophia_cats
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cat public.sophia_cats;
  v_now timestamptz := now();
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to add a shared sighting' using errcode = '42501';
  end if;
  if length(trim(p_note)) not between 1 and 500
     or length(trim(p_by)) not between 1 and 80 then
    raise exception 'Sighting must be 1–500 characters and credit 1–80 characters'
      using errcode = '22023';
  end if;

  update public.sophia_cats
  set sightings = sightings || jsonb_build_array(jsonb_build_object(
        'note', trim(p_note),
        'by', trim(p_by),
        'date', v_now
      )),
      updated_at = v_now
  where id = p_cat_id
  returning * into v_cat;

  if not found then
    raise exception 'Cat not found' using errcode = 'P0002';
  end if;
  return v_cat;
end;
$$;

revoke all on function public.sophia_append_name(text, text, text) from public, anon;
revoke all on function public.sophia_append_sighting(text, text, text) from public, anon;
grant execute on function public.sophia_append_name(text, text, text) to authenticated;
grant execute on function public.sophia_append_sighting(text, text, text) to authenticated;

-- Public photos suit a public community map. Uploads are restricted to a
-- signed-in user's own folder and JPEGs produced by the app's compressor.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'cat-photos',
  'cat-photos',
  true,
  1048576,
  array['image/jpeg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cat_photos_public_read" on storage.objects;
drop policy if exists "cat_photos_authenticated_upload" on storage.objects;
drop policy if exists "cat_photos_owner_upload" on storage.objects;
drop policy if exists "cat_photos_owner_delete" on storage.objects;

create policy "cat_photos_owner_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cat-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and lower(storage.extension(name)) = 'jpg'
  );

create policy "cat_photos_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cat-photos'
    and owner_id = (select auth.uid()::text)
  );
