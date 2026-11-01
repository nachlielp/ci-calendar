import { describe, expect, it } from "vitest"
import {
    bioPatch,
    bioValuesOf,
    isBioValues,
    newBioColumns,
    validateBio,
    type BioValues,
} from "./bioValues"

const values = (overrides: Partial<BioValues> = {}): BioValues => ({
    ...bioValuesOf(null),
    bio_name: "דנה",
    ...overrides,
})

describe("validateBio", () => {
    it("needs a name", () => {
        expect(validateBio(values({ bio_name: "  " }))).toEqual({
            bio_name: "nameRequired",
        })
        expect(validateBio(values())).toEqual({})
    })

    it("checks each link's title: 30 characters, not a link", () => {
        expect(
            validateBio(
                values({
                    page_title: "א".repeat(31),
                    page_title_2: "example.com",
                }),
            ),
        ).toEqual({ page_title: "titleTooLong", page_title_2: "titleIsLink" })
        expect(validateBio(values({ page_title: "א".repeat(30) }))).toEqual({})
    })

    it("needs a title and a web address for each link", () => {
        expect(
            validateBio(
                values({
                    page_url: "example.com",
                    page_title_2: "האתר",
                    page_url_2: "javascript:alert(1)",
                }),
            ),
        ).toEqual({ page_url: "titleRequired", page_url_2: "invalidUrl" })
        expect(
            validateBio(
                values({
                    page_title: "האתר",
                    page_url: "example.com/me",
                    page_title_2: "שני",
                    page_url_2: "http://x.org",
                }),
            ),
        ).toEqual({})
    })
})

describe("bioPatch", () => {
    it("sends only the changed fields, links normalised", () => {
        expect(bioPatch({ about: "שלום", page_url: " example.com " })).toEqual({
            about: "שלום",
            page_url: "https://example.com",
        })
        expect(bioPatch({})).toEqual({})
    })

    it("creates a row with every text column, as legacy's upsert", () => {
        expect(newBioColumns(values({ page_url_2: "x.org" }), "")).toEqual({
            bio_name: "דנה",
            about: "",
            page_title: "",
            page_url: "",
            page_title_2: "",
            page_url_2: "https://x.org",
            img: "",
        })
    })
})

describe("bioValuesOf / isBioValues", () => {
    it("reads nulls as empty, and checks a draft's shape", () => {
        const read = bioValuesOf({ bio_name: "דנה", about: null })
        expect(read.about).toBe("")
        expect(isBioValues(read)).toBe(true)
        expect(isBioValues({ ...read, about: 3 })).toBe(false)
        expect(isBioValues(null)).toBe(false)
    })
})
