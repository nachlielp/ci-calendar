import { SKIP_WAITING, SW_SCOPE, SW_URL } from "../../sw/swRules"

// The browser side of the service worker (src/sw/sw.ts), behind
// `serviceWorkerUpdates()` in updates.ts, which imports this module only
// after the first paint. Not covered by unit tests (jsdom has no service
// workers); the update policy it feeds is (safeUpdates.test.tsx).

/** How often an open page asks the server whether a new version exists. */
const CHECK_EVERY_MS = 60 * 60 * 1000
/** Fewest milliseconds between two checks when the page goes to the background. */
const MIN_CHECK_GAP_MS = 10 * 60 * 1000
/** How long a handover may take before the page reloads anyway. */
const ACTIVATE_TIMEOUT_MS = 3000

/**
 * Registers the service worker and calls `onReady` once a new version of
 * the app is installed and waiting, or has already taken over from another
 * tab. The first install on a device is not a new version. Checks for one
 * when the page goes to the background (so it is ready by the time the
 * visitor returns) and every hour; the browser also checks on each page load.
 */
export function watchServiceWorker(
    onReady: (activate: () => Promise<void>) => void,
): () => void {
    const container = navigator.serviceWorker
    let hadController = container.controller !== null
    let announced = false
    let stopped = false
    let registration: ServiceWorkerRegistration | undefined
    let lastCheck = Date.now()

    const announce = (activate: () => Promise<void>) => {
        if (announced || stopped) return
        announced = true
        onReady(activate)
    }
    const announceWaiting = (worker: ServiceWorker) => {
        // Waiting only matters when a worker already serves this page; the
        // first install activates by itself.
        if (container.controller) announce(() => handOver(worker))
    }

    const onControllerChange = () => {
        // Another tab handed over to the new version (or this one did, and
        // `announce` already ran): this page's files are now the old ones.
        if (hadController) announce(async () => {})
        hadController = true
    }

    const check = () => {
        lastCheck = Date.now()
        registration?.update().catch(() => {
            // Offline or the server is down: try again next time.
        })
    }
    const onVisibilityChange = () => {
        if (
            document.visibilityState === "hidden" &&
            Date.now() - lastCheck >= MIN_CHECK_GAP_MS
        ) {
            check()
        }
    }

    container.addEventListener("controllerchange", onControllerChange)
    document.addEventListener("visibilitychange", onVisibilityChange)
    const timer = setInterval(check, CHECK_EVERY_MS)

    container
        .register(SW_URL, { scope: SW_SCOPE, updateViaCache: "none" })
        .then((reg) => {
            registration = reg
            if (reg.waiting) announceWaiting(reg.waiting)
            reg.addEventListener("updatefound", () => {
                const installing = reg.installing
                installing?.addEventListener("statechange", () => {
                    if (installing.state === "installed") {
                        announceWaiting(installing)
                    }
                })
            })
        })
        .catch(() => {
            // No service worker (private mode, blocked): the app still works
            // online, and every load gets the newest version.
        })

    return () => {
        stopped = true
        clearInterval(timer)
        container.removeEventListener("controllerchange", onControllerChange)
        document.removeEventListener("visibilitychange", onVisibilityChange)
    }
}

/**
 * Asks the waiting worker to take over and resolves once it controls the
 * page (or after a timeout, so a stuck worker never blocks the reload).
 */
function handOver(worker: ServiceWorker): Promise<void> {
    return new Promise((resolve) => {
        navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => resolve(),
            { once: true },
        )
        setTimeout(resolve, ACTIVATE_TIMEOUT_MS)
        worker.postMessage({ type: SKIP_WAITING })
    })
}
