import { act, cleanup, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createMemoryStorage } from "../../app/deviceStorage"
import type { SignedInRole } from "../../app/viewer"
import { setPageVisibility } from "../../test/browser"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { fakeTranslation } from "../../test/fakeFunctions"
import { renderApp } from "../../test/renderApp"
import { testUser, userRow, type TestUser } from "../../test/testUsers"
import { event, eventTitles } from "../calendar/testEvents"
import { MANAGED_EVENT_COLUMNS } from "../events/managedEvent"
import { ADMIN_EVENTS_PAGE_SIZE, CREATOR_COLUMNS } from "./adminEvents"

const NOW = new Date("2026-10-30T09:00:00Z")
const TODAY = "2026-10-30"

type Fake = ReturnType<typeof createFakeDataClient>

const dana = testUser("creator", { id: "dana", name: "דנה" })
const yael = testUser("org", { id: "yael", name: "יעל" })

/** An admin, Dana and Yael (creators), and the events given. */
function setup(
    rows: (admin: TestUser) => Record<string, unknown>[] = () => [],
    role: SignedInRole = "admin",
) {
    const admin = testUser(role, { name: "המנהלת" })
    const fake = createFakeDataClient()
    fake.rows("users").push(userRow(dana), userRow(yael))
    fake.rows("ci_events").push(...rows(admin))
    fake.functions.handle("translate", fakeTranslation)
    return { admin, fake }
}

const COLUMNS = MANAGED_EVENT_COLUMNS.replace(/\s+/g, "")

/** Reads of events for management (this list, my events, series, edit). */
const managedReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" &&
            request.method === "select" &&
            request.select === COLUMNS,
    )

/** Reads of this list: every owner's events (no `user_id` equality). */
const listReads = (fake: Fake) =>
    managedReads(fake).filter(
        (request) =>
            !request.filters.some(
                (filter) => filter.op === "eq" && filter.column !== "hide",
            ) &&
            request.filters.some(
                (filter) =>
                    filter.op === "gte" && filter.column === "start_date",
            ),
    )

const creatorReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" &&
            request.select === CREATOR_COLUMNS.replace(/\s+/g, ""),
    )

/** Reads of the public window (or any public event read). */
const publicReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" &&
            request.method === "select" &&
            request.select !== COLUMNS &&
            !creatorReads(fake).includes(request),
    )

const writes = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" && request.method !== "select",
    )

/** The rows' summary buttons (they open and close a row). */
async function summaries() {
    const list = await screen.findByRole("list", { name: "אירועים" })
    return within(list)
        .getAllByRole("button")
        .filter((button) => button.hasAttribute("aria-expanded"))
}

/** The list's rows, as their summary buttons read. */
async function rows() {
    return (await summaries()).map((button) => button.textContent)
}

async function rowTitles() {
    return (await summaries()).map(
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

async function confirm(dialogName: string, ok: string) {
    const dialog = await screen.findByRole("dialog", { name: dialogName })
    await userEvent.click(within(dialog).getByRole("button", { name: ok }))
    await waitFor(() =>
        expect(
            screen.queryByRole("dialog", { name: dialogName }),
        ).not.toBeInTheDocument(),
    )
}

function render(admin: TestUser, fake: Fake, path = "/manage-all-events") {
    return renderApp({ fake, signedInAs: admin, path, now: NOW })
}

describe("manage all events (/manage-all-events)", () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it("is for admins only", async () => {
        const { fake } = setup(() => [event({ user_id: dana.id })])
        const { router } = renderApp({
            fake,
            signedInAs: testUser("creator"),
            path: "/manage-all-events",
        })
        await waitFor(() => expect(router.state.location.pathname).toBe("/"))
        expect(managedReads(fake)).toEqual([])
        expect(creatorReads(fake)).toEqual([])
        cleanup()

        const signedOut = setup().fake
        const out = renderApp({ path: "/manage-all-events", fake: signedOut })
        await waitFor(() =>
            expect(out.router.state.location.pathname).toBe("/login"),
        )
        expect(managedReads(signedOut)).toEqual([])
    })

    it("isn't fetched at an admin's boot", async () => {
        const { admin, fake } = setup(() => [
            event({ title: "ג'אם", user_id: dana.id }),
        ])
        renderApp({ fake, signedInAs: admin, now: NOW })

        expect(await eventTitles()).toEqual(["ג'אם"])
        await screen.findByText("המנהלת")
        expect(managedReads(fake)).toEqual([])
        expect(creatorReads(fake)).toEqual([])
    })

    it("loads every creator's events from today, hidden ones too, and the creators, when it opens", async () => {
        const { admin, fake } = setup(() => [
            event({
                title: "של דנה",
                user_id: dana.id,
                start_date: "2026-10-31",
                end_date: "2026-10-31",
            }),
            event({
                title: "טיוטה של יעל",
                user_id: yael.id,
                start_date: "2026-11-02",
                end_date: "2026-11-04",
                hide: true,
            }),
            event({
                title: "היום",
                user_id: dana.id,
                start_date: TODAY,
                end_date: TODAY,
                cancelled: true,
            }),
            event({
                title: "אתמול",
                user_id: dana.id,
                start_date: "2026-10-29",
            }),
        ])
        render(admin, fake)

        await waitFor(async () =>
            expect(await rows()).toEqual([
                "היום30/10/2026|דנה|אירוע מבוטל‹",
                "של דנה31/10/2026|דנה‹",
                "טיוטה של יעל02/11/2026 - 04/11/2026|יעל|אירוע מוסתר‹",
            ]),
        )
        expect(screen.getByRole("heading", { name: "ניהול אירועים" }))
        const [read] = listReads(fake)
        expect(listReads(fake)).toHaveLength(1)
        expect(read).toMatchObject({
            filters: [{ op: "gte", column: "start_date", value: TODAY }],
            order: [
                { column: "start_date", ascending: true },
                { column: "id", ascending: true },
            ],
            limit: ADMIN_EVENTS_PAGE_SIZE + 1,
            token: fake.auth.accessToken(),
        })
        expect(creatorReads(fake)).toHaveLength(1)
        expect(creatorReads(fake)[0]).toMatchObject({
            filters: [{ op: "gte", column: "start_date", value: TODAY }],
            token: fake.auth.accessToken(),
        })
    })

    it("keeps nothing of it on the device", async () => {
        const { admin, fake } = setup(() => [
            event({ title: "טיוטה סודית", user_id: dana.id, hide: true }),
        ])
        const storage = createMemoryStorage()
        const session = createMemoryStorage()
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-all-events",
            now: NOW,
            storage,
            session,
        })
        expect(await rowTitles()).toEqual(["טיוטה סודית"])

        const kept = [storage, session].flatMap((store) =>
            Array.from({ length: store.length ?? 0 }, (_, index) =>
                store.getItem(store.key?.(index) ?? ""),
            ),
        )
        expect(kept.join("\n")).not.toContain("טיוטה סודית")
    })

    it("filters by creator on the server", async () => {
        const { admin, fake } = setup(() => [
            event({ title: "של דנה", user_id: dana.id }),
            event({ title: "של יעל", user_id: yael.id }),
        ])
        render(admin, fake)
        expect((await rowTitles()).sort()).toEqual(["של דנה", "של יעל"])

        const picker = screen.getByRole("combobox", {
            name: "סינון לפי יוצרים",
        })
        await userEvent.click(picker)
        await userEvent.click(
            await screen.findByRole("option", { name: "יעל" }),
        )

        await waitFor(async () => expect(await rowTitles()).toEqual(["של יעל"]))
        expect(listReads(fake).at(-1)?.filters).toEqual([
            { op: "gte", column: "start_date", value: TODAY },
            { op: "in", column: "user_id", value: [yael.id] },
        ])
        // The creators were read once, when the page opened.
        expect(creatorReads(fake)).toHaveLength(1)
    })

    it("searches titles on the server once typing pauses", async () => {
        const { admin, fake } = setup(() => [
            event({ title: "ג'אם שישי", user_id: dana.id }),
            event({ title: "שיעור", user_id: yael.id }),
        ])
        render(admin, fake)
        await rowTitles()

        await userEvent.type(
            screen.getByRole("searchbox", { name: "סינון לפי שם האירוע" }),
            "ג'אם",
        )

        await waitFor(async () =>
            expect(await rowTitles()).toEqual(["ג'אם שישי"]),
        )
        expect(listReads(fake)).toHaveLength(2)
        expect(listReads(fake)[1].filters).toContainEqual({
            op: "ilike",
            column: "title",
            value: "*ג'אם*",
        })
    })

    it("loads more after the last event shown", async () => {
        const total = ADMIN_EVENTS_PAGE_SIZE + 4
        const { admin, fake } = setup(() =>
            Array.from({ length: total }, (_, i) =>
                event({
                    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
                    title: `אירוע ${i}`,
                    user_id: i % 2 ? dana.id : yael.id,
                    // Pairs share a day, so a page ends inside a day.
                    start_date: `2026-11-${String(1 + Math.floor(i / 2)).padStart(2, "0")}`,
                    end_date: `2026-11-${String(1 + Math.floor(i / 2)).padStart(2, "0")}`,
                }),
            ),
        )
        render(admin, fake)
        await waitFor(async () =>
            expect(await rowTitles()).toHaveLength(ADMIN_EVENTS_PAGE_SIZE),
        )

        await userEvent.click(
            screen.getByRole("button", { name: "טעינת אירועים נוספים" }),
        )

        await waitFor(async () =>
            expect(await rowTitles()).toEqual(
                Array.from({ length: total }, (_, i) => `אירוע ${i}`),
            ),
        )
        const last = ADMIN_EVENTS_PAGE_SIZE - 1
        expect(listReads(fake)[1].filters).toContainEqual({
            op: "or",
            column: "",
            value: `start_date.gt.2026-11-15,and(start_date.eq.2026-11-15,id.gt.00000000-0000-4000-8000-0000000000${last})`,
        })
        expect(
            screen.queryByRole("button", { name: "טעינת אירועים נוספים" }),
        ).not.toBeInTheDocument()
    })

    it("hides another creator's event: marked here, off the calendar, from the response", async () => {
        const { admin, fake } = setup(() => [
            event({ title: "של דנה", user_id: dana.id }),
            event({ title: "של יעל", user_id: yael.id }),
        ])
        const { router } = render(admin, fake, "/")
        expect((await eventTitles()).sort()).toEqual(["של דנה", "של יעל"])
        await act(() => router.navigate("/manage-all-events"))

        const row = await openRow("של דנה")
        await userEvent.click(row.getByRole("button", { name: "הסתרת ארוע" }))
        await confirm("הסתרת ארוע", "הסתרה")

        expect(await rows()).toContain("של דנה01/11/2026|דנה|אירוע מוסתר‹")
        const [write] = writes(fake)
        expect(write).toMatchObject({
            method: "update",
            body: { hide: true },
            select: COLUMNS,
            token: fake.auth.accessToken(),
        })
        // Anyone's event, still owned and visible as the admin saw it.
        expect(write.filters).toEqual([
            { op: "in", column: "id", value: [expect.any(String)] },
            { op: "eq", column: "user_id", value: dana.id },
            { op: "eq", column: "hide", value: false },
        ])

        const before = fake.requests.length
        await act(() => router.navigate("/"))
        expect(await eventTitles()).toEqual(["של יעל"])
        expect(fake.requests).toHaveLength(before)
        expect(publicReads(fake)).toHaveLength(1)
    })

    it("updates the admin's own events list too, without refetching it", async () => {
        const { admin, fake } = setup((admin) => [
            event({ title: "שלי", user_id: admin.id }),
        ])
        const { router } = render(admin, fake, "/manage-events")
        await screen.findByRole("list", { name: "עתיד" })
        await act(() => router.navigate("/manage-all-events"))

        const row = await openRow("שלי")
        await userEvent.click(row.getByRole("button", { name: "ביטול אירוע" }))
        await confirm("ביטול אירוע", "ביטול אירוע")
        expect(writes(fake)[0].filters).toEqual([
            { op: "eq", column: "id", value: expect.any(String) },
            { op: "eq", column: "user_id", value: admin.id },
            { op: "not.is", column: "cancelled", value: true },
        ])

        // My events shows it cancelled at once, while its refetch is held.
        fake.holdTable("ci_events")
        await act(() => router.navigate("/manage-events"))
        const mine = await screen.findByRole("list", { name: "עתיד" })
        expect(mine).toHaveTextContent("אירוע מבוטל")
        fake.releaseTable("ci_events")
    })

    it("deletes another creator's event: gone here and from the calendar", async () => {
        const { admin, fake } = setup(() => [
            event({ title: "של דנה", user_id: dana.id }),
            event({ title: "של יעל", user_id: yael.id }),
        ])
        const { router } = render(admin, fake)
        const row = await openRow("של דנה")
        await userEvent.click(row.getByRole("button", { name: "מחיקת ארוע" }))
        await confirm("מחיקת ארוע", "מחיקה")

        await waitFor(async () => expect(await rowTitles()).toEqual(["של יעל"]))
        expect(writes(fake)[0]).toMatchObject({
            method: "delete",
            filters: [
                { op: "in", column: "id", value: [expect.any(String)] },
                { op: "eq", column: "user_id", value: dana.id },
            ],
        })
        expect(fake.rows("ci_events").map((r) => r.title)).toEqual(["של יעל"])
        // Focus goes to the heading, the deleted row's place gone.
        expect(
            screen.getByRole("heading", { name: "ניהול אירועים" }),
        ).toHaveFocus()

        await act(() => router.navigate("/"))
        expect(await eventTitles()).toEqual(["של יעל"])
        expect(publicReads(fake)).toHaveLength(1)
    })

    it("deletes a tagged event: its tags go first if the database refuses", async () => {
        const { admin, fake } = setup()
        const tagged = event({ title: "מתויג", user_id: dana.id })
        fake.rows("ci_events").push(tagged)
        fake.rows("ci_events_users_junction").push({
            id: crypto.randomUUID(),
            ci_event_id: tagged.id,
            user_id: yael.id,
        })
        render(admin, fake)
        const row = await openRow("מתויג")
        await userEvent.click(row.getByRole("button", { name: "מחיקת ארוע" }))
        await confirm("מחיקת ארוע", "מחיקה")

        await screen.findByText("אין אירועים")
        expect(
            fake.requests
                .filter((request) => request.method === "delete")
                .map((request) => [request.table, request.filters[0]]),
        ).toEqual([
            ["ci_events", { op: "in", column: "id", value: [tagged.id] }],
            [
                "ci_events_users_junction",
                { op: "in", column: "ci_event_id", value: [tagged.id] },
            ],
            ["ci_events", { op: "in", column: "id", value: [tagged.id] }],
        ])
        expect(fake.rows("ci_events")).toEqual([])
        expect(fake.rows("ci_events_users_junction")).toEqual([])
    })

    it("says so when the database writes nothing (refused, or changed meanwhile), and reads the lists again", async () => {
        const { admin, fake } = setup(() => [
            event({ title: "של דנה", user_id: dana.id }),
        ])
        render(admin, fake)
        const row = await openRow("של דנה")
        // As RLS refusing the write would: no row comes back.
        fake.rows("ci_events")[0].user_id = yael.id
        await userEvent.click(row.getByRole("button", { name: "הסתרת ארוע" }))
        const dialog = await screen.findByRole("dialog", { name: "הסתרת ארוע" })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "הסתרה" }),
        )

        expect(await within(dialog).findByRole("alert")).toHaveTextContent(
            "הפעולה לא בוצעה על כל האירועים: אין הרשאה, או שהם השתנו בינתיים. הרשימה עודכנה.",
        )
        await waitFor(() => expect(listReads(fake)).toHaveLength(2))
        expect(fake.rows("ci_events")[0].hide).toBe(false)
    })

    it("says so when the series can't be read, and waits for a retry", async () => {
        const { admin, fake } = setup(() =>
            ["2026-11-01", "2026-11-08"].map((day) =>
                event({
                    title: `שבועי ${day.slice(8)}`,
                    user_id: dana.id,
                    start_date: day,
                    end_date: day,
                    recurring_ref_key: "weekly",
                }),
            ),
        )
        render(admin, fake)
        await rowTitles()
        fake.failTable("ci_events", "boom")
        const row = await openRow("שבועי 01")
        await userEvent.click(row.getByRole("button", { name: "הסתרת ארוע" }))
        const dialog = await screen.findByRole("dialog", { name: "הסתרת ארוע" })

        expect(await within(dialog).findByRole("alert")).toHaveTextContent(
            "לא הצלחנו לטעון את האירועים הבאים בסדרה",
        )
        expect(
            within(dialog).getByRole("button", { name: "הסתרה" }),
        ).toBeDisabled()

        fake.healTable("ci_events")
        await userEvent.click(
            within(dialog).getByRole("button", { name: "נסו שוב" }),
        )
        expect(
            await within(dialog).findByRole("checkbox", {
                name: "08/11/2026 - שבועי 08",
            }),
        ).toBeInTheDocument()
        expect(
            within(dialog).getByRole("button", { name: "הסתרה" }),
        ).toBeEnabled()
    })

    it("offers the owner's later events of a recurring series", async () => {
        const KEY = "weekly"
        const { admin, fake } = setup(() =>
            ["2026-11-01", "2026-11-08", "2026-11-15"].map((day) =>
                event({
                    title: `שבועי ${day.slice(8)}`,
                    user_id: dana.id,
                    start_date: day,
                    end_date: day,
                    recurring_ref_key: KEY,
                }),
            ),
        )
        render(admin, fake)
        await rowTitles()
        // The series is read when the row opens; until it comes, delete
        // waits rather than skip the question.
        fake.holdTable("ci_events")
        const row = await openRow("שבועי 01")
        await userEvent.click(row.getByRole("button", { name: "מחיקת ארוע" }))
        const dialog = await screen.findByRole("dialog", { name: "מחיקת ארוע" })
        expect(
            within(dialog).getByRole("button", { name: "מחיקה" }),
        ).toBeDisabled()
        expect(within(dialog).getByRole("status")).toBeInTheDocument()
        fake.releaseTable("ci_events")
        const series = await within(dialog).findByRole("group", {
            name: "ארועים עתידיים באותה סדרה:",
        })
        expect(
            within(series)
                .getAllByRole("checkbox")
                .map((box) => box.closest("label")?.textContent),
        ).toEqual(["הכל", "08/11/2026 - שבועי 08", "15/11/2026 - שבועי 15"])
        expect(managedReads(fake).at(-1)?.filters).toEqual([
            { op: "eq", column: "user_id", value: dana.id },
            { op: "eq", column: "recurring_ref_key", value: KEY },
            { op: "gte", column: "start_date", value: TODAY },
        ])

        await userEvent.click(
            within(series).getByRole("checkbox", {
                name: "15/11/2026 - שבועי 15",
            }),
        )
        await confirm("מחיקת ארוע", "מחיקה")
        await waitFor(async () =>
            expect(await rowTitles()).toEqual(["שבועי 08"]),
        )
    })

    it("edits another creator's event, scoped to its owner, and comes back", async () => {
        const { admin, fake } = setup(() => [
            event({ title: "של דנה", user_id: dana.id }),
        ])
        const { router } = render(admin, fake)
        const row = await openRow("של דנה")
        await userEvent.click(row.getByRole("link", { name: "עריכת אירוע" }))

        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        expect(title).toHaveValue("של דנה")
        await userEvent.clear(title)
        await userEvent.type(title, "ערוך")
        await userEvent.click(
            screen.getByRole("button", { name: "עדכון אירוע" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-all-events"),
        )
        const update = writes(fake).find((w) => w.method === "update")
        expect(update?.filters).toEqual([
            { op: "eq", column: "id", value: expect.any(String) },
            { op: "eq", column: "user_id", value: dana.id },
        ])
        expect(fake.rows("ci_events")[0]).toMatchObject({
            title: "ערוך",
            user_id: dana.id,
        })
        await waitFor(async () => expect(await rowTitles()).toEqual(["ערוך"]))
    })

    it("refreshes on the refresh button", async () => {
        const { admin, fake } = setup(() => [
            event({ title: "ישן", user_id: dana.id }),
        ])
        render(admin, fake)
        expect(await rowTitles()).toEqual(["ישן"])
        fake.rows("ci_events").push(
            event({ title: "חדש", user_id: yael.id, start_date: TODAY }),
        )

        await userEvent.click(screen.getByRole("button", { name: "רענון" }))

        await waitFor(async () =>
            expect(await rowTitles()).toEqual(["חדש", "ישן"]),
        )
        expect(listReads(fake)).toHaveLength(2)
        expect(creatorReads(fake)).toHaveLength(2)
        // The new creator can be picked now.
        await userEvent.click(
            screen.getByRole("combobox", { name: "סינון לפי יוצרים" }),
        )
        expect(
            await screen.findByRole("option", { name: "יעל" }),
        ).toBeInTheDocument()
    })

    it("refreshes when the app comes back after 5 minutes, not before", async () => {
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(NOW)
        const { admin, fake } = setup(() => [
            event({ title: "ישן", user_id: dana.id }),
        ])
        render(admin, fake)
        await rowTitles()

        setPageVisibility("hidden")
        vi.setSystemTime(NOW.getTime() + 60_000)
        setPageVisibility("visible")
        expect(listReads(fake)).toHaveLength(1)

        setPageVisibility("hidden")
        vi.setSystemTime(NOW.getTime() + 6 * 60_000)
        setPageVisibility("visible")
        await waitFor(() => expect(listReads(fake)).toHaveLength(2))
    })
})
