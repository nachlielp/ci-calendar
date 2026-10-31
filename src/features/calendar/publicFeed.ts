import type { DataClient } from "../../data/client"
import {
    publicWindowRange,
    readPublicWindow,
    type PublicWindowRows,
} from "./publicWindowSelect"

/**
 * Where the public window comes from (`AppServices.publicFeed`, spec #37):
 * the calendar's one list request. Single-event lookups and every personal
 * or admin query still go to Supabase directly (`services.data`).
 */
export interface PublicFeed {
    /** Today (Jerusalem) through `WINDOW_DAYS` ahead, rows as PostgREST's. */
    window(): Promise<PublicWindowRows>
}

/** The Worker's edge-cached window (worker/publicWindow.ts), same origin. */
export const PUBLIC_WINDOW_ENDPOINT = "/api/public-window"

/**
 * How long the edge gets before the direct read takes over. The edge
 * answers from Tel Aviv in tens of milliseconds; a slower answer means
 * something is wrong with it.
 */
export const EDGE_TIMEOUT_MS = 3000

/** The window read straight from Supabase: tests, and the edge's fallback. */
export function directPublicFeed(
    data: DataClient,
    now: () => Date,
): PublicFeed {
    return { window: () => readPublicWindow(data, publicWindowRange(now())) }
}

export interface EdgePublicFeedOptions {
    /** The data client the fallback reads with (the caller's token, as today). */
    data: DataClient
    now: () => Date
    /** The page's `fetch`; tests pass a fake edge. */
    fetch: typeof fetch
    timeoutMs?: number
}

/**
 * The web's feed: the same-origin edge endpoint, falling back to the direct
 * select on any error — an error status (no Worker, as on Vercel: there the
 * path is the SPA shell, 200 HTML), no network, an answer that isn't the
 * window, or no answer within `timeoutMs` — so a caching problem never
 * empties the calendar. Nothing about the caller is sent to the edge: it
 * serves only the anon view (`credentials: "omit"`).
 */
export function edgePublicFeed({
    data,
    now,
    fetch: send,
    timeoutMs = EDGE_TIMEOUT_MS,
}: EdgePublicFeedOptions): PublicFeed {
    const direct = directPublicFeed(data, now)
    return {
        async window() {
            const fromEdge = await readEdge(send, timeoutMs).catch(() => null)
            return fromEdge ?? direct.window()
        },
    }
}

async function readEdge(
    send: typeof fetch,
    timeoutMs: number,
): Promise<PublicWindowRows | null> {
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), timeoutMs)
    try {
        const response = await send(PUBLIC_WINDOW_ENDPOINT, {
            credentials: "omit",
            headers: { Accept: "application/json" },
            signal: abort.signal,
        })
        if (!response.ok) return null
        return parsePublicWindowRows(await response.json())
    } finally {
        clearTimeout(timer)
    }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * The endpoint's body if it is a window (`{ start, end, rows }`, each row an
 * event with its embedded bios), else `null`.
 */
export function parsePublicWindowRows(body: unknown): PublicWindowRows | null {
    if (!body || typeof body !== "object") return null
    const { start, end, rows } = body as Record<string, unknown>
    if (typeof start !== "string" || !DAY.test(start)) return null
    if (typeof end !== "string" || !DAY.test(end)) return null
    if (!Array.isArray(rows)) return null
    const isRow = (row: unknown) =>
        !!row &&
        typeof row === "object" &&
        typeof (row as Record<string, unknown>).id === "string" &&
        Array.isArray((row as Record<string, unknown>).ci_events_users_junction)
    if (!rows.every(isRow)) return null
    return { start, end, rows: rows as PublicWindowRows["rows"] }
}
