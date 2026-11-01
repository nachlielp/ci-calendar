import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"
import type { SignedInRole } from "@ci-calendar/core/app/auth/roles"
import { setPageVisibility } from "../../test/browser"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { createTestTelemetry } from "../../test/fakeTelemetry"
import { renderApp } from "../../test/renderApp"
import { testUser } from "@ci-calendar/core/testing/testUsers"
import { afterNewest } from "@ci-calendar/core/features/admin/adminLists"
import {
    ADMIN_USER_COLUMNS,
    searchTerms,
    USERS_PAGE_SIZE,
} from "@ci-calendar/core/features/admin-users/users"

const NOW = new Date("2026-10-30T09:00:00Z")

type Fake = ReturnType<typeof createFakeDataClient>

/** A `users` row; `n` orders them: a higher `n` signed up later. */
function userRow(n: number, overrides: Record<string, unknown> = {}) {
    const day = String(1 + (n % 28)).padStart(2, "0")
    const month = String(1 + Math.floor(n / 28)).padStart(2, "0")
    return {
        id: `user-${String(n).padStart(3, "0")}`,
        user_name: `משתמש ${n}`,
        email: `user${n}@example.com`,
        phone: `05000000${String(n).padStart(2, "0")}`,
        user_type: "user",
        created_at: `2025-${month}-${day}T10:00:00Z`,
        ...overrides,
    }
}

/** An admin, and `count` other users (the admin signed up last). */
function setup(count = 3, role: SignedInRole = "admin") {
    const admin = testUser(role, { name: "המנהלת" })
    const fake = createFakeDataClient()
    fake.rows("users").push(
        ...Array.from({ length: count }, (_, n) => userRow(n + 1)),
    )
    return { admin, fake }
}

const COLUMNS = ADMIN_USER_COLUMNS.replace(/\s+/g, "")

/** Reads of the users list (pages and searches). */
const listReads = (fake: Fake) =>
    fake.requests.filter(
        (request) =>
            request.table === "users" &&
            request.method === "select" &&
            request.select === COLUMNS,
    )

/** The counting requests (account counts). */
const countReads = (fake: Fake) =>
    fake.requests.filter((request) => request.table === "users" && request.head)

/** The users listed, as their rows read. */
async function listed() {
    const list = await screen.findByRole("list", { name: "משתמשים" })
    return within(list)
        .getAllByRole("button")
        .filter((button) => button.hasAttribute("aria-expanded"))
        .map((button) => button.textContent)
}

async function openUser(name: string) {
    const list = await screen.findByRole("list", { name: "משתמשים" })
    const row = within(list)
        .getAllByRole("button")
        .find((button) => button.textContent?.startsWith(`${name} - `))!
    await userEvent.click(row)
    return within(row.closest("li")!)
}

describe("manage users (/manage-users)", () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it("is for admins only", async () => {
        const { fake } = setup()
        const creator = testUser("creator")
        const { router } = renderApp({
            fake,
            signedInAs: creator,
            path: "/manage-users",
        })
        await waitFor(() => expect(router.state.location.pathname).toBe("/"))

        const out = renderApp({ path: "/manage-users" })
        await waitFor(() =>
            expect(out.router.state.location.pathname).toBe("/login"),
        )
        expect(listReads(fake)).toEqual([])
        expect(countReads(fake)).toEqual([])
    })

    it("isn't fetched at an admin's boot", async () => {
        const { admin, fake } = setup()
        renderApp({ fake, signedInAs: admin, now: NOW })

        await screen.findByRole("button", { name: "פתח תפריט" })
        await screen.findByText("המנהלת")
        expect(listReads(fake)).toEqual([])
        expect(countReads(fake)).toEqual([])
    })

    it("requests the first page only when it opens, newest first, and the counts", async () => {
        const { admin, fake } = setup(USERS_PAGE_SIZE + 5)
        fake.rows("users").push(
            userRow(90, {
                user_type: "creator",
                created_at: "2024-01-01T10:00:00Z",
            }),
            userRow(91, {
                user_type: "org",
                created_at: "2024-01-02T10:00:00Z",
            }),
        )
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })

        const rows = await listed()
        expect(rows).toHaveLength(USERS_PAGE_SIZE)
        expect(rows.slice(0, 3)).toEqual([
            "המנהלת - admin@example.com",
            "משתמש 25 - user25@example.com",
            "משתמש 24 - user24@example.com",
        ])
        const reads = listReads(fake)
        expect(reads).toHaveLength(1)
        expect(reads[0]).toMatchObject({
            filters: [],
            order: [
                { column: "created_at", ascending: false },
                { column: "id", ascending: false },
            ],
            limit: USERS_PAGE_SIZE + 1,
            token: expect.stringContaining(admin.id),
        })
        expect(await screen.findByText("סהכ חשבונות: 28")).toBeInTheDocument()
        expect(screen.getByText("מנהלים: 1")).toBeInTheDocument()
        expect(screen.getByText("יוצרים: 1")).toBeInTheDocument()
        expect(screen.getByText("ארגונים: 1")).toBeInTheDocument()
        expect(screen.getByText("פרופילים: 0")).toBeInTheDocument()
        expect(screen.getByText("משתמשים: 25")).toBeInTheDocument()
        // Counted on the server: no user is read for them.
        expect(countReads(fake)).toHaveLength(6)
        expect(
            countReads(fake).every((request) => request.count === "exact"),
        ).toBe(true)
    })

    it("keeps nothing of it on the device", async () => {
        const { admin, fake } = setup(3)
        const storage = createMemoryStorage()
        const session = createMemoryStorage()
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
            storage,
            session,
        })
        await listed()
        await screen.findByText("סהכ חשבונות: 4")

        const kept = [storage, session].flatMap((store) =>
            Array.from({ length: store.length ?? 0 }, (_, index) =>
                store.getItem(store.key?.(index) ?? ""),
            ),
        )
        expect(kept.join("\n")).not.toContain("user3@example.com")
        expect(kept.join("\n")).not.toContain("0500000003")
    })

    it("loads the next page after the last user shown", async () => {
        const { admin, fake } = setup(USERS_PAGE_SIZE + 5)
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })
        const first = await listed()
        expect(screen.queryByText("משתמש 1 - user1@example.com")).toBeNull()

        await userEvent.click(
            screen.getByRole("button", { name: "טעינת משתמשים נוספים" }),
        )

        await waitFor(async () =>
            expect(await listed()).toHaveLength(USERS_PAGE_SIZE + 6),
        )
        expect((await listed()).slice(0, USERS_PAGE_SIZE)).toEqual(first)
        expect((await listed()).at(-1)).toBe("משתמש 1 - user1@example.com")
        const reads = listReads(fake)
        expect(reads).toHaveLength(2)
        // The 20th user shown: the admin, then users 25 down to 7.
        const last = fake.rows("users").find((row) => row.id === "user-007")!
        expect(reads[1].filters).toEqual([
            {
                op: "or",
                column: "",
                value: afterNewest({
                    createdAt: String(last.created_at),
                    id: "user-007",
                }),
            },
        ])
        expect(
            screen.queryByRole("button", { name: "טעינת משתמשים נוספים" }),
        ).not.toBeInTheDocument()
    })

    it("searches names and emails on the server once typing pauses", async () => {
        const { admin, fake } = setup(12)
        fake.rows("users").push(
            userRow(40, { user_name: "Yael", email: "yael@gmail.com" }),
            userRow(41, { user_name: "GMAIL fan", email: "fan@walla.co.il" }),
        )
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })
        await listed()

        await userEvent.type(
            screen.getByLabelText("חיפוש משתמש לפי שם או כתובת מייל:"),
            "gmail.com",
        )
        // Nothing went out per key.
        expect(listReads(fake)).toHaveLength(1)

        await waitFor(() =>
            expect(listReads(fake).map((read) => read.filters)).toEqual([
                [],
                [{ op: "or", column: "", value: searchTerms("gmail.com") }],
            ]),
        )
        await waitFor(async () =>
            expect(await listed()).toEqual(["Yael - yael@gmail.com"]),
        )

        await userEvent.clear(
            screen.getByLabelText("חיפוש משתמש לפי שם או כתובת מייל:"),
        )
        await userEvent.type(
            screen.getByLabelText("חיפוש משתמש לפי שם או כתובת מייל:"),
            "GMAIL",
        )
        await waitFor(async () =>
            expect(await listed()).toEqual([
                "GMAIL fan - fan@walla.co.il",
                "Yael - yael@gmail.com",
            ]),
        )

        await userEvent.clear(
            screen.getByLabelText("חיפוש משתמש לפי שם או כתובת מייל:"),
        )
        await userEvent.type(
            screen.getByLabelText("חיפוש משתמש לפי שם או כתובת מייל:"),
            "nobody",
        )
        expect(await screen.findByText("לא נמצאו משתמשים")).toBeVisible()
    })

    it("shows the last results, marked as searching, until the new ones arrive", async () => {
        const { admin, fake } = setup(3)
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })
        await listed()
        fake.holdTable("users")

        await userEvent.type(
            screen.getByLabelText("חיפוש משתמש לפי שם או כתובת מייל:"),
            "משתמש 2",
        )

        expect(await screen.findByText("מחפש…")).toBeVisible()
        expect(await listed()).toHaveLength(4)
        expect(screen.getByRole("list", { name: "משתמשים" })).toHaveAttribute(
            "aria-busy",
            "true",
        )
        fake.releaseTable("users")
        await waitFor(async () =>
            expect(await listed()).toEqual(["משתמש 2 - user2@example.com"]),
        )
        expect(screen.queryByText("מחפש…")).not.toBeInTheDocument()
    })

    it("shows a user's details, and copies their phone number", async () => {
        const { admin, fake } = setup(2)
        fake.rows("user_roles").push({ user_id: "user-002", role_id: 4 })
        const user = userEvent.setup()
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })

        const list = await screen.findByRole("list", { name: "משתמשים" })
        await user.click(
            within(list).getByRole("button", {
                name: "משתמש 2 - user2@example.com",
            }),
        )
        const row = within(
            within(list)
                .getByRole("button", { name: "משתמש 2 - user2@example.com" })
                .closest("li")!,
        )
        expect(row.getByText("user2@example.com")).toBeVisible()
        // The role membership, as legacy showed it.
        expect(row.getByText("מורה")).toBeVisible()

        await user.click(row.getByRole("button", { name: /העתקת מספר הטלפון/ }))
        expect(await navigator.clipboard.readText()).toBe("0500000002")
        expect(row.getByText("מספר הטלפון הועתק")).toBeVisible()
    })

    it("changes a role through the RPC alone and updates the row from its answer", async () => {
        const { admin, fake } = setup(3)
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })
        expect(await screen.findByText("יוצרים: 0")).toBeInTheDocument()
        const row = await openUser("משתמש 2")
        expect(row.getByText("משתמש רגיל")).toBeVisible()
        expect(row.getByRole("button", { name: "משתמש" })).toBeDisabled()
        const requestsBefore = fake.requests.length

        await userEvent.click(row.getByRole("button", { name: "יוצר" }))

        expect(await row.findByText("מורה ויוצר ארועים")).toBeVisible()
        expect(row.getByRole("button", { name: "יוצר" })).toBeDisabled()
        expect(row.getByRole("button", { name: "משתמש" })).toBeEnabled()
        expect(fake.rpc.calls).toEqual([
            {
                name: "assign_user_role",
                args: {
                    p_user_id: "user-002",
                    p_role_id: 2,
                    p_user_type: "creator",
                },
                token: expect.stringContaining(admin.id),
            },
        ])
        // No table writes and no list refetch: the answer is the update.
        expect(
            fake.requests
                .slice(requestsBefore)
                .filter((request) => request.table === "users"),
        ).toEqual([])
        expect(
            fake.requests
                .slice(requestsBefore)
                .filter((request) => request.method !== "select"),
        ).toEqual([])
        expect(screen.getByText("יוצרים: 1")).toBeInTheDocument()
        expect(screen.getByText("משתמשים: 2")).toBeInTheDocument()
        // The database has it too (the fake runs the function).
        expect(
            fake.rows("users").find((user) => user.id === "user-002")
                ?.user_type,
        ).toBe("creator")
    })

    it("redoes a list and count fetch that was in flight when the role changed", async () => {
        const { admin, fake } = setup(3)
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })
        await screen.findByText("יוצרים: 0")
        const row = await openUser("משתמש 2")
        // A refresh goes out before the change and is answered after it,
        // with the role as it was.
        const deliverList = fake.answerLate(
            (request) =>
                request.table === "users" && request.select === COLUMNS,
        )
        const deliverCount = fake.answerLate(
            (request) =>
                request.head &&
                request.filters.some((filter) => filter.value === "creator"),
        )
        await userEvent.click(screen.getByRole("button", { name: "רענון" }))
        await waitFor(() => expect(listReads(fake)).toHaveLength(2))

        await userEvent.click(row.getByRole("button", { name: "יוצר" }))
        expect(await row.findByText("מורה ויוצר ארועים")).toBeVisible()
        deliverList()
        deliverCount()

        await waitFor(() => expect(listReads(fake)).toHaveLength(3))
        await waitFor(() => expect(countReads(fake)).toHaveLength(18))
        await waitFor(() =>
            expect(screen.getByRole("button", { name: "רענון" })).toBeEnabled(),
        )
        expect(row.getByText("מורה ויוצר ארועים")).toBeVisible()
        expect(row.getByRole("button", { name: "יוצר" })).toBeDisabled()
        expect(screen.getByText("יוצרים: 1")).toBeInTheDocument()
        expect(screen.getByText("משתמשים: 2")).toBeInTheDocument()
    })

    it("asks before admins take their own admin rights away", async () => {
        const { admin, fake } = setup(1)
        const { router } = renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })
        const row = await openUser("המנהלת")

        await userEvent.click(row.getByRole("button", { name: "משתמש" }))
        const dialog = await screen.findByRole("dialog", {
            name: "להסיר את הרשאות הניהול שלך?",
        })
        expect(fake.rpc.calls).toEqual([])
        await userEvent.click(
            within(dialog).getByRole("button", { name: "ביטול" }),
        )
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        expect(fake.rpc.calls).toEqual([])

        await userEvent.click(row.getByRole("button", { name: "משתמש" }))
        await userEvent.click(
            within(await screen.findByRole("dialog")).getByRole("button", {
                name: "כן, להסיר",
            }),
        )

        // Their profile is read again: no longer an admin, they leave.
        await waitFor(() => expect(router.state.location.pathname).toBe("/"))
        expect(fake.rpc.calls).toEqual([
            expect.objectContaining({
                args: {
                    p_user_id: admin.id,
                    p_role_id: 5,
                    p_user_type: "user",
                },
            }),
        ])
    })

    it("says so when the role change fails, and leaves the row as it was", async () => {
        const { admin, fake } = setup(3)
        fake.rpc.fail("assign_user_role", {
            message: "not_authorized: only admins may assign roles",
            code: "42501",
        })
        const sinks = createTestTelemetry()
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
            telemetry: sinks.telemetry,
        })
        await sinks.arrive()
        const row = await openUser("משתמש 2")

        await userEvent.click(row.getByRole("button", { name: "ארגון" }))

        expect(await row.findByRole("alert")).toHaveTextContent(
            "שינוי התפקיד נכשל",
        )
        expect(row.getByText("משתמש רגיל")).toBeVisible()
        expect(row.getByRole("button", { name: "משתמש" })).toBeDisabled()
        expect(row.getByRole("button", { name: "ארגון" })).toBeEnabled()
        expect(sinks.errors).toEqual([
            {
                error: new Error(
                    "Failed to update user role ERROR: not_authorized: only admins may assign roles",
                ),
                context: expect.objectContaining({ source: "assign-role" }),
            },
        ])
    })

    it("refreshes from the first page and the counts on the refresh button", async () => {
        const { admin, fake } = setup(USERS_PAGE_SIZE + 5)
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })
        await listed()
        await userEvent.click(
            screen.getByRole("button", { name: "טעינת משתמשים נוספים" }),
        )
        await waitFor(() => expect(listReads(fake)).toHaveLength(2))
        await screen.findByText("סהכ חשבונות: 26")
        // Someone signs up meanwhile.
        fake.rows("users").push(
            userRow(99, { created_at: "2026-10-30T08:00:00Z" }),
        )

        await userEvent.click(screen.getByRole("button", { name: "רענון" }))

        await waitFor(async () =>
            expect((await listed())[0]).toBe("משתמש 99 - user99@example.com"),
        )
        expect(await screen.findByText("סהכ חשבונות: 27")).toBeInTheDocument()
        const reads = listReads(fake)
        expect(reads).toHaveLength(3)
        expect(reads[2].filters).toEqual([])
        expect(countReads(fake)).toHaveLength(12)
        expect(await listed()).toHaveLength(USERS_PAGE_SIZE)
    })

    it("refreshes when the app comes back after 5 minutes, not before", async () => {
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(NOW)
        const { admin, fake } = setup(USERS_PAGE_SIZE + 5)
        renderApp({
            fake,
            signedInAs: admin,
            path: "/manage-users",
            now: NOW,
        })
        await listed()
        await userEvent.click(
            screen.getByRole("button", { name: "טעינת משתמשים נוספים" }),
        )
        await waitFor(() => expect(listReads(fake)).toHaveLength(2))

        setPageVisibility("hidden")
        vi.setSystemTime(NOW.getTime() + 60_000)
        setPageVisibility("visible")
        await screen.findByText("סהכ חשבונות: 26")
        expect(listReads(fake)).toHaveLength(2)

        setPageVisibility("hidden")
        vi.setSystemTime(NOW.getTime() + 6 * 60_000)
        setPageVisibility("visible")

        await waitFor(() => expect(listReads(fake)).toHaveLength(3))
        expect(listReads(fake)[2].filters).toEqual([])
        await waitFor(() => expect(countReads(fake)).toHaveLength(12))
        await waitFor(async () =>
            expect(await listed()).toHaveLength(USERS_PAGE_SIZE),
        )
    })
})
