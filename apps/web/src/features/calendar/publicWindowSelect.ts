import type { DataClient } from "../../data/client"
import { addDays, jerusalemToday } from "../../lib/jerusalemDate"
import { selectPublicEvents } from "./publicEvent"

// The public window's query, shared by the client (its direct read, the
// fallback of `publicFeed`) and the Worker's edge-cached endpoint
// (worker/publicWindow.ts), so both send exactly the same select. Plain
// data and functions: no React, no TanStack, nothing of the page.

/** The Worker's edge-cached window (worker/publicWindow.ts), same origin. */
export const PUBLIC_WINDOW_ENDPOINT = "/api/public-window"

/** How far ahead the public calendar looks. ~25 events, ~6.5 KB gzipped. */
export const WINDOW_DAYS = 90

/** A window's first and last day, `YYYY-MM-DD`. */
export interface WindowRange {
    start: string
    end: string
}

/** Today in Jerusalem through `WINDOW_DAYS` ahead. */
export function publicWindowRange(now: Date): WindowRange {
    const start = jerusalemToday(now)
    return { start, end: addDays(start, WINDOW_DAYS) }
}

/**
 * The window's events in date order, with the explicit public filters of
 * `selectPublicEvents` (`hide = false`, public bios only).
 */
export function selectPublicWindow(
    data: DataClient,
    { start, end }: WindowRange,
) {
    return selectPublicEvents(data)
        .gte("start_date", start)
        .lte("start_date", end)
        .order("start_date", { ascending: true })
}

/** A row as PostgREST returns it for `selectPublicWindow`. */
export type PublicWindowRow = NonNullable<
    Awaited<ReturnType<typeof selectPublicWindow>>["data"]
>[number]

/**
 * The window as `publicFeed` and the edge endpoint (`GET /api/public-window`)
 * hand it over: its days and the rows in their PostgREST shape, so the
 * client's mapping and persisted-cache shape don't depend on where they
 * came from.
 */
export interface PublicWindowRows extends WindowRange {
    rows: PublicWindowRow[]
}

/** Reads the window straight from Supabase (PostgREST). */
export async function readPublicWindow(
    data: DataClient,
    range: WindowRange,
): Promise<PublicWindowRows> {
    const { data: rows, error } = await selectPublicWindow(data, range)
    if (error) throw new Error(error.message)
    return { ...range, rows }
}
