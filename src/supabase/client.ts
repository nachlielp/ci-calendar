/// <reference types="vite/client" />

import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Generated database types live in ./database.types.ts (regenerate with
// `npm run gen:types`). Wiring them into `createClient<Database>` — and
// removing the resulting domain↔row casts across the services — needs a
// Row↔domain mapping layer and is deferred to a follow-up; see #27.

/**
 * Factory for the app's Supabase client. Tests call this with a fake client to
 * drive the data layer through a single seam; the app uses the `supabase`
 * instance below.
 */
export function createSupabaseClient(
    url: string = import.meta.env.VITE_SUPABASE_URL,
    anonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY,
): SupabaseClient {
    return createClient(url, anonKey, {
        auth: {
            storage: localStorage,
            persistSession: true,
            autoRefreshToken: true,
        },
    })
}

/**
 * App-wide client instance, eagerly created from env so existing import sites
 * keep working unchanged. The store still constructs eagerly and uses this at
 * import time; removing this eager instance in favour of a fully injected
 * client lands with the store factory (#27).
 */
export const supabase = createSupabaseClient()
