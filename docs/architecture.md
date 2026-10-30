# Client architecture (rewrite, spec #34)

The client is a Vite + React 19 + TypeScript SPA on the same Supabase backend.
There is no realtime: freshness comes from the query cache's rules. This file
is the shared map for everyone working on the rewrite. Keep it current when
you add a convention that other slices should follow.

`legacy/src/` is the old client, kept read-only as the reference for parity
(behaviour, copy, styles, translations). Nothing builds, lints or tests it,
and the cutover deletes it. Port behaviour from it; don't import from it.

## Layout

| Folder                     | Holds                                                         |
| -------------------------- | ------------------------------------------------------------- |
| `src/app/`                 | Bootstrap, services (the seam), routes, shell layout          |
| `src/app/auth`             | Session at boot, profile row, sign-out cleanup, role guard    |
| `src/app/header`           | App header, menu (items keyed by role), WhatsApp link         |
| `src/app/install`          | Install banner, `beforeinstallprompt` capture, iOS steps      |
| `src/app/updates`          | Service worker registration, safe reloads, the reload guard   |
| `src/app/telemetry`        | Crash reports, analytics, Speed Insights; their lazy SDKs     |
| `src/sw/`                  | The service worker (`sw.ts`) and its cache rules              |
| `src/data/`                | Backend client construction and generated database types      |
| `src/features/*`           | One folder per feature: its pages, components, queries, tests |
| `src/features/events`      | Managed events and the shared event cache updates (below)     |
| `src/features/event-forms` | The event forms, their shared parts, saves and drafts         |
| `src/lib/`                 | Pure helpers (dates, formatting); tested directly             |
| `src/ui/`                  | Shared presentational primitives (dialog, buttons, icons)     |
| `src/ui/form`              | Form fields, chips, switch, alert and buttons (`fields.tsx`)  |
| `src/pages/`               | Simple pages (about, legal, 404) that belong to no feature    |
| `src/test/`                | The fake backend and `renderApp`                              |
| `src/assets/`              | Images, logos and the subset font ported from legacy          |

## Rules

- **One seam.** Everything that talks to the backend gets it from
  `AppServices` (`useServices()` in components, an argument in query
  factories): `services.data` (PostgREST), `services.auth` (sign-in
  state and actions) and `services.functions` (Edge Functions,
  `data/functions.ts`: `invoke(name, { body })`, never throws; functions-js
  is imported on the first call, so `/` doesn't carry it; each call
  carries the token at hand, as data requests do). Browser capabilities
  that load third-party code are services too, so tests count them:
  `services.places` (Google Places, `data/places.ts`, below). Nothing
  imports a module-level client. Tests pass the fake at the same point;
  nothing else is mocked.
- **No realtime.** Never import `@supabase/supabase-js` or
  `@supabase/realtime-js` (lint fails it). Use the sub-clients
  (`postgrest-js`, `auth-js`, `storage-js`, `functions-js`). The test setup
  fails any WebSocket.
- **Server state lives in TanStack Query.** Each kind of data has one query
  options factory with an explicit freshness policy. Writes update the
  matching cached queries from the server response (`setQueryData`), not by
  refetching lists. Local UI state stays in components; filters stay in the
  URL (`f` param).
- **Lazy by default.** Only the shell and the public calendar route are
  eager. Every other route uses route-level `lazy`. Heavy third-party code
  (cropper, Places, analytics, tracing, replay) is imported dynamically. CI
  fails if `/`'s initial JS goes over the gzip limit in `package.json`.
- **No component libraries.** No antd, MUI, emotion, MobX, dayjs, lodash or
  uuid. Use native elements (`<dialog>`, `<input type="date|time">`,
  `<details>`), small primitives in `src/ui/`, `Intl` and the helpers in
  `src/lib/`. `crypto.randomUUID()` for ids.
- **Same look.** Port the legacy SCSS for the component you're building
  (`legacy/src/styles/`) into a `.scss` file next to it, dropping antd
  overrides. Same copy, same three languages.
- **Dates.** Calendar days are `YYYY-MM-DD` strings in Asia/Jerusalem
  (`src/lib/jerusalemDate.ts`). Read "now" from `services.now()`, never
  `new Date()` in features, so tests control the clock. Don't put today's
  date in a query key: a query fetched yesterday (or restored from storage)
  must stay the same query. Compute the date range inside `queryFn` and drop
  passed days in `select` (see `publicWindow.ts`), with the day from
  `useToday()` (`app/useToday.ts`: re-read when the page comes back and
  every minute) passed to the options factory and in their `useMemo` deps,
  so `select` runs again after midnight without a request.
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
      directly. The legacy `events`/`bios` keys are removed at boot and never
      read.
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
      with whatever token is at hand (filter public-ness explicitly, above),
      and **every personal query starts with**
      `const session = await services.auth.ready()` (at once for a token
      valid 90 s more; else after auth-js refreshes it), checks
      `session?.user.id === userId`, keys on `[kind, userId, …]`, and is
      `enabled` only with a session (`useSession()` in `app/viewer.ts`).
    - **The viewer** (`useViewer()`): `anonymous` at first paint when no
      session is stored; `unknown` while the profile loads or a redirect is
      read; `unavailable` when signed in but the profile failed or waits
      for a connection (the menu offers sign-out, guards say so with a
      retry and the way home); then the role (`users.user_type`), the
      name (shown in the header) and `signsInWithEmail` (`provider ===
"email"`). The header's login link (legacy: account icon + "התחבר/י")
      shows only to `anonymous` viewers, online, on routes without
      `homeButton` (text and auth pages get home instead).
    - **Guarded routes** (legacy `PrivateRoutes`): wrap a later slice's
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
  under `assets/` (but not the telemetry SDKs in `assets/telemetry/`,
  `PRECACHE_IGNORES`), the loader logo, the manifest and its icons, in one
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
  must block the reload**: call `useBlockReload(isDirty)`
  (`app/updates/reloadGuard.ts`) in the form (slices 10+); while any block is
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
- **Freshness.** Public window: stale after 5 minutes, refetched on
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
- **Shared links.** `/event/:eventId` and the legacy `/:eventId` open the
  event over the calendar (`useLinkedEvent`): from the cached window when it
  has it, else with one request for that event alone, in parallel with the
  window. The dialog opens at once, with loading, offline and failed (retry)
  states; only a definite "no visible event" renders the 404 page. A link
  that can't name an event (`isEventLink`: neither a UUID nor a three-letter
  or digit `short_id`, as the `set_short_id` trigger makes them) is a 404 at
  once, with no request and no details code, e.g. `/abuot` or `/signin`.
  Static top-level routes (`/about`, `/login`, …) outrank
  `/:eventId` in React Router's ranking, so later slices just add them; they
  never reach the event lookup.
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
  `isEventType`/`isDistrict`) are in `src/lib/eventOptions.ts`; reuse them
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
  module per icon in `src/ui/icons/` (Material Symbols paths from
  `legacy/src/assets/svgs`), so an icon used only by a lazy page stays out
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
      `.eq("id", id).eq("user_id", userId).not("closed", "is", true)` and
      `maybeSingle()`; no row back means an admin closed it meanwhile, so
      the list is refetched and the page says so. The client never sends
      columns the user doesn't own (`status`, admins' `responses`), except
      legacy's cancellation note, appended to responses read fresh under
      the same condition. RLS lets an owner write every column of their
      row, so column-level protection (and an atomic append) would need an
      RPC: a future migration, not written yet.
- **Event writes and the cache.** For create/edit forms (slices 13–15)
  and admin (manage-all-events), not only manage-events:
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
      revalidation). A query whose refetch is in flight is fetched anew
      right after (`query.fetch` with `cancelRefetch`), so an answer sent
      before the write can't bring a deleted or hidden event back, nor
      persist it. Built in: the public window (visible events dated from
      today within the range it was fetched for, `PublicWindow.from/to`;
      only the public part, `toPublicOnly`, since it is persisted) and
      shared-link lookups (the event, or `null` once hidden or deleted).
    - **Every other list of events registers itself** with
      `registerEventList({ kind, apply })` in the module that defines its
      query (so it is registered before any of its queries can be cached),
      `apply(data, change, queryKey)` returning the updated data or the
      same object (`my-event` and `my-series` in `event-forms/myEvent.ts`
      too). `mergeIntoList` (one list) and `mergeIntoPages`
      (keyset-paginated, `EventPage`) do the work given which saved events
      belong and the list's order; see the `my-events` list in
      `features/manage-events/myEvents.ts`. `features/events` never imports
      a feature's list. Admin's manage-all-events registers its own.
    - **Hide, cancel and delete** are `useSetHidden`, `useSetCancelled`
      and `useDeleteEvents` (`features/events/eventWrites.ts`): one
      conditional write each. Hide and cancel only touch events still in
      the state the user saw (`.eq("hide", !hide)`, `cancelled IS NOT
TRUE` / `= true`), so a change made elsewhere isn't flipped back. By
      default only the user's own (`.eq("user_id", userId)`; RLS lets
      admins write anyone's, so the client says which it means); admin
      pages pass `{ ownOnly: false }`. If fewer events come back than were
      asked for, `refreshEventQueries` invalidates every event list (the
      window and links too): those on screen refetch, the rest when shown.
- **Pagination.** Long personal or admin lists load a page at a time with
  `infiniteQueryOptions` and keyset pagination, never offsets (a delete
  would shift them): order by a unique key (`start_date`, then `id`), ask
  for one row more than the page (`limit(PAGE + 1)`) to know whether
  another follows, and pass the last row as the cursor, filtered with
  PostgREST's logic tree (`afterCursor`:
  `start_date.lt.D,and(start_date.eq.D,id.lt.I)`). A page is an
  `EventPage` (`{ events, next: cursor | null }`); `getNextPageParam`
  returns `next`. TanStack refetches an infinite query page by page, so
  don't let focus, reconnect or remounts refetch one: the past events
  query is fetched when first asked for in a page visit, kept (writes
  update it) with `staleTime: Infinity` and no refetch triggers, and
  removed when the page unmounts, so the next visit starts from page one.
  See `myEvents.ts`.
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
      `personalKey` (see `useFormDraft` under Event forms).
    - **Validation**: `validate(values)` is pure and returns, per path (a
      field's name, or a dotted path into a nested value:
      `segments.2.end`), a key of the form's own copy; legacy's rules and
      messages. A path's error shows once it, or a field holding it, is
      touched, and every error after a save attempt. `setErrors` shows the
      server's errors by path until that path is edited. The fields mark
      themselves `aria-invalid` and point `aria-describedby` at the
      message.
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
- **Event forms** (slices 13 and 14; `features/event-forms`, reuse these
  for templates, slice 16):
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
      place was picked, the English address (`en_label`, from
      `services.places`); an edit asks only for a changed title or a newly
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
      Templates (slice 16) pass their own `columns`/`patch` (and, writing
      `templates`, their own mutations behind the same shape).
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
        - **The edit waits for the series**: while `mySeriesQuery` has no
          data the submit button is off and the form says it's loading
          (or, failed, says so with a retry); the save refuses too
          (`series.ready`), so the question is never skipped.
        - **Editing**: the form reads the user's events of the series from
          today on (`mySeriesQuery`, `my-series`, personal, registered as an
          event list) and passes `series: { later, patch: seriesPatch }`
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
    - **Drafts** (`eventDraft.ts`, keys in `draftKeys.ts`, `personalKey`s):
      `useFormDraft({ key, userId, eventId, saved, form, isValues })` keeps
      only the form's `changes` while it is dirty and removes them once it
      is clean again; when the form mounts, if the draft is the same user's
      for the same event, it restores (`form.restore`) those fields over
      `saved` as it is then, so a field the user didn't touch shows the
      server's newer value. It returns `discard` (after a save, on "clear
      form"). A new event's draft survives leaving the page (legacy's); an
      edit's is dropped by the page's back button but survives a reload.
    - **Pages**: `/create-events` (legacy's chooser; the missing-bio
      warning; templates come with slice 16), `/create-events/single-day`
      and `/create-events/multi-day` (legacy's info notice; both back to
      `/create-events` after a save, as legacy), and
      `/manage-events/edit-single-day/:eventId` and
      `/manage-events/edit-multi-day/:eventId` (`myEventQuery`, personal,
      the user's own event by id, at once from the cached upcoming list;
      registered as an event list; an event of the other kind redirects to
      its own form; back to `/manage-events`). Each page is a few lines
      over `NewEventFormPage` / `EditEventFormPage`
      (`EventFormPages.tsx`: header, back button, loading/not-found/error,
      the draft key the back button drops). Layout in `FormPage.scss`.
    - **One chunk**: every event-form page is exported from
      `event-forms/pages.ts` and routed with `eventFormPage("Name")`
      (`app/routes.tsx`): one dynamic import in `/`'s route table for all
      of them (each `import()` there costs `/` its preload list and file
      names), and moving between the chooser and the forms downloads
      nothing. Add template pages (slice 16) the same way.
    - **For templates (slice 16)**: legacy reused these same forms and
      routes with `?isTemplate=true` (a `name` field; the multi-day one
      without its days) writing the
      `templates` table, whose columns mirror `ci_events`' (no dates,
      `hide`, `cancelled`), so the `*Columns` functions minus the day
      columns fit; and the new-event forms offered "בחירת תבנית" (the
      user's templates of that kind) at the top, filling the form, and
      wrote `source_template_id` on create (not sent yet: add it to the
      columns). Legacy's template drafts had their own keys
      (`multi-day-draft-template`): give templates their own
      `personalKey`s in `draftKeys.ts`.
- **Google Places.** `services.places()` (`PlacesLoader`) loads the Maps
  JavaScript API's Places library with `VITE_GOOGLE_PLACES_API_KEY` on
  first call (`data/googlePlaces.ts`, its own chunk; a script tag with
  `language=he&region=IL`) and returns `session()`: one search billed as
  one session (an `AutocompleteSessionToken`): `suggest(input)`
  (`AutocompleteService`, what legacy's react-google-places-autocomplete
  called) while typing, then `englishAddress(placeId)`
  (`PlacesService.getDetails`, legacy's) for the picked place, which ends
  the session; plus a sessionless `englishAddress` (a save's fallback).
  `AddressField` loads it when focused, never before; typing asks after a
  300 ms pause; picking sets the address and then its `enLabel` (5 s at
  most); picking the address already set keeps it, English label and all.
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
  remembers each text and language for the session. The event details
  translate, in English and Russian, what legacy did
  (`detailsTranslation.ts`: description, link and price titles, names of
  organisations and multi-day teachers without a bio), one query per text,
  showing the Hebrew until each arrives. They are kept on the device across
  visits (`translationStore.ts`, `detailsTranslations` in
  `services.storage`, read with the details' chunk only): keyed by language
  and the Hebrew text itself (an edited text is simply a new key, so no
  `updated_at` is needed in the public payload), bounded to 200 entries and
  100,000 characters, oldest out first; public data, so kept across users.
  Links the details render (event links, bio pages) go through `webLinks`:
  http(s) only, a scheme-less one as https, anything else (a stored
  `javascript:`) dropped.
- **Languages (i18n).** Hebrew (default, RTL), English and Russian (LTR).
  Every slice that adds copy follows this:
    - **Copy is per component**, declared with `defineCopy({ he, en, ru })`
      (`src/lib/copy.ts`) next to the component and read with
      `useCopy(COPY)` (`src/app/language.ts`). Hebrew sets the shape; English
      and Russian must match it key for key, so a missing translation is a
      type error. Entries are strings; `counted({ one, other, … })` for
      phrases with a count (it becomes `(count) => string`, with the plural
      rules of the block it sits in, so never pass a language code; Russian
      needs `one`/`few`/`many`); or functions of names or values returning a
      string or React nodes (a sentence with a link in it:
      `terms: (link: ReactNode) => <>I accept the {link}</>`). Never write
      a user-facing string outside a `defineCopy` (aria-labels, titles and
      alt text included). Port the words from legacy `util/translations.ts`
      when they exist there; legacy left much copy in Hebrew only, so write
      the English and Russian.
    - **Legal texts** (privacy policy, terms) are the one exception: legacy
      published them in Hebrew only, so they stay word for word in a
      component marked `lang="he" dir="rtl"`, under a translated title and
      `HebrewOnlyNote` (English and Russian). Don't machine-translate them.
    - **Shared words** (save, cancel, confirm, delete, close, retry,
      loading, back to the calendar) are in `COMMON_COPY`
      (`src/lib/commonCopy.ts`), read with `useCopy(COMMON_COPY)`; add a word
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
- **Assets.** Images ported from `legacy/src/assets` live in `src/assets/`
  and are imported with `?no-inline` (e.g. the flags, the WhatsApp logo), so
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
  an inner box, unlike legacy); `ScrollRestoration` keys the calendar and
  events opened over it as one position, so a new page starts at the top
  and Back returns to where the visitor was. A route's `handle`
  (`RouteHandle`, `app/routeHandle.ts`) tells the shell about it, e.g.
  `homeButton` on the text pages. `services.reload()` reloads the page
  (tests count the calls); slice 7's update prompt should use it too.
  While a lazy route's code downloads, the page stays and `PageLoading`
  shows a thin bar along the top (after 150 ms, so quick loads don't
  flash it), with "loading" for screen readers. The
  footer's version button is legacy's "reset the app": `resetDevice` clears
  device storage except `KEPT_ON_RESET` (`isInternal`), unregisters service
  workers and deletes Cache Storage, then the page reloads. Add a key to
  `KEPT_ON_RESET` only if losing it would harm the visitor or analytics.
- **Header and menu.** The header shows a home button (to signed-out
  visitors on routes with the `homeButton` handle, to signed-in users
  anywhere but `/`), the language menu, the WhatsApp link
  (`VITE_WHATSAPP_NUMBER`; hidden when unset), the out-of-date sign and the
  menu button; signed out, the login link before them all, and signed in,
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
  storage has `isInternal` = `true`. The SDK chunks are built into
  `assets/telemetry/` (`chunkFileNames` in `vite.config.ts`) and never
  precached (`PRECACHE_IGNORES`); `check:sw` fails if one is, or if
  `vercel.json` stops serving them `immutable`.
    - **No secrets in URLs**: Supabase auth redirects carry tokens
      (`#access_token=…`, `?code=…`, `?token=…&type=…`). Every URL
      telemetry sends goes through `scrubUrl` (`app/telemetry/scrubUrl.ts`):
      page views, PostHog's `before_send` (`$current_url`, referrers,
      autocaptured links), Sentry's `beforeSend`/`beforeSendTransaction`/
      `beforeBreadcrumb` (request URL, navigation and request breadcrumbs,
      spans, replay events' URLs), replay recordings
      (`beforeAddRecordingEvent`) and Speed Insights' `beforeSend`. Send a
      URL some other way and you scrub it too.
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
      PostHog, never email or name. Also port legacy's
      `saveIsInternalToLocalStorage`: after the profile row loads, call
      `services.telemetry.setInternal(users.is_internal)`. It saves the
      `isInternal` key; marking a device internal stops PostHog
      (`opt_out_capturing`, autocapture included) and Speed Insights at
      once; unmarking takes effect from the next page load. (All wired in
      slice 9: `bootSession`, `forgetUser`, `profileQuery`.)
- **Production safety.** Never write to the production database or storage
  from scripts or the browser while developing. Read-only anon checks are
  fine. Schema changes go in `supabase/migrations/` as files and are applied
  by hand by the maintainer; nothing applies them automatically.

## Tests

Behaviour tests render the real app with `renderApp()` from `src/test/` and a
seeded fake backend. They assert what the user sees and what was requested of
the backend, never cache keys or hook calls. Pure logic in `src/lib/` and
feature helpers is tested directly.

- **Repeat visits:** pass the same `storage` (`createMemoryStorage()`) to two
  `renderApp` calls, unmounting the first. `buildVersion` simulates a deploy.
  Reset `<html lang dir>` to `he`/`rtl` between them, as a reload starts
  from `index.html` (`setup.ts` does so after each test).
- **Embedded resources:** the fake joins embeds through the foreign keys in
  its `RELATIONS` map and applies dotted filters to the embedded rows, as
  PostgREST does; add a relation there when a query embeds a new one. It also
  supports `neq`, `lt`, `gt`, `in`, `is` / `not(column, "is", value)`
  (SQL's `IS`, so `closed IS NOT TRUE` matches `null`), `or()` with
  PostgREST's logic tree (`a.lt.1,and(a.eq.1,b.lt.2)`), several `order()`s,
  `limit`, `range`, `single()` and `maybeSingle()`; a recorded request's
  `order` is the list of them, `limit` and `range` as set. `delete()`
  removes the filtered rows and returns them.
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
  `vi.stubEnv` (e.g. `VITE_WHATSAPP_NUMBER`) lasts one test.
- **Auth:** `fake.auth` (`src/test/fakeAuth.ts`) is the fake's Supabase
  auth: accounts (`fake.auth.accounts`), a session with tokens
  (`token-<user id>-<n>`), every call that would reach the auth server in
  `fake.auth.calls` (refresh, sign-in, sign-up, reset, update, sign-out),
  `fail(method, { message, code })`, `holdRefresh`/`releaseRefresh`,
  `started` (auth-js asked for), and redirects: `startRedirect()` (session
  unknown) then `finishRedirect(account | null)`, or `failRedirect(error)`
  before boot. `fake.beforeExecute(fn)` runs before each request is
  answered (another tab writing first); inserts of an existing `id` fail
  with `23505`; `update` applies to the filtered rows. `renderApp({ signedInAs: testUser(role) })`
  (`src/test/testUsers.ts`) boots with that session stored and seeds the
  `users` row (`userRow`); add `tokenExpired: true` to need a refresh
  first. Each recorded data request has the `token` it was sent with (`null`
  = anon key), its `method` and, for inserts, the `body`;
  `fake.rows(table)` seeds or reads a table live.
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
- **Slow network:** `fake.holdTable(table)` holds requests until
  `fake.releaseTable(table)`; `failTable`/`healTable` make them fail.
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
    sender isn't running.
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
