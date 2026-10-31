// The fake's Postgres functions (`createFakeDataClient().rpc`), called as
// the data client's `rpc(name, args)`: every call is recorded with the
// token it carried. `assign_user_role` behaves as its migration
// (supabase/migrations/20260808000000_assign_user_role.sql): only an admin
// caller (a `user_roles` row with role 1, or failing that a `users` row of
// type admin, as the test users are seeded) may call it; it upserts the
// `user_roles` row, sets `users.user_type` and the `public_bio` row's, and
// returns `{ user_id, role_id, user_type }`. Other functions answer through
// `handle`; a call can be made to fail (`fail`) or held (`hold`/`release`).

type Row = Record<string, unknown>

export interface RpcCall {
    name: string
    args: Row
    /** The access token the call carried (`null`: the anon key). */
    token: string | null
}

export interface RpcError {
    message: string
    code?: string
}

type Handler = (args: Row, callerId: string | null) => unknown

export interface FakeRpc {
    calls: RpcCall[]
    /** `name` answers with what `handler` returns (throw an `RpcError`). */
    handle(name: string, handler: Handler): void
    /** Every following call to `name` fails with the server's `error`. */
    fail(name: string, error: RpcError): void
    /** Calls to `name` succeed again. */
    heal(name: string): void
    /** Hold every following call to `name` until `release(name)`. */
    hold(name: string): void
    release(name: string): void
}

export interface RpcResult {
    data: unknown
    error: RpcError | null
    status: number
}

/** The user a fake token (`token-<user id>-<n>`) belongs to. */
const userOf = (token: string | null) =>
    token ? (/^token-(.+)-\d+$/.exec(token)?.[1] ?? null) : null

export function createFakeRpc(
    accessToken: () => string | null,
    rows: (table: string) => Row[],
): FakeRpc & { call(name: string, args: Row): Promise<RpcResult> } {
    const calls: RpcCall[] = []
    const failures = new Map<string, RpcError>()
    const held = new Map<string, (() => void)[]>()

    const isAdmin = (userId: string | null) => {
        if (!userId) return false
        const membership = rows("user_roles").find(
            (row) => row.user_id === userId,
        )
        if (membership) return membership.role_id === 1
        return rows("users").some(
            (row) => row.id === userId && row.user_type === "admin",
        )
    }

    const handlers = new Map<string, Handler>([
        [
            "assign_user_role",
            ({ p_user_id, p_role_id, p_user_type }, callerId) => {
                if (!isAdmin(callerId)) {
                    throw {
                        message: "not_authorized: only admins may assign roles",
                        code: "42501",
                    } satisfies RpcError
                }
                const roles = rows("user_roles")
                const membership = roles.find(
                    (row) => row.user_id === p_user_id,
                )
                if (membership) membership.role_id = p_role_id
                else {
                    roles.push({
                        id: crypto.randomUUID(),
                        user_id: p_user_id,
                        role_id: p_role_id,
                    })
                }
                for (const row of rows("users")) {
                    if (row.id === p_user_id) row.user_type = p_user_type
                }
                const bios = rows("public_bio")
                const bio = bios.find((row) => row.user_id === p_user_id)
                if (bio) bio.user_type = p_user_type
                else {
                    bios.push({
                        id: crypto.randomUUID(),
                        user_id: p_user_id,
                        user_type: p_user_type,
                    })
                }
                return {
                    user_id: p_user_id,
                    role_id: p_role_id,
                    user_type: p_user_type,
                }
            },
        ],
    ])

    return {
        calls,
        handle: (name, handler) => {
            failures.delete(name)
            handlers.set(name, handler)
        },
        fail: (name, error) => {
            failures.set(name, error)
        },
        heal: (name) => {
            failures.delete(name)
        },
        hold: (name) => {
            held.set(name, held.get(name) ?? [])
        },
        release: (name) => {
            const waiting = held.get(name) ?? []
            held.delete(name)
            for (const answer of waiting) answer()
        },
        async call(name, args) {
            const token = accessToken()
            calls.push({ name, args, token })
            const waiting = held.get(name)
            if (waiting) await new Promise<void>((go) => waiting.push(go))
            const failure = failures.get(name)
            if (failure) return { data: null, error: failure, status: 500 }
            const handler = handlers.get(name)
            if (!handler) {
                return {
                    data: null,
                    error: {
                        message: `Could not find the function public.${name}`,
                        code: "PGRST202",
                    },
                    status: 404,
                }
            }
            try {
                return {
                    data: handler(args, userOf(token)),
                    error: null,
                    status: 200,
                }
            } catch (error) {
                const { message, code } = error as RpcError
                return {
                    data: null,
                    error: { message, code },
                    status: code === "42501" ? 403 : 400,
                }
            }
        },
    }
}
