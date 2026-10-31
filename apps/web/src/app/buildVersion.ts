/**
 * The one build version, fixed at build time in index.html's
 * `<meta name="build-version">` (see `buildVersionMeta` in vite.config.ts):
 * the commit SHA in production builds, `dev-<start time>` on the dev server.
 * Kept out of the JS so a deploy leaves unchanged chunks' hashes alone.
 * Tests have no index.html; `renderApp` passes its own version.
 *
 * Everything that must react to a deploy keys off this value: the persisted
 * query cache (revalidated on a new build) and the footer's version. The
 * same deploy changes index.html, so the service worker updates and the app
 * reloads onto it (app/updates).
 */
export const BUILD_VERSION: string =
    document
        .querySelector<HTMLMetaElement>('meta[name="build-version"]')
        ?.getAttribute("content") || "unversioned"
