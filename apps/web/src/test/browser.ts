import { act } from "@testing-library/react"

// Browser conditions jsdom can't produce by itself. src/test/setup.ts reads
// them in its `matchMedia` and resets them after each test.

const JSDOM_WIDTH = window.innerWidth
const JSDOM_USER_AGENT = navigator.userAgent

export const browserConditions = { standalone: false }

export function resetBrowserConditions() {
    browserConditions.standalone = false
    delete (navigator as { serviceWorker?: unknown }).serviceWorker
    delete (window as { caches?: unknown }).caches
    window.innerWidth = JSDOM_WIDTH
    setUserAgent(JSDOM_USER_AGENT)
}

/**
 * The page goes to the background (`hidden`: another app or tab) or comes
 * back (`visible`). `setup.ts` restores jsdom's `visible` after each test.
 */
export function setPageVisibility(state: DocumentVisibilityState) {
    act(() => {
        Object.defineProperty(document, "visibilityState", {
            configurable: true,
            value: state,
        })
        document.dispatchEvent(new Event("visibilitychange", { bubbles: true }))
    })
}

/** Renders as on a screen `width` pixels wide (media queries follow). */
export function setViewportWidth(width: number) {
    window.innerWidth = width
}

/** Runs as the installed app (`display-mode: standalone`). */
export function setStandalone(standalone: boolean) {
    browserConditions.standalone = standalone
}

export const IPHONE_USER_AGENT =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

export function setUserAgent(userAgent: string) {
    Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value: userAgent,
    })
}

/**
 * Chrome offering to install the app (`beforeinstallprompt`). Resolves the
 * visitor's answer with `outcome` when the app shows the prompt; `prompted`
 * says whether it did.
 */
export function offerInstall(outcome: "accepted" | "dismissed" = "accepted") {
    const offer = Object.assign(
        new Event("beforeinstallprompt", { cancelable: true }),
        {
            prompted: false,
            prompt: async () => {
                offer.prompted = true
            },
            userChoice: Promise.resolve({ outcome }),
        },
    )
    act(() => {
        window.dispatchEvent(offer)
    })
    return offer
}

/**
 * A registered service worker and Cache Storage entries (jsdom has
 * neither), recording which the app unregisters and deletes.
 */
export function installServiceWorkerAndCaches(cacheNames: string[]) {
    const removed = { unregistered: 0, deletedCaches: [] as string[] }
    const registration = {
        unregister: async () => {
            removed.unregistered += 1
            return true
        },
    }
    Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: { getRegistrations: async () => [registration] },
    })
    Object.defineProperty(window, "caches", {
        configurable: true,
        value: {
            keys: async () => cacheNames,
            delete: async (name: string) => {
                removed.deletedCaches.push(name)
                return true
            },
        },
    })
    return removed
}
