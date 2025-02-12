const CACHE_VERSION = "1.6.82"
const CACHE_NAME = `ci-calendar-cache-v${CACHE_VERSION}`

const TIMEOUT_DURATION = 8000

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                "/",
                "/index.html",
                "/manifest.json",
                "/site.webmanifest",
                "/ci-logo-192-bg.png",
                "/ci-logo-512-bg.png",
                "/ci-logo-192-circle.png",
                "/assets/ci-logo.svg",
                "/assets/",
                "/index.css",
                "/styles/overrides.css",
                "/styles/events-page.css",
            ])
        })
    )
    self.skipWaiting()
})

self.addEventListener("activate", (e) => {
    e.waitUntil(
        (async () => {
            console.log("[ServiceWorker] - Checking caches")
            await self.clients.claim()

            const keyList = await caches.keys()

            const clearCaches = keyList.map((key) => {
                if (
                    key.startsWith("ci-calendar-cache-") &&
                    key !== CACHE_NAME
                ) {
                    console.log("[ServiceWorker] - Removing old cache", key)
                    return caches.delete(key)
                }
            })

            await Promise.all(clearCaches)
        })()
    )
})

self.addEventListener("fetch", (event) => {
    if (event.request.url.endsWith("registerSW.js")) {
        event.respondWith(
            new Response(
                `if ('serviceWorker' in navigator) {
                    window.addEventListener('load', () => {
                        navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                            scope: '/'
                        });
                    });
                }`,
                {
                    headers: {
                        "Content-Type": "application/javascript",
                    },
                }
            )
        )
        return
    }

    const urlsToNotCache = [
        "supabase.co",
        "firebase",
        "firebaseio.com",
        "firebasedatabase.app",
        "maps.googleapis.com",
        "pjgwpivkvsuernmoeebk.supabase.co",
    ]

    const isSVG = event.request.url.match(/\.svg$/)
    const isPng = event.request.url.match(/\.png$/)
    const isCSS = event.request.url.match(/\.css$/)
    const isJS = event.request.url.match(/\.js$/)
    const isTTF = event.request.url.match(/\.ttf$/)

    if (urlsToNotCache.some((url) => event.request.url.includes(url))) {
        event.respondWith(fetch(event.request))
        return
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response && (isSVG || isPng || isCSS || isJS || isTTF)) {
                return response
            }

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Network timeout")), 5000)
            })

            return Promise.race([
                fetch(event.request).then((fetchResponse) => {
                    if (
                        (isSVG || isPng || isCSS || isJS || isTTF) &&
                        fetchResponse.status === 200
                    ) {
                        const responseToCache = fetchResponse.clone()
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache)
                        })
                    }
                    return fetchResponse
                }),
                timeoutPromise,
            ]).catch(() => {
                // Return cached response if fetch fails or times out
                return (
                    response || new Response("Network error", { status: 408 })
                )
            })
        })
    )

    // event.respondWith(
    //     caches.match(event.request).then((response) => {
    //         if (response && (isSVG || isPng || isCSS || isJS || isTTF)) {
    //             return response
    //         }

    //         return fetch(event.request)
    //             .then((fetchResponse) => {
    //                 if (
    //                     (isSVG || isPng || isCSS || isJS || isTTF) &&
    //                     fetchResponse.status === 200
    //                 ) {
    //                     const responseToCache = fetchResponse.clone()
    //                     caches.open(CACHE_NAME).then((cache) => {
    //                         cache.put(event.request, responseToCache)
    //                     })
    //                 }
    //                 return fetchResponse
    //             })
    //             .catch(() => {
    //                 // Return cached response if fetch fails
    //                 return response
    //             })
    //     })
    // )
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
            icon: "/ci-logo-192-bg.png",
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

//for navigation with notification links
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
