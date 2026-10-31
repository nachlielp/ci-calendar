import type { DeviceStorage } from "./deviceStorage"
import type { Language } from "../lib/language"

// Machine translations kept on the device across visits (legacy kept the
// details' ones in the Cache API), so a text read again in English or
// Russian doesn't ask the translate function again (`useMachineTranslation`,
// ./useMachineTranslation.ts). Keyed by language and the Hebrew text
// itself, so an edited text is a new key (and the old one ages out). Not
// removed on sign-out: a translation is the same for anyone, and most are
// of public texts. Bounded: the oldest entries go past `MAX_ENTRIES` or
// `MAX_CHARS`. Only lazy pages' chunks load this, never `/`.

/** Named when only the details translated; kept, so earlier ones stay. */
export const TRANSLATIONS_KEY = "detailsTranslations"
const MAX_ENTRIES = 200
const MAX_CHARS = 100_000

type Entries = [key: string, translation: string][]

/** Parsed once per storage per page load. */
const loaded = new WeakMap<DeviceStorage, Map<string, string>>()

const keyOf = (language: Language, text: string) => `${language}\u0000${text}`

function entries(storage: DeviceStorage): Map<string, string> {
    let map = loaded.get(storage)
    if (map) return map
    map = new Map()
    try {
        const stored: unknown = JSON.parse(
            storage.getItem(TRANSLATIONS_KEY) ?? "[]",
        )
        if (Array.isArray(stored)) {
            for (const entry of stored) {
                if (
                    Array.isArray(entry) &&
                    typeof entry[0] === "string" &&
                    typeof entry[1] === "string"
                ) {
                    map.set(entry[0], entry[1])
                }
            }
        }
    } catch {
        // Unreadable or blocked: start empty.
    }
    loaded.set(storage, map)
    return map
}

/** The stored translation of `text` into `language`, if any. */
export function storedTranslation(
    storage: DeviceStorage,
    language: Language,
    text: string,
): string | undefined {
    return entries(storage).get(keyOf(language, text))
}

/** Keeps a translation, dropping the oldest past the bounds. */
export function storeTranslation(
    storage: DeviceStorage,
    language: Language,
    text: string,
    translation: string,
) {
    const map = entries(storage)
    const key = keyOf(language, text)
    map.delete(key)
    map.set(key, translation)
    let chars = 0
    for (const [k, v] of map) chars += k.length + v.length
    for (const [k, v] of map) {
        if (map.size <= MAX_ENTRIES && chars <= MAX_CHARS) break
        map.delete(k)
        chars -= k.length + v.length
    }
    try {
        const list: Entries = [...map]
        storage.setItem(TRANSLATIONS_KEY, JSON.stringify(list))
    } catch {
        // Full or blocked: kept for this page load only.
    }
}
