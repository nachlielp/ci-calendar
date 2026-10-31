import { describe, expect, it, vi } from "vitest"
import { createFakeFunctions, fakeTranslation } from "../test/fakeFunctions"
import { LOOKUP_TIMEOUT_MS } from "../lib/timeout"
import { translateText, translateTitle } from "./translate"

// Legacy util/translate.test.ts, at the functions seam.

const setup = () => createFakeFunctions(() => null)

describe("translateText", () => {
    it("translates through the translate function", async () => {
        const functions = setup()
        functions.handle("translate", () => ({ translatedText: "hello" }))

        expect(await translateText(functions, "שלום", "en")).toBe("hello")
        expect(functions.calls).toEqual([
            {
                name: "translate",
                body: {
                    text: "שלום",
                    targetLang: "en",
                    source: "he",
                    context: "general",
                },
                token: null,
            },
        ])
    })

    it("never calls Google's Translate API itself", async () => {
        const fetchSpy = vi
            .spyOn(globalThis, "fetch")
            .mockRejectedValue(new Error("fetch must not be called"))
        const functions = setup()
        functions.handle("translate", fakeTranslation)

        await translateText(functions, "עולם", "en")

        expect(fetchSpy).not.toHaveBeenCalled()
        fetchSpy.mockRestore()
    })

    it("falls back to the source text when the function fails", async () => {
        const functions = setup()
        functions.fail("translate")

        expect(await translateText(functions, "בדיקה", "ru")).toBe("בדיקה")
    })

    it("falls back to the source text on an empty answer", async () => {
        const functions = setup()
        functions.handle("translate", () => ({}))

        expect(await translateText(functions, "בדיקה", "en")).toBe("בדיקה")
    })

    it("asks once per text and language in a session", async () => {
        const functions = setup()
        functions.handle("translate", fakeTranslation)

        expect(await translateText(functions, "שלוש", "en")).toBe("שלוש [en]")
        expect(await translateText(functions, "שלוש", "en")).toBe("שלוש [en]")
        expect(await translateText(functions, "שלוש", "ru")).toBe("שלוש [ru]")
        expect(functions.calls).toHaveLength(2)
    })

    it("doesn't remember a failure", async () => {
        const functions = setup()
        functions.fail("translate")
        await translateText(functions, "ארבע", "en")
        functions.handle("translate", fakeTranslation)

        expect(await translateText(functions, "ארבע", "en")).toBe("ארבע [en]")
    })

    it("leaves blank text alone", async () => {
        const functions = setup()

        expect(await translateText(functions, " ", "en")).toBe(" ")
        expect(functions.calls).toHaveLength(0)
    })
})

describe("translateTitle", () => {
    it("asks for both languages at once, as names", async () => {
        const functions = setup()
        functions.hold("translate")
        functions.handle("translate", fakeTranslation)

        const titles = translateTitle(functions, "ג'אם")
        await vi.waitFor(() => expect(functions.calls).toHaveLength(2))
        functions.release("translate")

        expect(await titles).toEqual({ en: "ג'אם [en]", ru: "ג'אם [ru]" })
        expect(functions.calls.map((call) => call.body.context)).toEqual([
            "name",
            "name",
        ])
    })

    it("leaves out a language that fails", async () => {
        const functions = setup()
        functions.fail("translate")

        expect(await translateTitle(functions, "ג'אם")).toEqual({})
    })

    it("gives up on a call that never answers", async () => {
        vi.useFakeTimers()
        try {
            const functions = setup()
            functions.hold("translate")

            const titles = translateTitle(functions, "ג'אם")
            await vi.advanceTimersByTimeAsync(LOOKUP_TIMEOUT_MS)

            expect(await titles).toEqual({})
        } finally {
            vi.useRealTimers()
        }
    })
})

// No source file may hold a key that can call Google's Translate API, nor
// call that endpoint itself (legacy's guard, kept).
describe("no billable Google key reaches the Translate API", () => {
    const sources = import.meta.glob("../**/*.{ts,tsx}", {
        query: "?raw",
        import: "default",
        eager: true,
    }) as Record<string, string>

    it("no src file names the Translate endpoint or the old Maps key", () => {
        expect(Object.keys(sources).length).toBeGreaterThan(0)
        const offenders = Object.entries(sources)
            .filter(([path]) => !path.includes(".test."))
            .filter(
                ([, content]) =>
                    content.includes("translation.googleapis.com") ||
                    content.includes("VITE_GOOGLE_MAPS_API_KEY"),
            )
            .map(([path]) => path)
        expect(offenders).toEqual([])
    })
})
