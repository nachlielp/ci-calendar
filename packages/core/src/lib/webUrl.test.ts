import { describe, expect, it } from "vitest"
import { isWebUrl, normaliseWebUrl } from "./webUrl"

describe("normaliseWebUrl", () => {
    it("adds https:// to a link typed without a scheme", () => {
        expect(normaliseWebUrl(" example.com/x ")).toBe("https://example.com/x")
        expect(normaliseWebUrl("//example.com")).toBe("https://example.com")
        expect(normaliseWebUrl("http://example.com")).toBe("http://example.com")
    })

    it("leaves other schemes for isWebUrl to refuse", () => {
        expect(normaliseWebUrl("javascript:alert(1)")).toBe(
            "javascript:alert(1)",
        )
    })
})

describe("isWebUrl", () => {
    it("accepts http(s) addresses only", () => {
        expect(isWebUrl("https://example.com/a?b")).toBe(true)
        expect(isWebUrl("http://example.com")).toBe(true)
        expect(isWebUrl("javascript:alert(1)")).toBe(false)
        expect(isWebUrl("data:text/html,x")).toBe(false)
        expect(isWebUrl("mailto:a@b.c")).toBe(false)
        expect(isWebUrl("https://")).toBe(false)
        expect(isWebUrl("not a url")).toBe(false)
    })
})
