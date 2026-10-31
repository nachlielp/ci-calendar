import type { Auth } from "./auth"

/**
 * Supabase Edge Functions (`services.functions`): the seam's third part,
 * after the data client and auth. The app's one function is `translate`
 * (supabase/functions/translate), which holds the billable Google key.
 * Tests pass the fake's (`createFakeDataClient().functions`).
 */
export interface Functions {
    /**
     * Calls the function `name` with a JSON `body`. Never throws: a failure
     * (network, relay, the function's own error) comes back as `error`.
     */
    invoke<T = unknown>(
        name: string,
        options: { body: Record<string, unknown> },
    ): Promise<{ data: T | null; error: { message: string } | null }>
}

/**
 * `@supabase/functions-js` (./functionsClient.ts), imported the first time
 * a function is called (a save, or event details in English or Russian),
 * so `/` never carries it. Each call carries the token at hand
 * (`auth.accessToken()`, else the anon key), as data requests do; callers
 * that need the user's own token await `auth.ready()` first.
 */
export function createFunctions(
    url: string,
    anonKey: string,
    auth: Pick<Auth, "accessToken">,
): Functions {
    let client: Promise<Functions> | undefined
    return {
        async invoke(name, options) {
            try {
                client ??= import("./functionsClient").then(
                    ({ connectFunctions }) =>
                        connectFunctions(url, anonKey, auth),
                )
                return await (await client).invoke(name, options)
            } catch (error) {
                // The client's chunk didn't load (offline, a deploy): try
                // the import again next time.
                client = undefined
                return { data: null, error: { message: String(error) } }
            }
        },
    }
}
