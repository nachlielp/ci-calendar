import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { createTestTelemetry } from "../../test/fakeTelemetry"
import { renderApp } from "../../test/renderApp"
import { testUser, userRow } from "@ci-calendar/core/testing/testUsers"
import { event } from "@ci-calendar/core/testing/testEvents"

const backend = () =>
    createFakeDataClient({ ci_events: [event({ title: "ג'אם" })] })

const type = (label: string, text: string) =>
    userEvent.type(screen.getByLabelText(label), text)

/** The menu's items, once the signed-in user's role is known. */
async function menuItems() {
    await userEvent.click(screen.getByRole("button", { name: "פתח תפריט" }))
    const menu = await screen.findByRole("dialog", { name: "תפריט" })
    return within(menu)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
}

describe("login (/login)", () => {
    it("signs in with email and password and goes to the calendar", async () => {
        const fake = backend()
        const user = testUser("creator", { name: "דנה" })
        fake.rows("users").push(userRow(user))
        fake.auth.accounts.push(user)
        const { router } = renderApp({ fake, path: "/login" })

        await screen.findByRole("heading", { name: "כניסה והזדהות" })
        await type("אימייל", user.email)
        await type("סיסמה", user.password!)
        await userEvent.click(screen.getByRole("button", { name: "כניסה" }))

        await waitFor(() => expect(router.state.location.pathname).toBe("/"))
        expect(fake.auth.calls).toEqual([
            {
                method: "signInWithPassword",
                email: user.email,
                password: user.password,
            },
        ])
        expect(await screen.findByText("דנה")).toBeVisible()
        expect(await menuItems()).toContain("האירועים שלי")
        const profile = fake.requests.find((r) => r.table === "users")
        expect(profile?.token).toBe(fake.auth.accessToken())
    })

    it("says so when the sign-in fails, and stays", async () => {
        const fake = backend()
        fake.auth.accounts.push(testUser("user"))
        const { router } = renderApp({ fake, path: "/login" })

        await screen.findByRole("heading", { name: "כניסה והזדהות" })
        await type("אימייל", "user@example.com")
        await type("סיסמה", "wrong")
        await userEvent.click(screen.getByRole("button", { name: "כניסה" }))

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "שגיאת התחברות",
        )
        expect(router.state.location.pathname).toBe("/login")
        expect(screen.getByLabelText("סיסמה")).toHaveAttribute(
            "aria-invalid",
            "true",
        )
    })

    it("leaves for Google's sign-in", async () => {
        const fake = backend()
        renderApp({ fake, path: "/login" })

        await userEvent.click(
            await screen.findByRole("button", { name: /כניסה עם/ }),
        )

        expect(fake.auth.calls).toEqual([{ method: "signInWithGoogle" }])
    })

    it("links to sign-up and the password reset, and shows the password on request", async () => {
        renderApp({ fake: backend(), path: "/login" })

        expect(
            await screen.findByRole("link", { name: "הרשם" }),
        ).toHaveAttribute("href", "/signup")
        expect(
            screen.getByRole("link", { name: "איפוס סיסמה" }),
        ).toHaveAttribute("href", "/reset-password-request")

        const password = screen.getByLabelText("סיסמה")
        expect(password).toHaveAttribute("type", "password")
        await userEvent.click(
            screen.getByRole("button", { name: "הצגת הסיסמה" }),
        )
        expect(password).toHaveAttribute("type", "text")
    })

    it("loads the auth client for the visitor, and speaks their language", async () => {
        const storage = createMemoryStorage()
        storage.setItem("language", "en")
        const fake = backend()
        renderApp({ fake, storage, path: "/login" })

        expect(
            await screen.findByRole("heading", { name: "Login" }),
        ).toBeVisible()
        expect(screen.getByLabelText("Email")).toBeVisible()
        expect(screen.getByRole("button", { name: "Sign In" })).toBeVisible()
        // The page starts auth in an effect, which may run just after the
        // heading appears.
        await waitFor(() => expect(fake.auth.started).toBe(true))
    })
})

describe("sign-up (/signup)", () => {
    async function signUp(password = "secret1", repeat = password) {
        await screen.findByRole("heading", { name: "הרשם" })
        await type("שם", "נועה")
        await type("אימייל", "noa@example.com")
        await type("סיסמה", password)
        await type("אימות סיסמה חדשה", repeat)
        await userEvent.click(screen.getByRole("button", { name: /^הרשם$/ }))
    }

    it("creates the account and its user profile, signed in", async () => {
        const fake = backend()
        const { router } = renderApp({ fake, path: "/signup" })

        await signUp()

        await waitFor(() => expect(router.state.location.pathname).toBe("/"))
        expect(fake.auth.calls).toEqual([
            {
                method: "signUp",
                name: "נועה",
                email: "noa@example.com",
                password: "secret1",
            },
        ])
        expect(await screen.findByText("נועה")).toBeVisible()
        const id = fake.auth.session()!.user.id
        // As legacy: no row yet, so the client inserts a plain user's.
        const insert = fake.requests.find((r) => r.method === "insert")
        expect(insert).toMatchObject({
            table: "users",
            token: fake.auth.accessToken(),
            body: {
                id,
                user_type: "user",
                user_name: "נועה",
                email: "noa@example.com",
                provider: "email",
                subscriptions: { teachers: [], orgs: [] },
                version: "test",
            },
        })
        expect(fake.rows("users")).toHaveLength(1)
        expect(await menuItems()).toContain("הרשם כמורה או ארגון")
    })

    it("checks the passwords match before asking", async () => {
        const fake = backend()
        renderApp({ fake, path: "/signup" })

        await signUp("secret1", "secret2")

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "הסיסמאות לא תואמות",
        )
        expect(fake.auth.calls).toEqual([])
    })

    it("says when the password is too weak or the email is taken", async () => {
        const fake = backend()
        fake.auth.accounts.push(testUser("user", { email: "noa@example.com" }))
        renderApp({ fake, path: "/signup" })

        await signUp()
        expect(await screen.findByRole("alert")).toHaveTextContent(
            "כבר קיים חשבון עם כתובת המייל הזו",
        )

        fake.auth.fail("signUp", {
            message: "Password should be at least 6 characters.",
            code: "weak_password",
        })
        await userEvent.click(screen.getByRole("button", { name: /^הרשם$/ }))
        await waitFor(() =>
            expect(screen.getByRole("alert")).toHaveTextContent(
                "סיסמה חייבת להיות לפחות 6 תווים",
            ),
        )
    })
})

describe("password reset request (/reset-password-request)", () => {
    it("emails a link back to the reset page and locks the form", async () => {
        const fake = backend()
        renderApp({ fake, path: "/reset-password-request" })

        await screen.findByRole("heading", { name: "שכחת סיסמה?" })
        await type("אימייל", "noa@example.com")
        await userEvent.click(
            screen.getByRole("button", { name: "איפוס סיסמה" }),
        )

        expect(await screen.findByRole("status")).toHaveTextContent(
            /הקישור לאיפוס הסיסמה ישלח/,
        )
        expect(fake.auth.calls).toEqual([
            {
                method: "requestPasswordReset",
                email: "noa@example.com",
                redirectTo: `${window.location.origin}/reset-password`,
            },
        ])
        expect(screen.getByLabelText("אימייל")).toBeDisabled()
        expect(
            screen.queryByRole("button", { name: "איפוס סיסמה" }),
        ).not.toBeInTheDocument()
    })

    it("says so when sending fails", async () => {
        const fake = backend()
        fake.auth.fail("requestPasswordReset", { message: "rate limited" })
        renderApp({ fake, path: "/reset-password-request" })

        await screen.findByRole("heading", { name: "שכחת סיסמה?" })
        await type("אימייל", "noa@example.com")
        await userEvent.click(
            screen.getByRole("button", { name: "איפוס סיסמה" }),
        )

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "השיחזור נכשל",
        )
    })
})

describe("password reset (/reset-password)", () => {
    async function save(password: string, repeat = password) {
        await screen.findByRole("heading", { name: "איפוס סיסמה" })
        await type("סיסמה חדשה", password)
        await type("אימות סיסמה חדשה", repeat)
        await userEvent.click(screen.getByRole("button", { name: "שמירה" }))
    }

    it("sets the new password for the signed-in (recovering) user", async () => {
        const fake = backend()
        const user = testUser("user")
        renderApp({ fake, path: "/reset-password", signedInAs: user })

        await save("new-secret")

        expect(await screen.findByRole("status")).toHaveTextContent(
            "הסיסמה עודכנה בהצלחה",
        )
        expect(fake.auth.calls).toEqual([
            {
                method: "updatePassword",
                userId: user.id,
                password: "new-secret",
            },
        ])
        expect(screen.getByLabelText("סיסמה חדשה")).toHaveValue("")
    })

    it("checks the passwords before saving", async () => {
        const fake = backend()
        renderApp({ fake, path: "/reset-password", signedInAs: testUser() })

        await save("short", "other")

        expect(
            await screen.findByText("הסיסמה חייבת להכיל לפחות 6 תווים"),
        ).toBeVisible()
        expect(screen.getByText("הסיסמאות אינן תואמות")).toBeVisible()
        expect(fake.auth.calls).toEqual([])
    })

    it("asks for a password different from the current one", async () => {
        const fake = backend()
        fake.auth.fail("updatePassword", {
            message: "New password should be different from the old password.",
            code: "same_password",
        })
        renderApp({ fake, path: "/reset-password", signedInAs: testUser() })

        await save("same-secret")

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית",
        )
    })

    it("fails without a session (an expired link)", async () => {
        const fake = backend()
        renderApp({ fake, path: "/reset-password" })

        await save("new-secret")

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "אירעה שגיאה בעת עדכון הסיסמה. אנא נסו שוב.",
        )
    })

    it("says an expired or used link expired, offers a new one, and reports nothing", async () => {
        const fake = backend()
        fake.auth.failRedirect({
            message: "Email link is invalid or has expired",
            code: "otp_expired",
        })
        const sinks = createTestTelemetry()
        renderApp({ fake, path: "/reset-password", telemetry: sinks.telemetry })
        await sinks.arrive()

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "הקישור לאיפוס הסיסמה פג תוקף או שכבר נעשה בו שימוש.",
        )
        expect(
            screen.getByRole("link", { name: "שלחו לי קישור חדש" }),
        ).toHaveAttribute("href", "/reset-password-request")
        expect(screen.queryByLabelText("סיסמה חדשה")).not.toBeInTheDocument()
        expect(sinks.errors).toEqual([])
    })

    it("says so in the visitor's language", async () => {
        const storage = createMemoryStorage()
        storage.setItem("language", "ru")
        const fake = backend()
        fake.auth.failRedirect({ message: "expired", code: "otp_expired" })
        renderApp({ fake, storage, path: "/reset-password" })

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Срок действия ссылки для сброса пароля истёк",
        )
    })
})
