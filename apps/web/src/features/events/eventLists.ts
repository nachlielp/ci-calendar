import { rowsAfter, type KeysetDirection } from "../../lib/keyset"
import type { ManagedEvent } from "./managedEvent"

// The rules every list of managed events shares (my events, the admins'
// list, a series, the edit forms): their order, keyset cursor and filter,
// the later events of a series, and the cache keys of the user's own
// lists, which the edit forms read too. No feature's list lives here.

/** An event's place in a list: its day, then its id. */
export interface EventKey {
    startDate: string
    id: string
}

/** Where a paginated event list's next page starts: after this event. */
export type EventCursor = EventKey

/** The cursor of a row read (`null` for a row without a day). */
export const eventCursorOf = (row: {
    start_date: string | null
    id: string
}): EventCursor | null =>
    row.start_date ? { startDate: row.start_date, id: row.id } : null

/**
 * PostgREST's filter for the events after `cursor` in a list ordered by
 * day, then id, both `direction` (keyset pagination, for one `or()`).
 */
export const eventsAfter = (cursor: EventCursor, direction: KeysetDirection) =>
    rowsAfter("start_date", direction, cursor.startDate, cursor.id)

/** Upcoming order: by day, then id (as the queries order them). */
export function compareUpcoming(a: EventKey, b: EventKey): number {
    if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** Past order: newest day first, then id descending. */
export const comparePast = (a: EventKey, b: EventKey) => compareUpcoming(b, a)

/**
 * The later events of `event`'s recurring series among `events` (legacy
 * `getFutureRecurringEventsByRefKey`: same `recurring_ref_key`, a later
 * day), in date order: what "this one or the following ones too" offers.
 */
export function laterInSeries(
    events: readonly ManagedEvent[],
    event: ManagedEvent,
): ManagedEvent[] {
    if (!event.recurringRefKey) return []
    return events
        .filter(
            (other) =>
                other.recurringRefKey === event.recurringRefKey &&
                other.startDate > event.startDate,
        )
        .sort(compareUpcoming)
}

/** First element of the user's own events lists' query keys. */
export const MY_EVENTS_KIND = "my-events"

/** The user's events from today on (`/manage-events`; the edit forms). */
export const myUpcomingEventsKey = (userId: string) =>
    [MY_EVENTS_KIND, userId, "upcoming"] as const

/** The user's past events, a page at a time (`/manage-events`). */
export const myPastEventsKey = (userId: string) =>
    [MY_EVENTS_KIND, userId, "past"] as const
