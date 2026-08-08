# Row-Level Security (RLS) & Storage Policies

The web client ships a Supabase **anon** key (it is inlined into the public
bundle — see [database-schema.md](./database-schema.md) for the tables and
[database-functions.md](./database-functions.md) for the helper functions).
Because the anon key is public, **RLS is the entire authorization layer**:
every access rule must be enforced by a database policy, never by the client.
Client-side filters (e.g. the `hide` filter in `getCIEvents`, the
`getSortedEvents` computed in the store) are defense in depth only — they make
the UI correct, they do **not** keep data safe.

> **Verification status — VERIFIED against the live project
> (`pjgwpivkvsuernmoeebk`) on 2026-08-08** via the queries in
> [Verifying against the live database](#verifying-against-the-live-database).
> RLS is enabled on all 14 public tables. Three drifts from the required model
> below were found and fixed in that pass — see
> [Live verification & drift fixed](#live-verification--drift-fixed-2026-08-08).
> The `wa_*` PII tables have RLS on with **no** client policies, so they are
> reachable only by the service role (the safest state). Re-run the queries and
> reconcile if the schema changes.

## Roles

| Role          | How it is established                                                  |
| ------------- | ---------------------------------------------------------------------- |
| **anonymous** | No session. The public calendar / bio pages.                           |
| **user**      | Authenticated (`auth.uid()` present) with no elevated role.            |
| **creator**   | Has a `creator` row in `user_roles` → `has_creator_role()`.            |
| **profile**   | Has a `profile` row in `user_roles` → `has_profile_role()`.            |
| **admin**     | Has an `admin` role → `has_admin_role()` / `check_user_is_admin(uid)`. |

`owner` below means "the row belongs to the current user", i.e.
`user_id = auth.uid()` (for `ci_events`, ownership is the `user_id` column;
`owners` is an additional array of co-owner ids).

## Table policies

Legend: ✅ allowed · ⛔ denied · **own** = only rows the caller owns.

| Table                      | SELECT                                                         | INSERT                         | UPDATE              | DELETE              |
| -------------------------- | -------------------------------------------------------------- | ------------------------------ | ------------------- | ------------------- |
| `ci_events`                | anon/user: **only `hide = false`**; owner + admin: all own/any | creator, admin                 | owner, admin        | owner, admin        |
| `ci_events_users_junction` | ✅ public (join for tagged teachers)                           | creator (own event), admin     | owner, admin        | owner, admin        |
| `public_bio`               | ✅ public **where `show_profile = true`**; owner + admin: all  | owner (self), admin            | owner, admin        | admin               |
| `users`                    | owner (self), admin                                            | self on signup, admin          | owner (self), admin | admin               |
| `requests`                 | owner, admin                                                   | user (self), admin             | owner, admin        | owner, admin        |
| `templates`                | owner, admin                                                   | owner (self), admin            | owner, admin        | owner, admin        |
| `user_roles`               | owner (self), admin                                            | admin (via `assign_user_role`) | admin               | admin               |
| `roles`                    | ✅ authenticated (lookup table)                                | admin                          | admin               | admin               |
| `notifications`            | owner (self), admin                                            | system/admin                   | owner (self), admin | owner (self), admin |
| `alerts`                   | owner (self), admin                                            | system/admin                   | owner (self), admin | admin               |
| `config`                   | ✅ public (feature flags / app config)                         | admin                          | admin               | admin               |
| `wa_users`                 | admin only                                                     | system/admin                   | admin               | admin               |
| `wa_messages`              | admin only                                                     | system/admin                   | admin               | admin               |
| `wa_twilio_logs`           | admin only                                                     | system/admin                   | admin               | admin               |

WhatsApp tables (`wa_*`) hold PII (phone numbers, message bodies) and must
**never** be readable by anon or ordinary users — admin-only, or better, only
reachable by a server-side function with the service role.

## `ci_events`: the hidden-events rule (ticket #13)

**Requirement.** Hidden (unpublished / cancelled) events must never leave the
database for viewers who shouldn't see them:

- **anonymous & ordinary users** may read a `ci_events` row **only when
  `hide = false`**;
- the **owner** (`user_id = auth.uid()`, or listed in `owners`) and **admins**
  may read their own hidden rows (the management views rely on this).

**App-level enforcement (this repo).** Three fetch paths select `ci_events`;
all now exclude hidden rows by default:

1. `cieventsService.getCIEvents()` — filters `hide = false` unless the caller
   passes `show_hidden: true` (`src/supabase/cieventsService.ts`).
2. `usersService.getUserData()` second (public-window) query — filters
   `hide = false` (`src/supabase/usersService.ts`). The first (owner) query is
   left unfiltered so creators still receive their own hidden events, which are
   then surfaced only in the management lists.
3. Client-side defense in depth: the store's `getSortedEvents` computed drops
   `hide` rows before the public calendar renders them.

**Database-level enforcement (source of truth).** The app filter is a
convenience/perf layer; the guarantee must live in RLS. The live `ci_events`
SELECT policy (`read_by_all`) enforces:

```sql
ALTER POLICY "read_by_all" ON public.ci_events
USING (
  hide = false
  OR (SELECT auth.uid()) = user_id
  OR has_admin_role()
);
```

With this policy in place, an anonymous client physically cannot fetch a hidden
row, so the app-level filters become redundant safety nets rather than the only
line of defense.

> The doc originally suggested an `auth.uid() = ANY (owners)` co-owner clause,
> but `owners` is a `Json[]` of `{value,label}` objects — not a `uuid[]` — so
> that comparison is a type error. In practice `owners` only ever holds the
> creator (already matched by `user_id`), so it was dropped. Real co-ownership
> would need a `jsonb_array_elements(owners) → 'value'` check. The role helper
> used in the live DB is `has_admin_role()` (not `check_user_is_admin(uid)`).

## Storage buckets

Buckets are configured via env (`VITE_SUPABASE_STORAGE_BUCKET`,
`VITE_SUPABASE_BIO_STORAGE_PATH`, `VITE_SUPABASE_BIO_STORAGE_PUBLIC_URL`).

| Bucket / path    | Read                                               | Write                                                                              |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Main app bucket  | public read (profile / event images served by URL) | authenticated users may upload; each object writable only by its owner or an admin |
| Bio storage path | public read (served via the public URL)            | owner of the bio (self) or admin                                                   |

`storageService.uploadFile` uploads to the main bucket from the browser under
the caller's session, so the bucket's INSERT/UPDATE policy — not the client — is
what restricts who can write and where. Objects must be scoped by owner
(typically a `user_id`-prefixed path checked in the storage policy) so one user
cannot overwrite another's files.

## Role mutation: `assign_user_role` (ticket #16)

Assigning a role touches three tables — `user_roles` (membership), `users`
(`user_type`), and `public_bio` (`user_type`). Doing that as three separate
client writes has two problems: there is no transaction (a mid-way failure
leaves a half-promoted user), and it depends on each table's write policy
allowing the caller — which was never verified and must **not** be open to
ordinary users.

Both are fixed by making the mutation one server-side operation:

```sql
-- supabase/migrations/20260808000000_assign_user_role.sql
SELECT public.assign_user_role(p_user_id => …, p_role_id => …, p_user_type => …);
```

- **Atomic.** The function performs all three writes in a single statement
  body, so they commit or roll back together.
- **Admin-only, server-enforced.** It is `SECURITY DEFINER` and begins with
  `IF NOT has_admin_role() THEN RAISE EXCEPTION … USING errcode = '42501'`.
  Because `auth.uid()` inside a definer function still reflects the _calling_
  session (it reads the request JWT, not the definer), `has_admin_role()`
  correctly gates the caller. `anon` has `EXECUTE` revoked; only
  `authenticated` may call it, and non-admins are rejected by the guard.
- **The client no longer writes these tables directly.**
  `userRoleService.updateUserRole` is a single
  `supabase.rpc("assign_user_role", …)` call
  (`src/supabase/userRoleService.ts`); the seam test in
  `userRoleService.test.ts` asserts there is exactly one RPC write path.

**Direct-write policies must deny non-admins** (defense the RPC leans on — a
non-admin must not be able to bypass the function by writing the tables
directly):

| Table        | Non-admin direct INSERT/UPDATE/DELETE | Enforced by                             |
| ------------ | ------------------------------------- | --------------------------------------- |
| `user_roles` | ⛔ denied (self-read only)            | `admin_full_crudl` + self-scoped SELECT |
| `users`      | UPDATE own row only; no `user_type`\* | owner/admin UPDATE policy               |
| `public_bio` | owner may upsert own bio; admin all   | owner/admin write policy                |

\* `users` / `public_bio` owner-write policies let a user edit their own row,
but a non-admin still cannot grant themselves a role because `user_roles` write
is admin-only — `user_type` without a matching `user_roles` row confers nothing.
Verify with the queries below that `user_roles` INSERT/UPDATE/DELETE are
admin-only before relying on this.

## Verifying against the live database

Run these with a privileged (service-role / db owner) connection and reconcile
any differences with the tables above:

```sql
-- Which tables have RLS enabled?
SELECT relname, relrowsecurity
FROM pg_class
WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
ORDER BY relname;

-- Every policy, with its USING / WITH CHECK expressions.
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Storage bucket policies.
SELECT name, definition, command
FROM storage.policies;   -- or: SELECT * FROM pg_policies WHERE schemaname = 'storage';
```

The hidden-events guarantee specifically:

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'ci_events' AND cmd = 'SELECT';
-- The USING (`qual`) expression must constrain `hide = false` for anon/user.
```

Role-mutation rules (ticket #16) — `user_roles` writes must be admin-only, and
`assign_user_role` must be admin-gated and unreachable by anon:

```sql
-- user_roles INSERT/UPDATE/DELETE policies must all require admin.
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_roles'
ORDER BY cmd;

-- assign_user_role: SECURITY DEFINER, and anon must NOT have EXECUTE.
SELECT p.proname, p.prosecdef AS security_definer,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authed_can_execute
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'assign_user_role';
-- Expect: security_definer = true, anon_can_execute = false. The admin check is
-- inside the function body (has_admin_role()); confirm a non-admin call is
-- rejected with a not_authorized error.
```

## Live verification & drift fixed (2026-08-08)

Verified against project `pjgwpivkvsuernmoeebk` in the SQL editor (service role).
RLS confirmed enabled on all 14 public tables. `wa_users` / `wa_messages` /
`wa_twilio_logs` have RLS on with **no** policies → denied to all clients,
service-role only. `users` (self+admin), `requests` / `templates` /
`notifications` / `alerts` (owner+admin), `public_bio` (public where
`show_profile = true`, plus owner/admin), and `config` / `roles` /
`ci_events_users_junction` (public lookup/join) all matched the model.

Three drifts were found and fixed with `ALTER POLICY` (atomic — no unprotected
window):

1. **`ci_events` SELECT (`read_by_all`) was `USING (true)`** — 🔴 the hidden-
   events leak: any anonymous client could read every row, including
   `hide = true`. Replaced with the `hide = false OR own OR admin` policy above.
   This is the DB-level guarantee ticket #13 depended on.
2. **`user_roles` SELECT (`select_by_all`) was `USING (true)`** — 🟠 the whole
   `user_id → role` map (admin/creator identities) was world-readable. Scoped to
   `(SELECT auth.uid()) = user_id`; admin reads still covered by
   `admin_full_crudl`. Verified safe: the only app read is admin `getUsers()`.
3. **`storage.objects` write policies (`creator_can_insert/update/delete`) were
   `has_creator_role()` with no path scoping** — 🟠 any creator could
   overwrite/delete any other creator's uploads. Scoped each to
   `(storage.foldername(name))[1] = (SELECT auth.uid())::text` (uploads live at
   `${userId}/…`, see `ProfileForm.tsx`). Applied **without** an admin override,
   so admins cannot manage other users' files — add `OR has_admin_role()` to the
   three policies if a moderation UI ever needs it. `storage.objects` has no
   SELECT policy, so public read depends on the buckets being flagged public.

## Related security notes (out of scope for #13, tracked separately)

- Several **secrets are inlined into the public bundle** via `VITE_`-prefixed
  env vars (e.g. `VITE_CLOUDINARY_API_SECRET`, `VITE_UPLOADTHING_TOKEN`,
  `VITE_GOOGLE_MAPS_API_KEY`). Anything `VITE_`-prefixed is shipped to every
  visitor. These belong behind a server/edge function, not in the client. See
  the Google-key ticket (#14) and the platform-hardening ticket (#17).
