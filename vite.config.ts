import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA, VitePWAOptions } from "vite-plugin-pwa"
import { visualizer } from "rollup-plugin-visualizer"
import pkg from "./package.json"

const timestamp = new Date().getTime()
const buildVersion = `${pkg.version}-${timestamp}`
//
const manifestForPlugin: Partial<VitePWAOptions> = {
    disable: true,
    registerType: "autoUpdate",
    includeAssets: ["ci-logo-512-bg.png", "ci-logo-192-bg.png"],
    manifest: {
        name: "CI",
        short_name: "CI",
        description: "CI Events near you",
        icons: [
            {
                src: "/ci-logo-192-bg.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "monochrome",
            },
            {
                src: "/ci-logo-192-bg.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "monochrome",
            },
            {
                src: "/ci-logo-512-bg.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/ci-logo-192-bg.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
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
        runtimeCaching: [
            {
                urlPattern: ({ url }) => true, // Match all routes
                handler: "NetworkFirst",
                options: {
                    cacheName: `api-cache-${buildVersion}`,
                },
            },
        ],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
    },
    // Add notification related strategies
    strategies: "generateSW",
    includeManifestIcons: true,
}

export default defineConfig({
    esbuild: {
        target: "es2022",
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

        sourcemap: true
    },
    base: "/",
    plugins: [react({
        babel: {
            plugins: [
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                [
                    "@babel/plugin-proposal-class-properties",
                    { loose: true },
                ],
            ],
        },
    }), VitePWA(manifestForPlugin), // This plugin helps visualize the size of your bundles
    visualizer({ open: true }), sentryVitePlugin({
        org: "nachliel",
        project: "ci-calendar"
    })],

    server: {
        host: "localhost",
    },
})