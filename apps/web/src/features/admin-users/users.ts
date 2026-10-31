import {
    infiniteQueryOptions,
    queryOptions,
    type InfiniteData,
} from "@tanstack/react-query"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { AppServices } from "../../app/services"
import type { SignedInRole } from "../../app/viewer"
import { keysetPage, quoted } from "../../lib/keyset"
import {
    afterNewest,
    containing,
    newestCursorOf,
    PAGED_ADMIN_FRESHNESS,
    type NewestCursor,
} from "../admin/adminLists"

// The users list for `/manage-users` (legacy ManageUsersPage and
// usersService.getUsers): admin data, read only when the page opens, a page
// at a time and searched on the server (legacy fetched every user at boot
// and filtered them in the browser). Never at boot, never persisted,
// forgotten on sign-out (its kinds aren't in `PUBLIC_QUERY_KINDS`). Keyed
// on the admin, as personal queries are, so it starts with `sessionOf`.

/** First element of the users list's query keys. */
export const ADMIN_USERS_KIND = "admin-users"

/** First element of the role counts' query key. */
export const ADMIN_USER_STATS_KIND = "admin-user-stats"

/** Users per page ("load more"). */
export const USERS_PAGE_SIZE = 20

/**
 * What the page shows of a user (legacy's option label, details and role
 * buttons) and the page's order (`created_at`, `id`). `user_roles` is the
 * role membership legacy displayed; `user_type` the one its buttons read.
 */
export const ADMIN_USER_COLUMNS =
    "id, user_name, email, phone, user_type, created_at, user_roles(role_id)"

/** `roles.id` of each role, as legacy's buttons sent them. */
export const ROLE_IDS: Readonly<Record<SignedInRole, number>> = {
    admin: 1,
    creator: 2,
    org: 3,
    profile: 4,
    user: 5,
}

const ROLE_OF_ID = new Map(
    Object.entries(ROLE_IDS).map(([role, id]) => [id, role as SignedInRole]),
)

export interface AdminUser {
    id: string
    name: string
    email: string
    phone: string
    /** `users.user_type`: the role button that is off. */
    userType: string
    /**
     * The role membership (`user_roles`), as legacy showed it: a plain user
     * when there is none.
     */
    role: SignedInRole
    createdAt: string
}

export interface UserPage {
    users: AdminUser[]
    /** After the last user shown (newest first); `null` on the last page. */
    next: NewestCursor | null
}

export type UserPages = InfiniteData<UserPage, NewestCursor | null>

interface AdminUserRow {
    id: string
    user_name: string | null
    email: string | null
    phone: string | null
    user_type: string | null
    created_at: string
    user_roles: { role_id: number | null } | null
}

export function toAdminUser(row: AdminUserRow): AdminUser {
    return {
        id: row.id,
        name: row.user_name ?? "",
        email: row.email ?? "",
        phone: row.phone ?? "",
        userType: row.user_type ?? "",
        role: ROLE_OF_ID.get(row.user_roles?.role_id ?? 0) ?? "user",
        createdAt: row.created_at,
    }
}

/**
 * Legacy's search ("by name or email"): users whose name or email contains
 * `text`, ignoring case. `null` for no search.
 */
export function searchTerms(text: string): string | null {
    const trimmed = text.trim()
    if (!trimmed) return null
    const pattern = quoted(containing(trimmed))
    return `user_name.ilike.${pattern},email.ilike.${pattern}`
}

/**
 * The one `or()` filter a page sends: the search, the cursor, or both
 * (PostgREST ANDs repeated `or` parameters too, but one tree leaves no
 * doubt). `null` when there is neither.
 */
export function usersFilter(
    search: string,
    cursor: NewestCursor | null,
): string | null {
    const terms = searchTerms(search)
    const after = cursor && afterNewest(cursor)
    if (terms && after) return `and(or(${terms}),or(${after}))`
    return terms ?? after
}

export const adminUsersKey = (adminId: string, search: string) =>
    [ADMIN_USERS_KIND, adminId, search.trim()] as const

/**
 * A page of users matching `search` (name or email), newest first (by
 * `created_at`, then `id`: keyset pagination; one row more is asked for
 * to tell whether another page follows). Each search is its own query.
 * Refreshed from its first page only (`PAGED_ADMIN_FRESHNESS`); the page
 * removes these queries when it closes.
 */
export function adminUsersQuery(
    services: AppServices,
    adminId: string,
    search: string,
) {
    return infiniteQueryOptions({
        queryKey: adminUsersKey(adminId, search),
        ...PAGED_ADMIN_FRESHNESS,
        initialPageParam: null as NewestCursor | null,
        getNextPageParam: (page: UserPage) => page.next,
        queryFn: async ({ pageParam }): Promise<UserPage> => {
            await sessionOf(services, adminId)
            let query = services.data.from("users").select(ADMIN_USER_COLUMNS)
            const filter = usersFilter(search, pageParam)
            if (filter) query = query.or(filter)
            const { data, error } = await query
                .order("created_at", { ascending: false })
                .order("id", { ascending: false })
                .limit(USERS_PAGE_SIZE + 1)
            if (error) throw new Error(error.message)
            const { rows, next } = keysetPage(
                data as unknown as AdminUserRow[],
                USERS_PAGE_SIZE,
                newestCursorOf,
            )
            return { users: rows.map(toAdminUser), next }
        },
    })
}

/** Legacy's account counts: every account, then each role's. */
export interface UserStats {
    total: number
    byType: Readonly<Record<SignedInRole, number>>
}

/** The roles counted, in legacy's order. */
export const COUNTED_ROLES: readonly SignedInRole[] = [
    "admin",
    "creator",
    "org",
    "profile",
    "user",
]

export const adminUserStatsKey = (adminId: string) =>
    [ADMIN_USER_STATS_KIND, adminId] as const

/**
 * Legacy's counts (all accounts, and by `user_type`) without reading the
 * users: one counting `HEAD` request each, in parallel.
 */
export function adminUserStatsQuery(services: AppServices, adminId: string) {
    return queryOptions({
        queryKey: adminUserStatsKey(adminId),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<UserStats> => {
            await sessionOf(services, adminId)
            const count = async (type: SignedInRole | null) => {
                let query = services.data
                    .from("users")
                    .select("id", { count: "exact", head: true })
                if (type) query = query.eq("user_type", type)
                const { count, error } = await query
                if (error) throw new Error(error.message)
                return count ?? 0
            }
            const [total, ...counts] = await Promise.all([
                count(null),
                ...COUNTED_ROLES.map(count),
            ])
            return {
                total,
                byType: Object.fromEntries(
                    COUNTED_ROLES.map((role, index) => [role, counts[index]]),
                ) as Record<SignedInRole, number>,
            }
        },
    })
}

/** A role assigned (`assign_user_role`'s answer). */
export interface AssignedRole {
    userId: string
    roleId: number
    userType: SignedInRole
}

/** `pages` with the user's role set; the same object if it isn't there. */
export function withRole(
    pages: UserPages,
    { userId, roleId, userType }: AssignedRole,
): UserPages {
    let changed = false
    const next = pages.pages.map((page) => {
        if (!page.users.some((user) => user.id === userId)) return page
        changed = true
        return {
            ...page,
            users: page.users.map((user) =>
                user.id === userId
                    ? {
                          ...user,
                          userType,
                          role: ROLE_OF_ID.get(roleId) ?? userType,
                      }
                    : user,
            ),
        }
    })
    return changed ? { ...pages, pages: next } : pages
}

/** `stats` with one account moved from `from` to `to`. */
export function movedBetween(
    stats: UserStats,
    from: string,
    to: SignedInRole,
): UserStats {
    if (from === to) return stats
    const byType = { ...stats.byType }
    if (Object.hasOwn(byType, from)) byType[from as SignedInRole] -= 1
    byType[to] += 1
    return { ...stats, byType }
}
