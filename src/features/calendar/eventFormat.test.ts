import { describe, expect, it } from "vitest"
import { toEventCards } from "./eventCards"
import {
    eventDateLabel,
    eventPath,
    eventTimeRange,
    googleCalendarUrl,
    mapsUrl,
    priceLabel,
    segmentTimeRange,
    teacherNames,
    typeLabels,
} from "./eventFormat"
import { publicEvent } from "./testEvents"

const multiDay = publicEvent({
    startDate: "2026-11-06",
    endDate: "2026-11-08",
    type: "retreat",
    segments: [],
})

const segment = (start: string, end: string, type = "class") => ({
    type,
    startTime: start,
    endTime: end,
    teachers: [],
    tags: [],
})

describe("eventDateLabel", () => {
    it("names the day as the legacy app did", () => {
        expect(eventDateLabel(publicEvent({ startDate: "2026-11-07" }))).toBe(
            "שבת, יום שבת 7 בנובמבר",
        )
    })

    it("gives a multi-day event its day range", () => {
        expect(eventDateLabel(multiDay)).toBe(
            "שישי, יום שישי 6 בנובמבר - ראשון, יום ראשון 8 בנובמבר",
        )
    })
})

describe("time ranges", () => {
    it("spans the first segment's start to the last one's end, in Jerusalem", () => {
        const event = publicEvent({
            segments: [
                segment("2026-11-01T17:00:00Z", "2026-11-01T18:00:00Z"),
                segment("2026-11-01T18:00:00Z", "2026-11-01T20:30:00Z", "jam"),
            ],
        })

        expect(eventTimeRange(event)).toBe("19:00 - 22:30")
        expect(segmentTimeRange(event.segments[1])).toBe("20:00 - 22:30")
    })

    it("reads only the time of day of segment timestamps", () => {
        // Made from a template in May (summer time): still 19:00 locally.
        const event = publicEvent({
            segments: [
                segment("2026-05-17T16:00:54.294Z", "2026-05-17T19:30:54.294Z"),
            ],
        })

        expect(eventTimeRange(event)).toBe("19:00 - 22:30")
    })

    it("has none for multi-day events", () => {
        expect(eventTimeRange(multiDay)).toBeNull()
    })
})

describe("labels", () => {
    it("formats a price in shekels", () => {
        expect(priceLabel({ title: "שיעור וג'אם", sum: 80 })).toBe(
            "שיעור וג'אם: 80₪",
        )
    })

    it("lists the event's and its segments' types once each", () => {
        const event = publicEvent({
            segments: [
                segment("2026-11-01T17:00:00Z", "2026-11-01T18:00:00Z"),
                segment("2026-11-01T18:00:00Z", "2026-11-01T19:00:00Z", "jam"),
                segment("2026-11-01T19:00:00Z", "2026-11-01T20:00:00Z"),
            ],
        })

        expect(typeLabels(event)).toEqual(["שיעור", "ג'אם"])
        expect(typeLabels(multiDay)).toEqual(["ריטריט"])
    })

    it("names teachers by their public bio, else by their tag", () => {
        const event = publicEvent({
            multiDayTeachers: [{ label: "old name", value: "u1" }],
            segments: [
                {
                    ...segment("2026-11-01T17:00:00Z", "2026-11-01T18:00:00Z"),
                    teachers: [
                        { label: "old name", value: "u1" },
                        { label: "רותם", value: "רותם" },
                    ],
                },
            ],
            bios: [
                { userId: "u1", name: "נועה", img: null, about: "", links: [] },
            ],
        })

        expect(teacherNames(event)).toEqual(["נועה", "רותם"])
    })
})

describe("links", () => {
    it("shares the short id, falling back to the id", () => {
        expect(eventPath(publicEvent({ shortId: "Ab1" }))).toBe("/event/Ab1")
        expect(eventPath(publicEvent({ id: "e1", shortId: null }))).toBe(
            "/event/e1",
        )
    })

    it("adds a single-day event to Google Calendar on its own day", () => {
        const event = publicEvent({
            title: "ג'אם",
            shortId: "Ab1",
            startDate: "2026-11-07",
            segments: [segment("2026-05-17T16:00:00Z", "2026-05-17T21:30:00Z")],
        })

        const params = new URL(googleCalendarUrl(event)).searchParams
        // 19:00 to 00:30 the next night.
        expect(params.get("dates")).toBe("20261107T190000/20261108T003000")
        expect(params.get("ctz")).toBe("Asia/Jerusalem")
        expect(params.get("text")).toBe("ג'אם")
        expect(params.get("location")).toBe("תל אביב")
        expect(params.get("details")).toMatch(/^www\.ci-events\.org\/Ab1/)
    })

    it("adds a multi-day event as all-day, with an exclusive end", () => {
        const params = new URL(googleCalendarUrl(multiDay)).searchParams

        expect(params.get("dates")).toBe("20261106/20261109")
    })

    it("navigates with the platform's maps app", () => {
        const address = { label: "יער המאכל", placeId: "P1" }

        expect(mapsUrl(address, "Mozilla (iPhone; CPU iPhone OS)")).toBe(
            `comgooglemaps://?q=${encodeURIComponent("יער המאכל")}`,
        )
        expect(mapsUrl(address, "Mozilla (Linux; Android 14)")).toBe(
            `geo:0,0?q=${encodeURIComponent("יער המאכל")}`,
        )
        expect(mapsUrl(address, "Mozilla (Macintosh)")).toBe(
            "https://www.google.com/maps/place/?q=place_id:P1",
        )
    })
})

describe("toEventCards", () => {
    it("orders by day, then start time, multi-day events first", () => {
        const late = publicEvent({
            id: "late",
            startDate: "2026-11-06",
            segments: [segment("2026-11-06T18:00:00Z", "2026-11-06T19:00:00Z")],
        })
        const early = publicEvent({
            id: "early",
            startDate: "2026-11-06",
            segments: [segment("2026-11-06T08:00:00Z", "2026-11-06T09:00:00Z")],
        })
        const nextDay = publicEvent({ id: "next", startDate: "2026-11-07" })

        const ids = toEventCards([nextDay, late, multiDay, early]).map(
            (card) => card.event.id,
        )

        expect(ids).toEqual([multiDay.id, "early", "late", "next"])
    })
})
