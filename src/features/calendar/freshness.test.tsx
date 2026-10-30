import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, screen } from "@testing-library/react"
import {
    createMemoryStorage,
    type DeviceStorage,
} from "../../app/deviceStorage"
import { setPageVisibility } from "../../test/browser"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { renderApp, type RenderAppOptions } from "../../test/renderApp"
import { event, eventTitles } from "./testEvents"

// "Today" in these tests is Friday 2026-10-30 in Asia/Jerusalem.
const NOW = new Date("2026-10-30T09:00:00Z")
const YESTERDAY = new Date("2026-10-29T09:00:00Z")
const MINUTE = 60 * 1000

/** A first visit that loads the calendar and leaves the cache in `storage`. */
async function firstVisit(
    rows: ReturnType<typeof event>[],
    options: Omit<RenderAppOptions, "fake"> = {},
) {
    const view = renderApp({
        fake: createFakeDataClient({ ci_events: rows }),
        now: NOW,
        ...options,
    })
    await eventTitles()
    view.unmount()
}

/** The visitor switches away and comes back `elapsedMs` after the fetch. */
function leaveAndReturnAfter(elapsedMs: number) {
    setPageVisibility("hidden")
    vi.setSystemTime(NOW.getTime() + elapsedMs)
    setPageVisibility("visible")
}

function goOffline() {
    act(() => {
        window.dispatchEvent(new Event("offline"))
    })
}

function goOnline() {
    act(() => {
        window.dispatchEvent(new Event("online"))
    })
}

describe("repeat visits", () => {
    it("shows the last events seen at once, then updates from the network", async () => {
        const storage = createMemoryStorage()
        await firstVisit([event({ title: "ג'אם ישן" })], { storage })

        const fake = createFakeDataClient({
            ci_events: [
                event({ title: "ג'אם ישן" }),
                event({ title: "ג'אם חדש", start_date: "2026-11-02" }),
            ],
        })
        fake.holdTable("ci_events")
        renderApp({ fake, storage, now: NOW })

        // The revalidation request is out, but has not been answered yet.
        expect(await eventTitles()).toEqual(["ג'אם ישן"])
        expect(screen.queryByText("טוען אירועים…")).not.toBeInTheDocument()
        expect(fake.requests).toHaveLength(1)

        fake.releaseTable("ci_events")
        await screen.findByText("ג'אם חדש")
        expect(await eventTitles()).toEqual(["ג'אם ישן", "ג'אם חדש"])
    })

    it("never shows cached events dated before today", async () => {
        const storage = createMemoryStorage()
        await firstVisit(
            [
                event({ title: "ג'אם של אתמול", start_date: "2026-10-29" }),
                event({ title: "ג'אם של מחר", start_date: "2026-10-31" }),
            ],
            { storage, now: YESTERDAY },
        )

        const fake = createFakeDataClient()
        fake.holdTable("ci_events")
        renderApp({ fake, storage, now: NOW })

        expect(await eventTitles()).toEqual(["ג'אם של מחר"])
    })

    it("never shows cached events dated before today in Jerusalem, though still today in UTC", async () => {
        const storage = createMemoryStorage()
        await firstVisit(
            [
                event({ title: "ה-30", start_date: "2026-10-30" }),
                event({ title: "ה-31", start_date: "2026-10-31" }),
            ],
            { storage },
        )

        const fake = createFakeDataClient()
        fake.holdTable("ci_events")
        // 22:30 UTC on Oct 30 is already Oct 31 in Jerusalem (UTC+2).
        renderApp({ fake, storage, now: new Date("2026-10-30T22:30:00Z") })

        expect(await eventTitles()).toEqual(["ה-31"])
    })

    it("after a deploy, shows the previous build's cache and revalidates it", async () => {
        const storage = createMemoryStorage()
        await firstVisit([event({ title: "מהגרסה הקודמת" })], {
            storage,
            buildVersion: "old-build",
        })

        const fake = createFakeDataClient({
            ci_events: [event({ title: "מהשרת" })],
        })
        fake.holdTable("ci_events")
        renderApp({ fake, storage, buildVersion: "new-build", now: NOW })

        expect(await eventTitles()).toEqual(["מהגרסה הקודמת"])
        expect(fake.requests).toHaveLength(1)

        fake.releaseTable("ci_events")
        await screen.findByText("מהשרת")
        expect(await eventTitles()).toEqual(["מהשרת"])
    })

    it("keeps cached events with a notice when the refresh fails", async () => {
        const storage = createMemoryStorage()
        await firstVisit([event({ title: "ג'אם" })], { storage })

        const fake = createFakeDataClient()
        fake.failTable("ci_events", "network down")
        renderApp({ fake, storage, now: NOW })

        expect(await screen.findByRole("status")).toHaveTextContent(
            /לא הצלחנו לרענן/,
        )
        expect(await eventTitles()).toEqual(["ג'אם"])
    })

    it("opens offline from the cache, and fetches once back online", async () => {
        const storage = createMemoryStorage()
        await firstVisit([event({ title: "ג'אם" })], { storage })

        Object.defineProperty(navigator, "onLine", {
            configurable: true,
            value: false,
        })
        const fake = createFakeDataClient({
            ci_events: [event({ title: "ג'אם" }), event({ title: "שיעור" })],
        })
        renderApp({ fake, storage, now: NOW })

        expect(await eventTitles()).toEqual(["ג'אם"])
        expect(screen.getByText(/אין חיבור לאינטרנט/)).toBeVisible()
        expect(fake.requests).toHaveLength(0)

        goOnline()

        await screen.findByText("שיעור")
        expect(fake.requests).toHaveLength(1)
        expect(screen.queryByText(/אין חיבור לאינטרנט/)).not.toBeInTheDocument()
    })
})

describe("first visit offline", () => {
    it("says the events can't load without a connection, and loads them once online", async () => {
        Object.defineProperty(navigator, "onLine", {
            configurable: true,
            value: false,
        })
        const fake = createFakeDataClient({
            ci_events: [event({ title: "ג'אם" })],
        })
        renderApp({ fake, now: NOW })

        expect(
            await screen.findByText(/לא ניתן לטעון את האירועים/),
        ).toBeVisible()
        expect(screen.queryByText("טוען אירועים…")).not.toBeInTheDocument()
        expect(screen.queryByText(/ייתכן ש/)).not.toBeInTheDocument()

        goOnline()

        expect(await eventTitles()).toEqual(["ג'אם"])
    })
})

describe("device storage", () => {
    it("still works when saving to storage fails (quota full)", async () => {
        const full: DeviceStorage = {
            ...createMemoryStorage(),
            setItem: () => {
                throw new DOMException("full", "QuotaExceededError")
            },
        }
        const fake = createFakeDataClient({
            ci_events: [event({ title: "ג'אם" })],
        })

        renderApp({ fake, storage: full, now: NOW })

        expect(await eventTitles()).toEqual(["ג'אם"])
        expect(screen.queryByRole("status")).not.toBeInTheDocument()
    })

    it("clears the legacy client's cached events and bios", async () => {
        const storage = createMemoryStorage()
        storage.setItem("events", "[]")
        storage.setItem("bios", "[]")
        storage.setItem("language", "en")

        renderApp({ storage, now: NOW })
        // The legacy language choice is kept, and used.
        await screen.findByText("No upcoming events")

        expect(storage.getItem("events")).toBeNull()
        expect(storage.getItem("bios")).toBeNull()
        expect(storage.getItem("language")).toBe("en")
    })
})

describe("freshness", () => {
    beforeEach(() => {
        // Only the clock is faked: staleness is measured with Date.now().
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(NOW)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("refetches once when the app becomes visible after the data went stale", async () => {
        const rows = [event({ title: "ג'אם" })]
        const fake = createFakeDataClient({ ci_events: rows })
        renderApp({ fake, now: NOW })
        await eventTitles()

        rows.push(event({ title: "שיעור חדש", start_date: "2026-11-02" }))
        leaveAndReturnAfter(6 * MINUTE)

        expect(await screen.findByText("שיעור חדש")).toBeVisible()
        expect(fake.requests).toHaveLength(2)
    })

    it("doesn't refetch when the app becomes visible while the data is fresh", async () => {
        const fake = createFakeDataClient({
            ci_events: [event({ title: "ג'אם" })],
        })
        renderApp({ fake, now: NOW })
        await eventTitles()

        leaveAndReturnAfter(4 * MINUTE)
        // Let any refetch the event would have started get under way.
        await act(() => Promise.resolve())

        expect(fake.requests).toHaveLength(1)
    })

    it("shows an offline notice, and refetches when the device is back online", async () => {
        const rows = [event({ title: "ג'אם" })]
        const fake = createFakeDataClient({ ci_events: rows })
        renderApp({ fake, now: NOW })
        await eventTitles()

        goOffline()
        expect(screen.getByText(/אין חיבור לאינטרנט/)).toBeVisible()

        // Back within the fresh window: reconnecting refetches anyway.
        rows.push(event({ title: "שיעור חדש", start_date: "2026-11-02" }))
        vi.setSystemTime(NOW.getTime() + MINUTE)
        goOnline()

        expect(await screen.findByText("שיעור חדש")).toBeVisible()
        expect(fake.requests).toHaveLength(2)
        expect(screen.queryByText(/אין חיבור לאינטרנט/)).not.toBeInTheDocument()
    })

    it("drops today's events once midnight passes, without a request", async () => {
        const clock = new Date(NOW)
        const fake = createFakeDataClient({
            ci_events: [
                event({ title: "היום", start_date: "2026-10-30" }),
                event({ title: "מחר", start_date: "2026-10-31" }),
            ],
        })
        renderApp({ fake, now: clock })
        expect(await eventTitles()).toEqual(["היום", "מחר"])
        const requests = fake.requests.length

        setPageVisibility("hidden")
        clock.setTime(new Date("2026-10-31T09:00:00Z").getTime())
        setPageVisibility("visible")

        expect(await eventTitles()).toEqual(["מחר"])
        expect(fake.requests).toHaveLength(requests)
    })
})
