import { queryOptions } from "@tanstack/react-query"
import type { AppServices } from "../../app/services"
import { addDays, jerusalemToday } from "../../lib/jerusalemDate"
import {
    PUBLIC_EVENT_COLUMNS,
    selectPublicEvents,
    toPublicEvent,
    type PublicEvent,
} from "./publicEvent"

/** How far ahead the public calendar looks. ~25 events, ~5 KB gzipped. */
export const WINDOW_DAYS = 90

/**
 * Event data changes a few times a day, so after 5 minutes the window is
 * refetched when the app becomes visible again. Coming back online always
 * refetches: whatever was shown came from before the connection dropped.
 */
export const STALE_MS = 5 * 60 * 1000

/**
 * First element of the window's query key. The key deliberately has no date:
 * a window fetched yesterday (or restored from storage) is still this query,
 * so it renders at once, minus the days that have passed, and revalidates.
 */
export const PUBLIC_WINDOW_KIND = "public-window"

/**
 * The shape of `PublicEvent[]` for the persisted cache (app/persistedCache.ts):
 * stored data with another shape is never restored. Changing the columns
 * changes it; bump the number when the mapping to `PublicEvent` changes
 * without a column change.
 */
export const PUBLIC_WINDOW_SHAPE = `2|${PUBLIC_EVENT_COLUMNS}`

/**
 * The public calendar window: visible events from today (Jerusalem) up to
 * WINDOW_DAYS ahead, in one request, with the public bios of their teachers
 * (see `selectPublicEvents` for the explicit public filters).
 *
 * The cached data may hold days that have since passed (a window fetched
 * before midnight, or restored from storage), so `select` drops events dated
 * before today on every read.
 */
export function publicWindowQuery({ data, now }: AppServices) {
    return queryOptions({
        queryKey: [PUBLIC_WINDOW_KIND],
        staleTime: STALE_MS,
        refetchOnReconnect: "always",
        select: (events) => {
            const today = jerusalemToday(now())
            return events.filter((event) => event.startDate >= today)
        },
        queryFn: async (): Promise<PublicEvent[]> => {
            const from = jerusalemToday(now())
            const to = addDays(from, WINDOW_DAYS)
            const { data: rows, error } = await selectPublicEvents(data)
                .gte("start_date", from)
                .lte("start_date", to)
                .order("start_date", { ascending: true })
            if (error) throw new Error(error.message)

            // `start_date` is nullable in the schema, but the range filter
            // above already excludes nulls.
            return rows.flatMap(({ start_date, ...row }) =>
                start_date ? [toPublicEvent({ ...row, start_date })] : [],
            )
        },
    })
}
