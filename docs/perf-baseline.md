# Performance baseline (spec #34)

The new client is judged against these numbers, not against estimates.
Re-run with `npm run build && npm run check:bundle` (per-chunk report) and
`npm run check:sw` (precache). The old client's numbers came from
`npx vite build --manifest` on `develop` @ `447211c2`; it is no longer in the
tree (git history before the cutover commit).

## Initial JavaScript for `/` (gzip)

| Client                                 | Initial JS   | Measured   |
| -------------------------------------- | ------------ | ---------- |
| Old client (`develop` @ `447211c2`)    | 568.7 KB     | 2026-10-30 |
| New client, walking skeleton (slice 1) | 113.2 KB     | 2026-10-30 |
| **New client at cutover**              | **135.3 KB** | 2026-10-31 |
| Limit enforced in CI (`bundleBudget`)  | 150 KB       |            |

At cutover `/` loads **76% less JavaScript** than the old client (−433 KB
gzip), with every feature of the old one (`docs/parity.md`).

Old client breakdown: app entry 223.8 KB, antd (`vendor-ui`) 285.1 KB, MobX
(`vendor-state`) 15.8 KB, `@supabase/supabase-js` incl. realtime
(`vendor-data`) 44.0 KB. Its heaviest lazy pages: manage-all-events and
manage-my-events, ~60 KB each on top.

New client at cutover, the six chunks `index.html` loads and
`modulepreload`s for `/` (Vite 8 / Rolldown):

| Chunk                   | gzip    | Holds                                                   |
| ----------------------- | ------- | ------------------------------------------------------- |
| `index-*.js` (entry)    | 94.0 KB | React DOM, TanStack Query, postgrest-js, the shell, `/` |
| `chunk-*.js`            | 29.9 KB | React Router                                            |
| `eventOptions-*.js`     | 7.8 KB  | Event vocabulary and helpers shared with lazy pages     |
| `react-*.js`            | 2.9 KB  | React                                                   |
| `rolldown-runtime-*.js` | 0.4 KB  | Bundler runtime                                         |
| `jsx-runtime-*.js`      | 0.3 KB  | JSX runtime                                             |

Plus `/`'s CSS (`index-*.css`, 3.0 KB gzip) and the preloaded subset font
(`assistant-hebrew-latin-*.woff2`, 25.7 KB, already compressed).

### Lazy routes and parts (gzip, on top of `/`)

| Loaded when                                              | Chunk                                      | gzip       |
| -------------------------------------------------------- | ------------------------------------------ | ---------- |
| An event's details open                                  | `EventDetailsDialog`                       | 7.1 KB     |
| The menu opens                                           | `MenuDrawer`                               | 2.8 KB     |
| About / privacy / terms / 404                            | one chunk each                             | 0.4–3.9 KB |
| Login, sign-up, password reset pages                     | one chunk each                             | 3.3–3.5 KB |
| Auth is needed (sign-in, refresh, idle)                  | `authClient` (auth-js)                     | 22.3 KB    |
| `/request`, `/bio/request`                               | `RequestsPage`                             | 10.4 KB    |
| `/manage-events`                                         | `ManageEventsPage`                         | 18.6 KB    |
| `/create-events…`, the edit forms                        | `event-forms/pages` (all forms, one chunk) | 28.4 KB    |
| `/bio`                                                   | `BioPage`                                  | 13.6 KB    |
| A photo is picked (cropper, canvas)                      | `photoTools`                               | 7.3 KB     |
| The first photo upload                                   | `filesClient` (storage-js)                 | 7.1 KB     |
| The first Edge Function call (translation)               | `functionsClient` (functions-js)           | 1.8 KB     |
| The address field is focused                             | `googlePlaces` (+ Google's own script)     | 0.7 KB     |
| `/manage-users`, `/manage-support`, `/manage-all-events` | `admin/pages` (one chunk)                  | 31.9 KB    |
| After load and idle (production)                         | Sentry 36.8, + tracing 63.0, + replay 80.1 | —          |
| After the first paint (production host only)             | PostHog 52.3, Speed Insights 0.8           | —          |

The telemetry SDKs live in `assets/telemetry/`, are never precached, and
never block the first paint.

## Public calendar payload

One request for the 90-day window (visible events, the columns the list and
details need, the tagged teachers' public bios embedded). Re-measured
read-only with the anon key on 2026-10-31: **25 events, 53.7 KB raw /
6.3 KB gzip / 4.7 KB brotli** (30 days: 14 events, 5.0 KB gzip). Small
enough that the spec's 0–30 / 30–90 split isn't worth a second request.

A repeat visit renders from the persisted copy (device storage) before that
request returns.

## Service worker precache

77 files, 927.6 KB before compression, ~330 KB as transferred (JS 262 KB,
font 25.7 KB, PNG icons 20.9 KB, CSS 15.1 KB, the rest under 6 KB):
`index.html` and the hashed build files, the telemetry SDKs excluded. It
downloads once per device in the background after the first visit; a deploy
re-downloads only the files whose content changed. No API responses are
cached (the old client's worker cached every response, API calls
included, NetworkFirst).

## Field data (Vercel Speed Insights)

No field data for the old client: Speed Insights showed no traffic in the
window the dashboard offers (checked 2026-10-31). The lab numbers below
stand in as its baseline.

### Lab baseline (Lighthouse 12, mobile, production)

The old client on www.ci-events.org, `/`, 2026-10-31, three runs
(simulated mobile throttling, headless Chrome):

| Run    | Score | LCP   | FCP   | TBT    | CLS | Speed Index |
| ------ | ----- | ----- | ----- | ------ | --- | ----------- |
| 1      | 55    | 9.2 s | 4.5 s | 340 ms | 0   | 4.9 s       |
| 2      | 61    | 8.9 s | 4.4 s | 180 ms | 0   | 4.8 s       |
| 3      | 62    | 8.9 s | 4.4 s | 170 ms | 0   | 4.7 s       |
| Median | 61    | 8.9 s | 4.4 s | 180 ms | 0   | 4.8 s       |

Re-run the same way after the deploy:
`npx lighthouse@12 https://www.ci-events.org/ --only-categories=performance --form-factor=mobile`.

The new client on production, same test, 2026-10-31 (right after the
cutover deploy):

| Run    | Score | LCP   | FCP   | TBT    | CLS | Speed Index |
| ------ | ----- | ----- | ----- | ------ | --- | ----------- |
| 1      | 79    | 4.8 s | 1.6 s | 40 ms  | 0   | 4.5 s       |
| 2      | 78    | 4.8 s | 1.6 s | 120 ms | 0   | 4.6 s       |
| 3      | 82    | 4.8 s | 1.6 s | 40 ms  | 0   | 3.0 s       |
| Median | 79    | 4.8 s | 1.6 s | 40 ms  | 0   | 4.5 s       |

Against the old client's medians: FCP −64% (4.4 → 1.6 s), LCP −46%
(8.9 → 4.8 s), TBT −78% (180 → 40 ms). The LCP element is the first
event's title; 86% of its time is render delay, waiting for the public
window's request after the JS has run, so that request (the edge cache
in spec #37) is the next lever, not the bundle.

### Field data, once there is traffic

- **Before the cutover deploy** (skipped, see above): copy the old client's p75 LCP, INP, CLS,
  FCP and TTFB for `/` and `/event/[eventId]` on production
  (www.ci-events.org), mobile and desktop separately, last 30 days, into the
  table below.
- **After it:** let a week of traffic accumulate (Speed Insights reports per
  deployment; filter on the cutover deployment and later), then copy the
  same metrics. Expect LCP and FCP to drop most on first visits on mobile,
  INP to drop on the calendar (no antd), and CLS to stay low (the font no
  longer swaps). A regression worth a look is anything worse than the old
  client at p75.

| Metric (p75, `/`, mobile) | Old client | New client |
| ------------------------- | ---------- | ---------- |
| LCP                       |            |            |
| FCP                       |            |            |
| INP                       |            |            |
| CLS                       |            |            |
| TTFB                      |            |            |
