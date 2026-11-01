/**
 * The slice of the Web Storage API the app uses to keep data on the device:
 * the browser's localStorage, or the mobile app's own storage behind the
 * same calls.
 */
export interface DeviceStorage {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem(key: string): void
    clear(): void
    /** To list the keys (sign-out's sweep of personal keys). */
    key?(index: number): string | null
    readonly length?: number
}

/** Storage that lasts as long as the page (or test): a stand-in. */
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
