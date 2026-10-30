import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { execSync } from "node:child_process"

// The PWA/service-worker setup returns with its own slice (spec #34): shell
// precache only, never API responses.

/**
 * The build version (`BUILD_VERSION` in src/app/buildVersion.ts): the commit
 * SHA for builds, `dev-<start time>` for the dev server. A new value marks
 * the persisted query cache stale, and slice 7 uses it for the service worker
 * and the update prompt.
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

export default defineConfig(({ command, mode }) => ({
    define: {
        __BUILD_VERSION__: JSON.stringify(buildVersion(command)),
    },
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
