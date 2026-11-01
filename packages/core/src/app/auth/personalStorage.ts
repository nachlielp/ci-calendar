import type { DeviceStorage } from "../deviceStorage"

// Device storage keys holding a user's own data (an event form's draft)
// start with `PERSONAL_KEY_PREFIX` (`personalKey(name)`), so sign-out
// removes them all by prefix without knowing the features that wrote them,
// whether or not their code was loaded in this session. Legacy's own drafts
// go by their prefixes too.

export const PERSONAL_KEY_PREFIX = "personal:"

/** The storage key for a user's own `name` (removed on sign-out). */
export const personalKey = (name: string) => `${PERSONAL_KEY_PREFIX}${name}`

/** Legacy's event-form drafts (`single-day-draft-event`, …). */
const LEGACY_PREFIXES = ["single-day-draft-", "multi-day-draft-"]

const PREFIXES = [PERSONAL_KEY_PREFIX, ...LEGACY_PREFIXES]

/** Removes every personal key from `storage`. */
export function forgetPersonalKeys(storage: DeviceStorage) {
    try {
        const keys: string[] = []
        for (let index = 0; index < (storage.length ?? 0); index++) {
            const key = storage.key?.(index)
            if (key && PREFIXES.some((prefix) => key.startsWith(prefix))) {
                keys.push(key)
            }
        }
        for (const key of keys) storage.removeItem(key)
    } catch {
        // Blocked storage holds nothing.
    }
}
