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
import { bio, event, eventTitles } from "../../test/testEvents"
import {
    SINGLE_DAY_DRAFT_KEY,
    SINGLE_DAY_TEMPLATE_DRAFT_KEY,
} from "./draftKeys"

const NOW = new Date("2026-10-30T09:00:00Z")

type Fake = ReturnType<typeof createFakeDataClient>

const TEACHER = bio({ bio_name: "נועה המורה", user_type: "creator" })

const HERZL = {
    placeId: "P-HERZL",
    label: "הרצל 1, תל אביב",
    english: "Herzl St 1, Tel Aviv-Yafo, Israel",
}

/** A `templates` row as legacy's single-day form wrote it. */
function templateRow(userId: string, overrides: Record<string, unknown> = {}) {
    return {
        id: crypto.randomUUID(),
        user_id: userId,
        name: "ג'אם שישי",
        created_at: "2026-10-01T10:00:00+00:00",
        updated_at: "2026-10-01",
        is_multi_day: false,
        title: "ג'אם שישי בבוקר",
        description: "מביאים מים",
        district: "center",
        address: {
            label: "דיזנגוף 50",
            place_id: "P-DIZ",
            en_label: "Dizengoff 50",
        },
        organisations: [],
        owners: [],
        links: [{ title: "הרשמה", link: "https://x.example" }],
        price: [{ title: "כניסה", sum: 40 }],
        // Legacy wrote a template's times on the day it was saved.
        segments: [
            {
                type: "jam",
                startTime: "2025-03-02T08:00:00.000Z",
                endTime: "2025-03-02T10:30:00.000Z",
                tags: ["everyone"],
                teachers: [{ label: TEACHER.bio_name, value: TEACHER.user_id }],
            },
        ],
        type: "",
        multi_day_teachers: [],
        ...overrides,
    }
}

function multiDayTemplateRow(
    userId: string,
    overrides: Record<string, unknown> = {},
) {
    return templateRow(userId, {
        name: "ריטריט קיץ",
        created_at: "2026-09-01T10:00:00+00:00",
        is_multi_day: true,
        title: "ריטריט במדבר",
        district: "south",
        segments: [],
        type: "retreat",
        multi_day_teachers: [
            { label: TEACHER.bio_name, value: TEACHER.user_id },
        ],
        ...overrides,
    })
}

/** A creator with a single-day and a multi-day template; someone else's too. */
function setup() {
    const user = testUser("creator")
    const fake = createFakeDataClient()
    fake.rows("public_bio").push(TEACHER)
    fake.rows("ci_events").push(event({ title: "ג'אם ותיק" }))
    fake.places.places.push(HERZL)
    fake.functions.handle("translate", fakeTranslation)
    const single = templateRow(user.id)
    const multi = multiDayTemplateRow(user.id)
    const others = templateRow("someone-else", { name: "לא שלי" })
    fake.rows("templates").push(single, multi, others)
    return { user, fake, single, multi }
}

function render(
    user: TestUser,
    fake: Fake,
    path = "/create-events",
    storage: DeviceStorage = createMemoryStorage(),
) {
    return renderApp({ fake, signedInAs: user, path, now: NOW, storage })
}

const select = (name: string) => screen.getByRole("combobox", { name })

const templateRequests = (fake: Fake, method = "select") =>
    fake.requests.filter(
        (request) => request.table === "templates" && request.method === method,
    )

const inserts = (fake: Fake, table: string) =>
    fake.requests.filter(
        (request) => request.table === table && request.method === "insert",
    )

/** The names in the chooser's templates list, in order. */
async function listedNames() {
    const list = await screen.findByRole("region", { name: "תבניות" })
    await waitFor(() =>
        expect(within(list).queryByRole("status")).not.toBeInTheDocument(),
    )
    return within(list)
        .queryAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
}

async function pickAddress() {
    const input = screen.getByRole("combobox", { name: "חפש כתובת" })
    await userEvent.click(input)
    await userEvent.type(input, "הרצל")
    await userEvent.click(
        await screen.findByRole("option", { name: HERZL.label }),
    )
}

describe("templates", () => {
    it("aren't requested at boot or by the calendar", async () => {
        const { user, fake } = setup()
        render(user, fake, "/")
        expect(await eventTitles()).toContain("ג'אם ותיק")
        await waitFor(() =>
            expect(
                fake.requests.some((request) => request.table === "users"),
            ).toBe(true),
        )
        expect(
            fake.requests.filter((request) => request.table === "templates"),
        ).toEqual([])
    })

    it("are listed under the chooser, only the user's, newest first", async () => {
        const { user, fake } = setup()
        fake.rows("templates").push(
            templateRow(user.id, {
                name: "שיעור שני",
                created_at: "2026-10-20T10:00:00+00:00",
            }),
        )
        render(user, fake)

        expect(await listedNames()).toEqual([
            "שיעור שני",
            "ג'אם שישי",
            "ריטריט קיץ",
        ])
        const [read] = templateRequests(fake)
        expect(read.filters).toContainEqual({
            op: "eq",
            column: "user_id",
            value: user.id,
        })
        expect(read.token).toBe(fake.auth.accessToken())
        // Legacy's four choices, templates first.
        const choices = screen.getByRole("navigation", { name: "יצירת אירוע" })
        expect(
            within(choices)
                .getAllByRole("link")
                .map((link) => [link.textContent, link.getAttribute("href")]),
        ).toEqual([
            ["תבנית חד יומית", "/create-events/single-day?isTemplate=true"],
            ["אירוע חד יומי", "/create-events/single-day"],
            ["תבנית רב יומית", "/create-events/multi-day?isTemplate=true"],
            ["אירוע רב יומי", "/create-events/multi-day"],
        ])
        expect(
            screen.queryByText("כדאי ליצור תבניות עבור אירועים חוזרים"),
        ).not.toBeInTheDocument()
    })

    it("are suggested to a user who has none", async () => {
        const user = testUser("creator")
        const fake = createFakeDataClient()
        render(user, fake)

        expect(
            await screen.findByText("כדאי ליצור תבניות עבור אירועים חוזרים"),
        ).toBeInTheDocument()
        expect(await listedNames()).toEqual([])
    })

    it("save a single-day template as legacy's rows are, and list it at once", async () => {
        const { user, fake } = setup()
        const { router } = render(
            user,
            fake,
            "/create-events/single-day?isTemplate=true",
        )

        expect(
            await screen.findByRole("heading", { name: "תבנית חד יומית" }),
        ).toBeInTheDocument()
        // No day, no recurrence, no hide switch: a template has none.
        expect(screen.queryByLabelText("תאריך")).not.toBeInTheDocument()
        expect(screen.queryByRole("switch")).not.toBeInTheDocument()
        expect(
            screen.queryByRole("checkbox", { name: /אירוע חוזר/ }),
        ).not.toBeInTheDocument()

        await userEvent.type(
            screen.getByRole("textbox", { name: "שם התבנית" }),
            "שיעור בוקר",
        )
        await userEvent.type(
            screen.getByRole("textbox", { name: "*כותרת האירוע" }),
            "שיעור בוקר בפארק",
        )
        await userEvent.selectOptions(select("אזור"), "jerusalem")
        await pickAddress()
        await userEvent.selectOptions(select("סוג האירוע"), "class")
        fireEvent.change(screen.getByLabelText("שעת התחלה"), {
            target: { value: "08:00" },
        })
        fireEvent.change(screen.getByLabelText("שעת סיום"), {
            target: { value: "09:30" },
        })
        await userEvent.click(
            screen.getByRole("button", { name: "יצירת תבנית" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake, "templates")
        expect(insert.body).toEqual({
            id: expect.any(String),
            user_id: user.id,
            name: "שיעור בוקר",
            title: "שיעור בוקר בפארק",
            description: "",
            district: "jerusalem",
            address: {
                label: HERZL.label,
                place_id: HERZL.placeId,
                en_label: HERZL.english,
            },
            organisations: [],
            links: [],
            price: [],
            // Times on the day it was saved, as legacy's.
            segments: [
                {
                    type: "class",
                    startTime: "2026-10-30T06:00:00.000Z",
                    endTime: "2026-10-30T07:30:00.000Z",
                    tags: ["everyone"],
                    teachers: [],
                },
            ],
            type: "",
            is_multi_day: false,
            multi_day_teachers: [],
            owners: [],
            created_at: NOW.toISOString(),
            updated_at: NOW.toISOString(),
        })
        expect(insert.token).toBe(fake.auth.accessToken())
        // Nothing to translate: templates have no `lng_titles`.
        expect(fake.functions.calls).toEqual([])
        expect(await listedNames()).toContain("שיעור בוקר")
    })

    it("save a multi-day template with its type, teachers and creator", async () => {
        const { user, fake } = setup()
        const { router } = render(
            user,
            fake,
            "/create-events/multi-day?isTemplate=true",
        )

        await userEvent.type(
            await screen.findByRole("textbox", { name: "שם התבנית" }),
            "סדנת סתיו",
        )
        await userEvent.type(
            screen.getByRole("textbox", { name: "*כותרת האירוע" }),
            "סדנה בגליל",
        )
        await userEvent.selectOptions(select("אזור"), "galilee")
        await pickAddress()
        expect(screen.queryByLabelText("תאריך התחלה")).not.toBeInTheDocument()
        await userEvent.selectOptions(select("סוג האירוע"), "workshop")
        await userEvent.click(
            screen.getByRole("button", { name: "יצירת תבנית" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake, "templates")
        expect(insert.body).toMatchObject({
            name: "סדנת סתיו",
            title: "סדנה בגליל",
            district: "galilee",
            segments: [],
            type: "workshop",
            is_multi_day: true,
            multi_day_teachers: [],
            owners: [{ value: user.id, label: user.name }],
        })
        expect(insert.body).not.toHaveProperty("start_date")
        expect(insert.body).not.toHaveProperty("hide")
    })

    it("fill a new single-day event, which is saved with its source template", async () => {
        const { user, fake, single } = setup()
        const { router } = render(user, fake, "/create-events/single-day")

        const picker = await screen.findByRole("combobox", {
            name: "בחירת תבנית",
        })
        // Only single-day templates are offered.
        await waitFor(() =>
            expect(
                within(picker)
                    .getAllByRole("option")
                    .map((option) => option.textContent),
            ).toEqual(["בחירת תבנית", "ג'אם שישי"]),
        )
        await userEvent.selectOptions(picker, single.id)

        expect(
            screen.getByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("ג'אם שישי בבוקר")
        expect(select("אזור")).toHaveValue("center")
        expect(screen.getByLabelText("שעת התחלה")).toHaveValue("10:00")
        expect(screen.getByLabelText("שעת סיום")).toHaveValue("12:30")
        // The day is never copied.
        expect(screen.getByLabelText("תאריך")).toHaveValue("")

        fireEvent.change(screen.getByLabelText("תאריך"), {
            target: { value: "2026-11-06" },
        })
        await userEvent.click(
            screen.getByRole("button", { name: "יצירת אירוע" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake, "ci_events")
        expect(insert.body).toMatchObject({
            source_template_id: single.id,
            title: "ג'אם שישי בבוקר",
            description: "מביאים מים",
            district: "center",
            address: {
                label: "דיזנגוף 50",
                place_id: "P-DIZ",
                en_label: "Dizengoff 50",
            },
            links: [{ title: "הרשמה", link: "https://x.example" }],
            price: [{ title: "כניסה", sum: 40 }],
            start_date: "2026-11-06",
            segments: [
                {
                    type: "jam",
                    startTime: "2026-11-06T08:00:00.000Z",
                    endTime: "2026-11-06T10:30:00.000Z",
                    tags: ["everyone"],
                    teachers: [
                        { label: TEACHER.bio_name, value: TEACHER.user_id },
                    ],
                },
            ],
        })
        // The address came with the template: no Places lookup.
        expect(fake.places.loads).toBe(0)
        // The tagged teacher is tagged on the event too.
        expect(inserts(fake, "ci_events_users_junction")).toHaveLength(1)
    })

    it("fill a new multi-day event, which is saved with its source template", async () => {
        const { user, fake, multi } = setup()
        const { router } = render(user, fake, "/create-events/multi-day")

        const picker = await screen.findByRole("combobox", {
            name: "בחירת תבנית",
        })
        await waitFor(() =>
            expect(within(picker).getAllByRole("option")).toHaveLength(2),
        )
        await userEvent.selectOptions(picker, multi.id)
        expect(select("סוג האירוע")).toHaveValue("retreat")
        expect(screen.getByLabelText("תאריך התחלה")).toHaveValue("")

        fireEvent.change(screen.getByLabelText("תאריך התחלה"), {
            target: { value: "2026-11-19" },
        })
        fireEvent.change(screen.getByLabelText("תאריך סיום"), {
            target: { value: "2026-11-21" },
        })
        await userEvent.click(
            screen.getByRole("button", { name: "יצירת אירוע" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake, "ci_events")
        expect(insert.body).toMatchObject({
            source_template_id: multi.id,
            title: "ריטריט במדבר",
            type: "retreat",
            start_date: "2026-11-19",
            end_date: "2026-11-21",
            multi_day_teachers: [
                { label: TEACHER.bio_name, value: TEACHER.user_id },
            ],
        })
    })

    it("are edited from the list, sending only what changed", async () => {
        const { user, fake, single } = setup()
        render(user, fake)
        await listedNames()
        const reads = templateRequests(fake).length

        await userEvent.click(
            screen.getByRole("button", { name: "עריכת ג'אם שישי" }),
        )
        const dialog = await screen.findByRole("dialog", {
            name: "עריכת תבנית חד יומית",
        })
        const name = within(dialog).getByRole("textbox", { name: "שם התבנית" })
        expect(name).toHaveValue("ג'אם שישי")
        expect(
            within(dialog).getByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("ג'אם שישי בבוקר")
        await userEvent.clear(name)
        await userEvent.type(name, "ג'אם שבת")
        await userEvent.click(
            within(dialog).getByRole("button", { name: "עדכון תבנית" }),
        )

        await waitFor(() =>
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        )
        const [update] = templateRequests(fake, "update")
        expect(update.body).toEqual({
            name: "ג'אם שבת",
            updated_at: NOW.toISOString(),
        })
        expect(update.filters).toEqual(
            expect.arrayContaining([
                { op: "eq", column: "id", value: single.id },
                { op: "eq", column: "user_id", value: user.id },
            ]),
        )
        expect(await listedNames()).toEqual(["ג'אם שבת", "ריטריט קיץ"])
        expect(templateRequests(fake)).toHaveLength(reads)
    })

    it("are deleted after a confirm, and leave the list without a refetch", async () => {
        const { user, fake, multi } = setup()
        render(user, fake)
        await listedNames()
        const reads = templateRequests(fake).length

        await userEvent.click(
            screen.getByRole("button", { name: "מחיקת ריטריט קיץ" }),
        )
        let dialog = await screen.findByRole("dialog", { name: "מחיקת תבנית" })
        expect(dialog).toHaveTextContent(
            "האם אתם בטוחים שאתם רוצים למחוק את התבנית ? מחיקת התבנית תמחק את כל הארועים שנוצרו מתוך התבנית.",
        )
        await userEvent.click(
            within(dialog).getByRole("button", { name: "ביטול" }),
        )
        expect(templateRequests(fake, "delete")).toEqual([])
        expect(await listedNames()).toContain("ריטריט קיץ")

        await userEvent.click(
            screen.getByRole("button", { name: "מחיקת ריטריט קיץ" }),
        )
        dialog = await screen.findByRole("dialog", { name: "מחיקת תבנית" })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "מחיקה" }),
        )

        await waitFor(() =>
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        )
        const [remove] = templateRequests(fake, "delete")
        expect(remove.filters).toEqual(
            expect.arrayContaining([
                { op: "eq", column: "id", value: multi.id },
                { op: "eq", column: "user_id", value: user.id },
            ]),
        )
        expect(await listedNames()).toEqual(["ג'אם שישי"])
        expect(templateRequests(fake)).toHaveLength(reads)
    })

    it("keep a failed save's edits and say so", async () => {
        const { user, fake } = setup()
        render(user, fake, "/create-events/multi-day?isTemplate=true")
        await userEvent.type(
            await screen.findByRole("textbox", { name: "שם התבנית" }),
            "נכשל",
        )
        await userEvent.type(
            screen.getByRole("textbox", { name: "*כותרת האירוע" }),
            "סדנה",
        )
        await userEvent.selectOptions(select("אזור"), "galilee")
        await pickAddress()
        await userEvent.selectOptions(select("סוג האירוע"), "workshop")
        fake.failTable("templates", "db exploded")

        await userEvent.click(
            screen.getByRole("button", { name: "יצירת תבנית" }),
        )

        expect(
            await screen.findByText("השמירה נכשלה, נסו שוב"),
        ).toBeInTheDocument()
        expect(screen.getByRole("textbox", { name: "שם התבנית" })).toHaveValue(
            "נכשל",
        )
    })

    it("replace a restored draft when chosen, and keep drafts of their own", async () => {
        const { user, fake, single } = setup()
        const storage = createMemoryStorage()
        const first = render(user, fake, "/create-events/single-day", storage)
        await userEvent.type(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
            "טיוטה שלי",
        )
        first.unmount()

        // A new template's form is its own: the event's draft isn't in it,
        // and what is typed there is kept apart.
        const second = render(
            user,
            fake,
            "/create-events/single-day?isTemplate=true",
            storage,
        )
        expect(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("")
        await userEvent.type(
            screen.getByRole("textbox", { name: "שם התבנית" }),
            "תבנית בעבודה",
        )
        expect(storage.getItem(SINGLE_DAY_TEMPLATE_DRAFT_KEY)).toContain(
            "תבנית בעבודה",
        )
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toContain("טיוטה שלי")
        second.unmount()

        // The event's draft is restored; choosing a template replaces it,
        // as legacy's picker did, and the draft follows.
        const third = render(user, fake, "/create-events/single-day", storage)
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        expect(title).toHaveValue("טיוטה שלי")
        const picker = select("בחירת תבנית")
        await waitFor(() =>
            expect(within(picker).getAllByRole("option")).toHaveLength(2),
        )
        await userEvent.selectOptions(picker, single.id)
        expect(title).toHaveValue("ג'אם שישי בבוקר")
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toContain(single.id)
        third.unmount()

        // After a reload, the form still knows its template.
        const { router } = render(
            user,
            fake,
            "/create-events/single-day",
            storage,
        )
        expect(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("ג'אם שישי בבוקר")
        await waitFor(() =>
            expect(select("בחירת תבנית")).toHaveValue(single.id),
        )
        fireEvent.change(screen.getByLabelText("תאריך"), {
            target: { value: "2026-11-06" },
        })
        await userEvent.click(
            screen.getByRole("button", { name: "יצירת אירוע" }),
        )
        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        expect(inserts(fake, "ci_events")[0].body).toMatchObject({
            source_template_id: single.id,
        })
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toBeNull()
        // The template's draft is still there for its own form.
        expect(storage.getItem(SINGLE_DAY_TEMPLATE_DRAFT_KEY)).not.toBeNull()
    })

    it("refresh the event lists when one is deleted, as its events may go with it", async () => {
        const { user, fake, multi } = setup()
        const { router } = render(user, fake, "/")
        expect(await eventTitles()).toContain("ג'אם ותיק")
        await act(() => router.navigate("/create-events"))
        await listedNames()
        const eventReads = () =>
            fake.requests.filter(
                (request) =>
                    request.table === "ci_events" &&
                    request.method === "select",
            ).length
        const before = eventReads()

        await userEvent.click(
            screen.getByRole("button", { name: "מחיקת ריטריט קיץ" }),
        )
        const dialog = await screen.findByRole("dialog", {
            name: "מחיקת תבנית",
        })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "מחיקה" }),
        )
        await waitFor(() =>
            expect(fake.rows("templates").map(({ id }) => id)).not.toContain(
                multi.id,
            ),
        )
        // Back on the calendar within its fresh window: refetched all the
        // same (with the cascade legacy warned of, its events are gone).
        await act(() => router.navigate("/"))
        await waitFor(() => expect(eventReads()).toBe(before + 1))
    })

    it("give every event of a recurring series their source template", async () => {
        const { user, fake, single } = setup()
        const { router } = render(user, fake, "/create-events/single-day")
        const picker = await screen.findByRole("combobox", {
            name: "בחירת תבנית",
        })
        await waitFor(() =>
            expect(within(picker).getAllByRole("option")).toHaveLength(2),
        )
        await userEvent.selectOptions(picker, single.id)
        fireEvent.change(screen.getByLabelText("תאריך"), {
            target: { value: "2026-11-06" },
        })
        await userEvent.click(
            screen.getByRole("checkbox", { name: /אירוע חוזר/ }),
        )
        await userEvent.selectOptions(select("תדירות"), "weekly")
        fireEvent.change(screen.getByLabelText("תאריך סיום"), {
            target: { value: "2026-11-20" },
        })
        await userEvent.click(
            screen.getByRole("button", { name: "יצירת אירוע" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake, "ci_events")
        expect(
            insert.rows!.map((row) => [row.start_date, row.source_template_id]),
        ).toEqual([
            ["2026-11-06", single.id],
            ["2026-11-13", single.id],
            ["2026-11-20", single.id],
        ])
    })

    it("are forgotten by a draft once deleted, so its event still saves", async () => {
        const { user, fake, single } = setup()
        const storage = createMemoryStorage()
        const first = render(user, fake, "/create-events/single-day", storage)
        const picker = await screen.findByRole("combobox", {
            name: "בחירת תבנית",
        })
        await waitFor(() =>
            expect(within(picker).getAllByRole("option")).toHaveLength(2),
        )
        await userEvent.selectOptions(picker, single.id)
        first.unmount()
        // Deleted elsewhere (another device) before the draft comes back.
        const templates = fake.rows("templates")
        templates.splice(templates.indexOf(single), 1)

        const { router } = render(
            user,
            fake,
            "/create-events/single-day",
            storage,
        )
        expect(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("ג'אם שישי בבוקר")
        await waitFor(() =>
            expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).not.toContain(
                single.id,
            ),
        )
        expect(select("בחירת תבנית")).toHaveValue("")
        fireEvent.change(screen.getByLabelText("תאריך"), {
            target: { value: "2026-11-06" },
        })
        await userEvent.click(
            screen.getByRole("button", { name: "יצירת אירוע" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const sent = inserts(fake, "ci_events")
        expect(sent).toHaveLength(1)
        expect(sent[0].body).toMatchObject({
            title: "ג'אם שישי בבוקר",
            source_template_id: null,
        })
    })

    it("are left out of an event when deleted just before it is saved", async () => {
        const { user, fake, single } = setup()
        const { router } = render(user, fake, "/create-events/single-day")
        const picker = await screen.findByRole("combobox", {
            name: "בחירת תבנית",
        })
        await waitFor(() =>
            expect(within(picker).getAllByRole("option")).toHaveLength(2),
        )
        await userEvent.selectOptions(picker, single.id)
        fireEvent.change(screen.getByLabelText("תאריך"), {
            target: { value: "2026-11-06" },
        })
        // Deleted elsewhere while the form is open: the insert's foreign
        // key fails, and the event is saved without it.
        const templates = fake.rows("templates")
        templates.splice(templates.indexOf(single), 1)
        await userEvent.click(
            screen.getByRole("button", { name: "יצירת אירוע" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const sent = inserts(fake, "ci_events")
        expect(sent.map(({ body }) => body?.source_template_id)).toEqual([
            single.id,
            null,
        ])
        expect(fake.rows("ci_events").map(({ title }) => title)).toContain(
            "ג'אם שישי בבוקר",
        )
    })
})
