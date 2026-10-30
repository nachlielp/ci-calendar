# Client architecture (rewrite, spec #34)

The client is a Vite + React 19 + TypeScript SPA on the same Supabase backend.
There is no realtime: freshness comes from the query cache's rules. This file
is the shared map for everyone working on the rewrite. Keep it current when
you add a convention that other slices should follow.

`legacy/src/` is the old client, kept read-only as the reference for parity
(behaviour, copy, styles, translations). Nothing builds, lints or tests it,
and the cutover deletes it. Port behaviour from it; don't import from it.

## Layout

| Folder           | Holds                                                         |
| ---------------- | ------------------------------------------------------------- |
| `src/app/`       | Bootstrap, services (the seam), routes, shell layout          |
| `src/data/`      | Backend client construction and generated database types      |
| `src/features/*` | One folder per feature: its pages, components, queries, tests |
| `src/lib/`       | Pure helpers (dates, formatting); tested directly             |
| `src/ui/`        | Shared presentational primitives (dialog, buttons, icons)     |
| `src/pages/`     | Simple pages that don't belong to a feature                   |
| `src/test/`      | The fake backend and `renderApp`                              |

## Rules

- **One seam.** Everything that talks to the backend gets it from
  `AppServices` (`useServices()` in components, an argument in query
  factories). Nothing imports a module-level client. Tests pass the fake at
  the same point; nothing else is mocked.
- **No realtime.** Never import `@supabase/supabase-js` or
  `@supabase/realtime-js`. Use the sub-clients (`postgrest-js`, `auth-js`,
  `storage-js`, `functions-js`). The test setup fails any WebSocket.
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
- **One build version.** `BUILD_VERSION` (`src/app/buildVersion.ts`) is set
  at compile time by `define` in `vite.config.ts`: the commit SHA for builds
  (`VERCEL_GIT_COMMIT_SHA`, `GITHUB_SHA` or `git rev-parse`),
  `dev-<start time>` per dev server start, `"test"` under Vitest. It reaches
  the app as `services.buildVersion`. Everything that must react to a deploy
  keys off it: the persisted query cache now, and the service worker cache
  and update prompt (slice 7).
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
- **Freshness.** Public window: stale after 5 minutes, refetched on
  `visibilitychange` to visible when stale (TanStack's `focusManager`),
  always refetched on reconnect (`refetchOnReconnect: "always"`), and always
  revalidated at a cold start. Data on screen stays on screen when a refresh
  fails; `StaleDataNotice` says it may be out of date (offline, or refresh
  failed). With no data and no connection, the page says it can't load and
  the paused request goes out once back online. `useIsOnline()` reads
  TanStack's `onlineManager`, which boot seeds from `navigator.onLine`.
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
- **Slow network:** `fake.holdTable(table)` holds requests until
  `fake.releaseTable(table)`; `failTable`/`healTable` make them fail.
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
