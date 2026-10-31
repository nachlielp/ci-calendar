import type { Auth, AuthFailure, AuthOutcome, AuthSession } from "../data/auth"

// The auth half of the fake backend (`createFakeDataClient().auth`): an
// in-memory Supabase auth with accounts, a session and tokens. Every call
// that would reach Supabase's auth server is recorded in `calls`; failures
// can be injected per method, and token refreshes can be held (a slow
// network). The fake's data requests record the token they were sent with
// (`accessToken()` at send time), as the real data client does.

/** An account the fake knows (sign in with its email and password). */
export interface TestAccount {
    id: string
    email: string
    password?: string
    /** `email` (default) or `google`. */
    provider?: string
    name?: string
}

/** What reached Supabase's auth server. */
export type AuthCall =
    | { method: "refresh"; userId: string }
    | { method: "signInWithPassword"; email: string; password: string }
    | { method: "signInWithGoogle" }
    | { method: "signUp"; email: string; password: string; name: string }
    | { method: "requestPasswordReset"; email: string; redirectTo: string }
    | { method: "updatePassword"; userId: string | null; password: string }
    | { method: "signOut"; userId: string | null }

type FailingMethod = Exclude<AuthCall["method"], "refresh">

export interface FakeAuth extends Auth {
    bootUserId: string | null
    calls: AuthCall[]
    /** Whether the app asked to load the auth client in the background. */
    started: boolean
    accounts: TestAccount[]
    /**
     * Signs in as `account` (no call recorded), its token valid or expired;
     * before boot, the session stored on the device (`bootUserId`).
     */
    signInAs(account: TestAccount, options?: { expired?: boolean }): void
    /**
     * The app opens from an auth redirect with tokens (a reset link, Google
     * sign-in): the session is unknown until `finishRedirect`.
     */
    startRedirect(): void
    /** The redirect's tokens turn out to be `account`'s, or no good (null). */
    finishRedirect(account: TestAccount | null): void
    /** The app opens from an auth redirect that failed (`#error=…`). */
    failRedirect(failure: AuthFailure): void
    /** Makes every following call to `method` fail with `failure`. */
    fail(method: FailingMethod, failure: AuthFailure): void
    /** Holds token refreshes until `releaseRefresh()`. */
    holdRefresh(): void
    releaseRefresh(): void
}

export function createFakeAuth(): FakeAuth {
    const calls: AuthCall[] = []
    const accounts: TestAccount[] = []
    const failures = new Map<FailingMethod, AuthFailure>()
    const listeners = new Set<() => void>()
    let current: AuthSession | null | undefined = null
    let stored: AuthSession | null = null
    let redirectError: AuthFailure | null = null
    let redirected: (() => void)[] = []
    let expired = false
    let issued = 0
    let held: (() => void)[] | null = null

    const set = (
        session: AuthSession | null | undefined,
        isExpired = false,
    ) => {
        current = session
        expired = isExpired
        listeners.forEach((listener) => listener())
    }

    const sessionFor = (account: TestAccount): AuthSession => {
        issued += 1
        return {
            access_token: `token-${account.id}-${issued}`,
            refresh_token: `refresh-${account.id}-${issued}`,
            user: {
                id: account.id,
                email: account.email,
                phone: "",
                created_at: "2026-10-01T10:00:00Z",
                app_metadata: { provider: account.provider ?? "email" },
                user_metadata: { full_name: account.name ?? "" },
            },
        }
    }

    const failure = (method: FailingMethod): AuthOutcome | null => {
        const error = failures.get(method)
        return error ? { error } : null
    }
    const ok: AuthOutcome = { error: null }

    const auth: FakeAuth = {
        calls,
        started: false,
        accounts,
        bootUserId: null,
        session: () => current,
        redirectError: () => redirectError,
        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        accessToken: () => (current && !expired ? current.access_token : null),
        async ready() {
            if (current === undefined) {
                await new Promise<void>((done) => redirected.push(done))
            }
            if (!current || !expired) return current ?? null
            const userId = current.user.id
            calls.push({ method: "refresh", userId })
            if (held) await new Promise<void>((go) => held!.push(go))
            const account = accounts.find((known) => known.id === userId)
            if (account && current?.user.id === userId) set(sessionFor(account))
            return current ?? null
        },
        start() {
            auth.started = true
        },
        async signInWithPassword(email, password) {
            calls.push({ method: "signInWithPassword", email, password })
            const failed = failure("signInWithPassword")
            if (failed) return failed
            const account = accounts.find(
                (known) => known.email === email && known.password === password,
            )
            if (!account) {
                return {
                    error: {
                        message: "Invalid login credentials",
                        code: "invalid_credentials",
                    },
                }
            }
            set(sessionFor(account))
            return ok
        },
        async signInWithGoogle() {
            calls.push({ method: "signInWithGoogle" })
            // The browser would now leave for Google.
            return failure("signInWithGoogle") ?? ok
        },
        async signUp({ email, password, name }) {
            calls.push({ method: "signUp", email, password, name })
            const failed = failure("signUp")
            if (failed) return failed
            if (accounts.some((known) => known.email === email)) {
                return {
                    error: {
                        message: "User already registered",
                        code: "user_already_exists",
                    },
                }
            }
            const account = {
                id: crypto.randomUUID(),
                email,
                password,
                name,
                provider: "email",
            }
            accounts.push(account)
            // The project confirms emails automatically
            // (`mailer_autoconfirm`), so sign-up signs in at once.
            set(sessionFor(account))
            return ok
        },
        async requestPasswordReset(email, redirectTo) {
            calls.push({ method: "requestPasswordReset", email, redirectTo })
            return failure("requestPasswordReset") ?? ok
        },
        async updatePassword(password) {
            const userId = current?.user.id ?? null
            calls.push({ method: "updatePassword", userId, password })
            const failed = failure("updatePassword")
            if (failed) return failed
            if (!current) {
                return {
                    error: {
                        message: "Auth session missing!",
                        code: "session_not_found",
                    },
                }
            }
            const account = accounts.find((known) => known.id === userId)
            if (account) account.password = password
            return ok
        },
        async signOut() {
            calls.push({ method: "signOut", userId: current?.user.id ?? null })
            // Like the real one: the local session ends even when the
            // server call fails.
            set(null)
        },
        signInAs(account, { expired: isExpired = false } = {}) {
            if (!accounts.some((known) => known.id === account.id)) {
                accounts.push(account)
            }
            set(sessionFor(account), isExpired)
            stored = current ?? null
            auth.bootUserId = account.id
        },
        startRedirect() {
            set(undefined)
        },
        finishRedirect(account) {
            if (account && !accounts.some((known) => known.id === account.id)) {
                accounts.push(account)
            }
            if (!account) {
                redirectError = {
                    message: "Invalid Refresh Token",
                    code: "refresh_token_not_found",
                }
            }
            set(account ? sessionFor(account) : stored)
            const waiting = redirected
            redirected = []
            waiting.forEach((done) => done())
        },
        failRedirect(error) {
            redirectError = error
        },
        fail(method, error) {
            failures.set(method, error)
        },
        holdRefresh() {
            held ??= []
        },
        releaseRefresh() {
            const waiting = held ?? []
            held = null
            waiting.forEach((go) => go())
        },
    }
    return auth
}
