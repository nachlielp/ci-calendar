import { queryOptions } from "@tanstack/react-query"
import type { AppServices } from "../../app/services"
import { STALE_MS } from "../../lib/freshness"
import { addDays, jerusalemToday } from "../../lib/jerusalemDate"
import {
    PUBLIC_EVENT_COLUMNS,
    selectPublicEvents,
    toPublicEvent,
    type PublicEvent,
} from "./publicEvent"

/** How far ahead the public calendar looks. ~25 events, ~6.5 KB gzipped. */
export const WINDOW_DAYS = 90

/**
 * First element of the window's query key. The key deliberately has no date:
 * a window fetched yesterday (or restored from storage) is still this query,
 * so it renders at once, minus the days that have passed, and revalidates.
 */
export const PUBLIC_WINDOW_KIND = "public-window"

/**
 * The window as cached: its events and the days it was fetched for, so an
 * event saved later goes in only if the fetch covered its day
 * (`applyEventChanges`), whenever that happens.
 */
export interface PublicWindow {
    /** First and last day fetched, `YYYY-MM-DD`. */
    from: string
    to: string
    events: PublicEvent[]
}

/**
 * The shape of `PublicWindow` for the persisted cache (app/persistedCache.ts):
 * stored data with another shape is never restored. Changing the columns
 * changes it; bump the number when the mapping changes without a column
 * change (3: the fetched range stored with the events).
 */
export const PUBLIC_WINDOW_SHAPE = `3|${PUBLIC_EVENT_COLUMNS}`

/**
 * The public calendar window: visible events from today (Jerusalem) up to
 * WINDOW_DAYS ahead, in one request, with the public bios of their teachers
 * (see `selectPublicEvents` for the explicit public filters).
 *
 * The cached data may hold days that have since passed (a window fetched
 * before midnight, or restored from storage), so `select` drops events dated
 * before `today`. Pass the day from `useToday()` and memoise the options on
 * it, so `select` runs again when the day changes.
 */
export function publicWindowQuery(
    { data, now }: AppServices,
    today: string = jerusalemToday(now()),
) {
    return queryOptions({
        queryKey: [PUBLIC_WINDOW_KIND],
        staleTime: STALE_MS,
        // Coming back online always refetches: whatever was shown came from
        // before the connection dropped.
        refetchOnReconnect: "always",
        select: (window: PublicWindow) =>
            window.events.filter((event) => event.startDate >= today),
        queryFn: async (): Promise<PublicWindow> => {
            const from = jerusalemToday(now())
            const to = addDays(from, WINDOW_DAYS)
            const { data: rows, error } = await selectPublicEvents(data)
                .gte("start_date", from)
                .lte("start_date", to)
                .order("start_date", { ascending: true })
            if (error) throw new Error(error.message)

            // `start_date` is nullable in the schema, but the range filter
            // above already excludes nulls.
            const events = rows.flatMap(({ start_date, ...row }) =>
                start_date ? [toPublicEvent({ ...row, start_date })] : [],
            )
            return { from, to, events }
        },
    })
}
