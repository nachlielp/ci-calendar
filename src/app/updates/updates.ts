/**
 * New versions of the app, as the browser's service worker reports them:
 * the seam between the update policy (`SafeUpdates`) and the browser. The app
 * gets one from `AppServices`; tests pass a fake (`src/test/fakeUpdates.ts`).
 */
export interface AppUpdates {
    /**
     * Starts watching for a new version. `onReady` is called at most once,
     * when a new version is installed and can take over; calling `activate`
     * hands the page to it, and once it resolves a reload lands on the new
     * version. Returns a function that stops watching.
     */
    watch(onReady: (activate: () => Promise<void>) => void): () => void
}

/** No service worker: the dev server, and tests that don't pass one. */
export const NO_UPDATES: AppUpdates = { watch: () => () => {} }

/**
 * The production service worker. Registration waits until the page has
 * loaded and the browser is idle, and its code (`serviceWorker.ts`) is
 * imported only then, so neither competes with the first paint nor adds to
 * `/`'s initial JS.
 */
export function serviceWorkerUpdates(): AppUpdates {
    return {
        watch(onReady) {
            if (!("serviceWorker" in navigator)) return () => {}
            let stopped = false
            let stop: (() => void) | undefined
            const cancelIdle = afterLoadAndIdle(() => {
                import("./serviceWorker")
                    .then(({ watchServiceWorker }) => {
                        if (!stopped) stop = watchServiceWorker(onReady)
                    })
                    .catch(() => {
                        // Offline, or a deploy removed the file: the next
                        // load registers it.
                    })
            })
            return () => {
                stopped = true
                cancelIdle()
                stop?.()
            }
        },
    }
}

/** Runs `run` once the page has loaded and the main thread is idle. */
function afterLoadAndIdle(run: () => void): () => void {
    let cancel = () => {}
    const whenIdle = () => {
        if ("requestIdleCallback" in window) {
            const id = requestIdleCallback(run, { timeout: 5000 })
            cancel = () => cancelIdleCallback(id)
        } else {
            // Safari before 18.4 has no requestIdleCallback.
            const id = setTimeout(run, 1000)
            cancel = () => clearTimeout(id)
        }
    }
    if (document.readyState === "complete") {
        whenIdle()
    } else {
        window.addEventListener("load", whenIdle, { once: true })
        cancel = () => window.removeEventListener("load", whenIdle)
    }
    return () => cancel()
}
