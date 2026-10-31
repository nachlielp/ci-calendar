import {
    InfiniteQueryObserver,
    QueryClient,
    type InfiniteData,
    type QueryKey,
} from "@tanstack/react-query"
import { waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { adminEventsKey } from "../admin-events/adminEvents"
import { LINKED_EVENT_KIND } from "../calendar/linkedEvent"
import { PUBLIC_WINDOW_KIND, type PublicWindow } from "../calendar/publicWindow"
import type { PublicBio } from "../calendar/publicEvent"
import { publicEvent } from "../../test/testEvents"
// Registers the my-events lists.
import "../manage-events/myEvents"
import type { PastPage } from "../manage-events/myEvents"
import {
    applyBioChange,
    applyEventChanges,
    refreshEventQueries,
    type EventPage,
} from "./eventCache"
import {
    myPastEventsKey,
    myUpcomingEventsKey,
    type EventCursor,
} from "./eventLists"
import type { ManagedEvent } from "./managedEvent"

const NOW = new Date("2026-10-30T09:00:00Z")
const OWNER = "owner"

function managed(overrides: Partial<ManagedEvent> = {}): ManagedEvent {
    return {
        ...publicEvent(),
        hidden: false,
        ownerId: OWNER,
        multiDay: false,
        recurringRefKey: null,
        ...overrides,
    }
}

const ids = (events: readonly { id: string }[] | undefined) =>
    events?.map(({ id }) => id)

function setup() {
    const queryClient = new QueryClient()
    const windowKey = [PUBLIC_WINDOW_KIND]
    queryClient.setQueryData<PublicWindow>(
        windowKey,
        {
            from: "2026-10-30",
            to: "2027-01-28",
            events: [
                publicEvent({ id: "a", startDate: "2026-10-31" }),
                publicEvent({ id: "c", startDate: "2026-11-05" }),
            ],
        },
        { updatedAt: 1000 },
    )
    const upcomingKey = myUpcomingEventsKey(OWNER)
    queryClient.setQueryData<ManagedEvent[]>(upcomingKey, [
        managed({ id: "a", startDate: "2026-10-31" }),
        managed({ id: "c", startDate: "2026-11-05" }),
    ])
    const pastKey = myPastEventsKey(OWNER)
    const page = (days: string[], next: PastPage["next"]): PastPage => ({
        events: days.map((day) => managed({ id: `p${day}`, startDate: day })),
        next,
    })
    queryClient.setQueryData<InfiniteData<PastPage>>(pastKey, {
        pages: [
            page(["2026-10-20", "2026-10-10"], {
                startDate: "2026-10-10",
                id: "p2026-10-10",
            }),
        ],
        pageParams: [null],
    })
    const window = () =>
        queryClient.getQueryData<PublicWindow>(windowKey)?.events
    const upcoming = () => queryClient.getQueryData<ManagedEvent[]>(upcomingKey)
    const past = () =>
        queryClient
            .getQueryData<InfiniteData<PastPage>>(pastKey)
            ?.pages.map((p) => ids(p.events))
    const apply = (change: Parameters<typeof applyEventChanges>[2]) =>
        applyEventChanges(queryClient, NOW, change)
    return { queryClient, window, upcoming, past, apply, windowKey }
}

describe("applyEventChanges", () => {
    it("puts a saved visible event in the window and the owner's list, in date order", () => {
        const { window, upcoming, apply } = setup()
        apply({ saved: [managed({ id: "b", startDate: "2026-11-01" })] })

        expect(ids(window())).toEqual(["a", "b", "c"])
        expect(ids(upcoming())).toEqual(["a", "b", "c"])
        // The window holds only the public part (it is persisted).
        expect(window()![1]).not.toHaveProperty("hidden")
        expect(window()![1]).not.toHaveProperty("ownerId")
    })

    it("takes a hidden event off the window but keeps it in the list", () => {
        const { window, upcoming, apply } = setup()
        apply({
            saved: [
                managed({ id: "a", startDate: "2026-10-31", hidden: true }),
            ],
        })

        expect(ids(window())).toEqual(["c"])
        expect(upcoming()![0]).toMatchObject({ id: "a", hidden: true })
    })

    it("adds only events on the days the window was fetched for", () => {
        const { queryClient, windowKey, window, apply } = setup()
        // A window fetched days ago reaches less far than today's would.
        queryClient.setQueryData<PublicWindow>(windowKey, (old) => ({
            ...old!,
            to: "2026-12-01",
        }))
        apply({
            saved: [
                managed({ id: "in", startDate: "2026-12-01" }),
                managed({ id: "beyond", startDate: "2026-12-02" }),
            ],
        })
        expect(ids(window())).toEqual(["a", "c", "in"])
    })

    it("leaves events beyond the window, or past, off the calendar", () => {
        const { window, apply } = setup()
        apply({
            saved: [
                managed({ id: "far", startDate: "2027-03-01" }),
                managed({ id: "old", startDate: "2026-10-01" }),
            ],
        })
        expect(ids(window())).toEqual(["a", "c"])
    })

    it("moves an event changed to another day", () => {
        const { window, upcoming, apply } = setup()
        apply({ saved: [managed({ id: "a", startDate: "2026-11-10" })] })
        expect(ids(window())).toEqual(["c", "a"])
        expect(ids(upcoming())).toEqual(["c", "a"])
    })

    it("removes deleted events everywhere", () => {
        const { window, upcoming, past, apply } = setup()
        apply({ deleted: ["a", "p2026-10-20"] })
        expect(ids(window())).toEqual(["c"])
        expect(ids(upcoming())).toEqual(["c"])
        expect(past()).toEqual([["p2026-10-10"]])
    })

    it("keeps the window's fetch time, so it is revalidated as before", () => {
        const { queryClient, windowKey, apply } = setup()
        apply({ deleted: ["a"] })
        expect(queryClient.getQueryState(windowKey)?.dataUpdatedAt).toBe(1000)
    })

    it("puts a past event in the loaded pages only where they reach", () => {
        const { past, apply } = setup()
        apply({
            saved: [
                managed({ id: "p2026-10-15", startDate: "2026-10-15" }),
                // Older than every loaded event, with more pages to come:
                // its own page brings it.
                managed({ id: "p2026-09-01", startDate: "2026-09-01" }),
            ],
        })
        expect(past()).toEqual([["p2026-10-20", "p2026-10-15", "p2026-10-10"]])
    })

    it("keeps every event a change puts on one page, across loaded pages", () => {
        const { queryClient, past, apply } = setup()
        queryClient.setQueryData<InfiniteData<PastPage>>(
            myPastEventsKey(OWNER),
            (old) => ({
                pages: [
                    old!.pages[0],
                    {
                        events: [
                            managed({
                                id: "p2026-10-05",
                                startDate: "2026-10-05",
                            }),
                            managed({
                                id: "p2026-10-01",
                                startDate: "2026-10-01",
                            }),
                        ],
                        next: null,
                    },
                ],
                pageParams: [null, old!.pages[0].next],
            }),
        )
        apply({
            saved: [
                // Two on the first page, one on the second, one at the end
                // of the last page (no page follows), one hidden there now.
                managed({ id: "p2026-10-18", startDate: "2026-10-18" }),
                managed({ id: "p2026-10-12", startDate: "2026-10-12" }),
                managed({ id: "p2026-10-03", startDate: "2026-10-03" }),
                managed({ id: "p2026-09-01", startDate: "2026-09-01" }),
                managed({
                    id: "p2026-10-05",
                    startDate: "2026-10-05",
                    hidden: true,
                }),
            ],
        })
        expect(past()).toEqual([
            ["p2026-10-20", "p2026-10-18", "p2026-10-12", "p2026-10-10"],
            ["p2026-10-05", "p2026-10-03", "p2026-10-01", "p2026-09-01"],
        ])
    })

    it("puts a past event on the page whose cursor range holds it, not by the last row shown", () => {
        const { queryClient, past, apply } = setup()
        // Page one was read down to 10-10 (its cursor), which was deleted
        // since: its last row shown is 10-20. Page two follows from there.
        queryClient.setQueryData<InfiniteData<PastPage>>(
            myPastEventsKey(OWNER),
            (old) => ({
                pages: [
                    {
                        events: [
                            managed({
                                id: "p2026-10-20",
                                startDate: "2026-10-20",
                            }),
                        ],
                        next: old!.pages[0].next,
                    },
                    {
                        events: [
                            managed({
                                id: "p2026-10-05",
                                startDate: "2026-10-05",
                            }),
                        ],
                        next: { startDate: "2026-10-05", id: "p2026-10-05" },
                    },
                ],
                pageParams: [null, old!.pages[0].next],
            }),
        )
        apply({
            saved: [
                managed({ id: "p2026-10-15", startDate: "2026-10-15" }),
                managed({ id: "p2026-10-08", startDate: "2026-10-08" }),
                managed({ id: "p2026-09-01", startDate: "2026-09-01" }),
            ],
        })
        expect(past()).toEqual([
            ["p2026-10-20", "p2026-10-15"],
            ["p2026-10-08", "p2026-10-05"],
        ])
    })

    it("leaves a query's data alone when the change doesn't concern it", () => {
        const { queryClient, windowKey, apply } = setup()
        const before = queryClient.getQueryData(windowKey)
        apply({ deleted: ["elsewhere"] })
        expect(queryClient.getQueryData(windowKey)).toBe(before)
    })

    it("leaves other users' lists and uncached queries alone", () => {
        const { queryClient, apply } = setup()
        queryClient.setQueryData(myUpcomingEventsKey("other"), [])
        apply({ saved: [managed({ id: "b", startDate: "2026-11-01" })] })
        expect(queryClient.getQueryData(myUpcomingEventsKey("other"))).toEqual(
            [],
        )
        expect(
            queryClient.getQueryData(myPastEventsKey("someone")),
        ).toBeUndefined()
    })

    it("updates a shared link's event, by id or short id", () => {
        const { queryClient, apply } = setup()
        const byShortId = [LINKED_EVENT_KIND, "Xy1"]
        const byId = [LINKED_EVENT_KIND, "far"]
        queryClient.setQueryData(byShortId, null)
        queryClient.setQueryData(
            byId,
            publicEvent({ id: "far", startDate: "2027-03-01" }),
        )
        const unfetched = [LINKED_EVENT_KIND, "zzz"]
        queryClient.getQueryCache().build(queryClient, { queryKey: unfetched })

        apply({
            saved: [
                managed({ id: "x", shortId: "Xy1", startDate: "2027-02-01" }),
            ],
        })
        expect(queryClient.getQueryData(byShortId)).toMatchObject({ id: "x" })

        apply({
            saved: [
                managed({ id: "far", startDate: "2027-03-01", hidden: true }),
            ],
        })
        expect(queryClient.getQueryData(byId)).toBeNull()

        apply({ deleted: ["x"] })
        expect(queryClient.getQueryData(byShortId)).toBeNull()
        // A lookup not fetched yet is left to its fetch.
        apply({ saved: [managed({ id: "zzz", startDate: "2027-02-01" })] })
        expect(queryClient.getQueryData(unfetched)).toBeUndefined()
    })
})

describe("applyBioChange", () => {
    const bio = (overrides: Partial<PublicBio> = {}): PublicBio => ({
        userId: "teacher",
        name: "דנה",
        img: null,
        about: "",
        links: [],
        ...overrides,
    })
    const other = bio({ userId: "other", name: "אחר" })

    function withBios() {
        const queryClient = new QueryClient()
        const windowKey = [PUBLIC_WINDOW_KIND]
        queryClient.setQueryData<PublicWindow>(
            windowKey,
            {
                from: "2026-10-30",
                to: "2027-01-28",
                events: [
                    publicEvent({ id: "a", bios: [bio(), other] }),
                    publicEvent({ id: "b", bios: [other] }),
                ],
            },
            { updatedAt: 1000 },
        )
        const pastKey = myPastEventsKey(OWNER)
        queryClient.setQueryData<InfiniteData<PastPage>>(pastKey, {
            pages: [
                {
                    events: [managed({ id: "p", bios: [bio()] })],
                    next: { startDate: "2026-10-10", id: "p" },
                },
            ],
            pageParams: [null],
        })
        const linkKey = [LINKED_EVENT_KIND, "b"]
        queryClient.setQueryData(linkKey, publicEvent({ id: "b", bios: [] }))
        return { queryClient, windowKey, pastKey, linkKey }
    }

    it("shows the new bio wherever an event embeds it, keeping fetch times", () => {
        const { queryClient, windowKey, pastKey, linkKey } = withBios()
        const link = queryClient.getQueryData(linkKey)
        applyBioChange(queryClient, "teacher", bio({ name: "דנה כהן" }))

        const window = queryClient.getQueryData<PublicWindow>(windowKey)!
        expect(window.events[0].bios.map((b) => b.name)).toEqual([
            "דנה כהן",
            "אחר",
        ])
        expect(queryClient.getQueryState(windowKey)?.dataUpdatedAt).toBe(1000)
        const past = queryClient.getQueryData<InfiniteData<PastPage>>(pastKey)!
        expect(past.pages[0].events[0].bios[0].name).toBe("דנה כהן")
        expect(past.pages[0].next).toEqual({ startDate: "2026-10-10", id: "p" })
        // Untouched queries keep their data object.
        expect(queryClient.getQueryData(linkKey)).toBe(link)
    })

    it("drops a bio that is no longer public", () => {
        const { queryClient, windowKey, pastKey } = withBios()
        applyBioChange(queryClient, "teacher", null)

        const window = queryClient.getQueryData<PublicWindow>(windowKey)!
        expect(window.events.map((e) => e.bios.map((b) => b.userId))).toEqual([
            ["other"],
            ["other"],
        ])
        const past = queryClient.getQueryData<InfiniteData<PastPage>>(pastKey)!
        expect(past.pages[0].events[0].bios).toEqual([])
    })

    it("refetches the event lists when asked (a bio that became public)", () => {
        const { queryClient, windowKey } = withBios()
        applyBioChange(queryClient, "teacher", bio(), { refresh: true })
        expect(queryClient.getQueryState(windowKey)?.isInvalidated).toBe(true)
    })
})

// TanStack refetches an infinite query page by page, every loaded page in
// turn: a write must never set that off for a paginated list.
describe.each([
    ["my past events", myPastEventsKey(OWNER)],
    ["the admins' list", adminEventsKey("admin", [], "")],
])("a write and the paginated %s", (_name, queryKey: QueryKey) => {
    /** The list with two pages loaded, and the cursors its pages asked for. */
    async function twoPages() {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        })
        const asked: (EventCursor | null)[] = []
        let gate = Promise.resolve()
        const observer = new InfiniteQueryObserver(queryClient, {
            queryKey,
            staleTime: Infinity,
            initialPageParam: null as EventCursor | null,
            getNextPageParam: (page: EventPage<ManagedEvent>) => page.next,
            queryFn: async ({ pageParam }) => {
                asked.push(pageParam)
                await gate
                const n = asked.length
                const id = `e${n}`
                const startDate = `2026-11-${String(n).padStart(2, "0")}`
                return {
                    events: [managed({ id, startDate })],
                    next: { startDate, id },
                }
            },
        })
        const unsubscribe = observer.subscribe(() => {})
        await waitFor(() =>
            expect(observer.getCurrentResult().data).toBeDefined(),
        )
        await observer.fetchNextPage()
        const pages = () =>
            queryClient.getQueryData<InfiniteData<unknown>>(queryKey)?.pages
                .length
        expect(pages()).toBe(2)
        const hold = () => {
            let release!: () => void
            gate = new Promise<void>((resolve) => (release = resolve))
            return release
        }
        const idle = () =>
            waitFor(() =>
                expect(queryClient.getQueryState(queryKey)?.fetchStatus).toBe(
                    "idle",
                ),
            )
        return { queryClient, observer, asked, pages, hold, idle, unsubscribe }
    }

    it("redoes a fetch in flight from the first page only", async () => {
        const { queryClient, observer, asked, pages, hold, idle } =
            await twoPages()
        const release = hold()
        // "Load more" is on its way, sent before the write.
        void observer.fetchNextPage()
        expect(asked).toHaveLength(3)

        applyEventChanges(queryClient, NOW, { deleted: ["e1"] })
        release()
        await idle()

        // Only the first page was asked for again, and the rest dropped.
        expect(asked.slice(3)).toEqual([null])
        expect(pages()).toBe(1)
    })

    it("reads it again from its first page when a write can't say where events stand", async () => {
        const { queryClient, asked, pages, idle, unsubscribe } =
            await twoPages()

        refreshEventQueries(queryClient)
        await idle()
        expect(asked.slice(2)).toEqual([null])
        expect(pages()).toBe(1)

        // Off screen, it is dropped: it loads from page one when shown.
        unsubscribe()
        refreshEventQueries(queryClient)
        expect(queryClient.getQueryState(queryKey)).toBeUndefined()
        expect(asked).toHaveLength(3)
    })
})
