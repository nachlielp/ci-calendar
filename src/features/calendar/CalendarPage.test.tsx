import { describe, it, expect } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderApp } from "../../test/renderApp"
import { createFakeDataClient } from "../../test/fakeDataClient"
import {
    bio,
    event,
    eventCard,
    eventTitles,
    segment,
    tagging,
} from "./testEvents"

// "Today" in these tests is Friday 2026-10-30 in Asia/Jerusalem.
const NOW = new Date("2026-10-30T09:00:00Z")

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

    it("orders events on the same day by start time", async () => {
        const fake = createFakeDataClient({
            ci_events: [
                event({
                    title: "ג'אם ערב",
                    segments: [
                        segment({
                            startTime: "2026-11-01T18:00:00Z",
                            endTime: "2026-11-01T20:00:00Z",
                        }),
                    ],
                }),
                event({
                    title: "שיעור בוקר",
                    segments: [
                        segment({
                            startTime: "2026-11-01T07:00:00Z",
                            endTime: "2026-11-01T08:00:00Z",
                        }),
                    ],
                }),
            ],
        })

        renderApp({ fake, now: NOW })

        expect(await eventTitles()).toEqual(["שיעור בוקר", "ג'אם ערב"])
    })

    it("shows each event's card: day, time, place, teachers, organisers and types", async () => {
        const noa = bio({ bio_name: "נועה כהן" })
        const deepContact = bio({ bio_name: "DeepContact", user_type: "org" })
        const jam = event({
            title: "שיעור וג'אם",
            start_date: "2026-11-07",
            end_date: "2026-11-07",
            address: { label: "יער המאכל", place_id: "P1" },
            organisations: [
                { label: "DeepContact ", value: deepContact.user_id },
            ],
            segments: [
                segment({
                    type: "class",
                    startTime: "2026-11-07T17:00:00Z",
                    endTime: "2026-11-07T18:30:00Z",
                    teachers: [
                        { label: "נועה", value: noa.user_id },
                        { label: "רותם רם", value: "רותם רם" },
                    ],
                }),
                segment({
                    type: "jam",
                    startTime: "2026-11-07T18:30:00Z",
                    endTime: "2026-11-07T21:00:00Z",
                }),
            ],
        })
        const fake = createFakeDataClient({
            ci_events: [jam],
            public_bio: [noa, deepContact],
            ci_events_users_junction: [
                tagging(jam, noa),
                tagging(jam, deepContact),
            ],
        })

        renderApp({ fake, now: NOW })

        const card = await eventCard("שיעור וג'אם")
        expect(card).toHaveTextContent("שבת, יום שבת 7 בנובמבר")
        expect(card).toHaveTextContent("19:00 - 23:00")
        expect(card).toHaveTextContent("יער המאכל")
        // Teachers and organisers by their public bio's name when they have one.
        expect(card).toHaveTextContent("עם נועה כהן, רותם רם")
        expect(card).toHaveTextContent("DeepContact")
        expect(within(card).getByText("שיעור")).toBeVisible()
        expect(within(card).getByText("ג'אם")).toBeVisible()
    })

    it("shows a multi-day event's day range", async () => {
        const fake = createFakeDataClient({
            ci_events: [
                event({
                    title: "ריטריט",
                    start_date: "2026-11-06",
                    end_date: "2026-11-08",
                    type: "retreat",
                    segments: [],
                }),
            ],
        })

        renderApp({ fake, now: NOW })

        const card = await eventCard("ריטריט")
        expect(card).toHaveTextContent(
            "שישי, יום שישי 6 בנובמבר - ראשון, יום ראשון 8 בנובמבר",
        )
    })

    it("marks cancelled events with their cancellation text", async () => {
        const fake = createFakeDataClient({
            ci_events: [
                event({
                    title: "ג'אם",
                    cancelled: true,
                    cancelled_text: "נדחה לשבוע הבא",
                }),
            ],
        })

        renderApp({ fake, now: NOW })

        const card = await eventCard("ג'אם")
        expect(within(card).getByText("האירוע בוטל")).toBeVisible()
        expect(within(card).getByText("נדחה לשבוע הבא")).toBeVisible()
        // As in the legacy app, a cancelled event doesn't open.
        expect(within(card).queryByRole("link")).toBeNull()
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
