import { afterEach, describe, expect, it, vi } from "vitest"
import { createMemoryStorage } from "../app/deviceStorage"
import { createAuth } from "./auth"
import { authStorageKey } from "./authSession"
import { createDataClient } from "./client"

// The real auth seam and data client, with the network stubbed: they read
// legacy's stored session, load auth-js only when needed, and put the right
// token on data requests.

const URL = "https://pjgwpivkvsuernmoeebk.supabase.co"
const KEY = "sb-pjgwpivkvsuernmoeebk-auth-token"
const NOW_S = 1_800_000_000

/** A session as legacy's supabase-js (auth-js 2.65) stored it. */
function storedSession(expiresAt = NOW_S + 3600, token = "stored-token") {
    return JSON.stringify({
        access_token: token,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: expiresAt,
        refresh_token: "stored-refresh",
        user: {
            id: "u1",
            aud: "authenticated",
            role: "authenticated",
            email: "dana@example.com",
            app_metadata: { provider: "email", providers: ["email"] },
            user_metadata: { full_name: "Dana" },
            created_at: "2024-01-01T00:00:00Z",
        },
    })
}

const now = () => NOW_S * 1000

afterEach(() => {
    vi.unstubAllGlobals()
})

describe("auth storage", () => {
    it("uses legacy supabase-js's default key", () => {
        expect(authStorageKey(URL)).toBe(KEY)
    })

    it("reads a legacy session from storage at once, without auth-js", () => {
        const storage = createMemoryStorage()
        storage.setItem(KEY, storedSession())
        const loadClient = vi.fn()

        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "",
            nowMs: now,
            loadClient,
        })

        expect(auth.session()?.user).toMatchObject({
            id: "u1",
            email: "dana@example.com",
        })
        expect(auth.accessToken()).toBe("stored-token")
        expect(loadClient).not.toHaveBeenCalled()
    })

    it("is signed out with nothing (or nonsense) stored", () => {
        const storage = createMemoryStorage()
        storage.setItem(KEY, "{not json")
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "",
            loadClient: vi.fn(),
        })

        expect(auth.session()).toBeNull()
        expect(auth.accessToken()).toBeNull()
    })

    it("sends no expired token", () => {
        const storage = createMemoryStorage()
        storage.setItem(KEY, storedSession(NOW_S - 10))
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "",
            nowMs: now,
            loadClient: vi.fn(),
        })

        expect(auth.session()).not.toBeNull()
        expect(auth.accessToken()).toBeNull()
    })

    it("follows other tabs signing in and out, without auth-js", () => {
        const storage = createMemoryStorage()
        const target = new EventTarget() as unknown as Window
        const loadClient = vi.fn()
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "",
            nowMs: now,
            target,
            loadClient,
        })
        const changes = vi.fn()
        auth.subscribe(changes)
        const otherTab = (key: string | null) =>
            target.dispatchEvent(new StorageEvent("storage", { key }))

        storage.setItem(KEY, storedSession())
        otherTab(KEY)
        expect(auth.session()?.user.id).toBe("u1")

        storage.setItem("language", "en")
        otherTab("language")
        expect(changes).toHaveBeenCalledTimes(1)

        storage.removeItem(KEY)
        otherTab(KEY)
        expect(auth.session()).toBeNull()
        expect(changes).toHaveBeenCalledTimes(2)
        expect(loadClient).not.toHaveBeenCalled()
    })
})

/** A JWT shaped as Supabase's (auth-js reads its `exp`). */
function jwt(exp: number) {
    const part = (value: object) =>
        btoa(JSON.stringify(value))
            .replace(/=+$/, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
    return `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub: "u2", exp })}.c2lnbmF0dXJl`
}

describe("auth redirects", () => {
    it("takes the tokens out of the URL at once and adopts them through auth-js", async () => {
        const storage = createMemoryStorage()
        storage.setItem(KEY, storedSession())
        const token = jwt(Math.floor(Date.now() / 1000) + 3600)
        const fetch = vi.fn(async (input: RequestInfo | URL) =>
            String(input).endsWith("/auth/v1/user")
                ? Response.json({
                      id: "u2",
                      aud: "authenticated",
                      email: "noa@example.com",
                      app_metadata: { provider: "email" },
                      user_metadata: {},
                  })
                : new Response("{}", { status: 404 }),
        )
        vi.stubGlobal("fetch", fetch)
        const clearHash = vi.fn()
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: `#access_token=${token}&expires_in=3600&refresh_token=r2&token_type=bearer&type=recovery`,
            clearHash,
        })

        expect(clearHash).toHaveBeenCalledTimes(1)
        expect(auth.session()).toBeUndefined()
        // Whose data may be on the device meanwhile.
        expect(auth.bootUserId).toBe("u1")

        const session = await auth.ready()

        expect(session).toMatchObject({
            access_token: token,
            refresh_token: "r2",
            user: { id: "u2", email: "noa@example.com" },
        })
        expect(auth.session()?.user.id).toBe("u2")
        expect(JSON.parse(storage.getItem(KEY)!)).toMatchObject({
            access_token: token,
            user: { id: "u2" },
        })
        expect(auth.redirectError()).toBeNull()
    })

    it("keeps the stored session when the redirect's tokens are no good", async () => {
        const storage = createMemoryStorage()
        storage.setItem(KEY, storedSession())
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "#access_token=not-a-jwt&refresh_token=r",
            clearHash: () => {},
            nowMs: now,
        })

        expect(await auth.ready()).toMatchObject({ user: { id: "u1" } })
        expect(auth.redirectError()).not.toBeNull()
    })

    it("reads an expired link's error and clears it, needing no auth-js", () => {
        const storage = createMemoryStorage()
        storage.setItem(KEY, storedSession())
        const clearHash = vi.fn()
        const loadClient = vi.fn()
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
            clearHash,
            nowMs: now,
            loadClient,
        })

        expect(clearHash).toHaveBeenCalledTimes(1)
        expect(auth.redirectError()).toEqual({
            message: "Email link is invalid or has expired",
            code: "otp_expired",
        })
        expect(auth.session()?.user.id).toBe("u1")
        expect(loadClient).not.toHaveBeenCalled()
    })
})

describe("ready()", () => {
    it("needs no auth-js while the token is good", async () => {
        const storage = createMemoryStorage()
        storage.setItem(KEY, storedSession())
        const loadClient = vi.fn()
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "",
            nowMs: now,
            loadClient,
        })

        expect((await auth.ready())?.access_token).toBe("stored-token")
        expect(loadClient).not.toHaveBeenCalled()
    })

    it("refreshes an expired token through auth-js, keeping legacy's format", async () => {
        const storage = createMemoryStorage()
        storage.setItem(KEY, storedSession(Math.floor(Date.now() / 1000) - 60))
        const fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input)
            if (url.includes("/auth/v1/token?grant_type=refresh_token")) {
                return Response.json({
                    access_token: "fresh-token",
                    token_type: "bearer",
                    expires_in: 3600,
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                    refresh_token: "fresh-refresh",
                    user: JSON.parse(storedSession()).user,
                })
            }
            return new Response("{}", { status: 404 })
        })
        vi.stubGlobal("fetch", fetch)
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "",
        })
        const changes = vi.fn()
        auth.subscribe(changes)

        const session = await auth.ready()

        expect(session?.access_token).toBe("fresh-token")
        expect(auth.accessToken()).toBe("fresh-token")
        expect(changes).toHaveBeenCalled()
        expect(JSON.parse(storage.getItem(KEY)!)).toMatchObject({
            access_token: "fresh-token",
            refresh_token: "fresh-refresh",
            user: { id: "u1" },
        })
        const [url, init] = fetch.mock.calls[0] as unknown as [
            string,
            RequestInit,
        ]
        expect(url).toBe(`${URL}/auth/v1/token?grant_type=refresh_token`)
        expect(new Headers(init.headers).get("apikey")).toBe("anon")
    })
})

describe("signOut()", () => {
    it("ends the session here even when auth-js can't be loaded", async () => {
        const storage = createMemoryStorage()
        storage.setItem(KEY, storedSession())
        storage.setItem(`${KEY}-code-verifier`, "v")
        storage.setItem("language", "en")
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "",
            nowMs: now,
            loadClient: () => Promise.reject(new TypeError("offline")),
        })

        await auth.signOut()

        expect(auth.session()).toBeNull()
        expect(storage.getItem(KEY)).toBeNull()
        expect(storage.getItem(`${KEY}-code-verifier`)).toBeNull()
        expect(storage.getItem("language")).toBe("en")
    })

    it("tells Supabase (every device), and ends it locally if that fails", async () => {
        const storage = createMemoryStorage()
        storage.setItem(
            KEY,
            storedSession(Math.floor(Date.now() / 1000) + 3600),
        )
        const fetch = vi.fn(async () => {
            throw new TypeError("Failed to fetch")
        })
        vi.stubGlobal("fetch", fetch)
        const auth = createAuth({
            supabaseUrl: URL,
            anonKey: "anon",
            storage,
            hash: "",
        })

        await auth.signOut()

        const [url] = fetch.mock.calls[0] as unknown as [string]
        expect(url).toBe(`${URL}/auth/v1/logout?scope=global`)
        expect(auth.session()).toBeNull()
        expect(storage.getItem(KEY)).toBeNull()
    })
})

describe("data requests", () => {
    const send = () =>
        vi.fn(async (..._args: Parameters<typeof fetch>) => Response.json([]))
    const authorization = (fetch: ReturnType<typeof send>, call = 0) =>
        new Headers(fetch.mock.calls[call][1]?.headers).get("Authorization")

    it("go with the anon key when signed out", async () => {
        const fetch = send()
        const data = createDataClient(
            URL,
            "anon",
            { accessToken: () => null },
            fetch,
        )

        await data.from("ci_events").select("id")

        expect(authorization(fetch)).toBe("Bearer anon")
        expect(new Headers(fetch.mock.calls[0][1]?.headers).get("apikey")).toBe(
            "anon",
        )
    })

    it("carry the token at hand when sent, refreshed ones included", async () => {
        const fetch = send()
        let token = "first"
        const data = createDataClient(
            URL,
            "anon",
            { accessToken: () => token },
            fetch,
        )

        await data.from("users").select("id")
        token = "refreshed"
        await data.from("users").select("id")

        expect(authorization(fetch, 0)).toBe("Bearer first")
        expect(authorization(fetch, 1)).toBe("Bearer refreshed")
    })
})
