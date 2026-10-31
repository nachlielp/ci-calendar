import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { VitePWA } from "vite-plugin-pwa"
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { withHeadersRevision } from "./scripts/headers-revision.mjs"
import {
    HEIC_ASSETS,
    PRECACHE_GLOBS,
    PRECACHE_IGNORES,
    TELEMETRY_ASSETS,
} from "./src/sw/swRules.ts"

/**
 * The build version (`BUILD_VERSION` in src/app/buildVersion.ts): the commit
 * SHA for builds (as Vercel, Cloudflare Workers Builds, GitHub Actions or
 * git give it), `dev-<start time>` for the dev server. A new value marks
 * the persisted query cache stale, and changes index.html and so the service
 * worker's precache list, which is how browsers notice a deploy.
 */
function buildVersion(command: "build" | "serve"): string {
    // Each dev server start counts as a new build.
    if (command === "serve") return `dev-${Date.now()}`
    const sha =
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.WORKERS_CI_COMMIT_SHA ??
        process.env.GITHUB_SHA ??
        gitSha()
    // Without git (e.g. a source tarball), every build counts as new.
    return sha ? sha.slice(0, 12) : `build-${Date.now()}`
}

function gitSha(): string | undefined {
    try {
        return execSync("git rev-parse HEAD", {
            stdio: ["ignore", "pipe", "ignore"],
        })
            .toString()
            .trim()
    } catch {
        return undefined
    }
}

/**
 * Puts the build version in index.html (`<meta name="build-version">`), not
 * in the JS, so a deploy changes only the chunks whose code changed and the
 * service worker downloads only those.
 */
function buildVersionMeta(version: string): Plugin {
    return {
        name: "build-version-meta",
        transformIndexHtml: () => [
            {
                tag: "meta",
                attrs: { name: "build-version", content: version },
                injectTo: "head-prepend",
            },
        ],
    }
}

/**
 * Modules only the lazy telemetry chunks hold: the SDKs and the app's
 * modules that start them (src/app/telemetry). Their chunks go to
 * `TELEMETRY_ASSETS`, which the service worker never precaches.
 */
const TELEMETRY_MODULE =
    /\/node_modules\/(@sentry|@sentry-internal|posthog-js|@vercel\/speed-insights)\/|\/src\/app\/telemetry\/(sentry|sentryTracing|sentryReplay|posthog|speedInsights)\.ts$/

/** The HEIC converter, whose chunk goes to `HEIC_ASSETS` (never precached). */
const HEIC_MODULE = /\/node_modules\/heic-to\//

export default defineConfig(({ command, mode }) => {
    const version = buildVersion(command)
    // Release builds (CI) upload source maps to Sentry; see the plugin below.
    const uploadMaps = !!process.env.SENTRY_AUTH_TOKEN
    return {
        build: {
            target: "es2022",
            // dist/.vite/manifest.json feeds the bundle size check
            // (scripts/bundle-size.mjs).
            manifest: true,
            // Source maps only for Sentry, which deletes them after upload;
            // other builds (previews, local) make none, so none ever ship
            // (`check:sw` fails if dist/ holds one).
            sourcemap: uploadMaps && "hidden",
            rolldownOptions: {
                output: {
                    // Strip console/debugger from production bundles only
                    // (keeps them in dev and test, which never minify).
                    ...(mode === "production" && {
                        minify: {
                            compress: { dropConsole: true, dropDebugger: true },
                        },
                    }),
                    chunkFileNames: (chunk) => {
                        const has = (module: RegExp) =>
                            !chunk.isEntry &&
                            chunk.moduleIds.some((id) => module.test(id))
                        if (has(TELEMETRY_MODULE)) {
                            return `${TELEMETRY_ASSETS}/[name]-[hash].js`
                        }
                        if (has(HEIC_MODULE)) {
                            return `${HEIC_ASSETS}/[name]-[hash].js`
                        }
                        return "assets/[name]-[hash].js"
                    },
                },
            },
        },
        base: "/",
        plugins: [
            react(),
            buildVersionMeta(version),
            // The service worker (src/sw/sw.ts → dist/sw.js), production
            // builds only: precaches the app shell and static files, never
            // API responses. The app registers it itself after the first
            // paint (app/updates), and the manifest stays
            // public/site.webmanifest.
            VitePWA({
                strategies: "injectManifest",
                srcDir: "src/sw",
                filename: "sw.ts",
                injectRegister: false,
                manifest: false,
                injectManifest: {
                    globPatterns: PRECACHE_GLOBS,
                    globIgnores: PRECACHE_IGNORES,
                    // index.html is cached with its headers (the CSP), so
                    // a change to vercel.json's headers must update it too
                    // (scripts/headers-revision.mjs; `check:sw` checks).
                    manifestTransforms: [
                        (entries) => ({
                            manifest: withHeadersRevision(
                                entries,
                                JSON.parse(
                                    readFileSync(
                                        new URL(
                                            "./vercel.json",
                                            import.meta.url,
                                        ),
                                        "utf8",
                                    ),
                                ),
                            ),
                            warnings: [],
                        }),
                    ],
                    // The worker's own sourcemap would ship publicly.
                    sourcemap: false,
                },
            }),
            // Bundle analyzer — opt in with `ANALYZE=true npm run build`.
            process.env.ANALYZE === "true" &&
                visualizer({ open: true, filename: "stats.html" }),
            // Upload sourcemaps to Sentry only when an auth token is present
            // (i.e. CI / release builds), then delete them so they never ship.
            // The release is the build version the app reports
            // (app/telemetry/sentry.ts), and stays out of the JS like it.
            uploadMaps &&
                sentryVitePlugin({
                    org: "nachliel",
                    project: "ci-calendar",
                    release: { name: version, inject: false },
                    sourcemaps: {
                        filesToDeleteAfterUpload: ["./dist/**/*.map"],
                    },
                }),
        ],

        server: {
            host: "localhost",
        },
    }
})
