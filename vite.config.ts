import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA, VitePWAOptions } from "vite-plugin-pwa"
import { visualizer } from "rollup-plugin-visualizer"

//
const manifestForPlugin: Partial<VitePWAOptions> = {
    registerType: "autoUpdate",
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
    // workbox: {
    //     runtimeCaching: [
    //         {
    //             urlPattern: ({ url }) => true,
    //             handler: "NetworkFirst",
    //             options: {
    //                 cacheName: "api-cache",
    //             },
    //         },
    //     ],
    //     navigateFallback: "index.html",
    //     cleanupOutdatedCaches: true,
    //     skipWaiting: true, // Add this
    //     clientsClaim: true, // Add this
    // },
    // Add notification related strategies
    strategies: "generateSW",
    includeManifestIcons: true,
    devOptions: {
        enabled: true, // Enable PWA in development
        type: "module", // Add this
    },
}

export default defineConfig({
    base: "./",
    plugins: [react(), VitePWA(manifestForPlugin), visualizer({ open: true })],
    server: {
        host: "localhost",
        headers: {
            "Service-Worker-Allowed": "/",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
    optimizeDeps: {
        exclude: ["firebase/messaging"],
    },
})
