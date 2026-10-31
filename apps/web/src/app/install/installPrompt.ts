import { useSyncExternalStore } from "react"

/**
 * Chrome's (and Edge's, Samsung Internet's) install offer. Not in the DOM
 * typings because only Chromium browsers fire it.
 */
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

interface InstallState {
    /** The browser's install offer, kept to show when the visitor asks. */
    offer: BeforeInstallPromptEvent | null
    /** Installed during this visit (`appinstalled`). */
    installed: boolean
}

let state: InstallState = { offer: null, installed: false }
const subscribers = new Set<() => void>()
let stopCapture: (() => void) | undefined

function setState(next: InstallState) {
    state = next
    subscribers.forEach((notify) => notify())
}

/**
 * Starts listening for the browser's install offer. Call once at boot,
 * before React renders: Chrome may fire `beforeinstallprompt` before any
 * component mounts, and fires it only once per page load. Calling it again
 * (each test's boot) starts over with no offer.
 */
export function captureInstallPrompt(target: Window = window) {
    stopCapture?.()
    setState({ offer: null, installed: false })

    const onOffer = (event: Event) => {
        // Keep the mini-infobar away; the app's banner asks instead.
        event.preventDefault()
        setState({ ...state, offer: event as BeforeInstallPromptEvent })
    }
    const onInstalled = () => setState({ offer: null, installed: true })
    target.addEventListener("beforeinstallprompt", onOffer)
    target.addEventListener("appinstalled", onInstalled)
    stopCapture = () => {
        target.removeEventListener("beforeinstallprompt", onOffer)
        target.removeEventListener("appinstalled", onInstalled)
    }
}

const subscribe = (notify: () => void) => {
    subscribers.add(notify)
    return () => subscribers.delete(notify)
}

/**
 * Shows the browser's install dialog if it offered one. Resolves `false`
 * when there is no offer (iOS, Firefox, or an offer already used), so the
 * caller shows the manual instructions instead.
 */
async function promptInstall(): Promise<boolean> {
    const { offer } = state
    if (!offer) return false
    // An offer can be shown only once, whatever the visitor answers.
    setState({ ...state, offer: null })
    await offer.prompt()
    const { outcome } = await offer.userChoice
    if (outcome === "accepted") setState({ ...state, installed: true })
    return true
}

export function useInstallPrompt() {
    const { installed } = useSyncExternalStore(subscribe, () => state)
    return { installed, promptInstall }
}
