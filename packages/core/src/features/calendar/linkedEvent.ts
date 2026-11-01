import { queryOptions } from "../../app/queryOptions"
import type { CoreServices } from "../../app/services"
import { STALE_MS } from "../../lib/freshness"
import {
    selectPublicEvents,
    toPublicEvent,
    type PublicEvent,
} from "./publicEvent"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * A `short_id`: three letters or digits, as the database's `set_short_id`
 * trigger makes them (every stored one matched when checked, Oct 2026).
 * Widen this if the trigger ever changes.
 */
const SHORT_ID = /^[0-9A-Za-z]{3}$/

/**
 * Whether `link` could name an event at all. Anything else (`/login`, a
 * typo) is a 404 at once, without a request.
 */
export const isEventLink = (link: string) =>
    UUID.test(link) || SHORT_ID.test(link)

/**
 * What a shared link (`/event/:eventId`, `/:eventId`) names: the app shares
 * `short_id`s, and older links carry the full id. Querying `id` with a
 * non-uuid is a database error, so the form picks the column.
 */
const linkColumn = (link: string) =>
    UUID.test(link) ? ("id" as const) : ("short_id" as const)

/** Whether `event` is the one a shared link names. */
export const isLinkedEvent = (event: PublicEvent, link: string) =>
    event.id === link || event.shortId === link

/** First element of a linked event's query key (public data). */
export const LINKED_EVENT_KIND = "linked-event"

/**
 * One visible event by its link, for links to events outside the cached
 * window (past, far ahead, or not loaded yet). `null` when there is no such
 * visible event: hidden events never come back, whatever the link.
 */
export function linkedEventQuery(
    { data }: Pick<CoreServices, "data">,
    link: string,
) {
    return queryOptions({
        queryKey: [LINKED_EVENT_KIND, link],
        staleTime: STALE_MS,
        queryFn: async (): Promise<PublicEvent | null> => {
            const { data: row, error } = await selectPublicEvents(data)
                .eq(linkColumn(link), link)
                .maybeSingle()
            if (error) throw new Error(error.message)
            // An event without a start date is not a calendar event.
            if (!row?.start_date) return null
            return toPublicEvent({ ...row, start_date: row.start_date })
        },
    })
}

/** Where the event a shared link names stands. */
export type LinkedEvent =
    | { status: "found"; event: PublicEvent }
    /** Being fetched; `offline` while the request waits for a connection. */
    | { status: "loading"; offline: boolean }
    | { status: "failed"; retry: () => void }
    /** No visible event has this link. */
    | { status: "notFound" }
