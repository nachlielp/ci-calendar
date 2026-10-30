import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"

// The PWA/service-worker setup returns with its own slice (spec #34): shell
// precache only, never API responses.

export default defineConfig(({ mode }) => ({
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
