# Client architecture (spec #34)

> **Monorepo (#48):** the web client lives in `apps/web`. Paths in this
> file (`src/…`, `worker/…`, `scripts/…`, `public/…`, `vite.config.ts`)
> are relative to `apps/web`, except `docs/` and `supabase/` at the root.
> Platform-free modules (`lib/`, most of `data/`, the query factories and
> saves under `features/`, a few in `app/`) are in the shared core, at the
> same path under `packages/core/src/`, imported as
> `@ci-calendar/core/<path>` (see "The core package" below). A path here
> means whichever of the two has it.

The client is a Vite + React 19 + TypeScript SPA on the same Supabase backend.
There is no realtime: freshness comes from the query cache's rules. This file
is the shared map for everyone working on the client. Keep it current when
you add a convention that other work should follow.

It replaced the old client (antd, MobX, supabase-js with realtime) at the
cutover (spec #34). "Legacy" below means that old client: its behaviour,
copy and data shapes, which this one kept on purpose. Its code is gone from
the tree (it lives in git history before the cutover commit);
`docs/parity.md` maps every user story to where it is built and tested, and
lists what was dropped. `docs/cutover.md` is the maintainer's checklist for
the switch.

## Layout

| Folder                        | Holds                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/app/`                    | Bootstrap, services (the seam), routes, shell layout, shared hooks, the cache engine (`cachedQueries.ts`) |
| `src/app/auth`                | Session at boot, profile row, sign-out cleanup, role guard, `sessionOf`/`useUserId`                       |
| `src/app/header`              | App header, menu (items keyed by role)                                                                    |
| `src/app/install`             | Install banner, `beforeinstallprompt` capture, iOS steps                                                  |
| `src/app/updates`             | Service worker registration, safe reloads, the reload guard                                               |
| `src/app/telemetry`           | Crash reports, analytics, Speed Insights; their lazy SDKs                                                 |
| `src/app/images`              | Photo cropper and canvas resize (`services.images`), lazy                                                 |
| `src/sw/`                     | The service worker (`sw.ts`) and its cache rules                                                          |
| `src/data/`                   | Backend clients, generated database types, Places and translation lookups                                 |
| `src/features/*`              | One folder per feature: its pages, components, queries, tests                                             |
| `src/features/calendar`       | `/`: the public window, list and month views, filters, event details, shared links                        |
| `src/features/auth`           | `/login`, `/signup` and the password reset pages                                                          |
| `src/features/requests`       | `/request`, `/bio/request`: the user's role requests; the `requests` rules and role words                 |
| `src/features/bio`            | The bio editor (`/bio`): profile form, photo, settings                                                    |
| `src/features/manage-events`  | `/manage-events`: the user's events; the management rows, actions and list                                |
| `src/features/events`         | Managed events, the rules event lists share, series, event writes, the event cache                        |
| `src/features/event-forms`    | The event and template forms, their shared parts, saves and drafts                                        |
| `src/features/admin`          | Shared admin parts: paged lists, refresh button, copy-phone, the one page chunk                           |
| `src/features/admin-users`    | `/manage-users`: users search, role changes (`useAssignRole`)                                             |
| `src/features/admin-requests` | `/manage-support`: open/closed requests, replies, approvals                                               |
| `src/features/admin-events`   | `/manage-all-events`: every creator's events, their actions                                               |
| `src/ui/`                     | Shared presentational primitives (dialog, buttons, icons, the query list shell)                           |
| `src/ui/form`                 | Form fields, chips, switch, alert and buttons (`fields.tsx`)                                              |
| `src/pages/`                  | Simple pages (about, legal, 404) that belong to no feature                                                |
| `src/test/`                   | `renderApp`, the web's fakes and browser conditions (the shared fake backend: the core's `src/testing/`)  |
| `src/assets/`                 | Images, logos and the subset font ported from legacy                                                      |
| `worker/`                     | The Cloudflare Worker (`/api/*`): the edge-cached public window (spec #37)                                |

## The core package

`packages/core` is `@ci-calendar/core`: the logic the web app, its Worker
and (later) the mobile app share. It holds no React, no DOM, no React
Native, so every platform can run it.

- **Same paths as the web.** The core's folders mirror the web's (`app/`,
  `data/`, `features/…`, `lib/`), so a module keeps its path when it moves
  and its relative imports still work. Import one module per path,
  `@ci-calendar/core/features/calendar/publicWindow`, with no barrel file;
  the package's `exports` map `./*` to `./src/*.ts`.
- **What's here:** the backend clients (`data/`: PostgREST, auth, Edge
  Functions, Storage, translation, the Places interface), the generated
  database types (`npm run gen:types` writes them here), the calendar's
  public window and feed, event lists and the cache rules
  (`features/events/eventCache.ts`), every query factory, and the saves:
  `createEvents`, `updateEvent`, `saveBio`, the template and request
  writes, the event hide/cancel/delete. The Worker imports the window's
  select from here too.
- **`CoreServices`** (`app/services.ts`) is the platform-neutral half of
  the seam: data, the public feed, auth, functions, files, Places, device
  storage, the clock, the build version and `CoreTelemetry`. The web's
  `AppServices` extends it with images, the session storage, reload,
  updates and its router-aware `Telemetry`. Core code takes
  `CoreServices`, or a `Pick` of what it uses.
- **Saves are plain functions; hooks stay in the apps.** A save takes
  `services` (and the `QueryClient` when it reads or updates the cache)
  and returns what was stored. The app wraps it in `useMutation` with its
  `onSuccess` (usually a core cache function, e.g. `cacheSavedBio`) and
  `onError` (its telemetry source). Query factories return options that
  the app's `useQuery` takes as they are; build them with the core's
  `queryOptions` / `infiniteQueryOptions` (`app/queryOptions.ts`:
  query-core has none, so these are react-query's identity functions,
  typed from query-core).
- **Browser inputs are options.** `createAuth` takes the URL's fragment,
  how to clear it and where storage events arrive; it defaults to none,
  and the web passes `browserAuthOptions()` (`data/browserAuth.ts`).
- **Source, not a build.** The core ships TypeScript; Vite, Vitest and
  Wrangler compile it like the app's own files. `"sideEffects": false`, so
  a page carries only what it imports (`check:bundle` holds `/` to its
  limit).
- **The boundary is checked, not reviewed.** `tsconfig.json` has
  `lib: ["ES2023"]` and no `types`: a `window`, `document` or `process`
  fails to typecheck. The web-platform globals every platform has
  (timers, `URL`, `URLSearchParams`, `fetch` with `Headers` and
  `AbortController`, a minimal `Blob`) are declared in
  `src/platform.d.ts`, each a subset of the real one, so code that checks
  here checks in every app (each compiles the core with its own types).
  Add a member only if the browser, Workers, React Native and Node all
  have it. ESLint bans
  React, React Native, Expo, react-query (use `@tanstack/query-core`) and
  importing an app. The source may not import Vitest either (the mobile
  app will run it under Jest); tests may.
- **Tests** run in Node (`vitest.config.ts`, no jsdom) and are checked
  with Node's types (`tsconfig.test.json`). `npm test` at the root runs
  them with the web's.
- **What moves here:** a module with no React and no browser API. A module
  that mixes pure logic with a hook splits: the logic comes here, the
  `useX` hook stays in the app. Move a module with its test, then rewrite
  the app's imports to the package path.

## Rules

- **One seam.** Everything that talks to the backend gets it from
  `AppServices` (`useServices()` in components; query factories and saves
  in the core take its `CoreServices` half): `services.data` (PostgREST), `services.auth` (sign-in
  state and actions) and `services.functions` (Edge Functions,
  `data/functions.ts`: `invoke(name, { body })`, never throws; functions-js
  is imported on the first call, so `/` doesn't carry it; each call
  carries the token at hand, as data requests do). Browser capabilities
  that load third-party code are services too, so tests count them:
  `services.places` (Google Places, `data/places.ts`, below) and
  `services.images` (the photo cropper and canvas, `app/images`, under
  Bio editor). `services.files` is Supabase Storage (`data/files.ts`,
  storage-js imported on the first upload; `services.storage` is device
  storage). Nothing
  imports a module-level client. Tests pass the fake at the same point;
  nothing else is mocked.
- **No realtime.** Never import `@supabase/supabase-js` or
  `@supabase/realtime-js` (lint fails it). Use the sub-clients
  (`postgrest-js`, `auth-js`, `storage-js`, `functions-js`). The test setup
  fails any test that tries to open a WebSocket, even if the code catches
  the error (`test/realtimeGuard.ts`).
- **Server state lives in TanStack Query.** Each kind of data has one query
  options factory with an explicit freshness policy. Writes update the
  matching cached queries from the server response, not by refetching
  lists, through one engine (`app/cachedQueries.ts`):
  `updateCachedQueries(queryClient, keyPrefix, update)` sets every cached
  query under the prefix to `update(data, key)` (the same object where
  nothing changed, no query created, fetch times kept) and fetches anew one
  whose fetch is in flight (sent before the write; a paginated one from
  its first page); when a write's answer can't say where things stand,
  `refetchCachedQueries` reads them again (plain queries invalidated;
  paginated ones on screen from their first page, the rest dropped);
  `refreshFirstPage` refetches one infinite query from page one. A write
  that reaches past one known query (every list of a kind, every filter
  and page) uses it rather than walking the cache itself; a single
  personal query just `setQueryData`s it (Personal pages). Local UI state
  stays in components; filters stay in the URL (`f` param).
- **Lazy by default.** Only the shell and the public calendar route are
  eager. Every other route uses route-level `lazy`. Heavy third-party code
  (cropper, Places, analytics, tracing, replay) is imported dynamically. CI
  fails if `/`'s initial JS goes over the gzip limit in `package.json`.
- **No component libraries.** No antd, MUI, emotion, MobX, dayjs, lodash or
  uuid. Use native elements (`<dialog>`, `<input type="date|time">`,
  `<details>`), small primitives in `src/ui/`, `Intl` and the helpers in
  `lib/` (the core). `crypto.randomUUID()` for ids.
- **Same look.** Each component's styles are a `.scss` file next to it,
  ported from the old client's SCSS without its antd overrides. Same copy,
  same three languages.
- **Dates.** Calendar days are `YYYY-MM-DD` strings in Asia/Jerusalem
  (`lib/jerusalemDate.ts`). Read "now" from `services.now()`, never
  `new Date()` in features, so tests control the clock. Don't put today's
  date in a query key: a query fetched yesterday (or restored from storage)
  must stay the same query. Compute the date range inside `queryFn` and drop
  passed days in `select` (see `publicWindow.ts`), with the day from
  `useToday()` (`app/useToday.ts`: re-read when the page comes back and
  every minute) passed to the options factory and in their `useMemo` deps,
  so `select` runs again after midnight without a request. A page reads
  the day once and passes it down (the month view gets the calendar
  page's), never computing it per render.
- **One build version.** `BUILD_VERSION` (`src/app/buildVersion.ts`) is
  read from `<meta name="build-version">`, which `buildVersionMeta` in
  `vite.config.ts` writes into `index.html`: the commit SHA for builds
  (`VERCEL_GIT_COMMIT_SHA`, `GITHUB_SHA` or `git rev-parse`),
  `dev-<start time>` per dev server start. It is kept out of the JS, so a
  deploy changes only the chunks whose code changed (and the service worker
  downloads only those). Tests have no `index.html`; `renderApp` passes
  `"test"` or the `buildVersion` given. It reaches the app as
  `services.buildVersion`. Everything that must react to a deploy keys off
  it: the persisted query cache and the footer; and since every deploy
  changes `index.html`, the service worker's precache list changes, which is
  how browsers notice the deploy and the app reloads onto it (below).
- **Persisted cache.** `src/app/persistedCache.ts` saves the query kinds in
  its `PERSISTED_SHAPES` allow-list to `services.storage` after each
  successful fetch or `setQueryData`, and restores them synchronously at boot
  (before the first render). Persisted kinds get `gcTime: Infinity`.
    - **Compatibility is the data shape, not the build.** Each kind declares a
      shape string (e.g. `PUBLIC_WINDOW_SHAPE`, derived from its columns plus a
      number). Stored data whose shape differs is never restored, so change the
      shape whenever the kind's data changes (a new column does it
      automatically; bump the number for mapping-only changes). Data from
      another build with a matching shape is restored but marked stale
      (`updatedAt: 0`): after a deploy it is shown, and revalidated, because it
      may be all an offline visitor has. Rename `STORAGE_KEY` if the stored
      envelope itself changes.
    - **Public data only.** Never add personal or admin queries to the list.
      Persisted public queries run with the signed-in user's token, so they
      must filter public-ness explicitly in the query (`hide = false` for
      events, `show_profile = true` for bios), never rely on RLS alone, or a
      user's private rows would be persisted (slices 3 and 9).
    - Use `services.storage` for device storage, never `localStorage`
      directly. The legacy `events`/`bios` keys, and legacy's bio editor
      keys (`upload-image-temp`, a picked photo as base64, and the
      `profile-form` draft), are removed at boot and never read.
- **Auth and roles.** `services.auth` (`Auth`, `data/auth.ts`) is the
  only way to Supabase auth.
    - **The session at boot** is read from device storage synchronously
      (`auth.session()`: no network, no auth-js) under legacy supabase-js's
      default key, `sb-<project ref>-auth-token`, in its format, so users
      stay signed in across the cutover. auth-js (`data/authClient.ts`,
      ~24 KB gzip, its own chunk; configured as legacy's client: persisted,
      auto-refresh, implicit flow) loads only when needed: an auth page
      mounts (`auth.start()`), the URL carries an auth redirect's tokens, a
      token needs a refresh, an auth action runs, or, for a signed-in user,
      after load and idle (to keep the token fresh). Never import auth-js
      anywhere else. Another tab's sign-in, sign-out or refresh reaches this
      one through the `storage` event on the session key, with or without
      auth-js loaded.
    - **Auth redirects** (implicit flow, as legacy: reset links and Google
      sign-in return `#access_token=…&refresh_token=…`, failures
      `#error=…&error_code=otp_expired&…`) are read by `createAuth` at boot,
      before the router or telemetry exist, and the fragment is removed at
      once with `history.replaceState`, so tokens never stay in the URL or
      the history. auth-js's own URL detection is off
      (`detectSessionInUrl: false`); the tokens go to its `setSession`
      (`adoptSession`: checked with Supabase's `/user`, then stored). Until
      then the session is `undefined` (unknown); tokens that are no good
      leave the stored session in place. Errors are kept as
      `auth.redirectError()` (the reset page says the link expired; nothing
      is reported). `auth.bootUserId` is the stored session's user even
      while a redirect is read, so an account arriving over another one is
      handled as the first one signing out.
    - **Allowed at boot**: the public window request, and for a stored
      session only the profile row (`profileQuery`, `app/auth/profile.ts`:
      `PROFILE_COLUMNS` = role, name, provider, `is_internal`), in parallel,
      plus telemetry `identify` (`bootSession`, `app/auth/session.ts`). No
      `getUser()`, nothing else personal; pages load their own data. The
      profile row sets `telemetry.setInternal`, and is created by the client
      (legacy `createDbUserFromUser`, a plain `user`) when an account has
      none: the database has no trigger, and sign-up signs in at once
      (`mailer_autoconfirm`). If another tab inserted it first, the insert
      fails as a duplicate (`23505`) and the row is read again; this
      assumes `users.id` is unique, which `docs/database-schema.md` doesn't
      show but the foreign keys referencing `users(id)` (`ci_events`,
      `public_bio`, …, per `database.types.ts`) require. Once per boot and
      user, after the profile loads and while online, `recordSignIn`
      updates the row's `version` (`BUILD_VERSION`) and `last_signin`
      (legacy's `updateUserAppVersion`, how the maintainer sees who is on
      an old build), fire and forget.
    - **Tokens**: the data client's fetch puts `auth.accessToken()` on each
      request as it is sent: the session's token while valid (refreshed ones
      included), else the anon key. It never waits. So public queries go
      with whatever token is at hand (filter public-ness explicitly, above);
      personal queries wait for a good token first (`sessionOf`, under
      Personal pages: `auth.ready()` answers at once for a token valid 90 s
      more, else after auth-js refreshes it).
    - **The viewer** (`useViewer()`): `anonymous` at first paint when no
      session is stored; `unknown` while the profile loads or a redirect is
      read; `unavailable` when signed in but the profile failed or waits
      for a connection (the menu offers sign-out, guards say so with a
      retry and the way home); then the role (`users.user_type`), the
      name (shown in the header) and `signsInWithEmail` (`provider ===
"email"`). The header's login link (legacy: account icon + "התחבר/י")
      shows only to `anonymous` viewers, online, on routes without
      `homeButton` (text and auth pages get home instead).
    - **Guarded routes** (legacy `PrivateRoutes`): wrap a new page's
      routes in `requireRole(roles, [...])` (`app/auth/guard.ts`, legacy's
      groups `SIGNED_IN_ROLES`, `PROFILE_ROLES`, `CREATOR_ROLES`,
      `ADMIN_ROLES`). While the viewer is unknown it shows loading,
      unavailable an error with a retry; signed out → `/login`, wrong role → `/` (both replacing the entry; legacy
      kept no return path and login always lands on `/`). RLS stays the
      real gate; the guard is UX. The guard is a lazy route
      (`RequireRole`'s own chunk, fetched in parallel with the page it
      guards), so it adds nothing to `/`.
    - **Sign-out**: `viewer.signOut()` (the menu) goes to `/`, then
      `auth.signOut()`: Supabase's `global` scope as legacy, falling back to
      `local`; the local session and auth-js's keys always go, offline too.
      Whenever the user ends or changes (here, another tab, a revoked
      refresh, an auth redirect over a stored session), `forgetUser` runs: every query whose kind is not in
      `PUBLIC_QUERY_KINDS` leaves the cache (so a new kind is personal by
      default; list a public kind there), every device storage key named
      with `personalKey(name)` (`app/auth/personalStorage.ts`: the
      `personal:` prefix, swept by prefix with legacy's draft prefixes, so
      the app layer needn't know the features; **name any personal key you
      store with it, e.g. a form draft**) is removed,
      sessionStorage is cleared (as legacy), and `telemetry.reset()`. The
      persisted cache holds public kinds only.
    - **Auth pages** (`features/auth`, lazy): `/login` (Google, email and
      password; success → `/`), `/signup` (→ `/`), `/reset-password-request`
      (emails a link to `<origin>/reset-password`) and `/reset-password`
      (open to all: the link's `#access_token=…&type=recovery` arrives in
      the URL, read and cleared at boot as above; the service worker serves
      the shell for it, and telemetry scrubs any URL anyway). Supabase's auth settings must
      list that URL (and each preview origin to test there) as a redirect
      URL; Google sign-in returns to the Site URL, as legacy.
- **Service worker.** `src/sw/sw.ts`, built to `/sw.js` by
  vite-plugin-pwa (`injectManifest`, production builds only; never in dev or
  tests), typechecked by its own `src/sw/tsconfig.json` (worker globals, no
  DOM; the app's tsconfig excludes it). Its decisions are pure functions in
  `src/sw/swRules.ts`, tested directly. It may cache only the build output
  listed in `PRECACHE_GLOBS`: `index.html`, the hashed JS/CSS/font/images
  under `assets/` (but not the telemetry SDKs in `assets/telemetry/` or
  the HEIC converter in `assets/heic/`, `PRECACHE_IGNORES`), the loader logo, the manifest and its icons, in one
  precache (`ci-calendar-precache-v2-<scope>`) revisioned per file by
  workbox, so a deploy downloads only what changed. It has **no runtime
  caching**: Supabase API, auth, functions and storage requests (and
  anything else not precached) are never intercepted; offline data comes
  from the persisted query cache. Navigations get the cached `index.html`,
  except paths whose last segment names a file (`/sitemap.xml`; the query
  string doesn't count). Never add a runtime route, strategy or
  `respondWith`; `npm run check:sw` (CI, after the build) fails if the
  precache misses the shell or a JS/CSS file or lists anything not
  same-origin, if `sw.ts` imports a workbox module beyond core, precaching
  and routing, registers any route but the navigation route or writes to
  Cache Storage, or if `sw.js` mentions Supabase. On activation the worker
  deletes every cache but its own precache (legacy's `api-cache-*`
  NetworkFirst caches, workbox's old precache). It keeps legacy's URL and
  scope (`/sw.js`, `/`) so browsers swap it in as legacy's update; never
  rename it. Finding legacy caches at install, it takes over at once
  (legacy pages can't hand over) and, once active, reloads every open page
  (their legacy chunks are gone); otherwise a new version waits for the
  page. `vercel.json` answers a missing `/assets/…` with a 404 (no rewrite
  to `index.html`, so a stale chunk fails visibly) and serves `/assets/*`
  as `immutable` for a year. The manifest stays `public/site.webmanifest`
  (the plugin emits none). The footer's reset (`resetDevice`) still
  unregisters it and clears Cache Storage; the next load registers it again.
- **Updates and the reload guard.** `services.updates` (`AppUpdates`,
  `app/updates/updates.ts`) is the service worker seam: production registers
  it after load and idle with its code imported then
  (`app/updates/serviceWorker.ts`, ~0.5 KB, off `/`'s initial JS); dev and
  tests get `NO_UPDATES` unless a test passes `createFakeUpdates()`. It
  checks for a new version when the page goes to the background (at most
  every 10 minutes) and hourly; the browser also checks on each load.
  `useSafeUpdates` (in `AppRoot`) hands the page over to a waiting version
  when the page goes to the background and reloads onto it, through
  `services.reload`, the moment it is visible again (if the version arrived
  while away, both happen on return); never while it stays visible. Legacy
  had no update prompt, so there is none. **Anything holding unsaved work
  must block the reload** with `useBlockReload(isDirty)`
  (`app/updates/reloadGuard.ts`). Every `useForm` form already does (under
  Forms), so call it only for unsaved work outside one. While any block is
  held there is no handover or reload, and the update waits for a later
  leave and return. Explicit reloads (the footer's reset, the button below)
  ignore the guard.
- **Stale chunks.** A tab still on an old version (another tab handed over,
  or no service worker) can ask for a lazy file the deploy removed.
  `RouteError` (`app/updates/staleChunks.ts`) reloads once onto the
  current version for such errors (`isStaleChunkError`): a route's `lazy`
  page, or a `React.lazy` part of one, whose file is gone. Not on Vite's
  global `vite:preloadError`: that fires for every failed dynamic import,
  telemetry blocked by an ad blocker included, and must never reload the
  page under the visitor. It reloads unless the reload
  guard is blocked, the device is offline, or it already did so within a
  minute (`staleChunkReloadAt` in `services.session`, sessionStorage; no
  reload loops). Otherwise `RouteError` says a new version is available,
  with a reload button, and the error is reported (`stale-chunk`) once; a
  failure the reload recovers is expected after a deploy and isn't.
- **Freshness.** Public window: stale after 5 minutes (`STALE_MS`,
  `lib/freshness.ts`, the one staleness every query kind uses), refetched on
  `visibilitychange` to visible when stale (TanStack's `focusManager`),
  always refetched on reconnect (`refetchOnReconnect: "always"`), and always
  revalidated at a cold start. Data on screen stays on screen when a refresh
  fails; `StaleDataNotice` (the header's offline cloud, on every page,
  read through `useStaleReason`) says it may be out of date (offline, or refresh
  failed). With no data and no connection, the page says it can't load and
  the paused request goes out once back online. `useIsOnline()` reads
  TanStack's `onlineManager`, which boot seeds from `navigator.onLine`.
- **Public events.** Every public read of `ci_events` starts from
  `selectPublicEvents` (`features/calendar/publicEvent.ts`): the columns the
  list and details need, the tagged teachers' public bios embedded through
  `ci_events_users_junction`, and the explicit public filters (`hide = false`,
  bios `show_profile = true`). Rows map to `PublicEvent` in one place
  (`toPublicEvent`). The embed relies on junction rows; legacy events missing
  them are backfilled by
  `supabase/migrations/20261030000000_backfill_event_teacher_junction.sql`
  (applied by hand).
  A plain PostgREST select, not the database view or RPC the spec
  suggested (maintainer: "whatever has better perf"; decided 2026-10-31):
  a view runs the same SQL in the same one round trip (PostgREST inlines
  it), so it is no faster, and it would need a production migration, its
  own RLS care (`security_invoker`) and regenerated types. The columns are
  already trimmed and RLS still applies. The speed-up is caching the
  window at the edge (spec #37, "Cloudflare hosting and the edge cache"
  below), not the query's shape. The window's select itself
  (`selectPublicWindow`, `features/calendar/publicWindowSelect.ts`) is
  shared by the client and the Worker, so both send exactly the same one.
- **Shared links.** `/event/:eventId` and the legacy `/:eventId` open the
  event over the calendar (`useLinkedEvent`): from the cached window when it
  has it, else with one request for that event alone, in parallel with the
  window. The dialog opens at once, with loading, offline and failed (retry)
  states; only a definite "no visible event" renders the 404 page. A link
  that can't name an event (`isEventLink`: neither a UUID nor a three-letter
  or digit `short_id`, as the `set_short_id` trigger makes them) is a 404 at
  once, with no request and no details code, e.g. `/abuot` or `/signin`.
  Static top-level routes (`/about`, `/login`, …) outrank
  `/:eventId` in React Router's ranking, so new pages just add them; they
  never reach the event lookup. Opened from a shared link (not from the
  list), the event's card is scrolled to the middle of the list behind the
  dialog once listed (`EventList`'s `revealId`, legacy's
  `useScroolToEventById`), so closing it shows the event in context.
- **Filters and views.** Filters live in the URL as legacy encoded them,
  one `f` param per value (`/?f=jam&f=center`); `useEventFilters` reads and
  writes them (in place, never a history entry), and `filters.ts` holds the
  matching rule (any selected type, and any selected district). Every
  legacy value is read from URLs (`warmup` too), though the UI offers only
  legacy's set. As in legacy, each tap also records that one value under
  the `eventType`/`district` keys in `services.storage` (shared-link values
  are never saved untapped), and only `/` with no query at all restores
  them; never clear those keys. List/calendar view and the picked day are
  page state, not URL, as in legacy: they survive opening an event (the page
  stays mounted) but not a reload. Links inside the calendar keep
  `location.search`, so filters survive opening and closing an event.
- **Event options.** Event types, multi-day types and districts (values,
  `isEventType`/`isDistrict`) are in `lib/eventOptions.ts`; reuse them
  for forms and weekly-schedule filters. Their words are in the
  `EventLocale` (`optionLabel`). Rows map legacy Hebrew multi-day types
  (`ריטריט`) to their values in `toPublicEvent`.
- **Rendering cost.** Derive display data (sort keys, labels, time ranges)
  once per data change in a pure function, memoised on the query data (see
  `toEventCards`); keep query options stable (`useMemo`) so `select` doesn't
  rerun on every render. Derived lists are memoised on values that change
  only with the data or the query (`filters` keeps its identity until `f`
  values change, not the whole query). Day lookups use `cardsByDay`, built
  once per filtered list and bounded at the window's last day. Long lists
  put `content-visibility: auto` with a `contain-intrinsic-size` on their
  items.
- **Dialogs and icons.** Drawers and modals use `Dialog` (`src/ui/Dialog.tsx`;
  reshape one through its `className`, as `MenuDrawer.scss` does):
  a native `<dialog>` portalled to `body`, a drawer under 500px and a modal
  above (CSS only). Mount it to open it. The close button, Escape and a
  backdrop click (pointer down and up on the backdrop) close the native
  dialog, and its `close` event calls `onClose`; the owner then unmounts it.
  Unmounting it directly (e.g. on Back) is fine. Focus returns to the element
  that had it, and the page behind doesn't scroll while it is open. Its body
  is the scroller and fills the box. Icons are inline SVG components, one
  module per icon in `src/ui/icons/` (Material Symbols paths, as the old client's
  SVG files had them), so an icon used only by a lazy page stays out
  of `/`'s initial JS; add a new one as its own file the same way, never
  load SVG files at runtime. `ToggleButtons`
  (`src/ui`) is legacy's `MenuButtons` (joined icon buttons, one pressed;
  an option without an `Icon` shows its label as text).
  `.visually-hidden` (`index.css`) hides text from sight, not from screen
  readers. Event action confirms (hide, delete, cancel, the series edit)
  use `ActionDialog`, `EventLine` and `SeriesChoice`
  (`features/events/ActionDialog.tsx`); a stylesheet of a page using them
  `@use`s `features/events/_action-dialog.scss`, so their shared chunk
  has no CSS file of its own (each file name costs `/`'s preload lists).
  The same goes for every component two lazy pages share: `EventRow`
  (`@include event-rows` from `manage-events/_event-rows.scss` inside the
  page's class), `EventActions` (`manage-events/_event-actions.scss`) and
  `TagPicker` (`ui/form/_tag-picker.scss`); the component imports no
  stylesheet.
- **Personal pages.** A signed-in page's own data is one query per kind
  (e.g. `myRequestsQuery`, `features/requests/myRequests.ts`) keyed
  `[kind, userId, …]` with the id from `useUserId()`
  (`app/auth/personal.ts`), `enabled: !!userId`, and
  `...PERSONAL_FRESHNESS` (fetched on every mount of its page, and when
  the app comes back after 5 minutes). Its `queryFn` and every save start
  with `await sessionOf(services, userId)` (waits for a good token; fails
  if the user changed), filter by the user explicitly
  (`.eq("user_id", userId)`: admins' RLS lets them read everyone's rows),
  and select only the columns the page shows (a `*_COLUMNS` constant). It
  is personal by default (not in `PUBLIC_QUERY_KINDS`), so sign-out
  forgets it, and never persisted; writes put the stored row in it only
  if it is cached (`setQueryData(key, (old) => old && …)`), never
  re-creating it. The page shows loading, then the data, or an error with
  a retry.
    - **Writes that must not race an admin** go only to the row still in
      the state the user saw: the user's own open request is updated with
      `.eq("id", id).eq("user_id", userId)` and `whereOpen` and
      `maybeSingle()`; no row back means an admin closed it meanwhile, so
      the list is refetched and the page says so. The client never sends
      columns the user doesn't own (`status`, admins' `responses`), except
      legacy's cancellation note, appended to responses read fresh under
      the same condition. RLS lets an owner write every column of their
      row, so column-level protection (and an atomic append) would need an
      RPC: a future migration, not written yet.
    - **The `requests` table's rules** live in
      `features/requests/requestRows.ts`, which imports no feature, so the
      user's page and the admins' share them: `REQUEST_COLUMNS`,
      `responsesOf`, `isClosed` (`closed = true` or `status = 'closed'`;
      as filters `whereOpen`/`whereClosed`, logic trees `CLOSED_TREE` and
      `OPEN_STATUS_TREE`), `conditionalUpdate` and `appendToResponses`
      (read the responses under a condition, then write under it; `null`
      when either finds no row).
    - **Role and request words** are one shared vocabulary, `REQUEST_WORDS`
      (`features/requests/requestWords.ts`, which imports no feature):
      `role` (a role in a sentence or a details line), `roleButton` (the
      short names on legacy's admin role buttons), request `type`s and the
      `open`/`closed` statuses. The requests page, the bio page and the
      admin pages all read them there; never add a map of role names
      elsewhere.
- **Event writes and the cache.** Every event write (my events, the
  create/edit forms, the admin pages):
    - **Reads and responses** select `MANAGED_EVENT_COLUMNS` (built from
      the public `EVENT_COLUMNS` and `EVENT_BIO_COLUMNS`) and map rows with
      `toManagedEvent` (`features/events/managedEvent.ts`): a `PublicEvent`
      plus `hidden`, `ownerId` (`user_id`, ownership as RLS has it),
      `multiDay` (`is_multi_day`; `editPath` picks the edit route) and
      `recurringRefKey`. Bios carry their own `show_profile`/`user_type`
      and non-public ones are dropped in the mapping as the public query's
      filters would (a null `user_type` too), not by embedded filters, so
      writes can return the same columns.
    - **After every event write**, call
      `applyEventChanges(queryClient, services.now(), { saved })` (the
      returned rows, mapped) or `{ deleted: ids }`
      (`features/events/eventCache.ts`). It updates every cached query of
      every event list from the response, with no refetch, never creates a
      query, leaves a query's data object alone when the change doesn't
      concern it, and keeps fetch times (a write doesn't delay a
      revalidation). A query whose fetch is in flight is fetched anew right
      after (a paginated one from its first page only), so an answer sent
      before the write can't bring a deleted or hidden event back, nor
      persist it: `updateCachedQueries` (Server state, above) does it all. Built in: the public window (visible events dated from
      today within the range it was fetched for, `PublicWindow.from/to`;
      only the public part, `toPublicOnly`, since it is persisted) and
      shared-link lookups (the event, or `null` once hidden or deleted).
    - **Every other list of events registers itself** with
      `registerEventList({ kind, apply })` in the module that defines its
      query (so it is registered before any of its queries can be cached),
      `apply(data, change, queryKey)` returning the updated data or the
      same object (`event-to-edit` in `event-forms/eventToEdit.ts` and
      `series` in `events/series.ts` too). `mergeIntoList` (one list) and
      `mergeIntoPages` (keyset-paginated, `EventPage`; a saved event goes on
      the page whose cursor range holds it, under Pagination) do the work
      given which saved events belong and the list's order; see the
      `my-events` list in `features/manage-events/myEvents.ts`.
      `features/events` never imports a feature's list. Admin's
      manage-all-events registers its own (`admin-events`,
      `admin-events/adminEvents.ts`).
    - **Rules every event list shares** live in `events/eventLists.ts`:
      the orders (`compareUpcoming`, `comparePast`), the keyset cursor
      (`EventCursor`, `eventCursorOf`, `eventsAfter(cursor, direction)`),
      `laterInSeries` and the user's own lists' keys
      (`myUpcomingEventsKey`, which the edit forms read too). A feature
      needing one imports it from there, never from another feature.
    - **Hide, cancel and delete** are `useSetHidden`, `useSetCancelled`
      and `useDeleteEvents` (`features/events/eventWrites.ts`): one
      conditional write each. Hide and cancel only touch events still in
      the state the user saw (`.eq("hide", !hide)`, `cancelled IS NOT
TRUE` / `= true`), so a change made elsewhere isn't flipped back. By
      default only the user's own (`.eq("user_id", userId)`; RLS lets
      admins write anyone's, so the client says which it means); admin
      pages pass `{ ownOnly: false }`, which scopes the write to the
      events' loaded owner (`.eq("user_id", event.ownerId)`, as the edit
      form does). What comes back is applied; if fewer events come back
      than were asked for (changed or deleted elsewhere, or refused by
      RLS), `refreshEventQueries` reads every event list again (the window
      and links too; `refetchCachedQueries`: plain queries on screen
      refetch, the rest when shown; paginated ones on screen from their
      first page, the rest dropped) and the write fails with `EventsChangedError`, which the dialog says ("not
      allowed, or changed meanwhile"): never a silent success. A delete
      the junction's foreign key refuses (`23503`) removes the events'
      `ci_events_users_junction` rows and is sent once more, so a tagged
      event can be deleted whether the key cascades or not (legacy deleted
      the event alone; see Maintainer notes).
    - **The rows and actions** of management lists are `EventRow`
      (`manage-events/EventRow.tsx`: title, days, optional creator, hidden
      and cancelled; open, the details and its children) and
      `EventActions` (edit, delete, cancel/restore, hide/show; `later`, the
      series' later events offered by delete and hide, `LaterEvents`:
      ready, loading or failed with a retry, OK held until ready;
      `ownOnly`; `editState`, the edit link's router state), listed by
      `ManagedEventList` (`manage-events/ManagedEventList.tsx`: one open
      row at a time) with `useFocusAfterDelete` (focus to the page's
      heading once a deleted row is gone). My events and the admins' list
      both use them. Its shell is `QueryList` (`ui/QueryList.tsx`: the
      items, loading, empty, failed with a retry, dimmed while an earlier
      filter's items stand in, "load more"; each page passes its own class
      names), which the admin users and requests lists use too: a new list
      read by a query uses it.
- **Pagination.** Long personal or admin lists load a page at a time with
  `infiniteQueryOptions` and keyset pagination, never offsets (a delete
  would shift them), built from `lib/keyset.ts`: order by a unique key (a
  column, then `id`, both the same way), ask for one row more than the
  page (`limit(PAGE + 1)`; `keysetPage` cuts the page and makes the next
  cursor from its last row), and filter a later page with PostgREST's
  logic tree (`rowsAfter`, values `quoted`:
  `start_date.lt."D",and(start_date.eq."D",id.lt."I")`; each list's own is
  a line over it: `eventsAfter` in `events/eventLists.ts`, `afterNewest`
  in `admin/adminLists.ts`). A page is `{ <items>, next: cursor | null }`
  (`EventPage` for events); `getNextPageParam` returns `next`. A row a
  write moves into a loaded list goes on the page whose range holds it,
  up to and including its `next` cursor (`pageHolding`; never by the last
  row shown, which rows moved away since leave behind the cursor), the
  last page taking the rest; one past every loaded page is left for its
  own page to bring. TanStack refetches an infinite query page by page, so
  nothing may refetch one whole. Not focus, reconnect or remounts: the
  past events query is fetched when first asked for in a page visit, kept
  (writes update it) with `staleTime: Infinity` and no refetch triggers,
  and removed when the page unmounts, so the next visit starts from page
  one (see `myEvents.ts`; admin lists under Admin pages). Not writes
  either: the engine (`app/cachedQueries.ts`) redoes a paginated fetch in
  flight, or reads a list again, from its first page only
  (`refreshFirstPage`, which drops the later pages first).
- **Forms.** Every form is built on `useForm` (`app/useForm.ts`, over
  the pure reducer in `lib/form.ts`; both tested directly); see
  `features/requests/RequestForm.tsx`:
    - **State**: `useForm({ saved, validate, unordered })`. `saved` is the
      server's values mapped to form values, memoised on the query data
      (a constant of empty values for a new record). It gives controlled
      `values`, `set(field, value)`, `update(field, change, path)` (a
      change from the current value, e.g. one item of a nested list),
      `touch(path)` (on blur), `changes` (the fields that differ from
      `saved`), `isDirty`, `errors`, `submitting`, `handleSubmit`,
      `restore(draft)` and `setErrors`. Values compare deeply, lists in
      order; list fields named in `unordered` compare as sets (chosen
      options).
    - **Saved values change** (a save's response or a refetch put in the
      cache): fields without unsaved edits take the new values, and so do
      fields still as the last save sent them (the server's normalised
      version shows); edits typed since, including during the save, stay.
      There is no reset: the cache update is the only way saved values
      reach the form.
    - **Unsaved work**: `useForm` calls `useBlockReload(isDirty)` itself, so
      no form is reloaded away under the visitor. `restore(draft)` loads a
      draft kept on the device as unsaved changes; such a draft's key is a
      `personalKey` (`useFormDraft`, `app/useFormDraft.ts`, described under
      Event forms; the bio form uses it too). Drafts hold form values
      only: text, never images or other binary data.
    - **Validation**: `validate(values)` is pure and returns, per path (a
      field's name, or a dotted path into a nested value:
      `segments.2.end`), a key of the form's own copy; legacy's rules and
      messages. No error shows while the visitor fills the form in: they
      all show after a save attempt, and then update as fields change.
      `setErrors` shows the server's errors by path until that path is
      edited. The fields mark themselves `aria-invalid` and point
      `aria-describedby` at the message.
    - **Saving**: `onSubmit={form.handleSubmit(save)}`. It marks the save
      attempt, and only if the values are valid and no save is running
      (double taps, Enter) calls `save({ values, changes, isDirty })` with
      the latest state; `submitting` is true until `save`'s promise
      settles, so `save` returns it (`mutateAsync`). The save is a
      `useMutation` hook next to the query that waits for the session,
      sends only the changed columns (a JSON column whole if any part
      changed), selects the columns the query shows, maps the row as the
      query does, and `setQueryData`s it (no refetch). A record created
      from the client gets its id once per form instance
      (`useState(() => crypto.randomUUID())`), so sending it twice can't
      store it twice. On failure the edits stay, the form says so
      (`FormAlert kind="error"`, role alert) and the error is reported
      (`captureError`, `source: "<form>-save"`).
    - **Fields**: `src/ui/form/fields.tsx` (`TextField`, `TextAreaField`,
      `SelectField` on a native `<select>` (a value it doesn't offer,
      e.g. a production row's `conference` type, shows the placeholder and
      stays the value until another is picked), `ChoiceChips` for legacy's tags
      `Select` (checkboxes drawn as chips), `Switch` (`role="switch"`),
      `FormAlert`) and the `.action-button` / `.text-button` classes
      (legacy `general-action-btn black-btn large-btn` and `text-btn`), all
      in `Form.scss`. Labels come from the form's copy; `<form noValidate>`
      so the browser's own bubbles don't replace the form's messages.
- **Event forms** (slices 13–16; `features/event-forms`):
    - **Values** (`eventFormValues.ts`, pure, tested directly): the shared
      `EventBaseValues` (title, description, district, address
      `{ label, placeId, enLabel? }`, organisations and teachers as `Tag`s,
      links, prices with the sum as typed, `hidden`) and
      `SingleDayValues` (`date`, `segments` with `HH:mm` times; legacy's
      "first segment" is `segments[0]`). `validateBase`/`validateSingleDay`
      are legacy's rules as path-keyed `EventFormError`s (`required`,
      `datePast`: a new day before today, `notANumber`, `invalidUrl`: a
      link must be http(s); one typed without a scheme gets `https://`,
      `lib/webUrl.ts`, and is saved so). `baseColumns`,
      `singleDayColumns` and `singleDayPatch` (changed columns only; a new
      date rewrites the segments, whose instants carry the day) write
      legacy's column names and JSON shapes; segment times are instants
      from `jerusalemInstant(day, time)` (`lib/jerusalemInstant.ts`, kept
      off `/`). `singleDayValuesOf(event)` reads a `ManagedEvent` back.
      `isSingleDayValues` checks a draft's shape. `taggedUserIds` is legacy
      `getCIEventTeachers` (teacher and organisation ids, not typed names).
      Multi-day (slice 14): `MultiDayValues` (`startDate`, `endDate`,
      `type` from `MULTI_DAY_TYPES`, `teachers` = `multi_day_teachers`),
      `emptyMultiDay`, `validateMultiDay` (type and both days required, the
      first not past unless saved so; legacy's span on `endDate`:
      `endBeforeStart` (new: legacy let it through), `sameDay` (legacy's
      "use a single-day event"), `tooLong` (over `MAX_MULTI_DAY_SPAN`, 14
      days on); an edit whose days are both as saved skips the span, as
      legacy checked no edit), `multiDayColumns` (`segments: []`,
      `is_multi_day: true`, days as `YYYY-MM-DD`: the `date` columns hold
      legacy's 13:00 sends as plain days, checked against production),
      `multiDayPatch`, `multiDayValuesOf`, `isMultiDayValues`. Both kinds'
      patches share `basePatch`.
    - **Parts** (`EventFormParts.tsx`, words in `EVENT_FORM_COPY`):
      `SegmentFields` (type, native `type="time"` inputs with a 5-minute
      step, teachers, audience tags; legacy's course notice),
      `MoreSegments`, `LinksFields`, `PricesFields`, `AddButton` /
      `RemoveButton`. Each takes its value, the form's `errors` and a change
      `(change, path) => form.update(field, change, path)`, so any `useForm`
      form can use them. Dates are native `type="date"` `TextField`s.
      `TagPicker` (`ui/form`) is legacy's tags/multiple Select: chips plus
      an ARIA combobox over a listbox; `allowTyped` adds a typed name as
      `{ label: name, value: name }` (legacy's untagged teachers).
      `AddressField` is legacy's GooglePlacesInput (below). Whole-form
      parts take the form itself as `BaseFormControls` (any `useForm`
      form of `EventBaseValues` and more; method signatures, so it is
      assignable): `BaseHeadFields` (card title, title, description,
      district, address), `EventFormFooter` (links, prices, hide switch,
      `before` (the recurrence), alerts, submit; `invalid` replaces the generic alert text, as
      legacy's multi-day span messages did) and `ClearFormButton`.
      `useTaggable(userId)` gives the tagging lists. A new form is its own
      head fields between these two, plus `useEventSubmit` (below).
    - **Who can be tagged**: `taggableBiosQuery` (personal: one request for
      bios with `allow_tagging` and a name, plus the user's own) and the
      pure `taggableOptions` (legacy's lists: orgs apart, the user's own bio
      offered first, an org itself among organisations).
    - **Saves** (`eventSave.ts`): `useCreateEvent` (id made once per form;
      a duplicate on resend reads the stored event) and `useUpdateEvent`
      (`.eq("id").eq("user_id")`, `maybeSingle`; none back is
      `EventGoneError` and every event list is refetched). First, in
      parallel, the title's translations (`translateTitle`, en and ru, as
      `lng_titles`) and, only if the address field couldn't get it when the
      place was picked, the English address (`en_label`,
      `englishAddressOf` in `data/placeLookups.ts`); an edit asks only for a changed title or a newly
      picked place. Each falls back to the source text and never fails or
      holds the save: after `LOOKUP_TIMEOUT_MS` (5 s, `lib/timeout.ts`,
      `withTimeout`) it goes on without. A language that failed is left out
      of `lng_titles` (legacy stored the Hebrew title there; every reader,
      legacy's `getTitleByLanguage` included, falls back to the title
      anyway); a failed address has no `en_label`. Then the write,
      selecting `MANAGED_EVENT_COLUMNS`, then junction rows for the tagged
      users not yet tagged (`ci_events_users_junction`, inserted returning
      their bios, merged into the event; a failure there is reported and
      leaves the saved event without them; multi-day teachers are tagged
      too, as legacy did). `columns.owners` defaults to `[]` (legacy's
      single-day); the multi-day form sends `[{ value: userId, label:
user_name }]`, as legacy's did (nothing reads it). New events' hide
      switch starts from `HIDE_NEW_EVENTS` (`VITE_HIDE_EVENTS_FLAG`).
      Legacy never deleted junction
      rows and neither does this: a removed tag no longer names the bio,
      so it doesn't show. The result goes to `applyEventChanges`.
    - **Submitting** (`useEventSubmit.ts`): every form's save is
      `useEventSubmit(options)` (`userId`, `event`, `columns`, `patch`,
      `tagFields`, `discardDraft`, `onDone`), then `onSubmit={form.handleSubmit(save)}`:
      a new event inserts `columns(values)` with an id made once per form;
      an edit sends `patch(values, changes)` (nothing when clean) and
      re-tags only if a field in `tagFields` changed (single-day:
      `segments`, `organisations`; multi-day: `teachers`,
      `organisations`); then the draft goes and `onDone`. It returns
      `failed` and `gone` for `EventFormFooter`, and `question` (below).
      Templates have their own, `useTemplateSubmit` (below).
    - **Recurring events** (slice 15; legacy RecurringEventSection and
      EditRecurringEventDialog; single-day only, as legacy):
        - **Expansion** is pure (`recurrence.ts`, tested directly):
          `recurringDates(start, end, recurrence)` on Jerusalem days,
          legacy's frequencies (`weekly`, `bi-weekly`, `monthly` keeping
          the date or the month's last day as dayjs did, `monthly-pattern`
          keeping the weekday of the same week) and caps (52 steps, 12
          months), end inclusive. Legacy carried a missing fifth weekday
          into the next month; it is skipped, and the skipped month still
          counts as one of the 12 (a step is a month, not an event: the
          search looks 12 months ahead, as legacy's loop did). Days carry no clock, so a
          series crosses a clock change unharmed; each row's segments are
          `jerusalemInstant`s on its own day. Legacy's series rows all carry
          the segment instants of the day the series was created (checked
          in production), not their own day, so **readers of segment times
          must use only the time of day** (`jerusalemTimeOfDay`), never the
          instant's date. A time edit rewrites the segments of the rows it
          writes only (the edited event and the later ones chosen); other
          legacy rows keep their creation-day instants.
        - **Creating**: `SingleDayValues.recurrence` (`{ on, frequency,
until }`, off for every saved event, so it's in drafts too) is
          checked by `validateSingleDay` (frequency and end required, end
          from the event's day to `RECURRENCE_MONTHS` = a year from today:
          legacy's picker limit; `tooFar`). `newSingleDayColumns` returns a
          list (one row per day) when it recurs; `useEventSubmit` gives the
          rows ids made once per form and one `recurring_ref_key`, and
          `useCreateEvent` (`NewEvents`) looks the title and address up
          once, inserts all rows in one request (atomic), tags every row in
          one junction insert, and
          puts them all in the cache. `short_id` comes from the database's
          trigger, per row, as legacy. Ids are made once per day of the
          series (per form), so a resend after a lost answer (`23505`)
          reads the stored rows by id and inserts only the days not stored
          (e.g. an end day moved later in between); days dropped in between
          stay stored, as they were saved.
        - **The edit waits for the series**: while `seriesQuery` has no
          data the submit button is off and the form says it's loading
          (or, failed, says so with a retry); the save refuses too
          (`series.ready`), so the question is never skipped.
        - **Editing**: the form reads the user's events of the series from
          today on (`seriesQuery`, `events/series.ts`, `series`, personal,
          registered as an event list) and passes `series: { later, patch: seriesPatch }`
          (`laterInSeries`: a later day, hidden and cancelled ones too).
          With later events, a dirty save first asks (`question`, shown as
          `SeriesEditDialog` over `ActionDialog`): "all" or some of them, or
          none (just this one); closing it saves nothing and keeps the
          edits. The edited event gets the whole patch; each chosen later
          event gets `seriesPatch`: the changed shared columns, never date,
          hide or cancellation (legacy's batch kept those), and changed
          segments re-dated to its own day. `useUpdateEvent` looks up once,
          writes the edited row as before plus one update per distinct later
          patch (`.in("id", …).eq("user_id").eq("recurring_ref_key")`: one
          for all unless segments changed) only once the edited row came
          back (else `EventGoneError`, nothing else written), re-tags them,
          applies whatever was stored, and refetches the lists if a later
          write failed (the form says the save failed) or a later event no
          longer matched. Legacy updated in place too (no delete
          and recreate), but sent every column of the form and stripped the
          edited event's own date and hide; here only changed columns go,
          and the edited event's date and hide apply to it.
    - **Drafts** (`app/useFormDraft.ts`, keys in `draftKeys.ts`,
      `personalKey`s):
      `useFormDraft({ key, userId, eventId, saved, form, isValues })` keeps
      only the form's `changes` while it is dirty and removes them once it
      is clean again; when the form mounts, if the draft is the same user's
      for the same event, it restores (`form.restore`) those fields over
      `saved` as it is then, so a field the user didn't touch shows the
      server's newer value. It restores in a layout effect, before the
      first paint, so the form never shows without its draft (not even
      for a frame, or to a test reading the DOM). It returns `discard` (after a save, on "clear
      form"). A new event's draft survives leaving the page (legacy's); an
      edit's is dropped by the page's back button but survives a reload.
      A `null` key keeps none (template edits, as legacy).
    - **Pages**: `/create-events` (new event or new template; legacy
      offered four links, single-day and multi-day of each; the
      missing-bio and no-templates warnings; the templates list),
      `/create-events/single-day` and `/create-events/multi-day`
      (`NewEventPage`: one new-event form, single-day by default, whose
      "multi-day event" switch (`MultiDaySwitch`) swaps the form and moves
      to the other path with `replace`, so a reload keeps the kind and its
      draft. What was filled in carries over (`singleToMultiDay` /
      `multiToSingleDay` and their template twins, pure, in the values
      modules: the shared fields, the day as the first day, the segments'
      teachers and a multi-day type as the event's, and back as one
      segment); the left form's draft is discarded and the new form
      restores the carried values over its own draft (`useCarried`).
      Multi-day shows legacy's info notice. With `?isTemplate=true`,
      legacy's link, the same for a new template. Both go back to
      `/create-events` after a save, as legacy. The switching itself is
      `SwitchingForms`, shared with the edit pages), and
      `/manage-events/edit-single-day/:eventId` and
      `/manage-events/edit-multi-day/:eventId` (`EditEventPage`;
      `eventToEditQuery`, `event-forms/eventToEdit.ts`, personal, keyed on
      the viewer: the viewer's own event by id, at once from the cached
      upcoming list; registered as an event list; an event of the other
      kind redirects to its own form; back to `/manage-events`). An event
      that doesn't repeat (no `recurring_ref_key`) has the same switch
      (maintainer decision 2026-10-31): it moves to the other edit path
      with `replace` and `switched: true` in the history state (which
      lets the form differ from the stored kind, and survives a reload,
      with the new kind's draft). Saved, the event becomes the other kind:
      the save sends the changed shared columns plus every column of the
      new kind whole (`toMultiDayPatch` / `toSingleDayPatch`: days,
      segments, type, `is_multi_day`, `multi_day_teachers`; the template
      link stays), even with no field changed, and re-tags it
      (`useEventSubmit`'s `kindChanged`). An event of a recurring series
      stays single-day: it has no switch. **Admins edit anyone's
      event** there, as legacy's manage-all-events let them: for an admin
      viewer the page reads with scope `"any"` (no owner filter; the key
      carries the scope); edits are written only while the row still
      belongs to the owner the form opened it with (`.eq("user_id",
event.ownerId)`, the user's own for everyone else, since that is all
      `"own"` reads) and the series offered is that owner's
      (`seriesQuery(services, viewerId, refKey, ownerId)`). Opened from `/manage-all-events`
      (link state `FROM_ALL_EVENTS`, `events/managedEvent.ts`), the form
      goes back there. Each page is a few lines
      over `NewEventFormPage` / `EditEventFormPage`
      (`EventFormPages.tsx`: header, back button, loading/not-found/error,
      the draft keys the back button drops). Layout in `FormPage.scss`.
    - **One chunk**: every event-form page is exported from
      `event-forms/pages.ts` and routed with `eventFormPage("Name")`
      (`app/routes.tsx`): one dynamic import in `/`'s route table for all
      of them (each `import()` there costs `/` its preload list and file
      names), and moving between the chooser and the forms downloads
      nothing. Add any new form page the same way. Only use react-router
      hooks `/` already carries (`useLocation`, not `useSearchParams`): the
      router lives in `/`'s chunk and a newly used export lands there.
    - **Templates** (slice 16; legacy templateService, ManageTemplatesList
      and the forms' `isTemplate`): a `templates` row is an event without
      its days, `hide` and `cancelled`, plus a `name`.
        - **Data** (`templates.ts`): `myTemplatesQuery` (`my-templates`,
          personal: the user's own rows by `user_id`, newest first, as
          legacy listed them; never at boot, never persisted, forgotten on
          sign-out) is used only by the chooser's list and the new-event
          forms' picker (`useMyTemplates`). `useCreateTemplate` (id made once
          per form; a duplicate on resend reads the stored row),
          `useUpdateTemplate` (changed columns, `.eq("id").eq("user_id")`,
          `maybeSingle`; none back is `TemplateGoneError` and the list is
          refetched) and `useDeleteTemplate` (owner-scoped) put the answer
          in the cached list (`setQueryData` only if cached), no refetch.
          A delete keeps the events made from the template: it unlinks
          them first (`source_template_id = null`), so they stay whatever
          the foreign key's delete rule (see Maintainer notes). If the user
          ticks it in the confirm, it first deletes their upcoming events
          made from it (`deleteEventRows`, as manage-events deletes); past
          ones always stay. It then runs `refreshEventQueries`. No translation or Places lookup: templates
          have no `lng_titles`, and the address keeps the `en_label` the
          field got when picked.
        - **Values** (`templateValues.ts`, pure, tested directly):
          `toTemplate` reads a row through `toPublicEvent` (so its JSON
          columns read as an event's) into `Template` (`id`, `name`,
          `multiDay`, `createdAt`, `content`). The forms edit
          `SingleDayTemplateValues` / `MultiDayTemplateValues` (the event's
          base values plus `name`; `hidden` stays false, unshown and never
          written); `validate*Template` are the event's rules without days,
          plus a name; `*TemplateColumns`/`*TemplatePatch` write legacy's
          shapes (single-day segment instants on the day saved, as legacy;
          readers use only the time of day; multi-day `segments: []` and,
          from the form, `owners` naming the creator, as legacy).
        - **Forms** (`TemplateForms.tsx`): the event forms' cards
          (`SingleDayFields`, `MultiDayHeadFields`, shared with the event
          forms) without day fields, recurrence or the hide switch
          (`EventFormFooter canHide={false}`), the name beside "clear form"
          for a new template (labelled above for an edit), `useTemplateSubmit`
          (as `useEventSubmit`). New templates keep drafts under their own
          keys (`SINGLE_DAY_TEMPLATE_DRAFT_KEY`, …); edits keep none.
          Editing opens from the chooser's list in a `Dialog` (legacy's
          FormContainer: drawer on phones, modal above); delete asks first
          (`ActionDialog`, legacy's warning text).
        - **Starting an event from one**: the new-event forms' top row has
          `TemplatePicker` (legacy's "בחירת תבנית": the user's templates of
          both kinds, where legacy offered only the form's; one of the
          other kind switches the form to it first) beside "clear form". Picking one replaces the form's
          values with the template's (`withSingleDayTemplate` /
          `withMultiDayTemplate`; the day(s), recurrence and hide stay:
          legacy's single-day mapping set an `event-dates` value from the
          first segment, but the form's day field (`event-start-date`)
          never read it, and its multi-day mapping read the days from a
          multi-day template's empty segments, so no day came across)
          through `form.restore`, as legacy's picker overwrote the form, a
          restored draft included (no confirm). `sourceTemplateId` is a
          form value (so the draft keeps it across a reload) written as
          `source_template_id` by the `*Columns` functions (`null` when
          none, every row of a series). A template deleted since (a draft
          from before) must not be sent: once the user's templates have
          loaded, `TemplatePicker` clears an id that isn't among them; and
          should the insert still fail on that foreign key (`23503` naming
          `source_template_id`, deleted while the form was open),
          `useCreateEvent` sends the rows again once with it `null`. The
          fake enforces that key on insert (`FOREIGN_KEYS`).
- **Bio editor** (slice 17; `features/bio`, legacy BioPage, ProfileForm
  and UploadImageButton):
    - **Data** (`myBio.ts`): `myBioQuery` (`my-bio`, personal: the user's
      own `public_bio` row by `user_id`, `MY_BIO_COLUMNS`, `null` when they
      have none; read when `/bio` opens, never at boot or persisted).
      `useSaveBio` waits for the session, uploads a photo if there is one,
      then writes only the changed columns to the user's own row
      (`.eq("user_id")`, `maybeSingle`). A user without a row gets one
      inserted with legacy's upsert columns (every text field, `img`,
      `user_id`; no `user_type` or switches, as legacy). Such a row has
      `user_type` null, so it stays out of public data (the public filters
      need a non-admin `user_type`) until `assign_user_role` sets it, as
      legacy's rows were; rows of users given a role since that RPC exist
      already (it creates them). The update goes
      only to an existing row and the insert only where none exists
      (unique `user_id`: `23505` means another tab made it, so it updates
      that one). The switches (`allow_tagging`, `show_profile`) save at
      once, one column each, and need a row (off until one is saved).
    - **Caches**: the response goes into `my-bio`, the user's own row in
      the tagging list (`cacheOwnBio`), and, when its public face changed,
      every cached event embedding it: `applyBioChange(queryClient,
userId, bio | null, { refresh })` (`events/eventCache.ts`; `null`
      once the bio isn't public, `isPublicBio`; same rules as
      `applyEventChanges`: in place, fetch times kept, refetches in flight
      redone). So a bio switched off leaves the persisted window at once,
      offline too; one switched on isn't in any event yet, so `refresh`
      refetches the event lists. `withBio` finds events as any object with
      a `bios` list in a list's data, so new event lists need nothing.
      `toPublicBio` (`calendar/publicEvent.ts`) maps a bio row as events
      embed it.
    - **Values** (`bioValues.ts`, pure): fields named as their columns;
      legacy's rules (name; link titles up to 30 characters and not a
      link; a link needs its own title, legacy checked the first link's
      for the second; links http(s), a scheme-less one saved with
      `https://` as the event forms' links).
    - **Photos** (spec: "uploaded bio photos are resized"): the user picks
      a file, `PhotoField` opens a `Dialog` with react-easy-crop (square;
      `services.images.loadCropper()`, ~7.8 KB gzip with the canvas code,
      `app/images/photoTools.ts`, loaded only when a photo is picked; its
      stylesheet ships with the bio page so it injects no `<style>`), and
      `services.images.renderPhoto(file, area, photoOutputSize(area))`
      draws the crop at most `PHOTO_MAX_SIDE` (600px: the card shows 250
      CSS px; legacy used 800) and encodes it with `encodeWithinBudget`
      (`lib/photo.ts`, `lib/photoEncoding.ts`, pure): JPEG, as legacy,
      within legacy's 30 KB (`MAX_FILE_SIZE`), the quality stepping from
      0.8 down by 0.1 to 0.1 as legacy's did (at 600px a photo fits at a
      higher quality than legacy's 800px).
      **HEIC/HEIF** (iPhones' default) is accepted (`PHOTO_ACCEPT`,
      `image/*,.heic,.heif`, as Windows doesn't count `.heic` as an image)
      and goes through `services.images.preparePhoto(file)` first
      (`app/images/preparePhoto.ts`): a file `isHeic` (`lib/heic.ts`, pure:
      type, name or the `ftyp` box's HEVC brands) that `createImageBitmap`
      can't decode (every browser but Safari) is converted to JPEG (0.92)
      by `heic-to/csp` (libheif in JS: no eval or wasm, a `blob:` worker),
      imported only then, ~810 KB gzip in its own chunk under `assets/heic/`
      (`HEIC_ASSETS`, never precached; `check:sw` checks). The cropper shows,
      and `renderPhoto` draws, the prepared Blob; other files pass as they
      are. A 12 MP HEIC takes under a second on a desktop.
      The Blob waits in the form's state (a reload is blocked meanwhile)
      and is uploaded on save with the user's token to legacy's bucket
      (`VITE_SUPABASE_STORAGE_BUCKET`) and path scheme
      (`<user id>/<ms>.jpg`, never over an existing object, cached for a
      year) with content type `image/jpg` (`PHOTO_CONTENT_TYPE`), legacy's
      non-standard type, deliberately: the bucket's allowed types aren't
      known from the repo and it is the one proven accepted (see Maintainer
      notes); then `img` is the public URL
      (`<VITE_SUPABASE_URL>/storage/v1/object/public/<bucket>/<path>`).
      The bucket refusing the user (`FileError.denied`; a `profile` user
      until the storage migration is applied) gets its own message and the
      photo is dropped so the rest saves. A new photo the row doesn't
      point at is removed only when the server answered the row write with
      an error (an HTTP status; `BioWriteError.answered`), never after a
      network failure (the write may have committed). It stays an orphan
      after such a failure, or when the tab closes between upload and
      write: accepted, as legacy (which uploaded on crop) left every
      unsaved photo. The replaced photo stays too, as legacy left it
      (other devices' cached events still show its URL).
    - **Images never go to storage** (#23): a picked or cropped photo
      lives only in memory, as a `File`/`Blob`, shown through object URLs
      that are revoked when no longer shown (`useObjectUrl`). Never read
      one into a data URL or base64, and never put one in device storage,
      sessionStorage, the persisted cache or a draft (legacy's
      `upload-image-temp` did). A test records every device storage write
      during a crop and upload and fails on image data.
- **Admin pages** (slices 18–20; `features/admin`, spec "admin data is
  split by route"):
    - **Routing**: inside `requireRole(ADMIN_ROLES, [...])`, routed with
      `adminPage("Name")` (`app/routes.tsx`): every admin page is exported
      from `features/admin/pages.ts`, one chunk and one dynamic import in
      `/`'s route table for all of them (as the event forms). Add any new
      admin page there.
    - **Data**: admin queries are built as personal ones (keyed `[kind,
adminId, …]` with `useUserId()`, `sessionOf` first, `enabled:
!!adminId`, selecting only the columns shown): loaded when their
      page opens, never at boot, never persisted (not in
      `PERSISTED_SHAPES`), forgotten on sign-out (not in
      `PUBLIC_QUERY_KINDS`). Nothing filters by owner here: RLS lets admins
      read every row, which is the point.
    - **Freshness**: a plain admin query uses `PERSONAL_FRESHNESS` (fetched
      on every mount of its page, and when the app comes back after 5
      minutes). A paginated one (an infinite query, keyset as under
      Pagination) uses `PAGED_ADMIN_FRESHNESS` (TanStack never refetches it,
      which would fetch every loaded page in turn), is removed when its page
      unmounts, and is refreshed from its first page only
      (`refreshFirstPage`: later pages are dropped, then one request) when
      the app comes back stale (`useRefreshWhenBack(key, refresh)`) and
      from the refresh button. A page shows one with `usePagedAdminList`
      (`admin/adminLists.ts`), which does all of that: pass the options
      factory's result memoised (its key keeps its identity until a filter
      changes) plus `placeholderData`; it returns the list, `refreshing`
      and `refresh(also?)` for the refresh button (the list shown from its
      first page plus the page's other queries; other filters' lists are
      dropped unless `keepOthers`). The list renders in `QueryList`; a
      phone number to copy is `CopyPhone` (`features/admin`, styled by
      `_copy-phone.scss`, `@use`d as the refresh button's).
    - **Manual refresh**: every admin page has `RefreshButton`
      (`features/admin`, new: legacy refreshed over realtime) at the top of
      its card, refreshing all of the page's queries (`refreshFirstPage`
      for paginated ones, `refetch` for the rest); its page's stylesheet
      `@use`s `features/admin/_refresh-button.scss`. A failed refresh keeps
      the data on screen and says so.
    - **Server-side search**: a list too long to load whole is searched on
      the server, never filtered in the browser. The text box's value goes
      through `useDebouncedValue` (`app/`; 300 ms, `SEARCH_DEBOUNCE_MS` in
      `admin/adminLists.ts`),
      trimmed, into the query key (each search its own query, shown with
      `placeholderData: keepPreviousData`, the list dimmed, `aria-busy` and
      a "searching" status while `isPlaceholderData`), and into one
      PostgREST `or()`
      logic tree: `searchTerms` (`admin-users/users.ts`) makes `col.ilike."*text*"`
      terms, the text with LIKE's `%`, `_` and `\` escaped, `*` (which
      PostgREST makes a wildcard, unescapably) turned into `_`,
      and the value double-quoted (`quoted`, so `.`, `,`, `:` and
      parentheses are text: e-mail addresses). A later page's cursor joins
      it in the same tree (`usersFilter`: `and(or(search),or(cursor))`),
      never as a second `or` parameter. Newest-first admin lists page with
      `afterNewest` (`admin/adminLists.ts`: `created_at`, then `id`, over
      `rowsAfter`; `quoted` is in `lib/keyset.ts`), ordered by
      `compareNewest`. A filter that picks values (request types) is
      an `in` filter in the key, in one order, so a choice is one query.
    - **Counts** (legacy's totals) are counting `HEAD` requests
      (`select("id", { count: "exact", head: true })`), never a read of the
      rows.
    - **Writes** update the cached rows from the response (every cached
      search and page, the same object where nothing changed, fetch times
      kept), never by refetching a list; a fetch of those queries in flight
      (sent before the write) is redone, a paginated one from its first
      page, as `applyEventChanges` does: all through
      `updateCachedQueries(queryClient, [kind, adminId], update)`
      (`app/cachedQueries.ts`). A row moved into a loaded list goes on the
      page whose range holds it, up to its `next` cursor (`pageHolding`,
      under Pagination), as every paginated list's does.
- **Users and roles** (slice 18; `features/admin-users`, legacy
  ManageUsersPage, usersService.getUsers, userRoleService and the
  store's `app_users`):
    - **List** (`users.ts`): `adminUsersQuery` (`admin-users`, per search)
      reads `ADMIN_USER_COLUMNS` (name, email, phone, `user_type`,
      `created_at`, the `user_roles` membership, one-to-one), 20 a page,
      newest first (`created_at`, then `id`; legacy listed all, unordered),
      searched by name or email as legacy's search was (not phone).
      `adminUserStatsQuery` (`admin-user-stats`) counts all accounts and
      each `user_type`. A row opens legacy's details (name, email, phone
      to copy, the role from `user_roles`, a plain user without one) and
      its role buttons (named by `REQUEST_WORDS.roleButton`; the one equal
      to `user_type` off, as legacy).
    - **Role changes** go only through the `assign_user_role` RPC
      (`roles.ts`: `assignUserRole`, legacy's error wrapping "Failed to
      update user role ERROR: …"; the role ids it sends are `ROLE_IDS` in
      `users.ts`: admin 1, creator 2, org 3, profile 4, user 5). The client never writes `user_roles`, `users` or
      `public_bio` for it. `useAssignRole(adminId)` applies the RPC's answer
      (`applyRoleChange`): the row in every cached search, the counts (the
      account moved between types; refetched if the user wasn't cached),
      the admin's own profile if they changed their own role, and the
      user's bio in cached events (a new admin's leaves them,
      `applyBioChange(…, null)`; one leaving admin, or whose type wasn't
      known, may be public now, so the event lists refresh); a users list
      or count fetch in flight is redone. An admin changing their own role
      is asked first (`ActionDialog`, new: it locks them out at once);
      the profile is read again and the guard sends them to `/`. Request
      approvals (below) call `useAssignRole` too.
- **Support requests** (slice 19; `features/admin-requests`, legacy
  ManageSupportPage, requestsService and the store's `app_requests`):
    - **Lists** (`adminRequests.ts`): `adminRequestsQuery` (`admin-requests`,
      keyed `[kind, adminId, status, types]`; never `my-requests`, the
      user's own kind, so the two never share a cache entry and the user
      sees an admin's answer on their page's next fetch) reads
      `ADMIN_REQUEST_COLUMNS` (`REQUEST_COLUMNS` and the sender), open or
      closed by `isClosed` as the user's page tells them (legacy's switch
      split on `closed` alone; `requestsFilter` joins the status tree and
      the cursor in one `or()`), optionally `in`
      legacy's filter types, 20 a page newest first (keyset,
      `PAGED_ADMIN_FRESHNESS`, removed when the page closes). The open ones
      load when the page opens, the closed ones when the switch first shows
      them; a type filter keeps the last list on screen (`placeholderData`
      only within the same switch position). The refresh button refreshes
      the list shown and drops the others (they load when shown).
    - **Writes** go only to the request still open or closed as the admin
      saw it (`whereOpen` / `whereClosed`, `maybeSingle`): a user's cancel (which closes it) or another
      admin's close or reopen since is never overwritten; no row back is
      `RequestChangedError`, the lists are read again and the page says
      nothing was saved. Replies, declines ("דחיה") and approvals append to
      `responses` read fresh under the same condition (`appendToResponses`, legacy's
      `{ response, created_at, responder_name }`, with `viewed: false,
sent: false, to_send: true`; declines and approvals add legacy's Hebrew
      notes and close it); reopening (new) sets `closed: false, status:
"open"`, refused (`OtherOpenRequestError`, the page says why) while the
      user has another open request: legacy allowed one at a time. Another admin's reply between the read and the write would be
      lost: an atomic append needs an RPC (as for the user's cancel). The
      stored row goes into every cached list (`applyRequestChange`: replaced,
      moved between open and closed, in order; fetch times kept; a fetch in
      flight redone from its first page).
    - **Approvals** (`useApproveRequest`, legacy's order): the request is
      read fresh, still open, and its stored `type` and `user_id` (not the
      list's copy: the user may have edited it) say which role goes to
      whom (`requestedRole`: profile, creator, org; support requests have
      no approve); then the role goes through `useAssignRole`, then the
      request is closed with legacy's note. A failed role change writes
      nothing else (the request stays open, the page says so). If the
      close then finds the request changed, the page says the role was
      given and the request left as it is (`RoleGivenRequestChangedError`);
      any other close failure leaves the role given and the request open
      (`ApprovalCloseError`; approving again is safe).
- **All events** (slice 20; `features/admin-events`, legacy
  ManageAllEventsPage, ManageEventsList, `getCIEventsCreators` and the
  store's `app_ci_events`/`app_creators`):
    - **List** (`adminEvents.ts`): `adminEventsQuery` (`admin-events`,
      keyed `[kind, adminId, creatorIds sorted, search]`) reads
      `MANAGED_EVENT_COLUMNS` of every owner's events from today on,
      hidden ones included, optionally `in("user_id", creators)` and
      `ilike("title", containing(search))` (debounced, as the users search;
      `containing` is in `admin/adminLists.ts`), 30 a page by day then id
      (keyset, `eventsAfter(cursor, "ascending")`; `PAGED_ADMIN_FRESHNESS`,
      removed when the page closes, passed days dropped in `select`).
      Registered as an event list: every event write (here, my events, the
      forms) puts the saved event in each cached filter it matches
      (`belongsInList`) on the page whose cursor range holds it
      (`mergeIntoPages`) and takes out deleted ones and those that no
      longer match.
    - **Creators** (`adminEventCreatorsQuery`, `admin-event-creators`,
      `PERSONAL_FRESHNESS`): `user_id, users(user_name)` of the events from
      today on, deduplicated in the browser as legacy did (no distinct
      without an RPC); the `TagPicker` filter's options and the rows'
      creator names.
    - **Actions** are `EventActions` with `ownOnly={false}`; delete and
      hide offer the owner's later events of the series
      (`seriesQuery(services, adminId, refKey, ownerId)`, read when a
      recurring event's row opens). The refresh button refreshes the list
      shown and the creators and drops the other filters' lists.
- **Google Places.** `services.places()` (`PlacesLoader`) loads the Maps
  JavaScript API's Places library with `VITE_GOOGLE_PLACES_API_KEY` on
  first call (`data/googlePlaces.ts`, its own chunk; a script tag with
  `language=he&region=IL`) and returns `session()`: one search billed as
  one session (an `AutocompleteSessionToken`): `suggest(input)`
  (`AutocompleteService`, what legacy's react-google-places-autocomplete
  called) while typing, then `englishAddress(placeId)`
  (`PlacesService.getDetails`, legacy's) for the picked place, which ends
  the session; plus a sessionless `englishAddress` (a save's fallback,
  `englishAddressOf`).
  `AddressField` loads it when focused, never before; typing asks after a
  300 ms pause; picking sets the address and then its `enLabel`
  (`pickedPlaceInEnglish`, `data/placeLookups.ts`, 5 s at most; the field
  never looks up Google itself); picking the address already set keeps it, English label and all.
  So a save, a restored draft's included, normally needs no lookup and
  never loads the script. Tests get `fake.places` and assert
  `fake.places.loads` and the sessions in `fake.places.calls`. Future
  work: Google deprecated these two services for new projects in favour
  of `AutocompleteSuggestion` and `Place.fetchFields` (Places API (New));
  moving needs that API enabled on the key.
- **Machine translation.** Only through the `translate` Edge Function
  (`data/translate.ts`: `translateText`, `translateTitle`; the Google key
  is server-side; a test fails if any source names Google's Translate
  endpoint). It never rejects (`translateOrNull`: `null` on failure or
  after `LOOKUP_TIMEOUT_MS`; `translateText`: the source text) and
  remembers each text and language for the session. What people wrote is
  shown in English and Russian through one hook,
  `useMachineTranslation(texts, language, { onDevice })`
  (`app/useMachineTranslation.ts`): one query per text, showing the text
  as written until its translation arrives (or if it fails). Hebrew asks
  for nothing, and neither does a text without Hebrew letters (the
  function's only source). Its users:
    - **Event details** (`detailsTranslation.ts`): what legacy translated
      (description, link and price titles, names of organisations and
      multi-day teachers without a bio).
    - **Bio card** (`BioCard.tsx`): the "about" text and link titles (new;
      the name stays as written).
    - **Requests** (`features/requests/requestTexts.ts`,
      `useRequestTexts`): the admins' replies on the user's page, and the
      message and responses on `/manage-support`. The notes the app stores
      in Hebrew (`REQUEST_NOTES` in `requestRows.ts`: approved, closed,
      cancelled by the user) are never sent: `REQUEST_WORDS.note` shows them
      in the reader's language. They are still written in Hebrew, as legacy
      wrote them.
      Public texts (details, bios) are kept on the device across visits
      (`onDevice`; `app/translationStore.ts`, `detailsTranslations` in
      `services.storage`, read by lazy chunks only): keyed by language and the
      Hebrew text itself (an edited text is simply a new key, so no
      `updated_at` is needed in the public payload), bounded to 200 entries and
      100,000 characters, oldest out first; kept across users. Request texts
      are private, so they stay in memory. The queries aren't a public kind,
      so signing out removes them.
      Links the details render (event links, bio pages) go through `webLinks`:
      http(s) only, a scheme-less one as https, anything else (a stored
      `javascript:`) dropped.
- **Languages (i18n).** Hebrew (default, RTL), English and Russian (LTR).
  Everything that adds copy follows this:
    - **Copy is per component**, declared with `defineCopy({ he, en, ru })`
      (`lib/copy.ts`) next to the component and read with
      `useCopy(COPY)` (`src/app/language.ts`). Hebrew sets the shape; English
      and Russian must match it key for key, so a missing translation is a
      type error. Entries are strings; `counted({ one, other, … })` for
      phrases with a count (it becomes `(count) => string`, with the plural
      rules of the block it sits in, so never pass a language code; Russian
      needs `one`/`few`/`many`); or functions of names or values returning a
      string or React nodes (a sentence with a link in it:
      `terms: (link: ReactNode) => <>I accept the {link}</>`). Never write
      a user-facing string outside a `defineCopy` (aria-labels, titles and
      alt text included). Write all three languages: legacy's words were
      ported where it had them, and much of its copy was Hebrew only.
    - **Legal texts** (privacy policy, terms) are the one exception: legacy
      published them in Hebrew only, so they stay word for word in a
      component marked `lang="he" dir="rtl"`, under a translated title and
      `HebrewOnlyNote` (English and Russian). Don't machine-translate them.
    - **Shared words** (save, cancel, confirm, delete, close, retry,
      loading, back to the calendar) are in `COMMON_COPY`
      (`lib/commonCopy.ts`), read with `useCopy(COMMON_COPY)`; add a word
      there once a second component needs it, rather than translating it
      twice.
    - **All three languages ship together**, eager, in the component's chunk:
      the copy built so far costs ~3 KB gzip on `/`, and lazy routes carry
      their own. So switching never waits or flashes a key. Don't build a
      central dictionary or lazy-load languages unless `/` nears its budget.
    - **Event vocabulary** (types, tags, districts, month and weekday names,
      the day format, "cancelled"/"with") is an `EventLocale`
      (`features/calendar/eventLocales.ts`, `EVENT_LOCALES`), read with
      `useCopy(EVENT_LOCALES)`. The pure formatters in `eventFormat.ts` and
      `toEventCards` require one (no default), so code that forgets the
      language fails the typecheck.
    - **Titles and addresses**: `pickTitle(event, language)` (the
      `lng_titles` translation, else the Hebrew title; Russian falls back to
      Hebrew, as legacy) and `pickAddress(address, language)` (Hebrew label,
      else `en_label` for English and Russian, else Hebrew). External links
      (maps, Google Calendar) keep the Hebrew originals, as legacy did.
    - **Formats**: dates through `Intl` with `INTL_LOCALES` (he-IL, en-US as
      legacy showed month first, ru-RU), formatting Jerusalem `YYYY-MM-DD`
      days in UTC so the day never shifts; Hebrew keeps legacy's own day
      format. Times stay 24-hour `HH:mm` in every language. Counted phrases
      go through `counted` (`Intl.PluralRules`), never hand-rolled number
      checks.
    - **Direction**: `main.tsx` sets `<html lang dir>` and the page
      `<title>` from the stored language before the first render
      (`applyLanguageToDocument`), and `LanguageProvider` keeps them in step
      on every switch; `index.html` defaults to `he`/`rtl`. Put elements in
      reading order in the DOM (so tab order matches) and style with logical
      properties (`margin-inline`, `padding-inline`, `inset-inline-start`,
      `justify-content: flex-start`, …) so the layout mirrors by itself.
      Where an icon points somewhere (chevrons) or legacy kept something on
      one side in every language (the filter chips, on the right), use a
      `[dir="rtl"] &` / `[dir="ltr"] &` override. Don't set `direction` in
      CSS except for a component that is deliberately one-way
      (`ToggleButtons`).
    - **Choosing and keeping it**: `useLanguage().setLanguage` is the only
      way to change it; it saves to `services.storage` under legacy's
      `language` key (raw `he`/`en`/`ru`), so a visitor's legacy choice
      carries over. A first visit is Hebrew whatever the browser language,
      as in legacy. Legacy never stored a language on the account (`users`
      has no such column); if one is added, signed-in boot (slice 9) calls
      `setLanguage` with it. `VITE_LANGUAGES_TO_SHOW` (legacy's build-time
      setting, `he,en,ru` when unset) picks the languages offered
      (`SHOWN_LANGUAGES`); a stored language that isn't offered falls back
      to Hebrew. The switcher (`app/LanguageSwitcher.tsx`, the legacy flag
      menu) sits in the app header, as in legacy.
- **Assets.** Images ported from the old client live in `src/assets/`
  and are imported with `?no-inline` (e.g. the flags, the Google logo), so
  they are hashed files fetched when shown, never base64 in the JS.
  Multi-colour logos are such images; single-colour icons are inline SVG
  components (`src/ui/icons/`). An image or gif below the fold gets
  `loading="lazy"` and explicit `width`/`height` (legacy's `cat-butt.gif`
  on the manage-events page, slice 11).
- **Fonts.** One file: legacy's Assistant variable font (weights 200–800;
  legacy loaded Rubik's file but never used it) subset to Latin and Hebrew
  as `src/assets/fonts/assistant-hebrew-latin.woff2` (~26 KB), regenerated
  from `fonts/Assistant-VariableFont_wght.ttf` by `scripts/subset-font.sh`
  (fonttools). It has no Cyrillic, so Russian uses the system font, as in
  legacy. `index.html` preloads it and `index.css` declares it with
  `font-display: optional`: used when it is there by the first paint
  (preload or cache), else that page view stays on the system font. Text
  never swaps fonts and reflows, on any platform, with no per-platform
  fallback metrics to keep. Vite rewrites the preload's `/src/...` href to
  the hashed file. Don't add another face or weight file; every weight is in
  this one. `index.css` makes buttons and inputs inherit the font.
- **Shell and page layout.** `RootLayout` draws legacy's gradient background
  (CSS only), then a column at most 500px wide: the install banner, the
  sticky `AppHeader`, the page. A page renders its own `<main>` with
  `padding: 0 16px`; text pages use `StaticPage` (`src/pages/`, a white
  `.card` with the title, then `PageFooter`). `.card` is global
  (`index.css`). Every page except the calendar is a lazy route
  (`lazyPage(() => import(...))` in `routes.tsx`). The window scrolls (not
  an inner box, unlike legacy), so the header's backing is a fixed strip
  along the top of the screen that copies the background (the gradient is
  one mixin, `app/_background.scss`): unseen over it, it hides what scrolls
  beneath and fades it out over 16px, as legacy's box did. Anything that
  must show above it at the top (the install banner) sits above the
  header's `z-index`. `ScrollRestoration` keys the calendar and
  events opened over it as one position, so a new page starts at the top
  and Back returns to where the visitor was. A route's `handle`
  (`RouteHandle`, `app/routeHandle.ts`) tells the shell about it, e.g.
  `homeButton` on the text pages. `services.reload()` reloads the page
  (tests count the calls); the update handover reloads through it too.
  While a lazy route's code downloads, the page stays and `PageLoading`
  shows a thin bar along the top (after 150 ms, so quick loads don't
  flash it), with "loading" for screen readers. The
  footer's version button is legacy's "reset the app": `resetDevice` clears
  device storage except `KEPT_ON_RESET` (`isInternal`), unregisters service
  workers and deletes Cache Storage, then the page reloads. Add a key to
  `KEPT_ON_RESET` only if losing it would harm the visitor or analytics.
  The footer closes the calendar in both views and the empty list too.
  Legacy's kill switch: a build with `VITE_DISABLE_APP=true` renders
  `AppDisabled` ("closed for maintenance") in `RootLayout` on every path,
  with no header; the service worker and updates still run, so the next
  deploy without it reaches installed apps. When unset, the build drops
  its code from `/` (its copy is `/* @__PURE__ */`).
- **Header and menu.** The header shows a home button (to signed-out
  visitors on routes with the `homeButton` handle, to signed-in users
  anywhere but `/`), the language menu, the out-of-date sign and the menu
  button (no WhatsApp link: removed with the weekly summary, maintainer
  decision 2026-10-31); signed out, the login link before them all, and signed in,
  the user's name before the menu button (rules under Auth and roles). The
  menu (a lazy `MenuDrawer`: a top drawer on phones, a side drawer from the
  start on wider screens) lists `menuFor(viewer)` from `MENU_ITEMS`
  (`app/header/menu.ts`): legacy's items, in order, each with the roles that
  see it (`unknown`: only items everyone sees). The logout item calls the
  viewer's `signOut`. A new page for a role is one `MENU_ITEMS` entry plus
  its copy key in `MenuDrawer`, and its route inside `requireRole`.
- **Install banner.** On phones (`PHONE_QUERY`, 500px), on `/`, outside the
  installed app (`isStandalone()`, `app/device.ts`, with `isIos()`), legacy's purple bar invites adding the
  app. `captureInstallPrompt()` runs at boot (main.tsx and `renderApp`) to
  keep Chrome's `beforeinstallprompt`; a tap shows that native dialog when
  there is one, else the lazy iOS/Android steps. `appinstalled` or an
  accepted prompt hides it. Closing it is stored under
  `installBannerDismissed` in `services.storage` (new: legacy had no close
  button, so no key).
- **Telemetry.** `services.telemetry` (`Telemetry`,
  `app/telemetry/telemetry.ts`) is the one boundary for Sentry, PostHog and
  Vercel Speed Insights; nothing else imports their SDKs. main.tsx's first
  import (`appTelemetry.ts`) creates it, so window `error` and
  `unhandledrejection` are captured from boot (React 19 hands render errors
  no boundary caught to the window too), and schedules Sentry's load after
  load and idle (`afterLoadAndIdle`) whether or not the app ever renders,
  so an error that stops the boot is still reported. `AppRoot` calls
  `start(router)`: page views, PostHog and Speed Insights (loaded after the
  first paint), and the router for Sentry's tracing. Until an SDK loads,
  reports, page views and events are buffered (up to `BUFFER_LIMIT`, 50)
  and flushed on arrival with the original Error objects. An SDK that fails
  to load (ad blockers, offline) is dropped silently, buffer and all: it
  never reloads the page or reports anything. Sentry's tracing (data
  router, via `wrapCreateBrowserRouterV7` on the existing router) and
  replay (all text and inputs masked, all media blocked, no network bodies
  or headers) load at a later idle. Release = `BUILD_VERSION` (the Sentry
  vite plugin uploads maps under the same name, not injected into the JS);
  environment `production` on ci-events.org, else `preview`. Who gets
  what: dev and tests send nothing (`import.meta.env.PROD`); errors go out
  from every production build with `VITE_SENTRY_DSN`; PostHog
  (`VITE_PUBLIC_POSTHOG_KEY`, legacy's options and persistence name) and
  Speed Insights only on the production host, and never on a device whose
  storage has `isInternal` = `true`. Cloudflare Web Analytics
  (`cloudflareAnalytics.ts`, only when `VITE_CF_ANALYTICS_TOKEN` is set)
  follows PostHog's rules; its beacon can't edit what it sends, so it is
  not loaded on a page whose URL holds auth secrets, and once loaded it
  can't be stopped (marking the device internal keeps it off from the
  next page load). Speed Insights stays until the app leaves Vercel and
  goes in the DNS switch PR (docs/cloudflare.md). The SDK chunks are built into
  `assets/telemetry/` (`chunkFileNames` in `vite.config.ts`) and never
  precached (`PRECACHE_IGNORES`); `check:sw` fails if one is, or if
  `vercel.json` stops serving them `immutable`.
    - **No secrets in URLs**: Supabase auth redirects carry tokens
      (`#access_token=…`, `?code=…`, `?token=…&type=…`). Every URL
      telemetry sends goes through `scrubUrl` (`app/telemetry/scrubUrl.ts`):
      page views, PostHog's `before_send` (`$current_url`, referrers,
      autocaptured links), Sentry's `beforeSend`/`beforeSendSpan`/
      `beforeBreadcrumb` (request URL and headers, navigation and request
      breadcrumbs, streamed spans' names and attributes), its
      `ScrubReplayEvents` processor (replay events' URLs, which
      `beforeSend` never sees), replay recordings
      (`beforeAddRecordingEvent`) and Speed Insights' `beforeSend`. Send
      a URL some other way and you scrub it too. Sentry 11 streams spans
      (no transactions, so no `beforeSendTransaction`) and collects
      everything it can unless told otherwise: `DATA_COLLECTION`
      (`sentry.ts`) keeps its earlier defaults (no IP address, cookies or
      bodies).
    - **Reporting errors**: `services.telemetry.captureError` with the error
      and a `source` naming where it was caught (a Sentry tag). Each
      Error object is reported once, so reporting in a catch and again from a
      boundary is safe. `RouteError` already reports route errors (not 404
      responses); report errors you catch and swallow (a failed save shown
      as a message), not ones you rethrow.
    - **Tracking events**: `services.telemetry.track(name, properties)`
      (PostHog `capture`). Page views are automatic: one per history entry
      (legacy recorded `$pageview` with `$current_url` on every location
      change, filters included), and Speed Insights reports under the route
      pattern (`/event/[eventId]`, `routePattern`).
    - **Users**: `bootSession` calls
      `services.telemetry.identify({ id, email })` once the session is known: Sentry `setUser` (as
      legacy) and PostHog `identify(id)` (new). Legacy left every visitor
      anonymous in PostHog (its `reset()` ran before `init`, a no-op, and it
      identified the visitor with its own anonymous id, which changes
      nothing), so on the first sign-in PostHog joins this device's
      anonymous history to the account; that is intended. Call
      `services.telemetry.reset()` on sign-out: Sentry forgets the user,
      PostHog starts a new anonymous visitor, so the next person on a
      shared phone isn't joined to the account. Send only the user id to
      PostHog, never email or name. As legacy's
      `saveIsInternalToLocalStorage` did, after the profile row loads
      `services.telemetry.setInternal(users.is_internal)` is called. It saves the
      `isInternal` key; marking a device internal stops PostHog
      (`opt_out_capturing`, autocapture included) and Speed Insights at
      once; unmarking takes effect from the next page load (wired in
      `bootSession`, `forgetUser` and `profileQuery`).
- **Production safety.** Never write to the production database or storage
  from scripts or the browser while developing. Read-only anon checks are
  fine. Schema changes go in `supabase/migrations/` as files and are applied
  by hand by the maintainer; nothing applies them automatically.
- **Security headers and the CSP (#17).** (On Cloudflare the same
  headers come from `public/_headers`: "Cloudflare hosting and the edge
  cache" below. Everything here holds for both.) `vercel.json` serves every path
  with a Content-Security-Policy, HSTS (two years, `includeSubDomains`, no
  `preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
  (and `frame-ancestors 'none'`), `Referrer-Policy:
strict-origin-when-cross-origin` and a Permissions-Policy that denies
  every powerful feature but `clipboard-write` and `web-share` (the event's
  copy-link and share buttons). The CSP has no `'unsafe-inline'` and no
  `'unsafe-eval'`: index.html's inline script and loader `<style>` are
  allowed by `sha256-` hashes of the **built** index.html (Vite minifies
  the style), the JSON-LD block is data and needs none. What it allows,
  and why:

    | Directive     | Source (beyond `'self'`)                                 | For                                                                          |
    | ------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
    | `script-src`  | `https://www.googletagmanager.com`                       | gtag.js (index.html, production only)                                        |
    |               | `https://maps.googleapis.com`                            | Maps JS API + Places modules and their JSONP calls                           |
    |               | `https://us-assets.i.posthog.com`                        | PostHog's remote config (and recorder/surveys if enabled)                    |
    | `connect-src` | `<VITE_SUPABASE_URL>`                                    | REST, auth, functions, storage uploads                                       |
    |               | `<VITE_SENTRY_DSN host>`                                 | Sentry errors, spans, replays                                                |
    |               | `https://us.i.posthog.com`, `https://us-assets…`         | PostHog events, flags, config fallback                                       |
    |               | GA: `www.googletagmanager.com`, `*.google-analytics.com` | GA4 hits (`analytics.google.com` is under `*.google.com`)                    |
    |               | `*.google.com`, `*.g.doubleclick.net`                    | GA4 with Google Signals (`stats.g.doubleclick.net`)                          |
    |               | `https://maps.googleapis.com`                            | the Maps loader's `gen_204` pings                                            |
    | `img-src`     | `<VITE_SUPABASE_URL>`, `blob:`                           | bio photos (storage public URLs); cropper previews                           |
    |               | GA's `img-src` list + `*.google.co.il`                   | GA4 Signals pixels (`www.google.co.il/ads/ga-audiences`)                     |
    | `worker-src`  | `blob:`                                                  | Sentry replay's compression worker, heic-to's decoder (`/sw.js` is `'self'`) |

    `font-src`, `manifest-src` and `style-src` are `'self'` only, plus the
    loader's hash in `style-src` (fonts are self-hosted; React `style` props are set through the CSSOM, which
    CSP doesn't block, so they are fine; a `style="…"` in HTML, an `on…=`
    handler or a `<style>` injected by a library is not). `frame-src` and
    `object-src` are `'none'`. Navigations (Google OAuth's redirect, wa.me,
    maps and calendar links, `target=_blank` links) aren't CSP's business.
    Violations are reported (enforced, not report-only) to Sentry's
    security endpoint for the DSN's project (`report-uri` plus `report-to`
    and its `Reporting-Endpoints` header), tagged `production` or
    `preview`; they show up in Sentry as CSP issues.
    - **Production and previews**: the common headers go to every host;
      the policy rule for production matches every host but
      `*.vercel.app` (`missing` host `{ suf: ".vercel.app" }`), the
      preview rule only those (`has`), so exactly one CSP is ever sent.
      The preview policy is production's plus what Vercel's toolbar needs
      (`vercel.live`, `vercel.com`, `assets.vercel.com`,
      `wss://ws-us3.pusher.com`, `data:` images, `'unsafe-inline'` styles
      instead of the style hash); `--write` makes it from production's and
      the check fails on any other difference. Edit only the production
      rule.
    - **Installed apps get header changes**: the service worker precaches
      index.html with the headers it was served with, so its precache
      revision carries a hash of vercel.json's header rules
      (`scripts/headers-revision.mjs`, a `manifestTransforms` in
      vite.config.ts); `check:sw` fails if it doesn't. A deploy that
      changes only vercel.json's headers still updates every PWA.
    - **Adding an origin** (a script, a request, an image host, a frame, a
      worker): add it to the narrowest directive in `vercel.json`, in the
      table above, and, if it comes from the env, to
      `configuredOrigins` in `scripts/check-headers.mjs`. Never add
      `'unsafe-inline'`/`'unsafe-eval'`, a bare `*`/`https:` or `data:` in
      `script-src` (the check fails). Prefer exact hosts; use a `*.`
      wildcard only where the vendor documents one.
    - **Changing index.html's inline script or `<style>`**: build, then
      `node scripts/check-headers.mjs --write` updates the hashes (and the
      preview policy); build again so the precache revision follows.
    - **The check** (`npm run check:headers`, run by `npm run build`, so
      by Vercel builds and CI's build step): the headers exist with sane
      values, the CSP parses and stays strict, its hashes are exactly the
      built index.html's, the preview policy is production's plus the
      toolbar's, reports go to the DSN's Sentry security endpoint, the
      scripts index.html loads are allowed, any asset the build inlined as
      a `data:` URL (telemetry chunks included) is allowed (`img-src` has
      no `data:`), and the Supabase, Sentry and PostHog origins of the
      build's env are allowed (skipped when unset, as in CI).
    - **Verifying**: serve `dist/` with vercel.json's headers and the SPA
      rewrite (Vercel serves files first, then rewrites everything but
      `/assets/`), and watch the console for `Content Security Policy`
      errors. PostHog, GA and Speed Insights run only on
      `www.ci-events.org`: map that host to the local server
      (`--host-resolver-rules`), and answer the ingest requests locally so
      no test data reaches them.
      Previews (`*.vercel.app`, HSTS-preloaded) need local HTTPS (a
      self-signed certificate, `--ignore-certificate-errors`). Point the
      report URLs at the local server too: Chrome delivers reports about a
      minute after the violation.
    - **Limits**: an allowlist policy is only as strong as its hosts. On
      an HTML injection, `https://www.googletagmanager.com` in
      `script-src` lets an attacker load any GTM container (theirs, with
      their own tags); `maps.googleapis.com` serves JSONP endpoints,
      which run attacker-chosen callbacks; `*.google.com` in `connect-src`
      lets injected script send data out through `script.google.com` (Apps
      Script). The hardening to come is a policy that trusts no hosts for
      scripts: `'strict-dynamic'` with the inline script's hash (it loads
      gtag and the app could load Maps and PostHog through it), or
      per-request nonces, which need index.html rendered per request (edge
      middleware).

## Cloudflare hosting and the edge cache (spec #37)

The app is ready to move from Vercel to Cloudflare Workers, served from
Cloudflare's Tel Aviv data centre (about 28 ms to the first byte from
Israel, against about 220 ms from Vercel's Frankfurt). Until DNS moves,
Vercel stays production and every change must keep working there: the same
commit builds and runs on both. The deploy, variables, previews, custom
domains and rollback are in `docs/cloudflare.md`. Unlike spec #37, the
repository stays one package for now: the monorepo move waits for the
mobile app (#36).

- **Hosting.** `wrangler.jsonc`: the Vite build (`dist/`) as static
  assets, any path that isn't a file falling back to the SPA shell
  (`not_found_handling: "single-page-application"`), and a Worker
  (`worker/index.ts`) that runs first only for `/api/*`
  (`run_worker_first`). Every other request is a static asset: no Worker
  invocation, no cost. One difference from Vercel: a missing `/assets/…`
  or `/.well-known/…` file gets the SPA shell (200 HTML, with the
  `/assets/*` immutable header) instead of a 404. A stale chunk still
  fails to import (a module served as `text/html` is refused, under
  `nosniff`), so the app's stale-chunk handling is the same.
- **Headers.** `public/_headers`, which the build copies to
  `dist/_headers`, carries vercel.json's headers. Cloudflare's file can
  only match URLs, but a URL may name a host, so: every path (`/*`) gets
  the security headers and the CSP reporting to Sentry as `preview` (on
  every host: `*.workers.dev` previews, `wrangler dev`); the production
  hosts (`https://www.ci-events.org/*`, `https://ci-events.org/*`)
  detach those two headers (`! Content-Security-Policy`, or both values
  would be sent, joined) and set production's policy, which is
  vercel.json's exactly. No Worker is needed for headers. There are no
  Vercel toolbar sources on previews (there is no toolbar). `/assets/*`
  is cached a year, immutable; index.html and sw.js keep Cloudflare's
  default (`max-age=0, must-revalidate`). Headers in `_headers` apply to
  static assets only; the Worker sets its own. `check:headers` checks the
  file (Cloudflare's syntax and limits: 100 rules, 2,000 characters a
  line) and runs every policy in it through the same checks as
  vercel.json's; `--write` updates both files; the precached shell's
  revision covers both (`headers-revision.mjs`), and `check:sw` checks
  the out-of-precache chunks are immutable on both hosts. While Vercel is
  kept, edit the CSP in vercel.json and run `--write`; when Vercel is
  retired, `_headers` becomes the only copy.
- **The edge-cached public window.** `GET /api/public-window`
  (`worker/publicWindow.ts`) answers `{ start, end, rows }`: the window's
  first and last day (today in Asia/Jerusalem through `WINDOW_DAYS`, the
  client's constants) and the rows in their PostgREST shape, from the
  client's own select (`selectPublicWindow`: `hide = false`, public bios
  only). The Worker queries Supabase with the anon key only, through the
  client's own data client with no token source; it never reads the
  caller's Authorization header or cookies, so nothing signed-in is ever
  cached and RLS's hidden-row guarantee holds for the cached copy. It is
  kept in Cloudflare's Cache API (per data centre) keyed by the window's
  first day: fresh for 60 s; then served stale for up to 10 minutes while
  one background refresh runs (`ctx.waitUntil`; concurrent requests in an
  isolate share it, isolates don't coordinate); a failed refresh keeps the
  copy, served until it is 10 minutes old (`MAX_SERVE_AGE_MS`); with no
  usable copy the request waits for Supabase (aborted after 5 s,
  `UPSTREAM_TIMEOUT_MS`, so a hung read can't block the isolate) and, if
  that fails, gets a 502. Stale-while-revalidate is a deliberate trade
  (decision 2026-10-31): the first visitor after a quiet spell gets the
  old copy at once rather than waiting for Supabase. Browsers get
  `Cache-Control: no-store`: the client's query and persisted caches own
  freshness. `X-Edge-Cache` (`HIT`, `STALE`, `MISS`) shows what happened.
  Cloudflare documents the Cache API for custom domains, but it stores on
  `*.workers.dev` too (checked 2026-10-31: MISS, then HIT).
- **Writes don't purge the edge cache.** Only signed-in users write, and
  they never read the edge: their window is the direct select, so a
  refetch after their save (or a reload, or another device of theirs)
  can't bring back a copy from before it. Other visitors see a change
  within 60 seconds while the site is busy, and within 10 minutes after a
  quiet spell. Without realtime that is acceptable.
- **`services.publicFeed`** (`PublicFeed`,
  `features/calendar/publicFeed.ts`) is where the public window comes
  from; `publicWindowQuery` reads it, and its mapping, freshness rules and
  persisted-cache shape are unchanged. On the web (`edgePublicFeed`), for
  a visitor who isn't signed in (`auth.session()`), it reads the
  same-origin endpoint (no credentials) and falls back to the
  direct select (`directPublicFeed`, with the token at hand, as before) on
  any error: an error status, no network, a body that isn't a window
  (`parsePublicWindowRows`), or no answer within 3 s (`EDGE_TIMEOUT_MS`).
  On Vercel there is no Worker: the path is the SPA shell (200 HTML), not
  a window, so it falls back. That costs a same-origin round trip before
  the Supabase read on every cold start on Vercel, which is why the switch
  should follow this soon. Single-event lookups and every personal or
  admin query still go to Supabase directly. Tests read the fake's data
  through the same select (`directPublicFeed`), or pass `renderApp({ edge
})` (Tests).

## Maintainer notes

- **Toolchain: Node 22** (`.nvmrc` 22 for CI, `engines` `22.x` for
  Vercel, which overrides the dashboard's Node.js setting; Vitest 5 needs
  22.12+). Move both together. `vite.config.ts` is typechecked
  (`tsconfig.node.json`). Source maps are made only when
  `SENTRY_AUTH_TOKEN` is set, and the Sentry plugin deletes them after
  upload; `check:sw` fails if any is left in `dist/`.
  Vite 8 bundles with Rolldown: build options live under
  `build.rolldownOptions` (the telemetry `chunkFileNames`), and
  console/debugger calls are dropped by its minifier
  (`output.minify.compress`, production builds only; the old `esbuild`
  option is gone). Modules `/` shares with lazy chunks (React, React
  Router, some app modules) are their own chunks, all `modulepreload`ed
  by `index.html`; `check:bundle` sums them. Held back (not trivial):
  ESLint 10 (eslint-plugin-jsx-a11y doesn't support it),
  eslint-plugin-react-hooks 7 (React Compiler rules flag six effects),
  TypeScript 6/7, jsdom 29 (accessible names lose the space between
  inline spans, which one test matches) and posthog-js 1.444 (its chunk
  grows from ~52 to ~101 KB gzip).

- **Bio photos: check the bucket, apply the storage migration.** The
  client uploads JPEG as `image/jpg` (legacy's type, the one known to be
  accepted), at most ~30 KB. Check the bucket accepts it:
  `select allowed_mime_types, file_size_limit from storage.buckets where
id='ci_bio_profiles'` (null means any). `profile` users (teachers
  without event rights) can't upload yet: storage's write policies
  require `has_creator_role()`.
  `supabase/migrations/20261030120000_bio_photos_for_profiles.sql` adds
  insert and delete policies on that bucket for `has_profile_role()`,
  own folder only; apply it by hand. Until then the page tells them the
  photo can't be uploaded and saves the rest.
- **The CSP (Rules, "Security headers and the CSP"): what to check.**
  The builds' env must match `vercel.json`: `npm run build` fails on
  Vercel if a preview or production env points at another Supabase
  project, Sentry DSN or PostHog host than the CSP allows (add it, or
  give previews the same values). Address suggestions were never seen
  under the CSP: the local `.env` Places key is invalid
  (`InvalidKeyMapError`), so Google's scripts loaded but no prediction
  came back; after the first deploy, type an address in a form and check
  the console. The GA property has Google Signals on (its
  `ga-audiences`/doubleclick pixels are allowed for google.com and
  google.co.il only; visitors on other Google domains get a blocked
  pixel); turning Signals off would let those sources go. PostHog's
  session recording and surveys are off; turning surveys on may need
  `style-src` for its injected styles (check the console; Sentry's CSP
  issues will show it too). The host conditions (`has`/`missing` host
  `suf`) were checked against a local imitation of Vercel's rules: on the
  first preview, check that `vercel.live` loads and that production's
  response carries one `Content-Security-Policy`. Previews on a custom
  alias domain get production's policy (no toolbar). HSTS has no `preload`: submitting ci-events.org to
  hstspreload.org (and adding `preload`) commits every subdomain to
  HTTPS for good, so it is the owner's call.

- **Check the event write policies and the junction's delete rule**
  (`docs/cutover.md`). Admins' updates and deletes of others' events (slice 20)
  are untested against the live database: legacy's admin delete never
  reached it, and the RLS check of 2026-08-08 verified SELECT only. Run

    ```sql
    select policyname, cmd, qual, with_check from pg_policies
    where tablename in ('ci_events','ci_events_users_junction');
    ```

    and check that UPDATE and DELETE on `ci_events` allow `has_admin_role()`
    (as well as the owner), and DELETE on `ci_events_users_junction` the
    event's owner and admins. Then

    ```sql
    select confdeltype from pg_constraint
    where conname = 'ci_events_users_junction_ci_event_id_fkey';
    ```

    (`c` cascade, `a`/`r` no action/restrict): with `c` a delete removes
    the tags itself; otherwise the client deletes the tags first on the
    database's refusal (an extra request). Until checked, a refused admin
    write shows "not allowed, or changed meanwhile" and changes nothing.

- **Deleting a template keeps its events** (maintainer decision,
  2026-10-31). Legacy's foreign key (`ci-events_source_template_id_fkey`)
  is believed to cascade, deleting every event made from the template (384
  of the 782 visible events reference one). The client now unlinks the
  events before deleting the template, so they stay whatever the rule, and
  deletes the upcoming ones only when the user ticks it in the confirm.
  `supabase/migrations/20261031120000_template_delete_keeps_events.sql`
  makes the key `ON DELETE SET NULL`, so a delete from anywhere else keeps
  them too.

## Tests

Behaviour tests render the real app with `renderApp()` from `src/test/` and a
seeded fake backend. They assert what the user sees and what was requested of
the backend, never cache keys or hook calls. The core's modules (queries,
saves, cache rules, pure logic) are tested directly, in the core, on Node.
Test-only helpers never live in a feature folder:

- **The fake backend kit is shared**, in the core's `src/testing/`
  (`@ci-calendar/core/testing/<module>`): `fakeDataClient` (the tiny
  PostgREST), `fakeAuth`, `fakeRpc`, `fakeFunctions`, `fakeFiles`,
  `fakePlaces`, `fakeEdge`, `testUsers` and `testEvents` (rows and events
  to seed). It never imports a test runner (the mobile app will run it
  under Jest) and is checked with Node's types. Its own tests
  (`fakeDataClient.test.ts`) pin the filters every query relies on.
- **The web's own** stay in `src/test/`: `renderApp`, `setup.ts`, the
  browser conditions, `fakeImages`, `fakeUpdates`, `fakeTelemetry`, the
  realtime guard, and `testEvents.ts`'s screen helpers (the calendar's
  titles and cards). `src/test/fakeDataClient.ts` is the core's fake plus
  the web's `images`, so `createFakeDataClient()` there gives a web test
  everything `renderApp` needs.

- **No realtime:** `setup.ts` puts `ForbiddenWebSocket`
  (`test/realtimeGuard.ts`) in place of `WebSocket`: constructing one
  throws and is recorded, and an `afterEach` fails the test that did it,
  even if the code caught the error.

- **Repeat visits:** pass the same `storage` (`createMemoryStorage()`) to two
  `renderApp` calls, unmounting the first. `buildVersion` simulates a deploy.
  Reset `<html lang dir>` to `he`/`rtl` between them, as a reload starts
  from `index.html` (`setup.ts` does so after each test).
- **Embedded resources:** the fake joins embeds through the foreign keys in
  its `RELATIONS` map (`ci_events.users` is the creator) and applies dotted filters to the embedded rows, as
  PostgREST does; add a relation there when a query embeds a new one. It also
  supports `neq`, `lt`, `gt`, `in`, `is` / `not(column, "is", value)`
  (SQL's `IS`, so `closed IS NOT TRUE` matches `null`), `or()` with
  PostgREST's logic tree (`a.lt.1,and(a.eq.1,b.lt.2)`), several `order()`s,
  `limit`, `range`, `single()` and `maybeSingle()`; a recorded request's
  `order` is the list of them, `limit` and `range` as set. `delete()`
  removes the filtered rows and returns them.
  An insert naming a missing row through a key in `FOREIGN_KEYS`
  (`ci_events.source_template_id`) fails with `23503`, as Postgres'; so
  does deleting a row still referenced through `REFERENCED_BY`
  (`ci_events_users_junction.ci_event_id`: no cascade, the rule the
  schema dump shows).
  An insert returns the row as stored, with the sequence columns in
  `SERIAL_COLUMNS` filled (`requests.number`; send ids from the client,
  `crypto.randomUUID()`); an update returns the rows its filters matched
  before it changed them, as `RETURNING` does. `renderApp` returns the
  `router`, to assert the URL.
- **Dialogs:** jsdom lacks `showModal()`/`close()` and Escape-to-close;
  `src/test/setup.ts` stands in for them, so `userEvent.keyboard("{Escape}")`
  closes the topmost dialog as in a browser.
- **Browser conditions:** `src/test/browser.ts` sets a phone width
  (`setViewportWidth`; `setup.ts` answers `matchMedia` width queries from
  `window.innerWidth`), the installed app (`setStandalone`), an iPhone user
  agent, a service worker with caches (`installServiceWorkerAndCaches`),
  and fires Chrome's install offer (`offerInstall`). `setup.ts` resets them
  after each test.
  `vi.stubEnv` (e.g. `VITE_HIDE_EVENTS_FLAG`) lasts one test.
- **Auth:** `fake.auth` (`@ci-calendar/core/testing/fakeAuth`) is the fake's Supabase
  auth: accounts (`fake.auth.accounts`), a session with tokens
  (`token-<user id>-<n>`), every call that would reach the auth server in
  `fake.auth.calls` (refresh, sign-in, sign-up, reset, update, sign-out),
  `fail(method, { message, code })`, `holdRefresh`/`releaseRefresh`,
  `started` (auth-js asked for), and redirects: `startRedirect()` (session
  unknown) then `finishRedirect(account | null)`, or `failRedirect(error)`
  before boot. `fake.beforeExecute(fn)` runs before each request is
  answered (another tab writing first); inserts of an existing `id` fail
  with `23505`; `update` applies to the filtered rows. `renderApp({ signedInAs: testUser(role) })`
  (`@ci-calendar/core/testing/testUsers`) boots with that session stored and seeds the
  `users` row (`userRow`); add `tokenExpired: true` to need a refresh
  first. Each recorded data request has the `token` it was sent with (`null`
  = anon key), its `method` and, for inserts, the `body`;
  `fake.rows(table)` seeds or reads a table live.
- **Storage and images:** `fake.files` (`services.files`) records
  `uploads` (path, the Blob, content type, token) and `removals`, keeps
  `objects`, and `fail(message, { denied })`s uploads; public URLs use
  `FAKE_SUPABASE_URL`/`FAKE_BUCKET`.
  `fake.images` (`services.images`) counts `cropperLoads`, its stand-in
  cropper reports `cropArea` (jsdom can't lay out react-easy-crop), and
  records `renders` (image, area, size, the Blob returned:
  `outputType`/`outputBytes`). `setup.ts` stands in for
  `URL.createObjectURL`/`revokeObjectURL` (`blob:test/<n>`), with the
  live ones in `liveObjectUrls`. An insert repeating a column in
  `UNIQUE_COLUMNS` (`public_bio.user_id`) fails with `23505`.
- **Edge Functions and Places:** `fake.functions` records each `invoke`
  (`calls`: name, body, token); a function answers through
  `handle(name, handler)` (`fakeTranslation` makes `"<text> [<lang>]"`)
  and fails without one (`fail(name)` too); `hold(name)`/`release(name)`
  delay it. `fake.places` (`services.places`) counts `loads`, suggests
  seeded `places` whose label contains the input, and records `calls`
  with their session (a number per `session()`, `null` outside one);
  `failEnglish()`, `hangEnglish()` (never answers) and `healEnglish()`
  steer English lookups. Timeouts: fake timers with `shouldAdvanceTime` keep user-event working, and `advanceTimersByTimeAsync(LOOKUP_TIMEOUT_MS)` skips a hung lookup. `insert([...])` adds several rows
  (recorded as `rows`, not `body`), each given an `id` if it has none.
  Translations are remembered per session; `setup.ts` forgets them after
  each test.
- **Database functions and counts:** `fake.rpc` (`@ci-calendar/core/testing/fakeRpc`,
  the client's `rpc(name, args)`) records `calls` (name, args, token);
  `assign_user_role` behaves as its migration (admin callers only, by
  `user_roles` role 1 or a `users` row of type admin; writes the three
  tables; answers `{ user_id, role_id, user_type }`); `handle(name,
handler)` adds a function, `fail(name, { message, code })` / `heal`
  steer one, `hold`/`release` delay it. `select(columns, { count, head
})` answers with `count` (and no rows with `head`), recorded as the
  request's `count` and `head`. `ilike` (PostgREST's `*` wildcard, LIKE's
  `\` escape) works at the top level and in `or()`, whose values may be
  double-quoted; `or()` also takes `is.null|true|false`.
- **Slow network:** `fake.holdTable(table)` holds requests until
  `fake.releaseTable(table)`; `failTable`/`healTable` make them fail
  (the server's error, HTTP 500; `{ network: true }`: no answer, status
  0, as postgrest-js reports a failed fetch). Results carry `status`
  as PostgREST's (200, 201, 406, 409).
  `fake.holdReads(table)` holds only reads, letting writes through: what
  the pages show after a write then comes from its answer in the cache
  (the edit forms' tests hold `ci_events` reads before saving, then check
  the calendar and my events and count the reads since).
  `fake.answerLate(match)` answers the next matching request with the data
  as it is when sent, delivered when the returned function is called (a
  response from before a write that lands after it).
- **Updates:** `renderApp({ updates: sw.updates })` with
  `sw = createFakeUpdates()` (`src/test/fakeUpdates.ts`); `sw.announce()`
  reports a new version, `sw.activations` counts handovers, and `reloads`
  (from `renderApp`) counts reloads. `setPageVisibility("hidden" |
"visible")` (`src/test/browser.ts`) sends the page away and back.
  `renderApp({ routes })` swaps in stand-in routes for app-wide behaviour no
  real page exercises yet (a form blocking reloads, a lazy file that is
  gone); `session` (like `storage`) carries sessionStorage across two
  renders, i.e. a reload.
- **Telemetry:** `renderApp({ telemetry: sinks.telemetry })` with
  `sinks = createTestTelemetry(options)` (`production`, `productionSite`,
  `storage`, `blocked`)
  (`src/test/fakeTelemetry.ts`) runs the real `createTelemetry` with
  in-memory Sentry/PostHog/Speed Insights; they "load" when the test calls
  `await sinks.arrive()`, then `errors`, `pageViews`, `events`,
  `speedRoutes`, `tracedRouters` and `loaded` show what was sent;
  `blocked: ["posthog"]` makes an SDK fail to load as Vite reports it.
  Without it, tests get
  `NO_TELEMETRY`. Nothing reaches the network.
- **The edge:** `renderApp({ edge: createFakeEdge(backend, now) })`
  (`@ci-calendar/core/testing/fakeEdge`) reads the window from a fake
  `/api/public-window` answered from `backend`, a fake data client of its
  own (seed it apart from `fake` to tell where the events came from), put
  through the same select; `edge.answer(…)` makes it fail each way the
  page must survive (`spa-shell`, `not-found`, `server-error`,
  `network-error`, `not-a-window`, `hang`), and `edge.requests` records
  what the page sent. The Worker is tested at its HTTP boundary
  (`worker/publicWindow.test.ts`): a request in, the response and the
  fake data client's recorded requests out, with an in-memory cache and
  clock (plain vitest; Cloudflare's Vitest pool needs Vitest 4).
- **Freshness:** staleness is measured with `Date.now()`, so fake only the
  clock (`vi.useFakeTimers({ toFake: ["Date"] })`) and advance it with
  `vi.setSystemTime`. Dispatch `visibilitychange` (overriding
  `document.visibilityState`) and `online`/`offline` on `window`.
  `src/test/setup.ts` resets the online/focus managers after each test.

## Slices so far

1. Walking skeleton: shell, data router, 404, `AppServices`, fake data
   client, public window (`/`, one request at boot, no auth wait), bundle
   size check in CI.
2. Instant repeat visits and freshness: the public window is persisted
   (shape-checked, stale after a deploy) and rendered from storage at boot,
   past days are dropped at read, refetch on visible-when-stale and on
   reconnect, offline/stale notice.
3. Event cards, details and deep links: legacy event cards (sorted by day and
   time, cancelled marked), full details with teacher bios in a lazy native
   `<dialog>`, `/event/:id` and `/:shortId` links (window first, else one
   by-link request; unknown or hidden → 404); junction backfill migration.
4. Filters and views: event-type and district filters in the URL (`f`,
   legacy encoding, last choice restored from storage) through a drawer or
   modal, chips and clear-all; list/calendar toggle and a native month grid
   over the window, days marked from a precomputed day → events map.
5. Languages: Hebrew, English and Russian copy for everything so far
   (`defineCopy`/`useCopy`, `counted`, `COMMON_COPY`), the legacy flag
   switcher (`VITE_LANGUAGES_TO_SHOW`), `<html lang dir>` and `<title>`
   following the choice (kept under legacy's `language` key), translated
   titles (`lng_titles`, added to the window) and English addresses, `Intl`
   day formats and plurals per language, LTR mirroring.
6. Shell, static pages, banners and fonts: legacy's background, header
   (home, flags, WhatsApp link, offline cloud, menu; login waits for slice 9) and role-keyed menu for signed-out visitors; impossible event links
   404 without a request; lazy `/about` (now in three languages),
   `/privacy-policy` and `/terms-and-conditions` (Hebrew text, as legacy),
   page footer with the reset-the-app button (storage, service workers,
   caches); PWA install banner
   (`beforeinstallprompt`, iOS/Android steps, dismissal kept); subset
   woff2 Assistant, preloaded, `font-display: optional`; one module per
   icon; `index.html`
   cleaned (one viewport/manifest/description, GA after load, no logs).
7. Service worker and safe updates: `/sw.js` from `src/sw/sw.ts`
   (injectManifest, own tsconfig), precaching only the shell and build files
   (revisioned per file), no runtime caching, navigations to the cached
   `index.html`; replaces legacy's worker in place, deletes its caches and
   reloads open legacy pages; `BUILD_VERSION` moved to an `index.html` meta
   tag so unchanged chunks keep their hashes; registered after load and
   idle; a new version is handed over when the page is left and reloaded in
   on return, held off by `useBlockReload`; stale-chunk recovery (one guarded
   reload, else a reload button); assets 404 and immutable on Vercel;
   `check:sw` in CI.
8. Observability: `services.telemetry` captures errors from boot and
   buffers them; Sentry (legacy's config, release = `BUILD_VERSION`) loads
   after first paint and idle, then data-router tracing and fully masked
   replay; route and unrecovered stale-chunk errors reported once (stale
   chunks now recovered in `RouteError` only, so failed SDK loads never
   reload); PostHog page views per location and Speed Insights by route
   pattern, production host only and never on `isInternal` devices; auth
   secrets scrubbed from every URL sent; SDK chunks in `assets/telemetry/`,
   not precached; `identify`/`reset`/`setInternal` for slice 9.
9. Auth and roles: `services.auth` on `@supabase/auth-js`, the session read
   from legacy's storage key at boot with no network and auth-js loaded on
   demand; data requests carry the token at hand, personal queries await
   `auth.ready()`; signed-in boot adds only the profile row (created when
   missing, as legacy), identify and the internal flag; `/login` (Google,
   password), `/signup`, `/reset-password-request`, `/reset-password`
   (implicit-flow recovery link); menu and header by role (login link,
   user name); `requireRole` guard; sign-out ends the session (global, else
   local) and forgets personal queries, keys, sessionStorage and the
   telemetry user, here, from another tab (storage event) or when an auth
   redirect brings another account; redirect tokens read and cleared from
   the URL at boot (`setSession`), expired links explained; signed in
   without a loadable profile still offers sign-out and a retry; the sign-in
   and build recorded on `users` once per boot; lint bans supabase-js.
10. Shared form foundation: `useForm` over a pure reducer (`lib/form.ts`:
    deep, ordered comparison with unordered list fields, path-keyed errors
    and touched paths, server errors, draft restore, the merge of saved
    values that keeps edits typed during a save) with `handleSubmit`'s
    re-entry guard and the reload guard built in; form fields, chips,
    switch, alert and buttons in `src/ui/form`. The weekly-schedule
    settings (legacy's `/filters-and-notifications`, story 36) were dropped
    as unused: legacy took the page out of production and the WhatsApp
    sender isn't running (confirmed by the maintainer 2026-10-31, who also
    had the header's WhatsApp link removed).
11. My requests: `/request` (signed-in roles) and `/bio/request` (profile
    roles), each with an optional `:requestId` in one route (so opening
    another request keeps the page), lazy; legacy SupportPage: the user's
    role and a role-request form (`RequestForm`, the first form on
    `useForm`) offering creator/org minus their own role (legacy's Israeli
    phone rule, required message; not while a request is open, legacy's
    guard), the open request with edit (type, phone and message only) and
    cancel (closed, with legacy's Hebrew note), both only while it is still
    open; plus legacy's unused RequestsList (type, status, date; a tap or
    the URL's id opens the number, message and admins' responses). The
    list is a personal query; creating and editing put the stored request
    in it, and an empty `users.phone` takes the request's phone (an update
    filtered on `phone = ''`, legacy's backfill). A request closed by an
    admin while the user edits or cancels it is left alone, with a notice.
    Support requests stay email only, as in legacy. `requireRole` routes
    are lazy, so the guard is off `/`.
12. Manage my events: `/manage-events` (creators, orgs, admins; lazy,
    guarded), legacy ManageUserEventsPage: the user's own (`user_id`)
    upcoming events, hidden ones included, fetched when the page opens;
    past ones only on "עבר", newest first, 20 per page with "load more"
    (keyset). Rows show title, days, hidden and cancelled; open, the event's
    details (`EventDetails`, inline as legacy) and, for upcoming events,
    legacy's actions: edit (links to the slice 13/14 routes), delete, cancel
    with a note (80 characters) or restore, hide or show; delete and hide
    offer the later events of a recurring series (from the user's upcoming
    events). Writes are owner- and state-conditional, and their responses
    update the calendar window (persisted), shared links and the lists
    through `applyEventChanges`, the module every later event write reuses
    (lists register themselves; refetches in flight are redone). The
    window now stores the range it was fetched for (persisted shape 3), and
    `useToday` lets `select` drop passed days after midnight. The fake
    gained `lt`/`gt`/`in`/`or`/`limit`/`range`/`delete`, multiple orders
    and `answerLate` (an answer computed when sent, delivered later).
13. Single-day event form: `/create-events` (legacy's chooser, the
    missing-bio warning), `/create-events/single-day` and
    `/manage-events/edit-single-day/:eventId` (lazy, creator/org/admin; a
    loading bar while a route's code downloads). Legacy's form on
    `useForm`: title, description, district, Google Places address (the
    script loads when the field is focused), native date and time inputs,
    organisations, segments (type, times, teachers tagged or typed, audience
    tags), links, prices and a hide (draft) switch, with legacy's rules as
    path-keyed errors. Saves translate the title (`translate` function,
    through the new `services.functions`) and look up the English address
    in parallel, never blocking; create inserts with a client id, edit
    updates the changed columns of the user's own event; tagged users get
    junction rows; the stored event updates the calendar, shared links and
    my events at once (`applyEventChanges`). Unsaved values are kept on the
    device (personal keys, only the changed fields) and restored. Shared parts (values, segment,
    link and price fields, `TagPicker`, `AddressField`, saves, drafts) for
    slices 14–16. The event details now machine-translate what legacy did
    in English and Russian.
14. Multi-day event form: `/create-events/multi-day` and
    `/manage-events/edit-multi-day/:eventId` (lazy, creator/org/admin),
    legacy's MultiDayEventForm on slice 13's parts: title, description,
    district, address, first and last day, multi-day type, teachers and
    organisations (tagged or typed), links, prices and the hide switch
    (new here: legacy's multi-day form always saved visible); legacy's
    rules plus end-before-start; rows as production's legacy-made ones
    (`is_multi_day`, empty segments, `multi_day_teachers`, `owners`, junction
    rows), so the calendar shows them on every day they span. Shared form
    head/footer/page frames, the submit flow (`useEventSubmit`) and the
    taggable hook pulled out of the single-day form; a select shows its
    placeholder for a value it doesn't offer; all event-form pages are one lazy chunk, so `/` got
    smaller (135.1 KB).
15. Recurring events: a new single-day event can repeat (legacy's weekly,
    bi-weekly, monthly and monthly-by-weekday, until an end day up to a
    year ahead, the days listed as chosen; kept in the draft): pure
    expansion on Jerusalem days (legacy's caps; a missing fifth weekday
    skipped instead of spilling into the next month), one row per day with
    its own id and segments on its own day across clock changes, one
    shared `recurring_ref_key`, the title and address looked up once, one
    insert and one junction insert, all into the cache. Editing an event
    with later events in its series asks which of them change too (legacy's
    "all" or a pick, or just this one): only the changed columns, never
    their dates, hide or cancellation, segments re-dated per event, owner-
    and series-scoped writes, responses into the cache. The event actions'
    confirm dialog moved to `features/events/ActionDialog.tsx` for reuse.
16. Templates: `/create-events` lists the user's templates (read when it
    opens, newest first) with the new-event and new-template choices
    (legacy's four, merged on 2026-10-31: one form switched between
    single-day and multi-day), the no-templates
    warning, edit (the template's form in a drawer or modal) and delete
    (legacy's confirm); `?isTemplate=true` on the new-event pages saves a
    single-day or multi-day template (name, the event's fields without
    days or hide; their own drafts). The new-event forms' "בחירת תבנית"
    fills the form from a template of its kind and the event is saved
    with `source_template_id`. Template writes update the list from the
    answer; nothing about templates loads at boot.
17. Bio editor: `/bio` (profiles, creators, orgs, admins; lazy, guarded),
    legacy BioPage: the bio as visitors see it, or legacy's ProfileForm
    (name, about, two links, photo; its rules and draft, text only), and
    the settings (role, tagging and, new, show-profile switches saved at
    once). The user's own row loads when the page opens; saves write only
    the changed columns of it, or create it as legacy's upsert did, and
    their responses update the bio, the tagging list and every cached
    event embedding it (a bio switched off leaves the persisted window at
    once). Photos: react-easy-crop loaded when one is picked, the crop
    resized on the client (600px JPEG within legacy's 30 KB, sent as
    legacy's `image/jpg`) and kept in
    memory as a Blob (never base64 in storage, #23; object URLs revoked),
    uploaded with storage-js (`services.files`, lazy) to legacy's bucket
    and path. `useFormDraft` moved to `app/`; legacy's base64 photo key is
    removed at boot.
18. Admin users and roles: `/manage-users` (admins; lazy, guarded; the
    first page of the one admin chunk, `features/admin/pages.ts`), legacy
    ManageUsersPage: search by name or email on the server (debounced,
    escaped `ilike` in one `or()` tree), 20 users a page newest first with
    "load more" (keyset on `created_at`, `id`), a user's details (phone
    copied on tap, role from `user_roles`) and legacy's five role buttons,
    and the account counts (counting `HEAD` requests, not the rows).
    Nothing of it at boot, persisted or kept after sign-out; refetched on
    mount, from the first page when the app comes back stale, and by a new
    refresh button. Roles change only through `assign_user_role`, whose
    answer updates the row in every cached search and the counts (no list
    refetch; a fetch in flight is redone); failures say so and are
    reported; demoting oneself asks first. The fake gained `rpc`, `ilike`,
    quoted logic-tree values and counts. Admin conventions (one chunk,
    freshness, refresh, server-side search) for slices 19–20. Drafts are
    now restored before the first paint (a layout effect): the flash of
    an empty form, and the templates tests' flake, are gone.
19. Admin support requests: `/manage-support` (admins; lazy, guarded; in
    the admin chunk), legacy ManageSupportPage: open or closed requests
    (legacy's switch; the closed ones read only when first shown) filtered
    by type on the server, 20 a page newest first with "load more", each
    opening to its number, email, phone (copied on tap), message, the
    responses (new) and a reply form (new; legacy's was commented out);
    legacy's approve (the role through `assign_user_role` first, then the
    request closed with its note; a failed role change leaves it open) and
    decline, and reopen (new; not while the user has another open
    request). Open and closed follow the user page's rule (`closed` or
    `status`, shared in `requests/requestRows.ts`). Writes are conditional on the request being
    as the admin saw it, so a user's cancel is never overwritten; their
    answers move the request between the cached lists without a refetch,
    and a fetch in flight is redone. Nothing at boot, persisted or kept
    after sign-out; refetched on mount, when the app returns stale, and by
    the refresh button.
20. Admin manage all events: `/manage-all-events` (admins; lazy, guarded; in
    the admin chunk), legacy ManageEventsList: every creator's events from
    today on, hidden ones included (legacy's list dropped them), 30 a page
    with "load more", filtered on the server by creator (legacy's
    multi-select, as a `TagPicker`; the creators read only on this page,
    two small columns) and by title (debounced `ilike`); rows show the
    creator. Legacy's actions on anyone's event: hide or show and delete
    (with the owner's later events of a series), cancel with a note or
    restore, and edit, which opens the edit forms for any event for an
    admin (owner-scoped writes on the row's owner) and comes back here.
    Rows and actions are my events' (`EventRow`, `EventActions` with
    `ownOnly`); every write updates the calendar, shared links, my events
    and these lists from its response. Nothing at boot, persisted or kept
    after sign-out; refetched on mount, when the app returns stale and by
    the refresh button. `mergeIntoPages` no longer drops an event it added
    earlier in the same change to the same page. Every hide, cancel and
    delete is scoped to the events' loaded owner and fails visibly when
    fewer events are written than asked; deletes remove the teacher tags
    first when the junction's foreign key refuses; the list scaffolding
    is shared (`ManagedEventList`, `useFocusAfterDelete`).
21. Security headers and CSP (#17): `vercel.json` serves every path with a
    hash-based Content-Security-Policy (no `'unsafe-inline'` or
    `'unsafe-eval'`; exactly the origins the app uses), HSTS, nosniff,
    `X-Frame-Options: DENY`, `Referrer-Policy` and a deny-by-default
    Permissions-Policy; violations reported to Sentry; previews
    (`*.vercel.app`) get the same policy plus Vercel's toolbar; the shell's
    precache revision covers the headers, so installed apps get header
    changes. `scripts/check-headers.mjs` (run by the build) checks the
    headers, the policy's strictness, its hashes against the built
    index.html (`--write` updates them and the preview policy), reporting
    and the env's origins. Verified in headless Chrome against the
    production build served with these headers: public pages, sign-in,
    telemetry on the production host, previews, report delivery, and the
    signed-in pages against a mocked backend.
22. Cutover: the old client deleted (with its lint/format exclusions, the
    decorator `.babelrc` and a stray tracked `.vite/`); every user story
    checked against the code and tests (`docs/parity.md`: 64 done, story 36
    a recorded deviation), and the old client swept for unlisted behaviour:
    its maintenance kill switch (`VITE_DISABLE_APP`), scrolling a shared
    event's card into view, the footer under the month view and the empty
    list, and the date pickers' one-year limit were ported, with a test for
    the page-loading bar. A migration file (not applied) takes the app's
    tables out of `supabase_realtime` after go-live. `docs/cutover.md` is
    the maintainer's checklist (env, SQL checks, migrations, post-deploy
    checks, rollback); `docs/perf-baseline.md` has the final sizes (135.3 KB
    gzip for `/`, from 568.7 KB).
23. Final review: every multi-query cache update goes through one engine
    (`app/cachedQueries.ts`), and paginated lists are never refetched page
    by page (a write meeting a fetch in flight, or a refresh after a write
    that couldn't be applied, starts again from page one); every paginated
    list places a moved row by its pages' cursors (`lib/keyset.ts`, one
    keyset builder and page cut for all lists); the rules event lists
    share moved to `features/events` (`eventLists.ts`, `series.ts`), the
    edit and series queries renamed for admin use (`eventToEditQuery`,
    `seriesQuery`); admin pages share `usePagedAdminList`, `QueryList` and
    `CopyPhone`; `STALE_MS` moved to `lib/freshness.ts`; the English
    address lookups moved to `data/placeLookups.ts`; any WebSocket attempt fails
    its test; the edit tests prove the calendar and my events update from
    the save's answer with every read of events held.
24. Cloudflare hosting (spec #37, not live yet): `wrangler.jsonc` (static
    assets with the SPA fallback, a Worker for `/api/*`), `public/_headers`
    checked like vercel.json, the edge-cached public window
    (`GET /api/public-window`) and `services.publicFeed` with its direct
    fallback, Cloudflare Web Analytics behind `VITE_CF_ANALYTICS_TOKEN`,
    and `docs/cloudflare.md`. `/` stays 135.3 KB gzip.
