import { describe, expect, it } from "vitest"
import { createFakeDataClient } from "../../testing/fakeDataClient"
import { afterNewest } from "../admin/adminLists"
import { assignUserRole } from "./roles"
import {
    movedBetween,
    searchTerms,
    toAdminUser,
    usersFilter,
    withRole,
    type AdminUser,
    type UserPages,
} from "./users"

describe("searchTerms", () => {
    it("matches the name or the email, anywhere, as a quoted ilike", () => {
        expect(searchTerms("  dana ")).toBe(
            'user_name.ilike."*dana*",email.ilike."*dana*"',
        )
    })

    it("is nothing for an empty search", () => {
        expect(searchTerms("   ")).toBeNull()
    })

    it("keeps PostgREST's reserved characters as text", () => {
        expect(searchTerms("a.b,c(d):e")).toBe(
            'user_name.ilike."*a.b,c(d):e*",email.ilike."*a.b,c(d):e*"',
        )
    })

    it("escapes LIKE's wildcards, backslashes and quotes, and makes * any one character", () => {
        expect(searchTerms('50%_a\\b"c*d')).toBe(
            'user_name.ilike."*50\\\\%\\\\_a\\\\\\\\b\\"c_d*",email.ilike."*50\\\\%\\\\_a\\\\\\\\b\\"c_d*"',
        )
    })
})

describe("usersFilter", () => {
    const cursor = { createdAt: "2026-10-01T10:00:00.5+00:00", id: "u-1" }

    it("continues after the cursor in the list's order (newest first, then id)", () => {
        expect(afterNewest(cursor)).toBe(
            'created_at.lt."2026-10-01T10:00:00.5+00:00",and(created_at.eq."2026-10-01T10:00:00.5+00:00",id.lt."u-1")',
        )
        expect(usersFilter("", cursor)).toBe(afterNewest(cursor))
    })

    it("is the search alone on the first page, and nothing without one", () => {
        expect(usersFilter("dana", null)).toBe(searchTerms("dana"))
        expect(usersFilter(" ", null)).toBeNull()
    })

    it("needs both the search and the cursor on a later page, in one tree", () => {
        expect(usersFilter("dana", cursor)).toBe(
            `and(or(${searchTerms("dana")}),or(${afterNewest(cursor)}))`,
        )
    })
})

const dana: AdminUser = {
    id: "u-1",
    name: "Dana",
    email: "dana@example.com",
    phone: "0501234567",
    userType: "user",
    role: "user",
    createdAt: "2026-10-01T10:00:00Z",
}

describe("toAdminUser", () => {
    it("reads the role from the role membership, as legacy showed it", () => {
        const row = {
            id: "u-1",
            user_name: "Dana",
            email: "dana@example.com",
            phone: "0501234567",
            user_type: "creator",
            created_at: "2026-10-01T10:00:00Z",
            user_roles: { role_id: 3 },
        }
        expect(toAdminUser(row)).toEqual({
            ...dana,
            userType: "creator",
            role: "org",
        })
        expect(toAdminUser({ ...row, user_roles: null }).role).toBe("user")
    })
})

describe("withRole", () => {
    const pages: UserPages = {
        pages: [
            { users: [dana], next: { createdAt: dana.createdAt, id: "u-1" } },
            { users: [{ ...dana, id: "u-2" }], next: null },
        ],
        pageParams: [null, { createdAt: dana.createdAt, id: "u-1" }],
    }

    it("sets the user's type and role, leaving other pages as they were", () => {
        const next = withRole(pages, {
            userId: "u-2",
            roleId: 2,
            userType: "creator",
        })
        expect(next.pages[0]).toBe(pages.pages[0])
        expect(next.pages[1].users[0]).toMatchObject({
            userType: "creator",
            role: "creator",
        })
    })

    it("is the same object when the user isn't there", () => {
        expect(
            withRole(pages, { userId: "u-9", roleId: 2, userType: "creator" }),
        ).toBe(pages)
    })
})

describe("movedBetween", () => {
    const stats = {
        total: 3,
        byType: { admin: 1, creator: 0, org: 0, profile: 0, user: 2 },
    }

    it("moves one account between the counts", () => {
        expect(movedBetween(stats, "user", "creator")).toEqual({
            total: 3,
            byType: { admin: 1, creator: 1, org: 0, profile: 0, user: 1 },
        })
    })

    it("only adds when the old type wasn't counted", () => {
        expect(movedBetween(stats, "", "creator").byType).toMatchObject({
            creator: 1,
            user: 2,
        })
    })
})

// Legacy userRoleService.test.ts, kept: one RPC, its error wrapped.
describe("assignUserRole", () => {
    function signedInAdmin() {
        const fake = createFakeDataClient({
            users: [{ id: "admin-1", user_type: "admin" }],
        })
        fake.auth.signInAs({
            id: "admin-1",
            email: "admin@example.com",
            password: "secret-password",
        })
        return fake
    }

    it("performs the whole assignment through a single assign_user_role RPC", async () => {
        const fake = signedInAdmin()

        const role = await assignUserRole(fake.client, "u1", "creator")

        // Exactly one write path: the atomic RPC, not three table writes.
        expect(fake.rpc.calls).toEqual([
            {
                name: "assign_user_role",
                args: {
                    p_user_id: "u1",
                    p_role_id: 2,
                    p_user_type: "creator",
                },
                token: expect.stringContaining("admin-1"),
            },
        ])
        expect(fake.requests).toEqual([])
        expect(role).toEqual({ userId: "u1", roleId: 2, userType: "creator" })
    })

    it("wraps an RPC error with context and the underlying message", async () => {
        const fake = signedInAdmin()
        fake.rpc.fail("assign_user_role", {
            message: "not_authorized: only admins may assign roles",
            code: "42501",
        })

        await expect(
            assignUserRole(fake.client, "u1", "creator"),
        ).rejects.toThrow(
            /Failed to update user role ERROR: not_authorized: only admins may assign roles/,
        )
    })

    it("is refused for a caller who isn't an admin, as the function does", async () => {
        const fake = createFakeDataClient({
            users: [{ id: "creator-1", user_type: "creator" }],
        })
        fake.auth.signInAs({
            id: "creator-1",
            email: "creator@example.com",
            password: "secret-password",
        })

        await expect(
            assignUserRole(fake.client, "creator-1", "admin"),
        ).rejects.toThrow(/not_authorized/)
        expect(fake.rows("user_roles")).toEqual([])
    })
})
