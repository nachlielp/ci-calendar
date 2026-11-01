import { describe, expect, it } from "vitest"
import { webLinks } from "./webLinks"

describe("webLinks", () => {
    it("renders web addresses only, a scheme-less one as https", () => {
        expect(
            webLinks([
                { title: "a", url: "https://example.com" },
                { title: "b", url: "www.example.com/x" },
                { title: "c", url: "javascript:alert(1)" },
                { title: "d", url: "data:text/html,<b>x</b>" },
            ]),
        ).toEqual([
            { title: "a", url: "https://example.com" },
            { title: "b", url: "https://www.example.com/x" },
        ])
    })
})
