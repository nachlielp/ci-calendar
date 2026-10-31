import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import {
    createMemoryStorage,
    type DeviceStorage,
} from "../../app/deviceStorage"
import type { SignedInRole } from "../../app/viewer"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { fakeTranslation } from "../../test/fakeFunctions"
import { renderApp } from "../../test/renderApp"
import { testUser, type TestUser } from "../../test/testUsers"
import { bio, event, eventCard, eventTitles } from "../calendar/testEvents"
import { MULTI_DAY_DRAFT_KEY, MULTI_DAY_EDIT_DRAFT_KEY } from "./draftKeys"

const NOW = new Date("2026-10-30T09:00:00Z")

type Fake = ReturnType<typeof createFakeDataClient>

const TEACHER = bio({ bio_name: "נועה המורה", user_type: "creator" })
const ORG = bio({ bio_name: "סטודיו תנועה", user_type: "org" })

const TZOFAR = {
    placeId: "P-TZOFAR",
    label: "צופר",
    english: "Tzofar",
}

const NEW_PATH = "/create-events/multi-day"
const editPath = (id: string) => `/manage-events/edit-multi-day/${id}`

function setup(role: SignedInRole = "creator") {
    const user = testUser(role)
    const fake = createFakeDataClient()
    fake.rows("public_bio").push(TEACHER, ORG)
    fake.rows("ci_events").push(
        event({ title: "ג'אם ותיק", user_id: "someone-else" }),
    )
    fake.places.places.push(TZOFAR)
    fake.functions.handle("translate", fakeTranslation)
    return { user, fake }
}

function render(
    user: TestUser,
    fake: Fake,
    path = NEW_PATH,
    storage: DeviceStorage = createMemoryStorage(),
) {
    return renderApp({ fake, signedInAs: user, path, now: NOW, storage })
}

const field = (name: string) => screen.getByRole("textbox", { name })
const select = (name: string) => screen.getByRole("combobox", { name })
const setDay = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } })

async function pickAddress() {
    const input = screen.getByRole("combobox", { name: "חפש כתובת" })
    await userEvent.click(input)
    await userEvent.type(input, "צופ")
    await userEvent.click(
        await screen.findByRole("option", { name: TZOFAR.label }),
    )
}

/** Fills every required field of a new multi-day event. */
async function fillEvent(title = "ריטריט במדבר") {
    await userEvent.type(
        await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        title,
    )
    await userEvent.selectOptions(select("אזור"), "south")
    await pickAddress()
    setDay("תאריך התחלה", "2026-11-19")
    setDay("תאריך סיום", "2026-11-21")
    await userEvent.selectOptions(select("סוג האירוע"), "retreat")
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

/** A day of the month calendar, e.g. `dayButton(5, "בנובמבר")`. */
const dayButton = (date: number, month: string) =>
    screen.getByRole("button", { name: new RegExp(` ${date} ${month}`) })

describe("the multi-day event form", () => {
    it("is for creators, orgs and admins only", async () => {
        for (const path of [NEW_PATH, editPath(crypto.randomUUID())]) {
            const anonymous = renderApp({ path })
            await waitFor(() =>
                expect(anonymous.router.state.location.pathname).toBe("/login"),
            )
            anonymous.unmount()

            const { user, fake } = setup("profile")
            const profile = render(user, fake, path)
            await waitFor(() =>
                expect(profile.router.state.location.pathname).toBe("/"),
            )
            profile.unmount()
        }
    })

    it("opens from /create-events with legacy's notice", async () => {
        const { user, fake } = setup("org")
        const { router } = render(user, fake, "/create-events")
        await userEvent.click(
            await screen.findByRole("link", { name: "אירוע רב יומי" }),
        )

        expect(router.state.location.pathname).toBe(NEW_PATH)
        expect(
            await screen.findByText(
                "אירוע רב יומי הוא אירוע רציף שנמשך מספר ימים",
            ),
        ).toBeInTheDocument()
        expect(
            screen.getByRole("heading", { name: "יצירת אירוע - רב יומי" }),
        ).toBeInTheDocument()
    })

    it("creates an event shown on every day it spans and in my events at once, with no list refetch", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake, "/manage-events")
        await screen.findByText("נראה שעדיין אין לכם אירועים")
        await act(() => router.navigate("/"))
        await eventTitles()
        await act(() => router.navigate(NEW_PATH))

        await fillEvent()
        const readsBefore = eventReads(fake).length
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake)
        // As production's legacy-made multi-day rows are.
        expect(insert.body).toEqual({
            id: expect.any(String),
            title: "ריטריט במדבר",
            lng_titles: {
                en: "ריטריט במדבר [en]",
                ru: "ריטריט במדבר [ru]",
            },
            description: "",
            district: "south",
            address: {
                label: TZOFAR.label,
                place_id: TZOFAR.placeId,
                en_label: TZOFAR.english,
            },
            start_date: "2026-11-19",
            end_date: "2026-11-21",
            is_multi_day: true,
            type: "retreat",
            segments: [],
            multi_day_teachers: [],
            source_template_id: null,
            organisations: [],
            links: [],
            price: [],
            hide: false,
            cancelled: false,
            user_id: user.id,
            owners: [{ value: user.id, label: user.name }],
            created_at: NOW.toISOString(),
            updated_at: NOW.toISOString(),
        })
        expect(eventReads(fake)).toHaveLength(readsBefore)

        // From here on, any request for events hangs: what shows comes from
        // the save's response, in the cache.
        fake.holdTable("ci_events")
        await act(() => router.navigate("/"))
        expect(await eventTitles()).toContain("ריטריט במדבר")
        await userEvent.click(
            screen.getByRole("button", { name: "צפייה באירועים לפי לוח שנה" }),
        )
        await userEvent.click(screen.getByRole("button", { name: "החודש הבא" }))
        for (const day of [19, 20, 21]) {
            expect(dayButton(day, "בנובמבר")).toHaveAccessibleName(/אירוע אחד$/)
        }
        expect(dayButton(22, "בנובמבר")).toHaveAccessibleName(/בנובמבר$/)
        await userEvent.click(dayButton(20, "בנובמבר"))
        expect(
            within(screen.getByRole("list", { name: / 20 בנובמבר/ }))
                .getAllByRole("heading")
                .map((h) => h.textContent),
        ).toEqual(["ריטריט במדבר"])

        await act(() => router.navigate("/manage-events"))
        expect(await myEventTitles()).toContain("ריטריט במדבר")
    })

    it("tags teachers and organisations, and keeps typed names of both", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent()

        const teachers = select("מורים - ניתן להוסיף מורים שלא נמצאים ברשימה")
        await userEvent.click(teachers)
        await userEvent.type(teachers, "נועה")
        await userEvent.click(
            screen.getByRole("option", { name: "נועה המורה" }),
        )
        await userEvent.type(teachers, "רותם רם{Enter}")
        const organisations = select("ארגונים")
        await userEvent.click(organisations)
        await userEvent.click(
            screen.getByRole("option", { name: "סטודיו תנועה" }),
        )
        await userEvent.type(organisations, "ליפול לאיזון{Enter}")
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake)
        expect(insert.body).toMatchObject({
            multi_day_teachers: [
                { label: "נועה המורה", value: TEACHER.user_id },
                { label: "רותם רם", value: "רותם רם" },
            ],
            organisations: [
                { label: "סטודיו תנועה", value: ORG.user_id },
                { label: "ליפול לאיזון", value: "ליפול לאיזון" },
            ],
        })
        const [junction] = inserts(fake, "ci_events_users_junction")
        expect(junction.rows).toEqual([
            { ci_event_id: insert.body?.id, user_id: TEACHER.user_id },
            { ci_event_id: insert.body?.id, user_id: ORG.user_id },
        ])
        // The details show the teacher's bio and the typed names at once.
        await act(() => router.navigate("/"))
        await userEvent.click(
            within(await eventCard("ריטריט במדבר")).getByRole("link"),
        )
        const dialog = await screen.findByRole("dialog", {
            name: "ריטריט במדבר",
        })
        expect(
            within(dialog).getByRole("button", { name: "נועה המורה" }),
        ).toBeInTheDocument()
        expect(within(dialog).getByText(/רותם רם/)).toBeInTheDocument()
    })

    it("refuses an end before the start, on the same day, or over 14 days on", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await fillEvent()
        const end = () => screen.getByLabelText("תאריך סיום")

        setDay("תאריך סיום", "2026-11-18")
        await submit()
        expect(end()).toHaveAccessibleDescription(
            "תאריך הסיום לפני תאריך ההתחלה",
        )
        expect(end()).toHaveAttribute("aria-invalid", "true")

        setDay("תאריך סיום", "2026-11-19")
        const sameDay =
            "אירוע רב יומי לא יכול להתחיל ולהסתיים באותו יום, בשביל זה יש אירוע חד יומי"
        expect(end()).toHaveAccessibleDescription(sameDay)
        // Legacy's alert names the problem.
        expect(screen.getByRole("alert")).toHaveTextContent(sameDay)

        setDay("תאריך סיום", "2026-12-04")
        expect(end()).toHaveAccessibleDescription(
            "אירוע לא יכול להמשך מעל ל-14 ימים",
        )
        expect(inserts(fake)).toHaveLength(0)
        expect(fake.functions.calls).toHaveLength(0)

        setDay("תאריך סיום", "2026-12-03")
        expect(end()).not.toHaveAttribute("aria-invalid")
    })

    it("shows legacy's required fields and sends nothing while invalid", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await screen.findByRole("textbox", { name: "*כותרת האירוע" })

        await submit()

        expect(
            await screen.findByText("ערכים שגויים, נא לבדוק את הטופס"),
        ).toBeInTheDocument()
        expect(field("*כותרת האירוע")).toHaveAttribute("aria-invalid", "true")
        for (const name of ["אזור", "חפש כתובת", "סוג האירוע"]) {
            expect(select(name)).toHaveAttribute("aria-invalid", "true")
        }
        for (const label of ["תאריך התחלה", "תאריך סיום"]) {
            expect(screen.getByLabelText(label)).toHaveAccessibleDescription(
                "שדה חובה",
            )
        }
        expect(inserts(fake)).toHaveLength(0)
    })

    it("offers days up to a year ahead, as legacy's pickers did", async () => {
        const { user, fake } = setup()
        render(user, fake)

        for (const name of ["תאריך התחלה", "תאריך סיום"]) {
            expect(await screen.findByLabelText(name)).toHaveAttribute(
                "max",
                "2027-10-30",
            )
        }
    })

    it("refuses a first day that has passed", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await fillEvent()
        setDay("תאריך התחלה", "2026-10-29")
        setDay("תאריך סיום", "2026-11-01")

        await submit()

        expect(
            screen.getByLabelText("תאריך התחלה"),
        ).toHaveAccessibleDescription("התאריך עבר")
        expect(inserts(fake)).toHaveLength(0)
    })

    it("names the span problem only when it is the form's only one", async () => {
        const { user, fake } = setup()
        render(user, fake)
        await fillEvent()
        setDay("תאריך סיום", "2026-11-19")
        await userEvent.clear(field("*כותרת האירוע"))

        await submit()

        // Legacy checked the span only once the fields were valid.
        expect(screen.getByRole("alert")).toHaveTextContent(
            "ערכים שגויים, נא לבדוק את הטופס",
        )
        expect(screen.getByLabelText("תאריך סיום")).toHaveAccessibleDescription(
            /באותו יום/,
        )
    })

    it("takes today from Jerusalem: after midnight there, yesterday has passed", async () => {
        const { user, fake } = setup()
        // 00:30 on 31 October in Jerusalem, still the 30th in UTC.
        renderApp({
            fake,
            signedInAs: user,
            path: NEW_PATH,
            now: new Date("2026-10-30T22:30:00Z"),
        })
        await fillEvent()
        setDay("תאריך התחלה", "2026-10-30")
        setDay("תאריך סיום", "2026-11-01")

        await submit()

        expect(
            screen.getByLabelText("תאריך התחלה"),
        ).toHaveAccessibleDescription("התאריך עבר")
        expect(inserts(fake)).toHaveLength(0)

        setDay("תאריך התחלה", "2026-10-31")
        expect(screen.getByLabelText("תאריך התחלה")).not.toHaveAttribute(
            "aria-invalid",
        )
    })

    it("saves with the source text when translation and the English address fail", async () => {
        const { user, fake } = setup()
        fake.functions.fail("translate")
        fake.places.failEnglish()
        const { router } = render(user, fake)

        await fillEvent()
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        const [insert] = inserts(fake)
        expect(insert.body).toMatchObject({
            title: "ריטריט במדבר",
            lng_titles: {},
            address: { label: TZOFAR.label, place_id: TZOFAR.placeId },
            is_multi_day: true,
        })
        expect(insert.body?.address).not.toHaveProperty("en_label")
    })

    it("keeps an unsaved draft across a reload, and drops it once saved", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        const first = render(user, fake, undefined, storage)
        await fillEvent("טיוטה רב יומית")
        expect(storage.getItem(MULTI_DAY_DRAFT_KEY)).toContain("טיוטה רב יומית")
        first.unmount()

        const { router } = render(user, fake, undefined, storage)
        expect(
            await screen.findByDisplayValue("טיוטה רב יומית"),
        ).toBeInTheDocument()
        expect(screen.getByLabelText("תאריך התחלה")).toHaveValue("2026-11-19")
        expect(screen.getByLabelText("תאריך סיום")).toHaveValue("2026-11-21")
        expect(select("סוג האירוע")).toHaveValue("retreat")
        expect(select("חפש כתובת")).toHaveValue(TZOFAR.label)
        const loads = fake.places.loads
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        // The draft kept the English address: no lookup at save.
        expect(fake.places.loads).toBe(loads)
        expect(inserts(fake)[0].body?.address).toMatchObject({
            en_label: TZOFAR.english,
        })
        expect(storage.getItem(MULTI_DAY_DRAFT_KEY)).toBeNull()
    })

    it("clears the form and its draft", async () => {
        const { user, fake } = setup()
        const storage = createMemoryStorage()
        render(user, fake, undefined, storage)
        await userEvent.type(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
            "משהו",
        )
        expect(storage.getItem(MULTI_DAY_DRAFT_KEY)).not.toBeNull()

        await userEvent.click(
            screen.getByRole("button", { name: "ניקוי טופס" }),
        )

        expect(field("*כותרת האירוע")).toHaveValue("")
        expect(storage.getItem(MULTI_DAY_DRAFT_KEY)).toBeNull()
    })

    it("can save a new event hidden: in my events, not on the calendar", async () => {
        const { user, fake } = setup()
        const { router } = render(user, fake)
        await fillEvent("ריטריט סודי")
        await userEvent.click(
            screen.getByRole("switch", { name: "הסתרת האירוע (טיוטה)" }),
        )
        await submit()

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/create-events"),
        )
        expect(inserts(fake)[0].body).toMatchObject({ hide: true })
        await act(() => router.navigate("/"))
        expect(await eventTitles()).not.toContain("ריטריט סודי")
        await act(() => router.navigate("/manage-events"))
        expect(await myEventTitles()).toContain("ריטריט סודי")
    })
})

describe("editing a multi-day event", () => {
    function seeded() {
        const { user, fake } = setup()
        const mine = event({
            title: "סדנת סתיו",
            user_id: user.id,
            is_multi_day: true,
            start_date: "2026-11-12",
            end_date: "2026-11-14",
            segments: [],
            // Some legacy rows store the type's Hebrew label.
            type: "סדנה",
            description: "תיאור",
            multi_day_teachers: [
                { label: "נועה המורה", value: TEACHER.user_id },
            ],
            owners: [{ value: user.id, label: user.name }],
            lng_titles: { en: "Autumn workshop", ru: "Осенний семинар" },
        })
        const single = event({ title: "שיעור שלי", user_id: user.id })
        const theirs = event({
            title: "של מישהו",
            user_id: "someone-else",
            is_multi_day: true,
            segments: [],
            type: "retreat",
        })
        fake.rows("ci_events").push(mine, single, theirs)
        fake.rows("ci_events_users_junction").push({
            id: crypto.randomUUID(),
            ci_event_id: mine.id,
            user_id: TEACHER.user_id,
        })
        return { user, fake, mine, single, theirs }
    }

    const updateButton = () =>
        screen.getByRole("button", { name: "עדכון אירוע" })

    it("opens the event as saved", async () => {
        const { user, fake, mine } = seeded()
        render(user, fake, editPath(mine.id))

        expect(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("סדנת סתיו")
        expect(
            screen.getByRole("heading", { name: "עדכון אירוע - רב יומי" }),
        ).toBeInTheDocument()
        expect(screen.getByLabelText("תאריך התחלה")).toHaveValue("2026-11-12")
        expect(screen.getByLabelText("תאריך סיום")).toHaveValue("2026-11-14")
        expect(select("סוג האירוע")).toHaveValue("workshop")
        expect(screen.getByText("נועה המורה")).toBeInTheDocument()
        expect(
            screen.queryByRole("button", { name: "ניקוי טופס" }),
        ).not.toBeInTheDocument()
    })

    it("updates only the changed columns of that one event of the user's", async () => {
        const { user, fake, mine, single, theirs } = seeded()
        const { router } = render(user, fake, editPath(mine.id))
        await screen.findByRole("textbox", { name: "*כותרת האירוע" })
        setDay("תאריך סיום", "2026-11-15")

        await userEvent.click(updateButton())

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
            body: { end_date: "2026-11-15", updated_at: NOW.toISOString() },
        })
        expect(Object.keys(writes[0].body!).sort()).toEqual([
            "end_date",
            "updated_at",
        ])
        // No title change: no translation.
        expect(fake.functions.calls).toEqual([])
        const rows = fake.rows("ci_events")
        expect(rows.find((row) => row.id === mine.id)).toMatchObject({
            end_date: "2026-11-15",
            type: "סדנה",
            title: "סדנת סתיו",
        })
        expect(rows.find((row) => row.id === single.id)).toEqual(single)
        expect(rows.find((row) => row.id === theirs.id)).toEqual(theirs)
        expect(await myEventTitles()).toContain("סדנת סתיו")
    })

    it("translates a new title and tags newly added teachers", async () => {
        const { user, fake, mine } = seeded()
        const { router } = render(user, fake, editPath(mine.id))
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        await userEvent.clear(title)
        await userEvent.type(title, "סדנת חורף")
        await userEvent.selectOptions(select("סוג האירוע"), "course")
        const organisations = select("ארגונים")
        await userEvent.click(organisations)
        await userEvent.click(
            screen.getByRole("option", { name: "סטודיו תנועה" }),
        )

        await userEvent.click(updateButton())

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        const [update] = fake.requests.filter(
            (request) =>
                request.method === "update" && request.table === "ci_events",
        )
        expect(Object.keys(update.body!).sort()).toEqual([
            "lng_titles",
            "organisations",
            "title",
            "type",
            "updated_at",
        ])
        expect(update.body).toMatchObject({
            title: "סדנת חורף",
            lng_titles: { en: "סדנת חורף [en]", ru: "סדנת חורף [ru]" },
            type: "course",
            organisations: [{ label: "סטודיו תנועה", value: ORG.user_id }],
        })
        // The teacher was tagged already; only the organisation is new.
        const [junction] = inserts(fake, "ci_events_users_junction")
        expect(junction.rows).toEqual([
            { ci_event_id: mine.id, user_id: ORG.user_id },
        ])
    })

    it("lets a saved span stand that legacy's rules would refuse now", async () => {
        const { user, fake, mine } = seeded()
        Object.assign(
            fake.rows("ci_events").find((row) => row.id === mine.id)!,
            { start_date: "2026-10-28", end_date: "2026-11-20" },
        )
        const { router } = render(user, fake, editPath(mine.id))
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })
        await userEvent.type(title, "!")

        await userEvent.click(updateButton())

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
    })

    it("keeps unsaved edits across a reload, and the back button drops them", async () => {
        const { user, fake, mine } = seeded()
        const storage = createMemoryStorage()
        const first = render(user, fake, editPath(mine.id), storage)
        await userEvent.type(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
            " מעודכנת",
        )
        expect(storage.getItem(MULTI_DAY_EDIT_DRAFT_KEY)).toContain("מעודכנת")
        first.unmount()

        const { router } = render(user, fake, editPath(mine.id), storage)
        expect(
            await screen.findByDisplayValue("סדנת סתיו מעודכנת"),
        ).toBeInTheDocument()

        await userEvent.click(
            screen.getByRole("button", { name: "חזרה לאירועים שלי" }),
        )

        expect(router.state.location.pathname).toBe("/manage-events")
        expect(storage.getItem(MULTI_DAY_EDIT_DRAFT_KEY)).toBeNull()
    })

    it("sends each kind of event to its own form", async () => {
        const { user, fake, mine, single } = seeded()
        const first = render(user, fake, editPath(single.id))
        await waitFor(() =>
            expect(first.router.state.location.pathname).toBe(
                `/manage-events/edit-single-day/${single.id}`,
            ),
        )
        expect(
            await screen.findByRole("textbox", { name: "*כותרת האירוע" }),
        ).toHaveValue("שיעור שלי")
        first.unmount()

        const second = render(
            user,
            fake,
            `/manage-events/edit-single-day/${mine.id}`,
        )
        await waitFor(() =>
            expect(second.router.state.location.pathname).toBe(
                editPath(mine.id),
            ),
        )
        expect(await screen.findByLabelText("תאריך סיום")).toHaveValue(
            "2026-11-14",
        )
    })

    it("shows no type for a type it doesn't offer, and keeps it unless changed", async () => {
        const { user, fake, mine } = seeded()
        // A production row has this type.
        Object.assign(
            fake.rows("ci_events").find((row) => row.id === mine.id)!,
            { type: "conference" },
        )
        const { router } = render(user, fake, editPath(mine.id))
        const title = await screen.findByRole("textbox", {
            name: "*כותרת האירוע",
        })

        expect(select("סוג האירוע")).toHaveDisplayValue("סוג האירוע")
        await userEvent.type(title, "!")
        await userEvent.click(updateButton())

        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/manage-events"),
        )
        const [update] = fake.requests.filter(
            (request) =>
                request.method === "update" && request.table === "ci_events",
        )
        expect(update.body).not.toHaveProperty("type")
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
