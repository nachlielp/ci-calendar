import { describe, expect, it } from "vitest"
import { weekday } from "../../lib/jerusalemDate"
import { addMonths, isRecurrence, recurringDates } from "./recurrence"

describe("recurringDates", () => {
    it("repeats weekly up to the end day, inclusive", () => {
        expect(recurringDates("2026-11-03", "2026-11-24", "weekly")).toEqual([
            "2026-11-03",
            "2026-11-10",
            "2026-11-17",
            "2026-11-24",
        ])
        expect(recurringDates("2026-11-03", "2026-11-23", "weekly")).toEqual([
            "2026-11-03",
            "2026-11-10",
            "2026-11-17",
        ])
    })

    it("keeps the day across the end of daylight saving time (25 October 2026)", () => {
        // Calendar days carry no clock: the change of offset moves nothing.
        expect(recurringDates("2026-10-16", "2026-11-06", "weekly")).toEqual([
            "2026-10-16",
            "2026-10-23",
            "2026-10-30",
            "2026-11-06",
        ])
        // And across its start (27 March 2026), and the turn of the year.
        expect(recurringDates("2026-03-20", "2026-04-03", "weekly")).toEqual([
            "2026-03-20",
            "2026-03-27",
            "2026-04-03",
        ])
        expect(recurringDates("2026-12-24", "2027-01-08", "weekly")).toEqual([
            "2026-12-24",
            "2026-12-31",
            "2027-01-07",
        ])
    })

    it("repeats every other week", () => {
        expect(recurringDates("2026-11-03", "2026-12-15", "bi-weekly")).toEqual(
            ["2026-11-03", "2026-11-17", "2026-12-01", "2026-12-15"],
        )
    })

    it("repeats monthly on the same date, or the month's last day", () => {
        expect(recurringDates("2026-11-22", "2027-02-22", "monthly")).toEqual([
            "2026-11-22",
            "2026-12-22",
            "2027-01-22",
            "2027-02-22",
        ])
        // As dayjs's add(n, "month"): each from the first day, so a short
        // month doesn't pull the following ones back.
        expect(recurringDates("2027-01-31", "2027-04-30", "monthly")).toEqual([
            "2027-01-31",
            "2027-02-28",
            "2027-03-31",
            "2027-04-30",
        ])
    })

    it("repeats monthly on the same weekday of the same week", () => {
        // The first Saturday of each month.
        const firstSaturdays = recurringDates(
            "2026-11-07",
            "2027-02-28",
            "monthly-pattern",
        )
        expect(firstSaturdays).toEqual([
            "2026-11-07",
            "2026-12-05",
            "2027-01-02",
            "2027-02-06",
        ])
        expect(firstSaturdays.map(weekday)).toEqual([6, 6, 6, 6])
        // The third Tuesday.
        expect(
            recurringDates("2026-11-17", "2027-01-31", "monthly-pattern"),
        ).toEqual(["2026-11-17", "2026-12-15", "2027-01-19"])
    })

    it("skips months without a fifth such weekday (legacy spilled into the next month)", () => {
        // 29 Dec 2026 is the fifth Tuesday; Jan 2027 and Feb 2027 have
        // none, March 2027 does (the 30th).
        expect(
            recurringDates("2026-12-29", "2027-04-30", "monthly-pattern"),
        ).toEqual(["2026-12-29", "2027-03-30"])
    })

    it("counts skipped months toward the 12: it looks 12 months ahead, as legacy did", () => {
        // The fifth Tuesday, from December 2026: months without one give
        // nothing, and the search ends with November 2027.
        expect(
            recurringDates("2026-12-29", "2028-12-31", "monthly-pattern"),
        ).toEqual([
            "2026-12-29",
            "2027-03-30",
            "2027-06-29",
            "2027-08-31",
            "2027-11-30",
        ])
    })

    it("stops at legacy's caps: 52 weeks or fortnights, 12 months", () => {
        const weeks = recurringDates("2026-11-03", "2028-12-31", "weekly")
        expect(weeks).toHaveLength(52)
        expect(weeks.at(-1)).toBe("2027-10-26")
        expect(
            recurringDates("2026-11-03", "2030-12-31", "bi-weekly"),
        ).toHaveLength(52)
        expect(
            recurringDates("2026-11-03", "2030-12-31", "monthly"),
        ).toHaveLength(12)
        expect(
            recurringDates("2026-11-03", "2030-12-31", "monthly-pattern"),
        ).toHaveLength(12)
    })

    it("is just the first day when the end is that day, and nothing before it", () => {
        expect(recurringDates("2026-11-03", "2026-11-03", "weekly")).toEqual([
            "2026-11-03",
        ])
        expect(recurringDates("2026-11-03", "2026-11-02", "monthly")).toEqual(
            [],
        )
    })
})

describe("addMonths", () => {
    it("adds months, clamping to the month's last day", () => {
        expect(addMonths("2026-10-30", 12)).toBe("2027-10-30")
        expect(addMonths("2028-02-29", 12)).toBe("2029-02-28")
        expect(addMonths("2026-08-31", 1)).toBe("2026-09-30")
        expect(addMonths("2026-12-15", 1)).toBe("2027-01-15")
    })
})

describe("isRecurrence", () => {
    it("knows legacy's frequencies only", () => {
        expect(isRecurrence("weekly")).toBe(true)
        expect(isRecurrence("monthly-pattern")).toBe(true)
        expect(isRecurrence("daily")).toBe(false)
        expect(isRecurrence("")).toBe(false)
    })
})
