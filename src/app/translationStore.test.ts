import { describe, expect, it } from "vitest"
import { createMemoryStorage } from "./deviceStorage"
import {
    TRANSLATIONS_KEY,
    storeTranslation,
    storedTranslation,
} from "./translationStore"

describe("the translation store", () => {
    it("keeps translations per language and text", () => {
        const storage = createMemoryStorage()
        storeTranslation(storage, "en", "שלום", "Hello")

        expect(storedTranslation(storage, "en", "שלום")).toBe("Hello")
        expect(storedTranslation(storage, "ru", "שלום")).toBeUndefined()
    })

    it("drops the oldest past its bounds", () => {
        const storage = createMemoryStorage()
        for (let i = 0; i < 250; i++) {
            storeTranslation(storage, "en", `טקסט ${i}`, `text ${i}`)
        }
        const stored = JSON.parse(storage.getItem(TRANSLATIONS_KEY)!)
        expect(stored).toHaveLength(200)
        expect(storedTranslation(storage, "en", "טקסט 0")).toBeUndefined()
        expect(storedTranslation(storage, "en", "טקסט 249")).toBe("text 249")

        const long = createMemoryStorage()
        for (let i = 0; i < 30; i++) {
            storeTranslation(long, "en", `${i}`, "x".repeat(10_000))
        }
        expect(long.getItem(TRANSLATIONS_KEY)!.length).toBeLessThan(110_000)
    })

    it("starts empty from unreadable storage", () => {
        const storage = createMemoryStorage()
        storage.setItem(TRANSLATIONS_KEY, "{oops")

        expect(storedTranslation(storage, "en", "שלום")).toBeUndefined()
    })
})
