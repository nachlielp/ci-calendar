import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import { publicEvent } from "../../test/testEvents"
import { applyEventChanges } from "@ci-calendar/core/features/events/eventCache"
import type { ManagedEvent } from "@ci-calendar/core/features/events/managedEvent"
import {
    adminEventsKey,
    belongsInList,
    toCreators,
    withoutPassed,
    type AdminEventPage,
    type AdminEventPages,
} from "@ci-calendar/core/features/admin-events/adminEvents"

const NOW = new Date("2026-10-30T09:00:00Z")
const TODAY = "2026-10-30"

function managed(overrides: Partial<ManagedEvent> = {}): ManagedEvent {
    return {
        ...publicEvent(),
        hidden: false,
        ownerId: "dana",
        multiDay: false,
        recurringRefKey: null,
        ...overrides,
    }
}

const ids = (data: AdminEventPages | undefined) =>
    data?.pages.map((page) => page.events.map(({ id }) => id))

describe("the admins' events list", () => {
    it("keys a creator choice in one order, and the search trimmed", () => {
        expect(adminEventsKey("admin", ["b", "a"], " jam ")).toEqual(
            adminEventsKey("admin", ["a", "b"], "jam"),
        )
    })

    it("takes an event by day, creator and title, as the query filters", () => {
        const jam = managed({ title: "ג'אם Tel Aviv", startDate: TODAY })
        expect(belongsInList(jam, [], "", TODAY)).toBe(true)
        expect(belongsInList(jam, ["dana", "yael"], "tel aviv", TODAY)).toBe(
            true,
        )
        expect(belongsInList(jam, ["yael"], "", TODAY)).toBe(false)
        expect(belongsInList(jam, [], "ריטריט", TODAY)).toBe(false)
        expect(belongsInList(jam, [], "", "2026-10-31")).toBe(false)
        expect(belongsInList(managed({ hidden: true }), [], "", TODAY)).toBe(
            true,
        )
    })

    it("drops events whose day has passed, else keeps the data as is", () => {
        const data: AdminEventPages = {
            pages: [
                {
                    events: [
                        managed({ id: "a", startDate: "2026-10-30" }),
                        managed({ id: "b", startDate: "2026-10-31" }),
                    ],
                    next: null,
                },
            ],
            pageParams: [null],
        }
        expect(withoutPassed(data, "2026-10-30")).toBe(data)
        expect(ids(withoutPassed(data, "2026-10-31"))).toEqual([["b"]])
    })

    it("lists each creator once, by name", () => {
        expect(
            toCreators([
                { user_id: "y", users: { user_name: "יעל" } },
                { user_id: "d", users: { user_name: "דנה" } },
                { user_id: "y", users: { user_name: "יעל" } },
                { user_id: "n", users: { user_name: null } },
                { user_id: "gone", users: null },
                { user_id: null, users: null },
            ]),
        ).toEqual([
            { id: "d", name: "דנה" },
            { id: "y", name: "יעל" },
            { id: "n", name: "n" },
        ])
    })

    it("takes every event write into each cached list its filters match", () => {
        const queryClient = new QueryClient()
        const page = (events: ManagedEvent[]): AdminEventPage => ({
            events,
            next: null,
        })
        const everyone = adminEventsKey("admin", [], "")
        const yaels = adminEventsKey("admin", ["yael"], "")
        const jams = adminEventsKey("admin", [], "jam")
        queryClient.setQueryData<AdminEventPages>(
            everyone,
            {
                pages: [
                    page([
                        managed({ id: "a", startDate: "2026-10-31" }),
                        managed({ id: "c", startDate: "2026-11-05" }),
                    ]),
                ],
                pageParams: [null],
            },
            { updatedAt: 1000 },
        )
        const yaelsData: AdminEventPages = {
            pages: [page([])],
            pageParams: [null],
        }
        queryClient.setQueryData(yaels, yaelsData)
        queryClient.setQueryData<AdminEventPages>(jams, {
            pages: [page([managed({ id: "a", title: "Jam" })])],
            pageParams: [null],
        })

        applyEventChanges(queryClient, NOW, {
            saved: [
                // Renamed: out of the "jam" search.
                managed({ id: "a", startDate: "2026-10-31", hidden: true }),
                managed({ id: "b", startDate: "2026-11-01" }),
            ],
        })

        const all = queryClient.getQueryData<AdminEventPages>(everyone)
        expect(ids(all)).toEqual([["a", "b", "c"]])
        expect(all?.pages[0].events[0].hidden).toBe(true)
        expect(queryClient.getQueryState(everyone)?.dataUpdatedAt).toBe(1000)
        // Dana's events: not in Yael's list, which keeps its object.
        expect(queryClient.getQueryData(yaels)).toBe(yaelsData)
        expect(ids(queryClient.getQueryData(jams))).toEqual([[]])

        applyEventChanges(queryClient, NOW, { deleted: ["c"] })
        expect(ids(queryClient.getQueryData(everyone))).toEqual([["a", "b"]])
    })

    it("puts a saved event on the page whose cursor range holds it, not by the last row shown", () => {
        const queryClient = new QueryClient()
        const key = adminEventsKey("admin", [], "")
        // Page one was read up to "b" (its cursor); "b" moved away since,
        // so its last row shown is "a". Page two follows from "b" on.
        queryClient.setQueryData<AdminEventPages>(key, {
            pages: [
                {
                    events: [managed({ id: "a", startDate: "2026-11-01" })],
                    next: { startDate: "2026-11-10", id: "b" },
                },
                {
                    events: [managed({ id: "d", startDate: "2026-11-20" })],
                    next: { startDate: "2026-11-20", id: "d" },
                },
            ],
            pageParams: [null, { startDate: "2026-11-10", id: "b" }],
        })

        applyEventChanges(queryClient, NOW, {
            saved: [
                // Within page one's range (up to its cursor).
                managed({ id: "x", startDate: "2026-11-05" }),
                // Page two's range.
                managed({ id: "y", startDate: "2026-11-15" }),
                // After every loaded page: its own page brings it.
                managed({ id: "z", startDate: "2026-12-01" }),
            ],
        })
        expect(ids(queryClient.getQueryData(key))).toEqual([
            ["a", "x"],
            ["y", "d"],
        ])
    })
})
