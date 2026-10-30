import { describe, it, expect, vi, beforeEach } from "vitest"
import type { CIUser } from "../util/interfaces"

// Break the heavy import graph the store pulls in at module load.
vi.mock("../App", () => ({ CACHE_VERSION: "test" }))

const state = vi.hoisted(() => ({
    signOut: vi.fn(),
}))

// Drive the store through the single Supabase-client seam. The store
// constructs eagerly on import and subscribes to auth changes, so the fake
// `auth` must expose onAuthStateChange; the query/realtime surface is stubbed
// enough for construction and the offline-data bootstrap to run.
vi.mock("../supabase/client", () => {
    const builder: unknown = new Proxy(function () {}, {
        get(_t, prop) {
            if (prop === "then") {
                return (resolve: (r: unknown) => void) =>
                    resolve({ data: [], error: null })
            }
            return () => builder
        },
    })
    const supabase = {
        auth: {
            signOut: state.signOut,
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: () => {} } },
            })),
            getUser: vi.fn(async () => ({ data: { user: null } })),
        },
        from: () => builder,
        storage: { from: () => builder },
        functions: { invoke: vi.fn(async () => ({ data: null, error: null })) },
        channel: () => ({
            on: () => ({ subscribe: () => ({}) }),
            subscribe: () => ({}),
        }),
        removeChannel: vi.fn(),
    }
    return { supabase, createSupabaseClient: () => supabase }
})

import { store } from "./store"

beforeEach(() => {
    state.signOut.mockReset()
    state.signOut.mockResolvedValue({ error: null })
})

describe("store.signOut", () => {
    it("tells the auth provider to sign out and clears user state", async () => {
        store.setUser({ id: "u1", user_name: "Dana" } as Partial<CIUser>)
        expect(store.user.id).toBe("u1")

        await store.signOut()

        expect(state.signOut).toHaveBeenCalledTimes(1)
        expect(store.user).toEqual({})
    })

    it("still clears local state when signOut rejects (session_not_found)", async () => {
        state.signOut.mockRejectedValue(new Error("session_not_found"))
        store.setUser({ id: "u2" } as Partial<CIUser>)

        await store.signOut()

        expect(store.user).toEqual({})
    })
})
