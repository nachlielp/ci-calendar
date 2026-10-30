import { screen, within } from "@testing-library/react"
import type { PublicEvent } from "./publicEvent"

type Overrides = Record<string, unknown>

/**
 * A `ci_events` row for seeding the fake: a visible single-day class on
 * 2026-11-01, 19:00–21:00 Jerusalem time.
 */
export function event(overrides: Overrides = {}) {
    return {
        id: crypto.randomUUID(),
        short_id: null,
        title: "ג'אם",
        start_date: "2026-11-01",
        end_date: "2026-11-01",
        hide: false,
        cancelled: false,
        cancelled_text: "",
        type: "",
        segments: [segment()],
        multi_day_teachers: [],
        organisations: [],
        address: { label: "תל אביב", en_label: "Tel Aviv", place_id: "P1" },
        district: "center",
        links: [],
        price: [],
        description: "",
        ...overrides,
    }
}

/** A segment as the event forms store it (times are UTC timestamps). */
export function segment(overrides: Overrides = {}) {
    return {
        type: "class",
        startTime: "2026-11-01T17:00:00.000Z",
        endTime: "2026-11-01T19:00:00.000Z",
        teachers: [],
        tags: [],
        ...overrides,
    }
}

/** A `public_bio` row, shown publicly by default. */
export function bio(overrides: Overrides = {}) {
    return {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        bio_name: "מורה",
        img: null,
        about: "",
        page_url: null,
        page_title: null,
        page_url_2: null,
        page_title_2: null,
        show_profile: true,
        allow_tagging: true,
        user_type: "profile",
        ...overrides,
    }
}

/** The `ci_events_users_junction` row that tags `teacher` on `ciEvent`. */
export function tagging(ciEvent: { id: string }, teacher: { user_id: string }) {
    return {
        id: crypto.randomUUID(),
        ci_event_id: ciEvent.id,
        user_id: teacher.user_id,
    }
}

/** A mapped `PublicEvent`, for testing the pure helpers. */
export function publicEvent(overrides: Partial<PublicEvent> = {}): PublicEvent {
    return {
        id: "e1",
        shortId: "Ab1",
        title: "ג'אם",
        titleTranslations: {},
        startDate: "2026-11-01",
        endDate: "2026-11-01",
        cancelled: false,
        cancelledText: "",
        type: "",
        segments: [
            {
                type: "class",
                startTime: "2026-11-01T17:00:00.000Z",
                endTime: "2026-11-01T19:00:00.000Z",
                teachers: [],
                tags: [],
            },
        ],
        multiDayTeachers: [],
        organisations: [],
        address: { label: "תל אביב", enLabel: "Tel Aviv", placeId: "P1" },
        district: "center",
        links: [],
        prices: [],
        description: "",
        bios: [],
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

/** The list card of the event titled `title`. */
export async function eventCard(title: string) {
    const list = await screen.findByRole("list", { name: "אירועים קרובים" })
    return within(list)
        .getAllByRole("listitem")
        .find((item) => within(item).queryByRole("heading", { name: title }))!
}
