import { describe, it, expect, vi, beforeEach } from "vitest"
import { UserType } from "../util/interfaces"

// Drive the service through the single seam — a fake Supabase client — instead
// of the network. Role assignment must go through ONE `rpc("assign_user_role")`
// call (ticket #16), so the fake records the rpc name + args and resolves to a
// canned `{ data, error }` the test sets.
const state = vi.hoisted(() => ({
    result: { data: null as unknown, error: null as unknown },
    calls: [] as Array<{ fn: string; args: unknown }>,
}))

vi.mock("./client", () => {
    const supabase = {
        rpc: (fn: string, args: unknown) => {
            state.calls.push({ fn, args })
            return {
                then: (resolve: (r: unknown) => void) => resolve(state.result),
            }
        },
    }
    return { supabase, createSupabaseClient: () => supabase }
})

import { userRoleService } from "./userRoleService"

beforeEach(() => {
    state.result = { data: null, error: null }
    state.calls = []
})

describe("userRoleService.updateUserRole", () => {
    it("performs the whole assignment via a single assign_user_role RPC", async () => {
        state.result = {
            data: { user_id: "u1", role_id: 2, user_type: "creator" },
            error: null,
        }

        const role = await userRoleService.updateUserRole({
            user_id: "u1",
            role_id: 2,
            user_type: UserType.creator,
        })

        // Exactly one write path: the atomic RPC, not three table writes.
        expect(state.calls).toEqual([
            {
                fn: "assign_user_role",
                args: {
                    p_user_id: "u1",
                    p_role_id: 2,
                    p_user_type: "creator",
                },
            },
        ])
        expect(role).toEqual({
            user_id: "u1",
            role_id: 2,
            user_type: "creator",
        })
    })

    it("wraps an RPC error with context and the underlying message", async () => {
        state.result = {
            data: null,
            error: new Error("not_authorized: only admins may assign roles"),
        }

        await expect(
            userRoleService.updateUserRole({
                user_id: "u1",
                role_id: 2,
                user_type: UserType.creator,
            }),
        ).rejects.toThrow(
            /Failed to update user role ERROR: not_authorized: only admins may assign roles/,
        )
    })
})
