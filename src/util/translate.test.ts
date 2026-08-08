import { describe, it, expect, vi, beforeEach } from "vitest"
import { Language } from "./interfaces"

// `translate` → `utilService` → `store`, whose field initializers self-run on
// import. Bridge that coupling (as the other unit tests do); removed with the
// store factory (#27).
vi.mock("../Store/store", () => ({ store: {} }))
vi.mock("../App", () => ({ CACHE_VERSION: "test" }))

const state = vi.hoisted(() => ({
    invoke: vi.fn(),
}))

// The only seam that may reach translation is the Supabase Edge Function.
vi.mock("../supabase/client", () => ({
    supabase: { functions: { invoke: state.invoke } },
}))

import { translateText } from "./translate"

beforeEach(() => {
    state.invoke.mockReset()
})

describe("translateText", () => {
    it("translates via the edge function and returns the result", async () => {
        state.invoke.mockResolvedValue({
            data: { translatedText: "hello" },
            error: null,
        })

        const result = await translateText("שלום", Language.en)

        expect(result).toBe("hello")
        expect(state.invoke).toHaveBeenCalledWith("translate", {
            body: {
                text: "שלום",
                targetLang: Language.en,
                source: "he",
                context: "general",
            },
        })
    })

    it("never calls the Google Translate REST API directly", async () => {
        const fetchSpy = vi
            .spyOn(globalThis, "fetch")
            .mockRejectedValue(new Error("fetch must not be called"))
        state.invoke.mockResolvedValue({
            data: { translatedText: "world" },
            error: null,
        })

        await translateText("עולם", Language.en)

        expect(fetchSpy).not.toHaveBeenCalled()
        fetchSpy.mockRestore()
    })

    it("falls back to the original text when the function errors", async () => {
        state.invoke.mockResolvedValue({
            data: null,
            error: new Error("boom"),
        })

        const result = await translateText("בדיקה", Language.ru)

        expect(result).toBe("בדיקה")
    })

    it("serves repeat requests from the in-memory cache (one invoke)", async () => {
        state.invoke.mockResolvedValue({
            data: { translatedText: "cached" },
            error: null,
        })

        const first = await translateText("שלוש", Language.en)
        const second = await translateText("שלוש", Language.en)

        expect(first).toBe("cached")
        expect(second).toBe("cached")
        expect(state.invoke).toHaveBeenCalledTimes(1)
    })
})

// Guard: no source file under src/ may hold a key that can call the Translate
// REST API, nor call that endpoint directly. Scans raw source (test files
// excluded, since this assertion names the very strings it forbids).
describe("no billable Google key reaches the Translate REST API", () => {
    const sources = import.meta.glob("../**/*.{ts,tsx}", {
        query: "?raw",
        import: "default",
        eager: true,
    }) as Record<string, string>

    it("no src file references the Translate endpoint or the old Maps key", () => {
        // Fail loud if the glob ever stops matching, so the guard can't pass
        // vacuously.
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
