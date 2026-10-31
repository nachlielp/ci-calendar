// What the service worker (sw.ts) may cache and delete, and how the page
// talks to it (app/updates/serviceWorker.ts). Plain data and functions, so
// tests check them without a worker.

/**
 * The worker's URL and scope. Legacy's worker (vite-plugin-pwa generateSW)
 * lived at the same URL, so browsers treat this one as its update and swap
 * it in place; never rename it, or legacy's worker would keep serving the
 * old app from its caches.
 */
export const SW_URL = "/sw.js"
export const SW_SCOPE = "/"

/** The page asks a waiting worker to take over (workbox's convention). */
export const SKIP_WAITING = "SKIP_WAITING"

export function isSkipWaitingMessage(data: unknown): boolean {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as { type?: unknown }).type === SKIP_WAITING
    )
}

/**
 * The precache is `ci-calendar-precache-v2-<scope>`, one cache for every
 * version: workbox revisions each file, so a deploy downloads only the files
 * that changed, and the new worker drops the outdated ones when it
 * activates. The prefix keeps it apart from legacy's `workbox-precache-…`.
 */
export const CACHE_PREFIX = "ci-calendar"

/**
 * Caches the legacy worker left: its runtime caches (`api-cache-<version>`,
 * which kept every response, Supabase API calls included, NetworkFirst) and
 * workbox's default precache.
 */
export function isLegacyCache(name: string): boolean {
    return name.startsWith("api-cache-") || name.startsWith("workbox-precache-")
}

/**
 * What a newly installed worker does, given the cache names. Finding
 * legacy caches means legacy's worker is the one being replaced: take over
 * at once, since legacy pages have no code to hand over. Otherwise a new
 * version waits for the page (app/updates/safeUpdates.ts).
 */
export function installPlan(cacheNames: string[]) {
    return { skipWaiting: cacheNames.some(isLegacyCache) }
}

/**
 * What a worker does when it activates, given the cache names:
 *
 * - Delete every cache but its own precache. The worker is the only thing
 *   in the app that uses Cache Storage, so this removes legacy's runtime
 *   caches (stale API responses) and anything else left behind.
 * - After replacing legacy's worker, reload the open pages: they run
 *   legacy's code, whose lazy files are gone now (the server answers a
 *   missing `/assets/…` with a 404), and nothing in them would ever reload.
 *   A normal update needs no reload from here; the page that handed over
 *   reloads itself, and other tabs recover (app/updates/staleChunks.ts).
 */
export function activationPlan(cacheNames: string[], ownPrecache: string) {
    return {
        deleteCaches: cacheNames.filter((name) => name !== ownPrecache),
        reloadOpenPages: cacheNames.some(isLegacyCache),
    }
}

/**
 * Navigations that skip the cached app shell and go to the network: a path
 * whose last segment is a file name (`/sitemap.xml`, `/robots.txt`); the
 * query string doesn't count. Every other path is an app route (events,
 * short links, pages, the 404). Workbox tests it against path + query.
 */
export const NOT_APP_ROUTE = /^[^?]*\/[^/?]+\.[^/?]+(\?.*)?$/

export function servesAppShell(pathAndQuery: string): boolean {
    return !NOT_APP_ROUTE.test(pathAndQuery)
}

/**
 * The build output the worker precaches, relative to `dist/`: the app shell
 * (`index.html`), the hashed JS, CSS, font and images Vite emits, the page
 * loader's logo and the manifest with its icons. An allow-list, so a new
 * file in `public/` (or the 150 KB favicon, which the browser keeps itself)
 * never joins every device's install by accident. Nothing else is ever
 * cached: API, auth, functions and storage requests always go to the
 * network.
 */
export const PRECACHE_GLOBS = [
    "index.html",
    "assets/**/*.{js,css,woff2,png,svg}",
    "ci-logo.svg",
    "site.webmanifest",
    "ci-logo-192-bg.png",
    "ci-logo-512-bg.png",
]

/**
 * Where the build puts the lazy telemetry SDKs (Sentry, its tracing and
 * replay, PostHog, Speed Insights; `vite.config.ts`). They are never
 * precached: a device would download ~140 KB gzip of them on every deploy
 * for nothing, and offline they have nothing to send anyway (a failed
 * import is ignored). They are still hashed and cached as `immutable`.
 */
export const TELEMETRY_ASSETS = "assets/telemetry"

/** Build output matched by `PRECACHE_GLOBS` that is still left out. */
export const PRECACHE_IGNORES = [`${TELEMETRY_ASSETS}/**`]
