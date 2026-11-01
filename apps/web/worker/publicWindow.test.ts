import { beforeEach, describe, expect, it } from "vitest"
import { PUBLIC_EVENT_COLUMNS } from "@ci-calendar/core/features/calendar/publicEvent"
import { createFakeDataClient } from "../src/test/fakeDataClient"
import { event } from "../src/test/testEvents"
import { createWorker } from "./app"
import {
    CACHE_STATUS,
    createPublicWindowEndpoint,
    FRESH_MS,
    MAX_SERVE_AGE_MS,
    type EdgeCache,
} from "./publicWindow"

// The edge-cached public window at its HTTP boundary: a request goes in,
// the test looks at the response and at what was asked of the backend (the
// fake data client in place of the Worker's Supabase client). "Today" is
// Friday 2026-10-30 in Asia/Jerusalem.

const START = new Date("2026-10-30T09:00:00Z").getTime()
const SECOND = 1000
const ORIGIN = "https://www.ci-events.org"

/** Cloudflare's cache, in memory: what was put is matched, as a copy. */
function fakeCache() {
    const entries = new Map<string, Response>()
    let failing = false
    const cache: EdgeCache = {
        async match(key) {
            if (failing) throw new Error("cache unavailable")
            return entries.get(key)?.clone()
        },
        async put(key, response) {
            if (failing) throw new Error("cache unavailable")
            entries.set(key, response.clone())
        },
    }
    return {
        cache,
        keys: () => [...entries.keys()],
        fail: () => {
            failing = true
        },
    }
}

function setup(rows = [event({ title: "ג'אם" })]) {
    const fake = createFakeDataClient({ ci_events: rows })
    const store = fakeCache()
    let time = START
    const background: Promise<unknown>[] = []
    const serve = createPublicWindowEndpoint({
        data: fake.client,
        cache: store.cache,
        now: () => new Date(time),
    })
    return {
        fake,
        store,
        /** Moves the clock on. */
        later(ms: number) {
            time += ms
        },
        request: (init?: RequestInit) =>
            serve(new Request(`${ORIGIN}/api/public-window`, init), (work) =>
                background.push(work),
            ),
        /** Lets the background refreshes finish. */
        settle: () => Promise.all(background.splice(0)),
        reads: () =>
            fake.requests.filter((request) => request.table === "ci_events"),
    }
}

const titles = async (response: Response) =>
    ((await response.json()).rows as { title: string }[]).map(
        (row) => row.title,
    )

describe("GET /api/public-window", () => {
    it("sends one select with the anon key and the explicit public filters", async () => {
        const edge = setup([
            event({ title: "ג'אם", start_date: "2026-11-01" }),
            event({ title: "מוסתר", hide: true }),
            event({ title: "אתמול", start_date: "2026-10-29" }),
            event({ title: "בעוד 91 יום", start_date: "2027-01-29" }),
        ])

        const response = await edge.request()

        expect(response.status).toBe(200)
        expect(response.headers.get("Cache-Control")).toBe("no-store")
        expect(response.headers.get("Content-Type")).toMatch(
            /^application\/json/,
        )
        expect(response.headers.get(CACHE_STATUS)).toBe("MISS")
        const body = await response.json()
        expect(body.start).toBe("2026-10-30")
        expect(body.end).toBe("2027-01-28")
        expect(body.rows.map((row: { title: string }) => row.title)).toEqual([
            "ג'אם",
        ])
        // The rows in PostgREST's shape: the bios embedded, as the client
        // maps them.
        expect(body.rows[0].ci_events_users_junction).toEqual([])

        expect(edge.reads()).toHaveLength(1)
        const [read] = edge.reads()
        expect(read.token).toBeNull()
        expect(read.select).toBe(PUBLIC_EVENT_COLUMNS.replace(/\s/g, ""))
        expect(read.filters).toEqual([
            { op: "eq", column: "hide", value: false },
            {
                op: "eq",
                column: "ci_events_users_junction.public_bio.show_profile",
                value: true,
            },
            {
                op: "neq",
                column: "ci_events_users_junction.public_bio.user_type",
                value: "admin",
            },
            {
                op: "neq",
                column: "ci_events_users_junction.public_bio.bio_name",
                value: "",
            },
            { op: "gte", column: "start_date", value: "2026-10-30" },
            { op: "lte", column: "start_date", value: "2027-01-28" },
        ])
    })

    it("computes the window in Jerusalem, not UTC", async () => {
        const edge = setup()
        // 22:30 UTC on Oct 30 is already Oct 31 in Jerusalem.
        edge.later(13.5 * 60 * 60 * SECOND)

        const body = await (await edge.request()).json()

        expect([body.start, body.end]).toEqual(["2026-10-31", "2027-01-29"])
    })

    it("answers a second request within a minute from the cache", async () => {
        const edge = setup()
        await edge.request()
        edge.fake.rows("ci_events").push(event({ title: "חדש" }))
        edge.later(FRESH_MS - SECOND)

        const response = await edge.request()

        expect(response.headers.get(CACHE_STATUS)).toBe("HIT")
        expect(await titles(response)).toEqual(["ג'אם"])
        expect(edge.reads()).toHaveLength(1)
    })

    it("after a minute serves the copy and refreshes it once in the background", async () => {
        const edge = setup()
        await edge.request()
        edge.fake.rows("ci_events").push(event({ title: "חדש" }))
        edge.later(FRESH_MS + SECOND)

        const responses = await Promise.all([edge.request(), edge.request()])

        for (const response of responses) {
            expect(response.headers.get(CACHE_STATUS)).toBe("STALE")
            expect(await titles(response)).toEqual(["ג'אם"])
        }
        await edge.settle()
        expect(edge.reads()).toHaveLength(2)

        const refreshed = await edge.request()
        expect(refreshed.headers.get(CACHE_STATUS)).toBe("HIT")
        expect(await titles(refreshed)).toEqual(["ג'אם", "חדש"])
        expect(edge.reads()).toHaveLength(2)
    })

    it("keeps serving the copy while refreshes fail, up to ten minutes", async () => {
        const edge = setup()
        await edge.request()
        edge.fake.failTable("ci_events", "upstream down")

        edge.later(FRESH_MS + SECOND)
        const first = await edge.request()
        await edge.settle()
        edge.later(MAX_SERVE_AGE_MS - FRESH_MS - 2 * SECOND)
        const last = await edge.request()
        await edge.settle()

        for (const response of [first, last]) {
            expect(response.status).toBe(200)
            expect(response.headers.get(CACHE_STATUS)).toBe("STALE")
            expect(await titles(response)).toEqual(["ג'אם"])
        }
        expect(edge.reads()).toHaveLength(3)
    })

    it("fails with no copy young enough, so the client reads Supabase itself", async () => {
        const edge = setup()
        await edge.request()
        edge.fake.failTable("ci_events", "upstream down")
        edge.later(MAX_SERVE_AGE_MS + SECOND)

        const tooOld = await edge.request()

        expect(tooOld.status).toBe(502)
        expect(tooOld.headers.get("Cache-Control")).toBe("no-store")

        const cold = setup()
        cold.fake.failTable("ci_events", "upstream down", { network: true })
        expect((await cold.request()).status).toBe(502)
    })

    it("reads Supabase again, after ten minutes, for a fresh copy", async () => {
        const edge = setup()
        await edge.request()
        edge.fake.rows("ci_events").push(event({ title: "חדש" }))
        edge.later(MAX_SERVE_AGE_MS + SECOND)

        const response = await edge.request()

        expect(response.headers.get(CACHE_STATUS)).toBe("MISS")
        expect(await titles(response)).toEqual(["ג'אם", "חדש"])
    })

    it("starts a new copy when the day changes in Jerusalem", async () => {
        const edge = setup()
        await edge.request()
        edge.later(15 * 60 * 60 * SECOND)

        const response = await edge.request()

        expect(response.headers.get(CACHE_STATUS)).toBe("MISS")
        expect((await response.json()).start).toBe("2026-10-31")
        expect(edge.store.keys()).toEqual([
            `${ORIGIN}/api/public-window?start=2026-10-30`,
            `${ORIGIN}/api/public-window?start=2026-10-31`,
        ])
    })

    it("still answers when the cache itself fails", async () => {
        const edge = setup()
        edge.store.fail()

        const response = await edge.request()

        expect(response.status).toBe(200)
        expect(await titles(response)).toEqual(["ג'אם"])
    })

    it("answers HEAD without a body and refuses writes", async () => {
        const edge = setup()

        const head = await edge.request({ method: "HEAD" })
        const post = await edge.request({ method: "POST", body: "{}" })

        expect(head.status).toBe(200)
        expect(await head.text()).toBe("")
        expect(post.status).toBe(405)
        expect(post.headers.get("Allow")).toBe("GET, HEAD")
        expect(edge.reads()).toHaveLength(1)
    })
})

describe("the Worker", () => {
    const ANON = "anon-key"
    const ENV = {
        VITE_SUPABASE_URL: "https://project.supabase.co",
        VITE_SUPABASE_ANON_KEY: ANON,
    }
    let upstream: Request[]
    let handle: ReturnType<typeof createWorker>

    beforeEach(() => {
        upstream = []
        handle = createWorker({
            cache: fakeCache().cache,
            now: () => new Date(START),
            fetch: async (input, init) => {
                upstream.push(new Request(input, init))
                return new Response("[]", {
                    headers: { "Content-Type": "application/json" },
                })
            },
        })
    })

    const request = (path: string, init?: RequestInit, env = ENV) =>
        handle(new Request(`${ORIGIN}${path}`, init), env, () => {})

    it("never forwards the caller's Authorization or cookies to Supabase", async () => {
        const response = await request("/api/public-window", {
            headers: {
                Authorization: "Bearer a-signed-in-users-jwt",
                Cookie: "session=secret",
            },
        })

        expect(response.status).toBe(200)
        expect(upstream).toHaveLength(1)
        const [sent] = upstream
        expect(sent.headers.get("Authorization")).toBe(`Bearer ${ANON}`)
        expect(sent.headers.get("apikey")).toBe(ANON)
        expect(sent.headers.get("Cookie")).toBeNull()
        const url = new URL(sent.url)
        expect(url.origin + url.pathname).toBe(
            "https://project.supabase.co/rest/v1/ci_events",
        )
        expect(url.searchParams.get("hide")).toBe("eq.false")
    })

    it("gives up on a Supabase read that hangs, and tries again next time", async () => {
        let calls = 0
        const hanging = createWorker({
            cache: fakeCache().cache,
            now: () => new Date(START),
            upstreamTimeoutMs: 20,
            fetch: (_input, init) => {
                calls += 1
                if (calls > 1) {
                    return Promise.resolve(
                        new Response("[]", {
                            headers: { "Content-Type": "application/json" },
                        }),
                    )
                }
                return new Promise((_, reject) => {
                    init?.signal?.addEventListener("abort", () =>
                        reject(new DOMException("timed out", "TimeoutError")),
                    )
                })
            },
        })
        const get = () =>
            hanging(new Request(`${ORIGIN}/api/public-window`), ENV, () => {})

        expect((await get()).status).toBe(502)
        const next = await get()
        expect(next.status).toBe(200)
        expect(next.headers.get(CACHE_STATUS)).toBe("MISS")
        expect(calls).toBe(2)
    })

    it("answers other API paths with a 404", async () => {
        const response = await request("/api/other")

        expect(response.status).toBe(404)
        expect(upstream).toEqual([])
    })

    it("fails without its Supabase variables, so the client falls back", async () => {
        const response = await request("/api/public-window", undefined, {
            VITE_SUPABASE_URL: "",
            VITE_SUPABASE_ANON_KEY: "",
        })

        expect(response.status).toBe(503)
        expect(upstream).toEqual([])
    })
})
