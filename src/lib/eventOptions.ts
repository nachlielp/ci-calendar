// The event types and districts the app knows (legacy util/options.ts), as
// stored in `ci_events` and as written in filter URLs and saved filters.
// Shared by the calendar filters and, later, the event forms and the weekly
// schedule filters. Their words in each language are in the `EventLocale`
// (features/calendar/eventFormat.ts: `types`, `districts`).

/** Every event and segment type, in the order they are offered. */
export const EVENT_TYPES = [
    "class",
    "jam",
    "underscore",
    "workshop",
    "retreat",
    "warmup",
    "course",
    "score",
] as const

/** The types a multi-day event can have. */
export const MULTI_DAY_TYPES = ["workshop", "retreat", "course"] as const

export const DISTRICTS = [
    "center",
    "jerusalem",
    "galilee",
    "haifa",
    "carmel",
    "pardesHanna",
    "south",
] as const

export type EventType = (typeof EVENT_TYPES)[number]
export type District = (typeof DISTRICTS)[number]

export const isEventType = (value: string): value is EventType =>
    (EVENT_TYPES as readonly string[]).includes(value)

export const isDistrict = (value: string): value is District =>
    (DISTRICTS as readonly string[]).includes(value)

const LEGACY_HEBREW_MULTI_DAY_TYPES: Readonly<Record<string, string>> = {
    סדנה: "workshop",
    ריטריט: "retreat",
    קורס: "course",
}

/**
 * Some older multi-day events store their type's Hebrew label instead of
 * its value (`ריטריט` for `retreat`); this reads either as the value.
 */
export function normaliseMultiDayType(type: string): string {
    return Object.hasOwn(LEGACY_HEBREW_MULTI_DAY_TYPES, type)
        ? LEGACY_HEBREW_MULTI_DAY_TYPES[type]
        : type
}
