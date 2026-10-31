// The service worker, built to /sw.js by vite-plugin-pwa (injectManifest,
// vite.config.ts). It precaches the app shell and the build's static files
// and serves every navigation the cached index.html, so the installed app
// opens offline. It caches nothing else: Supabase API, auth, functions and
// storage requests are never intercepted and always go to the network.
// Offline data comes from the persisted query cache (app/persistedCache.ts).
// Typechecked by src/sw/tsconfig.json (worker globals), not the app's.
import { cacheNames, setCacheNameDetails } from "workbox-core"
import {
    createHandlerBoundToURL,
    precacheAndRoute,
    type PrecacheEntry,
} from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"
import {
    activationPlan,
    CACHE_PREFIX,
    installPlan,
    isSkipWaitingMessage,
    NOT_APP_ROUTE,
} from "./swRules"

declare const self: ServiceWorkerGlobalScope & {
    /** The precache list, injected at build time. */
    __WB_MANIFEST: (PrecacheEntry | string)[]
}

setCacheNameDetails({ prefix: CACHE_PREFIX })
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(
    new NavigationRoute(createHandlerBoundToURL("index.html"), {
        denylist: [NOT_APP_ROUTE],
    }),
)

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.keys().then(async (names) => {
            if (installPlan(names).skipWaiting) await self.skipWaiting()
        }),
    )
})

self.addEventListener("activate", (event) => {
    const activation = (async () => {
        const plan = activationPlan(await caches.keys(), cacheNames.precache)
        await Promise.all(plan.deleteCaches.map((name) => caches.delete(name)))
        // Serve the page that installed us too, so it works offline
        // without a reload.
        await self.clients.claim()
        return plan
    })()
    event.waitUntil(activation)
    // Reload legacy pages only once activation is over: their navigations
    // wait for it, so awaiting them inside `waitUntil` would deadlock.
    void activation.then(async (plan) => {
        if (!plan.reloadOpenPages) return
        const pages = await self.clients.matchAll({ type: "window" })
        await Promise.allSettled(pages.map((page) => page.navigate(page.url)))
    })
})

self.addEventListener("message", (event) => {
    if (isSkipWaitingMessage(event.data)) void self.skipWaiting()
})
