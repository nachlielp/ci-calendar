/**
 * Service-worker cache policy (ticket #17).
 *
 * Supabase REST / auth / storage / realtime / edge-function traffic must NEVER
 * be cached by the service worker. Caching authenticated API responses risks
 * serving one user's data to another and returning stale reads after a write.
 * The SW config (vite.config.ts) routes anything matching this pattern through
 * a `NetworkOnly` handler.
 *
 * This lives in its own module (rather than inline in vite.config.ts) so the
 * matching rule is unit-tested. It is a plain `RegExp` on purpose: Workbox's
 * `generateSW` serialises `runtimeCaching[].urlPattern` into the generated
 * worker, and a RegExp serialises safely whereas a function that closes over
 * imported helpers would not.
 */
export const SUPABASE_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.supabase\.co\//i
