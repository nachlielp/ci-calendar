const CACHE_VERSION = "v1" // You can update this to trigger cache refresh
const CACHE_NAME = `ci-calendar-cache-${CACHE_VERSION}`
const FILES_TO_CACHE = [
    // "/",
    // "/index.html",
    "./assets/img/Background_2.png",
    "./assets/img/icon-192.png",
    "./assets/img/icon-512.png",
]
self.addEventListener("push", function (event) {
    const { data } = event.data.json()

    const options = {
        body: data.body,
        title: data.title,
        data: { url: data.url },
        icon: "/192.png",
        badge: "/192.png",
    }
    console.log("options:1.5 ", options)
    event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener("notificationclick", (event) => {
    console.log("notificationData.event: ", event)
    const notificationData = event.notification.data
    if (notificationData.url) {
        clients.openWindow(notificationData.url)
    }

    event.notification.close()
})

//TODO cach images and assets
const cacheName = "ci-events-v1.5"

const filesToCache = [
    "./assets/img/Background_2.png",
    "./assets/img/icon-192.png",
    "./assets/img/icon-512.png",
]

self.addEventListener("install", (e) => {
    console.log("[ServiceWorker] - Installing version:", CACHE_VERSION)
    self.skipWaiting()

    e.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME)
                console.log("[ServiceWorker] - Caching app shell")
                await cache.addAll(FILES_TO_CACHE)
            } catch (error) {
                console.error("[ServiceWorker] - Cache failed:", error)
            }
        })()
    )
})

//clean up old caches by name
self.addEventListener("activate", (e) => {
    e.waitUntil(
        (async () => {
            console.log("[ServiceWorker] - Checking caches")

            const keyList = await caches.keys()
            await Promise.all(
                keyList.map((key) => {
                    // Only delete caches that start with 'my-app-cache-' but aren't the current version
                    if (
                        key.startsWith("ci-calendar-cache-") &&
                        key !== CACHE_NAME
                    ) {
                        console.log("[ServiceWorker] - Removing old cache", key)
                        return caches.delete(key)
                    }
                    return Promise.resolve()
                })
            )
        })()
    )
})

//TODO: for navigation with notification links
self.addEventListener("load", () => {
    console.log("Load => nav to page")
    const urlParams = new URLSearchParams(window.location.search)
    const page = urlParams.get("page")
    console.log("page", page)
    console.log("window.location", window.location)
    if (page) {
        navigateToPage(page)
    }
})

function navigateToPage(page) {
    console.log(`Navigating to page: ${page}`)
    navigator.navigate(page)
}
