self.addEventListener("install", (event) => {
    const CACHE_NAME = "ci-calendar-cache-v5"
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                "/",
                "/index.html",
                "/192.png",
                "/512.png",
                "/ci-circle-192.png",
                "/assets/",
            ])
        })
    )
})

self.addEventListener("fetch", (event) => {
    const urlsToNotCache = [
        "supabase.co",
        "firebase",
        "firebaseio.com",
        "firebasedatabase.app",
    ]
    if (urlsToNotCache.some((url) => event.request.url.includes(url))) {
        event.respondWith(fetch(event.request))
        return
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request)
        })
    )
})
self.addEventListener("push", function (event) {
    try {
        let payload
        try {
            payload = event.data.json()
        } catch (e) {
            payload = {
                data: { title: "New Notification", body: event.data.text() },
            }
        }

        // Get current badge count from IndexedDB or other storage
        //anynimous function in waitUntil needs to be async for this
        // const getBadgeCount = async () => {
        //   const reg = await self.registration;
        //   return reg
        //     .getNotifications()
        //     .then((notifications) => notifications.length + 1);
        // };

        const data = payload.data || payload

        const options = {
            body: data.body || "No message content",
            title: data.title || "New Notification",
            data: { push_event_url: data.url || "/" },
            icon: "/192.png",
            badge: data.badge || 1,
        }

        event.waitUntil(
            (() => {
                if (navigator.setAppBadge) {
                    navigator.setAppBadge(options.badge)
                }

                return self.registration.showNotification(
                    options.title,
                    options
                )
            })()
        )
    } catch (error) {
        console.error("Error in push event: ", error)
    }
})

self.addEventListener("notificationclick", (event) => {
    event.preventDefault()

    const eventId = event.notification.data?.eventId
    let distUrl = self.location.origin + "/"
    if (eventId) distUrl = self.location.origin + `/event/${eventId}`

    event.notification.close()

    event.waitUntil(clients.openWindow(distUrl))
})

// self.addEventListener("install", (e) => {
//     console.log("[ServiceWorker] - Installing version:", CACHE_VERSION)
//     self.skipWaiting()

//     e.waitUntil(
//         (async () => {
//             try {
//                 const cache = await caches.open(CACHE_NAME)
//                 await cache.addAll(FILES_TO_CACHE)
//             } catch (error) {
//                 console.error("[ServiceWorker] - Cache failed:", error)
//             }
//         })()
//     )
// })

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
