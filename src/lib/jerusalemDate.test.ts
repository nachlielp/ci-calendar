import { describe, expect, it } from "vitest"
import {
    addDays,
    jerusalemTimeOfDay,
    jerusalemToday,
    weekday,
} from "./jerusalemDate"

describe("jerusalemToday", () => {
    it("flips at midnight in Jerusalem, not UTC", () => {
        expect(jerusalemToday(new Date("2026-10-30T21:59:00Z"))).toBe(
            "2026-10-30",
        )
        expect(jerusalemToday(new Date("2026-10-30T22:00:00Z"))).toBe(
            "2026-10-31",
        )
    })
})

describe("addDays", () => {
    it("crosses month and year ends", () => {
        expect(addDays("2026-12-30", 3)).toBe("2027-01-02")
    })
})

describe("jerusalemTimeOfDay", () => {
    it("reads the time in Jerusalem, with daylight saving time", () => {
        // UTC+3 in summer, UTC+2 in winter.
        expect(jerusalemTimeOfDay("2026-05-17T16:00:54.294Z")).toBe("19:00")
        expect(jerusalemTimeOfDay("2026-01-17T16:00:00Z")).toBe("18:00")
    })

    it("uses a 24-hour clock", () => {
        expect(jerusalemTimeOfDay("2026-01-17T22:30:00Z")).toBe("00:30")
    })
})

describe("weekday", () => {
    it("is the day of the week of the calendar day", () => {
        expect(weekday("2026-11-01")).toBe(0) // Sunday
        expect(weekday("2026-11-07")).toBe(6) // Saturday
    })
})
