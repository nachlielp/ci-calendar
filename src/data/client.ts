import { PostgrestClient } from "@supabase/postgrest-js"
import type { Database } from "./database.types"

/**
 * The app's data client — the single seam between the app and Supabase.
 *
 * Built from the PostgREST sub-client instead of `@supabase/supabase-js`, so
 * the realtime module never reaches the bundle: the app has no realtime by
 * design (spec #34). Tests inject a fake through `AppServices` instead.
 */
export type DataClient = PostgrestClient<Database>

export function createDataClient(url: string, anonKey: string): DataClient {
    return new PostgrestClient<Database>(`${url}/rest/v1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        // The query cache owns retries (app/boot.ts); retrying here as well
        // would multiply them.
        retry: false,
    })
}
