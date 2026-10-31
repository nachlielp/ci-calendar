# Parity with the old client (spec #34)

The cutover's bar: every user story in spec #34 (issue 34) is built and
tested, or its difference is a recorded decision. Checked at the cutover
(2026-10-31), story by story, then the old client swept page by page for
anything no story mentions.

**Result:** 64 stories done, 1 deviation (36), no gaps. Four stories (1, 26,
27, 29) are about real-device speed: built and guarded by the bundle limit,
to be confirmed in Speed Insights after the deploy (`docs/perf-baseline.md`).
The sweep found a few small dropped behaviours; the cheap ones were ported at
the cutover and the rest are listed at the end.

Paths are under `src/` unless they start with `scripts/` or `supabase/`.
"Feature" is the folder that builds it; "tests" the test files that prove it
(behaviour tests through `renderApp` and the fake backend, unless noted).

## Anonymous visitors: browsing the calendar

| #   | Story (short)                                   | Status | Feature                                            | Tests                                                                                  | Note                                                                                                                            |
| --- | ----------------------------------------------- | ------ | -------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Upcoming events within ~2 s on a first visit    | done   | `features/calendar`, `app/boot.ts`                 | `CalendarPage.test.tsx` (one request at boot), `scripts/bundle-size.test.ts`           | `/` is 135.3 KB gzip (old: 568.7 KB), window 6.3 KB gzip. Confirm p75 LCP in Speed Insights.                                    |
| 2   | Last events appear at once on a repeat visit    | done   | `app/persistedCache.ts`                            | `freshness.test.tsx` (repeat visits), `persistedCache.test.ts`                         |                                                                                                                                 |
| 3   | Cached events refreshed quietly                 | done   | `features/calendar/publicWindow.ts`                | `freshness.test.tsx`                                                                   | Cold start always revalidates.                                                                                                  |
| 4   | Past events dropped from the cache at once      | done   | `publicWindow.ts` (`select`), `app/useToday.ts`    | `freshness.test.tsx` (never shows cached events dated before today, Jerusalem day)     |                                                                                                                                 |
| 5   | Events request never waits for auth             | done   | `app/boot.ts`, `data/auth.ts`                      | `app/auth/session.test.tsx` (anonymous boot), `CalendarPage.test.tsx`                  |                                                                                                                                 |
| 6   | Filter by event type and district               | done   | `features/calendar/filters.ts`, `EventFilters.tsx` | `filtersAndViews.test.tsx`, `filters.test.ts`                                          | Legacy's options; `warmup` read from old links, not offered.                                                                    |
| 7   | Filters in the URL                              | done   | `useEventFilters.ts`                               | `filtersAndViews.test.tsx` (legacy shared links, chips, restore)                       | Legacy's `f` encoding; last choice restored at `/`.                                                                             |
| 8   | Filtering and view switches instant, no network | done   | `features/calendar`                                | `filtersAndViews.test.tsx` (no request)                                                |                                                                                                                                 |
| 9   | List and month calendar, pick a day             | done   | `CalendarView.tsx`, `lib/monthGrid.ts`             | `filtersAndViews.test.tsx` (calendar view), `monthGrid.test.ts`                        |                                                                                                                                 |
| 10  | About three months ahead                        | done   | `publicWindow.ts` (`WINDOW_DAYS` 90)               | `CalendarPage.test.tsx` (today up to 90 days)                                          |                                                                                                                                 |
| 11  | First screen not held up by later months        | done   | `publicWindow.ts`                                  | `CalendarPage.test.tsx`                                                                | One 90-day request (6.3 KB gzip) instead of a 0–30/30–90 split; the spec left the choice to the measured size.                  |
| 12  | Full event details from the list                | done   | `features/calendar/details`                        | `eventDetails.test.tsx`                                                                | Add to calendar, copy/share, maps as legacy.                                                                                    |
| 13  | Shared links work outside the cached window     | done   | `linkedEvent.ts`                                   | `eventDetails.test.tsx` (shared event links)                                           | `/event/:id` by id, `/:shortId` by short id, one request alongside the window.                                                  |
| 14  | A shared link shows the event first             | done   | `CalendarPage.tsx`, `linkedEvent.ts`               | `eventDetails.test.tsx` (dialog open at once, loading/offline/retry)                   | Its card is also scrolled into view behind it, as legacy (ported at cutover).                                                   |
| 15  | Tagged teachers' public bios                    | done   | `details/BioCard.tsx`, `publicEvent.ts`            | `eventDetails.test.tsx` (tagged teacher, private bio never shown)                      | Needs the junction backfill migration for older events (`docs/cutover.md`).                                                     |
| 16  | Cancelled events marked with their text         | done   | `EventList.tsx`                                    | `CalendarPage.test.tsx`, `manageEvents.test.tsx`                                       |                                                                                                                                 |
| 17  | Hidden events never sent to the browser         | done   | `publicEvent.ts` (`selectPublicEvents`)            | `CalendarPage.test.tsx`, `eventDetails.test.tsx` (never by link)                       | A plain PostgREST select with explicit `hide = false` replaced the spec's view/RPC (no database change); RLS still enforces it. |
| 18  | Hebrew, English, Russian; translated titles     | done   | `app/language.ts`, `lib/copy.ts`                   | `languages.test.tsx`, `copy.test.ts`, `detailsTranslation.test.tsx`                    | Russian titles fall back to Hebrew, as legacy.                                                                                  |
| 19  | RTL for Hebrew, LTR for English and Russian     | done   | `app/LanguageProvider.tsx`                         | `languages.test.tsx`                                                                   |                                                                                                                                 |
| 20  | Install to the home screen                      | done   | `app/install`, `public/site.webmanifest`           | `installBanner.test.tsx`                                                               | Banner can now be closed (new).                                                                                                 |
| 21  | Installed app opens offline with cached events  | done   | `sw/`, `app/persistedCache.ts`                     | `freshness.test.tsx` (opens offline), `sw/swRules.test.ts`, `scripts/check-sw.test.ts` |                                                                                                                                 |
| 22  | A sign that offline data may be stale           | done   | `StaleDataNotice.tsx`                              | `freshness.test.tsx`, `shell.test.tsx` (on every page)                                 |                                                                                                                                 |
| 23  | New version after a deploy without clearing     | done   | `app/updates`, `sw/sw.ts`                          | `safeUpdates.test.tsx`, `staleChunks.test.tsx`, `swRules.test.ts`                      | Reloads when the visitor comes back to the app, never under them; no prompt (legacy had none).                                  |
| 24  | About, privacy, terms load fast                 | done   | `pages/`                                           | `shell.test.tsx` (static pages, without waiting for events)                            | Lazy, 3–4 KB each. Legal text Hebrew only, as legacy.                                                                           |
| 25  | A real 404                                      | done   | `pages/NotFoundPage.tsx`                           | `CalendarPage.test.tsx`, `eventDetails.test.tsx`, `languages.test.tsx`                 | Legacy showed the calendar for unknown paths.                                                                                   |
| 26  | Stable layout, no font swap                     | done   | `index.html`, `index.css`, `assets/fonts`          | (no automated test)                                                                    | Subset woff2, preloaded, `font-display: optional`. Confirm CLS in Speed Insights.                                               |
| 27  | Smooth scrolling on low-end phones              | done   | `eventCards.ts`, `EventList.scss`                  | `eventCards.test.ts`                                                                   | Labels derived once per data change; `content-visibility: auto`. Confirm INP in Speed Insights.                                 |
| 28  | WhatsApp and install banners keep working       | done   | `app/header/WhatsAppButton.tsx`, `app/install`     | `shell.test.tsx` (WhatsApp), `installBanner.test.tsx`                                  |                                                                                                                                 |

## Signing in and accounts

| #   | Story (short)                                   | Status    | Feature                                     | Tests                                                                             | Note                                                                                                                                                                                           |
| --- | ----------------------------------------------- | --------- | ------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 29  | Signed-in calendar as fast as anonymous         | done      | `app/auth/session.ts`                       | `session.test.tsx` (signed-in boot: only the profile row)                         | auth-js (22 KB) loads after idle, off `/`. Confirm in Speed Insights.                                                                                                                          |
| 30  | Session restored without a network round trip   | done      | `data/auth.ts`                              | `session.test.tsx` (expired token doesn't hold the calendar), `data/auth.test.ts` | Read from legacy's storage key, so users stay signed in across the cutover.                                                                                                                    |
| 31  | Sign up; profile row created                    | done      | `features/auth`, `app/auth/profile.ts`      | `authPages.test.tsx`, `session.test.tsx` (profile row)                            | The client creates the `users` row, as legacy (the database has no trigger).                                                                                                                   |
| 32  | Log in, sign out, reset password                | done      | `features/auth`                             | `authPages.test.tsx`, `session.test.tsx`                                          | Google and email; expired reset links explained.                                                                                                                                               |
| 33  | Sign-out ends the session, clears personal data | done      | `app/auth/session.ts`, `personalStorage.ts` | `session.test.tsx` (sign-out), `singleDayForm.test.tsx` (draft forgotten)         | Global scope, local fallback; other tabs follow.                                                                                                                                               |
| 34  | Menu shows only what the role allows            | done      | `app/header/menu.ts`                        | `menu.test.ts`, `session.test.tsx` (menu by role)                                 |                                                                                                                                                                                                |
| 35  | Role-gated pages block and send to login        | done      | `app/auth/guard.ts`                         | `session.test.tsx` (role guard), each page's "is for … only" test                 |                                                                                                                                                                                                |
| 36  | Phone, weekly-schedule filters and on/off       | deviation | —                                           | —                                                                                 | Dropped as unused (slice 10): legacy had taken the page out of its menu and routes, and the WhatsApp sender isn't running. The phone is still saved from a role request (`requests.test.tsx`). |
| 37  | Support or role requests, and their status      | done      | `features/requests`                         | `requests.test.tsx`, `myRequests.test.ts`                                         | As legacy: role requests in the app (teacher = creator, org), support by email.                                                                                                                |

## Creators, orgs and teachers

| #   | Story (short)                                   | Status | Feature                                                      | Tests                                                                                   | Note                                                                 |
| --- | ----------------------------------------------- | ------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 38  | My events fast; past events on demand, paged    | done   | `features/manage-events`                                     | `manageEvents.test.tsx`, `myEvents.test.ts`                                             | 20 a page, keyset.                                                   |
| 39  | Single-day event with segments, prices, address | done   | `features/event-forms`                                       | `singleDayForm.test.tsx`, `eventFormValues.test.ts`                                     | Native date/time inputs; Places loads when the address is focused.   |
| 40  | Multi-day event                                 | done   | `features/event-forms`                                       | `multiDayForm.test.tsx`                                                                 |                                                                      |
| 41  | Recurring events; edit one or later ones        | done   | `features/event-forms/recurrence.ts`                         | `recurringEvents.test.tsx`, `recurrence.test.ts`                                        | Single-day only, as legacy.                                          |
| 42  | Templates, and new events from them             | done   | `features/event-forms/templates.ts`                          | `templates.test.tsx`, `templateValues.test.ts`                                          |                                                                      |
| 43  | Tag teachers who allow it                       | done   | `event-forms/taggableBios.ts`, `ui/form/TagPicker`           | `singleDayForm.test.tsx`, `multiDayForm.test.tsx`, `taggableBios.test.ts`               |                                                                      |
| 44  | A saved event appears at once                   | done   | `features/events/eventCache.ts`                              | `singleDayForm.test.tsx`, `multiDayForm.test.tsx` (no list refetch)                     |                                                                      |
| 45  | Edits, cancels, hides, deletes show at once     | done   | `features/events`                                            | `manageEvents.test.tsx`, `eventCache.test.ts`, `eventWrites.test.tsx`                   |                                                                      |
| 46  | Save finishes when translation fails            | done   | `event-forms/eventSave.ts`, `data/translate.ts`              | `singleDayForm.test.tsx`, `multiDayForm.test.tsx`, `data/translate.test.ts`             | 5 s timeout per lookup.                                              |
| 47  | Forms load fast, with a loading state           | done   | `app/RootLayout.tsx` (`PageLoading`), `event-forms/pages.ts` | `shell.test.tsx` (page loading, added at cutover)                                       | All forms one 28 KB chunk.                                           |
| 48  | Unsaved draft kept on the device                | done   | `app/useFormDraft.ts`                                        | `singleDayForm.test.tsx`, `multiDayForm.test.tsx`, `templates.test.tsx`, `bio.test.tsx` |                                                                      |
| 49  | Hidden events only in management views          | done   | `features/events`, `features/manage-events`                  | `manageEvents.test.tsx`, `singleDayForm.test.tsx` (save hidden)                         |                                                                      |
| 50  | Edit the public bio, shown/taggable switches    | done   | `features/bio`                                               | `bio.test.tsx`, `bioValues.test.ts`                                                     | The show-profile switch is new in the UI.                            |
| 51  | Crop and upload a photo, sized before upload    | done   | `features/bio/PhotoField.tsx`, `app/images`                  | `bio.test.tsx` (photo), `lib/photo.test.ts`, `lib/photoEncoding.test.ts`                | 600px JPEG within 30 KB. `profile` users need the storage migration. |
| 52  | Orgs get the same as creators                   | done   | `app/auth/guard.ts` (`CREATOR_ROLES`, `PROFILE_ROLES`)       | `bio.test.tsx`, `manageEvents.test.tsx`, form tests (creators, orgs and admins)         |                                                                      |

## Admins

| #   | Story (short)                                 | Status | Feature                   | Tests                                                   | Note                                                |
| --- | --------------------------------------------- | ------ | ------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| 53  | Users page lazy; search, filter, page         | done   | `features/admin-users`    | `manageUsers.test.tsx`, `users.test.ts`                 | Server-side search; 20 a page.                      |
| 54  | Role change in one atomic action              | done   | `admin-users/roles.ts`    | `manageUsers.test.tsx` (RPC alone)                      | `assign_user_role` only.                            |
| 55  | Open and closed requests; reply, close        | done   | `features/admin-requests` | `manageSupport.test.tsx`, `adminRequests.test.ts`       | Replies and reopen are new.                         |
| 56  | Admin lists refresh on return; manual refresh | done   | `features/admin`          | `manageUsers`, `manageSupport`, `manageAllEvents` tests |                                                     |
| 57  | Manage all events                             | done   | `features/admin-events`   | `manageAllEvents.test.tsx`, `adminEvents.test.ts`       | Check the write policies first (`docs/cutover.md`). |

## Maintainer

| #   | Story (short)                                  | Status | Feature                                   | Tests                                                                                       | Note                                                                                    |
| --- | ---------------------------------------------- | ------ | ----------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 58  | No realtime anywhere                           | done   | `data/` (sub-clients), `eslint.config.js` | every test (`test/setup.ts` fails any WebSocket)                                            | Tables leave the publication with `supabase/migrations/20261031000000_…` after go-live. |
| 59  | One query cache with clear freshness rules     | done   | TanStack Query; `docs/architecture.md`    | `freshness.test.tsx`, admin and personal pages' refetch tests                               |                                                                                         |
| 60  | CI fails over the size limit                   | done   | `scripts/bundle-size.mjs`, CI             | `scripts/bundle-size.test.ts`                                                               | 150 KB limit; 135.3 KB now.                                                             |
| 61  | Behaviour tests against a fake Supabase        | done   | `test/`                                   | all `*.test.tsx`                                                                            |                                                                                         |
| 62  | Crash reports from boot, heavy parts lazy      | done   | `app/telemetry`                           | `telemetry.test.tsx`, `sentry.test.ts`, `scrubUrl.test.ts`                                  |                                                                                         |
| 63  | PostHog and Speed Insights, not blocking paint | done   | `app/telemetry`                           | `telemetry.test.tsx` (analytics)                                                            | Production host only, never on `isInternal` devices.                                    |
| 64  | One build version for SW, cache and updates    | done   | `vite.config.ts`, `app/buildVersion.ts`   | `freshness.test.tsx` (after a deploy), `persistedCache.test.ts`, `scripts/check-sw.test.ts` |                                                                                         |
| 65  | One cutover, same URLs                         | done   | `app/routes.tsx`, `sw/sw.ts`              | route tests per page, `swRules.test.ts` (takes over from the old worker)                    | Every old path kept. The deploy itself: `docs/cutover.md`.                              |

## Old-client features no story mentions

Every route of the old client (`/`, `/event/:eventId`, `/:eventId`, `/about`,
`/privacy-policy`, `/terms-and-conditions`, `/login`, `/signup`,
`/reset-password-request`, `/reset-password`, `/request[/:requestId]`,
`/bio`, `/bio/request[/:requestId]`, `/manage-events`, `/create-events`,
`/create-events/single-day`, `/create-events/multi-day`,
`/manage-events/edit-single-day/:eventId`,
`/manage-events/edit-multi-day/:eventId`, `/manage-all-events`,
`/manage-users`, `/manage-support`) and every menu item exists in the new
client with the same roles. Its pages, components, hooks and helpers were
swept for behaviour beyond the stories.

**Ported at the cutover** (with tests):

- The kill switch `VITE_DISABLE_APP=true` ("סגור לרגל שיפוצים"): a build
  with it shows a maintenance page on every path (`app/AppDisabled.tsx`;
  `shell.test.tsx`). Dropped from `/` by the build when unset.
- Opening a shared event scrolls its card into the middle of the list
  behind the details, so closing them shows it in context (legacy
  `useScroolToEventById`; `features/calendar/EventList.tsx`;
  `eventDetails.test.tsx`).
- The footer closes the month calendar and the empty list too, not only
  the list (`CalendarPage.tsx`; `shell.test.tsx`).
- The event forms' date pickers stop a year ahead, as legacy's did
  (`DATE_LIMIT`; `latestEventDay`; form tests). Legacy limited the picker
  only, so there is no validation message for a typed later day.

**Dropped on purpose** (recorded in `docs/architecture.md` or commit
messages):

- The weekly-schedule / notifications page (story 36).
- Unknown paths show a 404, not the calendar.
- antd's date and time modals: native inputs (5-minute step kept).
- "Reset the app" keeps the `isInternal` flag (analytics opt-out).
- The inner scroll box: the window scrolls, with scroll restoration.
- The request page's notification line; support requests stay email only.
- Realtime, the polling and visibility listeners, and the `events`/`bios`
  localStorage keys (removed at boot); the header's "connection error"
  text became the out-of-date cloud.
- The admin "Throw Test Error" button on the support page (it only threw,
  to test Sentry; `telemetry.test.tsx` covers reporting).
- Dead legacy code with no user-visible effect: `EventAction.recycle`,
  `useSetSelectedTemplateByParams` (no route had the parameter).

**Remaining differences** (small, none blocks the cutover; follow-ups if
wanted):

1. **Loading skeleton.** Legacy's shimmering placeholder cards on the first
   load are plain "Loading events…" text. Rarely seen: repeat visits render
   from the device.
2. **No "stuck" fallback.** Legacy's spinner turned into "something went
   wrong" with a home button after 30 s. Queries show their own error and
   retry, but a hung lazy chunk or profile request keeps the loading bar.
3. **No per-event error boundary.** A render error in an event's details
   replaces the page with the route error ("Something went wrong", back to
   the calendar); legacy showed an error inside the card.
4. **The route error's "back to the calendar"** is a link; legacy's button
   also reloaded the page.
5. **Photo cropper rotation.** Legacy allowed two-finger rotation; zoom
   only now.
6. **No spinner in the header** while a signed-in user's profile loads
   (the header shows what everyone sees until then).

**Found, not regressions** (same in both clients): `index.html`'s
`og:image`/`twitter:image` point at `/og-image.jpg`, which doesn't exist;
the root `sitemap.xml` is unused (Vite serves `public/sitemap.xml`).
