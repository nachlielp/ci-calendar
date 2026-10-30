import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { VitePWA } from "vite-plugin-pwa"
import { execSync } from "node:child_process"
import { PRECACHE_GLOBS } from "./src/sw/swRules"

/**
 * The build version (`BUILD_VERSION` in src/app/buildVersion.ts): the commit
 * SHA for builds, `dev-<start time>` for the dev server. A new value marks
 * the persisted query cache stale, and changes index.html and so the service
 * worker's precache list, which is how browsers notice a deploy.
 */
function buildVersion(command: "build" | "serve"): string {
    // Each dev server start counts as a new build.
    if (command === "serve") return `dev-${Date.now()}`
    const sha =
        process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? gitSha()
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

export default defineConfig(({ command, mode }) => ({
    esbuild: {
        target: "es2022",
        // Strip console/debugger from production bundles only (keeps them in
        // dev and test).
        drop: mode === "production" ? ["console", "debugger"] : [],
    },
    build: {
        target: "es2022",
        // dist/.vite/manifest.json feeds the bundle size check
        // (scripts/bundle-size.mjs).
        manifest: true,
        // Generate sourcemaps for Sentry, but keep them off the public CDN.
        sourcemap: "hidden",
    },
    base: "/",
    plugins: [
        react(),
        buildVersionMeta(buildVersion(command)),
        // The service worker (src/sw/sw.ts → dist/sw.js), production builds
        // only: precaches the app shell and static files, never API
        // responses. The app registers it itself after the first paint
        // (app/updates), and the manifest stays public/site.webmanifest.
        VitePWA({
            strategies: "injectManifest",
            srcDir: "src/sw",
            filename: "sw.ts",
            injectRegister: false,
            manifest: false,
            injectManifest: {
                globPatterns: PRECACHE_GLOBS,
                // The worker's own sourcemap would ship publicly.
                sourcemap: false,
            },
        }),
        // Bundle analyzer — opt in with `ANALYZE=true npm run build`.
        process.env.ANALYZE === "true" &&
            visualizer({ open: true, filename: "stats.html" }),
        // Upload sourcemaps to Sentry only when an auth token is present
        // (i.e. CI / release builds), then delete them so they never ship.
        process.env.SENTRY_AUTH_TOKEN &&
            sentryVitePlugin({
                org: "nachliel",
                project: "ci-calendar",
                sourcemaps: {
                    filesToDeleteAfterUpload: ["./dist/**/*.map"],
                },
            }),
    ],

    server: {
        host: "localhost",
    },
}))
