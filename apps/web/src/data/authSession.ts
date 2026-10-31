import type { DeviceStorage } from "../app/deviceStorage"

// The signed-in session as the app reads it without the auth client: what
// Supabase's auth client (auth-js) keeps in device storage. Kept small and
// eager so boot can decide who is looking at the app from storage alone, with
// no network and without loading auth-js (~25 KB gzip, its own chunk).

/** The parts of auth-js's `User` the app reads. */
export interface AuthUser {
    id: string
    email?: string
    phone?: string
    created_at?: string
    app_metadata?: { provider?: string }
    user_metadata?: { full_name?: string }
}

/** The parts of auth-js's `Session` the app reads (the stored JSON). */
export interface AuthSession {
    access_token: string
    refresh_token: string
    /** When the access token expires, in seconds since the epoch. */
    expires_at?: number
    user: AuthUser
}

/**
 * Where the session lives in device storage: supabase-js's default key,
 * `sb-<project ref>-auth-token`, which legacy used (it set no `storageKey`).
 * Reading and writing the same key and format keeps everyone signed in
 * across the cutover.
 */
export function authStorageKey(supabaseUrl: string): string {
    return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`
}

/**
 * Everything auth-js may keep under the key: the session, the PKCE code
 * verifier and (when configured) the user apart from the session.
 */
export const authStorageKeys = (key: string) => [
    key,
    `${key}-code-verifier`,
    `${key}-user`,
]

/** The stored session, or null if there is none or it can't be read. */
export function readStoredSession(
    storage: DeviceStorage,
    key: string,
): AuthSession | null {
    try {
        const raw = storage.getItem(key)
        if (!raw) return null
        const session = JSON.parse(raw) as Partial<AuthSession> | null
        if (
            typeof session?.access_token !== "string" ||
            typeof session.refresh_token !== "string" ||
            typeof session.user?.id !== "string"
        ) {
            return null
        }
        return session as AuthSession
    } catch {
        return null
    }
}

/** Milliseconds until the session's access token expires. */
export function msUntilExpiry(session: AuthSession, nowMs: number): number {
    return session.expires_at === undefined
        ? Infinity
        : session.expires_at * 1000 - nowMs
}

/**
 * auth-js refreshes a token this long before it expires (its
 * `EXPIRY_MARGIN_MS`); a token closer to expiry than this waits for that
 * refresh before a personal request uses it.
 */
export const REFRESH_MARGIN_MS = 90 * 1000

/**
 * A token this close to expiry is not sent at all: the request goes with the
 * anon key instead (public reads), as an expired JWT fails the whole request.
 */
export const SEND_MARGIN_MS = 10 * 1000

/** What an auth redirect brought back in the URL's fragment. */
export type AuthRedirect =
    | { tokens: { access_token: string; refresh_token: string } }
    | { error: { message: string; code?: string } }

/**
 * The auth redirect in the URL's fragment, if any. Legacy used the implicit
 * flow (supabase-js's default), so Supabase's email links (password
 * recovery) and Google sign-in come back as `#access_token=…&refresh_token=…`
 * or, when the link expired or was used, `#error=…&error_code=otp_expired&
 * error_description=…`.
 */
export function parseAuthRedirect(hash: string): AuthRedirect | null {
    const params = new URLSearchParams(hash.replace(/^#/, ""))
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")
    if (access_token && refresh_token) {
        return { tokens: { access_token, refresh_token } }
    }
    const error = params.get("error_description") ?? params.get("error")
    if (error) {
        return {
            error: {
                message: error,
                code:
                    params.get("error_code") ??
                    params.get("error") ??
                    undefined,
            },
        }
    }
    return null
}
