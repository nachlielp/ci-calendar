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
    console.log("[ServiceWorker] - Install")
    self.skipWaiting()
    e.waitUntil(
        (async () => {
            const cache = await caches.open(cacheName)
            console.log("[ServiceWorker] - Caching app shell")
            await cache.addAll(filesToCache)
        })()
    )
})

//clean up old caches by name
self.addEventListener("activate", (e) => {
    e.waitUntil(
        (async () => {
            // await self.registration.unregister();
            console.log("[ServiceWorker] - Unregistered old service worker")

            const keyList = await caches.keys()
            await Promise.all(
                keyList.map((key) => {
                    console.log(key)

                    if (key !== cacheName) {
                        console.log("[ServiceWorker] - Removing old cache", key)
                        return caches.delete(key)
                    }
                })
            )
        })()
    )
    self.clients.claim()
})

window.addEventListener("load", () => {
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
