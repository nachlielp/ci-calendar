import { describe, expect, it } from "vitest"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"
import { storedLanguage, storeLanguage } from "./language"

describe("the stored language", () => {
    it("is Hebrew on a first visit", () => {
        expect(storedLanguage(createMemoryStorage())).toBe("he")
    })

    it("reads back what was stored, under legacy's key", () => {
        const storage = createMemoryStorage()
        storeLanguage(storage, "ru")

        expect(storage.getItem("language")).toBe("ru")
        expect(storedLanguage(storage)).toBe("ru")
    })

    it("is Hebrew for a value the app doesn't know", () => {
        const storage = createMemoryStorage()
        storage.setItem("language", "fr")

        expect(storedLanguage(storage)).toBe("he")
    })

    it("is Hebrew, and storing is skipped, when storage throws", () => {
        const blocked = {
            getItem: () => {
                throw new Error("blocked")
            },
            setItem: () => {
                throw new Error("blocked")
            },
            removeItem: () => {},
            clear: () => {},
        }

        expect(storedLanguage(blocked)).toBe("he")
        expect(() => storeLanguage(blocked, "en")).not.toThrow()
    })
})

describe("the stored language and the languages shown", () => {
    it("is Hebrew when the stored one isn't offered here", () => {
        const storage = createMemoryStorage()
        storeLanguage(storage, "ru")

        expect(storedLanguage(storage, ["he", "en"])).toBe("he")
        expect(storedLanguage(storage, ["he", "ru"])).toBe("ru")
    })
})
