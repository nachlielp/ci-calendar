import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA, VitePWAOptions } from "vite-plugin-pwa"
import { visualizer } from "rollup-plugin-visualizer"

//
const manifestForPlugin: Partial<VitePWAOptions> = {
    registerType: "prompt",
    includeAssets: ["512.png", "192.png"],
    manifest: {
        name: "CI",
        short_name: "CI",
        description: "CI Events near you",
        icons: [
            {
                src: "/192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "monochrome",
            },
            {
                src: "/192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "monochrome",
            },
            {
                src: "/512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/192.png",
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
                    cacheName: "api-cache",
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
    base: "/",
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            workbox: {
                globPatterns: [
                    "**/*.{js,css,html,ico,png,svg,ttf,gif,woff,woff2}",
                ],
                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-cache",
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "gstatic-fonts-cache",
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /\.(?:png|gif|jpg|jpeg|svg|ico)$/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "images-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // <== 30 days
                            },
                        },
                    },
                    {
                        urlPattern:
                            /^https:\/\/firestore\.googleapis\.com\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            networkTimeoutSeconds: 10,
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60, // <== 1 hour
                            },
                        },
                    },
                ],
            },
            manifest: {
                name: "CI Calendar",
                short_name: "CI",
                description: "CI Events near you",
                theme_color: "#171717",
                background_color: "#e8ebf2",
                display: "standalone",
                orientation: "portrait",
                scope: "/",
                start_url: "/",
                icons: [
                    {
                        src: "/192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
        }),
        visualizer({ open: true }),
    ],
    server: {
        host: "localhost",
    },
})
