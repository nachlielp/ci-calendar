import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { createMemoryStorage } from "../../app/deviceStorage"
import { setPageVisibility } from "../../test/browser"
import type { SignedInRole } from "../../app/viewer"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { renderApp } from "../../test/renderApp"
import { testUser } from "../../test/testUsers"
import { event, eventTitles } from "../../test/testEvents"
import { MANAGED_EVENT_COLUMNS } from "../events/managedEvent"
import { PAST_PAGE_SIZE } from "./myEvents"

const NOW = new Date("2026-10-30T09:00:00Z")
const TODAY = "2026-10-30"

type Fake = ReturnType<typeof createFakeDataClient>

/** A creator with their events and someone else's seeded. */
function setup(
    rows: (userId: string) => Record<string, unknown>[] = () => [],
    role: SignedInRole = "creator",
) {
    const user = testUser(role)
    const fake = createFakeDataClient()
    fake.rows("ci_events").push(
        event({ title: "של מישהו אחר", user_id: "someone-else" }),
        ...rows(user.id),
    )
    return { user, fake }
}

const COLUMNS = MANAGED_EVENT_COLUMNS.replace(/\s+/g, "")

/** Reads of the user's events (upcoming or past pages). */
const myEventReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" &&
            request.method === "select" &&
            request.select === COLUMNS,
    )

/** Reads of the public window (or any public event read). */
const publicReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" &&
            request.method === "select" &&
            request.select !== COLUMNS,
    )

const writes = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" && request.method !== "select",
    )

/** The rows' summary buttons (they open and close a row). */
async function summaries(name: "עתיד" | "עבר" = "עתיד") {
    const list = await screen.findByRole("list", { name })
    return within(list)
        .getAllByRole("button")
        .filter((button) => button.hasAttribute("aria-expanded"))
}

/** The list's rows, as their summary buttons read. */
async function rows(name: "עתיד" | "עבר" = "עתיד") {
    return (await summaries(name)).map((button) => button.textContent)
}

/** The titles of the list's rows. */
async function rowTitles(name: "עתיד" | "עבר" = "עתיד") {
    return (await summaries(name)).map(
        (button) => button.querySelector(".event-summary-title")?.textContent,
    )
}

async function openRow(title: string) {
    const row = (await summaries()).find((button) =>
        button.textContent?.startsWith(title),
    )!
    await userEvent.click(row)
    return within(row.closest("li")!)
}

async function goTo(router: { navigate: (path: string) => Promise<void> }) {
    await act(() => router.navigate("/"))
}

describe("manage my events (/manage-events)", () => {
    it("isn't fetched at a signed-in boot", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "שלי", user_id: userId }),
        ])
        renderApp({ fake, signedInAs: user, now: NOW })

        expect(await eventTitles()).toContain("שלי")
        await screen.findByRole("button", { name: "פתח תפריט" })
        expect(myEventReads(fake)).toHaveLength(0)
    })

    it("loads only the user's upcoming events, hidden ones too, when the page opens", async () => {
        const { user, fake } = setup((userId) => [
            event({
                title: "מחר",
                user_id: userId,
                start_date: "2026-10-31",
                end_date: "2026-10-31",
            }),
            event({
                title: "טיוטה",
                user_id: userId,
                start_date: "2026-11-02",
                end_date: "2026-11-04",
                hide: true,
            }),
            event({
                title: "היום",
                user_id: userId,
                start_date: TODAY,
                end_date: TODAY,
                cancelled: true,
            }),
            event({
                title: "אתמול",
                user_id: userId,
                start_date: "2026-10-29",
            }),
        ])
        renderApp({ fake, signedInAs: user, path: "/manage-events", now: NOW })

        expect(await rows()).toEqual([
            "היום30/10/2026|אירוע מבוטל‹",
            "מחר31/10/2026‹",
            "טיוטה02/11/2026 - 04/11/2026|אירוע מוסתר‹",
        ])
        const reads = myEventReads(fake)
        expect(reads).toHaveLength(1)
        expect(reads[0]).toMatchObject({
            filters: [
                { op: "eq", column: "user_id", value: user.id },
                { op: "gte", column: "start_date", value: TODAY },
            ],
            token: fake.auth.accessToken(),
        })
        expect(screen.queryByText("של מישהו אחר")).not.toBeInTheDocument()
    })

    it("shows hidden events in the list but never on the calendar", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "טיוטה", user_id: userId, hide: true }),
            event({ title: "פורסם", user_id: userId }),
        ])
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        expect(await rowTitles()).toEqual(
            expect.arrayContaining(["טיוטה", "פורסם"]),
        )

        await goTo(router)
        expect((await eventTitles()).sort()).toEqual(["פורסם", "של מישהו אחר"])
    })

    it("fetches past events only when asked, a page at a time", async () => {
        const total = PAST_PAGE_SIZE + 5
        const { user, fake } = setup((userId) =>
            Array.from({ length: total }, (_, i) =>
                event({
                    // Pairs of events share a day, so a page boundary falls
                    // between two events of the same day.
                    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
                    title: `עבר ${i}`,
                    user_id: userId,
                    start_date: `2026-09-${String(1 + Math.floor(i / 2)).padStart(2, "0")}`,
                    end_date: `2026-09-${String(1 + Math.floor(i / 2)).padStart(2, "0")}`,
                }),
            ),
        )
        renderApp({ fake, signedInAs: user, path: "/manage-events", now: NOW })
        await screen.findByText("נראה שעדיין אין לכם אירועים")
        expect(myEventReads(fake)).toHaveLength(1)

        await userEvent.click(screen.getByRole("button", { name: "עבר" }))
        await waitFor(async () =>
            expect(await rowTitles("עבר")).toHaveLength(PAST_PAGE_SIZE),
        )
        const [, firstPage] = myEventReads(fake)
        expect(firstPage).toMatchObject({
            filters: [
                { op: "eq", column: "user_id", value: user.id },
                { op: "lt", column: "start_date", value: TODAY },
            ],
            order: [
                { column: "start_date", ascending: false },
                { column: "id", ascending: false },
            ],
            limit: PAST_PAGE_SIZE + 1,
        })

        await userEvent.click(
            screen.getByRole("button", { name: "טעינת אירועים נוספים" }),
        )
        await waitFor(async () =>
            expect(await rowTitles("עבר")).toHaveLength(total),
        )
        const titles = await rowTitles("עבר")
        expect(titles).toEqual(
            Array.from({ length: total }, (_, i) => `עבר ${total - 1 - i}`),
        )
        expect(myEventReads(fake)[2].filters).toContainEqual({
            op: "or",
            column: "",
            value: 'start_date.lt."2026-09-03",and(start_date.eq."2026-09-03",id.lt."00000000-0000-4000-8000-000000000005")',
        })
        expect(
            screen.queryByRole("button", { name: "טעינת אירועים נוספים" }),
        ).not.toBeInTheDocument()
        // Past events have no actions, as in legacy.
        await userEvent.click(
            screen.getByRole("button", { name: /^עבר 3/, expanded: false }),
        )
        expect(
            screen.queryByRole("region", { name: "פעולות על האירוע" }),
        ).not.toBeInTheDocument()
    })

    it("hides an event: off the calendar and marked in the list, from the response", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "ג'אם שלי", user_id: userId }),
        ])
        const storage = createMemoryStorage()
        const { router } = renderApp({
            fake,
            storage,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        const row = await openRow("ג'אם שלי")
        await userEvent.click(row.getByRole("button", { name: "הסתרת ארוע" }))
        const dialog = await screen.findByRole("dialog", { name: "הסתרת ארוע" })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "הסתרה" }),
        )

        await waitFor(() =>
            expect(
                screen.queryByRole("dialog", { name: "הסתרת ארוע" }),
            ).not.toBeInTheDocument(),
        )
        expect(await rows()).toContain("ג'אם שלי01/11/2026|אירוע מוסתר‹")
        const [write] = writes(fake)
        expect(write).toMatchObject({
            method: "update",
            body: { hide: true },
            select: COLUMNS,
            token: fake.auth.accessToken(),
        })
        expect(write.filters).toEqual([
            { op: "in", column: "id", value: [expect.any(String)] },
            { op: "eq", column: "user_id", value: user.id },
            { op: "eq", column: "hide", value: false },
        ])

        const readsBefore = fake.requests.length
        await goTo(router)
        expect(await eventTitles()).toEqual(["של מישהו אחר"])
        expect(fake.requests).toHaveLength(readsBefore)
        // The persisted calendar no longer holds it either.
        expect(storage.getItem("ci-calendar:query-cache:v1")).not.toContain(
            "ג'אם שלי",
        )
        expect(myEventReads(fake)).toHaveLength(1)
        expect(publicReads(fake)).toHaveLength(1)
    })

    it("shows a hidden event again: on the calendar once more", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "טיוטה", user_id: userId, hide: true }),
        ])
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        const row = await openRow("טיוטה")
        await userEvent.click(row.getByRole("button", { name: "הצגת ארוע" }))
        const dialog = await screen.findByRole("dialog", { name: "הצגת ארוע" })
        expect(dialog).toHaveTextContent(
            "האם אתם בטוחים שאתם רוצים להציג את הארוע?",
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "הצגה" }),
        )

        await waitFor(async () =>
            expect(await rows()).toEqual(["טיוטה01/11/2026‹"]),
        )
        expect(writes(fake)[0].filters).toContainEqual({
            op: "eq",
            column: "hide",
            value: true,
        })
        await goTo(router)
        expect((await eventTitles()).sort()).toEqual(["טיוטה", "של מישהו אחר"])
        expect(publicReads(fake)).toHaveLength(1)
    })

    it("cancels an event with a note, and restores it", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "ג'אם שלי", user_id: userId, cancelled: null }),
        ])
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        const row = await openRow("ג'אם שלי")
        await userEvent.click(row.getByRole("button", { name: "ביטול אירוע" }))
        const dialog = await screen.findByRole("dialog", {
            name: "ביטול אירוע",
        })
        const note = within(dialog).getByRole("textbox", {
            name: "הסבר במידת הצורך - ביטול חד״פ/ לצמיתות וכו׳",
        })
        expect(note).toHaveAttribute("maxLength", "80")
        await userEvent.type(note, "חולה")
        expect(dialog).toHaveTextContent("4/80")
        await userEvent.click(
            within(dialog).getByRole("button", { name: "ביטול אירוע" }),
        )

        await waitFor(async () =>
            expect(await rows()).toEqual(["ג'אם שלי01/11/2026|אירוע מבוטל‹"]),
        )
        expect(writes(fake)[0]).toMatchObject({
            body: { cancelled: true, cancelled_text: "חולה" },
            filters: [
                { op: "eq", column: "id", value: expect.any(String) },
                { op: "eq", column: "user_id", value: user.id },
                { op: "not.is", column: "cancelled", value: true },
            ],
        })
        // The open row shows it cancelled, and offers to restore it.
        expect(row.getByText("האירוע בוטל – חולה")).toBeVisible()
        await userEvent.click(row.getByRole("button", { name: "הפעלת אירוע" }))
        const restore = await screen.findByRole("dialog", {
            name: "הפעלת אירוע",
        })
        expect(within(restore).queryByRole("textbox")).not.toBeInTheDocument()
        await userEvent.click(
            within(restore).getByRole("button", { name: "הפעלה" }),
        )
        await waitFor(async () =>
            expect(await rows()).toEqual(["ג'אם שלי01/11/2026‹"]),
        )
        expect(writes(fake)[1]).toMatchObject({
            body: { cancelled: false, cancelled_text: "" },
        })
        expect(writes(fake)[1].filters).toContainEqual({
            op: "eq",
            column: "cancelled",
            value: true,
        })

        await goTo(router)
        expect(await eventTitles()).toContain("ג'אם שלי")
        expect(screen.queryByText("האירוע בוטל")).not.toBeInTheDocument()
        expect(myEventReads(fake)).toHaveLength(1)
        expect(publicReads(fake)).toHaveLength(1)
    })

    it("marks a cancelled event on the calendar at once", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "ג'אם שלי", user_id: userId }),
        ])
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        const row = await openRow("ג'אם שלי")
        await userEvent.click(row.getByRole("button", { name: "ביטול אירוע" }))
        const dialog = await screen.findByRole("dialog", {
            name: "ביטול אירוע",
        })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "ביטול אירוע" }),
        )
        await waitFor(() =>
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        )

        await goTo(router)
        const card = (await screen.findByRole("list", {
            name: "אירועים קרובים",
        })) as HTMLElement
        expect(within(card).getByText("האירוע בוטל")).toBeVisible()
        expect(publicReads(fake)).toHaveLength(1)
    })

    it("deletes an event after confirming: gone from the list and the calendar", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "ג'אם שלי", user_id: userId }),
            event({ title: "עוד אחד", user_id: userId }),
        ])
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        const row = await openRow("ג'אם שלי")
        await userEvent.click(row.getByRole("button", { name: "מחיקת ארוע" }))
        const dialog = await screen.findByRole("dialog", { name: "מחיקת ארוע" })
        expect(dialog).toHaveTextContent("01/11/2026 - ג'אם שלי")
        expect(within(dialog).queryByRole("group")).not.toBeInTheDocument()
        await userEvent.click(
            within(dialog).getByRole("button", { name: "מחיקה" }),
        )

        await waitFor(async () =>
            expect(await rowTitles()).toEqual(["עוד אחד"]),
        )
        expect(writes(fake)[0]).toMatchObject({
            method: "delete",
            select: "id",
            filters: [
                { op: "in", column: "id", value: [expect.any(String)] },
                { op: "eq", column: "user_id", value: user.id },
            ],
        })
        expect(fake.rows("ci_events").map((row) => row.title)).not.toContain(
            "ג'אם שלי",
        )

        await goTo(router)
        expect((await eventTitles()).sort()).toEqual([
            "עוד אחד",
            "של מישהו אחר",
        ])
        expect(myEventReads(fake)).toHaveLength(1)
        expect(publicReads(fake)).toHaveLength(1)
    })

    it("keeps the dialog open and says so when a write fails", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "ג'אם שלי", user_id: userId }),
        ])
        renderApp({ fake, signedInAs: user, path: "/manage-events", now: NOW })
        const row = await openRow("ג'אם שלי")
        fake.failTable("ci_events", "boom")
        await userEvent.click(row.getByRole("button", { name: "מחיקת ארוע" }))
        const dialog = await screen.findByRole("dialog", { name: "מחיקת ארוע" })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "מחיקה" }),
        )

        expect(await within(dialog).findByRole("alert")).toHaveTextContent(
            "הפעולה נכשלה, נסו שוב",
        )
        expect(await rowTitles()).toEqual(["ג'אם שלי"])
    })

    it("refetches the list when an event was changed elsewhere meanwhile", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "ג'אם שלי", user_id: userId }),
        ])
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        const row = await openRow("ג'אם שלי")
        // Another tab hid it first: this write matches no row.
        fake.rows("ci_events").find((r) => r.title === "ג'אם שלי")!.hide = true
        await userEvent.click(row.getByRole("button", { name: "הסתרת ארוע" }))
        const dialog = await screen.findByRole("dialog", { name: "הסתרת ארוע" })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "הסתרה" }),
        )

        // Never a silent success: the dialog says nothing was done.
        expect(await within(dialog).findByRole("alert")).toHaveTextContent(
            "הפעולה לא בוצעה על כל האירועים",
        )
        await waitFor(() => expect(myEventReads(fake)).toHaveLength(2))
        expect(await rows()).toEqual(["ג'אם שלי01/11/2026|אירוע מוסתר‹"])
        // The calendar, which still showed it, is refreshed too.
        await goTo(router)
        await waitFor(() => expect(publicReads(fake)).toHaveLength(2))
        expect(await eventTitles()).toEqual(["של מישהו אחר"])
    })

    describe("recurring events", () => {
        const KEY = "weekly-jam"
        const weekly = (userId: string, hide = false) =>
            ["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22"].map(
                (day) =>
                    event({
                        title: `שבועי ${day.slice(8)}`,
                        user_id: userId,
                        start_date: day,
                        end_date: day,
                        recurring_ref_key: KEY,
                        hide,
                    }),
            )

        it("deletes this one and the later ones chosen, nothing else", async () => {
            const { user, fake } = setup((userId) => weekly(userId))
            renderApp({
                fake,
                signedInAs: user,
                path: "/manage-events",
                now: NOW,
            })
            const row = await openRow("שבועי 08")
            await userEvent.click(
                row.getByRole("button", { name: "מחיקת ארוע" }),
            )
            const dialog = await screen.findByRole("dialog", {
                name: "מחיקת ארוע",
            })
            const series = within(dialog).getByRole("group", {
                name: "ארועים עתידיים באותה סדרה:",
            })
            // Only the later ones are offered.
            expect(
                within(series)
                    .getAllByRole("checkbox")
                    .map((box) => box.parentElement?.textContent),
            ).toEqual(["הכל", "15/11/2026 - שבועי 15", "22/11/2026 - שבועי 22"])
            await userEvent.click(
                within(series).getByRole("checkbox", {
                    name: "22/11/2026 - שבועי 22",
                }),
            )
            await userEvent.click(
                within(dialog).getByRole("button", { name: "מחיקה" }),
            )

            await waitFor(async () =>
                expect(await rowTitles()).toEqual(["שבועי 01", "שבועי 15"]),
            )
            expect(writes(fake)).toHaveLength(1)
            expect(writes(fake)[0].filters[0].value).toHaveLength(2)
            expect(
                fake
                    .rows("ci_events")
                    .map((row) => row.title)
                    .filter((title) => String(title).startsWith("שבועי")),
            ).toEqual(["שבועי 01", "שבועי 15"])
        })

        it('hides all the later ones with "all"', async () => {
            const { user, fake } = setup((userId) => weekly(userId))
            const { router } = renderApp({
                fake,
                signedInAs: user,
                path: "/manage-events",
                now: NOW,
            })
            const row = await openRow("שבועי 08")
            await userEvent.click(
                row.getByRole("button", { name: "הסתרת ארוע" }),
            )
            const dialog = await screen.findByRole("dialog", {
                name: "הסתרת ארוע",
            })
            await userEvent.click(
                within(dialog).getByRole("checkbox", { name: "הכל" }),
            )
            expect(
                within(dialog)
                    .getAllByRole("checkbox")
                    .every((box) => (box as HTMLInputElement).checked),
            ).toBe(true)
            await userEvent.click(
                within(dialog).getByRole("button", { name: "הסתרה" }),
            )

            await waitFor(async () =>
                expect(await rows()).toEqual([
                    "שבועי 0101/11/2026‹",
                    "שבועי 0808/11/2026|אירוע מוסתר‹",
                    "שבועי 1515/11/2026|אירוע מוסתר‹",
                    "שבועי 2222/11/2026|אירוע מוסתר‹",
                ]),
            )
            expect(writes(fake)).toHaveLength(1)
            await goTo(router)
            expect((await eventTitles()).sort()).toEqual([
                "שבועי 01",
                "של מישהו אחר",
            ])
        })

        it("offers only the later ones in the same state to show", async () => {
            const { user, fake } = setup((userId) => [
                ...weekly(userId, true).slice(0, 3),
                ...weekly(userId).slice(3),
            ])
            renderApp({
                fake,
                signedInAs: user,
                path: "/manage-events",
                now: NOW,
            })
            const row = await openRow("שבועי 01")
            await userEvent.click(
                row.getByRole("button", { name: "הצגת ארוע" }),
            )
            const dialog = await screen.findByRole("dialog", {
                name: "הצגת ארוע",
            })
            expect(
                within(dialog)
                    .getAllByRole("checkbox")
                    .map((box) => box.parentElement?.textContent),
            ).toEqual(["הכל", "08/11/2026 - שבועי 08", "15/11/2026 - שבועי 15"])
        })
    })

    it("links to the edit form of the event's kind", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "סדנה", user_id: userId, is_multi_day: true }),
            event({ title: "ג'אם", user_id: userId }),
        ])
        renderApp({ fake, signedInAs: user, path: "/manage-events", now: NOW })
        const workshop = await openRow("סדנה")
        const [workshopId, jamId] = fake
            .rows("ci_events")
            .slice(1)
            .map((row) => row.id)
        expect(
            workshop.getByRole("link", { name: "עריכת אירוע" }),
        ).toHaveAttribute("href", `/manage-events/edit-multi-day/${workshopId}`)
        const jam = await openRow("ג'אם")
        expect(jam.getByRole("link", { name: "עריכת אירוע" })).toHaveAttribute(
            "href",
            `/manage-events/edit-single-day/${jamId}`,
        )
    })

    it("is fetched again each time the page opens", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "ג'אם שלי", user_id: userId }),
        ])
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        await openRow("ג'אם שלי")
        await goTo(router)
        await eventTitles()
        await act(() => router.navigate("/manage-events"))
        await waitFor(() => expect(myEventReads(fake)).toHaveLength(2))
    })

    it("speaks the chosen language", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "ג'אם שלי", user_id: userId, hide: true }),
        ])
        const storage = createMemoryStorage()
        storage.setItem("language", "en")
        renderApp({
            fake,
            storage,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        expect(
            await screen.findByRole("button", { name: "Create Event" }),
        ).toBeVisible()
        const list = await screen.findByRole("list", { name: "Future" })
        expect(list).toHaveTextContent("ג'אם שלי01/11/2026|Hidden event")
        expect(screen.getByRole("button", { name: "Past" })).toBeVisible()
    })

    it("lets only creators, orgs and admins in", async () => {
        for (const role of ["creator", "org", "admin"] as const) {
            const { user, fake } = setup(() => [], role)
            const view = renderApp({
                fake,
                signedInAs: user,
                path: "/manage-events",
                now: NOW,
            })
            expect(
                await screen.findByText("נראה שעדיין אין לכם אירועים"),
            ).toBeVisible()
            view.unmount()
        }

        const { user, fake } = setup(() => [], "profile")
        const signedIn = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        await waitFor(() =>
            expect(signedIn.router.state.location.pathname).toBe("/"),
        )
        signedIn.unmount()

        const anonymous = createFakeDataClient()
        const { router } = renderApp({
            fake: anonymous,
            path: "/manage-events",
            now: NOW,
        })
        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/login"),
        )
        expect(myEventReads(anonymous)).toHaveLength(0)
    })

    it("moves focus to the page's heading when the deleted row goes", async () => {
        const { user, fake } = setup((userId) => [
            event({ title: "ג'אם שלי", user_id: userId }),
        ])
        renderApp({ fake, signedInAs: user, path: "/manage-events", now: NOW })
        const row = await openRow("ג'אם שלי")
        await userEvent.click(row.getByRole("button", { name: "מחיקת ארוע" }))
        await userEvent.click(
            within(
                await screen.findByRole("dialog", { name: "מחיקת ארוע" }),
            ).getByRole("button", { name: "מחיקה" }),
        )

        await waitFor(() =>
            expect(
                screen.getByRole("heading", { name: "האירועים שלי" }),
            ).toHaveFocus(),
        )
    })

    describe("a refetch in flight during a write", () => {
        it("can't bring a deleted event back to the list", async () => {
            const { user, fake } = setup((userId) => [
                event({ title: "ג'אם שלי", user_id: userId }),
                event({ title: "עוד אחד", user_id: userId }),
            ])
            const { router } = renderApp({
                fake,
                signedInAs: user,
                path: "/manage-events",
                now: NOW,
            })
            await rowTitles()
            // The page opens again: its refetch is answered from before the
            // delete, and that answer arrives after it.
            const deliver = fake.answerLate(
                (request) => request.select === COLUMNS,
            )
            await goTo(router)
            await act(() => router.navigate("/manage-events"))
            await waitFor(() => expect(myEventReads(fake)).toHaveLength(2))
            const row = await openRow("ג'אם שלי")
            await userEvent.click(
                row.getByRole("button", { name: "מחיקת ארוע" }),
            )
            await userEvent.click(
                within(
                    await screen.findByRole("dialog", { name: "מחיקת ארוע" }),
                ).getByRole("button", { name: "מחיקה" }),
            )
            await waitFor(async () =>
                expect(await rowTitles()).toEqual(["עוד אחד"]),
            )

            await act(async () => deliver())
            await waitFor(() => expect(myEventReads(fake)).toHaveLength(3))
            expect(await rowTitles()).toEqual(["עוד אחד"])
        })

        it("can't bring a hidden event back to the calendar, or its storage", async () => {
            const { user, fake } = setup((userId) => [
                event({ title: "ג'אם שלי", user_id: userId }),
            ])
            const storage = createMemoryStorage()
            const first = renderApp({
                fake,
                storage,
                signedInAs: user,
                now: NOW,
            })
            expect(await eventTitles()).toContain("ג'אם שלי")
            first.unmount()

            // The next visit restores the window and revalidates it; that
            // answer, from before the hide, arrives after it.
            const deliver = fake.answerLate(
                (request) =>
                    request.table === "ci_events" && request.select !== COLUMNS,
            )
            const { router } = renderApp({
                fake,
                storage,
                signedInAs: user,
                path: "/manage-events",
                now: NOW,
            })
            const row = await openRow("ג'אם שלי")
            await userEvent.click(
                row.getByRole("button", { name: "הסתרת ארוע" }),
            )
            await userEvent.click(
                within(
                    await screen.findByRole("dialog", { name: "הסתרת ארוע" }),
                ).getByRole("button", { name: "הסתרה" }),
            )
            await waitFor(() =>
                expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
            )

            await act(async () => deliver())
            await waitFor(() => expect(publicReads(fake)).toHaveLength(3))
            await goTo(router)
            expect(await eventTitles()).toEqual(["של מישהו אחר"])
            expect(storage.getItem("ci-calendar:query-cache:v1")).not.toContain(
                "ג'אם שלי",
            )
        })
    })

    it("keeps loaded past pages without refetching them, until the page closes", async () => {
        vi.useFakeTimers({ toFake: ["Date"] })
        const { user, fake } = setup((userId) =>
            Array.from({ length: PAST_PAGE_SIZE + 5 }, (_, i) =>
                event({
                    title: `עבר ${i}`,
                    user_id: userId,
                    start_date: `2026-09-${String(1 + i).padStart(2, "0")}`,
                    end_date: `2026-09-${String(1 + i).padStart(2, "0")}`,
                }),
            ),
        )
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: NOW,
        })
        await screen.findByText("נראה שעדיין אין לכם אירועים")
        await userEvent.click(screen.getByRole("button", { name: "עבר" }))
        await userEvent.click(
            await screen.findByRole("button", { name: "טעינת אירועים נוספים" }),
        )
        await waitFor(async () =>
            expect(await rowTitles("עבר")).toHaveLength(PAST_PAGE_SIZE + 5),
        )
        const pastReads = () =>
            myEventReads(fake).filter((request) =>
                request.filters.some((filter) => filter.op === "lt"),
            )
        expect(pastReads()).toHaveLength(2)

        // Back after the stale time: the upcoming list refetches, the past
        // pages don't; nor does switching tabs.
        vi.setSystemTime(Date.now() + 10 * 60 * 1000)
        setPageVisibility("hidden")
        setPageVisibility("visible")
        await userEvent.click(screen.getByRole("button", { name: "עתיד" }))
        await userEvent.click(screen.getByRole("button", { name: "עבר" }))
        await waitFor(() => expect(myEventReads(fake)).toHaveLength(4))
        expect(pastReads()).toHaveLength(2)

        // Closed and opened again: the past starts over from its first page.
        await goTo(router)
        await act(() => router.navigate("/manage-events"))
        await userEvent.click(
            await screen.findByRole("button", { name: "עבר" }),
        )
        await waitFor(() => expect(pastReads()).toHaveLength(3))
        expect(await rowTitles("עבר")).toHaveLength(PAST_PAGE_SIZE)
        expect(pastReads()[2].filters.some((f) => f.op === "or")).toBe(false)
        vi.useRealTimers()
    })

    it("drops events whose day has passed, without a request", async () => {
        const clock = new Date(NOW)
        const { user, fake } = setup((userId) => [
            event({
                title: "היום",
                user_id: userId,
                start_date: TODAY,
                end_date: TODAY,
            }),
            event({ title: "מחר", user_id: userId, start_date: "2026-10-31" }),
        ])
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/manage-events",
            now: clock,
        })
        expect(await rowTitles()).toEqual(["היום", "מחר"])
        const requests = fake.requests.length

        // Midnight passes while the app is in the background.
        setPageVisibility("hidden")
        clock.setTime(new Date("2026-10-31T09:00:00Z").getTime())
        setPageVisibility("visible")
        await waitFor(async () => expect(await rowTitles()).toEqual(["מחר"]))

        await goTo(router)
        expect((await eventTitles()).sort()).toEqual(["מחר", "של מישהו אחר"])
        expect(fake.requests).toHaveLength(requests)
    })
})
