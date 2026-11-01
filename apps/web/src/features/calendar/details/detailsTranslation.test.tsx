import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { createMemoryStorage } from "@ci-calendar/core/app/deviceStorage"
import { createFakeDataClient } from "../../../test/fakeDataClient"
import { fakeTranslation } from "@ci-calendar/core/testing/fakeFunctions"
import { renderApp } from "../../../test/renderApp"
import {
    bio,
    event,
    publicEvent,
    segment,
    tagging,
} from "@ci-calendar/core/testing/testEvents"
import { translatableTexts } from "./detailsTranslation"
import { TRANSLATIONS_KEY } from "../../../app/translationStore"

// Legacy FullEventCard machine-translated, in English and Russian, what the
// creator wrote with no stored translation (slice 13, through the
// `translate` function).

const NOW = new Date("2026-10-30T09:00:00Z")

const TEACHER = bio({
    bio_name: "נועה כהן",
    about: "מלמדת קונטקט עשר שנים",
    page_url: "https://noa.example.com",
    page_title: "האתר של נועה",
})
const theEvent = event({
    title: "שיעור קונטקט",
    lng_titles: { en: "Contact class", ru: "Урок контакта" },
    description: "מביאים בגדים נוחים",
    price: [{ title: "כניסה", sum: 50 }],
    links: [{ title: "הרשמה", link: "https://example.com" }],
    organisations: [
        { label: "סטודיו", value: "סטודיו" },
        { label: TEACHER.bio_name, value: TEACHER.user_id },
    ],
    segments: [
        segment({ teachers: [{ label: "מורה אורחת", value: "מורה אורחת" }] }),
    ],
})

function backend() {
    const fake = createFakeDataClient({
        ci_events: [theEvent],
        public_bio: [TEACHER],
        ci_events_users_junction: [tagging(theEvent, TEACHER)],
    })
    fake.functions.handle("translate", fakeTranslation)
    return fake
}

const LIST_NAMES: Record<string, string> = {
    he: "אירועים קרובים",
    en: "Upcoming events",
}

async function openDetails(
    language: string,
    title: string,
    storage = createMemoryStorage(),
) {
    storage.setItem("language", language)
    const fake = backend()
    const view = renderApp({ fake, now: NOW, storage })
    const list = await screen.findByRole("list", {
        name: LIST_NAMES[language],
    })
    const card = within(list)
        .getAllByRole("listitem")
        .find((item) => within(item).queryByRole("heading", { name: title }))!
    await userEvent.click(within(card).getByRole("link"))
    return {
        fake,
        view,
        dialog: await screen.findByRole("dialog", { name: title }),
    }
}

describe("translated event details", () => {
    it("translates what legacy translated, in English", async () => {
        const { fake, dialog } = await openDetails("en", "Contact class")

        await waitFor(() =>
            expect(dialog).toHaveTextContent("מביאים בגדים נוחים [en]"),
        )
        expect(dialog).toHaveTextContent("כניסה [en]: 50₪")
        expect(within(dialog).getByRole("link", { name: "הרשמה [en]" }))
        expect(dialog).toHaveTextContent("סטודיו [en]")
        // A tagged name is its bio's; segment teachers stay as written.
        expect(dialog).toHaveTextContent("נועה כהן")
        expect(dialog).not.toHaveTextContent("נועה כהן [en]")
        expect(dialog).toHaveTextContent("מורה אורחת")
        expect(dialog).not.toHaveTextContent("מורה אורחת [en]")
        expect(
            fake.functions.calls.map((call) => call.body.text).sort(),
        ).toEqual(["הרשמה", "כניסה", "מביאים בגדים נוחים", "סטודיו"].sort())
        expect(
            fake.functions.calls.every((call) => call.body.targetLang === "en"),
        ).toBe(true)
    })

    it("shows the Hebrew text while the translation is on its way, and if it fails", async () => {
        const storage = createMemoryStorage()
        storage.setItem("language", "ru")
        const fake = backend()
        fake.functions.fail("translate")
        renderApp({ fake, now: NOW, storage })
        const list = await screen.findByRole("list", {
            name: "Ближайшие события",
        })
        await userEvent.click(within(list).getByRole("link"))
        const dialog = await screen.findByRole("dialog", {
            name: "Урок контакта",
        })

        expect(dialog).toHaveTextContent("מביאים בגדים נוחים")
        await waitFor(() => expect(fake.functions.calls).toHaveLength(4))
        expect(dialog).toHaveTextContent("מביאים בגדים נוחים")
    })

    it("keeps translations on the device for the next visit", async () => {
        const storage = createMemoryStorage()
        const first = await openDetails("en", "Contact class", storage)
        await waitFor(() =>
            expect(first.dialog).toHaveTextContent("מביאים בגדים נוחים [en]"),
        )
        first.view.unmount()
        // A new page load: only what was written to the device remains.
        const reloaded = createMemoryStorage()
        reloaded.setItem(
            TRANSLATIONS_KEY,
            storage.getItem(TRANSLATIONS_KEY) ?? "",
        )

        const { fake, dialog } = await openDetails(
            "en",
            "Contact class",
            reloaded,
        )

        expect(dialog).toHaveTextContent("מביאים בגדים נוחים [en]")
        expect(fake.functions.calls).toEqual([])
    })

    it("translates a teacher's bio, but not their name", async () => {
        const { fake, dialog } = await openDetails("en", "Contact class")
        await userEvent.click(
            within(dialog).getByRole("button", { name: "נועה כהן" }),
        )
        const card = await screen.findByRole("dialog", { name: "נועה כהן" })

        await waitFor(() =>
            expect(card).toHaveTextContent("מלמדת קונטקט עשר שנים [en]"),
        )
        expect(
            within(card).getByRole("link", { name: "האתר של נועה [en]" }),
        ).toHaveAttribute("href", "https://noa.example.com")
        expect(card).toHaveTextContent("About נועה כהן")
        expect(
            fake.functions.calls.map((call) => call.body.text),
        ).not.toContain("נועה כהן")
    })

    it("sends only what is written in Hebrew", async () => {
        const storage = createMemoryStorage()
        storage.setItem("language", "ru")
        const fake = createFakeDataClient({
            ci_events: [
                event({
                    title: "Contact jam",
                    description: "Bring comfortable clothes",
                    price: [
                        { title: "Entry", sum: 50 },
                        { title: "כניסה מוזלת", sum: 30 },
                    ],
                }),
            ],
        })
        fake.functions.handle("translate", fakeTranslation)
        renderApp({ fake, now: NOW, storage })
        const list = await screen.findByRole("list", {
            name: "Ближайшие события",
        })
        await userEvent.click(within(list).getByRole("link"))
        const dialog = await screen.findByRole("dialog", {
            name: "Contact jam",
        })

        await waitFor(() =>
            expect(dialog).toHaveTextContent("כניסה מוזלת [ru]"),
        )
        expect(dialog).toHaveTextContent("Bring comfortable clothes")
        expect(fake.functions.calls.map((call) => call.body.text)).toEqual([
            "כניסה מוזלת",
        ])
    })

    it("asks for nothing in Hebrew", async () => {
        const { fake, dialog } = await openDetails("he", "שיעור קונטקט")

        expect(dialog).toHaveTextContent("מביאים בגדים נוחים")
        expect(fake.functions.calls).toEqual([])
    })
})

describe("translatableTexts", () => {
    it("is the description, link and price titles and untagged names, once each", () => {
        expect(
            translatableTexts(
                publicEvent({
                    description: "תיאור",
                    links: [
                        { title: "הרשמה", url: "a" },
                        { title: "הרשמה", url: "b" },
                    ],
                    prices: [{ title: "", sum: 1 }],
                    multiDayTeachers: [{ label: "אורח", value: "אורח" }],
                }),
            ),
        ).toEqual(["תיאור", "הרשמה", "אורח"])
    })
})
