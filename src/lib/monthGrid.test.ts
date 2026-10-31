import { describe, expect, it } from "vitest"
import { jerusalemToday } from "./jerusalemDate"
import { addMonths, monthNumber, monthOf, monthWeeks } from "./monthGrid"

describe("monthOf", () => {
    it("is the month of a day", () => {
        expect(monthOf("2026-11-07")).toBe("2026-11")
    })

    it("follows Jerusalem's day at a month boundary", () => {
        // 22:30 UTC on Oct 31 is already Nov 1 in Jerusalem.
        const today = jerusalemToday(new Date("2026-10-31T22:30:00Z"))
        expect(monthOf(today)).toBe("2026-11")
    })
})

describe("addMonths", () => {
    it("moves within a year and across years both ways", () => {
        expect(addMonths("2026-10", 1)).toBe("2026-11")
        expect(addMonths("2026-11", 2)).toBe("2027-01")
        expect(addMonths("2027-01", -1)).toBe("2026-12")
    })
})

describe("monthNumber", () => {
    it("is 1-based", () => {
        expect(monthNumber("2026-01")).toBe(1)
        expect(monthNumber("2026-12")).toBe(12)
    })
})

describe("monthWeeks", () => {
    it("lays the month out in Sunday-first weeks padded with null", () => {
        // November 2026 starts on a Sunday and has 30 days.
        const weeks = monthWeeks("2026-11")
        expect(weeks).toHaveLength(5)
        expect(weeks[0]).toEqual([
            "2026-11-01",
            "2026-11-02",
            "2026-11-03",
            "2026-11-04",
            "2026-11-05",
            "2026-11-06",
            "2026-11-07",
        ])
        expect(weeks[4]).toEqual([
            "2026-11-29",
            "2026-11-30",
            null,
            null,
            null,
            null,
            null,
        ])
    })

    it("starts the 1st on its weekday", () => {
        // October 2026 starts on a Thursday.
        const [firstWeek] = monthWeeks("2026-10")
        expect(firstWeek.slice(0, 5)).toEqual([
            null,
            null,
            null,
            null,
            "2026-10-01",
        ])
        expect(monthWeeks("2026-10").flat().filter(Boolean)).toHaveLength(31)
    })

    it("handles leap years", () => {
        expect(monthWeeks("2028-02").flat().filter(Boolean)).toHaveLength(29)
        expect(monthWeeks("2027-02").flat().filter(Boolean)).toHaveLength(28)
    })
})
