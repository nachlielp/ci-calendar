-- Bio photos for every role with a bio (spec #34, slice 17). NOT APPLIED:
-- apply by hand (SQL editor) after review; nothing runs migrations.
--
-- The bio page is open to profile, creator, org and admin users (legacy's
-- PROFILE_ROLES), but storage.objects' write policies
-- (`creator_can_insert/update/delete`, docs/rls.md) require
-- has_creator_role(), which covers admin/creator/org only: a `profile` user
-- (a teacher without event rights) can't upload a photo. Until this is
-- applied, the bio page tells such a user the photo can't be uploaded and
-- saves the rest of the profile.
--
-- These policies are added beside the existing ones (permissive policies
-- combine with OR), so nothing existing changes: on the bio bucket only,
-- has_profile_role() (admin, creator, org, profile; docs/database-functions.md)
-- may insert and delete objects in their own folder (`<user id>/…`, the same
-- path check the creator policies have). The client never updates objects
-- (each upload is a new name, `upsert: false`), so no UPDATE policy.
--
-- Check first (the client uploads legacy's `image/jpg`, at most ~30 KB):
--   select allowed_mime_types, file_size_limit
--   from storage.buckets where id = 'ci_bio_profiles';
--   select policyname, cmd, qual, with_check
--   from pg_policies where schemaname = 'storage' and tablename = 'objects';

drop policy if exists "profile_can_insert_bio_photo" on storage.objects;
create policy "profile_can_insert_bio_photo"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'ci_bio_profiles'
        and public.has_profile_role()
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "profile_can_delete_bio_photo" on storage.objects;
create policy "profile_can_delete_bio_photo"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'ci_bio_profiles'
        and public.has_profile_role()
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );
