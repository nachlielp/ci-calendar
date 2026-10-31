import { describe, expect, it } from "vitest"
import { languagesToShow } from "./language"

describe("languagesToShow", () => {
    it("offers all three when the setting is unset or empty", () => {
        expect(languagesToShow(undefined)).toEqual(["he", "en", "ru"])
        expect(languagesToShow("")).toEqual(["he", "en", "ru"])
    })

    it("offers the listed languages, in order, ignoring unknown codes", () => {
        expect(languagesToShow("he, ru,fr,ru")).toEqual(["he", "ru"])
    })

    it("always offers Hebrew, the default", () => {
        expect(languagesToShow("en")).toEqual(["he", "en"])
    })
})
