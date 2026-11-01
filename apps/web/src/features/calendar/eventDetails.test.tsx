import { describe, expect, it } from "vitest"
import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { renderApp } from "../../test/renderApp"
import { eventCard, eventTitles } from "../../test/testEvents"
import {
    bio,
    event,
    segment,
    tagging,
} from "@ci-calendar/core/testing/testEvents"

// "Today" in these tests is Friday 2026-10-30 in Asia/Jerusalem.
const NOW = new Date("2026-10-30T09:00:00Z")

const noa = bio({
    bio_name: "נועה כהן",
    about: "רוקדת קונטקט מאז 2010",
    img: "https://example.com/noa.jpg",
    page_url: "https://noa.example.com",
    page_title: "האתר של נועה",
})

const jam = event({
    id: "6f1d2a3b-0c4d-4e5f-8a9b-0c1d2e3f4a5b",
    short_id: "Ab1",
    title: "שיעור וג'אם",
    start_date: "2026-11-07",
    end_date: "2026-11-07",
    address: { label: "יער המאכל", place_id: "P1" },
    segments: [
        segment({
            type: "class",
            startTime: "2026-11-07T17:00:00Z",
            endTime: "2026-11-07T18:30:00Z",
            teachers: [{ label: "נועה", value: noa.user_id }],
            tags: ["beginner"],
        }),
        segment({
            type: "jam",
            startTime: "2026-11-07T18:30:00Z",
            endTime: "2026-11-07T21:00:00Z",
        }),
    ],
    links: [{ title: "להרשמה", link: "https://example.com/register" }],
    price: [
        { title: "רק שיעור", sum: 30 },
        { title: "שיעור וג'אם", sum: 80 },
    ],
    description: "מביאים בגדים נוחים",
})

/** Seeds `rows` with the bio `noa`, tagged on `jam`. */
function backend(rows = [jam], bios = [noa]) {
    return createFakeDataClient({
        ci_events: rows,
        public_bio: bios,
        ci_events_users_junction: bios.map((teacher) => tagging(jam, teacher)),
    })
}

const details = () => screen.findByRole("dialog", { name: "שיעור וג'אם" })

/** Requests for one event by its link (not the calendar window). */
const linkRequests = (fake: ReturnType<typeof backend>) =>
    fake.requests.filter((request) =>
        request.filters.some(
            (filter) => filter.column === "short_id" || filter.column === "id",
        ),
    )

describe("event details", () => {
    it("opens from the list with segments, prices, links and the address", async () => {
        const fake = backend()
        renderApp({ fake, now: NOW })

        await userEvent.click(
            within(await eventCard("שיעור וג'אם")).getByRole("link"),
        )

        const dialog = await details()
        expect(dialog).toHaveTextContent("שבת, 7 בנובמבר")
        expect(dialog).toHaveTextContent("19:00 - 23:00")
        expect(dialog).toHaveTextContent("יער המאכל")
        expect(dialog).toHaveTextContent("19:00 - 20:30 שיעור עם נועה כהן")
        expect(within(dialog).getByText("מתחילים")).toBeVisible()
        expect(dialog).toHaveTextContent("20:30 - 23:00 ג'אם")
        expect(dialog).toHaveTextContent("רק שיעור: 30₪, שיעור וג'אם: 80₪")
        expect(dialog).toHaveTextContent("מביאים בגדים נוחים")
        expect(
            within(dialog).getByRole("link", { name: "להרשמה" }),
        ).toHaveAttribute("href", "https://example.com/register")
        expect(
            within(dialog).getByRole("link", { name: "הוספה ליומן גוגל" }),
        ).toHaveAttribute(
            "href",
            expect.stringContaining("dates=20261107T190000%2F20261107T230000"),
        )
        // The event came from the calendar window: no request of its own.
        expect(fake.requests).toHaveLength(1)
    })

    it("keeps the URL in step: /event/<short id> while open, / once closed", async () => {
        const { router } = renderApp({ fake: backend(), now: NOW })

        await userEvent.click(
            within(await eventCard("שיעור וג'אם")).getByRole("link"),
        )
        await details()
        expect(router.state.location.pathname).toBe("/event/Ab1")

        await userEvent.click(screen.getByRole("button", { name: "סגירה" }))

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        expect(router.state.location.pathname).toBe("/")
        expect(await eventTitles()).toEqual(["שיעור וג'אם"])
    })

    it("shows a tagged teacher's public bio", async () => {
        renderApp({ fake: backend(), path: "/event/Ab1", now: NOW })

        await userEvent.click(
            within(await details()).getByRole("button", { name: "נועה כהן" }),
        )

        const bioCard = await screen.findByRole("dialog", { name: "נועה כהן" })
        expect(bioCard).toHaveTextContent("אודות נועה כהן")
        expect(bioCard).toHaveTextContent("רוקדת קונטקט מאז 2010")
        expect(within(bioCard).getByRole("img")).toHaveAttribute(
            "src",
            "https://example.com/noa.jpg",
        )
        expect(
            within(bioCard).getByRole("link", { name: "האתר של נועה" }),
        ).toHaveAttribute("href", "https://noa.example.com")

        await userEvent.click(
            within(bioCard).getByRole("button", { name: "סגירה" }),
        )
        await waitFor(() =>
            expect(
                screen.queryByRole("dialog", { name: "נועה כהן" }),
            ).toBeNull(),
        )
        // Closing the bio leaves the event open.
        expect(await details()).toBeVisible()
    })

    it("never shows a bio its teacher keeps private", async () => {
        const hidden = { ...noa, show_profile: false }
        renderApp({
            fake: backend([jam], [hidden]),
            path: "/event/Ab1",
            now: NOW,
        })

        const dialog = await details()
        // The tag's own label stands in for the private bio.
        expect(dialog).toHaveTextContent("19:00 - 20:30 שיעור עם נועה")
        expect(
            within(dialog).queryByRole("button", { name: /נועה/ }),
        ).toBeNull()
        expect(dialog).not.toHaveTextContent("נועה כהן")
        expect(screen.queryByText(/רוקדת קונטקט/)).toBeNull()
    })

    it("leaves admins' bios out, as the legacy app did", async () => {
        const admin = { ...noa, user_type: "admin" }
        renderApp({
            fake: backend([jam], [admin]),
            path: "/event/Ab1",
            now: NOW,
        })

        const dialog = await details()
        expect(dialog).not.toHaveTextContent("נועה כהן")
        expect(
            within(dialog).queryByRole("button", { name: /נועה/ }),
        ).toBeNull()
    })

    it("copies the event's link", async () => {
        const user = userEvent.setup()
        renderApp({ fake: backend(), path: "/event/Ab1", now: NOW })

        await user.click(
            within(await details()).getByRole("button", { name: "קישור" }),
        )

        expect(
            await within(await details()).findByRole("button", {
                name: "הועתק",
            }),
        ).toBeVisible()
        expect(await navigator.clipboard.readText()).toBe(
            `${window.location.origin}/event/Ab1`,
        )
    })
})

describe("closing the details", () => {
    async function openFromList() {
        const view = renderApp({ fake: backend(), now: NOW })
        const link = within(await eventCard("שיעור וג'אם")).getByRole("link")
        await userEvent.click(link)
        return { ...view, link, dialog: await details() }
    }

    it("goes back in history, so Back doesn't reopen the event", async () => {
        const { router } = await openFromList()

        await userEvent.click(screen.getByRole("button", { name: "סגירה" }))
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        await act(() => router.navigate(-1))

        expect(router.state.location.pathname).toBe("/")
        expect(screen.queryByRole("dialog")).toBeNull()
    })

    it("closes on the browser's Back and returns focus to the event", async () => {
        const { router, link } = await openFromList()

        await act(() => router.navigate(-1))

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        expect(router.state.location.pathname).toBe("/")
        expect(link).toHaveFocus()
    })

    it("closes on Escape", async () => {
        const { router, link } = await openFromList()

        await userEvent.keyboard("{Escape}")

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        expect(router.state.location.pathname).toBe("/")
        expect(link).toHaveFocus()
    })

    it("closes on a click on the backdrop, not inside the box", async () => {
        const { dialog } = await openFromList()

        // Empty space in the body, e.g. below short content on a phone.
        await userEvent.click(dialog.firstElementChild!)
        expect(dialog).toBeVisible()

        // The dialog element itself is only exposed around the box.
        await userEvent.click(dialog)
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    })

    it("closes a teacher's bio without closing the event", async () => {
        renderApp({ fake: backend(), path: "/event/Ab1", now: NOW })
        const bioButton = within(await details()).getByRole("button", {
            name: "נועה כהן",
        })

        await userEvent.click(bioButton)
        await screen.findByRole("dialog", { name: "נועה כהן" })
        await userEvent.keyboard("{Escape}")
        await waitFor(() =>
            expect(
                screen.queryByRole("dialog", { name: "נועה כהן" }),
            ).toBeNull(),
        )
        expect(bioButton).toHaveFocus()

        await userEvent.click(bioButton)
        await userEvent.click(
            await screen.findByRole("dialog", { name: "נועה כהן" }),
        )
        await waitFor(() =>
            expect(
                screen.queryByRole("dialog", { name: "נועה כהן" }),
            ).toBeNull(),
        )

        expect(await details()).toBeVisible()
    })
})

describe("shared event links", () => {
    it("opens an event in the cached window without another request", async () => {
        // A first visit leaves the calendar on the device.
        const storage = createMemoryStorage()
        const first = renderApp({ fake: backend(), now: NOW, storage })
        await eventTitles()
        first.unmount()

        const { fake } = renderApp({
            fake: backend(),
            path: "/Ab1",
            now: NOW,
            storage,
        })

        expect(await details()).toBeVisible()
        expect(await eventTitles()).toEqual(["שיעור וג'אם"])
        expect(linkRequests(fake)).toEqual([])
    })

    it("fetches an event outside the window by its short id, alongside the window", async () => {
        const past = {
            ...jam,
            start_date: "2026-10-01",
            end_date: "2026-10-01",
        }
        const fake = backend([past])
        fake.holdTable("ci_events")

        renderApp({ fake, path: "/Ab1", now: NOW })

        // Both requests are out before either answers, and the event's
        // dialog is already open, saying it is loading.
        await waitFor(() => expect(fake.requests).toHaveLength(2))
        const dialog = await screen.findByRole("dialog", {
            name: "פרטי האירוע",
        })
        expect(within(dialog).getByRole("status")).toHaveTextContent(
            "טוען את האירוע…",
        )
        fake.releaseTable("ci_events")

        expect(await details()).toBeVisible()
        expect(linkRequests(fake)).toEqual([
            expect.objectContaining({
                returns: "maybeSingle",
                filters: expect.arrayContaining([
                    { op: "eq", column: "short_id", value: "Ab1" },
                    { op: "eq", column: "hide", value: false },
                ]),
            }),
        ])
    })

    it("fetches by id for /event/<id> links", async () => {
        const later = {
            ...jam,
            start_date: "2027-03-01",
            end_date: "2027-03-01",
        }
        const fake = backend([later])

        renderApp({ fake, path: `/event/${jam.id}`, now: NOW })

        expect(await details()).toBeVisible()
        expect(linkRequests(fake)).toEqual([
            expect.objectContaining({
                filters: expect.arrayContaining([
                    { op: "eq", column: "id", value: jam.id },
                ]),
            }),
        ])
    })

    it("closes a shared event onto the calendar", async () => {
        const { router } = renderApp({
            fake: backend(),
            path: "/Ab1",
            now: NOW,
        })

        await userEvent.click(
            within(await details()).getByRole("button", { name: "סגירה" }),
        )

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        expect(router.state.location.pathname).toBe("/")
        expect(await eventTitles()).toEqual(["שיעור וג'אם"])
    })

    it("scrolls a shared event's card into view behind it, as legacy did; never one opened from the list", async () => {
        // jsdom has no layout, so record what would be scrolled to.
        const scrolled: string[] = []
        Element.prototype.scrollIntoView = function (this: Element) {
            scrolled.push(this.querySelector("h2")?.textContent ?? "")
        }
        try {
            const earlier = event({
                id: "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
                short_id: "Zz9",
                title: "ג'אם בוקר",
                start_date: "2026-11-01",
                end_date: "2026-11-01",
            })
            const { unmount } = renderApp({
                fake: backend([earlier, jam]),
                path: "/Ab1",
                now: NOW,
            })
            await details()
            await waitFor(() => expect(scrolled).toEqual(["שיעור וג'אם"]))
            unmount()

            scrolled.length = 0
            renderApp({ fake: backend([earlier, jam]), now: NOW })
            await userEvent.click(
                within(await eventCard("שיעור וג'אם")).getByRole("link"),
            )
            await details()
            expect(scrolled).toEqual([])
        } finally {
            delete (Element.prototype as Partial<Element>).scrollIntoView
        }
    })

    it("says so in the dialog when the event fails to load, and retries", async () => {
        const fake = backend()
        fake.failTable("ci_events", "network down")

        renderApp({ fake, path: "/Ab1", now: NOW })

        const dialog = await screen.findByRole("dialog", {
            name: "פרטי האירוע",
        })
        expect(await within(dialog).findByRole("alert")).toHaveTextContent(
            "לא הצלחנו לטעון את האירוע",
        )
        fake.healTable("ci_events")
        await userEvent.click(
            within(dialog).getByRole("button", { name: "נסו שוב" }),
        )

        expect(await details()).toBeVisible()
    })

    it("waits for a connection when opened offline", async () => {
        Object.defineProperty(navigator, "onLine", {
            configurable: true,
            value: false,
        })

        renderApp({ fake: backend(), path: "/Ab1", now: NOW })

        const dialog = await screen.findByRole("dialog", {
            name: "פרטי האירוע",
        })
        expect(within(dialog).getByRole("status")).toHaveTextContent(
            "אין חיבור לאינטרנט – האירוע ייטען כשהחיבור יחזור",
        )
        expect(screen.queryByText("הדף לא נמצא")).toBeNull()
    })

    it("renders the 404 page for a short id that names no event", async () => {
        renderApp({ fake: backend(), path: "/Zz9", now: NOW })

        expect(
            await screen.findByRole("heading", { name: "הדף לא נמצא" }),
        ).toBeVisible()
    })

    it.each(["/signin", "/abuot", "/event/no-such-event"])(
        "renders the 404 page for %s at once, asking the backend nothing about it",
        async (path) => {
            const fake = backend()
            renderApp({ fake, path, now: NOW })

            expect(
                await screen.findByRole("heading", { name: "הדף לא נמצא" }),
            ).toBeVisible()
            expect(linkRequests(fake)).toEqual([])
        },
    )

    it("renders the 404 page for a link that can't name an event, even offline", async () => {
        Object.defineProperty(navigator, "onLine", {
            configurable: true,
            value: false,
        })
        renderApp({ fake: backend(), path: "/register", now: NOW })

        expect(
            await screen.findByRole("heading", { name: "הדף לא נמצא" }),
        ).toBeVisible()
    })

    it("never shows a hidden event, even by its link", async () => {
        const hidden = { ...jam, hide: true }
        renderApp({ fake: backend([hidden]), path: "/event/Ab1", now: NOW })

        expect(
            await screen.findByRole("heading", { name: "הדף לא נמצא" }),
        ).toBeVisible()
        expect(screen.queryByText("שיעור וג'אם")).toBeNull()
    })
})
