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
  states; only a definite "no visible event" renders the 404 page. So a
  mistyped single-segment URL (e.g. `/abuot`) costs one small request before
  its 404. Static top-level routes (`/about`, `/login`, …) outrank
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
- **Dialogs and icons.** Drawers and modals use `Dialog` (`src/ui/Dialog.tsx`):
  a native `<dialog>` portalled to `body`, a drawer under 500px and a modal
  above (CSS only). Mount it to open it. The close button, Escape and a
  backdrop click (pointer down and up on the backdrop) close the native
  dialog, and its `close` event calls `onClose`; the owner then unmounts it.
  Unmounting it directly (e.g. on Back) is fine. Focus returns to the element
  that had it, and the page behind doesn't scroll while it is open. Its body
  is the scroller and fills the box. Icons are inline SVG components in
  `src/ui/icons.tsx` (Material Symbols paths from `legacy/src/assets/svgs`);
  add new ones there, never load SVG files at runtime. `ToggleButtons`
  (`src/ui`) is legacy's `MenuButtons` (joined icon buttons, one pressed).
  `.visually-hidden` (`index.css`) hides text from sight, not from screen
  readers.
- **Copy.** Until the languages slice, Hebrew copy sits in one `COPY` object
  per component. Event vocabulary (types, tags, the day format, shared copy)
  is an `EventLocale` in `features/calendar/eventFormat.ts` (types, tags,
  districts, month and weekday names, the day format); the formatters take
  one, `HEBREW` by default; so do the calendar components (`locale` prop).
  Counted phrases use `plural()` (`src/lib/plural.ts`, `Intl.PluralRules`),
  never hand-rolled number checks. Slice 5 adds English and Russian locales and
  passes the UI language's locale to them and to the components.
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
- **Embedded resources:** the fake joins embeds through the foreign keys in
  its `RELATIONS` map and applies dotted filters to the embedded rows, as
  PostgREST does; add a relation there when a query embeds a new one. It also
  supports `neq`, `single()` and `maybeSingle()`. `renderApp` returns the
  `router`, to assert the URL.
- **Dialogs:** jsdom lacks `showModal()`/`close()` and Escape-to-close;
  `src/test/setup.ts` stands in for them, so `userEvent.keyboard("{Escape}")`
  closes the topmost dialog as in a browser.
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
3. Event cards, details and deep links: legacy event cards (sorted by day and
   time, cancelled marked), full details with teacher bios in a lazy native
   `<dialog>`, `/event/:id` and `/:shortId` links (window first, else one
   by-link request; unknown or hidden → 404); junction backfill migration.
4. Filters and views: event-type and district filters in the URL (`f`,
   legacy encoding, last choice restored from storage) through a drawer or
   modal, chips and clear-all; list/calendar toggle and a native month grid
   over the window, days marked from a precomputed day → events map.
