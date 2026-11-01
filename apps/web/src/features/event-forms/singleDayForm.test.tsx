import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import {
    createMemoryStorage,
    type DeviceStorage,
} from "../../app/deviceStorage"
import type { SignedInRole } from "../../app/viewer"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { fakeTranslation } from "../../test/fakeFunctions"
import { renderApp } from "../../test/renderApp"
import { testUser, type TestUser } from "../../test/testUsers"
import {
    bio,
    event,
    eventCard,
    eventTitles,
    segment,
} from "../../test/testEvents"
import { LOOKUP_TIMEOUT_MS } from "@ci-calendar/core/lib/timeout"
import { SINGLE_DAY_DRAFT_KEY, SINGLE_DAY_EDIT_DRAFT_KEY } from "./draftKeys"

const NOW = new Date("2026-10-30T09:00:00Z")

type Fake = ReturnType<typeof createFakeDataClient>

const TEACHER = bio({ bio_name: "נועה המורה", user_type: "creator" })
const ORG = bio({ bio_name: "סטודיו תנועה", user_type: "org" })
const HIDDEN_BIO = bio({ bio_name: "לא מתייגים", allow_tagging: false })

const HERZL = {
    placeId: "P-HERZL",
    label: "הרצל 1, תל אביב",
    english: "Herzl St 1, Tel Aviv-Yafo, Israel",
}

/** A creator, taggable bios and a Places result, with the given rows. */
function setup(role: SignedInRole = "creator") {
    const user = testUser(role)
    const fake = createFakeDataClient()
    fake.rows("public_bio").push(TEACHER, ORG, HIDDEN_BIO)
    fake.rows("ci_events").push(
        event({ title: "ג'אם ותיק", user_id: "someone-else" }),
    )
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

const field = (name: string) => screen.getByRole("textbox", { name })
const select = (name: string) => screen.getByRole("combobox", { name })

async function pickAddress(text = "הרצל") {
    const input = screen.getByRole("combobox", { name: "חפש כתובת" })
    await userEvent.click(input)
    await userEvent.type(input, text)
    await userEvent.click(
        await screen.findByRole("option", { name: HERZL.label }),
    )
}

/** Fills every required field of a new event. */
async function fillEvent(title = "ג'אם שישי") {
    await userEvent.type(
        await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        title,
    )
    await userEvent.selectOptions(select("אזור"), "center")
    await pickAddress()
    fireEvent.change(screen.getByLabelText("תאריך"), {
        target: { value: "2026-11-06" },
    })
    await userEvent.selectOptions(select("סוג האירוע"), "jam")
    fireEvent.change(screen.getByLabelText("שעת התחלה"), {
        target: { value: "19:00" },
    })
    fireEvent.change(screen.getByLabelText("שעת סיום"), {
        target: { value: "21:30" },
    })
}

const submit = () =>
    userEvent.click(screen.getByRole("button", { name: "יצירת אירוע" }))

const inserts = (fake: Fake, table = "ci_events") =>
    fake.requests.filter(
        (request) => request.table === table && request.method === "insert",
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

describe("the single-day event form", () => {
    it("is for creators, orgs and admins only", async () => {
        const anonymous = renderApp({ path: "/create-events/single-day" })
        await waitFor(() =>
            expect(anonymous.router.state.location.pathname).toBe("/login"),
        )
        anonymous.unmount()

        const { user, fake } = setup("profile")
        const { router } = render(user, fake)
        await waitFor(() => expect(router.state.location.pathname).toBe("/"))
    })

    it("creates an event that shows on the calendar and in my events at once, with no list refetch", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake, "/manage-events")
        await screen.findByText("נראה שעדיין אין לכם אירועים")
        await act(() => router.navigate("/"))
        await eventTitles()
        await act(() => router.navigate("/create-events/single-day"))

        await fillEvent()
        const readsBefore = eventReads(fake).length
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake)
        expect(insert.body).toMatchObject({
            title: "ג'אם שישי",
            lng_titles: { en: "ג'אם שישי [en]", ru: "ג'אם שישי [ru]" },
            district: "center",
            address: {
                label: HERZL.label,
                place_id: HERZL.placeId,
                en_label: HERZL.english,
            },
            start_date: "2026-11-06",
            end_date: "2026-11-06",
            hide: false,
            is_multi_day: false,
            type: "",
            user_id: user.id,
            segments: [
                {
                    type: "jam",
                    startTime: "2026-11-06T17:00:00.000Z",
                    endTime: "2026-11-06T19:30:00.000Z",
                    tags: ["everyone"],
                    teachers: [],
                },
            ],
            links: [],
            price: [],
            organisations: [],
        })
        expect(insert.token).toBe(fake.auth.accessToken())
        // The save refetched no list of events.
        expect(eventReads(fake)).toHaveLength(readsBefore)

        // From here on, any request for events hangs: what shows comes from
        // the save's response, in the cache.
        fake.holdTable("ci_events")
        await act(() => router.navigate("/"))
        expect(await eventTitles()).toContain("ג'אם שישי")
        await act(() => router.navigate("/manage-events"))
        expect(await myEventTitles()).toContain("ג'אם שישי")
    })

    it("saves with the source text when translation and the English address fail", async () => {
        const { user, fake } = setup()
        fake.functions.fail("translate")
        fake.places.failEnglish()
        const { router } = render(user, fake)

        await fillEvent("שיעור ערב")
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake)
        // The failed languages are left out: readers show the Hebrew.
        expect(insert.body).toMatchObject({
            title: "שיעור ערב",
            lng_titles: {},
            address: { label: HERZL.label, place_id: HERZL.placeId },
        })
        expect(insert.body?.address).not.toHaveProperty("en_label")
        expect(
            fake.rows("ci_events").filter((row) => row.user_id === user.id),
        ).toHaveLength(1)
    })

    it("saves with the source text when the lookups never answer", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        try {
            const { user, fake } = setup()
            fake.places.hangEnglish()
            fake.functions.hold("translate")
            const { router } = render(user, fake)
            await fillEvent()

            await submit()
            await waitFor(() => expect(fake.functions.calls).toHaveLength(2))
            // The field's lookup at pick time hung too: the save asks again.
            await waitFor(() =>
                expect(
                    fake.places.calls.filter(
                        (call) => call.method === "englishAddress",
                    ),
                ).toHaveLength(2),
            )
            expect(inserts(fake)).toHaveLength(0)
            await act(() => vi.advanceTimersByTimeAsync(LOOKUP_TIMEOUT_MS))

            await waitFor(() =>
                expect(router.state.location.pathname).toBe("/create-events"),
            )
            expect(inserts(fake)[0].body).toMatchObject({
                title: "ג'אם שישי",
                lng_titles: {},
            })
            expect(inserts(fake)[0].body?.address).not.toHaveProperty(
                "en_label",
            )
        } finally {
            vi.useRealTimers()
        }
    })

    it("gets the English address when the place is picked, in the suggestions' session", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent()

        const [suggest, english] = fake.places.calls
        expect(suggest).toMatchObject({ method: "suggest" })
        expect(english).toEqual({
            method: "englishAddress",
            placeId: HERZL.placeId,
            session: suggest.session,
        })
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        // Nothing more asked at save.
        expect(fake.places.calls).toHaveLength(2)
        expect(inserts(fake)[0].body?.address).toEqual({
            label: HERZL.label,
            place_id: HERZL.placeId,
            en_label: HERZL.english,
        })
    })

    it("asks for the translations and a missing English address at once", async () => {
        const { user, fake } = setup()
        fake.places.failEnglish()
        fake.functions.hold("translate")
        render(user, fake)
        await fillEvent()
        fake.places.healEnglish()

        await submit()

        await waitFor(() => expect(fake.functions.calls).toHaveLength(2))
        expect(fake.functions.calls.map((call) => call.body)).toEqual([
            expect.objectContaining({ text: "ג'אם שישי", targetLang: "ru" }),
            expect.objectContaining({ text: "ג'אם שישי", targetLang: "en" }),
        ])
        await waitFor(() =>
            expect(fake.places.calls).toContainEqual({
                method: "englishAddress",
                placeId: HERZL.placeId,
                session: null,
            }),
        )
        // Nothing is stored before the translations are back.
        expect(inserts(fake)).toHaveLength(0)

        fake.functions.release("translate")
        await waitFor(() => expect(inserts(fake)).toHaveLength(1))
        expect(inserts(fake)[0].body?.address).toMatchObject({
            en_label: HERZL.english,
        })
    })

    it("saves a restored draft without loading Google Places", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        const first = render(user, fake, undefined, storage)
        await fillEvent()
        first.unmount()
        const loads = fake.places.loads

        const { router } = render(user, fake, undefined, storage)
        expect(await screen.findByDisplayValue("ג'אם שישי")).toBeInTheDocument()
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        expect(fake.places.loads).toBe(loads)
        expect(inserts(fake)[0].body?.address).toMatchObject({
            en_label: HERZL.english,
        })
    })

    it("makes typed links web addresses, and refuses other schemes", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent()
        await userEvent.click(
            screen.getByRole("button", { name: "הוספת קישור" }),
        )
        await userEvent.type(field("כותרת"), "הרשמה")
        await userEvent.type(field("קישור"), "javascript:alert(1)")

        await submit()

        expect(field("קישור")).toHaveAccessibleDescription(
            "נא להזין קישור לאתר (https://…)",
        )
        expect(inserts(fake)).toHaveLength(0)

        await userEvent.clear(field("קישור"))
        await userEvent.type(field("קישור"), "example.com/signup")
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        expect(inserts(fake)[0].body?.links).toEqual([
            { title: "הרשמה", link: "https://example.com/signup" },
        ])
    })

    it("drops the draft once the form is clean again", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        render(user, fake, undefined, storage)
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        await userEvent.type(title, "א")
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).not.toBeNull()

        await userEvent.clear(title)

        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toBeNull()
    })

    it("shows legacy's errors and sends nothing while the form is invalid", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await screen.findByRole("textbox", { name: "*כותרת האירוע" })
        await userEvent.click(
            screen.getByRole("button", { name: "הוספת מחיר" }),
        )

        await submit()

        expect(
            await screen.findByText("ערכים שגויים, נא לבדוק את הטופס"),
        ).toBeInTheDocument()
        for (const name of ["*כותרת האירוע"]) {
            expect(field(name)).toHaveAttribute("aria-invalid", "true")
        }
        for (const name of ["אזור", "סוג האירוע", "חפש כתובת"]) {
            expect(select(name)).toHaveAttribute("aria-invalid", "true")
        }
        for (const label of ["תאריך", "שעת התחלה", "שעת סיום"]) {
            expect(screen.getByLabelText(label)).toHaveAttribute(
                "aria-invalid",
                "true",
            )
        }
        expect(field("כותרת")).toHaveAccessibleDescription("שדה חובה")
        expect(screen.getAllByText("שדה חובה").length).toBeGreaterThanOrEqual(8)
        expect(inserts(fake)).toHaveLength(0)
        expect(fake.functions.calls).toHaveLength(0)
    })

    it("offers days from today up to a year ahead, as legacy's picker did", async () => {
        const { user, fake } = setup()
        render(user, fake)

        const date = await screen.findByLabelText("תאריך")
        expect(date).toHaveAttribute("min", "2026-10-30")
        expect(date).toHaveAttribute("max", "2027-10-30")
    })

    it("refuses a day that has passed", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await fillEvent()
        fireEvent.change(screen.getByLabelText("תאריך"), {
            target: { value: "2026-10-29" },
        })

        await submit()

        expect(screen.getByLabelText("תאריך")).toHaveAccessibleDescription(
            "התאריך עבר",
        )
        expect(inserts(fake)).toHaveLength(0)
    })

    it("takes today from Jerusalem: after midnight there, yesterday has passed", async () => {
        const { user, fake } = setup()
        // 00:30 on 31 October in Jerusalem, still the 30th in UTC.
        renderApp({
            fake,
            signedInAs: user,
            path: "/create-events/single-day",
            now: new Date("2026-10-30T22:30:00Z"),
        })
        await fillEvent()
        fireEvent.change(screen.getByLabelText("תאריך"), {
            target: { value: "2026-10-30" },
        })

        await submit()

        expect(screen.getByLabelText("תאריך")).toHaveAccessibleDescription(
            "התאריך עבר",
        )
        expect(screen.getByLabelText("תאריך")).toHaveAttribute(
            "min",
            "2026-10-31",
        )
        expect(inserts(fake)).toHaveLength(0)
    })

    it("tags teachers and organisations that allow it, and keeps typed names", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent()

        const teachers = screen.getByRole("combobox", {
            name: "מורים - ניתן להוסיף מורים שלא נמצאים ברשימה",
        })
        await userEvent.click(teachers)
        expect(
            screen.queryByRole("option", { name: "לא מתייגים" }),
        ).not.toBeInTheDocument()
        await userEvent.type(teachers, "נועה")
        await userEvent.click(
            screen.getByRole("option", { name: "נועה המורה" }),
        )
        await userEvent.type(teachers, "דנה מהכפר{Enter}")
        const organisations = screen.getByRole("combobox", { name: "ארגונים" })
        await userEvent.click(organisations)
        await userEvent.click(
            screen.getByRole("option", { name: "סטודיו תנועה" }),
        )
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake)
        expect(insert.body).toMatchObject({
            organisations: [{ label: "סטודיו תנועה", value: ORG.user_id }],
            segments: [
                expect.objectContaining({
                    teachers: [
                        { label: "נועה המורה", value: TEACHER.user_id },
                        { label: "דנה מהכפר", value: "דנה מהכפר" },
                    ],
                }),
            ],
        })
        const [junction] = inserts(fake, "ci_events_users_junction")
        expect(junction.rows).toEqual([
            { ci_event_id: insert.body?.id, user_id: TEACHER.user_id },
            { ci_event_id: insert.body?.id, user_id: ORG.user_id },
        ])
        // The saved event links the teacher's bio at once.
        await act(() => router.navigate("/"))
        await userEvent.click(
            within(await eventCard("ג'אם שישי")).getByRole("link"),
        )
        const dialog = await screen.findByRole("dialog", { name: "ג'אם שישי" })
        expect(
            within(dialog).getByRole("button", { name: "נועה המורה" }),
        ).toBeInTheDocument()
    })

    it("doesn't load Google Places until the address field is used", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await userEvent.type(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
            "ג'אם",
        )
        expect(fake.places.loads).toBe(0)

        await userEvent.click(
            screen.getByRole("combobox", { name: "חפש כתובת" }),
        )
        expect(fake.places.loads).toBe(1)
    })

    it("keeps an unsaved draft across a reload, and drops it once saved", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        const first = render(user, fake, undefined, storage)
        await userEvent.type(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
            "טיוטה שלי",
        )
        await userEvent.selectOptions(select("אזור"), "jerusalem")
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toContain("טיוטה שלי")
        first.unmount()

        const { router } = render(user, fake, undefined, storage)
        expect(await screen.findByDisplayValue("טיוטה שלי")).toBeInTheDocument()
        expect(select("אזור")).toHaveValue("jerusalem")

        await pickAddress()
        fireEvent.change(screen.getByLabelText("תאריך"), {
            target: { value: "2026-11-06" },
        })
        await userEvent.selectOptions(select("סוג האירוע"), "class")
        fireEvent.change(screen.getByLabelText("שעת התחלה"), {
            target: { value: "10:00" },
        })
        fireEvent.change(screen.getByLabelText("שעת סיום"), {
            target: { value: "12:00" },
        })
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toBeNull()
    })

    it("forgets the draft when the user signs out", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        storage.setItem("single-day-draft-event", "{}")
        render(user, fake, undefined, storage)
        await userEvent.type(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
            "פרטי",
        )
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).not.toBeNull()

        await userEvent.click(screen.getByRole("button", { name: "פתח תפריט" }))
        await userEvent.click(
            await screen.findByRole("button", { name: "התנתק/י" }),
        )

        await waitFor(() =>
            expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toBeNull(),
        )
        // Legacy's draft too.
        expect(storage.getItem("single-day-draft-event")).toBeNull()
    })

    it("ignores another user's draft", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        storage.setItem(
            SINGLE_DAY_DRAFT_KEY,
            JSON.stringify({
                userId: "someone-else",
                eventId: null,
                values: { title: "לא שלי" },
            }),
        )
        render(user, fake, undefined, storage)

        expect(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("")
    })

    it("clears the form and its draft", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        render(user, fake, undefined, storage)
        await userEvent.type(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
            "משהו",
        )

        await userEvent.click(
            screen.getByRole("button", { name: "ניקוי טופס" }),
        )

        expect(field("*כותרת האירוע")).toHaveValue("")
        expect(storage.getItem(SINGLE_DAY_DRAFT_KEY)).toBeNull()
    })

    it("adds segments, links and prices", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent()
        await userEvent.click(
            screen.getByRole("button", { name: "הוספת אירוע המשך" }),
        )
        const part = screen.getByRole("group", { name: "אירוע המשך 1" })
        await userEvent.selectOptions(
            within(part).getByRole("combobox", { name: "סוג האירוע" }),
            "class",
        )
        fireEvent.change(within(part).getByLabelText("שעת התחלה"), {
            target: { value: "21:30" },
        })
        fireEvent.change(within(part).getByLabelText("שעת סיום"), {
            target: { value: "23:00" },
        })
        await userEvent.click(
            screen.getByRole("button", { name: "הוספת קישור" }),
        )
        await userEvent.type(field("כותרת"), "הרשמה")
        await userEvent.type(field("קישור"), "https://example.com")
        await userEvent.click(
            screen.getByRole("button", { name: "הוספת מחיר" }),
        )
        await userEvent.type(
            screen.getAllByRole("textbox", { name: "כותרת" })[1],
            "כניסה",
        )
        await userEvent.type(
            screen.getByRole("spinbutton", { name: "מחיר" }),
            "60",
        )
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        expect(inserts(fake)[0].body).toMatchObject({
            links: [{ title: "הרשמה", link: "https://example.com" }],
            price: [{ title: "כניסה", sum: 60 }],
            segments: [
                expect.objectContaining({ type: "jam" }),
                {
                    type: "class",
                    startTime: "2026-11-06T19:30:00.000Z",
                    endTime: "2026-11-06T21:00:00.000Z",
                    tags: [],
                    teachers: [],
                },
            ],
        })
    })

    it("can save a new event hidden: in my events, not on the calendar", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent("טיוטה")
        await userEvent.click(
            screen.getByRole("switch", { name: "הסתרת האירוע (טיוטה)" }),
        )
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        expect(inserts(fake)[0].body).toMatchObject({ hide: true })
        await act(() => router.navigate("/"))
        expect(await eventTitles()).not.toContain("טיוטה")
    })

    it("says so when the save fails, keeping what was typed", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await fillEvent()
        fake.failTable("ci_events", "boom")

        await submit()

        expect(
            await screen.findByText("השמירה נכשלה, נסו שוב"),
        ).toBeInTheDocument()
        expect(field("*כותרת האירוע")).toHaveValue("ג'אם שישי")
    })
})

describe("editing a single-day event", () => {
    function seeded() {
        const { user, fake } = setup()
        const mine = event({
            title: "שיעור שבועי",
            user_id: user.id,
            start_date: "2026-11-03",
            end_date: "2026-11-03",
            description: "תיאור",
            segments: [
                segment({
                    type: "class",
                    startTime: "2026-11-03T17:00:00.000Z",
                    endTime: "2026-11-03T19:00:00.000Z",
                    teachers: [{ label: "נועה המורה", value: TEACHER.user_id }],
                    tags: ["everyone"],
                }),
            ],
            lng_titles: { en: "Weekly class", ru: "Еженедельный урок" },
        })
        const other = event({ title: "אחר שלי", user_id: user.id })
        const theirs = event({ title: "של מישהו", user_id: "someone-else" })
        fake.rows("ci_events").push(mine, other, theirs)
        fake.rows("ci_events_users_junction").push({
            id: crypto.randomUUID(),
            ci_event_id: mine.id,
            user_id: TEACHER.user_id,
        })
        return { user, fake, mine, other, theirs }
    }

    const editPath = (id: string) => `/manage-events/edit-single-day/${id}`

    it("opens the event as saved", async () => {
        const { user, fake, mine } = seeded()
        render(user, fake, editPath(mine.id))

        expect(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("שיעור שבועי")
        expect(screen.getByLabelText("תאריך")).toHaveValue("2026-11-03")
        expect(screen.getByLabelText("שעת התחלה")).toHaveValue("19:00")
        expect(screen.getByLabelText("שעת סיום")).toHaveValue("21:00")
        expect(select("חפש כתובת")).toHaveValue("תל אביב")
        expect(screen.getByText("נועה המורה")).toBeInTheDocument()
    })

    it("updates only the changed columns of that one event of the user's, and the calendar and my events from the answer", async () => {
        const { user, fake, mine, other, theirs } = seeded()
        // My events and the calendar are cached first.
        const { router } = render(user, fake, "/manage-events")
        expect(await myEventTitles()).toContain("שיעור שבועי")
        await act(() => router.navigate("/"))
        expect(await eventTitles()).toContain("שיעור שבועי")
        await act(() => router.navigate(editPath(mine.id)))
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        await userEvent.clear(title)
        await userEvent.type(title, "שיעור חדש")
        // From here on every read of events hangs: what the pages show
        // comes from the save's answer, in the cache.
        fake.holdReads("ci_events")
        const readsBefore = eventReads(fake).length

        await userEvent.click(
            screen.getByRole("button", { name: "עדכון אירוע" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        const writes = fake.requests.filter(
            (request) =>
                request.method !== "select" && request.table !== "users",
        )
        expect(writes).toHaveLength(1)
        expect(writes[0]).toMatchObject({
            table: "ci_events",
            method: "update",
            filters: [
                { op: "eq", column: "id", value: mine.id },
                { op: "eq", column: "user_id", value: user.id },
            ],
        })
        expect(Object.keys(writes[0].body!).sort()).toEqual([
            "lng_titles",
            "title",
            "updated_at",
        ])
        expect(writes[0].body).toMatchObject({
            title: "שיעור חדש",
            lng_titles: { en: "שיעור חדש [en]", ru: "שיעור חדש [ru]" },
        })
        // The address didn't change: no English lookup.
        expect(fake.places.calls).toEqual([])
        const rows = fake.rows("ci_events")
        expect(rows.find((row) => row.id === other.id)).toMatchObject({
            title: "אחר שלי",
        })
        expect(rows.find((row) => row.id === theirs.id)).toMatchObject({
            title: "של מישהו",
        })
        expect(await myEventTitles()).toContain("שיעור חדש")
        await act(() => router.navigate("/"))
        const calendar = await eventTitles()
        expect(calendar).toContain("שיעור חדש")
        expect(calendar).not.toContain("שיעור שבועי")
        // The save asked for no list of events: the one read since is my
        // events' own on opening again (held, so its list is the answer's).
        expect(eventReads(fake).slice(readsBefore)).toMatchObject([
            {
                filters: [
                    { op: "eq", column: "user_id", value: user.id },
                    { op: "gte", column: "start_date" },
                ],
            },
        ])
    })

    it("moves the segments with a new date, and tags newly added teachers", async () => {
        const { user, fake, mine } = seeded()
        const { router } = render(user, fake, editPath(mine.id))
        await screen.findByRole("textbox", { name: "*כותרת האירוע" })
        fireEvent.change(screen.getByLabelText("תאריך"), {
            target: { value: "2026-11-10" },
        })
        const organisations = screen.getByRole("combobox", { name: "ארגונים" })
        await userEvent.click(organisations)
        await userEvent.click(
            screen.getByRole("option", { name: "סטודיו תנועה" }),
        )

        await userEvent.click(
            screen.getByRole("button", { name: "עדכון אירוע" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        const [update] = fake.requests.filter(
            (request) =>
                request.method === "update" && request.table === "ci_events",
        )
        expect(update.body).toMatchObject({
            start_date: "2026-11-10",
            end_date: "2026-11-10",
            segments: [
                expect.objectContaining({
                    startTime: "2026-11-10T17:00:00.000Z",
                    endTime: "2026-11-10T19:00:00.000Z",
                }),
            ],
        })
        expect(update.body).not.toHaveProperty("title")
        const [junction] = inserts(fake, "ci_events_users_junction")
        expect(junction.rows).toEqual([
            { ci_event_id: mine.id, user_id: ORG.user_id },
        ])
    })

    it("says so when the event was deleted meanwhile", async () => {
        const { user, fake, mine } = seeded()
        render(user, fake, editPath(mine.id))
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        await userEvent.type(title, "!")
        fake.beforeExecute((request) => {
            if (request.method === "update" && request.table === "ci_events") {
                const rows = fake.rows("ci_events")
                rows.splice(
                    rows.findIndex((row) => row.id === mine.id),
                    1,
                )
            }
        })

        await userEvent.click(
            screen.getByRole("button", { name: "עדכון אירוע" }),
        )

        expect(await screen.findByText(/האירוע לא נמצא/)).toBeInTheDocument()
    })

    it("keeps unsaved edits across a reload, for that event only", async () => {
        const { user, fake, mine, other } = seeded()
        const storage = createMemoryStorage()
        const first = render(user, fake, editPath(mine.id), storage)
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        await userEvent.type(title, " מעודכן")
        first.unmount()

        const second = render(user, fake, editPath(mine.id), storage)
        expect(
            await screen.findByDisplayValue("שיעור שבועי מעודכן"),
        ).toBeInTheDocument()
        second.unmount()

        render(user, fake, editPath(other.id), storage)
        expect(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("אחר שלי")
        expect(storage.getItem(SINGLE_DAY_EDIT_DRAFT_KEY)).toContain("מעודכן")
    })

    it("restores only the edited fields over newer server data", async () => {
        const { user, fake, mine } = seeded()
        const storage = createMemoryStorage()
        const first = render(user, fake, editPath(mine.id), storage)
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        await userEvent.type(title, " מעודכן")
        expect(storage.getItem(SINGLE_DAY_EDIT_DRAFT_KEY)).not.toContain(
            "תיאור",
        )
        first.unmount()
        // Changed elsewhere meanwhile.
        Object.assign(
            fake.rows("ci_events").find((row) => row.id === mine.id)!,
            { description: "תיאור חדש מהשרת" },
        )

        render(user, fake, editPath(mine.id), storage)

        expect(
            await screen.findByDisplayValue("שיעור שבועי מעודכן"),
        ).toBeInTheDocument()
        expect(
            screen.getByRole("textbox", { name: "תיאור האירוע" }),
        ).toHaveValue("תיאור חדש מהשרת")
    })

    it("keeps the English address when the same place is picked again", async () => {
        const { user, fake, mine } = seeded()
        fake.places.places.push({
            placeId: "P1",
            label: "תל אביב",
            english: "Somewhere else",
        })
        const { router } = render(user, fake, editPath(mine.id))
        const address = await screen.findByRole("combobox", {
            name: "חפש כתובת",
        })
        await userEvent.click(address)
        await userEvent.type(address, " ")
        await userEvent.click(
            await screen.findByRole("option", { name: "תל אביב" }),
        )

        await userEvent.click(
            screen.getByRole("button", { name: "עדכון אירוע" }),
        )

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        expect(
            fake.requests.filter(
                (request) =>
                    request.method === "update" &&
                    request.table === "ci_events",
            ),
        ).toEqual([])
        expect(
            fake.places.calls.filter(
                (call) => call.method === "englishAddress",
            ),
        ).toEqual([])
    })

    it("can't open someone else's event", async () => {
        const { user, fake, theirs } = seeded()
        render(user, fake, editPath(theirs.id))

        expect(await screen.findByText("האירוע לא נמצא")).toBeInTheDocument()
        expect(
            screen.queryByRole("textbox", { name: "*כותרת האירוע" }),
        ).not.toBeInTheDocument()
    })
})

describe("/create-events", () => {
    it("offers a new event and a new template, both single-day at first", async () => {
        const { user, fake } = setup()
        render(user, fake, "/create-events")

        expect(
            await screen.findByRole("link", { name: "אירוע חדש" }),
        ).toHaveAttribute("href", "/create-events/single-day")
        expect(
            screen.getByRole("link", { name: "תבנית חדשה" }),
        ).toHaveAttribute("href", "/create-events/single-day?isTemplate=true")
    })

    it("tells a user without a bio to make one before tagging themselves", async () => {
        const { user, fake } = setup()
        render(user, fake, "/create-events")
        expect(
            await screen.findByText(
                "על מנת לתייג את עצמכם בארועים צריך ליצור קודם פרופיל",
            ),
        ).toBeInTheDocument()
    })

    it("doesn't once they have one", async () => {
        const { user, fake } = setup()
        fake.rows("public_bio").push(
            bio({ user_id: user.id, bio_name: "אני", allow_tagging: false }),
        )
        render(user, fake, "/create-events")
        await screen.findByRole("link", { name: "אירוע חדש" })
        await waitFor(() =>
            expect(
                fake.requests.some((request) => request.table === "public_bio"),
            ).toBe(true),
        )
        expect(
            screen.queryByText(
                "על מנת לתייג את עצמכם בארועים צריך ליצור קודם פרופיל",
            ),
        ).not.toBeInTheDocument()
    })
})
