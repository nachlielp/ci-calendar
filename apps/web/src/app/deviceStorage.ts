import {
    createMemoryStorage,
    type DeviceStorage,
} from "@ci-calendar/core/app/deviceStorage"

/**
 * The browser's localStorage (or sessionStorage, which lasts one tab's
 * session), or an in-memory stand-in where it is blocked (some private
 * modes throw on access). Either way the app works; without localStorage it
 * just can't render instantly on the next visit.
 */
export function browserStorage(
    kind: "localStorage" | "sessionStorage" = "localStorage",
): DeviceStorage {
    try {
        const storage = window[kind]
        storage.getItem("")
        return storage
    } catch {
        return createMemoryStorage()
    }
}
