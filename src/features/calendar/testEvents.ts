import { screen, within } from "@testing-library/react"

/** A `ci_events` row for seeding the fake; visible, on 2026-11-01 by default. */
export function event(overrides: Record<string, unknown>) {
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

/** The titles in the calendar's event list, in the order shown. */
export async function eventTitles() {
    const list = await screen.findByRole("list", { name: "אירועים קרובים" })
    return within(list)
        .getAllByRole("heading")
        .map((h) => h.textContent)
}
