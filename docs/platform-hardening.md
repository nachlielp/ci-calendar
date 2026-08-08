# Platform hardening (ticket #17)

Three baseline protections: security headers on every response, a service
worker that can no longer serve wrong data, and one version value instead of
three.

## 1. Security headers (`vercel.json`)

Every response carries these, applied to `/(.*)`:

| Header                                | Value                                          | Purpose                                      |
| ------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| `Strict-Transport-Security`           | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years                      |
| `X-Content-Type-Options`              | `nosniff`                                      | No MIME sniffing                             |
| `X-Frame-Options`                     | `SAMEORIGIN`                                   | Clickjacking (app is never embedded)         |
| `Referrer-Policy`                     | `strict-origin-when-cross-origin`              | Don't leak full URLs cross-origin            |
| `Permissions-Policy`                  | `camera=(), microphone=(), usb=(), payment=()` | Disable powerful features the app never uses |
| `Content-Security-Policy-Report-Only` | see `vercel.json`                              | Resource allowlist — **report-only for now** |

### CSP is Report-Only (deliberate)

The app pulls from many third-party origins (Google Tag Manager / Analytics,
PostHog, Sentry, Supabase, Google Maps/Places, Cloudinary, UploadThing, Vercel
Insights) and ships inline scripts/styles in `index.html`. Shipping an
_enforced_ CSP blind risks breaking production, so it ships as
`Content-Security-Policy-Report-Only`: browsers **report** violations to the
console but **block nothing**.

**To promote it to enforced (follow-up):**

1. Deploy this branch's preview.
2. Exercise the app (calendar, auth/sign-in, event create with image upload +
   address autocomplete, profile bio, admin user management) with DevTools →
   Console open.
3. Every `[Report Only] Refused to …` line names an origin/directive the real
   policy is missing. Add the origins, remove `'unsafe-inline'` /
   `'unsafe-eval'` from `script-src` if nothing needs them (consider nonces for
   the `index.html` inline scripts).
4. Rename the header key `Content-Security-Policy-Report-Only` →
   `Content-Security-Policy`.

There is no `report-uri`/`report-to` endpoint; validation is by console
inspection on the preview. Wiring CSP reports to Sentry is a possible later
step.

### Verifying the headers on the preview

```bash
curl -sI https://<preview-deployment>.vercel.app/ | grep -iE \
  'strict-transport|content-type-options|frame-options|referrer-policy|permissions-policy|content-security'
```

## 2. Service worker cache scope (`vite.config.ts`, `src/pwa/cachePolicy.ts`)

Previously the SW ran `runtimeCaching: [{ urlPattern: () => true, handler:
"NetworkFirst" }]` — it cached **every** request, including authenticated
Supabase REST/auth responses. That risks serving one user's data to another and
returning stale reads.

Now:

- **Static assets** are precached (`globPatterns`), content-hashed by Workbox,
  so a fresh deploy always serves fresh assets.
- **Same-origin navigations** fall back to the precached `index.html` shell when
  offline (`navigateFallback`), so the app still loads offline.
- **Supabase** (`SUPABASE_URL_PATTERN` = `^https://<ref>.supabase.co/…`) is
  routed through `NetworkOnly` — it is **never** cached. (Supabase calls are
  cross-origin fetches, so they also never hit the navigation fallback.) The
  pattern is unit-tested in `src/pwa/cachePolicy.test.ts`.
- Nothing else is runtime-cached; other requests go straight to the network.

### Verifying in DevTools

1. Load the preview, open DevTools → Application → Cache Storage. Caches are
   named `ci-calendar-<version>-…`. Confirm **no** cache contains
   `*.supabase.co/rest|auth|storage` entries.
2. Network tab → make a request that hits Supabase → the response should be
   `(from network)`, never `(from ServiceWorker)` / `(from disk cache)`.
3. Deploy a change → reload → fresh data appears. Go offline → the app shell
   still loads.

## 3. Single version source (`package.json` → everything)

There used to be three disagreeing versions: a hard-coded `CACHE_VERSION`
constant in `App.tsx`, a `${pkg.version}-${timestamp}` PWA cache stamp, and the
`package.json` version (which sat at `0.0.0`). They now collapse to one:

- **`package.json` `version`** is the source of truth (set to `1.6.82`, the last
  value the in-app constant carried). Bump it on release.
- Vite injects it as **`__APP_VERSION__`** (`define` in `vite.config.ts`, mirrored
  in `vitest.config.ts`), and `App.tsx` re-exports it as `CACHE_VERSION` — this
  drives the in-app version label and the DB version stamp.
- Workbox's **`cacheId`** is `ci-calendar-<version>`, so the same value names
  every PWA cache; a version bump rotates caches and `cleanupOutdatedCaches`
  drops the stale ones.
