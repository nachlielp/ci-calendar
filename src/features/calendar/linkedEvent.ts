import { queryOptions, useQuery } from "@tanstack/react-query"
import { useServices, type AppServices } from "../../app/services"
import { STALE_MS } from "./publicWindow"
import {
    selectPublicEvents,
    toPublicEvent,
    type PublicEvent,
} from "./publicEvent"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * What a shared link (`/event/:eventId`, `/:eventId`) names: the app shares
 * `short_id`s, and older links carry the full id. Querying `id` with a
 * non-uuid is a database error, so the form picks the column.
 */
const linkColumn = (link: string) =>
    UUID.test(link) ? ("id" as const) : ("short_id" as const)

/** Whether `event` is the one a shared link names. */
const isLinkedEvent = (event: PublicEvent, link: string) =>
    event.id === link || event.shortId === link

/**
 * One visible event by its link, for links to events outside the cached
 * window (past, far ahead, or not loaded yet). `null` when there is no such
 * visible event: hidden events never come back, whatever the link.
 */
function linkedEventQuery({ data }: AppServices, link: string) {
    return queryOptions({
        queryKey: ["linked-event", link],
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

/**
 * The event a shared link names, for the calendar to open over the list
 * (undefined without a link). Taken from the cached window when it is there
 * (no request). Otherwise — outside the window, or the window not loaded
 * yet — one request for that event alone, in parallel with the window, never
 * waiting for it.
 */
export function useLinkedEvent(
    link: string | undefined,
    windowEvents: readonly PublicEvent[] | undefined,
): LinkedEvent | undefined {
    const services = useServices()
    const inWindow = link
        ? windowEvents?.find((event) => isLinkedEvent(event, link))
        : undefined
    const query = useQuery({
        ...linkedEventQuery(services, link ?? ""),
        enabled: !!link && !inWindow,
    })
    if (!link) return undefined
    if (inWindow) return { status: "found", event: inWindow }
    if (query.data) return { status: "found", event: query.data }
    if (query.data === null) return { status: "notFound" }
    if (query.isError) {
        return { status: "failed", retry: () => void query.refetch() }
    }
    return { status: "loading", offline: query.fetchStatus === "paused" }
}
