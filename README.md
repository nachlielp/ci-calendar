# [CI Calendar](https://ci-events.org/)

## Introduction

This app is a work in progress, attempting, together with the [Israeli Contact Improve org](https://www.contactil.org/amutah), to solve the Israeli Contact Improv community's need for a calendar that is easy to use and navigate.

- [App walkthrough video](https://youtu.be/au4L1sRE46w)

## Features

### Visitors

- The app is a PWA, installable to the home screen on iOS and Android devices, and opens offline with the events last seen
- List and month-calendar views of the next three months of events, in Hebrew, English or Russian
- Events can be filtered by region and type (workshop, jam, etc.); filters stay in the URL, so a filtered view can be shared, and the last ones chosen come back on the next visit
- An event opens to a modal on desktop and a drawer on mobile, with its full details, the tagged teachers' bios, add to calendar, a link to copy or share, and the address on the map
- Shared event links (`/event/<id>`, `/<short id>`) open that event

### Teachers and organizers

- Can add events to the calendar, single-day (with segments) or multi-day, once or recurring
- Can edit, cancel, hide and delete their events, and a recurring event's later events with it
- Can save templates and start new events from them
- Can edit their public bio and photo, and choose whether others can tag them
- Can ask for a role and follow their requests

### Admins

- Can search users and change their roles
- Can manage and answer support and role requests
- Can manage every creator's events

## Tech stack

- Vite, React 19, TypeScript; React Router (data router, every page but the calendar lazy)
- TanStack Query for server data, with the public calendar persisted on the device
- Supabase (PostgREST, auth, storage and Edge Functions through their sub-clients; no realtime)
- A Workbox service worker (vite-plugin-pwa, `injectManifest`) that precaches the app shell
- Sass for styles; no component library
- Cloudflare Workers (static hosting, security headers, the edge-cached public window), Sentry, PostHog, Google Places
- Vitest and Testing Library against a fake Supabase client

How it fits together, and the rules to follow when changing it, are in
[`docs/architecture.md`](./docs/architecture.md). Start there.

## Repository layout

An npm-workspaces monorepo (one lockfile at the root; plan in
[#48](https://github.com/nachlielp/ci-calendar/issues/48)):

| Path        | What                                                                    |
| ----------- | ----------------------------------------------------------------------- |
| `apps/web`  | The Vite client and its Cloudflare Worker (`worker/`, `wrangler.jsonc`) |
| `supabase/` | The shared backend: migrations and Edge Functions                       |
| `docs/`     | Architecture, runbooks and checklists                                   |

The shared core package (`packages/core`) and the Expo app (`apps/mobile`)
come next (#48). Install from the root; the scripts below run from the
root too, and pass on to the web workspace.

## Getting started

Needs Node 22 (`.nvmrc`).

```bash
npm ci
cp apps/web/.env.example apps/web/.env   # then fill in the values
npm run dev
```

## Scripts

| Script                            | What it does                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`                     | Vite dev server (no service worker, no telemetry)                                 |
| `npm run build`                   | Typecheck, production build into `dist/`, then the security headers check         |
| `npm run preview`                 | Serve `dist/`                                                                     |
| `npm run typecheck`               | TypeScript for the app, the service worker and `vite.config.ts`                   |
| `npm run lint`                    | ESLint                                                                            |
| `npm run format` / `format:check` | Prettier                                                                          |
| `npm test` / `test:watch`         | Vitest                                                                            |
| `npm run check:bundle`            | After a build: fails if `/`'s initial JS is over the gzip limit; per-route report |
| `npm run check:sw`                | After a build: checks what the service worker precaches                           |
| `npm run check:headers`           | After a build: checks the headers and CSP against the build                       |
| `npm run gen:types`               | Regenerate `apps/web/src/data/database.types.ts` from Supabase                    |
| `npm run cf:check` / `cf:deploy`  | Cloudflare: Worker dry run / build and deploy (`docs/cloudflare.md`)              |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, format check, tests,
build, `check:bundle` and `check:sw` on every pull request.

## Environment variables

Copy [`apps/web/.env.example`](./apps/web/.env.example) to `apps/web/.env` and fill in real values; it
documents each one. Every `VITE_`-prefixed variable is inlined into the public
client bundle, so only values safe to expose in the browser belong there.

### Runtime (client)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET` (bio photos; production: `ci_bio_profiles`)
- `VITE_GOOGLE_PLACES_API_KEY` (address autocomplete; referrer-restricted)
- `VITE_SENTRY_DSN` (crash reports)
- `VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST` (analytics)
- `VITE_WHATSAPP_NUMBER` (the header's WhatsApp link; hidden when empty)
- `VITE_LANGUAGES_TO_SHOW` (optional, default `he,en,ru`)
- `VITE_HIDE_EVENTS_FLAG` (optional: new events start hidden)
- `VITE_DISABLE_APP` (optional: `true` shows a "closed for maintenance" page instead of the app)

### Build-time only (not shipped to the browser)

- `SENTRY_AUTH_TOKEN`: uploads source maps to Sentry; when unset the Sentry build plugin is skipped and no source maps are made

The Google Translate key is a Supabase Edge Function secret, never a client
variable: see [`supabase/functions/translate`](./supabase/functions/translate/README.md).

## Database

The Supabase backend (schema, RLS, functions) is shared with the old client.
Schema changes are SQL files in `supabase/migrations/`, applied by hand.

- [Database Schema](./docs/database-schema.md)
- [Database Functions](./docs/database-functions.md)
- [Row Level Security](./docs/rls.md)

## More docs

- [Architecture](./docs/architecture.md)
- [Cutover checklist](./docs/cutover.md) and [user-story parity](./docs/parity.md)
- [Performance baseline](./docs/perf-baseline.md)
- [Harvesting analytics data (PostHog)](./docs/posthog.md)
