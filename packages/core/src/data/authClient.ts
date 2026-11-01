import {
    GoTrueClient,
    isAuthSessionMissingError,
    type AuthError,
} from "@supabase/auth-js"
import type { DeviceStorage } from "../app/deviceStorage"
import type { AuthOutcome } from "./auth"
import type { AuthSession } from "./authSession"

// auth-js, in its own chunk: loaded by `createAuth` (./auth.ts) only when the
// app needs it, never for `/`'s first paint.

export interface AuthClientOptions {
    supabaseUrl: string
    anonKey: string
    storage: DeviceStorage
    storageKey: string
    /** Every session change: sign-in, refresh, sign-out, other tabs. */
    onSession: (session: AuthSession | null) => void
}

export type AuthClient = ReturnType<typeof createAuthClient>

const outcome = ({ error }: { error: AuthError | null }): AuthOutcome => ({
    error: error
        ? {
              message: error.message,
              // auth-js gives a missing session no code; Supabase calls it so.
              code: isAuthSessionMissingError(error)
                  ? "session_not_found"
                  : error.code,
          }
        : null,
})

/**
 * auth-js configured as legacy's supabase-js client was (its defaults: the
 * same storage key and session format, persisted, auto refresh, the
 * implicit flow), so sessions carry over both ways. One difference: it
 * doesn't read redirects from the URL itself. `createAuth` takes the tokens
 * out of the URL at boot, before the router or telemetry see them and
 * without leaving them in the history, and hands them to `adoptSession`.
 */
export function createAuthClient({
    supabaseUrl,
    anonKey,
    storage,
    storageKey,
    onSession,
}: AuthClientOptions) {
    const client = new GoTrueClient({
        url: `${supabaseUrl}/auth/v1`,
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        storageKey,
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "implicit",
    })
    client.onAuthStateChange((_event, session) => onSession(session ?? null))

    return {
        /**
         * An auth redirect's tokens as the session (what auth-js's own URL
         * detection does): checked with Supabase, then stored. Throws if
         * they are no good (expired, revoked).
         */
        async adoptSession(tokens: {
            access_token: string
            refresh_token: string
        }): Promise<AuthSession> {
            const { data, error } = await client.setSession(tokens)
            if (error) throw error
            if (!data.session) throw new Error("No session")
            return data.session
        },
        /**
         * The session with a token good to use, refreshing it if it is
         * (nearly) expired. Throws when that can't be known (offline); the
         * stored session is kept for later.
         */
        async validSession(): Promise<AuthSession | null> {
            const { data, error } = await client.getSession()
            if (error) throw error
            return data.session
        },
        signInWithPassword: async (email: string, password: string) =>
            outcome(await client.signInWithPassword({ email, password })),
        signInWithGoogle: async () =>
            outcome(await client.signInWithOAuth({ provider: "google" })),
        signUp: async (account: {
            email: string
            password: string
            name: string
        }) =>
            outcome(
                await client.signUp({
                    email: account.email,
                    password: account.password,
                    options: { data: { full_name: account.name } },
                }),
            ),
        requestPasswordReset: async (email: string, redirectTo: string) =>
            outcome(await client.resetPasswordForEmail(email, { redirectTo })),
        updatePassword: async (password: string) =>
            outcome(await client.updateUser({ password })),
        async signOut() {
            const { error } = await client.signOut()
            // The server couldn't be told (offline): end it here anyway.
            if (error) await client.signOut({ scope: "local" })
        },
    }
}
