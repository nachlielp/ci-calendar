import { createDataClient } from "@ci-calendar/core/data/client"
import { PUBLIC_WINDOW_ENDPOINT } from "@ci-calendar/core/features/calendar/publicWindowSelect"
import {
    createPublicWindowEndpoint,
    type EdgeCache,
    type WaitUntil,
} from "./publicWindow"

// The web app's Worker (wrangler.jsonc). Cloudflare serves the static build
// (dist/) itself and falls back to the SPA shell for any other path; the
// Worker runs first only for `/api/*` (`assets.run_worker_first`), so this
// is all it answers. Plain request in, response out: worker/index.ts binds
// it to Cloudflare's globals, tests to fakes.

/** The Worker's variables (Cloudflare dashboard, or `.dev.vars` locally). */
export interface WorkerEnv {
    /** The Supabase project URL, as the client build's. */
    VITE_SUPABASE_URL?: string
    /** The anon key (public). The Worker never holds another key. */
    VITE_SUPABASE_ANON_KEY?: string
}

export interface WorkerOptions {
    cache: EdgeCache
    now: () => Date
    /** The upstream `fetch` (Supabase); tests pass a fake. */
    fetch: typeof fetch
    /** How long a Supabase read may take; tests pass a short one. */
    upstreamTimeoutMs?: number
}

/**
 * A Supabase read that takes longer is aborted: a hung read would otherwise
 * stay the isolate's one in-flight refresh, and every request without a
 * usable copy would wait on it. The client gives up on the edge after 3 s
 * (`EDGE_TIMEOUT_MS`) and reads Supabase itself.
 */
export const UPSTREAM_TIMEOUT_MS = 5000

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    })

/**
 * The Worker's request handler. The endpoint is built once per isolate (its
 * in-flight refreshes are shared), on the first request, from the env.
 */
export function createWorker({
    cache,
    now,
    fetch: send,
    upstreamTimeoutMs = UPSTREAM_TIMEOUT_MS,
}: WorkerOptions) {
    const sendWithTimeout: typeof fetch = (input, init) => {
        const timeout = AbortSignal.timeout(upstreamTimeoutMs)
        return send(input, {
            ...init,
            signal: init?.signal
                ? AbortSignal.any([init.signal, timeout])
                : timeout,
        })
    }
    let endpoint: ReturnType<typeof createPublicWindowEndpoint> | undefined

    return async function handle(
        request: Request,
        env: WorkerEnv,
        waitUntil: WaitUntil,
    ): Promise<Response> {
        const { pathname } = new URL(request.url)
        if (pathname !== PUBLIC_WINDOW_ENDPOINT) {
            return json({ error: "not found" }, 404)
        }
        const url = env.VITE_SUPABASE_URL
        const anonKey = env.VITE_SUPABASE_ANON_KEY
        if (!url || !anonKey) {
            // Misconfigured: the client falls back to Supabase directly.
            return json({ error: "not configured" }, 503)
        }
        endpoint ??= createPublicWindowEndpoint({
            // Anon only: no token is ever at hand (data/client.ts sends the
            // anon key in its place).
            data: createDataClient(
                url,
                anonKey,
                { accessToken: () => null },
                sendWithTimeout,
            ),
            cache,
            now,
        })
        return endpoint(request, waitUntil)
    }
}
