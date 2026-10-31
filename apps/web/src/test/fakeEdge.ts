import {
    PUBLIC_WINDOW_ENDPOINT,
    publicWindowRange,
    readPublicWindow,
} from "../features/calendar/publicWindowSelect"
import type { FakeDataClient } from "./fakeDataClient"

// The Worker's edge-cached endpoint as the page sees it (`renderApp({ edge })`):
// `GET /api/public-window` answered from `backend`, a fake data client of its
// own standing in for the edge's copy of the database, put through the same
// select as the client's. Seeding the edge's backend apart from the page's
// lets a test tell where the events on screen came from. `answer` makes the
// endpoint misbehave in each of the ways the page must survive.

export type EdgeAnswer =
    /** The window, `{ start, end, rows }`. */
    | "window"
    /** No Worker (Vercel): the path is the SPA shell, 200 HTML. */
    | "spa-shell"
    | "not-found"
    | "server-error"
    /** No answer at all (offline, DNS, a reset connection). */
    | "network-error"
    /** 200 JSON that isn't a window. */
    | "not-a-window"
    /** Never answers: the page gives up after `timeoutMs`. */
    | "hang"

export interface EdgeRequest {
    url: string
    credentials: RequestCredentials | undefined
    /** The Authorization header the page sent, if any. */
    authorization: string | null
}

export interface FakeEdge {
    fetch: typeof fetch
    requests: EdgeRequest[]
    /** How the endpoint answers from now on ("window" by default). */
    answer(next: EdgeAnswer): void
    /** What the page waits for the edge; short, so "hang" tests are quick. */
    timeoutMs: number
}

export function createFakeEdge(
    backend: FakeDataClient,
    now: () => Date,
): FakeEdge {
    const requests: EdgeRequest[] = []
    let mode: EdgeAnswer = "window"
    const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json" },
        })

    const fetchEdge = async (
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<Response> => {
        const url = String(input instanceof Request ? input.url : input)
        requests.push({
            url,
            credentials: init?.credentials,
            authorization: new Headers(init?.headers).get("Authorization"),
        })
        if (url !== PUBLIC_WINDOW_ENDPOINT) return json({}, 404)
        switch (mode) {
            case "window":
                return json(
                    await readPublicWindow(
                        backend.client,
                        publicWindowRange(now()),
                    ),
                )
            case "spa-shell":
                return new Response("<!doctype html><html></html>", {
                    headers: { "Content-Type": "text/html" },
                })
            case "not-found":
                return json({ error: "not found" }, 404)
            case "server-error":
                return json({ error: "upstream failed" }, 502)
            case "network-error":
                throw new TypeError("Failed to fetch")
            case "not-a-window":
                return json({ start: "2026-10-30", rows: "nope" })
            case "hang":
                return new Promise((_, reject) => {
                    init?.signal?.addEventListener("abort", () =>
                        reject(new DOMException("aborted", "AbortError")),
                    )
                })
        }
    }

    return {
        fetch: fetchEdge as typeof fetch,
        requests,
        answer: (next) => {
            mode = next
        },
        timeoutMs: 50,
    }
}
