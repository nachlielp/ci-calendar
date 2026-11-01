import { describe, expect, it } from "vitest"

// No source file may hold a key that can call Google's Translate API, nor
// call that endpoint itself (legacy's guard, kept).
describe("no billable Google key reaches the Translate API", () => {
    // The web's source and the shared core's.
    const sources = import.meta.glob(
        ["../**/*.{ts,tsx}", "../../../../packages/core/src/**/*.ts"],
        { query: "?raw", import: "default", eager: true },
    ) as Record<string, string>

    it("no src file names the Translate endpoint or the old Maps key", () => {
        expect(Object.keys(sources).length).toBeGreaterThan(0)
        expect(
            Object.keys(sources).some((path) => path.includes("packages/core")),
        ).toBe(true)
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
