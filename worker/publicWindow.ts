import type { DataClient } from "../src/data/client"
import {
    publicWindowRange,
    readPublicWindow,
} from "../src/features/calendar/publicWindowSelect"

// `GET /api/public-window` (spec #37, "The edge-cached public window"): the
// public window every visitor loads, served from Cloudflare's cache in the
// data centre that took the request (Tel Aviv for Israel), refreshed from
// Supabase in the background about once a minute.
//
// - The query is the client's own (`selectPublicWindow`: `hide = false`,
//   public bios only), sent with the anon key alone. The caller's
//   Authorization header and cookies are never read, let alone forwarded, so
//   no signed-in view can ever be cached and RLS's hidden-row guarantee
//   holds for the cached copy too.
// - The window is computed here (today in Asia/Jerusalem through
//   WINDOW_DAYS ahead) and the endpoint takes no parameters: one cache entry
//   per window start day serves everyone.
// - Fresh for FRESH_MS. After that, a copy up to STALE_MS old is served
//   while one background refresh runs (per isolate: concurrent requests
//   share it); a failed refresh leaves the copy in place to be served again
//   until it is too old. With no usable copy the request waits for
//   Supabase, and if that fails it gets a 502 the client falls back from.
// - Browsers get `no-store`: the client's query cache and persisted cache
//   own freshness.
// - Writes don't purge it; other visitors converge within FRESH_MS.

/** How long a cached window is served without a refresh. */
export const FRESH_MS = 60 * 1000

/** How old a cached window may be and still be served (while refreshing). */
export const STALE_MS = 10 * 60 * 1000

/** When the cached copy was read from Supabase (epoch ms). */
const FETCHED_AT = "X-Fetched-At"

/** Debugging aid: HIT (fresh copy), STALE (copy, refreshing) or MISS. */
export const CACHE_STATUS = "X-Edge-Cache"

/** The part of Cloudflare's Cache API the endpoint uses (`caches.default`). */
export interface EdgeCache {
    match(key: string): Promise<Response | undefined>
    put(key: string, response: Response): Promise<void>
}

export interface PublicWindowEndpointOptions {
    /** A data client that only ever sends the anon key. */
    data: DataClient
    cache: EdgeCache
    now: () => Date
}

/** Keeps the request's work running after the response (`ctx.waitUntil`). */
export type WaitUntil = (work: Promise<unknown>) => void

const JSON_TYPE = "application/json; charset=utf-8"

function reply(
    request: Request,
    body: string,
    status: number,
    cacheStatus?: string,
): Response {
    const headers = new Headers({
        "Content-Type": JSON_TYPE,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    })
    if (cacheStatus) headers.set(CACHE_STATUS, cacheStatus)
    return new Response(request.method === "HEAD" ? null : body, {
        status,
        headers,
    })
}

/**
 * The endpoint, with its in-flight refreshes kept per isolate. Create it
 * once per isolate and call it per request.
 */
export function createPublicWindowEndpoint({
    data,
    cache,
    now,
}: PublicWindowEndpointOptions) {
    const refreshing = new Map<string, Promise<string>>()

    /** Reads the window from Supabase and caches it; resolves to its JSON. */
    const refresh = (
        key: string,
        range: ReturnType<typeof publicWindowRange>,
    ) => {
        const running = refreshing.get(key)
        if (running) return running
        const next = (async () => {
            const body = JSON.stringify(await readPublicWindow(data, range))
            const stored = new Response(body, {
                headers: {
                    "Content-Type": JSON_TYPE,
                    // The cache drops it once it is too old to serve.
                    "Cache-Control": `public, max-age=${STALE_MS / 1000}`,
                    [FETCHED_AT]: String(now().getTime()),
                },
            })
            // A failed write only costs the next request a Supabase read.
            await cache.put(key, stored).catch(() => {})
            return body
        })().finally(() => refreshing.delete(key))
        refreshing.set(key, next)
        return next
    }

    return async function serve(
        request: Request,
        waitUntil: WaitUntil,
    ): Promise<Response> {
        if (request.method !== "GET" && request.method !== "HEAD") {
            const response = reply(
                request,
                JSON.stringify({ error: "method not allowed" }),
                405,
            )
            response.headers.set("Allow", "GET, HEAD")
            return response
        }
        const range = publicWindowRange(now())
        // Keyed by the window's first day, on the request's own origin (the
        // zone's cache); nothing else of the request is part of it.
        const key = new URL(
            `/api/public-window?start=${range.start}`,
            request.url,
        ).href
        const cached = await cache.match(key).catch(() => undefined)
        const fetchedAt = Number(cached?.headers.get(FETCHED_AT))
        const age = Number.isFinite(fetchedAt)
            ? now().getTime() - fetchedAt
            : Infinity
        if (cached && age < FRESH_MS) {
            return reply(request, await cached.text(), 200, "HIT")
        }
        if (cached && age < STALE_MS) {
            waitUntil(refresh(key, range).catch(() => {}))
            return reply(request, await cached.text(), 200, "STALE")
        }
        try {
            return reply(request, await refresh(key, range), 200, "MISS")
        } catch {
            return reply(
                request,
                JSON.stringify({ error: "the public window is unavailable" }),
                502,
            )
        }
    }
}
