-- Consolidate avatar storage policies to a single owner-scoped set.
--
-- Two policy sets coexisted (policies OR together):
--   * schema-production.sql: writes scoped to the user's own folder
--     (`auth.uid()::text = (storage.foldername(name))[1]`)
--   * storage-policies.sql: writes allowed to ANY authenticated user for the
--     whole bucket — letting any user overwrite/delete any avatar.
-- Drop the permissive set and keep exactly one owner-scoped set.
--
-- Wrapped in an exception guard: managing storage.objects policies requires
-- table ownership, which some environments restrict for the migration role.

do $$
begin
  -- Permissive bucket-wide policies (storage-policies.sql)
  drop policy if exists "avatars_upload" on storage.objects;
  drop policy if exists "avatars_update" on storage.objects;
  drop policy if exists "avatars_delete" on storage.objects;
  drop policy if exists "avatars_public_read" on storage.objects;

  -- Owner-scoped canonical set (recreate idempotently)
  drop policy if exists "Anyone can view avatars" on storage.objects;
  drop policy if exists "Users can upload their own avatar" on storage.objects;
  drop policy if exists "Users can update their own avatar" on storage.objects;
  drop policy if exists "Users can delete their own avatar" on storage.objects;

  create policy "Anyone can view avatars" on storage.objects
    for select using (bucket_id = 'avatars');

  create policy "Users can upload their own avatar" on storage.objects
    for insert
    with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

  create policy "Users can update their own avatar" on storage.objects
    for update
    using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

  create policy "Users can delete their own avatar" on storage.objects
    for delete
    using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
exception
  when insufficient_privilege then
    raise notice 'storage_avatar_policies: insufficient privilege to manage storage.objects policies; apply via Dashboard SQL editor instead.';
end;
$$;
