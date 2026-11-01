-- Role checks run as their owner, so RLS on `user_roles` can't recurse.
-- ALREADY LIVE: applied by hand on 2026-09-28 to end a production outage;
-- this file records it so a fresh or local database gets the same functions.
--
-- `has_admin_role()` and `has_creator_role()` read `user_roles`, and
-- `user_roles`'s own `admin_full_crudl` policy calls `has_admin_role()`. As
-- SECURITY INVOKER functions, that read went back through RLS, which called
-- the function again: `54001 stack depth limit exceeded` on creating events
-- and on the users, roles and requests reads. The old `USING (true)` select
-- policy on `user_roles` had hidden it until the 2026-08-08 drift fix scoped
-- it (docs/rls.md).
--
-- As SECURITY DEFINER the lookup bypasses RLS. `auth.uid()` still reads the
-- request's JWT, so each function still answers for the caller. The fixed
-- `search_path` stops a caller's schema from shadowing `user_roles` or
-- `roles`.
--
-- Idempotent: ALTER FUNCTION sets the same attributes again with no change.
--
-- Check (both rows: prosecdef = true, proconfig = {"search_path=public, pg_temp"}):
--   select proname, prosecdef, proconfig from pg_proc
--   where pronamespace = 'public'::regnamespace
--     and proname in ('has_admin_role', 'has_creator_role');

alter function public.has_admin_role()
    security definer
    set search_path = public, pg_temp;

alter function public.has_creator_role()
    security definer
    set search_path = public, pg_temp;
