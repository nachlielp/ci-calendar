import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { setPageVisibility } from "../../test/browser"
import type { SignedInRole } from "@ci-calendar/core/app/auth/roles"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { fakeTranslation } from "@ci-calendar/core/testing/fakeFunctions"
import { renderApp } from "../../test/renderApp"
import { testUser, userRow } from "@ci-calendar/core/testing/testUsers"
import {
    OPEN_STATUS_TREE,
    REQUEST_COLUMNS,
} from "@ci-calendar/core/features/requests/requestRows"

const NOW = new Date("2026-10-30T09:00:00Z")
const TITLE = "הרשמה כמורה או ארגון"

type Fake = ReturnType<typeof createFakeDataClient>

function requestRow(overrides: Record<string, unknown> = {}) {
    return {
        id: crypto.randomUUID(),
        number: 1,
        created_at: "2026-10-01T10:00:00Z",
        user_id: "someone",
        type: "creator",
        status: "open",
        closed: false,
        message: "אני מלמדת בחיפה",
        phone: "0501234567",
        email: "someone@example.com",
        name: "Someone",
        responses: [],
        viewed_by: [],
        ...overrides,
    }
}

/** A signed-in user with `requests` seeded (theirs and someone else's). */
function setup(
    role: SignedInRole = "user",
    requests: (userId: string) => Record<string, unknown>[] = () => [],
    row: Record<string, unknown> = {},
) {
    const user = testUser(role)
    const fake = createFakeDataClient()
    fake.rows("users").push({ ...userRow(user), ...row })
    fake.rows("requests").push(
        requestRow({ number: 99, message: "של מישהו אחר" }),
        ...requests(user.id),
    )
    return { user, fake }
}

/** Reads of the request list (not a single request's fresh responses). */
const requestReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "requests" &&
            request.method === "select" &&
            request.select === REQUEST_COLUMNS.replace(/\s+/g, ""),
    )

/** Only the user's own request while it is open. */
const openRequestFilters = (id: string, userId: string) => [
    { op: "eq", column: "id", value: id },
    { op: "eq", column: "user_id", value: userId },
    { op: "not.is", column: "closed", value: true },
    { op: "or", column: "", value: OPEN_STATUS_TREE },
]

/** An admin closes the request (with a response) behind the page's back. */
function adminCloses(fake: Fake, response = "אושר") {
    const row = fake.rows("requests").find((request) => request.number === 7)!
    row.closed = true
    row.responses = [
        {
            response,
            created_at: "2026-10-29T10:00:00Z",
            responder_name: "Admin",
        },
    ]
}

const writes = (fake: Fake, method: "insert" | "update") =>
    fake.requests.filter(
        (request) => request.table === "requests" && request.method === method,
    )

/** The list's entries, as their summary buttons read. */
async function listed() {
    const list = await screen.findByRole("region", { name: "הבקשות שלי" })
    return within(list)
        .queryAllByRole("button")
        .map((button) => button.textContent)
}

async function chooseType(label: string) {
    await userEvent.selectOptions(
        await screen.findByRole("combobox", { name: "סוג הבקשה" }),
        label,
    )
}

describe("my requests (/request)", () => {
    it("loads only the user's own requests, with their token, when the page opens", async () => {
        const { user, fake } = setup("user", (userId) => [
            requestRow({
                user_id: userId,
                number: 3,
                type: "org",
                closed: true,
                created_at: "2026-09-02T10:00:00Z",
            }),
            requestRow({
                user_id: userId,
                number: 4,
                type: "support",
                closed: true,
                created_at: "2026-10-05T10:00:00Z",
            }),
        ])
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })

        expect(await listed()).toEqual([
            "תמיכהסגור05/10/2026",
            "הרשמה כארגוןסגור02/09/2026",
        ])
        const reads = requestReads(fake)
        expect(reads).toHaveLength(1)
        expect(reads[0]).toMatchObject({
            select: REQUEST_COLUMNS.replace(/\s+/g, ""),
            filters: [{ op: "eq", column: "user_id", value: user.id }],
            order: [{ column: "created_at", ascending: false }],
            token: fake.auth.accessToken(),
        })
        expect(screen.queryByText(/של מישהו אחר/)).not.toBeInTheDocument()
    })

    it("isn't fetched until the page opens", async () => {
        const { user, fake } = setup()
        renderApp({ fake, signedInAs: user, now: NOW })

        await screen.findByRole("button", { name: "פתח תפריט" })
        await waitFor(() =>
            expect(fake.requests.some((r) => r.table === "users")).toBe(true),
        )
        expect(requestReads(fake)).toEqual([])
    })

    it("asks again each time the page opens", async () => {
        const { user, fake } = setup()
        const { router } = renderApp({
            fake,
            signedInAs: user,
            path: "/request",
            now: NOW,
        })
        await listed()
        await router.navigate("/about")
        await screen.findByRole("heading", { name: "אודות הפרוייקט" })
        await router.navigate("/request")
        await listed()

        await waitFor(() => expect(requestReads(fake)).toHaveLength(2))
    })

    it("shows the user's role and offers the roles they don't have", async () => {
        const { user, fake } = setup("user")
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })

        expect(
            await screen.findByRole("heading", { name: TITLE }),
        ).toBeVisible()
        expect(await screen.findByText("משתמש רגיל")).toBeVisible()
        expect(await listed()).toEqual([])
        expect(screen.getByText("🤷🏼‍♂️ אין לכם בקשות")).toBeVisible()

        await userEvent.click(screen.getByRole("button", { name: "הרשמה" }))
        const type = await screen.findByRole("combobox", { name: "סוג הבקשה" })
        expect(
            within(type)
                .getAllByRole("option")
                .filter((option) => !(option as HTMLOptionElement).disabled)
                .map((option) => option.textContent),
        ).toEqual(["הרשמה כמורה", "הרשמה כארגון"])
    })

    it.each([
        ["creator", ["הרשמה כארגון"]],
        ["org", ["הרשמה כמורה"]],
        ["admin", ["הרשמה כמורה", "הרשמה כארגון"]],
    ] as const)(
        "offers a %s the other role requests only",
        async (role, offered) => {
            const { user, fake } = setup(role)
            renderApp({ fake, signedInAs: user, path: "/request", now: NOW })

            await userEvent.click(
                await screen.findByRole("button", { name: "הרשמה" }),
            )
            const type = await screen.findByRole("combobox", {
                name: "סוג הבקשה",
            })
            expect(
                within(type)
                    .getAllByRole("option")
                    .filter((option) => !(option as HTMLOptionElement).disabled)
                    .map((option) => option.textContent),
            ).toEqual(offered)
        },
    )

    it("sends a request and shows it at once, without asking for the list again", async () => {
        const { user, fake } = setup("user")
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })

        await userEvent.click(
            await screen.findByRole("button", { name: "הרשמה" }),
        )
        await chooseType("הרשמה כמורה")
        expect(screen.getByText(/יכולים ליצור פרופיל ציבורי/)).toBeVisible()
        await userEvent.type(screen.getByLabelText("מספר פלאפון"), "0521234567")
        await userEvent.type(
            screen.getByLabelText("קצת עליי והערות נוספות"),
            "מלמדת ג'אם בתל אביב",
        )
        await userEvent.click(screen.getByRole("button", { name: "הגשה" }))

        expect(await screen.findByText(/נקלטה בהצלחה/)).toHaveTextContent(
            "בקשתך להרשמה כמורה ויוצר ארועים נקלטה בהצלחה.",
        )
        expect(await listed()).toEqual([
            "הרשמה כמורה ויוצר ארועיםפתוח30/10/2026",
        ])
        const [insert] = writes(fake, "insert")
        expect(insert).toMatchObject({
            select: REQUEST_COLUMNS.replace(/\s+/g, ""),
            token: fake.auth.accessToken(),
            body: {
                type: "creator",
                phone: "0521234567",
                message: "מלמדת ג'אם בתל אביב",
                user_id: user.id,
                email: user.email,
                name: user.name,
                status: "open",
                closed: false,
                responses: [],
                created_at: NOW.toISOString(),
            },
        })
        expect(requestReads(fake)).toHaveLength(1)

        // The number the database gave it shows in its details.
        await userEvent.click(
            screen.getByRole("button", { name: /הרשמה כמורה ויוצר ארועים/ }),
        )
        expect(screen.getByText("בקשה מס׳ : 100")).toBeVisible()
    })

    it("saves the phone on the user's row when it had none", async () => {
        const { user, fake } = setup("user", () => [], { phone: "" })
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })

        await userEvent.click(
            await screen.findByRole("button", { name: "הרשמה" }),
        )
        await chooseType("הרשמה כארגון")
        await userEvent.type(
            screen.getByLabelText("מספר פלאפון"),
            "+972521234567",
        )
        await userEvent.type(
            screen.getByLabelText("קצת עליי והערות נוספות"),
            "ארגון ג'אמים",
        )
        await userEvent.click(screen.getByRole("button", { name: "הגשה" }))

        await waitFor(() =>
            expect(fake.rows("users")[0].phone).toBe("+972521234567"),
        )
        const phoneUpdate = fake.requests.find(
            (r) => r.table === "users" && r.body?.phone,
        )
        expect(phoneUpdate?.filters).toEqual([
            { op: "eq", column: "id", value: user.id },
            { op: "eq", column: "phone", value: "" },
        ])
    })

    it("checks the form as legacy did, and sends nothing until it is right", async () => {
        const { user, fake } = setup("user")
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })

        await userEvent.click(
            await screen.findByRole("button", { name: "הרשמה" }),
        )
        await chooseType("הרשמה כארגון")
        await userEvent.click(screen.getByRole("button", { name: "הגשה" }))

        expect(
            screen.getByLabelText("מספר פלאפון"),
        ).toHaveAccessibleDescription("נא להזין מספר פלאפון")
        expect(
            screen.getByLabelText("קצת עליי והערות נוספות"),
        ).toHaveAccessibleDescription("נא להזין תיאור")
        expect(screen.getByRole("alert")).toHaveTextContent(
            "ערכים שגויים, נא לבדוק את הטופס",
        )

        await userEvent.type(screen.getByLabelText("מספר פלאפון"), "0301234567")
        expect(
            screen.getByLabelText("מספר פלאפון"),
        ).toHaveAccessibleDescription("נא להזין מספר פלאפון ישראלי תקין")
        await userEvent.click(screen.getByRole("button", { name: "הגשה" }))
        expect(writes(fake, "insert")).toEqual([])
    })

    it("edits the open request, sending only what changed", async () => {
        const { user, fake } = setup("user", (userId) => [
            requestRow({ user_id: userId, number: 7, type: "org" }),
        ])
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })

        expect(await screen.findByText(/נקלטה בהצלחה/)).toHaveTextContent(
            "בקשתך להרשמה כארגון נקלטה בהצלחה.",
        )
        await userEvent.click(
            screen.getByRole("button", { name: "עריכת הבקשה" }),
        )
        expect(screen.getByRole("combobox", { name: "סוג הבקשה" })).toHaveValue(
            "org",
        )
        const message = screen.getByLabelText("קצת עליי והערות נוספות")
        expect(message).toHaveValue("אני מלמדת בחיפה")
        await userEvent.type(message, " ובעכו")
        await userEvent.click(screen.getByRole("button", { name: "עדכון" }))

        await screen.findByRole("button", { name: "עריכת הבקשה" })
        const [update] = writes(fake, "update")
        expect(update).toMatchObject({
            body: { message: "אני מלמדת בחיפה ובעכו" },
            token: fake.auth.accessToken(),
        })
        expect(Object.keys(update.body ?? {})).toEqual(["message"])
        expect(update.filters).toEqual(
            openRequestFilters(update.filters[0].value as string, user.id),
        )
        await userEvent.click(
            screen.getByRole("button", { name: /הרשמה כארגון/ }),
        )
        expect(screen.getByText("אני מלמדת בחיפה ובעכו")).toBeVisible()
        expect(requestReads(fake)).toHaveLength(1)
    })

    it("cancels the open request, noting it for the admins", async () => {
        const { user, fake } = setup("user", (userId) => [
            requestRow({ user_id: userId, number: 7, type: "creator" }),
        ])
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })

        await userEvent.click(
            await screen.findByRole("button", { name: "ביטול הבקשה" }),
        )

        expect(
            await screen.findByRole("button", { name: "הרשמה" }),
        ).toBeVisible()
        expect(screen.queryByText("הבקשה כבר נסגרה")).not.toBeInTheDocument()
        expect(writes(fake, "update")[0].body).toEqual({
            closed: true,
            responses: [
                {
                    response: "בקשה בטולה על ידי המשתמש",
                    created_at: NOW.toISOString(),
                    responder_name: user.name,
                },
            ],
        })
        expect(await listed()).toEqual([
            "הרשמה כמורה ויוצר ארועיםסגור01/10/2026",
        ])
        expect(writes(fake, "update")[0].filters).toEqual(
            openRequestFilters(
                writes(fake, "update")[0].filters[0].value as string,
                user.id,
            ),
        )
        expect(requestReads(fake)).toHaveLength(1)
    })

    it("keeps a response an admin added to the open request when cancelling it", async () => {
        const { user, fake } = setup("user", (userId) => [
            requestRow({ user_id: userId, number: 7 }),
        ])
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })
        await screen.findByRole("button", { name: "ביטול הבקשה" })
        // Added after the page loaded, without closing the request.
        fake.rows("requests").find((r) => r.number === 7)!.responses = [
            { response: "נשמח לפרטים", created_at: "x", responder_name: "A" },
        ]

        await userEvent.click(
            screen.getByRole("button", { name: "ביטול הבקשה" }),
        )

        await screen.findByRole("button", { name: "הרשמה" })
        expect(
            (
                writes(fake, "update")[0].body?.responses as {
                    response: string
                }[]
            ).map((response) => response.response),
        ).toEqual(["נשמח לפרטים", "בקשה בטולה על ידי המשתמש"])
    })

    it("says so when an admin closed the request before the user cancelled it", async () => {
        const { user, fake } = setup("user", (userId) => [
            requestRow({ user_id: userId, number: 7 }),
        ])
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })
        await screen.findByRole("button", { name: "ביטול הבקשה" })
        adminCloses(fake)

        await userEvent.click(
            screen.getByRole("button", { name: "ביטול הבקשה" }),
        )

        expect(await screen.findByText("הבקשה כבר נסגרה")).toBeVisible()
        expect(writes(fake, "update")).toEqual([])
        await waitFor(() => expect(requestReads(fake)).toHaveLength(2))
        expect(
            await screen.findByRole("button", { name: "הרשמה" }),
        ).toBeVisible()
        expect(
            fake.rows("requests").find((r) => r.number === 7)!.responses,
        ).toHaveLength(1)
    })

    it("leaves a request an admin closed alone when the user's edit arrives", async () => {
        const { user, fake } = setup("user", (userId) => [
            requestRow({ user_id: userId, number: 7 }),
        ])
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })
        await userEvent.click(
            await screen.findByRole("button", { name: "עריכת הבקשה" }),
        )
        adminCloses(fake)
        await userEvent.type(
            screen.getByLabelText("קצת עליי והערות נוספות"),
            "!",
        )
        await userEvent.click(screen.getByRole("button", { name: "עדכון" }))

        expect(await screen.findByText("הבקשה כבר נסגרה")).toBeVisible()
        expect(fake.rows("requests").find((r) => r.number === 7)!.message).toBe(
            "אני מלמדת בחיפה",
        )
        await waitFor(() => expect(requestReads(fake)).toHaveLength(2))
        expect(
            await screen.findByRole("button", { name: "הרשמה" }),
        ).toBeVisible()
        expect(
            screen.queryByRole("combobox", { name: "סוג הבקשה" }),
        ).not.toBeInTheDocument()
    })

    describe("while editing", () => {
        afterEach(() => {
            vi.useRealTimers()
        })

        it("stops editing when a refetch shows an admin closed the request", async () => {
            vi.useFakeTimers({ toFake: ["Date"] })
            vi.setSystemTime(NOW)
            const { user, fake } = setup("user", (userId) => [
                requestRow({ user_id: userId, number: 7 }),
            ])
            renderApp({ fake, signedInAs: user, path: "/request", now: NOW })
            await userEvent.click(
                await screen.findByRole("button", { name: "עריכת הבקשה" }),
            )
            adminCloses(fake, "אושר, ברוכה הבאה")

            setPageVisibility("hidden")
            vi.setSystemTime(NOW.getTime() + 6 * 60_000)
            setPageVisibility("visible")

            expect(await screen.findByText("הבקשה כבר נסגרה")).toBeVisible()
            expect(
                screen.queryByRole("combobox", { name: "סוג הבקשה" }),
            ).not.toBeInTheDocument()
            expect(screen.getByRole("button", { name: "הרשמה" })).toBeVisible()
        })

        it("doesn't send a second request once a refetch shows an open one (legacy's guard)", async () => {
            vi.useFakeTimers({ toFake: ["Date"] })
            vi.setSystemTime(NOW)
            const { user, fake } = setup("user")
            renderApp({ fake, signedInAs: user, path: "/request", now: NOW })
            await userEvent.click(
                await screen.findByRole("button", { name: "הרשמה" }),
            )
            await chooseType("הרשמה כמורה")
            await userEvent.type(
                screen.getByLabelText("מספר פלאפון"),
                "0521234567",
            )
            await userEvent.type(
                screen.getByLabelText("קצת עליי והערות נוספות"),
                "שלום",
            )
            // Sent from another tab meanwhile; a refetch brings it.
            fake.rows("requests").push(
                requestRow({ user_id: user.id, number: 8, type: "org" }),
            )
            setPageVisibility("hidden")
            vi.setSystemTime(NOW.getTime() + 6 * 60_000)
            setPageVisibility("visible")
            await waitFor(() => expect(requestReads(fake)).toHaveLength(2))

            await userEvent.click(screen.getByRole("button", { name: "הגשה" }))

            expect(
                await screen.findByText("כבר יש לכם בקשה פתוחה"),
            ).toBeVisible()
            expect(writes(fake, "insert")).toEqual([])
            expect(screen.getByText(/נקלטה בהצלחה/)).toHaveTextContent(
                "בקשתך להרשמה כארגון נקלטה בהצלחה.",
            )
        })
    })

    it("sends a new request once, however often it is submitted, with one id", async () => {
        const { user, fake } = setup("user")
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })
        await userEvent.click(
            await screen.findByRole("button", { name: "הרשמה" }),
        )
        await chooseType("הרשמה כמורה")
        await userEvent.type(screen.getByLabelText("מספר פלאפון"), "0521234567")
        await userEvent.type(
            screen.getByLabelText("קצת עליי והערות נוספות"),
            "שלום",
        )

        fake.failTable("requests", "connection lost")
        await userEvent.click(screen.getByRole("button", { name: "הגשה" }))
        expect(await screen.findByRole("alert")).toHaveTextContent(
            "שליחת הבקשה נכשלה, נסו שוב",
        )
        fake.healTable("requests")

        fake.holdTable("requests")
        await userEvent.click(screen.getByRole("button", { name: "הגשה" }))
        await userEvent.type(screen.getByLabelText("מספר פלאפון"), "{Enter}")
        fake.releaseTable("requests")

        expect(await screen.findByText(/נקלטה בהצלחה/)).toBeVisible()
        const inserts = writes(fake, "insert")
        expect(inserts).toHaveLength(2)
        expect(inserts[1].body?.id).toBe(inserts[0].body?.id)
        expect(
            fake.rows("requests").filter((r) => r.user_id === user.id),
        ).toHaveLength(1)
    })

    it("stores a request sent again after a lost answer only once", async () => {
        const { user, fake } = setup("user")
        // The first attempt is stored, but its answer never arrives.
        let lost = true
        fake.beforeExecute((request) => {
            if (request.table !== "requests" || request.method !== "insert") {
                return
            }
            if (lost) {
                lost = false
                fake.rows("requests").push({ ...request.body, number: 50 })
                fake.failTable("requests", "network error")
            }
        })
        renderApp({ fake, signedInAs: user, path: "/request", now: NOW })
        await userEvent.click(
            await screen.findByRole("button", { name: "הרשמה" }),
        )
        await chooseType("הרשמה כארגון")
        await userEvent.type(screen.getByLabelText("מספר פלאפון"), "0521234567")
        await userEvent.type(
            screen.getByLabelText("קצת עליי והערות נוספות"),
            "שלום",
        )
        await userEvent.click(screen.getByRole("button", { name: "הגשה" }))
        await screen.findByRole("alert")
        fake.healTable("requests")
        await userEvent.click(screen.getByRole("button", { name: "הגשה" }))

        expect(await screen.findByText(/נקלטה בהצלחה/)).toBeVisible()
        expect(
            fake.rows("requests").filter((r) => r.user_id === user.id),
        ).toHaveLength(1)
        await userEvent.click(
            screen.getByRole("button", { name: /הרשמה כארגון/ }),
        )
        expect(screen.getByText("בקשה מס׳ : 50")).toBeVisible()
    })

    it("opens the request a link names, with the admins' responses", async () => {
        let answeredId = ""
        const { user, fake } = setup("user", (userId) => {
            const answered = requestRow({
                user_id: userId,
                number: 5,
                closed: true,
                message: "אשמח להרשם כמורה",
                responses: [
                    {
                        response: "אושר, ברוכה הבאה",
                        created_at: "2026-10-02T10:00:00Z",
                        responder_name: "Admin",
                    },
                ],
            })
            answeredId = answered.id
            return [
                answered,
                requestRow({
                    user_id: userId,
                    number: 6,
                    type: "org",
                    closed: true,
                    message: "בקשה אחרת",
                    created_at: "2026-10-03T10:00:00Z",
                }),
            ]
        })
        renderApp({
            fake,
            signedInAs: user,
            path: `/request/${answeredId}`,
            now: NOW,
        })

        expect(await screen.findByText("אושר, ברוכה הבאה")).toBeVisible()
        expect(screen.getByText("אשמח להרשם כמורה")).toBeVisible()
        expect(screen.getByText("בקשה מס׳ : 5")).toBeVisible()
        expect(screen.getByText("01/10/2026 13:00")).toBeVisible()
        expect(screen.queryByText("בקשה אחרת")).not.toBeInTheDocument()

        await userEvent.click(
            screen.getByRole("button", { name: /הרשמה כארגון/ }),
        )
        expect(screen.getByText("בקשה אחרת")).toBeVisible()
        expect(screen.queryByText("אשמח להרשם כמורה")).not.toBeInTheDocument()
    })

    it("shows the responses in the reader's language: the app's notes in its words, replies machine-translated", async () => {
        let answeredId = ""
        const { user, fake } = setup("user", (userId) => {
            const answered = requestRow({
                user_id: userId,
                number: 5,
                closed: true,
                responses: [
                    {
                        response: "נשמח לפרטים",
                        created_at: "2026-10-02T10:00:00Z",
                        responder_name: "Admin",
                    },
                    {
                        response: "Already in English",
                        created_at: "2026-10-02T11:00:00Z",
                        responder_name: "Admin",
                    },
                    {
                        response: "הבקשה אושרה",
                        created_at: "2026-10-03T10:00:00Z",
                        responder_name: "Admin",
                    },
                ],
            })
            answeredId = answered.id
            return [answered]
        })
        fake.functions.handle("translate", fakeTranslation)
        const storage = createMemoryStorage()
        storage.setItem("language", "en")
        renderApp({
            fake,
            storage,
            signedInAs: user,
            path: `/request/${answeredId}`,
            now: NOW,
        })

        expect(await screen.findByText("Request approved")).toBeVisible()
        expect(await screen.findByText("נשמח לפרטים [en]")).toBeVisible()
        expect(screen.getByText("Already in English")).toBeVisible()
        // Only the reply in Hebrew was sent; the note and the English
        // reply weren't, nor the user's own message.
        expect(fake.functions.calls.map((call) => call.body)).toEqual([
            expect.objectContaining({
                text: "נשמח לפרטים",
                targetLang: "en",
            }),
        ])
    })

    it("shows the responses as stored in Hebrew, asking for no translation", async () => {
        let answeredId = ""
        const { user, fake } = setup("user", (userId) => {
            const answered = requestRow({
                user_id: userId,
                closed: true,
                responses: [
                    {
                        response: "בקשה בטולה על ידי המשתמש",
                        created_at: "2026-10-02T10:00:00Z",
                        responder_name: "Someone",
                    },
                ],
            })
            answeredId = answered.id
            return [answered]
        })
        renderApp({
            fake,
            signedInAs: user,
            path: `/request/${answeredId}`,
            now: NOW,
        })

        expect(
            await screen.findByText("בקשה בטולה על ידי המשתמש"),
        ).toBeVisible()
        expect(fake.functions.calls).toEqual([])
    })

    it("is under the bio too, for teachers, creators, orgs and admins", async () => {
        const { user, fake } = setup("profile")
        renderApp({ fake, signedInAs: user, path: "/bio/request", now: NOW })

        expect(
            await screen.findByRole("heading", { name: TITLE }),
        ).toBeVisible()
        expect(await screen.findByText("מורה")).toBeVisible()
    })

    it("sends a plain user away from the bio's copy, and a signed-out visitor to login", async () => {
        const { user, fake } = setup("user")
        const signedIn = renderApp({
            fake,
            signedInAs: user,
            path: "/bio/request",
            now: NOW,
        })
        await waitFor(() =>
            expect(signedIn.router.state.location.pathname).toBe("/"),
        )
        signedIn.unmount()

        const anonymous = createFakeDataClient()
        const { router } = renderApp({
            fake: anonymous,
            path: "/request/abc",
            now: NOW,
        })
        await waitFor(() =>
            expect(router.state.location.pathname).toBe("/login"),
        )
        expect(anonymous.requests.some((r) => r.table === "requests")).toBe(
            false,
        )
    })

    it("speaks the chosen language", async () => {
        const { user, fake } = setup("user")
        const storage = createMemoryStorage()
        storage.setItem("language", "en")
        renderApp({
            fake,
            storage,
            signedInAs: user,
            path: "/request",
            now: NOW,
        })

        expect(
            await screen.findByRole("heading", {
                name: "Register as a teacher or organisation",
            }),
        ).toBeVisible()
        expect(await screen.findByText("Regular user")).toBeVisible()
        await userEvent.click(screen.getByRole("button", { name: "Register" }))
        expect(
            await screen.findByRole("combobox", { name: "Request type" }),
        ).toBeVisible()
        expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible()
    })
})
