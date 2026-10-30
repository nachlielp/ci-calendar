import { queryOptions } from "@tanstack/react-query"
import type { AppServices } from "../../app/services"
import { addDays, jerusalemToday } from "../../lib/jerusalemDate"

/** How far ahead the public calendar looks. ~25 events, ~6 KB gzipped. */
const WINDOW_DAYS = 90

/** Until the freshness slice tunes it: don't refetch what boot just fetched. */
const STALE_MS = 5 * 60 * 1000

// Only the columns the calendar renders. Later slices (cards, filters,
// languages) extend this list; keep it lean — it is the first-paint payload.
const COLUMNS = "id, title, start_date, cancelled"

export interface PublicEvent {
    id: string
    title: string
    /** Calendar day, `YYYY-MM-DD`. */
    startDate: string
    cancelled: boolean
}

/**
 * The public calendar window: visible events from today (Jerusalem) up to
 * WINDOW_DAYS ahead, in one request. RLS already withholds hidden events from
 * anonymous visitors; the explicit `hide = false` keeps a signed-in owner's
 * hidden drafts off the public calendar too.
 */
export function publicWindowQuery({ data, now }: AppServices) {
    const from = jerusalemToday(now())
    const to = addDays(from, WINDOW_DAYS)

    return queryOptions({
        queryKey: ["public-window", from],
        staleTime: STALE_MS,
        queryFn: async (): Promise<PublicEvent[]> => {
            const { data: rows, error } = await data
                .from("ci_events")
                .select(COLUMNS)
                .eq("hide", false)
                .gte("start_date", from)
                .lte("start_date", to)
                .order("start_date", { ascending: true })
            if (error) throw new Error(error.message)

            // `start_date` is nullable in the schema, but the range filter
            // above already excludes nulls.
            return rows.flatMap((row) =>
                row.start_date
                    ? [
                          {
                              id: row.id,
                              title: row.title,
                              startDate: row.start_date,
                              cancelled: row.cancelled ?? false,
                          },
                      ]
                    : [],
            )
        },
    })
}
