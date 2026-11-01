import { cleanup, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { SignedInRole } from "@ci-calendar/core/app/auth/roles"
import { setPageVisibility } from "../../test/browser"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { fakeTranslation } from "@ci-calendar/core/testing/fakeFunctions"
import { createTestTelemetry } from "../../test/fakeTelemetry"
import { renderApp } from "../../test/renderApp"
import { testUser, userRow } from "@ci-calendar/core/testing/testUsers"
import {
    ADMIN_REQUEST_COLUMNS,
    APPROVED_NOTE,
    CLOSED_NOTE,
    REQUESTS_PAGE_SIZE,
    requestsFilter,
} from "@ci-calendar/core/features/admin-requests/adminRequests"
import {
    CLOSED_TREE,
    OPEN_STATUS_TREE,
} from "@ci-calendar/core/features/requests/requestRows"

const NOW = new Date("2026-10-30T09:00:00Z")

type Fake = ReturnType<typeof createFakeDataClient>

const requester = testUser("user", { id: "requester", name: "Yael" })

/** A `requests` row; a higher `n` was sent later. */
function requestRow(n: number, overrides: Record<string, unknown> = {}) {
    return {
        id: `request-${String(n).padStart(3, "0")}`,
        number: n,
        created_at: `2026-10-${String(1 + (n % 28)).padStart(2, "0")}T${String(Math.floor(n / 28)).padStart(2, "0")}:00:00Z`,
        user_id: requester.id,
        type: "creator",
        status: "open",
        closed: false,
        message: `הודעה ${n}`,
        phone: "0521234567",
        email: "yael@example.com",
        name: `פונה ${n}`,
        responses: [],
        viewed_by: [],
        sent: false,
        viewed: false,
        to_send: false,
        ...overrides,
    }
}

/** An admin, and requests seeded as given. */
function setup(
    rows: Record<string, unknown>[] = [],
    role: SignedInRole = "admin",
) {
    const admin = testUser(role, { name: "המנהלת" })
    const fake = createFakeDataClient()
    fake.rows("users").push(userRow(requester))
    fake.rows("requests").push(...rows)
    return { admin, fake }
}

const COLUMNS = ADMIN_REQUEST_COLUMNS.replace(/\s+/g, "")

/** Reads of the request lists. */
const listReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "requests" &&
            request.method === "select" &&
            request.select === COLUMNS,
    )

/** The open list's filters: not closed by either column (`isClosed`). */
const OPEN = [
    { op: "not.is", column: "closed", value: true },
    { op: "or", column: "", value: OPEN_STATUS_TREE },
]

/** A write's filters: the request, still open as the admin saw it. */
const stillOpen = (id: string) => [
    { op: "eq", column: "id", value: id },
    { op: "not.is", column: "closed", value: true },
    { op: "or", column: "", value: OPEN_STATUS_TREE },
]

const updates = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "requests" && request.method === "update",
    )

const stored = (fake: Fake, n: number) =>
    fake.rows("requests").find((row) => row.number === n)!

/** The requests listed, as their summary buttons read. */
async function listed() {
    const list = await screen.findByRole("list", { name: "בקשות" })
    return within(list)
        .getAllByRole("button")
        .filter((button) => button.hasAttribute("aria-expanded"))
        .map((button) => button.querySelector(".request-title")?.textContent)
}

async function openRequest(name: string) {
    const list = await screen.findByRole("list", { name: "בקשות" })
    const summary = within(list)
        .getAllByRole("button")
        .find((button) => button.textContent?.includes(name))!
    await userEvent.click(summary)
    return within(summary.closest("li")!)
}

const showClosed = async () =>
    userEvent.click(await screen.findByRole("switch", { name: "הצגת בקשות" }))

async function reply(item: ReturnType<typeof within>, text: string) {
    await userEvent.type(item.getByLabelText("תגובה"), text)
    await userEvent.click(item.getByRole("button", { name: "שליחת תגובה" }))
}

describe("manage support (/manage-support)", () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it("is for admins only", async () => {
        const { fake } = setup([requestRow(1)])
        const creator = testUser("creator")
        const { router } = renderApp({
            fake,
            signedInAs: creator,
            path: "/manage-support",
        })
        await waitFor(() => expect(router.state.location.pathname).toBe("/"))

        expect(listReads(fake)).toEqual([])
        cleanup()

        const signedOut = setup([requestRow(1)]).fake
        const out = renderApp({ path: "/manage-support", fake: signedOut })
        await waitFor(() =>
            expect(out.router.state.location.pathname).toBe("/login"),
        )
        expect(listReads(signedOut)).toEqual([])
    })

    it("isn't fetched at an admin's boot", async () => {
        const { admin, fake } = setup([requestRow(1)])
        renderApp({ fake, signedInAs: admin, now: NOW })

        await screen.findByText("המנהלת")
        expect(
            fake.requests.filter((request) => request.table === "requests"),
        ).toEqual([])
    })

    it("requests the open requests only when it opens, newest first", async () => {
        const { admin, fake } = setup([
            requestRow(1),
            requestRow(2, { type: "org", closed: null }),
            requestRow(3, { closed: true }),
            requestRow(4, { type: "support" }),
        ])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })

        expect(await listed()).toEqual([
            "תמיכה - פונה 4",
            "הרשמה כארגון - פונה 2",
            "הרשמה כמורה ויוצר ארועים - פונה 1",
        ])
        const reads = listReads(fake)
        expect(reads).toHaveLength(1)
        expect(reads[0]).toMatchObject({
            filters: OPEN,
            order: [
                { column: "created_at", ascending: false },
                { column: "id", ascending: false },
            ],
            limit: REQUESTS_PAGE_SIZE + 1,
            token: expect.stringContaining(admin.id),
        })
    })

    it("loads the closed requests only when they are first shown", async () => {
        const { admin, fake } = setup([
            requestRow(1),
            requestRow(2, { closed: true }),
            requestRow(3, { closed: true, type: "org" }),
        ])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        await listed()
        expect(listReads(fake)).toHaveLength(1)
        fake.holdTable("requests")

        await showClosed()

        // Never the open requests under the closed switch.
        expect(await screen.findByText("טוען…")).toBeVisible()
        expect(screen.queryByRole("list", { name: "בקשות" })).toBeNull()
        fake.releaseTable("requests")
        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כארגון - פונה 3",
                "הרשמה כמורה ויוצר ארועים - פונה 2",
            ]),
        )
        expect(listReads(fake)).toHaveLength(2)
        expect(listReads(fake)[1].filters).toEqual([
            { op: "or", column: "", value: CLOSED_TREE },
        ])
        expect(screen.getAllByText("סגור")).toHaveLength(2)
    })

    it("filters by type on the server", async () => {
        const { admin, fake } = setup([
            requestRow(1),
            requestRow(2, { type: "org" }),
            requestRow(3, { type: "profile" }),
        ])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        await listed()

        await userEvent.click(
            screen.getByRole("checkbox", { name: "הרשמה כארגון" }),
        )
        await userEvent.click(
            screen.getByRole("checkbox", { name: "הרשמה כמורה" }),
        )

        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כמורה - פונה 3",
                "הרשמה כארגון - פונה 2",
            ]),
        )
        expect(listReads(fake).at(-1)?.filters).toEqual([
            OPEN[0],
            { op: "in", column: "type", value: ["profile", "org"] },
            OPEN[1],
        ])
    })

    it("loads more after the last request shown", async () => {
        const { admin, fake } = setup(
            Array.from({ length: REQUESTS_PAGE_SIZE + 3 }, (_, n) =>
                requestRow(n + 1),
            ),
        )
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        expect(await listed()).toHaveLength(REQUESTS_PAGE_SIZE)

        await userEvent.click(
            screen.getByRole("button", { name: "טעינת בקשות נוספות" }),
        )

        await waitFor(async () =>
            expect(await listed()).toHaveLength(REQUESTS_PAGE_SIZE + 3),
        )
        const last = stored(fake, 4)
        expect(listReads(fake)[1].filters).toEqual([
            OPEN[0],
            {
                op: "or",
                column: "",
                value: requestsFilter("open", {
                    createdAt: String(last.created_at),
                    id: String(last.id),
                }),
            },
        ])
    })

    it("shows a request's details, and copies the phone number", async () => {
        const { admin, fake } = setup([
            requestRow(7, {
                responses: [
                    {
                        response: "בבדיקה",
                        created_at: "2026-10-20T10:00:00Z",
                        responder_name: "Admin",
                    },
                ],
            }),
        ])
        const user = userEvent.setup()
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })

        const item = await openRequest("פונה 7")
        expect(item.getByText("בקשה מס׳ : 7")).toBeVisible()
        expect(item.getByText("מייל : yael@example.com")).toBeVisible()
        expect(item.getByText("הודעה 7")).toBeVisible()
        expect(item.getByText("בבדיקה")).toBeVisible()

        await user.click(
            item.getByRole("button", { name: /העתקת מספר הטלפון/ }),
        )
        expect(await navigator.clipboard.readText()).toBe("0521234567")
        expect(item.getByText("מספר הטלפון הועתק")).toBeVisible()
    })

    it("shows the message and responses in the admin's language", async () => {
        const { admin, fake } = setup([
            requestRow(7, {
                responses: [
                    {
                        response: "בבדיקה",
                        created_at: "2026-10-20T10:00:00Z",
                        responder_name: "Admin",
                    },
                    {
                        // Reopened since.
                        response: "הבקשה נסגרה",
                        created_at: "2026-10-21T10:00:00Z",
                        responder_name: "Admin",
                    },
                ],
            }),
        ])
        fake.functions.handle("translate", fakeTranslation)
        const storage = createMemoryStorage()
        storage.setItem("language", "ru")
        renderApp({
            fake,
            storage,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const list = await screen.findByRole("list", { name: "Заявки" })
        await userEvent.click(
            within(list).getByRole("button", { name: /פונה 7/ }),
        )

        expect(await screen.findByText("הודעה 7 [ru]")).toBeVisible()
        expect(await screen.findByText("בבדיקה [ru]")).toBeVisible()
        expect(screen.getByText("Заявка закрыта")).toBeVisible()
        expect(
            fake.functions.calls.map((call) => call.body.text).sort(),
        ).toEqual(["בבדיקה", "הודעה 7"])
    })

    it("appends a reply to the responses and shows it without a refetch", async () => {
        const earlier = {
            response: "בבדיקה",
            created_at: "2026-10-20T10:00:00Z",
            responder_name: "Admin",
        }
        const { admin, fake } = setup([requestRow(7, { responses: [earlier] })])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")

        await reply(item, "נחזור אלייך מחר")

        expect(await item.findByText("נחזור אלייך מחר")).toBeVisible()
        expect(item.getByLabelText("תגובה")).toHaveValue("")
        const sent = updates(fake)
        expect(sent).toHaveLength(1)
        expect(sent[0].body).toEqual({
            responses: [
                earlier,
                {
                    response: "נחזור אלייך מחר",
                    created_at: NOW.toISOString(),
                    responder_name: "המנהלת",
                },
            ],
            viewed: false,
            sent: false,
            to_send: true,
        })
        // Only while it is open, as the admin saw it.
        expect(sent[0].filters).toEqual(stillOpen("request-007"))
        expect(listReads(fake)).toHaveLength(1)
        expect(stored(fake, 7).responses).toHaveLength(2)
        expect(stored(fake, 7).closed).toBe(false)
        expect(await listed()).toEqual(["הרשמה כמורה ויוצר ארועים - פונה 7"])
    })

    it("asks for the reply's text before sending", async () => {
        const { admin, fake } = setup([requestRow(7)])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")

        await userEvent.click(item.getByRole("button", { name: "שליחת תגובה" }))

        expect(await item.findByText("נא לכתוב תגובה")).toBeVisible()
        expect(updates(fake)).toEqual([])
    })

    it("moves a declined request to the closed list, and a reopened one back, without refetching", async () => {
        const { admin, fake } = setup([
            // Another user's: reopening 7 leaves its user one open request.
            requestRow(5, { user_id: "someone-else" }),
            requestRow(7),
            requestRow(6, { closed: true }),
        ])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        await listed()
        await showClosed()
        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כמורה ויוצר ארועים - פונה 6",
            ]),
        )
        await showClosed()
        await waitFor(async () => expect(await listed()).toHaveLength(2))
        expect(listReads(fake)).toHaveLength(2)

        const item = await openRequest("פונה 7")
        await userEvent.click(item.getByRole("button", { name: "דחיה" }))

        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כמורה ויוצר ארועים - פונה 5",
            ]),
        )
        expect(stored(fake, 7)).toMatchObject({
            closed: true,
            responses: [
                {
                    response: CLOSED_NOTE,
                    created_at: NOW.toISOString(),
                    responder_name: "המנהלת",
                },
            ],
        })
        await showClosed()
        expect(await listed()).toEqual([
            "הרשמה כמורה ויוצר ארועים - פונה 7",
            "הרשמה כמורה ויוצר ארועים - פונה 6",
        ])

        const closed = await openRequest("פונה 7")
        expect(closed.queryByRole("button", { name: "אישור" })).toBeNull()
        await userEvent.click(
            closed.getByRole("button", { name: "פתיחה מחדש" }),
        )
        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כמורה ויוצר ארועים - פונה 6",
            ]),
        )
        expect(updates(fake).at(-1)).toMatchObject({
            body: { closed: false, status: "open" },
            filters: [
                { op: "eq", column: "id", value: "request-007" },
                { op: "or", column: "", value: CLOSED_TREE },
            ],
        })
        await showClosed()
        expect(await listed()).toEqual([
            "הרשמה כמורה ויוצר ארועים - פונה 7",
            "הרשמה כמורה ויוצר ארועים - פונה 5",
        ])
        expect(listReads(fake)).toHaveLength(2)
    })

    it("approves a role request through the RPC, then closes it", async () => {
        const { admin, fake } = setup([requestRow(7, { type: "org" })])
        let rpcCallsAtClose = -1
        fake.beforeExecute((request) => {
            if (request.table === "requests" && request.method === "update") {
                rpcCallsAtClose = fake.rpc.calls.length
            }
        })
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")

        await userEvent.click(item.getByRole("button", { name: "אישור" }))

        await waitFor(async () =>
            expect(await screen.findByText("אין בקשות")).toBeVisible(),
        )
        expect(fake.rpc.calls).toEqual([
            {
                name: "assign_user_role",
                args: {
                    p_user_id: requester.id,
                    p_role_id: 3,
                    p_user_type: "org",
                },
                token: expect.stringContaining(admin.id),
            },
        ])
        // The role first, then the close.
        expect(rpcCallsAtClose).toBe(1)
        expect(
            fake.rows("users").find((row) => row.id === requester.id)
                ?.user_type,
        ).toBe("org")
        expect(stored(fake, 7)).toMatchObject({
            closed: true,
            to_send: true,
            responses: [
                {
                    response: APPROVED_NOTE,
                    responder_name: "המנהלת",
                },
            ],
        })
        expect(listReads(fake)).toHaveLength(1)
    })

    it("lists a request whose status says closed with the closed ones, as the user's page", async () => {
        const { admin, fake } = setup([
            requestRow(5),
            requestRow(7, { closed: false, status: "closed" }),
        ])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        expect(await listed()).toEqual(["הרשמה כמורה ויוצר ארועים - פונה 5"])

        await showClosed()

        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כמורה ויוצר ארועים - פונה 7",
            ]),
        )
    })

    it("doesn't reopen a request while its user has another one open", async () => {
        const { admin, fake } = setup([
            requestRow(5),
            requestRow(7, { closed: true }),
        ])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        await listed()
        await showClosed()
        const item = await openRequest("פונה 7")

        await userEvent.click(item.getByRole("button", { name: "פתיחה מחדש" }))

        expect(await item.findByRole("alert")).toHaveTextContent(
            "למשתמש כבר יש בקשה פתוחה אחרת",
        )
        expect(updates(fake)).toEqual([])
        expect(stored(fake, 7).closed).toBe(true)
    })

    it("gives the role the request asks for as stored, not as listed", async () => {
        const { admin, fake } = setup([requestRow(7, { type: "creator" })])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")
        // The user changes their request to an organisation's meanwhile.
        stored(fake, 7).type = "org"

        await userEvent.click(item.getByRole("button", { name: "אישור" }))

        await screen.findByText("אין בקשות")
        expect(fake.rpc.calls).toEqual([
            expect.objectContaining({
                args: {
                    p_user_id: requester.id,
                    p_role_id: 3,
                    p_user_type: "org",
                },
            }),
        ])
    })

    it("says the role was given when the request changed before it could be closed", async () => {
        const note = {
            response: "בקשה בטולה על ידי המשתמש",
            created_at: "2026-10-30T08:59:00Z",
            responder_name: "Yael",
        }
        const { admin, fake } = setup([
            requestRow(7),
            requestRow(5, { user_id: "someone-else" }),
        ])
        // The user cancels after the role was given, before the close.
        fake.beforeExecute((request) => {
            if (
                request.table === "requests" &&
                request.select === "responses"
            ) {
                Object.assign(stored(fake, 7), {
                    closed: true,
                    responses: [note],
                })
            }
        })
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")

        await userEvent.click(item.getByRole("button", { name: "אישור" }))

        expect(
            await screen.findByText(/התפקיד ניתן, אך הבקשה השתנתה/),
        ).toBeVisible()
        expect(screen.queryByText(/ולא נשמר דבר/)).toBeNull()
        expect(fake.rpc.calls).toHaveLength(1)
        expect(
            fake.rows("users").find((row) => row.id === requester.id)
                ?.user_type,
        ).toBe("creator")
        expect(updates(fake)).toEqual([])
        expect(stored(fake, 7).responses).toEqual([note])
        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כמורה ויוצר ארועים - פונה 5",
            ]),
        )
    })

    it("says the role was given when closing the request then fails", async () => {
        const { admin, fake } = setup([requestRow(7)])
        // Requests fail from the moment the role is being given.
        let failOnce = true
        fake.beforeExecute((request) => {
            if (
                failOnce &&
                request.table === "requests" &&
                request.select === "type,user_id"
            ) {
                failOnce = false
                fake.failTable("requests", "connection lost")
            }
        })
        const sinks = createTestTelemetry()
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
            telemetry: sinks.telemetry,
        })
        await sinks.arrive()
        const item = await openRequest("פונה 7")

        await userEvent.click(item.getByRole("button", { name: "אישור" }))

        expect(await item.findByRole("alert")).toHaveTextContent(
            "התפקיד שונה, אך סגירת הבקשה נכשלה",
        )
        expect(fake.rpc.calls).toHaveLength(1)
        expect(stored(fake, 7).closed).toBe(false)
        expect(sinks.errors).toEqual([
            expect.objectContaining({
                context: expect.objectContaining({ source: "request-action" }),
            }),
        ])

        // Approving again gives the same role and closes it.
        fake.healTable("requests")
        await userEvent.click(item.getByRole("button", { name: "אישור" }))
        expect(await screen.findByText("אין בקשות")).toBeVisible()
        expect(fake.rpc.calls).toHaveLength(2)
        expect(stored(fake, 7).closed).toBe(true)
    })

    it("offers no approval for a support request", async () => {
        const { admin, fake } = setup([requestRow(7, { type: "support" })])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")
        expect(item.queryByRole("button", { name: "אישור" })).toBeNull()
        expect(item.getByRole("button", { name: "דחיה" })).toBeVisible()
    })

    it("leaves the request open and says so when the role change fails", async () => {
        const { admin, fake } = setup([requestRow(7, { type: "creator" })])
        fake.rpc.fail("assign_user_role", {
            message: "not_authorized: only admins may assign roles",
            code: "42501",
        })
        const sinks = createTestTelemetry()
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
            telemetry: sinks.telemetry,
        })
        await sinks.arrive()
        const item = await openRequest("פונה 7")

        await userEvent.click(item.getByRole("button", { name: "אישור" }))

        expect(await item.findByRole("alert")).toHaveTextContent(
            "שינוי התפקיד נכשל, והבקשה נשארה פתוחה",
        )
        expect(updates(fake)).toEqual([])
        expect(stored(fake, 7).closed).toBe(false)
        expect(await listed()).toEqual(["הרשמה כמורה ויוצר ארועים - פונה 7"])
        expect(sinks.errors).toEqual([
            expect.objectContaining({
                context: expect.objectContaining({ source: "assign-role" }),
            }),
        ])
    })

    it("gives no role for a request the user cancelled meanwhile", async () => {
        const { admin, fake } = setup([requestRow(7)])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")
        stored(fake, 7).closed = true

        await userEvent.click(item.getByRole("button", { name: "אישור" }))

        expect(await screen.findByText(/הבקשה השתנתה בינתיים/)).toBeVisible()
        expect(fake.rpc.calls).toEqual([])
        expect(updates(fake)).toEqual([])
        expect(await screen.findByText("אין בקשות")).toBeVisible()
    })

    it("doesn't overwrite a user's cancel that came before the reply", async () => {
        const note = {
            response: "בקשה בטולה על ידי המשתמש",
            created_at: "2026-10-30T08:59:00Z",
            responder_name: "Yael",
        }
        const { admin, fake } = setup([requestRow(7), requestRow(5)])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")
        // The user cancels while the admin's page shows it open.
        Object.assign(stored(fake, 7), { closed: true, responses: [note] })

        await reply(item, "תשובה")

        expect(await screen.findByText(/הבקשה השתנתה בינתיים/)).toBeVisible()
        expect(updates(fake)).toEqual([])
        expect(stored(fake, 7).responses).toEqual([note])
        // The list is read again: it is closed now.
        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כמורה ויוצר ארועים - פונה 5",
            ]),
        )
        expect(listReads(fake)).toHaveLength(2)
    })

    it("doesn't overwrite a user's cancel landing between reading the responses and the reply", async () => {
        const note = {
            response: "בקשה בטולה על ידי המשתמש",
            created_at: "2026-10-30T08:59:00Z",
            responder_name: "Yael",
        }
        const { admin, fake } = setup([requestRow(7)])
        fake.beforeExecute((request) => {
            if (request.table === "requests" && request.method === "update") {
                Object.assign(stored(fake, 7), {
                    closed: true,
                    responses: [note],
                })
            }
        })
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")

        await reply(item, "תשובה")

        expect(await screen.findByText(/הבקשה השתנתה בינתיים/)).toBeVisible()
        expect(updates(fake)).toHaveLength(1)
        expect(stored(fake, 7).responses).toEqual([note])
        expect(await screen.findByText("אין בקשות")).toBeVisible()
    })

    it("redoes a list fetch that was in flight when a request was declined", async () => {
        const { admin, fake } = setup([requestRow(5), requestRow(7)])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")
        // A refresh goes out before the decline and is answered after it.
        const deliver = fake.answerLate(
            (request) =>
                request.table === "requests" && request.select === COLUMNS,
        )
        await userEvent.click(screen.getByRole("button", { name: "רענון" }))
        await waitFor(() => expect(listReads(fake)).toHaveLength(2))

        await userEvent.click(item.getByRole("button", { name: "דחיה" }))
        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כמורה ויוצר ארועים - פונה 5",
            ]),
        )
        deliver()

        await waitFor(() => expect(listReads(fake)).toHaveLength(3))
        await waitFor(() =>
            expect(screen.getByRole("button", { name: "רענון" })).toBeEnabled(),
        )
        expect(await listed()).toEqual(["הרשמה כמורה ויוצר ארועים - פונה 5"])
    })

    it("refreshes on the refresh button", async () => {
        const { admin, fake } = setup([requestRow(5)])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        await listed()
        fake.rows("requests").push(requestRow(9))

        await userEvent.click(screen.getByRole("button", { name: "רענון" }))

        await waitFor(async () =>
            expect(await listed()).toEqual([
                "הרשמה כמורה ויוצר ארועים - פונה 9",
                "הרשמה כמורה ויוצר ארועים - פונה 5",
            ]),
        )
        expect(listReads(fake)).toHaveLength(2)
    })

    it("refreshes when the app comes back after 5 minutes, not before", async () => {
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(NOW)
        const { admin, fake } = setup([requestRow(5)])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        await listed()

        setPageVisibility("hidden")
        vi.setSystemTime(NOW.getTime() + 60_000)
        setPageVisibility("visible")
        expect(listReads(fake)).toHaveLength(1)

        fake.rows("requests").push(requestRow(9))
        setPageVisibility("hidden")
        vi.setSystemTime(NOW.getTime() + 6 * 60_000)
        setPageVisibility("visible")

        await waitFor(() => expect(listReads(fake)).toHaveLength(2))
        await waitFor(async () => expect(await listed()).toHaveLength(2))
    })

    it("fetches again on every visit to the page", async () => {
        const { admin, fake } = setup([requestRow(5)])
        const { router } = renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        await listed()

        await router.navigate("/manage-users")
        await screen.findByRole("heading", { name: "ניהול משתמשים" })
        await router.navigate("/manage-support")

        await waitFor(() => expect(listReads(fake)).toHaveLength(2))
    })

    it("shows the user an admin's reply on their requests page's next fetch", async () => {
        const { admin, fake } = setup([requestRow(7)])
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-support",
            now: NOW,
        })
        const item = await openRequest("פונה 7")
        await reply(item, "נחזור אלייך מחר")
        await item.findByText("נחזור אלייך מחר")
        cleanup()

        renderApp({
            fake,
            signedInAs: requester,
            path: "/request/request-007",
            now: NOW,
        })

        expect(await screen.findByText("נחזור אלייך מחר")).toBeVisible()
    })
})
