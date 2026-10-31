/**
 * Supabase auth redirects put secrets in the URL: the implicit flow's
 * `#access_token=…&refresh_token=…&type=recovery` fragment, the PKCE
 * `?code=…`, and email links' `?token=…&type=signup` (or `token_hash`).
 * Everything telemetry sends that holds a URL goes through `scrubUrl`.
 */
const SECRET_FRAGMENT =
    /#[^\s"']*\b(?:access_token|refresh_token|provider_token|provider_refresh_token)=[^\s"']*/g

const SECRET_PARAM =
    /(?<=[?&])(?:code|token|token_hash|type|access_token|refresh_token|provider_token|provider_refresh_token)=[^&#\s"']*&?/g

/** A `?` or `&` left with nothing after it. */
const DANGLING = /[?&](?=#|[\s"']|$)/g

/**
 * The URL (or any text holding URLs: a span's "GET https://…") without
 * auth secrets: a fragment carrying tokens is dropped whole, and the
 * `code`, `token`, `token_hash` and `type` query parameters are removed.
 * Everything else, such as the filters' `f` values, is kept.
 */
export function scrubUrl(text: string): string {
    if (!text.includes("=")) return text
    return text
        .replace(SECRET_FRAGMENT, "")
        .replace(SECRET_PARAM, "")
        .replace(DANGLING, "")
}

/**
 * A copy of `record` with every string in it scrubbed, nested objects and
 * arrays included (PostHog's `$initial_person_info.u`, autocaptured
 * `$elements[].attr__href`).
 */
export function scrubValues<T extends Record<string, unknown>>(record: T): T {
    return scrubDeep(record, 0) as T
}

function scrubDeep(value: unknown, depth: number): unknown {
    if (typeof value === "string") return scrubUrl(value)
    if (depth > 5 || value === null || typeof value !== "object") return value
    if (Array.isArray(value)) {
        return value.map((item) => scrubDeep(item, depth + 1))
    }
    const scrubbed: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
        scrubbed[key] = scrubDeep(item, depth + 1)
    }
    return scrubbed
}
