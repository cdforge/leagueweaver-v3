-- Storage bucket for league / division / team logos.
--
-- Path convention: {auth.uid()}/{entity}/{id}.webp  (entity = league|division|team)
-- Public read so print views and public /share/[slug] pages can load logos
-- without a session. Writes are restricted to the uploader's own uid folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'league-logos',
  'league-logos',
  true,
  2097152, -- 2 MB hard cap (client compresses to ~256px webp, typically <60 KB)
  array['image/webp', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may read logos (needed by public share + print).
drop policy if exists league_logos_public_read on storage.objects;
create policy league_logos_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'league-logos');

-- A signed-in user may write only within their own uid-prefixed folder.
drop policy if exists league_logos_owner_insert on storage.objects;
create policy league_logos_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'league-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists league_logos_owner_update on storage.objects;
create policy league_logos_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'league-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'league-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists league_logos_owner_delete on storage.objects;
create policy league_logos_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'league-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
