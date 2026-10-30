import { describe, it, expect } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderApp } from "../../test/renderApp"
import { createFakeDataClient } from "../../test/fakeDataClient"

// "Today" in these tests is Friday 2026-10-30 in Asia/Jerusalem.
const NOW = new Date("2026-10-30T09:00:00Z")

function event(overrides: Record<string, unknown>) {
    return {
        id: crypto.randomUUID(),
        short_id: null,
        title: "ג'אם",
        start_date: "2026-11-01",
        end_date: "2026-11-01",
        hide: false,
        cancelled: false,
        ...overrides,
    }
}

async function eventTitles() {
    const list = await screen.findByRole("list", { name: "אירועים קרובים" })
    return within(list)
        .getAllByRole("heading")
        .map((h) => h.textContent)
}

describe("public calendar (/)", () => {
    it("lists upcoming visible events in date order", async () => {
        const fake = createFakeDataClient({
            ci_events: [
                event({ title: "סדנה בירושלים", start_date: "2026-11-12" }),
                event({ title: "ג'אם בתל אביב", start_date: "2026-10-31" }),
                event({ title: "שיעור בחיפה", start_date: "2026-10-30" }),
            ],
        })

        renderApp({ fake, now: NOW })

        expect(await eventTitles()).toEqual([
            "שיעור בחיפה",
            "ג'אם בתל אביב",
            "סדנה בירושלים",
        ])
    })

    it("never shows hidden events", async () => {
        const fake = createFakeDataClient({
            ci_events: [
                event({ title: "טיוטה מוסתרת", hide: true }),
                event({ title: "ג'אם פומבי" }),
            ],
        })

        renderApp({ fake, now: NOW })

        expect(await eventTitles()).toEqual(["ג'אם פומבי"])
    })

    it("shows the window from today (Jerusalem) up to 90 days ahead", async () => {
        const fake = createFakeDataClient({
            ci_events: [
                event({ title: "אתמול", start_date: "2026-10-29" }),
                event({ title: "היום", start_date: "2026-10-30" }),
                event({ title: "בעוד 90 יום", start_date: "2027-01-28" }),
                event({ title: "בעוד 91 יום", start_date: "2027-01-29" }),
            ],
        })

        renderApp({ fake, now: NOW })

        expect(await eventTitles()).toEqual(["היום", "בעוד 90 יום"])
    })

    it("uses the Jerusalem calendar day, not the UTC one", async () => {
        // 22:30 UTC on Oct 30 is already Oct 31 in Jerusalem (UTC+2).
        const fake = createFakeDataClient({
            ci_events: [
                event({ title: "ה-30", start_date: "2026-10-30" }),
                event({ title: "ה-31", start_date: "2026-10-31" }),
            ],
        })

        renderApp({ fake, now: new Date("2026-10-30T22:30:00Z") })

        expect(await eventTitles()).toEqual(["ה-31"])
    })

    it("boots with exactly one request, shared by the prefetch and the page", async () => {
        const fake = createFakeDataClient({
            ci_events: [event({ title: "ג'אם" })],
        })

        renderApp({ fake, now: NOW })
        await eventTitles()

        expect(fake.requests).toHaveLength(1)
        expect(fake.requests[0].table).toBe("ci_events")
    })

    it("reuses the boot request when the calendar is opened later", async () => {
        // A visitor lands on another page first; boot has already fetched
        // the calendar by the time they navigate to it.
        const fake = createFakeDataClient({
            ci_events: [event({ title: "ג'אם" })],
        })

        renderApp({ fake, path: "/no/such/page", now: NOW })
        await userEvent.click(
            await screen.findByRole("link", { name: "חזרה ללוח האירועים" }),
        )

        expect(await eventTitles()).toEqual(["ג'אם"])
        expect(fake.requests).toHaveLength(1)
    })

    it("marks cancelled events", async () => {
        const fake = createFakeDataClient({
            ci_events: [event({ title: "ג'אם", cancelled: true })],
        })

        renderApp({ fake, now: NOW })

        const list = await screen.findByRole("list", {
            name: "אירועים קרובים",
        })
        expect(within(list).getByText("בוטל")).toBeInTheDocument()
    })

    it("says so when there are no upcoming events", async () => {
        renderApp({ now: NOW })

        expect(await screen.findByText("אין אירועים קרובים")).toBeVisible()
    })

    it("offers a retry when loading fails, and recovers", async () => {
        const fake = createFakeDataClient({
            ci_events: [event({ title: "ג'אם" })],
        })
        fake.failTable("ci_events", "network down")

        renderApp({ fake, now: NOW })

        const retry = await screen.findByRole("button", { name: "נסו שוב" })
        fake.healTable("ci_events")
        await userEvent.click(retry)

        expect(await eventTitles()).toEqual(["ג'אם"])
    })
})

describe("unknown pages", () => {
    it("renders a 404 page with a way back to the calendar", async () => {
        renderApp({ path: "/no/such/page", now: NOW })

        expect(
            await screen.findByRole("heading", { name: "הדף לא נמצא" }),
        ).toBeVisible()
        expect(
            screen.getByRole("link", { name: "חזרה ללוח האירועים" }),
        ).toHaveAttribute("href", "/")
    })
})
