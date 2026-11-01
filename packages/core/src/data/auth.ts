import type { DeviceStorage } from "../app/deviceStorage"
import type { AuthClient } from "./authClient"
import {
    authStorageKey,
    authStorageKeys,
    msUntilExpiry,
    parseAuthRedirect,
    readStoredSession,
    REFRESH_MARGIN_MS,
    SEND_MARGIN_MS,
    type AuthSession,
} from "./authSession"

export type { AuthSession, AuthUser } from "./authSession"

/** What an auth action reports: nothing, or why it failed. */
export interface AuthOutcome {
    error: AuthFailure | null
}

export interface AuthFailure {
    message: string
    /** Supabase's error code, e.g. `invalid_credentials`, `same_password`. */
    code?: string
}

/**
 * Sign-in state and actions: the auth half of the seam (`services.auth`).
 * The app's only way to Supabase auth; tests pass the fake's
 * (`createFakeDataClient().auth`).
 *
 * Boot never waits on it. The session is read from device storage
 * synchronously (no network, no auth-js); auth-js itself is loaded only when
 * something needs it: a token to refresh, an auth action, an auth redirect
 * in the URL, or, for a signed-in user, the first idle moment (to keep the
 * token refreshed).
 */
export interface Auth {
    /**
     * The session at hand: `null` when signed out, `undefined` while it
     * can't be known yet (an auth redirect's tokens being checked). May be
     * expired; never waits. The same object until it changes.
     */
    session(): AuthSession | null | undefined
    /**
     * The user whose session was in device storage at boot, even while a
     * redirect is being read: their data may be on the device.
     */
    readonly bootUserId: string | null
    /**
     * Why the auth redirect the app opened with failed (`otp_expired`: an
     * expired or used link), or null.
     */
    redirectError(): AuthFailure | null
    /** Calls `listener` whenever `session()` changes. */
    subscribe(listener: () => void): () => void
    /**
     * The token data requests carry right now: the session's while it is
     * valid, else null (they use the anon key). Never waits.
     */
    accessToken(): string | null
    /**
     * The session once its token is good to use: at once when it is valid
     * for a while yet or there is none, else after auth-js has refreshed it
     * (or checked the redirect). Personal queries await this before they
     * send.
     */
    ready(): Promise<AuthSession | null>
    /** Loads auth-js in the background (token refresh, other tabs). */
    start(): void
    signInWithPassword(email: string, password: string): Promise<AuthOutcome>
    /** Leaves for Google's sign-in page, which returns to the app's site URL. */
    signInWithGoogle(): Promise<AuthOutcome>
    signUp(account: {
        email: string
        password: string
        name: string
    }): Promise<AuthOutcome>
    /** Emails a link that opens `redirectTo` signed in for a password reset. */
    requestPasswordReset(
        email: string,
        redirectTo: string,
    ): Promise<AuthOutcome>
    /** Sets a new password for the signed-in user. */
    updatePassword(password: string): Promise<AuthOutcome>
    /**
     * Ends the session with Supabase (every device, legacy's `global`
     * scope) and on this device. The local session always ends, even when
     * the server can't be reached.
     */
    signOut(): Promise<void>
}

/** Where other tabs' changes to device storage are heard (`window`). */
export interface StorageEvents {
    addEventListener(
        type: "storage",
        listener: (event: { readonly key: string | null }) => void,
    ): void
}

export interface AuthOptions {
    supabaseUrl: string
    anonKey: string
    storage: DeviceStorage
    /**
     * The URL's fragment, where auth redirects arrive (the web's
     * `browserAuthOptions`); none by default.
     */
    hash?: string
    /** Removes the fragment from the URL and its history entry. */
    clearHash?: () => void
    /** Where other tabs' storage changes are heard; none by default. */
    target?: StorageEvents
    nowMs?: () => number
    /** Loads auth-js (tests may stand in for it). */
    loadClient?: () => Promise<typeof import("./authClient")>
}

const failure = (error: unknown) => ({
    message: error instanceof Error ? error.message : String(error),
    code:
        error && typeof error === "object" && "code" in error
            ? String(error.code)
            : undefined,
})

/** Supabase auth for the app: storage first, auth-js on demand. */
export function createAuth({
    supabaseUrl,
    anonKey,
    storage,
    hash = "",
    clearHash = () => {},
    target,
    nowMs = Date.now,
    loadClient = () => import("./authClient"),
}: AuthOptions): Auth {
    const storageKey = authStorageKey(supabaseUrl)
    const listeners = new Set<() => void>()
    const stored = readStoredSession(storage, storageKey)

    // An auth redirect's tokens (or error) are taken out of the URL before
    // anything else sees it: the router, telemetry, the history stack.
    const redirect = parseAuthRedirect(hash)
    if (redirect) clearHash()
    let redirectError = redirect && "error" in redirect ? redirect.error : null
    // With tokens in the URL, the session is whatever they turn out to be.
    let current: AuthSession | null | undefined =
        redirect && "tokens" in redirect ? undefined : stored

    const set = (session: AuthSession | null) => {
        if (session === current) return
        // auth-js hands out a new object per event; keep ours if nothing
        // the app reads changed, so subscribers don't re-render for nothing.
        if (
            session &&
            current &&
            session.access_token === current.access_token &&
            session.user.id === current.user.id
        ) {
            return
        }
        current = session
        listeners.forEach((listener) => listener())
    }

    let client: Promise<AuthClient> | undefined
    const load = () =>
        (client ??= loadClient().then(
            ({ createAuthClient }) =>
                createAuthClient({
                    supabaseUrl,
                    anonKey,
                    storage,
                    storageKey,
                    onSession: set,
                }),
            (error: unknown) => {
                // Offline, or the file is gone after a deploy: try again
                // next time.
                client = undefined
                throw error
            },
        ))

    // The redirect's tokens become the session (auth-js checks them with
    // Supabase and stores them); if they don't, the stored one stays.
    const adopting =
        redirect && "tokens" in redirect
            ? load()
                  .then((auth) => auth.adoptSession(redirect.tokens))
                  .then(set, (error: unknown) => {
                      redirectError = failure(error)
                      set(readStoredSession(storage, storageKey))
                  })
            : Promise.resolve()

    // Another tab signed in or out (or refreshed), maybe before auth-js
    // ever loaded here, or without it.
    target?.addEventListener("storage", (event) => {
        if (current === undefined) return
        if (event.key !== null && event.key !== storageKey) return
        set(readStoredSession(storage, storageKey))
    })

    const act = async (
        run: (client: AuthClient) => Promise<AuthOutcome>,
    ): Promise<AuthOutcome> => {
        try {
            return await run(await load())
        } catch (error) {
            return { error: failure(error) }
        }
    }

    return {
        session: () => current,
        bootUserId: stored?.user.id ?? null,
        redirectError: () => redirectError,
        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        accessToken: () =>
            current && msUntilExpiry(current, nowMs()) > SEND_MARGIN_MS
                ? current.access_token
                : null,
        async ready() {
            if (current === undefined) await adopting
            const session = current
            if (!session) return null
            if (msUntilExpiry(session, nowMs()) > REFRESH_MARGIN_MS) {
                return session
            }
            const ready = await (await load()).validSession()
            set(ready)
            return ready
        },
        start: () => void load().catch(() => {}),
        signInWithPassword: (email, password) =>
            act((auth) => auth.signInWithPassword(email, password)),
        signInWithGoogle: () => act((auth) => auth.signInWithGoogle()),
        signUp: (account) => act((auth) => auth.signUp(account)),
        requestPasswordReset: (email, redirectTo) =>
            act((auth) => auth.requestPasswordReset(email, redirectTo)),
        updatePassword: (password) =>
            act((auth) => auth.updatePassword(password)),
        async signOut() {
            try {
                await (await load()).signOut()
            } catch {
                // Offline or auth-js unavailable: end it here at least.
            } finally {
                for (const key of authStorageKeys(storageKey)) {
                    try {
                        storage.removeItem(key)
                    } catch {
                        // Blocked storage holds nothing.
                    }
                }
                set(null)
            }
        },
    }
}
