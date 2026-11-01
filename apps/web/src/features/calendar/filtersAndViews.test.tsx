import { describe, expect, it } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { renderApp } from "../../test/renderApp"
import { eventTitles } from "../../test/testEvents"
import { event, segment } from "@ci-calendar/core/testing/testEvents"

// "Today" in these tests is Friday 2026-10-30 in Asia/Jerusalem; the window
// runs to 2027-01-28.
const NOW = new Date("2026-10-30T09:00:00Z")

const classInCenter = event({
    short_id: "Cl1",
    title: "שיעור במרכז",
    start_date: "2026-11-01",
    district: "center",
    segments: [segment({ type: "class" })],
})
const classAndJamInJerusalem = event({
    title: "שיעור וג'אם בירושלים",
    start_date: "2026-11-02",
    end_date: "2026-11-02",
    district: "jerusalem",
    segments: [
        segment({ type: "class" }),
        segment({
            type: "jam",
            startTime: "2026-11-02T19:00:00Z",
            endTime: "2026-11-02T21:00:00Z",
        }),
    ],
})
const retreatInGalilee = event({
    title: "ריטריט בגליל",
    start_date: "2026-11-05",
    end_date: "2026-11-07",
    district: "galilee",
    type: "retreat",
    segments: [],
})

const seeded = () =>
    createFakeDataClient({
        ci_events: [classInCenter, classAndJamInJerusalem, retreatInGalilee],
    })

async function openFilters() {
    await userEvent.click(screen.getByRole("button", { name: /^סינון/ }))
    return screen.findByRole("dialog", { name: "סינון" })
}

async function toggleFilter(dialog: HTMLElement, label: string) {
    await userEvent.click(within(dialog).getByRole("button", { name: label }))
}

describe("filters", () => {
    it("filters by event type instantly, with no request", async () => {
        const { fake, router } = renderApp({ fake: seeded(), now: NOW })
        await eventTitles()
        const requests = fake.requests.length

        const dialog = await openFilters()
        await toggleFilter(dialog, "ג'אם")

        // A class-and-jam evening matches `jam` through its second segment.
        expect(await eventTitles()).toEqual(["שיעור וג'אם בירושלים"])
        expect(router.state.location.search).toBe("?f=jam")
        // In place: Back doesn't step through filter changes.
        expect(router.state.historyAction).toBe("REPLACE")

        await toggleFilter(dialog, "ריטריט")
        expect(await eventTitles()).toEqual([
            "שיעור וג'אם בירושלים",
            "ריטריט בגליל",
        ])
        expect(fake.requests).toHaveLength(requests)
    })

    it("filters by district, and by type and district together", async () => {
        const { fake, router } = renderApp({ fake: seeded(), now: NOW })
        await eventTitles()
        const requests = fake.requests.length

        const dialog = await openFilters()
        await toggleFilter(dialog, "ירושלים")
        await toggleFilter(dialog, "מרכז")
        expect(await eventTitles()).toEqual([
            "שיעור במרכז",
            "שיעור וג'אם בירושלים",
        ])

        await toggleFilter(dialog, "ג'אם")
        expect(await eventTitles()).toEqual(["שיעור וג'אם בירושלים"])
        expect(router.state.location.search).toBe("?f=jerusalem&f=center&f=jam")
        expect(fake.requests).toHaveLength(requests)
    })

    it("marks the selected options and the filter button", async () => {
        renderApp({ fake: seeded(), now: NOW, path: "/?f=jam&f=jerusalem" })
        await eventTitles()

        expect(
            screen.getByRole("button", {
                name: /^סינון\s*\(2 סינונים פעילים\)$/,
            }),
        ).toBeInTheDocument()
        const dialog = await openFilters()
        expect(
            within(dialog).getByRole("button", { name: "ג'אם" }),
        ).toHaveAttribute("aria-pressed", "true")
        expect(
            within(dialog).getByRole("button", { name: "שיעור" }),
        ).toHaveAttribute("aria-pressed", "false")
    })

    it("applies a legacy shared link's filters on load", async () => {
        renderApp({
            fake: seeded(),
            now: NOW,
            path: "/?f=retreat&f=class&f=galilee&f=bogus",
        })

        expect(await eventTitles()).toEqual(["ריטריט בגליל"])
    })

    it("applies legacy warmup links, though warmup isn't offered", async () => {
        const fake = createFakeDataClient({
            ci_events: [
                classInCenter,
                event({
                    title: "חימום",
                    segments: [segment({ type: "warmup" })],
                }),
            ],
        })
        renderApp({ fake, now: NOW, path: "/?f=warmup" })

        expect(await eventTitles()).toEqual(["חימום"])
        expect(
            screen.getByRole("button", { name: "הסרת הסינון חימום" }),
        ).toBeVisible()
        const dialog = await openFilters()
        expect(
            within(dialog).queryByRole("button", { name: "חימום" }),
        ).not.toBeInTheDocument()
    })

    it("matches multi-day events stored with a Hebrew type", async () => {
        const fake = createFakeDataClient({
            ci_events: [
                classInCenter,
                event({
                    title: "ריטריט ישן",
                    start_date: "2026-11-05",
                    end_date: "2026-11-07",
                    type: "ריטריט",
                    segments: [],
                }),
            ],
        })
        renderApp({ fake, now: NOW, path: "/?f=retreat" })

        expect(await eventTitles()).toEqual(["ריטריט ישן"])
    })

    it("shows the selected filters as chips that remove one each", async () => {
        const { router } = renderApp({
            fake: seeded(),
            now: NOW,
            path: "/?f=jam&f=retreat",
        })
        expect(await eventTitles()).toHaveLength(2)

        await userEvent.click(
            screen.getByRole("button", { name: "הסרת הסינון ג'אם" }),
        )

        expect(await eventTitles()).toEqual(["ריטריט בגליל"])
        expect(router.state.location.search).toBe("?f=retreat")
        expect(router.state.historyAction).toBe("REPLACE")
    })

    it("clears every filter at once", async () => {
        const { router, storage } = renderApp({
            fake: seeded(),
            now: NOW,
            path: "/?f=jam&f=jerusalem",
        })
        expect(await eventTitles()).toHaveLength(1)

        const dialog = await openFilters()
        await userEvent.click(
            within(dialog).getByRole("button", { name: "ניקוי הסינון" }),
        )

        expect(await eventTitles()).toHaveLength(3)
        expect(router.state.location.search).toBe("")
        expect(
            within(dialog).queryByRole("button", { name: "ניקוי הסינון" }),
        ).not.toBeInTheDocument()
        expect(screen.queryByRole("button", { name: /^הסרת הסינון/ })).toBe(
            null,
        )
        // Cleared for the next visit too.
        expect(storage.getItem("eventType")).toBe("[]")
    })

    it("says so when no event matches", async () => {
        renderApp({ fake: seeded(), now: NOW, path: "/?f=south" })

        expect(await screen.findByText("אין אירועים קרובים")).toBeVisible()
    })

    it("restores the last filters chosen on this device at /", async () => {
        const storage = createMemoryStorage()
        const first = renderApp({ fake: seeded(), now: NOW, storage })
        await eventTitles()
        await toggleFilter(await openFilters(), "ריטריט")
        first.unmount()

        const { router } = renderApp({ fake: seeded(), now: NOW, storage })

        expect(await eventTitles()).toEqual(["ריטריט בגליל"])
        expect(router.state.location.search).toBe("?f=retreat")
        // Written into the URL in place, so Back doesn't land on `/` and
        // restore them again.
        expect(router.state.historyAction).toBe("REPLACE")
    })

    it("restores filters the legacy app stored", async () => {
        const storage = createMemoryStorage()
        storage.setItem("eventType", '["class","class"]')
        storage.setItem("district", '["jerusalem"]')

        renderApp({ fake: seeded(), now: NOW, storage })

        expect(await eventTitles()).toEqual(["שיעור וג'אם בירושלים"])
    })

    it("lets a shared link's filters win, without storing them", async () => {
        const storage = createMemoryStorage()
        storage.setItem("eventType", '["class"]')

        renderApp({ fake: seeded(), now: NOW, storage, path: "/?f=retreat" })

        expect(await eventTitles()).toEqual(["ריטריט בגליל"])
        expect(storage.getItem("eventType")).toBe('["class"]')
    })

    it("stores only the filters tapped on a shared link's view", async () => {
        const storage = createMemoryStorage()
        storage.setItem("eventType", '["class"]')
        const first = renderApp({
            fake: seeded(),
            now: NOW,
            storage,
            path: "/?f=retreat&f=galilee",
        })
        await eventTitles()

        await userEvent.click(
            screen.getByRole("button", { name: "הסרת הסינון ריטריט" }),
        )
        await toggleFilter(await openFilters(), "ג'אם")

        // The shared `galilee` was never tapped, so it isn't stored; the
        // visitor's own `class` stays.
        expect(storage.getItem("eventType")).toBe('["class","jam"]')
        expect(storage.getItem("district")).toBe(null)
        first.unmount()

        const { router } = renderApp({ fake: seeded(), now: NOW, storage })
        await eventTitles()
        expect(router.state.location.search).toBe("?f=class&f=jam")
    })

    it("doesn't restore stored filters on an event's page", async () => {
        const storage = createMemoryStorage()
        storage.setItem("eventType", '["retreat"]')
        const { router } = renderApp({
            fake: seeded(),
            now: NOW,
            storage,
            path: "/event/Cl1",
        })

        expect(await screen.findByRole("dialog")).toBeVisible()
        expect(router.state.location.search).toBe("")
        expect(await eventTitles()).toHaveLength(3)

        // Closing lands on `/` with no query, which restores them (legacy).
        await userEvent.keyboard("{Escape}")
        expect(await eventTitles()).toEqual(["ריטריט בגליל"])
        expect(router.state.location.search).toBe("?f=retreat")
    })

    it("doesn't restore stored filters when the URL has other params", async () => {
        const storage = createMemoryStorage()
        storage.setItem("eventType", '["retreat"]')
        const { router } = renderApp({
            fake: seeded(),
            now: NOW,
            storage,
            path: "/?utm_source=whatsapp",
        })

        expect(await eventTitles()).toHaveLength(3)
        expect(router.state.location.search).toBe("?utm_source=whatsapp")
        expect(storage.getItem("eventType")).toBe('["retreat"]')
    })

    it("returns from a shared event link to its filtered calendar", async () => {
        const { router } = renderApp({
            fake: seeded(),
            now: NOW,
            path: "/event/Cl1?f=jam",
        })
        expect(await screen.findByRole("dialog")).toBeVisible()

        await userEvent.keyboard("{Escape}")

        expect(router.state.location.pathname).toBe("/")
        expect(router.state.location.search).toBe("?f=jam")
        expect(await eventTitles()).toEqual(["שיעור וג'אם בירושלים"])
    })

    it("keeps the list filtered while an event is open", async () => {
        const { router } = renderApp({
            fake: seeded(),
            now: NOW,
            path: "/?f=jam",
        })
        await userEvent.click(
            await screen.findByRole("link", { name: "שיעור וג'אם בירושלים" }),
        )
        expect(await screen.findByRole("dialog")).toBeVisible()

        await userEvent.keyboard("{Escape}")

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        expect(router.state.location.search).toBe("?f=jam")
        expect(await eventTitles()).toEqual(["שיעור וג'אם בירושלים"])
    })
})

/** A day of the month calendar, e.g. `dayButton(5, "בנובמבר")`. */
const dayButton = (date: number, month: string) =>
    screen.getByRole("button", { name: new RegExp(` ${date} ${month}`) })

const showCalendar = async () => {
    await userEvent.click(
        await screen.findByRole("button", {
            name: "צפייה באירועים לפי לוח שנה",
        }),
    )
    return screen.findByRole("region", { name: "לוח שנה" })
}

const dayTitles = (label: RegExp) =>
    within(screen.getByRole("list", { name: label }))
        .getAllByRole("heading")
        .map((h) => h.textContent)

describe("calendar view", () => {
    it("opens on this month and today, marking days with events", async () => {
        const fake = seeded()
        renderApp({ fake, now: NOW })
        await eventTitles()
        const requests = fake.requests.length

        await showCalendar()

        expect(
            screen.getByRole("heading", { name: "אוקטובר" }),
        ).toBeInTheDocument()
        expect(dayButton(30, "באוקטובר")).toHaveAttribute(
            "aria-pressed",
            "true",
        )
        expect(dayButton(30, "באוקטובר")).toHaveAttribute(
            "aria-current",
            "date",
        )
        // Nothing today.
        expect(screen.getByText("אין אירועים ביום הזה")).toBeVisible()
        expect(fake.requests).toHaveLength(requests)
    })

    it("shows a picked day's events, multi-day events on every day they span", async () => {
        renderApp({ fake: seeded(), now: NOW })
        await showCalendar()
        await userEvent.click(screen.getByRole("button", { name: "החודש הבא" }))

        expect(
            screen.getByRole("heading", { name: "נובמבר" }),
        ).toBeInTheDocument()
        expect(dayButton(1, "בנובמבר")).toHaveAccessibleName(/אירוע אחד$/)
        expect(dayButton(6, "בנובמבר")).toHaveAccessibleName(/אירוע אחד$/)
        expect(dayButton(4, "בנובמבר")).toHaveAccessibleName(/בנובמבר$/)

        await userEvent.click(dayButton(6, "בנובמבר"))

        expect(dayButton(6, "בנובמבר")).toHaveAttribute("aria-pressed", "true")
        expect(dayTitles(/ 6 בנובמבר/)).toEqual(["ריטריט בגליל"])

        await userEvent.click(dayButton(2, "בנובמבר"))
        expect(dayTitles(/ 2 בנובמבר/)).toEqual(["שיעור וג'אם בירושלים"])
    })

    it("lists every event of a busy day in time order", async () => {
        const fake = createFakeDataClient({
            ci_events: [
                retreatInGalilee,
                event({
                    title: "ג'אם ערב",
                    start_date: "2026-11-06",
                    segments: [
                        segment({
                            startTime: "2026-11-06T18:00:00Z",
                            endTime: "2026-11-06T20:00:00Z",
                        }),
                    ],
                }),
            ],
        })
        renderApp({ fake, now: NOW })
        await showCalendar()
        await userEvent.click(screen.getByRole("button", { name: "החודש הבא" }))

        expect(dayButton(6, "בנובמבר")).toHaveAccessibleName(/2 אירועים$/)
        await userEvent.click(dayButton(6, "בנובמבר"))

        expect(dayTitles(/ 6 בנובמבר/)).toEqual(["ריטריט בגליל", "ג'אם ערב"])
    })

    it("moves between the window's months only", async () => {
        renderApp({ fake: seeded(), now: NOW })
        await showCalendar()
        const previous = screen.getByRole("button", { name: "החודש הקודם" })
        const next = screen.getByRole("button", { name: "החודש הבא" })

        expect(previous).toBeDisabled()
        await userEvent.click(next)
        await userEvent.click(next)
        await userEvent.click(next)

        // Today + 90 days is 2027-01-28.
        expect(screen.getByRole("heading", { name: "ינואר" })).toBeVisible()
        expect(next).toBeDisabled()
        await userEvent.click(previous)
        expect(screen.getByRole("heading", { name: "דצמבר" })).toBeVisible()
    })

    it("marks and lists only the filtered events", async () => {
        const fake = seeded()
        renderApp({ fake, now: NOW, path: "/?f=class" })
        await eventTitles()
        const requests = fake.requests.length
        await showCalendar()
        await userEvent.click(screen.getByRole("button", { name: "החודש הבא" }))

        expect(dayButton(1, "בנובמבר")).toHaveAccessibleName(/אירוע אחד$/)
        expect(dayButton(6, "בנובמבר")).toHaveAccessibleName(/בנובמבר$/)

        // Filtering while in the calendar updates it in place.
        await toggleFilter(await openFilters(), "שיעור")
        await userEvent.keyboard("{Escape}")
        expect(dayButton(6, "בנובמבר")).toHaveAccessibleName(/אירוע אחד$/)
        expect(fake.requests).toHaveLength(requests)
    })

    it("opens a day's event and returns to the same day", async () => {
        const { router } = renderApp({ fake: seeded(), now: NOW })
        await showCalendar()
        await userEvent.click(screen.getByRole("button", { name: "החודש הבא" }))
        await userEvent.click(dayButton(1, "בנובמבר"))

        await userEvent.click(screen.getByRole("link", { name: "שיעור במרכז" }))
        const dialog = await screen.findByRole("dialog")
        expect(
            await within(dialog).findByRole("heading", {
                name: "שיעור במרכז",
            }),
        ).toBeVisible()
        expect(router.state.location.pathname).toMatch(/^\/event\//)

        await userEvent.keyboard("{Escape}")

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        expect(dayButton(1, "בנובמבר")).toHaveAttribute("aria-pressed", "true")
        expect(dayTitles(/ 1 בנובמבר/)).toEqual(["שיעור במרכז"])
    })

    it("goes back to the full list", async () => {
        renderApp({ fake: seeded(), now: NOW })
        await showCalendar()

        await userEvent.click(
            screen.getByRole("button", { name: "צפייה ברשימת אירועים" }),
        )

        expect(screen.queryByRole("region", { name: "לוח שנה" })).toBe(null)
        expect(await eventTitles()).toHaveLength(3)
    })
})
