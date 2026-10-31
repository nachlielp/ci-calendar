import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Link } from "react-router"
import { describe, expect, it, vi } from "vitest"
import { event } from "../test/testEvents"
import { createFakeDataClient } from "../test/fakeDataClient"
import { installServiceWorkerAndCaches } from "../test/browser"
import { renderApp } from "../test/renderApp"
import { createMemoryStorage } from "./deviceStorage"
import { RootLayout } from "./RootLayout"

/** The app header: the bar holding the menu button. */
const header = () =>
    screen
        .getAllByRole("banner")
        .find((bar) =>
            within(bar).queryByRole("button", { name: /תפריט|menu/i }),
        ) as HTMLElement

async function openMenu() {
    await userEvent.click(screen.getByRole("button", { name: "פתח תפריט" }))
    return screen.findByRole("dialog", { name: "תפריט" })
}

describe("header", () => {
    it("offers a signed-out visitor login, the languages and the menu", async () => {
        renderApp()

        const bar = header()
        expect(
            within(bar).getByRole("button", { name: "שפה: עברית" }),
        ).toBeInTheDocument()
        expect(
            within(bar).getByRole("button", { name: "פתח תפריט" }),
        ).toBeInTheDocument()
        expect(
            within(bar).getByRole("link", { name: "התחבר/י" }),
        ).toHaveAttribute("href", "/login")
        // Already home.
        expect(
            within(bar).queryByRole("link", { name: "כל הארועים" }),
        ).not.toBeInTheDocument()
    })

    it("shows that the events may be out of date on every page", async () => {
        renderApp({ path: "/about" })
        await screen.findByRole("heading", { name: "אודות הפרוייקט" })
        // The boot request loaded the events while the visitor reads.
        await waitFor(() =>
            expect(screen.queryByText(/טוען/)).not.toBeInTheDocument(),
        )

        act(() => {
            window.dispatchEvent(new Event("offline"))
        })

        expect(within(header()).getByRole("status")).toHaveTextContent(
            "אין חיבור לאינטרנט – ייתכן שהאירועים אינם מעודכנים",
        )
    })
})

describe("menu", () => {
    it("lists the calendar and the about page for a signed-out visitor", async () => {
        renderApp()

        const menu = await openMenu()

        const links = within(menu).getAllByRole("link")
        expect(links.map((link) => link.textContent)).toEqual([
            "כל הארועים",
            "אודות",
        ])
        expect(
            within(menu).getByRole("link", { name: "כל הארועים" }),
        ).toHaveAttribute("aria-current", "page")
    })

    it("closes on Escape, returning focus to the menu button", async () => {
        renderApp()
        await openMenu()

        await userEvent.keyboard("{Escape}")

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        expect(screen.getByRole("button", { name: "פתח תפריט" })).toHaveFocus()
    })

    it("opens a page and closes", async () => {
        const { router } = renderApp()
        const menu = await openMenu()

        await userEvent.click(within(menu).getByRole("link", { name: "אודות" }))

        expect(
            await screen.findByRole("heading", { name: "אודות הפרוייקט" }),
        ).toBeInTheDocument()
        expect(router.state.location.pathname).toBe("/about")
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("speaks the chosen language", async () => {
        const storage = createMemoryStorage()
        storage.setItem("language", "en")
        renderApp({ storage })

        await userEvent.click(screen.getByRole("button", { name: "Open menu" }))

        const menu = await screen.findByRole("dialog", { name: "Menu" })
        expect(
            within(menu)
                .getAllByRole("link")
                .map((link) => link.textContent),
        ).toEqual(["Home", "About"])
    })
})

describe("static pages", () => {
    it.each([
        ["/about", "אודות הפרוייקט"],
        ["/privacy-policy", "מדיניות הפרטיות"],
        ["/terms-and-conditions", "תנאי השירות והגבלות"],
    ])(
        "opens %s without waiting for the events, with a way home",
        async (path, title) => {
            const fake = createFakeDataClient({
                ci_events: [event({ title: "ג'אם" })],
            })
            fake.holdTable("ci_events")
            const { router } = renderApp({ path, fake })

            expect(
                await screen.findByRole("heading", { level: 1, name: title }),
            ).toBeInTheDocument()

            await userEvent.click(
                within(header()).getByRole("link", { name: "כל הארועים" }),
            )
            fake.releaseTable("ci_events")

            expect(await screen.findByText("ג'אם")).toBeInTheDocument()
            expect(router.state.location.pathname).toBe("/")
        },
    )

    it("shows the about page in English and Russian", async () => {
        const storage = createMemoryStorage()
        storage.setItem("language", "en")
        const { unmount } = renderApp({ path: "/about", storage })
        expect(
            await screen.findByRole("heading", { name: "About the project" }),
        ).toBeInTheDocument()
        expect(
            screen.getAllByRole("link", { name: /Donate with PayBox/ })[0],
        ).toHaveAttribute("href", expect.stringContaining("payboxapp"))
        unmount()

        storage.setItem("language", "ru")
        renderApp({ path: "/about", storage })
        expect(
            await screen.findByRole("heading", { name: "О проекте" }),
        ).toBeInTheDocument()
    })

    it("keeps the legal text in Hebrew, saying so in other languages", async () => {
        const storage = createMemoryStorage()
        storage.setItem("language", "en")
        renderApp({ path: "/privacy-policy", storage })

        expect(
            await screen.findByRole("heading", { name: "Privacy policy" }),
        ).toBeInTheDocument()
        expect(
            screen.getByText("This document is available in Hebrew only."),
        ).toBeInTheDocument()
        expect(
            screen
                .getByRole("heading", { name: "1. מידע כללי" })
                .closest("[lang]"),
        ).toHaveAttribute("lang", "he")
    })

    it("links the legal pages from the footer", async () => {
        const { router } = renderApp({ path: "/about" })
        await screen.findByRole("heading", { name: "אודות הפרוייקט" })

        await userEvent.click(
            screen.getByRole("link", { name: "תנאי השירות והגבלות" }),
        )

        expect(
            await screen.findByRole("heading", {
                level: 1,
                name: "תנאי השירות והגבלות",
            }),
        ).toBeInTheDocument()
        expect(router.state.location.pathname).toBe("/terms-and-conditions")
    })
})

describe("footer", () => {
    it("closes the calendar list", async () => {
        renderApp({
            fake: createFakeDataClient({ ci_events: [event()] }),
        })
        await screen.findByText("ג'אם")

        expect(screen.getByRole("contentinfo")).toHaveTextContent(
            "עמותת הקונטקט בישראל",
        )
    })

    it("closes the month calendar and an empty list too, as legacy", async () => {
        const { unmount } = renderApp({
            fake: createFakeDataClient({ ci_events: [] }),
        })
        await screen.findByText("אין אירועים קרובים")
        expect(screen.getByRole("contentinfo")).toBeInTheDocument()
        unmount()

        renderApp({ fake: createFakeDataClient({ ci_events: [event()] }) })
        await screen.findByText("ג'אם")
        await userEvent.click(
            screen.getByRole("button", { name: "צפייה באירועים לפי לוח שנה" }),
        )
        expect(
            screen.queryByRole("list", { name: "אירועים קרובים" }),
        ).toBeNull()
        expect(screen.getByRole("contentinfo")).toBeInTheDocument()
    })

    it("resets the app after asking: storage, service workers and caches wiped, page reloaded", async () => {
        const removed = installServiceWorkerAndCaches(["workbox-precache"])
        const storage = createMemoryStorage()
        storage.setItem("language", "en")
        storage.setItem("isInternal", "true")
        const { reloads } = renderApp({ path: "/about", storage })
        const version = await screen.findByRole("button", {
            name: "Reset the app (version test)",
        })

        await userEvent.click(version)
        const question = { name: "Reset the app?" }
        await userEvent.click(
            within(await screen.findByRole("dialog", question)).getByRole(
                "button",
                { name: "Cancel" },
            ),
        )
        expect(storage.getItem("language")).toBe("en")
        expect(reloads.count).toBe(0)

        await userEvent.click(version)
        await userEvent.click(
            within(await screen.findByRole("dialog", question)).getByRole(
                "button",
                { name: "Reset" },
            ),
        )

        await waitFor(() => expect(reloads.count).toBe(1))
        expect(storage.getItem("language")).toBeNull()
        // The team's own devices stay out of analytics.
        expect(storage.getItem("isInternal")).toBe("true")
        expect(removed).toEqual({
            unregistered: 1,
            deletedCaches: ["workbox-precache"],
        })
    })
})

describe("WhatsApp", () => {
    it("has no WhatsApp link (the service isn't running)", () => {
        renderApp()

        expect(
            within(header())
                .queryAllByRole("link")
                .filter((link) =>
                    /wa\.me|whatsapp:/.test(link.getAttribute("href") ?? ""),
                ),
        ).toEqual([])
    })
})

describe("page loading", () => {
    it("keeps the page and shows a loading bar while the next page's code downloads", async () => {
        let arrive: () => void = () => {}
        const download = new Promise<void>((resolve) => (arrive = resolve))
        function Slow() {
            return <h1>עמוד איטי</h1>
        }
        const { router } = renderApp({
            routes: [
                {
                    element: <RootLayout />,
                    children: [
                        {
                            index: true,
                            element: <Link to="/slow">לעמוד</Link>,
                        },
                        {
                            path: "slow",
                            lazy: async () => {
                                await download
                                return { Component: Slow }
                            },
                        },
                    ],
                },
            ],
        })

        await userEvent.click(
            await screen.findByRole("link", { name: "לעמוד" }),
        )

        const loading = () =>
            screen
                .queryAllByRole("status")
                .find((status) => status.textContent === "טוען…")
        await waitFor(() => expect(loading()).toBeDefined())
        expect(screen.getByRole("link", { name: "לעמוד" })).toBeInTheDocument()

        await act(async () => arrive())

        expect(
            await screen.findByRole("heading", { name: "עמוד איטי" }),
        ).toBeInTheDocument()
        expect(loading()).toBeUndefined()
        expect(router.state.location.pathname).toBe("/slow")
    })
})

describe("maintenance (VITE_DISABLE_APP)", () => {
    it("shows every page closed for maintenance, in the chosen language", async () => {
        vi.stubEnv("VITE_DISABLE_APP", "true")
        const fake = createFakeDataClient({
            ci_events: [event({ title: "ג'אם" })],
        })
        const { unmount } = renderApp({ fake })

        expect(
            await screen.findByRole("heading", {
                name: "קונטקט אימפרוביזציה ישראל",
            }),
        ).toBeInTheDocument()
        expect(screen.getByText("סגור לרגל שיפוצים")).toBeInTheDocument()
        expect(screen.queryByText("ג'אם")).not.toBeInTheDocument()
        expect(screen.queryByRole("banner")).not.toBeInTheDocument()
        unmount()

        const storage = createMemoryStorage()
        storage.setItem("language", "en")
        renderApp({ path: "/about", storage })
        expect(
            await screen.findByText("Closed for maintenance"),
        ).toBeInTheDocument()
    })

    it("is off unless set to true", async () => {
        vi.stubEnv("VITE_DISABLE_APP", "false")
        renderApp({
            fake: createFakeDataClient({
                ci_events: [event({ title: "ג'אם" })],
            }),
        })

        expect(await screen.findByText("ג'אם")).toBeInTheDocument()
        expect(screen.queryByText("סגור לרגל שיפוצים")).not.toBeInTheDocument()
    })
})
