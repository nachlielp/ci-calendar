import { sentryVitePlugin } from "@sentry/vite-plugin"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA, VitePWAOptions } from "vite-plugin-pwa"
import { visualizer } from "rollup-plugin-visualizer"
import pkg from "./package.json"
import { SUPABASE_URL_PATTERN } from "./src/pwa/cachePolicy"

// Single source of truth for the app version: package.json. It is injected into
// the client bundle as `__APP_VERSION__` (see `define` below) — which drives the
// in-app version display / DB stamp (App.tsx CACHE_VERSION) — and it names every
// Workbox cache via `cacheId`, so a deploy that bumps the version gets fresh
// caches and the old ones are cleaned up. (#17)
const appVersion = pkg.version

const manifestForPlugin: Partial<VitePWAOptions> = {
    disable: false,
    registerType: "autoUpdate",
    includeAssets: ["ci-logo-512-bg.png", "ci-logo-192-bg.png"],
    manifest: {
        name: "CI Events Israel",
        short_name: "CI Events",
        description:
            "Contact Improvisation events in Israel - ג'אמים, שיעורים, סדנאות",
        icons: [
            {
                src: "/ci-logo-192-bg.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/ci-logo-512-bg.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
            },
        ],
        theme_color: "#171717",
        background_color: "#e8ebf2",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        related_applications: [],
        prefer_related_applications: false,
        shortcuts: [],
        categories: [],
        share_target: {
            action: "/",
            method: "GET",
            params: {
                title: "title",
                text: "text",
                url: "url",
            },
        },
    },
    workbox: {
        // Prefix every Workbox cache (precache + runtime) with the app version,
        // so a version bump rotates cache names and cleanupOutdatedCaches drops
        // the stale ones. This is the "PWA cache naming" half of the single
        // version source (#17).
        cacheId: `ci-calendar-${appVersion}`,
        // Precache the built, content-hashed static assets. Because they are
        // revisioned by Workbox, a fresh deploy always serves fresh assets.
        globPatterns: [
            "**/*.{js,css,html,ico,png,svg,webp,woff,woff2,jpg,jpeg}",
        ],
        runtimeCaching: [
            {
                // Supabase traffic must never be cached — see the rationale in
                // src/pwa/cachePolicy.ts. Always go to the network.
                urlPattern: SUPABASE_URL_PATTERN,
                handler: "NetworkOnly",
            },
        ],
        // Offline SPA fallback: serve the precached app shell for same-origin
        // navigations. (Supabase requests are cross-origin fetches, never
        // navigations, so they never reach this fallback.)
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // Set to 3MB
    },
    // Add notification related strategies
    strategies: "generateSW",
    includeManifestIcons: true,
}

export default defineConfig(({ mode }) => ({
    // Inject the package version so the client has a single, build-time version
    // constant (App.tsx re-exports it as CACHE_VERSION). (#17)
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
    esbuild: {
        target: "es2022",
        // Strip console/debugger from production bundles only (keeps them in
        // dev and test).
        drop: mode === "production" ? ["console", "debugger"] : [],
    },
    build: {
        target: "es2022",
        minify: true,

        rollupOptions: {
            output: {
                manualChunks: {
                    // UI Framework chunk
                    "vendor-ui": ["antd"],

                    // Core React chunk
                    "vendor-react": ["react", "react-dom"],

                    // State Management chunk
                    "vendor-state": ["mobx"],

                    // Date handling chunk
                    "vendor-utils": ["dayjs"],

                    // Data layer chunk
                    "vendor-data": ["@supabase/supabase-js"],
                },
            },
        },

        // Generate sourcemaps for Sentry, but keep them off the public CDN.
        sourcemap: "hidden",
    },
    base: "/",
    plugins: [
        react({
            babel: {
                plugins: [
                    ["@babel/plugin-proposal-decorators", { legacy: true }],
                    [
                        "@babel/plugin-proposal-class-properties",
                        { loose: true },
                    ],
                ],
            },
        }),
        VitePWA(manifestForPlugin),
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
