import type { SignedInRole } from "@ci-calendar/core/app/auth/roles"
import type { TestAccount } from "./fakeAuth"

/** An account with its `users` row, for `renderApp({ signedInAs })`. */
export interface TestUser extends TestAccount {
    role: SignedInRole
    isInternal?: boolean
}

/** A signed-up account of `role` (email and password unless overridden). */
export function testUser(
    role: SignedInRole = "user",
    overrides: Partial<TestUser> = {},
): TestUser {
    const id = overrides.id ?? crypto.randomUUID()
    return {
        id,
        email: `${role}@example.com`,
        password: "secret-password",
        provider: "email",
        name: `Dana the ${role}`,
        role,
        ...overrides,
    }
}

/** The account's row in `users`, as the database holds it. */
export function userRow(user: TestUser) {
    return {
        id: user.id,
        user_type: user.role,
        user_name: user.name ?? "",
        email: user.email,
        phone: "0500000000",
        provider: user.provider ?? "email",
        is_internal: user.isInternal ?? false,
        receive_weekly_schedule: true,
        weekly_schedule: { districts: [], eventTypes: [] },
        subscriptions: { teachers: [], orgs: [] },
        created_at: "2026-10-01T10:00:00Z",
    }
}
