import { FunctionsClient } from "@supabase/functions-js"
import type { Auth } from "./auth"
import type { Functions } from "./functions"

/** The Edge Functions client behind `services.functions` (./functions.ts). */
export function connectFunctions(
    url: string,
    anonKey: string,
    auth: Pick<Auth, "accessToken">,
): Functions {
    const client = new FunctionsClient(`${url}/functions/v1`, {
        headers: { apikey: anonKey },
        customFetch: (input, init) => {
            const headers = new Headers(init?.headers)
            headers.set(
                "Authorization",
                `Bearer ${auth.accessToken() ?? anonKey}`,
            )
            return fetch(input, { ...init, headers })
        },
    })
    return {
        async invoke(name, { body }) {
            const { data, error } = await client.invoke(name, { body })
            return error
                ? { data: null, error: { message: String(error.message) } }
                : { data, error: null }
        },
    }
}
