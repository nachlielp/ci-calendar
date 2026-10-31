import { afterEach, describe, expect, it, vi } from "vitest"
import { browserStorage } from "./deviceStorage"

describe("browserStorage", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("falls back to working in-memory storage when localStorage is blocked", () => {
        vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
            throw new DOMException("blocked", "SecurityError")
        })

        const storage = browserStorage()
        storage.setItem("key", "value")

        expect(storage.getItem("key")).toBe("value")
    })
})
