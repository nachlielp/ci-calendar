# Client architecture (rewrite, spec #34)

The client is a Vite + React 19 + TypeScript SPA on the same Supabase backend.
There is no realtime: freshness comes from the query cache's rules. This file
is the shared map for everyone working on the rewrite. Keep it current when
you add a convention that other slices should follow.

`legacy/src/` is the old client, kept read-only as the reference for parity
(behaviour, copy, styles, translations). Nothing builds, lints or tests it,
and the cutover deletes it. Port behaviour from it; don't import from it.

## Layout

| Folder              | Holds                                                         |
| ------------------- | ------------------------------------------------------------- |
| `src/app/`          | Bootstrap, services (the seam), routes, shell layout          |
| `src/app/auth`      | Session at boot, profile row, sign-out cleanup, role guard    |
| `src/app/header`    | App header, menu (items keyed by role), WhatsApp link         |
| `src/app/install`   | Install banner, `beforeinstallprompt` capture, iOS steps      |
| `src/app/updates`   | Service worker registration, safe reloads, the reload guard   |
| `src/app/telemetry` | Crash reports, analytics, Speed Insights; their lazy SDKs     |
| `src/sw/`           | The service worker (`sw.ts`) and its cache rules              |
| `src/data/`         | Backend client construction and generated database types      |
| `src/features/*`    | One folder per feature: its pages, components, queries, tests |
| `src/lib/`          | Pure helpers (dates, formatting); tested directly             |
| `src/ui/`           | Shared presentational primitives (dialog, buttons, icons)     |
| `src/ui/form`       | Form fields, chips, switch, alert and buttons (`fields.tsx`)  |
| `src/pages/`        | Simple pages (about, legal, 404) that belong to no feature    |
| `src/test/`         | The fake backend and `renderApp`                              |
| `src/assets/`       | Images, logos and the subset font ported from legacy          |

## Rules

- **One seam.** Everything that talks to the backend gets it from
  `AppServices` (`useServices()` in components, an argument in query
  factories): `services.data` (PostgREST) and `services.auth` (sign-in
  state and actions). Nothing imports a module-level client. Tests pass the
  fake at the same point; nothing else is mocked.
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
  passed days in `select` (see `publicWindow.ts`).
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
      real gate; the guard is UX.
    - **Sign-out**: `viewer.signOut()` (the menu) goes to `/`, then
      `auth.signOut()`: Supabase's `global` scope as legacy, falling back to
      `local`; the local session and auth-js's keys always go, offline too.
      Whenever the user ends or changes (here, another tab, a revoked
      refresh, an auth redirect over a stored session), `forgetUser` runs: every query whose kind is not in
      `PUBLIC_QUERY_KINDS` leaves the cache (so a new kind is personal by
      default; list a public kind there), `PERSONAL_STORAGE_KEYS` leave
      device storage (**add any personal key you store, e.g. a form draft**),
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
  (`src/ui`) is legacy's `MenuButtons` (joined icon buttons, one pressed).
  `.visually-hidden` (`index.css`) hides text from sight, not from screen
  readers.
- **Forms.** Every form is built on `useForm` (`app/useForm.ts`, over
  the pure reducer in `lib/form.ts`; both tested directly):
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
      draft kept on the device as unsaved changes; such a draft's key goes
      in `PERSONAL_STORAGE_KEYS`.
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
      `SelectField` on a native `<select>`, `ChoiceChips` for legacy's tags
      `Select` (checkboxes drawn as chips), `Switch` (`role="switch"`),
      `FormAlert`) and the `.action-button` / `.text-button` classes
      (legacy `general-action-btn black-btn large-btn` and `text-btn`), all
      in `Form.scss`. Labels come from the form's copy; `<form noValidate>`
      so the browser's own bubbles don't replace the form's messages.
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
  (tests count the calls); slice 7's update prompt should use it too. The
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
  supports `neq`, `single()` and `maybeSingle()`. `renderApp` returns the
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
- **Slow network:** `fake.holdTable(table)` holds requests until
  `fake.releaseTable(table)`; `failTable`/`healTable` make them fail.
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
