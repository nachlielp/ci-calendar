# Cutover checklist (spec #34)

What the maintainer does to replace the old client with the new one in
production, gathered from `docs/architecture.md` (Maintainer notes) and the
slice commits. Nothing here has been done yet: no migration is applied, no
env var set, nothing deployed. Production is www.ci-events.org on Vercel;
the Supabase project is `pjgwpivkvsuernmoeebk`.

The switch is one deploy of the merged branch. The new client keeps every
URL, the signed-in session (same storage key), the service worker's URL and
scope, and the data shapes, so visitors and shared links notice nothing but
speed. Order: **before merging → deploy → after deploy → later**.

## 1. Before merging

### Record the baseline

- [ ] Copy the old client's field data from Vercel Speed Insights into
      `docs/perf-baseline.md` (p75 LCP, FCP, INP, CLS, TTFB for `/` and
      `/event/[eventId]`, mobile and desktop, last 30 days). After the deploy
      it is gone for good.

### Vercel project settings (production and preview)

- [ ] **Node 22.** `package.json` `engines` is `22.x`, which overrides the
      dashboard setting; check the build log says Node 22.
- [ ] **Build** is `npm run build` (the default), output `dist`. It also
      runs the security headers check, which **fails the build** if the
      env's Supabase URL, Sentry DSN or PostHog host isn't allowed by the CSP
      in `vercel.json` (give previews the same values, or add the origin).
- [ ] **Env vars** the new client reads (names as in `.env.example`):

    | Variable                       | Needed for                                   | If missing                                  |
    | ------------------------------ | -------------------------------------------- | ------------------------------------------- |
    | `VITE_SUPABASE_URL`            | everything                                   | nothing loads                               |
    | `VITE_SUPABASE_ANON_KEY`       | everything                                   | nothing loads                               |
    | `VITE_SUPABASE_STORAGE_BUCKET` | bio photo uploads (`ci_bio_profiles`)        | photo uploads fail; the rest of a bio saves |
    | `VITE_GOOGLE_PLACES_API_KEY`   | address suggestions in the event forms       | the address field can't search              |
    | `VITE_SENTRY_DSN`              | crash reports, CSP violation reports         | no crash reports                            |
    | `VITE_PUBLIC_POSTHOG_KEY`      | analytics (production host only)             | no analytics                                |
    | `VITE_PUBLIC_POSTHOG_HOST`     | PostHog host (`https://us.i.posthog.com`)    | defaults to `https://app.posthog.com`       |
    | `VITE_LANGUAGES_TO_SHOW`       | optional, default `he,en,ru`                 | all three                                   |
    | `VITE_HIDE_EVENTS_FLAG`        | optional: new events start hidden            | off                                         |
    | `VITE_DISABLE_APP`             | optional: `true` builds the maintenance page | off                                         |
    | `SENTRY_AUTH_TOKEN`            | build only: source maps uploaded to Sentry   | no source maps (stack traces minified)      |

    Speed Insights needs no variable (enabled in the dashboard). Google
    Analytics' id is in `index.html`.

- [x] Checked 2026-10-31: every variable above is set (PostHog on
      production only, as intended). The old ones nothing reads any more are
      removed after the deploy (see "After the deploy"), so a rebuild of the
      old client meanwhile still finds them.

### Google Places key

- [ ] The key in `VITE_GOOGLE_PLACES_API_KEY` is valid (the local `.env`
      one is not: `InvalidKeyMapError`), has the **Maps JavaScript API** and
      **Places API** enabled, and is HTTP-referrer-restricted to the
      production domains (plus preview domains, to test there). It must not
      have the Translate API.

### Supabase: the `translate` Edge Function

- [ ] Deployed with its secret (`supabase/functions/translate/README.md`):
      `supabase secrets set GOOGLE_TRANSLATE_API_KEY=…` (a server-side key,
      Translation API only), then `supabase functions deploy translate`.
      Without it saves still work (titles fall back to Hebrew, never
      blocking), but English and Russian titles and details stay Hebrew.

### Supabase: auth URLs

- [ ] Authentication → URL Configuration: the **Site URL** is the
      production origin (Google sign-in returns there, as before), and the
      **Redirect URLs** include `https://www.ci-events.org/reset-password`
      (and `https://ci-events.org/reset-password` if that host serves the
      app), plus each preview origin's `/reset-password` to test resets
      there. The old client used the same URL, so it is likely there
      already.

### Supabase: auth emails in three languages (optional)

- [ ] Authentication → Emails: paste `supabase/templates/confirmation.html`
      into **Confirm signup** and `recovery.html` into **Reset password**,
      with the subjects in `supabase/templates/README.md`. Each email is in
      Hebrew, English and Russian together (Supabase picks no language).
      Independent of the deploy: the old client sends the same emails.

### Supabase: read-only SQL checks (SQL editor)

- [ ] **Bio photo bucket** accepts what the client sends (JPEG as
      `image/jpg`, at most ~30 KB):

    ```sql
    select allowed_mime_types, file_size_limit
    from storage.buckets where id = 'ci_bio_profiles';
    ```

    `null` means anything; otherwise `image/jpg` must be listed (or the
    client's `PHOTO_CONTENT_TYPE` changed to one that is).

- [ ] **Event write policies** let admins update and delete others' events
      (manage-all-events), and the junction's delete is allowed to the
      event's owner and admins:

    ```sql
    select tablename, policyname, cmd, qual, with_check from pg_policies
    where tablename in ('ci_events', 'ci_events_users_junction');
    ```

    UPDATE and DELETE on `ci_events` must allow `has_admin_role()` as well
    as the owner. Until they do, an admin's hide/cancel/delete of another
    creator's event says "not allowed, or changed meanwhile" and changes
    nothing (no harm, but the page doesn't work).

- [ ] **The junction's foreign key delete rule:**

    ```sql
    select confdeltype from pg_constraint
    where conname = 'ci_events_users_junction_ci_event_id_fkey';
    ```

    `c` (cascade): deleting an event removes its tags. `a`/`r`: the client
    deletes the tags first when the database refuses (one extra request).
    Either works.

- [ ] **The template foreign key delete rule** (decided: deleting a
      template keeps its events; the migration below makes it so):

    ```sql
    select confdeltype from pg_constraint
    where conname = 'ci-events_source_template_id_fkey';
    ```

    `c` (cascade) before the migration, `n` (set null) after. The new
    client keeps the events either way (it unlinks them first), but the
    **old** client, while it still runs, deletes them with a template:
    apply the migration before the deploy.

### Supabase: migrations (by hand, SQL editor, in this order)

Nothing applies `supabase/migrations/` automatically. Each file's header
says what it does and how to check it. All are safe for the old client
too, except the realtime one, which waits until after go-live.

- [ ] (`20260808000000_assign_user_role.sql` was applied with #16; check
      `select proname from pg_proc where proname = 'assign_user_role'`.)
- [ ] **`20261030000000_backfill_event_teacher_junction.sql`**, before the
      deploy: links older events (66 found on 2026-10-30) to their tagged
      teachers' bios. Without it those events show teachers as plain names.
      Idempotent; run its count check before and after (0 after).
- [ ] **`20261030120000_bio_photos_for_profiles.sql`**, any time: lets
      `profile` users (teachers without event rights) upload a bio photo.
      Until then they're told the photo can't be uploaded and the rest
      saves. Run the bucket check above first.
- [ ] **`20261031120000_template_delete_keeps_events.sql`**, before the
      deploy: deleting a template keeps the events made from it (the
      foreign key becomes `on delete set null`). Run its check before and
      after (`c`, then `n`).
- [ ] **`20261031000000_drop_realtime_publication_tables.sql`: not yet.**
      See "Later".

## 2. Deploy

- [ ] Merge the PR (CI green: typecheck, lint, format, tests, build,
      bundle limit, precache check). Let Vercel build a preview of it first
      and run the preview checks below there, then promote/merge to
      production.

## 3. After the deploy (preview first, then production)

- [ ] **CSP:** with the console open, go through `/`, an event, `/login`
      (and Google sign-in), the event forms with an address typed (so
      Google Places loads and suggests), `/bio` (pick and crop a photo, so
      the cropper loads, then save it, so it uploads and shows) and the
      admin pages: no `Content Security Policy` errors. Then
      watch Sentry for CSP issues over the first days (tagged `production`
      or `preview`). On a preview, check that Vercel's toolbar
      (`vercel.live`) loads; on production, that responses carry exactly one
      `Content-Security-Policy` header.
- [ ] **Installed app updates:** on a phone with the old app installed,
      open it (online): the new service worker takes over at once, the page
      reloads once onto the new client, and the old caches are gone
      (desktop Chrome: DevTools → Application → Cache Storage lists only
      `ci-calendar-precache-v2-…`; no `api-cache-*`, no
      `workbox-precache-v2-…`). Then open it offline: it shows the events
      last seen with the out-of-date cloud.
- [ ] **Still signed in:** a user signed in on the old client is still
      signed in, with their menu.
- [ ] **Google sign-in** works and returns to the site signed in; an email
      password reset link opens `/reset-password` and sets the password.
- [ ] **Address suggestions:** type an address in a new event form; the
      suggestions come from Google, and the console shows no Maps errors
      (never verified with a valid key).
- [ ] **A real photo upload:** as a creator (and, once its migration is
      applied, a `profile` user), crop and save a bio photo; it shows on
      `/bio` and on an event tagging them.
- [ ] **Translation:** switch to English; a newly saved event's title is in
      English, and an event's details translate.
- [ ] **Admin writes:** after the policy check, hide and un-hide another
      creator's event from `/manage-all-events`.
- [ ] **Analytics:** PostHog shows page views from production, and Speed
      Insights reports the new deployment (neither runs on previews or
      `isInternal` devices).
- [ ] **Bundle:** the deploy's `/` loads ~135 KB of gzip JS (DevTools →
      Network, JS, first load with cache disabled).

- [ ] **Remove the variables nothing reads any more** (Vercel, all
      environments), once the new client is live: `VITE_WHATSAPP_NUMBER`,
      `VITE_GOOGLE_ANALYTICS_ID`, `VITE_AUTH_KEY_NAME`, `VITE_BRANCH` (three
      entries), `DOMAIN_URL` (two), `VITE_SUPABASE_BIO_STORAGE_PUBLIC_URL`,
      `VITE_SUPABASE_BIO_STORAGE_PATH`, `VITE_UPLOADTHING_TOKEN`, every `VITE_FIREBASE_*` and
      `VITE_VAPID_PUBLIC_FIREBASE_KEY`. (`VITE_CLOUDINARY_*` and
      `VITE_DEV_DATABASE_AUTH_TOKEN` were removed on 2026-10-31: Cloudinary
      and the Turso database aren't used.) A rollback is unaffected: an old
      deployment has its values built in. **Leaked secrets:**
      `VITE_CLOUDINARY_API_SECRET` (2024 bio uploads) and
      `VITE_DEV_DATABASE_AUTH_TOKEN` (a 2024 Turso dev database) were read by
      client code once, so they shipped to visitors; revoke them at the
      provider if the accounts still exist.

## 4. Later

- [ ] **After about a week:** copy the new client's Speed Insights numbers
      next to the old ones in `docs/perf-baseline.md` (same metrics, pages
      and devices). Compare p75 LCP and FCP on mobile first.
- [ ] **Once a rollback is off the table** (a week or two of the new client
      in production): apply
      `20261031000000_drop_realtime_publication_tables.sql`. It takes
      `users`, `ci_events`, `requests`, `public_bio` and `templates` out of
      `supabase_realtime` (each only if there; safe to re-run). The new
      client never subscribes, and nothing else uses the publication (the
      notifications server is not in use). Run its check query before and
      after. Applied too early, a rolled-back old client still works, only
      without live updates; its header says how to add a table back.
- [ ] Optional cleanups: delete the unused root `sitemap.xml`; add the
      missing `/og-image.jpg` that `index.html` points at; the small
      differences listed at the end of `docs/parity.md`.

## Rollback

**How:** Vercel → Deployments → the last old-client production deployment →
"Promote" / "Instant Rollback". That serves the old `index.html`, assets,
`sw.js` and `vercel.json` (no CSP) again. The database needs nothing: the
migrations above are additive and the old client reads and writes the same
shapes the new one does (events, templates, bios, requests, photos, the
`users` row). Don't apply the realtime migration while a rollback is
possible (or re-add the tables; the old client then gets live updates back).

**What visitors' devices do:**

- The service worker URL is the same (`/sw.js`), so browsers pick up the
  old worker as an ordinary update: on the next navigation, or within an
  hour (or when the page goes to the background) in a tab already open.
  The old worker is a workbox `generateSW` with `skipWaiting` and
  `clientsClaim`, so it takes over at once, and its `cleanupOutdatedCaches`
  deletes the new client's precache (`ci-calendar-precache-v2-<scope>`
  holds `-precache-` and the scope, which is what it removes). It then
  caches again NetworkFirst, API responses included, as before.
- A tab still running the new client keeps working from its precache
  until the old worker takes over, then reloads onto the old client the
  next time the visitor leaves and comes back (never under them, never
  over unsaved form work). Should it ask the server for one of its lazy
  files after that, the file is gone, and it reloads once onto the old
  client instead.
- Device storage: the new client's persisted calendar
  (`ci-calendar:query-cache:v1`) and its form drafts (`personal:…`) stay in
  localStorage, unread by the old client (tens of KB). The old client
  starts from its own `events`/`bios` keys, which the new client deleted,
  so its first load fetches from the network. The session key and format
  are shared, so nobody is signed out; the language and the last filters
  carry over (same keys).
- **Rolling forward again** is the first cutover once more: the new worker
  finds the old caches, takes over at once, deletes them and reloads open
  pages, and the new client removes the old `events`/`bios` keys at boot.
