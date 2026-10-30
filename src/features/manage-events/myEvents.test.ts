import { describe, expect, it } from "vitest"
import { publicEvent } from "../calendar/testEvents"
import type { ManagedEvent } from "../events/managedEvent"
import { afterCursor, comparePast, laterInSeries } from "./myEvents"

const managed = (overrides: Partial<ManagedEvent> = {}): ManagedEvent => ({
    ...publicEvent(),
    hidden: false,
    ownerId: "me",
    multiDay: false,
    recurringRefKey: null,
    ...overrides,
})

describe("laterInSeries", () => {
    const series = ["2026-11-15", "2026-11-01", "2026-11-08"].map((day) =>
        managed({ id: day, startDate: day, recurringRefKey: "k" }),
    )
    const other = managed({ id: "x", startDate: "2026-11-20" })

    it("gives the series' later events, in date order", () => {
        expect(
            laterInSeries([...series, other], series[1]).map((e) => e.id),
        ).toEqual(["2026-11-08", "2026-11-15"])
    })

    it("gives nothing for an event outside a series", () => {
        expect(laterInSeries([...series, other], other)).toEqual([])
    })
})

describe("past pagination", () => {
    it("asks for what comes after the cursor in the list's order", () => {
        expect(afterCursor({ startDate: "2026-09-03", id: "b" })).toBe(
            "start_date.lt.2026-09-03,and(start_date.eq.2026-09-03,id.lt.b)",
        )
    })

    it("orders newest day first, then id descending", () => {
        const events = [
            managed({ id: "a", startDate: "2026-09-03" }),
            managed({ id: "c", startDate: "2026-09-01" }),
            managed({ id: "b", startDate: "2026-09-03" }),
        ]
        expect(events.sort(comparePast).map((e) => e.id)).toEqual([
            "b",
            "a",
            "c",
        ])
    })
})
