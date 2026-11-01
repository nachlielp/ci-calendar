import { describe, expect, it } from "vitest"
import {
    addDays,
    dayRangeLabel,
    jerusalemDateLabel,
    jerusalemDateTimeLabel,
    numericDayLabel,
    jerusalemTimeOfDay,
    jerusalemToday,
    weekday,
} from "./jerusalemDate"
import { jerusalemInstant } from "./jerusalemInstant"

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

describe("jerusalemDateLabel", () => {
    it("prints the Jerusalem date day first, as legacy did", () => {
        expect(jerusalemDateLabel("2026-10-30T09:00:00Z")).toBe("30/10/2026")
        // Already the next day in Jerusalem.
        expect(jerusalemDateLabel("2026-10-30T22:30:00Z")).toBe("31/10/2026")
        expect(jerusalemDateTimeLabel("2026-10-30T22:30:00Z")).toBe(
            "31/10/2026 00:30",
        )
    })
})

describe("numeric day labels", () => {
    it("print days and ranges as legacy's manage-events list did", () => {
        expect(numericDayLabel("2026-11-01")).toBe("01/11/2026")
        expect(dayRangeLabel("2026-11-01", "2026-11-01")).toBe("01/11/2026")
        expect(dayRangeLabel("2026-11-01", "2026-11-03")).toBe(
            "01/11/2026 - 03/11/2026",
        )
    })
})

describe("jerusalemInstant", () => {
    it("is the instant Jerusalem's clock shows the time on that day", () => {
        // Winter (UTC+2) and summer (UTC+3).
        expect(jerusalemInstant("2026-11-01", "19:00")).toBe(
            "2026-11-01T17:00:00.000Z",
        )
        expect(jerusalemInstant("2026-07-01", "19:00")).toBe(
            "2026-07-01T16:00:00.000Z",
        )
        expect(jerusalemInstant("2026-11-01", "00:30")).toBe(
            "2026-10-31T22:30:00.000Z",
        )
    })

    it("reads back as the same time of day", () => {
        for (const day of ["2026-03-27", "2026-10-25", "2026-12-31"]) {
            for (const time of ["00:00", "01:55", "09:05", "23:55"]) {
                expect(jerusalemTimeOfDay(jerusalemInstant(day, time))).toBe(
                    time,
                )
                expect(
                    jerusalemToday(new Date(jerusalemInstant(day, time))),
                ).toBe(day)
            }
        }
    })
})
