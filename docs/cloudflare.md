# Cloudflare hosting runbook (spec #37)

How the app is deployed to Cloudflare Workers, tested on a `*.workers.dev`
URL, moved onto `www.ci-events.org` and rolled back. The design is in
`docs/architecture.md`, under "Cloudflare hosting and the edge cache".
Cloudflare has been production since 2026-10-31. Vercel's Git integration
is off; its last deployment is kept as a manual rollback target (see
"Rollback"). The repository no longer has any Vercel config: `vercel.json`
and Speed Insights were removed after the switch (step 6 below).

**Monorepo (#48):** the web app and its Worker live in `apps/web`, so the
paths below (`wrangler.jsonc`, `worker/`, `public/_headers`, `dist/`,
`.env`, `.dev.vars`) are relative to `apps/web`. The `npm run …` commands
work from the repository root, which passes them to the web workspace. Run
`npx wrangler …` inside `apps/web`, or from the root with
`-c apps/web/wrangler.jsonc`.

## What runs where

| Piece                     | Where                                    | Config                                         |
| ------------------------- | ---------------------------------------- | ---------------------------------------------- |
| The SPA (Vite build)      | Workers static assets (`dist/`)          | `wrangler.jsonc` `assets`                      |
| Headers, CSP, caching     | `public/_headers` → `dist/_headers`      | checked by `npm run check:headers` (the build) |
| `GET /api/public-window`  | The Worker (`worker/`), `/api/*` only    | `wrangler.jsonc` `main`, `run_worker_first`    |
| The edge cache            | Cloudflare's Cache API, per data centre  | `worker/publicWindow.ts` (60 s fresh, 10 min)  |
| Web Analytics (optional)  | Beacon from `static.cloudflareinsights…` | `VITE_CF_ANALYTICS_TOKEN` at build time        |
| Database, auth, functions | Supabase, unchanged                      | —                                              |

On the free plan, Worker requests (only `/api/*`) are limited to 100,000 a
day; static assets are free and unlimited.

## One-time setup (maintainer)

1. **Cloudflare account.** Sign up (free plan). Note the account's
   `workers.dev` subdomain (Workers & Pages → Overview).
2. **Wrangler access.** Either `npx wrangler login` (browser), or for CI
   an API token from the "Edit Cloudflare Workers" template, exported as
   `CLOUDFLARE_API_TOKEN` with `CLOUDFLARE_ACCOUNT_ID`. Never commit them.
3. **First deploy** creates the Worker: `npm run cf:deploy` (below). It
   serves `https://ci-calendar.<subdomain>.workers.dev`.
4. **The Worker's variables**, as secrets (kept across deploys, not in
   git). Same values as the client build's `.env`:

    ```sh
    npx wrangler secret put VITE_SUPABASE_URL
    npx wrangler secret put VITE_SUPABASE_ANON_KEY
    ```

    Only the anon key: the Worker never holds the service-role key. Until
    they are set, `/api/public-window` answers 503 and the app reads
    Supabase directly (nothing breaks).

5. **The client build's variables.** The build inlines the `VITE_`
   variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_SUPABASE_STORAGE_BUCKET`, `VITE_GOOGLE_PLACES_API_KEY`,
   `VITE_SENTRY_DSN`, `VITE_PUBLIC_POSTHOG_KEY`,
   `VITE_PUBLIC_POSTHOG_HOST`, `VITE_LANGUAGES_TO_SHOW` and, for Web
   Analytics, `VITE_CF_ANALYTICS_TOKEN`; `SENTRY_AUTH_TOKEN` (build only)
   uploads the source maps. For deploys from a machine they come from
   `.env`; for Workers Builds (below) set them as **build variables**.
6. **Web Analytics** (optional; it replaced Vercel Speed Insights): Analytics & Logs → Web Analytics → Add a site → `ci-events.org`,
   manual JS snippet. Copy the token from the snippet's `data-cf-beacon`
   into `VITE_CF_ANALYTICS_TOKEN`. Like PostHog, it runs only on the
   production hosts (not on previews) and never on internal devices. The
   CSP already allows it.
7. **Deploys from GitHub (Workers Builds)**, optional: Workers & Pages →
   `ci-calendar` → Settings → Builds → connect `nachlielp/ci-calendar`.
   Root directory `/` (the repository root, where the lockfile is); build
   command `npm run build`; deploy command
   `npx wrangler deploy -c apps/web/wrangler.jsonc`; production branch
   `main`. Other branches build with the **Previews Base** tab's settings,
   which are separate: deploy command
   `npx wrangler versions upload -c apps/web/wrangler.jsonc` (a preview URL
   per push, nothing deployed), not the default `npx wrangler preview` (a
   beta that needs a `previews` block), and its own copy of the build
   variables. Node comes from `.nvmrc` (22). Add the build variables of
   step 5 to both tabs; a Workers Builds build without `VITE_SUPABASE_URL`
   and `VITE_SUPABASE_ANON_KEY` fails (`scripts/check-headers.mjs`) rather
   than deploy a site that can't load data.
8. **Supabase auth redirect URLs**: add
   `https://*-ci-calendar.<subdomain>.workers.dev/**` and
   `https://ci-calendar.<subdomain>.workers.dev/**` (Authentication → URL
   configuration) to test sign-in, password reset and Google sign-in on
   previews. Production keeps `https://www.ci-events.org`.
9. **Google Places key**: its HTTP-referrer restriction must allow the
   `workers.dev` origins to test address autocomplete on previews.

## Commands

| Command              | Does                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `npm run cf:dev`     | Builds, then serves `dist/` and the Worker locally (`http://localhost:8787`), `.dev.vars`  |
| `npm run cf:check`   | `wrangler deploy --dry-run`: bundles the Worker, reads the assets; no account (CI runs it) |
| `npm run cf:preview` | Builds and uploads a new version **without deploying it**; prints its preview URL          |
| `npm run cf:deploy`  | Builds and deploys: the uploaded version serves all traffic                                |

`npm run cf:dev` needs `.dev.vars` (gitignored; see `.dev.vars.example`):
the Worker's two variables. It reads the production project with the anon
key: read-only, which is fine (never point it at writes).

## Preview URLs

- `https://ci-calendar.<subdomain>.workers.dev`: the deployed version.
- `https://<version-id-prefix>-ci-calendar.<subdomain>.workers.dev`: each
  uploaded version (`cf:preview`, or a Workers Builds branch build). Add
  `-- --preview-alias <name>` to `cf:preview` for a stable
  `https://<name>-ci-calendar.<subdomain>.workers.dev`.

On every host but the production ones, the CSP reports to Sentry as
`preview` and the app's errors are tagged `preview`; PostHog, Google
Analytics and Web Analytics don't run. The edge cache works
on `workers.dev` too (MISS, then HIT): look at `X-Edge-Cache`.

## Checking a deploy

```sh
URL=https://ci-calendar.<subdomain>.workers.dev
curl -sI $URL/ | grep -iE 'content-security|strict-transport|cache-control'
curl -sI $URL/event/some-id | head -1          # 200: the SPA shell
curl -sI $URL/assets/<a built file>.js | grep -i cache-control   # immutable
curl -s -D - -o /dev/null $URL/api/public-window | grep -iE '^HTTP|x-edge|cache-control'
curl -s -D - -o /dev/null $URL/api/public-window | grep -i x-edge  # HIT on a custom domain
```

Then open the URL: the calendar loads (Network: one `/api/public-window`,
no `ci_events` request to Supabase), and the console shows no CSP errors.

## Moving www.ci-events.org to Cloudflare (the switch)

Before the switch (done 2026-10-31): `www.ci-events.org` was a CNAME to Vercel and the apex answered 308 to
`https://www.ci-events.org/` (both on Vercel); the zone's nameservers were
Google's. The switch was done in this order, at a quiet time; it is kept
here as the record of how.

1. **Copy every DNS record** of the zone (mail included) somewhere safe:
   it is also the rollback plan.
2. **Add `ci-events.org` to Cloudflare** (free plan), check that the
   imported records match the copy, then change the nameservers at the
   registrar to Cloudflare's. Leave the records **DNS only** (grey cloud)
   pointing at Vercel: nothing changes for visitors yet. Wait until the
   zone is active.
3. **Lower the TTL** of the `www` and apex records (e.g. 60 s) a day
   ahead, so the switch and a rollback spread quickly.
4. **Attach www, redirect the apex** (done this way 2026-10-31).
   `wrangler.jsonc` has
   `"routes": [{ "pattern": "www.ci-events.org", "custom_domain": true }]`.
   A custom domain needs the hostname free: delete the `www` CNAME
   (Vercel's) in Cloudflare DNS, then `npm run cf:deploy` at once;
   Cloudflare creates the record and certificate (a minute or two).
   Visitors keep their cached answer (Vercel) meanwhile. The apex keeps
   redirecting to www as on Vercel: its A record becomes `192.0.2.1`
   (a placeholder that is never contacted), **proxied**, and a Redirect
   Rule (Rules → Redirect Rules, template "Redirect from root to WWW":
   hostname equals `ci-events.org` → `https://www.ci-events.org${path}`,
   query kept, 301) answers before anything reaches it.

5. **Check** as in "Checking a deploy" on `https://www.ci-events.org`:
   the production CSP (`sentry_environment=production`, one CSP header),
   `X-Edge-Cache: HIT` on a second request, a sign-in, an event save.
6. **The follow-up PR** (done 2026-11-01): removed `@vercel/speed-insights`
   with its sink and deleted `vercel.json`, so `public/_headers` is the only
   header source (`check-headers.mjs`, `check-sw.mjs`,
   `headers-revision.mjs`). The Vercel project itself is kept, untouched,
   as the rollback target.

## Rollback

- **A bad Worker version** (Cloudflare is serving): roll back to the
  previous version, assets included (they deploy as one unit):

    ```sh
    npx wrangler deployments list
    npx wrangler rollback            # the previous version, or: rollback <version-id>
    ```

    or Workers & Pages → `ci-calendar` → Deployments → Rollback. A rollback
    doesn't change secrets.

- **Back to Vercel** (after the switch): remove the custom domain from the
  Worker (Workers & Pages → `ci-calendar` → Settings → Domains & Routes;
  then delete `routes` in `wrangler.jsonc`), turn off the Redirect Rule,
  and recreate the records: `www` CNAME `cname.vercel-dns.com` and the
  apex A `76.76.21.21`, both **DNS only**.
  Vercel's last deployment is still there and still production; it serves
  the app with the direct Supabase read. Visitors move as the TTL expires.
  That deployment predates the removal of `vercel.json` and Speed
  Insights, so it still has both: it serves its own headers and CSP, and
  Speed Insights runs there. Redeploying a newer commit to Vercel would
  serve no security headers at all (there is no `vercel.json`); restore
  that file from git first if you ever need to.
- **The edge endpoint misbehaving** but the site fine: no action is needed
  for visitors (the app falls back to Supabase on any error or after 3 s).
  Fix forward, or roll back the Worker version.

## Notes

- Writes don't purge the edge cache. Signed-in users (the only writers)
  read Supabase directly, so they always see their own changes; other
  visitors see a change within a minute while the site is busy, and
  within 10 minutes after a quiet spell (stale-while-revalidate, a
  deliberate trade for speed).
- `wrangler.jsonc`'s `compatibility_date` should be at most what the
  installed Wrangler's local runtime supports (`wrangler dev` refuses
  newer dates). Bump it with Wrangler.
- The Worker shares the client's select and data client
  (`features/calendar/publicWindowSelect.ts`, `data/client.ts`); it is
  bundled by Wrangler and never enters the client bundle.
