# Row-Level Security (RLS) & Storage Policies

The web client ships a Supabase **anon** key (it is inlined into the public
bundle — see [database-schema.md](./database-schema.md) for the tables and
[database-functions.md](./database-functions.md) for the helper functions).
Because the anon key is public, **RLS is the entire authorization layer**:
every access rule must be enforced by a database policy, never by the client.
Client-side filters (e.g. the `hide` filter in `getCIEvents`, the
`getSortedEvents` computed in the store) are defense in depth only — they make
the UI correct, they do **not** keep data safe.

> **Verification status.** The policy tables below are the **required** model,
> derived from the app's access patterns and the `SECURITY DEFINER` role
> helpers. They have **not** been diffed against the live project
> (`pjgwpivkvsuernmoeebk`) from this repo — the CLI is unlinked here and no
> service-role credential is checked in. Confirm the live policies with the
> queries in [Verifying against the live database](#verifying-against-the-live-database)
> and reconcile any drift with this document.

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
| `user_roles`               | owner (self), admin                                            | admin (via `insert_user_role`) | admin               | admin               |
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
convenience/perf layer; the guarantee must live in RLS. The `ci_events` SELECT
policy should be equivalent to:

```sql
CREATE POLICY "ci_events read: visible to all, hidden to owner/admin"
ON public.ci_events
FOR SELECT
USING (
  hide = false
  OR user_id = auth.uid()
  OR auth.uid() = ANY (owners)
  OR check_user_is_admin(auth.uid())
);
```

With this policy in place, an anonymous client physically cannot fetch a hidden
row, so the app-level filters become redundant safety nets rather than the only
line of defense.

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

## Related security notes (out of scope for #13, tracked separately)

- Several **secrets are inlined into the public bundle** via `VITE_`-prefixed
  env vars (e.g. `VITE_CLOUDINARY_API_SECRET`, `VITE_UPLOADTHING_TOKEN`,
  `VITE_GOOGLE_MAPS_API_KEY`). Anything `VITE_`-prefixed is shipped to every
  visitor. These belong behind a server/edge function, not in the client. See
  the Google-key ticket (#14) and the platform-hardening ticket (#17).
