import { describe, expect, it } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
    createMemoryStorage,
    type DeviceStorage,
} from "../../app/deviceStorage"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { renderApp } from "../../test/renderApp"
import { event, segment } from "./testEvents"

// "Today" in these tests is Friday 2026-10-30 in Asia/Jerusalem.
const NOW = new Date("2026-10-30T09:00:00Z")

const translated = event({
    short_id: "Tr1",
    title: "שיעור קונטקט",
    lng_titles: { en: "Contact class", ru: "Урок контакта" },
    start_date: "2026-11-01",
    address: { label: "תל אביב", en_label: "Tel Aviv", place_id: "P1" },
    segments: [segment({ type: "class" })],
    description: "מביאים בגדים נוחים",
    price: [{ title: "כניסה", sum: 50 }],
})
const englishOnly = event({
    title: "ג'אם בירושלים",
    lng_titles: { en: "Jam in Jerusalem" },
    start_date: "2026-11-02",
    address: { label: "ירושלים", place_id: "P2" },
    district: "jerusalem",
    segments: [
        segment({
            type: "jam",
            startTime: "2026-11-02T17:00:00Z",
            endTime: "2026-11-02T19:00:00Z",
        }),
    ],
})

const seeded = () =>
    createFakeDataClient({ ci_events: [translated, englishOnly] })

/** A storage where the visitor chose `language` on an earlier visit. */
function storageIn(language: string): DeviceStorage {
    const storage = createMemoryStorage()
    storage.setItem("language", language)
    return storage
}

const html = () => document.documentElement

async function listTitles(name: string) {
    const list = await screen.findByRole("list", { name })
    return within(list)
        .getAllByRole("heading")
        .map((heading) => heading.textContent)
}

async function chooseLanguage(current: string, name: string) {
    await userEvent.click(screen.getByRole("button", { name: current }))
    await userEvent.click(screen.getByRole("button", { name }))
}

describe("languages", () => {
    it("starts in Hebrew, right to left, on a first visit", async () => {
        renderApp({ fake: seeded(), now: NOW })

        expect(await listTitles("אירועים קרובים")).toEqual([
            "שיעור קונטקט",
            "ג'אם בירושלים",
        ])
        expect(
            screen.getByRole("heading", { name: "קונטקט אימפרוביזציה ישראל" }),
        ).toBeInTheDocument()
        expect(html()).toHaveAttribute("lang", "he")
        expect(html()).toHaveAttribute("dir", "rtl")
        expect(document.title).toBe(
            "לוח אירועי קונטקט אימפרוביזציה | CI Calendar",
        )
        expect(screen.getByText("תל אביב")).toBeInTheDocument()
    })

    it("switches to English, left to right, without another request", async () => {
        const storage = createMemoryStorage()
        const { fake } = renderApp({ fake: seeded(), now: NOW, storage })
        await listTitles("אירועים קרובים")
        const requests = fake.requests.length

        await chooseLanguage("שפה: עברית", "English")

        expect(await listTitles("Upcoming events")).toEqual([
            "Contact class",
            "Jam in Jerusalem",
        ])
        expect(
            screen.getByRole("heading", {
                name: "Israel Contact Improvisation",
            }),
        ).toBeInTheDocument()
        expect(screen.getByText("Everything, everywhere")).toBeInTheDocument()
        expect(html()).toHaveAttribute("lang", "en")
        expect(html()).toHaveAttribute("dir", "ltr")
        expect(document.title).toBe(
            "Contact Improvisation Events in Israel | CI Calendar",
        )
        // The English address where there is one, else the Hebrew.
        expect(screen.getByText("Tel Aviv")).toBeInTheDocument()
        expect(screen.getByText("ירושלים")).toBeInTheDocument()
        expect(screen.getByText("Sunday, November 1st")).toBeInTheDocument()
        expect(screen.getAllByText("Class").length).toBeGreaterThan(0)
        expect(storage.getItem("language")).toBe("en")
        expect(fake.requests).toHaveLength(requests)
    })

    it("shows Russian titles, else the Hebrew title, and English addresses", async () => {
        renderApp({ fake: seeded(), now: NOW, storage: storageIn("ru") })

        expect(await listTitles("Ближайшие события")).toEqual([
            "Урок контакта",
            // No Russian translation: Hebrew, not English, as legacy did.
            "ג'אם בירושלים",
        ])
        expect(html()).toHaveAttribute("lang", "ru")
        expect(html()).toHaveAttribute("dir", "ltr")
        expect(screen.getByText("Tel Aviv")).toBeInTheDocument()
        expect(screen.getByText("Воскресенье, 1 ноября")).toBeInTheDocument()
    })

    it("keeps the chosen language across a reload", async () => {
        const storage = createMemoryStorage()
        const first = renderApp({ fake: seeded(), now: NOW, storage })
        await listTitles("אירועים קרובים")
        await chooseLanguage("שפה: עברית", "Русский")
        await listTitles("Ближайшие события")
        first.unmount()
        // A reload starts from index.html's Hebrew page.
        html().lang = "he"
        html().dir = "rtl"

        renderApp({ fake: seeded(), now: NOW, storage })

        expect(await listTitles("Ближайшие события")).toHaveLength(2)
        expect(
            screen.getByRole("button", { name: "Язык: Русский" }),
        ).toBeInTheDocument()
        expect(html()).toHaveAttribute("dir", "ltr")
    })

    it("starts in Hebrew when the stored language is unknown", async () => {
        renderApp({ fake: seeded(), now: NOW, storage: storageIn("fr") })

        expect(await listTitles("אירועים קרובים")).toHaveLength(2)
        expect(html()).toHaveAttribute("dir", "rtl")
    })

    it("closes the language menu on Escape, keeping the language", async () => {
        renderApp({ fake: seeded(), now: NOW })
        await listTitles("אירועים קרובים")

        await userEvent.click(
            screen.getByRole("button", { name: "שפה: עברית" }),
        )
        expect(screen.getByRole("button", { name: "English" })).toBeVisible()
        await userEvent.keyboard("{Escape}")

        expect(
            screen.queryByRole("button", { name: "English" }),
        ).not.toBeInTheDocument()
        expect(html()).toHaveAttribute("lang", "he")
    })

    it("shows an event's details in the chosen language", async () => {
        renderApp({
            fake: seeded(),
            now: NOW,
            storage: storageIn("en"),
            path: "/event/Tr1",
        })

        const dialog = await screen.findByRole("dialog", {
            name: "Contact class",
        })
        expect(
            within(dialog).getByRole("heading", { name: "Contact class" }),
        ).toBeInTheDocument()
        expect(within(dialog).getByText("Tel Aviv")).toBeInTheDocument()
        expect(
            within(dialog).getByRole("heading", {
                name: "Additional Information",
            }),
        ).toBeInTheDocument()
        expect(
            within(dialog).getByRole("heading", { name: "Price" }),
        ).toBeInTheDocument()
        expect(
            within(dialog).getByRole("button", { name: "Close" }),
        ).toBeInTheDocument()
    })

    it("offers the filters in the chosen language", async () => {
        renderApp({ fake: seeded(), now: NOW, storage: storageIn("ru") })
        await listTitles("Ближайшие события")

        await userEvent.click(screen.getByRole("button", { name: /^Фильтр/ }))
        const dialog = await screen.findByRole("dialog", { name: "Фильтр" })
        await userEvent.click(
            within(dialog).getByRole("button", { name: "Джем" }),
        )

        expect(await listTitles("Ближайшие события")).toEqual(["ג'אם בירושלים"])
        expect(
            screen.getByRole("button", {
                name: /^Фильтр \(1 активный фильтр\)/,
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: "Убрать фильтр «Джем»" }),
        ).toBeInTheDocument()
    })

    it("shows the month calendar in the chosen language", async () => {
        renderApp({ fake: seeded(), now: NOW, storage: storageIn("ru") })
        await listTitles("Ближайшие события")

        await userEvent.click(
            screen.getByRole("button", {
                name: "Показать события в календаре",
            }),
        )
        expect(
            screen.getByRole("heading", { name: "Октябрь" }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole("columnheader", { name: "вс" }),
        ).toBeInTheDocument()
        await userEvent.click(
            screen.getByRole("button", { name: "Следующий месяц" }),
        )
        await userEvent.click(
            screen.getByRole("button", {
                name: "Воскресенье, 1 ноября, 1 событие",
            }),
        )

        expect(await listTitles("Воскресенье, 1 ноября")).toEqual([
            "Урок контакта",
        ])
    })

    it.each([
        [
            "he",
            "צפייה באירועים לפי לוח שנה",
            "אוקטובר",
            ["החודש הקודם", "החודש הבא"],
        ],
        [
            "en",
            "Show events on a calendar",
            "October",
            ["Previous month", "Next month"],
        ],
    ])(
        "puts the month controls in reading order, previous first (%s)",
        async (language, calendarView, month, controls) => {
            renderApp({
                fake: seeded(),
                now: NOW,
                storage: storageIn(language),
            })
            await screen.findByRole("list")

            await userEvent.click(
                screen.getByRole("button", { name: calendarView }),
            )

            // The row follows the page direction, so the first control is
            // at the start: previous month on the right in Hebrew, on the
            // left in English.
            const controller = screen.getByRole("heading", {
                name: month,
            }).parentElement!
            expect(
                within(controller)
                    .getAllByRole("button")
                    .map((button) => button.getAttribute("aria-label")),
            ).toEqual(controls)
        },
    )

    it("shows the 404 page in the chosen language", async () => {
        renderApp({ now: NOW, storage: storageIn("en"), path: "/no/such/page" })

        expect(
            await screen.findByRole("heading", { name: "Page not found" }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole("link", { name: "Back to the calendar" }),
        ).toBeInTheDocument()
    })
})
