import { PostgrestClient } from "@supabase/postgrest-js"
import type { Database } from "./database.types"

/**
 * The app's data client — the single seam between the app and Supabase's
 * database. Auth is the other half of the seam (`services.auth`, ./auth.ts).
 *
 * Built from the PostgREST sub-client instead of `@supabase/supabase-js`, so
 * the realtime module never reaches the bundle: the app has no realtime by
 * design (spec #34). Tests inject a fake through `AppServices` instead.
 */
export type DataClient = PostgrestClient<Database>

/**
 * Where a request's token comes from: `services.auth` (./auth.ts) in the
 * app; the Worker has none, so it sends the anon key alone. Structural, so
 * the Worker (worker/app.ts) builds this client without the browser's auth.
 */
export interface TokenSource {
    /** The signed-in user's valid access token, or `null` for anon. */
    accessToken(): string | null
}

/**
 * Each request carries the token at hand when it is sent (as supabase-js
 * did): the signed-in user's while it is valid, refreshed ones included,
 * else the anon key. It never waits for auth; personal queries await
 * `auth.ready()` first so theirs is valid.
 */
export function createDataClient(
    url: string,
    anonKey: string,
    auth: TokenSource,
    send: typeof fetch = (...args) => fetch(...args),
): DataClient {
    return new PostgrestClient<Database>(`${url}/rest/v1`, {
        headers: { apikey: anonKey },
        fetch: (input, init) => {
            const headers = new Headers(init?.headers)
            headers.set(
                "Authorization",
                `Bearer ${auth.accessToken() ?? anonKey}`,
            )
            return send(input, { ...init, headers })
        },
        // The query cache owns retries (app/boot.ts); retrying here as well
        // would multiply them.
        retry: false,
    })
}
