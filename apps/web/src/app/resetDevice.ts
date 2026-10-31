import type { DeviceStorage } from "./deviceStorage"

/**
 * Device storage keys a reset keeps: legacy's `isInternal`, which marks the
 * team's own devices so analytics (index.html) skip them.
 */
export const KEPT_ON_RESET: readonly string[] = ["isInternal"]

/**
 * Forgets everything the app keeps on this device (legacy's "reset the
 * app"): device storage except `KEPT_ON_RESET`, the service workers and
 * their Cache Storage. The caller reloads afterwards, so the next load comes
 * fresh from the network. Each part is best effort; a failure in one never
 * stops the others.
 */
export async function resetDevice(storage: DeviceStorage) {
    try {
        const kept = KEPT_ON_RESET.flatMap((key) => {
            const value = storage.getItem(key)
            return value === null ? [] : [[key, value] as const]
        })
        storage.clear()
        kept.forEach(([key, value]) => storage.setItem(key, value))
    } catch {
        // Blocked storage holds nothing to clear.
    }
    await Promise.allSettled([unregisterServiceWorkers(), clearCaches()])
}

async function unregisterServiceWorkers() {
    if (!("serviceWorker" in navigator)) return
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
        registrations.map((registration) => registration.unregister()),
    )
}

async function clearCaches() {
    if (!("caches" in window)) return
    const names = await caches.keys()
    await Promise.all(names.map((name) => caches.delete(name)))
}
