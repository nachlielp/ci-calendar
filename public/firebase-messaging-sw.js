const CACHE_VERSION = "v1" // You can update this to trigger cache refresh
const CACHE_NAME = `ci-calendar-cache-${CACHE_VERSION}`
const FILES_TO_CACHE = [
    // "/",
    // "/index.html",
    "./assets/img/Background_2.png",
    "./assets/img/icon-192.png",
    "./assets/img/icon-512.png",
    "./assets/img/cat-butt.gif",
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

// self.addEventListener("notificationclick", (event) => {
//     console.log("notificationData.event: ", event)
//     const notificationData = event.notification.data
//     if (notificationData.url) {
//         clients.openWindow(notificationData.url)
//     }

//     event.notification.close()
// })

// self.addEventListener("notificationclick", (event) => {
//     event.preventDefault()
//     event.notification.close()

//     const urlToOpen = new URL(event.notification.data.url, self.location.origin)
//     console.log("urlToOpen", urlToOpen)
//     const promiseChain = clients
//         .matchAll({
//             type: "window",
//             includeUncontrolled: true,
//         })
//         .then((windowClients) => {
//             // Check if there is already a window/tab open with the target URL
//             let matchingClient = windowClients.find((client) => {
//                 return client.url === urlToOpen
//             })

//             // If a matching window is found, focus it
//             if (matchingClient) {
//                 return matchingClient.focus()
//             }

//             // If no matching window is found, open a new one
//             return clients.openWindow(urlToOpen)
//         })

//     event.waitUntil(promiseChain)
// })

self.addEventListener("notificationclick", (event) => {
    console.log("event", event)
    event.preventDefault()
    event.notification.close()

    const urlToOpen = new URL(event.notification.data.url, self.location.origin)
    console.log("urlToOpen", urlToOpen)
    // event.waitUntil(
    //     clients
    //         .matchAll({
    //             type: "window",
    //             includeUncontrolled: true,
    //         })
    //         .then((windowClients) => {
    //             // If we have an open window/tab
    //             if (windowClients.length > 0) {
    //                 const client = windowClients[0]
    //                 // Navigate to the notification URL
    //                 return client
    //                     .navigate(urlToOpen)
    //                     .then((navigatedClient) => navigatedClient.focus())
    //             }
    //             // If no window/tab is open, open a new one
    //             return clients.openWindow(urlToOpen)
    //         })
    // )
    event.waitUntil(
        clients
            .matchAll({
                type: "window",
                includeUncontrolled: true,
            })
            .then(async (windowClients) => {
                // If we have an open window/tab
                if (windowClients.length > 0) {
                    const client = windowClients[0]
                    try {
                        // First navigate
                        const navigatedClient = await client.navigate(urlToOpen)
                        // Then focus
                        if (navigatedClient) {
                            return navigatedClient.focus()
                        } else {
                            // If navigation failed, open new window
                            return clients.openWindow(urlToOpen)
                        }
                    } catch (error) {
                        console.error("Navigation failed:", error)
                        // Fallback to opening new window
                        return clients.openWindow(urlToOpen)
                    }
                }
                // If no window/tab is open, open a new one
                return clients.openWindow(urlToOpen)
            })
    )
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
