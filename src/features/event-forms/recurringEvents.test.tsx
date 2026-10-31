import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import {
    createMemoryStorage,
    type DeviceStorage,
} from "../../app/deviceStorage"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { fakeTranslation } from "../../test/fakeFunctions"
import { renderApp } from "../../test/renderApp"
import { testUser, type TestUser } from "../../test/testUsers"
import { bio, event, eventTitles, segment } from "../../test/testEvents"
import { SINGLE_DAY_DRAFT_KEY } from "./draftKeys"

// Before the clocks go back on Sunday 25 October 2026 (UTC+3 → UTC+2).
const NOW = new Date("2026-10-15T09:00:00Z")

type Fake = ReturnType<typeof createFakeDataClient>

const TEACHER = bio({ bio_name: "נועה המורה", user_type: "creator" })
const HERZL = {
    placeId: "P-HERZL",
    label: "הרצל 1, תל אביב",
    english: "Herzl St 1, Tel Aviv-Yafo, Israel",
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function setup() {
    const user = testUser("creator")
    const fake = createFakeDataClient()
    fake.rows("public_bio").push(TEACHER)
    fake.places.places.push(HERZL)
    fake.functions.handle("translate", fakeTranslation)
    return { user, fake }
}

function render(
    user: TestUser,
    fake: Fake,
    path = "/create-events/single-day",
    storage: DeviceStorage = createMemoryStorage(),
) {
    return renderApp({ fake, signedInAs: user, path, now: NOW, storage })
}

const select = (name: string) => screen.getByRole("combobox", { name })
const dateInput = (name: string) => screen.getByLabelText(name)
const setDate = (name: string, value: string) =>
    fireEvent.change(dateInput(name), { target: { value } })

/** Fills a new event on Friday 16 October, 19:00–21:30, tagging a teacher. */
async function fillEvent(title = "ג'אם שישי") {
    await userEvent.type(
        await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        title,
    )
    await userEvent.selectOptions(select("אזור"), "center")
    const address = select("חפש כתובת")
    await userEvent.click(address)
    await userEvent.type(address, "הרצל")
    await userEvent.click(
        await screen.findByRole("option", { name: HERZL.label }),
    )
    setDate("תאריך", "2026-10-16")
    await userEvent.selectOptions(select("סוג האירוע"), "jam")
    setDate("שעת התחלה", "19:00")
    setDate("שעת סיום", "21:30")
    await userEvent.click(select("מורים - ניתן להוסיף מורים שלא נמצאים ברשימה"))
    await userEvent.click(screen.getByRole("option", { name: "נועה המורה" }))
}

async function makeWeekly(until: string) {
    await userEvent.click(screen.getByRole("checkbox", { name: /אירוע חוזר/ }))
    await userEvent.selectOptions(select("תדירות"), "weekly")
    setDate("תאריך סיום", until)
}

const submit = () =>
    userEvent.click(screen.getByRole("button", { name: "יצירת אירוע" }))

const writes = (fake: Fake, table = "ci_events") =>
    fake.requests.filter(
        (request) => request.table === table && request.method !== "select",
    )

const eventReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" && request.method === "select",
    )

async function myEventTitles() {
    const list = await screen.findByRole("list", { name: "עתיד" })
    return within(list)
        .getAllByRole("button")
        .filter((button) => button.hasAttribute("aria-expanded"))
        .map(
            (button) =>
                button.querySelector(".event-summary-title")?.textContent,
        )
}

describe("creating a recurring event", () => {
    // Types a whole event and walks every frequency: ~1 s alone, but
    // near the 5 s default when several test runs share the machine.
    it("offers legacy's frequencies and lists the days it will fall on", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await fillEvent()
        expect(screen.queryByRole("combobox", { name: "תדירות" })).toBeNull()

        await makeWeekly("2026-11-06")

        expect(
            within(select("תדירות"))
                .getAllByRole("option")
                .map((option) => option.textContent),
        ).toEqual(["שבועי", "דו שבועי", "חודשי", "חודשי - יום בשבוע"])
        const days = screen.getByRole("list", { name: "תאריכי האירועים" })
        expect(
            within(days)
                .getAllByRole("listitem")
                .map((item) => item.textContent),
        ).toEqual([
            "יום שישי - 16/10/2026",
            "יום שישי - 23/10/2026",
            "יום שישי - 30/10/2026",
            "יום שישי - 06/11/2026",
        ])
        await userEvent.selectOptions(select("תדירות"), "bi-weekly")
        expect(within(days).getAllByRole("listitem")).toHaveLength(2)
    }, 15_000)

    it("inserts a row per week in one request, across the clock change, sharing one ref key, and shows them all without a refetch", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent()
        await makeWeekly("2026-11-06")
        const readsBefore = eventReads(fake).length

        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert, ...more] = writes(fake)
        expect(more).toEqual([])
        expect(insert.method).toBe("insert")
        const rows = insert.rows!
        expect(rows.map((row) => row.start_date)).toEqual([
            "2026-10-16",
            "2026-10-23",
            "2026-10-30",
            "2026-11-06",
        ])
        expect(rows.map((row) => row.end_date)).toEqual(
            rows.map((row) => row.start_date),
        )
        // 19:00 in Jerusalem on each day: UTC+3, then UTC+2.
        expect(
            rows.map((row) => (row.segments as { startTime: string }[])[0]),
        ).toEqual([
            expect.objectContaining({ startTime: "2026-10-16T16:00:00.000Z" }),
            expect.objectContaining({ startTime: "2026-10-23T16:00:00.000Z" }),
            expect.objectContaining({ startTime: "2026-10-30T17:00:00.000Z" }),
            expect.objectContaining({ startTime: "2026-11-06T17:00:00.000Z" }),
        ])
        const [refKey] = new Set(rows.map((row) => row.recurring_ref_key))
        expect(refKey).toMatch(UUID)
        expect(new Set(rows.map((row) => row.recurring_ref_key)).size).toBe(1)
        expect(new Set(rows.map((row) => row.id)).size).toBe(4)
        for (const row of rows) {
            expect(row).toMatchObject({
                title: "ג'אם שישי",
                lng_titles: { en: "ג'אם שישי [en]", ru: "ג'אם שישי [ru]" },
                address: { place_id: HERZL.placeId, en_label: HERZL.english },
                user_id: user.id,
                hide: false,
                is_multi_day: false,
            })
        }
        // The title was translated once for the whole series (en and ru).
        expect(
            fake.functions.calls.filter((call) => call.name === "translate"),
        ).toHaveLength(2)
        // The teacher is tagged on every event, in one request.
        const [junction, ...moreJunctions] = writes(
            fake,
            "ci_events_users_junction",
        )
        expect(moreJunctions).toEqual([])
        expect(junction.rows).toEqual(
            rows.map((row) => ({
                ci_event_id: row.id,
                user_id: TEACHER.user_id,
            })),
        )
        expect(eventReads(fake)).toHaveLength(readsBefore)

        // What shows comes from the save's response, in the cache.
        fake.holdTable("ci_events")
        await act(() => router.navigate("/"))
        expect(
            (await eventTitles()).filter((title) => title === "ג'אם שישי"),
        ).toHaveLength(4)
    })

    it("needs a frequency and an end day from the event's day to a year ahead", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await fillEvent()
        await userEvent.click(
            screen.getByRole("checkbox", { name: /אירוע חוזר/ }),
        )

        await submit()
        expect(await screen.findAllByText("שדה חובה")).toHaveLength(2)

        await userEvent.selectOptions(select("תדירות"), "monthly")
        setDate("תאריך סיום", "2026-10-15")
        expect(
            await screen.findByText("תאריך הסיום לפני תאריך ההתחלה"),
        ).toBeInTheDocument()
        setDate("תאריך סיום", "2027-10-16")
        expect(
            await screen.findByText("תאריך הסיום יכול להיות עד שנה מהיום"),
        ).toBeInTheDocument()
        await submit()
        expect(writes(fake)).toEqual([])

        // Unticked, the series' fields don't count.
        await userEvent.click(
            screen.getByRole("checkbox", { name: /אירוע חוזר/ }),
        )
        await submit()
        await waitFor(() => expect(writes(fake)).toHaveLength(1))
        expect(writes(fake)[0].body).toMatchObject({ start_date: "2026-10-16" })
        expect(writes(fake)[0].body).not.toHaveProperty("recurring_ref_key")
    })

    it("keeps the series' choices in the draft across a reload", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        const first = render(user, fake, undefined, storage)
        await fillEvent()
        await makeWeekly("2026-10-30")
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toContain("weekly")
        first.unmount()

        const { router } = render(user, fake, undefined, storage)
        expect(
            await screen.findByRole("checkbox", { name: /אירוע חוזר/ }),
        ).toBeChecked()
        expect(select("תדירות")).toHaveValue("weekly")
        expect(dateInput("תאריך סיום")).toHaveValue("2026-10-30")

        await submit()
        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        expect(writes(fake)[0].rows).toHaveLength(3)
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toBeNull()
    })

    it("after a lost answer, a resend stores only the days not stored yet", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent()
        await makeWeekly("2026-10-30")
        // The first insert is stored, but its answer never arrives.
        let lose = true
        fake.beforeExecute((request) => {
            if (
                lose &&
                request.table === "ci_events" &&
                request.method === "insert"
            ) {
                lose = false
                fake.rows("ci_events").push(
                    ...request.rows!.map((row) => ({ ...row })),
                )
                throw new Error("Failed to fetch")
            }
        })
        await submit()
        expect(
            await screen.findByText("השמירה נכשלה, נסו שוב"),
        ).toBeInTheDocument()

        // A week more, then again.
        setDate("תאריך סיום", "2026-11-06")
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const stored = fake
            .rows("ci_events")
            .filter((row) => row.title === "ג'אם שישי")
        expect(stored.map((row) => row.start_date).sort()).toEqual([
            "2026-10-16",
            "2026-10-23",
            "2026-10-30",
            "2026-11-06",
        ])
        expect(new Set(stored.map((row) => row.recurring_ref_key)).size).toBe(1)
        // Sent 3, resent 4 (refused as stored), then the one missing day.
        expect(
            writes(fake)
                .filter((write) => write.method === "insert")
                .map((write) => write.rows?.length),
        ).toEqual([3, 4, 1])
        // Each stored day is tagged once.
        expect(fake.rows("ci_events_users_junction")).toHaveLength(4)
    })

    it("saves the series even when tagging fails", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent()
        await makeWeekly("2026-11-06")
        fake.failTable("ci_events_users_junction", "boom")

        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        expect(
            fake.rows("ci_events").filter((row) => row.title === "ג'אם שישי"),
        ).toHaveLength(4)
        expect(fake.rows("ci_events_users_junction")).toEqual([])
        fake.holdTable("ci_events")
        await act(() => router.navigate("/"))
        expect(
            (await eventTitles()).filter((title) => title === "ג'אם שישי"),
        ).toHaveLength(4)
    })
})

describe("editing an event of a recurring series", () => {
    const REF = "8b1c3e1a-0000-4000-8000-000000000001"

    /** A weekly 19:00–21:00 class of the user's; one week already passed. */
    function seeded() {
        const { user, fake } = setup()
        const week = (day: string, startTime: string, endTime: string) =>
            event({
                title: "שיעור שבועי",
                user_id: user.id,
                recurring_ref_key: REF,
                start_date: day,
                end_date: day,
                segments: [segment({ type: "class", startTime, endTime })],
                lng_titles: { en: "Weekly class" },
            })
        const past = week(
            "2026-10-09",
            "2026-10-09T16:00:00.000Z",
            "2026-10-09T18:00:00.000Z",
        )
        const edited = week(
            "2026-10-16",
            "2026-10-16T16:00:00.000Z",
            "2026-10-16T18:00:00.000Z",
        )
        const afterChange = week(
            "2026-10-30",
            "2026-10-30T17:00:00.000Z",
            "2026-10-30T19:00:00.000Z",
        )
        // Cancelled and hidden: it stays so.
        const cancelledHidden = {
            ...week(
                "2026-11-06",
                "2026-11-06T17:00:00.000Z",
                "2026-11-06T19:00:00.000Z",
            ),
            cancelled: true,
            cancelled_text: "חופש",
            hide: true,
        }
        const otherSeries = event({
            title: "סדרה אחרת",
            user_id: user.id,
            recurring_ref_key: "8b1c3e1a-0000-4000-8000-000000000002",
            start_date: "2026-10-23",
            end_date: "2026-10-23",
        })
        const theirs = event({
            title: "של מישהו",
            user_id: "someone-else",
            recurring_ref_key: REF,
            start_date: "2026-10-23",
            end_date: "2026-10-23",
        })
        fake.rows("ci_events").push(
            past,
            edited,
            afterChange,
            cancelledHidden,
            otherSeries,
            theirs,
        )
        return {
            user,
            fake,
            past,
            edited,
            afterChange,
            cancelledHidden,
            otherSeries,
            theirs,
        }
    }

    const openEdit = async (user: TestUser, fake: Fake, id: string) => {
        const rendered = render(
            user,
            fake,
            `/manage-events/edit-single-day/${id}`,
        )
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        return { ...rendered, title }
    }

    const update = () =>
        userEvent.click(screen.getByRole("button", { name: "עדכון אירוע" }))

    const row = (fake: Fake, id: string) =>
        fake.rows("ci_events").find((other) => other.id === id)!

    it("asks which later events of the series change too, offering only those", async () => {
        const { user, fake, edited } = seeded()
        const { title } = await openEdit(user, fake, edited.id)
        expect(
            screen.queryByRole("checkbox", { name: /אירוע חוזר/ }),
        ).toBeNull()
        await userEvent.type(title, "!")

        await update()

        const dialog = await screen.findByRole("dialog", {
            name: "עדכון אירוע",
        })
        expect(
            within(dialog)
                .getAllByRole("checkbox")
                .map((box) => box.closest("label")!.textContent),
        ).toEqual([
            "הכל",
            "30/10/2026 - שיעור שבועי",
            "06/11/2026 - שיעור שבועי",
        ])
        expect(writes(fake)).toEqual([])
    })

    it("changes only that event when no later one is chosen", async () => {
        const { user, fake, edited, afterChange } = seeded()
        const { router, title } = await openEdit(user, fake, edited.id)
        await userEvent.clear(title)
        await userEvent.type(title, "שיעור מיוחד")

        await update()
        const dialog = await screen.findByRole("dialog", {
            name: "עדכון אירוע",
        })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "עדכון" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        const [write, ...more] = writes(fake)
        expect(more).toEqual([])
        expect(write.filters).toEqual([
            { op: "eq", column: "id", value: edited.id },
            { op: "eq", column: "user_id", value: user.id },
        ])
        expect(row(fake, edited.id).title).toBe("שיעור מיוחד")
        expect(row(fake, afterChange.id).title).toBe("שיעור שבועי")
    })

    it("changes the chosen later events too, each keeping its day, cancellation and hide", async () => {
        const {
            user,
            fake,
            past,
            edited,
            afterChange,
            cancelledHidden,
            otherSeries,
            theirs,
        } = seeded()
        // From my events and the calendar, so their lists are cached.
        const { router } = render(user, fake, "/manage-events")
        expect(await myEventTitles()).toContain("שיעור שבועי")
        await act(() => router.navigate("/"))
        expect(await eventTitles()).toContain("שיעור שבועי")
        await act(() =>
            router.navigate(`/manage-events/edit-single-day/${edited.id}`),
        )
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        await userEvent.clear(title)
        await userEvent.type(title, "שיעור חדש")
        await userEvent.click(screen.getByRole("switch"))
        // The series has loaded (the save waits for it); from here on every
        // read of events hangs: what the pages show comes from the answers.
        await waitFor(() =>
            expect(
                screen.getByRole("button", { name: "עדכון אירוע" }),
            ).toBeEnabled(),
        )
        fake.holdReads("ci_events")
        const readsBefore = eventReads(fake).length

        await update()
        const dialog = await screen.findByRole("dialog", {
            name: "עדכון אירוע",
        })
        await userEvent.click(
            within(dialog).getByRole("checkbox", { name: "הכל" }),
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "עדכון" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        const [own, later, ...more] = writes(fake)
        expect(more).toEqual([])
        expect(own.body).toMatchObject({ title: "שיעור חדש", hide: true })
        // One request for the later events: the same columns for all, only
        // while they are the user's and in the series.
        expect(later.filters).toEqual([
            {
                op: "in",
                column: "id",
                value: [afterChange.id, cancelledHidden.id],
            },
            { op: "eq", column: "user_id", value: user.id },
            { op: "eq", column: "recurring_ref_key", value: REF },
        ])
        expect(Object.keys(later.body!).sort()).toEqual([
            "lng_titles",
            "title",
            "updated_at",
        ])
        // Translated once, for all of them.
        expect(
            fake.functions.calls.filter((call) => call.name === "translate"),
        ).toHaveLength(2)
        expect(later.body!.lng_titles).toEqual({
            en: "שיעור חדש [en]",
            ru: "שיעור חדש [ru]",
        })

        expect(row(fake, edited.id)).toMatchObject({
            title: "שיעור חדש",
            hide: true,
        })
        expect(row(fake, afterChange.id)).toMatchObject({
            title: "שיעור חדש",
            start_date: "2026-10-30",
            hide: false,
        })
        expect(row(fake, cancelledHidden.id)).toMatchObject({
            title: "שיעור חדש",
            start_date: "2026-11-06",
            cancelled: true,
            cancelled_text: "חופש",
            hide: true,
        })
        expect(row(fake, past.id).title).toBe("שיעור שבועי")
        expect(row(fake, otherSeries.id).title).toBe("סדרה אחרת")
        expect(row(fake, theirs.id).title).toBe("של מישהו")

        // My events and the calendar show them from the answers.
        expect(await myEventTitles()).toEqual([
            "שיעור חדש",
            "סדרה אחרת",
            "שיעור חדש",
            "שיעור חדש",
        ])
        await act(() => router.navigate("/"))
        const calendar = await eventTitles()
        // The edited event is hidden now; the later visible one renamed.
        expect(calendar).toContain("שיעור חדש")
        expect(calendar).not.toContain("שיעור שבועי")
        // The save asked for no list of events: the one read since is my
        // events' own on opening again (held, so its list is the answers').
        expect(eventReads(fake).slice(readsBefore)).toMatchObject([
            {
                filters: [
                    { op: "eq", column: "user_id", value: user.id },
                    { op: "gte", column: "start_date" },
                ],
            },
        ])
    })

    it("moves new segment times onto each later event's own day, across the clock change", async () => {
        const { user, fake, edited, afterChange, cancelledHidden } = seeded()
        const { router } = await openEdit(user, fake, edited.id)
        setDate("שעת התחלה", "18:00")

        await update()
        const dialog = await screen.findByRole("dialog", {
            name: "עדכון אירוע",
        })
        await userEvent.click(
            within(dialog).getByRole("checkbox", { name: "הכל" }),
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "עדכון" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        const startOf = (id: string) =>
            (row(fake, id).segments as { startTime: string }[])[0].startTime
        expect(startOf(edited.id)).toBe("2026-10-16T15:00:00.000Z")
        expect(startOf(afterChange.id)).toBe("2026-10-30T16:00:00.000Z")
        expect(startOf(cancelledHidden.id)).toBe("2026-11-06T16:00:00.000Z")
        expect(row(fake, afterChange.id).start_date).toBe("2026-10-30")
        // Each later event's segments are its own: a request each.
        const later = writes(fake).slice(1)
        expect(later.map((write) => write.filters[0])).toEqual([
            { op: "in", column: "id", value: [afterChange.id] },
            { op: "in", column: "id", value: [cancelledHidden.id] },
        ])
        expect(Object.keys(later[0].body!).sort()).toEqual([
            "segments",
            "updated_at",
        ])
    })

    it("saves nothing when the question is closed, keeping the edits", async () => {
        const { user, fake, edited } = seeded()
        const { router, title } = await openEdit(user, fake, edited.id)
        await userEvent.type(title, "!")

        await update()
        const dialog = await screen.findByRole("dialog", {
            name: "עדכון אירוע",
        })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "ביטול" }),
        )

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        expect(writes(fake)).toEqual([])
        expect(title).toHaveValue("שיעור שבועי!")
        expect(router.state.location.pathname).toBe(
            `/manage-events/edit-single-day/${edited.id}`,
        )
        expect(
            screen.getByRole("button", { name: "עדכון אירוע" }),
        ).toBeEnabled()
    })

    const chooseAll = async () => {
        const dialog = await screen.findByRole("dialog", {
            name: "עדכון אירוע",
        })
        await userEvent.click(
            within(dialog).getByRole("checkbox", { name: "הכל" }),
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "עדכון" }),
        )
    }

    it("doesn't save until the rest of the series is loaded", async () => {
        const { user, fake, edited } = seeded()
        const { router } = render(user, fake, "/manage-events")
        expect(await myEventTitles()).toContain("שיעור שבועי")
        fake.holdTable("ci_events")
        await act(() =>
            router.navigate(`/manage-events/edit-single-day/${edited.id}`),
        )
        await userEvent.type(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
            "!",
        )
        expect(screen.getByText("טוען את שאר ארועי הסדרה…")).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: "עדכון אירוע" }),
        ).toBeDisabled()

        fake.releaseTable("ci_events")
        await waitFor(() =>
            expect(
                screen.getByRole("button", { name: "עדכון אירוע" }),
            ).toBeEnabled(),
        )
        await update()
        expect(
            await screen.findByRole("dialog", { name: "עדכון אירוע" }),
        ).toBeInTheDocument()
    })

    it("says so when the rest of the series can't be loaded, with a retry", async () => {
        const { user, fake, edited } = seeded()
        let failing = true
        fake.beforeExecute((request) => {
            if (
                failing &&
                request.method === "select" &&
                request.filters.some(
                    (filter) => filter.column === "recurring_ref_key",
                )
            ) {
                throw new Error("Failed to fetch")
            }
        })
        const { title } = await openEdit(user, fake, edited.id)
        await userEvent.type(title, "!")
        expect(
            await screen.findByText("לא ניתן לטעון את שאר ארועי הסדרה"),
        ).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: "עדכון אירוע" }),
        ).toBeDisabled()

        failing = false
        await userEvent.click(screen.getByRole("button", { name: "נסו שוב" }))
        await waitFor(() =>
            expect(
                screen.getByRole("button", { name: "עדכון אירוע" }),
            ).toBeEnabled(),
        )
        await update()
        expect(
            await screen.findByRole("dialog", { name: "עדכון אירוע" }),
        ).toBeInTheDocument()
        expect(writes(fake)).toEqual([])
    })

    it("writes nothing more when the edited event was deleted meanwhile", async () => {
        const { user, fake, edited, afterChange } = seeded()
        const { title } = await openEdit(user, fake, edited.id)
        await userEvent.type(title, "!")
        fake.beforeExecute((request) => {
            if (request.method === "update") {
                const rows = fake.rows("ci_events")
                const at = rows.findIndex((other) => other.id === edited.id)
                if (at !== -1) rows.splice(at, 1)
            }
        })

        await update()
        await chooseAll()

        expect(await screen.findByText(/האירוע לא נמצא/)).toBeInTheDocument()
        expect(writes(fake)).toHaveLength(1)
        expect(row(fake, afterChange.id).title).toBe("שיעור שבועי")
    })

    it("keeps what was stored and refetches the lists when a later write fails", async () => {
        const { user, fake, edited, afterChange, cancelledHidden } = seeded()
        await openEdit(user, fake, edited.id)
        setDate("שעת התחלה", "18:00")
        fake.beforeExecute((request) => {
            if (
                request.method === "update" &&
                request.filters.some(
                    (filter) =>
                        filter.op === "in" &&
                        (filter.value as string[]).includes(cancelledHidden.id),
                )
            ) {
                throw new Error("Failed to fetch")
            }
        })

        await update()
        const readsBefore = eventReads(fake).length
        await chooseAll()

        expect(
            await screen.findByText("השמירה נכשלה, נסו שוב"),
        ).toBeInTheDocument()
        const startOf = (id: string) =>
            (row(fake, id).segments as { startTime: string }[])[0].startTime
        expect(startOf(edited.id)).toBe("2026-10-16T15:00:00.000Z")
        expect(startOf(afterChange.id)).toBe("2026-10-30T16:00:00.000Z")
        expect(startOf(cancelledHidden.id)).toBe("2026-11-06T17:00:00.000Z")
        // The event lists on screen are read again.
        await waitFor(() =>
            expect(eventReads(fake).length).toBeGreaterThan(readsBefore),
        )
    })

    it("carries a new address, with its English label, to the later events", async () => {
        const { user, fake, edited, afterChange } = seeded()
        fake.places.failEnglish()
        const { router } = await openEdit(user, fake, edited.id)
        const address = select("חפש כתובת")
        await userEvent.click(address)
        await userEvent.clear(address)
        await userEvent.type(address, "הרצל")
        await userEvent.click(
            await screen.findByRole("option", { name: HERZL.label }),
        )
        // Not labelled at pick time: the save looks it up, once.
        fake.places.healEnglish()

        await update()
        await chooseAll()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        const expected = {
            label: HERZL.label,
            place_id: HERZL.placeId,
            en_label: HERZL.english,
        }
        const [own, later] = writes(fake)
        expect(own.body!.address).toEqual(expected)
        expect(later.body!.address).toEqual(expected)
        expect(row(fake, afterChange.id).address).toEqual(expected)
    })

    it("doesn't ask for the last event of a series", async () => {
        const { user, fake, cancelledHidden } = seeded()
        const { router, title } = await openEdit(user, fake, cancelledHidden.id)
        await userEvent.type(title, "!")
        await waitFor(() =>
            expect(
                fake.requests.some(
                    (request) =>
                        request.table === "ci_events" &&
                        request.filters.some(
                            (filter) => filter.column === "recurring_ref_key",
                        ),
                ),
            ).toBe(true),
        )

        await update()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        expect(writes(fake)).toHaveLength(1)
    })
})
