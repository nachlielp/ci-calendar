/** The slice of the Web Storage API the app uses to keep data on the device. */
export type DeviceStorage = Pick<
    Storage,
    "getItem" | "setItem" | "removeItem" | "clear"
> &
    /** To list the keys (sign-out's sweep of personal keys). */
    Partial<Pick<Storage, "key" | "length">>

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

export function createMemoryStorage(): DeviceStorage {
    const items = new Map<string, string>()
    return {
        get length() {
            return items.size
        },
        key: (index) => [...items.keys()][index] ?? null,
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => {
            items.set(key, String(value))
        },
        removeItem: (key) => {
            items.delete(key)
        },
        clear: () => {
            items.clear()
        },
    }
}
