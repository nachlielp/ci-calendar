/**
 * The one build version, fixed at compile time (see `buildVersion` in
 * vite.config.ts): the commit SHA in production builds, `dev-<start time>`
 * on the dev server, "test" under Vitest.
 *
 * Everything that must react to a deploy keys off this value: the persisted
 * query cache (revalidated on a new build) today; the service worker cache
 * and the update prompt later.
 */
export const BUILD_VERSION: string = __BUILD_VERSION__
