import { describe, expect, it } from "vitest"
import { keysetPage, pageHolding, quoted, rowsAfter } from "./keyset"

describe("keyset pagination", () => {
    it("asks for the rows after the cursor, either way, values quoted", () => {
        expect(rowsAfter("start_date", "ascending", "2026-11-01", "e9")).toBe(
            'start_date.gt."2026-11-01",and(start_date.eq."2026-11-01",id.gt."e9")',
        )
        expect(rowsAfter("created_at", "descending", 'a"b', "u")).toBe(
            `created_at.lt.${quoted('a"b')},and(created_at.eq.${quoted('a"b')},id.lt."u")`,
        )
    })

    it("cuts a page from one row too many, with the last row shown as its cursor", () => {
        const cursorOf = (row: number) => ({ at: row })
        expect(keysetPage([1, 2, 3], 2, cursorOf)).toEqual({
            rows: [1, 2],
            next: { at: 2 },
        })
        expect(keysetPage([1, 2], 2, cursorOf)).toEqual({
            rows: [1, 2],
            next: null,
        })
        expect(keysetPage([], 2, cursorOf)).toEqual({ rows: [], next: null })
    })

    it("places a row on the page whose cursor range holds it", () => {
        const compare = (a: number, b: number) => a - b
        const pages = [{ next: 10 }, { next: 20 }]
        expect(pageHolding(pages, 5, compare)).toBe(0)
        // Up to and including the cursor.
        expect(pageHolding(pages, 10, compare)).toBe(0)
        expect(pageHolding(pages, 15, compare)).toBe(1)
        // After every loaded page, with more to come: none.
        expect(pageHolding(pages, 25, compare)).toBe(-1)
        // The last page holds the rest.
        expect(pageHolding([...pages, { next: null }], 25, compare)).toBe(2)
    })
})
