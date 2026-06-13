-- =====================================================================
-- Profile picture storage — lets each user upload a profile picture.
-- Run after 0002_payments.sql.
-- Bucket name: `profilepic` (create it in Storage, or this will create it).
-- Files are stored under  profilepic/<user_id>/<filename>  so a user can only
-- write inside their own folder. The bucket is public-read so the app can
-- show pictures via a plain URL.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profilepic',
  'profilepic',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can view profile pictures (public).
drop policy if exists "profilepic_public_read" on storage.objects;
create policy "profilepic_public_read" on storage.objects
  for select using (bucket_id = 'profilepic');

-- A user may upload only into their own folder (first path segment = their uid).
drop policy if exists "profilepic_insert_own" on storage.objects;
create policy "profilepic_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profilepic' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profilepic_update_own" on storage.objects;
create policy "profilepic_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'profilepic' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profilepic' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profilepic_delete_own" on storage.objects;
create policy "profilepic_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profilepic' and (storage.foldername(name))[1] = auth.uid()::text);
