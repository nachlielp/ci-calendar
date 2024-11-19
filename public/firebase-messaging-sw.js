const CACHE_VERSION = "v2"
const CACHE_NAME = `ci-calendar-cache-${CACHE_VERSION}`
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/192.png",
    "/512.png",
    "/ci-circle-192.png",
    "/assets/img/Background_2.png",
    "/assets/img/icon-192.png",
    "/assets/img/icon-512.png",
    "/assets/img/cat-butt.gif",
    // Add your JS chunks and other static assets
    "/static/js/main.chunk.js",
    "/static/js/bundle.js",
    "/static/js/vendors~main.chunk.js",
]

self.addEventListener("install", (e) => {
    console.log("[ServiceWorker] - Installing version:", CACHE_VERSION)
    self.skipWaiting()

    e.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME)
                await cache.addAll(FILES_TO_CACHE)
            } catch (error) {
                console.error("[ServiceWorker] - Cache failed:", error)
            }
        })()
    )
})

self.addEventListener("fetch", (e) => {
    e.respondWith(
        (async () => {
            // Skip caching for API, Firestore, and Supabase requests
            if (
                e.request.url.includes("/api/") ||
                e.request.url.includes("firestore.googleapis.com") ||
                e.request.url.includes("pjgwpivkvsuernmoeebk.supabase.co")
            ) {
                return fetch(e.request)
            }

            try {
                const cache = await caches.open(CACHE_NAME)
                const cachedResponse = await cache.match(e.request)
                if (cachedResponse) {
                    return cachedResponse
                }

                const fetchPromise = fetch(e.request).then(
                    async (networkResponse) => {
                        if (
                            networkResponse.ok &&
                            e.request.method === "GET" &&
                            (FILES_TO_CACHE.includes(
                                new URL(e.request.url).pathname
                            ) ||
                                e.request.url.endsWith(".js") ||
                                e.request.url.endsWith(".css"))
                        ) {
                            // Store the new response in the cache
                            await cache.put(e.request, networkResponse.clone())
                        }
                        return networkResponse
                    }
                )

                // Return cached response immediately if we have it
                // while updating cache in the background
                return cachedResponse || fetchPromise
            } catch (error) {
                console.error("[ServiceWorker] - Fetch failed:", error)
                throw error
            }
        })()
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
