import { screen, within } from "@testing-library/react"

// The calendar list as the web test sees it (the rows to seed are the
// core's @ci-calendar/core/testing/testEvents).

/** The titles in the calendar's event list, in the order shown. */
export async function eventTitles() {
    const list = await screen.findByRole("list", { name: "אירועים קרובים" })
    return within(list)
        .getAllByRole("heading")
        .map((h) => h.textContent)
}

/** The list card of the event titled `title`. */
export async function eventCard(title: string) {
    const list = await screen.findByRole("list", { name: "אירועים קרובים" })
    return within(list)
        .getAllByRole("listitem")
        .find((item) => within(item).queryByRole("heading", { name: title }))!
}
