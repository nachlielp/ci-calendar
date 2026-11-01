import { describe, expect, it } from "vitest"
import { cardsByDay, toEventCards } from "./eventCards"
import { HEBREW } from "./eventLocales"
import { publicEvent } from "../../testing/testEvents"

const titlesByDay = (events: Parameters<typeof toEventCards>[0]) =>
    Object.fromEntries(
        [...cardsByDay(toEventCards(events, HEBREW), "2027-01-28")].map(
            ([day, cards]) => [day, cards.map((card) => card.event.title)],
        ),
    )

describe("cardsByDay", () => {
    it("puts a single-day event on its day", () => {
        expect(titlesByDay([publicEvent({ title: "ג'אם" })])).toEqual({
            "2026-11-01": ["ג'אם"],
        })
    })

    it("puts a multi-day event on every day it spans, across months", () => {
        const retreat = publicEvent({
            title: "ריטריט",
            startDate: "2026-11-29",
            endDate: "2026-12-02",
            type: "retreat",
            segments: [],
        })

        expect(Object.keys(titlesByDay([retreat]))).toEqual([
            "2026-11-29",
            "2026-11-30",
            "2026-12-01",
            "2026-12-02",
        ])
    })

    it("keeps each day's events in list order", () => {
        const retreat = publicEvent({
            id: "r",
            title: "ריטריט",
            startDate: "2026-10-31",
            endDate: "2026-11-02",
            segments: [],
        })
        const jam = publicEvent({ id: "j", title: "ג'אם" })

        expect(titlesByDay([jam, retreat])["2026-11-01"]).toEqual([
            "ריטריט",
            "ג'אם",
        ])
    })

    it("stops at the calendar's last day", () => {
        const typo = publicEvent({
            startDate: "2027-01-27",
            endDate: "2207-01-27",
            segments: [],
        })
        expect(Object.keys(titlesByDay([typo]))).toEqual([
            "2027-01-27",
            "2027-01-28",
        ])
    })

    it("shows an event whose end is before its start on its start day", () => {
        const odd = publicEvent({
            startDate: "2026-11-05",
            endDate: "2026-11-01",
        })
        expect(Object.keys(titlesByDay([odd]))).toEqual(["2026-11-05"])
    })
})
