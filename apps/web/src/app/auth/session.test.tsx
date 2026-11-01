import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { RouteObject } from "react-router"
import { describe, expect, it, vi } from "vitest"
import { eventTitles } from "../../test/testEvents"
import { event } from "@ci-calendar/core/testing/testEvents"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { createTestTelemetry } from "../../test/fakeTelemetry"
import { setPageVisibility } from "../../test/browser"
import { renderApp } from "../../test/renderApp"
import { testUser, userRow } from "@ci-calendar/core/testing/testUsers"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"
import { routes } from "../routes"
import { ADMIN_ROLES, requireRole } from "./guard"

const NOW = new Date("2026-10-30T09:00:00Z")

const backend = () =>
    createFakeDataClient({ ci_events: [event({ title: "ג'אם" })] })

const header = () =>
    screen
        .getAllByRole("banner")
        .find((bar) =>
            within(bar).queryByRole("button", { name: "פתח תפריט" }),
        ) as HTMLElement

async function menuItems() {
    await userEvent.click(screen.getByRole("button", { name: "פתח תפריט" }))
    const menu = await screen.findByRole("dialog", { name: "תפריט" })
    return within(menu)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
}

/** Waits until the signed-in user's name is in the header. */
const signedInHeader = (name: string) =>
    waitFor(() => expect(within(header()).getByText(name)).toBeVisible())

/** The real routes plus an admins-only stand-in page at `/admin-only`. */
function withAdminPage(): RouteObject[] {
    const [root] = routes
    return [
        {
            element: root.element,
            errorElement: root.errorElement,
            children: [
                requireRole(ADMIN_ROLES, [
                    { path: "admin-only", element: <h1>לוח ניהול</h1> },
                ]),
                ...(root.children ?? []),
            ],
        },
    ]
}

describe("anonymous boot", () => {
    it("sends one window request with the anon key and nothing to auth", async () => {
        const fake = backend()
        renderApp({ fake, now: NOW })

        expect(await eventTitles()).toEqual(["ג'אם"])
        expect(fake.requests).toHaveLength(1)
        expect(fake.requests[0]).toMatchObject({
            table: "ci_events",
            token: null,
        })
        expect(fake.auth.calls).toEqual([])
        expect(fake.auth.started).toBe(false)
        expect(
            within(header()).getByRole("link", { name: "התחבר/י" }),
        ).toBeVisible()
    })
})

describe("signed-in boot", () => {
    it("renders the calendar and fetches only the small profile row", async () => {
        const fake = backend()
        const user = testUser("creator", { name: "דנה" })
        renderApp({ fake, now: NOW, signedInAs: user })

        expect(await eventTitles()).toEqual(["ג'אם"])
        await signedInHeader("דנה")

        const reads = fake.requests.filter((r) => r.method === "select")
        expect(reads.map((request) => request.table)).toEqual([
            "ci_events",
            "users",
        ])
        const profile = reads[1]
        expect(profile).toMatchObject({
            method: "select",
            select: "id,user_type,user_name,provider,is_internal",
            filters: [{ op: "eq", column: "id", value: user.id }],
            token: `token-${user.id}-1`,
        })
        // No getUser() round trip, no refresh: the stored token was valid.
        expect(fake.auth.calls).toEqual([])
        expect(
            within(header()).queryByRole("link", { name: "התחבר/י" }),
        ).not.toBeInTheDocument()
    })

    it("shows the calendar without waiting for an expired token's refresh", async () => {
        const fake = backend()
        fake.auth.holdRefresh()
        const user = testUser("user")
        renderApp({ fake, now: NOW, signedInAs: user, tokenExpired: true })

        expect(await eventTitles()).toEqual(["ג'אם"])
        // The window went with the anon key; the profile waits for auth.
        expect(fake.requests).toHaveLength(1)
        expect(fake.requests[0].token).toBeNull()
        expect(fake.auth.calls).toEqual([
            { method: "refresh", userId: user.id },
        ])
        // Signed in but not known yet: neither login nor account items.
        expect(
            within(header()).queryByRole("link", { name: "התחבר/י" }),
        ).not.toBeInTheDocument()

        act(() => fake.auth.releaseRefresh())

        await signedInHeader(user.name!)
        expect(fake.requests[1]).toMatchObject({
            table: "users",
            // The refreshed token, not the stored one.
            token: `token-${user.id}-2`,
        })
    })

    it("identifies the user to telemetry and saves the device's internal flag", async () => {
        const storage = createMemoryStorage()
        const sinks = createTestTelemetry({ storage })
        const user = testUser("user")
        renderApp({
            fake: backend(),
            storage,
            telemetry: sinks.telemetry,
            signedInAs: user,
        })
        await signedInHeader(user.name!)
        await sinks.arrive()

        expect(sinks.sentryUsers).toEqual([{ id: user.id, email: user.email }])
        expect(sinks.posthogCalls).toEqual([`identify ${user.id}`])
        expect(storage.getItem("isInternal")).toBe("false")
    })

    it("stops analytics on a team member's device", async () => {
        const storage = createMemoryStorage()
        const sinks = createTestTelemetry({ storage })
        const user = testUser("admin", { isInternal: true })
        renderApp({
            fake: backend(),
            storage,
            telemetry: sinks.telemetry,
            signedInAs: user,
        })
        await signedInHeader(user.name!)
        await sinks.arrive()

        expect(storage.getItem("isInternal")).toBe("true")
        expect(sinks.posthogCalls).toEqual(["optOut"])
    })

    it("loads auth-js in the background once the page is idle", async () => {
        const fake = backend()
        renderApp({ fake, signedInAs: testUser("user") })

        await waitFor(() => expect(fake.auth.started).toBe(true), {
            timeout: 2000,
        })
    })
})

describe("menu by role", () => {
    it.each([
        [
            "user",
            [
                "כל הארועים",
                "הרשם כמורה או ארגון",
                "איפוס סיסמה",
                "אודות",
                "התנתק/י",
            ],
        ],
        [
            "profile",
            ["כל הארועים", "פרופיל", "איפוס סיסמה", "אודות", "התנתק/י"],
        ],
        [
            "creator",
            [
                "כל הארועים",
                "האירועים שלי",
                "יצירת אירוע",
                "פרופיל",
                "איפוס סיסמה",
                "אודות",
                "התנתק/י",
            ],
        ],
        [
            "org",
            [
                "כל הארועים",
                "האירועים שלי",
                "יצירת אירוע",
                "פרופיל",
                "איפוס סיסמה",
                "אודות",
                "התנתק/י",
            ],
        ],
        [
            "admin",
            [
                "כל הארועים",
                "האירועים שלי",
                "יצירת אירוע",
                "ניהול אירועים",
                "ניהול משתמשים",
                "פרופיל",
                "ניהול תמיכה",
                "איפוס סיסמה",
                "אודות",
                "התנתק/י",
            ],
        ],
    ] as const)("lists a %s's pages", async (role, items) => {
        const user = testUser(role)
        renderApp({ fake: backend(), signedInAs: user })
        await signedInHeader(user.name!)

        expect(await menuItems()).toEqual(items)
    })

    it("offers the password reset only to email accounts", async () => {
        const user = testUser("user", { provider: "google" })
        renderApp({ fake: backend(), signedInAs: user })
        await signedInHeader(user.name!)

        expect(await menuItems()).not.toContain("איפוס סיסמה")
    })

    it("shows only what everyone sees while the profile loads", async () => {
        const fake = backend()
        fake.holdTable("users")
        renderApp({ fake, signedInAs: testUser("admin") })

        expect(await menuItems()).toEqual(["כל הארועים", "אודות"])
    })
})

describe("login link", () => {
    it("is hidden on the auth and text pages, which get home instead", async () => {
        renderApp({ fake: backend(), path: "/about" })
        await screen.findByRole("heading", { name: "אודות הפרוייקט" })

        expect(
            within(header()).queryByRole("link", { name: "התחבר/י" }),
        ).not.toBeInTheDocument()
        expect(
            within(header()).getByRole("link", { name: "כל הארועים" }),
        ).toBeVisible()
    })

    it("is hidden while offline", async () => {
        renderApp({ fake: backend() })
        expect(
            within(header()).getByRole("link", { name: "התחבר/י" }),
        ).toBeVisible()

        act(() => {
            window.dispatchEvent(new Event("offline"))
        })

        expect(
            within(header()).queryByRole("link", { name: "התחבר/י" }),
        ).not.toBeInTheDocument()
    })

    it("speaks the chosen language", async () => {
        const storage = createMemoryStorage()
        storage.setItem("language", "ru")
        renderApp({ fake: backend(), storage })

        expect(screen.getByRole("link", { name: "Войти" })).toBeVisible()
    })
})

describe("sign-out", () => {
    it("ends the session, forgets the user and returns to the calendar", async () => {
        const fake = backend()
        const storage = createMemoryStorage()
        const session = createMemoryStorage()
        session.setItem("staleChunkReloadAt", "1")
        const sinks = createTestTelemetry({ storage })
        const user = testUser("creator")
        const { router } = renderApp({
            fake,
            storage,
            session,
            telemetry: sinks.telemetry,
            signedInAs: user,
            path: "/about",
        })
        await signedInHeader(user.name!)
        await sinks.arrive()

        await userEvent.click(screen.getByRole("button", { name: "פתח תפריט" }))
        await userEvent.click(
            await screen.findByRole("button", { name: "התנתק/י" }),
        )

        await waitFor(() => expect(router.state.location.pathname).toBe("/"))
        expect(fake.auth.calls).toEqual([
            { method: "signOut", userId: user.id },
        ])
        expect(sinks.sentryUsers.at(-1)).toBeNull()
        expect(sinks.posthogCalls.at(-1)).toBe("reset")
        expect(session.getItem("staleChunkReloadAt")).toBeNull()
        expect(
            await within(header()).findByRole("link", { name: "התחבר/י" }),
        ).toBeVisible()
        expect(await menuItems()).toEqual(["כל הארועים", "אודות"])
        // Device storage keeps the public calendar and nothing of theirs.
        const stored = storage.getItem("ci-calendar:query-cache:v1") ?? ""
        expect(stored).toContain("ג'אם")
        expect(stored).not.toContain(user.id)
        expect(stored).not.toContain(user.name)
    })

    it("drops the user's cached data, so signing in again fetches it anew", async () => {
        const fake = backend()
        const user = testUser("creator")
        renderApp({ fake, signedInAs: user })
        await signedInHeader(user.name!)
        const profileRequests = () =>
            fake.requests.filter(
                (request) =>
                    request.table === "users" && request.method === "select",
            )
        expect(profileRequests()).toHaveLength(1)

        await act(() => fake.auth.signOut())
        act(() => fake.auth.signInAs(user))

        await signedInHeader(user.name!)
        // Within the profile's 5 fresh minutes: only a cache emptied on
        // sign-out asks again.
        expect(profileRequests()).toHaveLength(2)
    })

    it("follows a session that ends elsewhere (another tab, a revoked token)", async () => {
        const fake = backend()
        const sinks = createTestTelemetry()
        const user = testUser("user")
        renderApp({ fake, telemetry: sinks.telemetry, signedInAs: user })
        await signedInHeader(user.name!)
        await sinks.arrive()

        await act(() => fake.auth.signOut())

        expect(sinks.posthogCalls.at(-1)).toBe("reset")
        expect(
            await within(header()).findByRole("link", { name: "התחבר/י" }),
        ).toBeVisible()
    })
})

describe("role guard", () => {
    it("sends a signed-out visitor to the login page", async () => {
        const { router } = renderApp({
            fake: backend(),
            routes: withAdminPage(),
            path: "/admin-only",
        })

        expect(
            await screen.findByRole("heading", { name: "כניסה והזדהות" }),
        ).toBeVisible()
        expect(router.state.location.pathname).toBe("/login")
        expect(screen.queryByText("לוח ניהול")).not.toBeInTheDocument()
    })

    it("sends a user without the role to the calendar", async () => {
        const { router } = renderApp({
            fake: backend(),
            routes: withAdminPage(),
            path: "/admin-only",
            signedInAs: testUser("creator"),
        })

        await waitFor(() => expect(router.state.location.pathname).toBe("/"))
        expect(await eventTitles()).toEqual(["ג'אם"])
    })

    it("waits for the profile, then lets the role in", async () => {
        const fake = backend()
        fake.holdTable("users")
        renderApp({
            fake,
            routes: withAdminPage(),
            path: "/admin-only",
            signedInAs: testUser("admin"),
        })

        expect(await screen.findByText("טוען…")).toBeVisible()
        act(() => fake.releaseTable("users"))

        expect(
            await screen.findByRole("heading", { name: "לוח ניהול" }),
        ).toBeVisible()
    })
})

describe("auth redirects", () => {
    it("shows nothing account-bound while the redirect's session is checked", async () => {
        const fake = backend()
        fake.auth.startRedirect()
        renderApp({ fake, routes: withAdminPage(), path: "/admin-only" })

        expect(await screen.findByText("טוען…")).toBeVisible()
        expect(
            within(header()).queryByRole("link", { name: "התחבר/י" }),
        ).not.toBeInTheDocument()
        expect(await menuItems()).toEqual(["כל הארועים", "אודות"])
    })

    it("treats another account arriving over a stored one as a sign-out first", async () => {
        const fake = backend()
        const a = testUser("admin", { name: "אלה" })
        const b = testUser("user", { name: "בני" })
        fake.rows("users").push(userRow(a), userRow(b))
        fake.auth.signInAs(a)
        fake.auth.startRedirect()
        const session = createMemoryStorage()
        session.setItem("staleChunkReloadAt", "1")
        const sinks = createTestTelemetry()
        renderApp({ fake, session, telemetry: sinks.telemetry })
        await sinks.arrive()

        act(() => fake.auth.finishRedirect(b))

        await signedInHeader("בני")
        // A is forgotten (telemetry, this tab's storage) before B begins.
        expect(sinks.posthogCalls).toEqual(["reset", `identify ${b.id}`])
        expect(sinks.sentryUsers).toEqual([null, { id: b.id, email: b.email }])
        expect(session.getItem("staleChunkReloadAt")).toBeNull()
        // A's profile was never asked for.
        const profiles = fake.requests.filter(
            (r) => r.table === "users" && r.method === "select",
        )
        expect(profiles.map((r) => r.filters[0].value)).toEqual([b.id])
    })

    it("keeps the stored account when the redirect's tokens are no good", async () => {
        const fake = backend()
        const a = testUser("user", { name: "אלה" })
        fake.rows("users").push(userRow(a))
        fake.auth.signInAs(a)
        fake.auth.startRedirect()
        const sinks = createTestTelemetry()
        renderApp({ fake, telemetry: sinks.telemetry })
        await sinks.arrive()

        act(() => fake.auth.finishRedirect(null))

        await signedInHeader("אלה")
        expect(sinks.posthogCalls).toEqual([`identify ${a.id}`])
    })
})

describe("a profile that can't load", () => {
    it("still offers sign-out", async () => {
        const fake = backend()
        fake.failTable("users", "503 Service Unavailable")
        const user = testUser("creator")
        renderApp({ fake, signedInAs: user })

        await waitFor(async () => {
            expect(await menuItems()).toEqual([
                "כל הארועים",
                "אודות",
                "התנתק/י",
            ])
        })
        expect(
            within(header()).queryByRole("link", { name: "התחבר/י" }),
        ).not.toBeInTheDocument()

        await userEvent.click(screen.getByRole("button", { name: "התנתק/י" }))
        expect(fake.auth.calls).toEqual([
            { method: "signOut", userId: user.id },
        ])
    })

    it("makes a guarded page say so, with a retry", async () => {
        const fake = backend()
        fake.failTable("users", "503 Service Unavailable")
        renderApp({
            fake,
            routes: withAdminPage(),
            path: "/admin-only",
            signedInAs: testUser("admin"),
        })

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "לא הצלחנו לטעון את פרטי החשבון",
        )
        expect(
            screen.getByRole("link", { name: "חזרה ללוח האירועים" }),
        ).toHaveAttribute("href", "/")

        fake.healTable("users")
        await userEvent.click(screen.getByRole("button", { name: "נסו שוב" }))

        expect(
            await screen.findByRole("heading", { name: "לוח ניהול" }),
        ).toBeVisible()
    })
})

describe("profile row", () => {
    it("records the build and the sign-in once per boot, without holding anything up", async () => {
        vi.useFakeTimers({ toFake: ["Date"] })
        try {
            vi.setSystemTime(NOW)
            const fake = backend()
            const user = testUser("user")
            renderApp({ fake, now: NOW, signedInAs: user })
            await signedInHeader(user.name!)
            const updates = () =>
                fake.requests.filter((r) => r.method === "update")
            await waitFor(() => expect(updates()).toHaveLength(1))
            expect(updates()[0]).toMatchObject({
                table: "users",
                body: { version: "test", last_signin: NOW.toISOString() },
                filters: [{ op: "eq", column: "id", value: user.id }],
                token: `token-${user.id}-1`,
            })

            // The profile refreshes when the app returns after a while…
            setPageVisibility("hidden")
            vi.setSystemTime(NOW.getTime() + 6 * 60 * 1000)
            setPageVisibility("visible")
            await waitFor(() =>
                expect(
                    fake.requests.filter(
                        (r) => r.table === "users" && r.method === "select",
                    ),
                ).toHaveLength(2),
            )
            // …but the sign-in was recorded already.
            expect(updates()).toHaveLength(1)
        } finally {
            vi.useRealTimers()
        }
    })

    it("is created once when another tab creates it first", async () => {
        const fake = backend()
        const user = testUser("user", { name: "נועה" })
        fake.auth.signInAs(user)
        // Another tab's insert lands between our read and our insert.
        fake.beforeExecute((request) => {
            if (request.method === "insert" && request.table === "users") {
                fake.rows("users").push(userRow(user))
            }
        })
        renderApp({ fake })

        await signedInHeader("נועה")
        expect(
            fake.requests
                .filter((r) => r.table === "users")
                .map((r) => r.method),
        ).toEqual(["select", "insert", "select", "update"])
        expect(fake.rows("users")).toHaveLength(1)
    })
})
