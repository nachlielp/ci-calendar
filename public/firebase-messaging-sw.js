const CACHE_VERSION = "v2" // You can update this to trigger cache refresh
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
    try {
        const { data } = event.data.json()

        // Get current badge count from IndexedDB or other storage
        //anynimous function in waitUntil needs to be async for this
        // const getBadgeCount = async () => {
        //   const reg = await self.registration;
        //   return reg
        //     .getNotifications()
        //     .then((notifications) => notifications.length + 1);
        // };

        event.waitUntil(
            (() => {
                // const count = await getBadgeCount();
                const options = {
                    body: data.body,
                    title: data.title,
                    data: { push_event_url: data.url },
                    icon: "/192.png",
                    badge: data.badge,
                }

                if (navigator.setAppBadge) {
                    navigator.setAppBadge(data.badge)
                }

                return self.registration.showNotification(data.title, options)
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

    const page_parms = event.notification.data.push_event_url

    event.waitUntil(
        clients.openWindow(self.location.origin + "/" + page_parms) // The PWA route you want to open
    )

    // event.waitUntil(
    //     self.clients
    //         .matchAll({ type: "window", includeUncontrolled: true })
    //         .then((clients) => {
    //             if (clients.length > 0) {
    //                 const client = clients[0]
    //                 client.navigate(distUrl)
    //                 client.focus()
    //                 return
    //             } else event.waitUntil(self.clients.openWindow(distUrl))
    //         })
    // )
})

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
