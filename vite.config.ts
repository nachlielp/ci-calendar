import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA, VitePWAOptions } from "vite-plugin-pwa"
import { visualizer } from "rollup-plugin-visualizer"
import pkg from "./package.json"

const timestamp = new Date().getTime()
const buildVersion = `${pkg.version}-${timestamp}`
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
    },
    base: "/",
    plugins: [
        react(),
        VitePWA(manifestForPlugin),
        visualizer({ open: true }), // This plugin helps visualize the size of your bundles
    ],

    server: {
        host: "localhost",
    },
})
