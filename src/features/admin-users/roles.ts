import {
    useMutation,
    useQueryClient,
    type QueryClient,
} from "@tanstack/react-query"
import { PROFILE_KIND } from "../../app/auth/profile"
import { sessionOf } from "../../app/auth/personal"
import { useServices } from "../../app/services"
import type { SignedInRole } from "../../app/viewer"
import type { DataClient } from "../../data/client"
import { refreshFirstPage } from "../admin/adminLists"
import { applyBioChange, refreshEventQueries } from "../events/eventCache"
import {
    ADMIN_USERS_KIND,
    adminUserStatsKey,
    movedBetween,
    ROLE_IDS,
    withRole,
    type AssignedRole,
    type UserPages,
    type UserStats,
} from "./users"

// Role changes (legacy userRoleService + store.updateUserRole): one atomic,
// admin-gated `assign_user_role` RPC (supabase/migrations/
// 20260808000000_assign_user_role.sql; docs/rls.md) writes `user_roles`,
// `users.user_type` and `public_bio.user_type` together. The client never
// writes those tables itself. The answer updates the cached users, with no
// list refetch. Slice 19's request approvals use `useAssignRole` too.

const ROLES = Object.keys(ROLE_IDS)

function isAssignedRole(value: unknown): value is {
    user_id: string
    role_id: number
    user_type: SignedInRole
} {
    const answer = value as Record<string, unknown> | null
    return (
        typeof answer?.user_id === "string" &&
        typeof answer.role_id === "number" &&
        ROLES.includes(answer.user_type as string)
    )
}

/**
 * Gives `userId` the role `userType` through `assign_user_role`, the only
 * write path, and returns the role as the database assigned it. A failure
 * is wrapped as legacy's `wrapServiceError` did: "Failed to update user
 * role ERROR: <the server's message>".
 */
export async function assignUserRole(
    data: DataClient,
    userId: string,
    userType: SignedInRole,
): Promise<AssignedRole> {
    const roleId = ROLE_IDS[userType]
    const { data: answer, error } = await data.rpc("assign_user_role", {
        p_user_id: userId,
        p_role_id: roleId,
        p_user_type: userType,
    })
    if (error) {
        throw new Error(`Failed to update user role ERROR: ${error.message}`)
    }
    // The function returns what it assigned; an unexpected answer still
    // means it committed what was sent.
    return isAssignedRole(answer)
        ? {
              userId: answer.user_id,
              roleId: answer.role_id,
              userType: answer.user_type,
          }
        : { userId, roleId, userType }
}

/** The user's `user_type` in the cached users lists, if any holds them. */
function cachedType(
    queryClient: QueryClient,
    adminId: string,
    userId: string,
): string | undefined {
    for (const [, pages] of queryClient.getQueriesData<UserPages>({
        queryKey: [ADMIN_USERS_KIND, adminId],
    })) {
        for (const page of pages?.pages ?? []) {
            const user = page.users.find((user) => user.id === userId)
            if (user) return user.userType
        }
    }
    return undefined
}

/**
 * Puts an assigned role in the cache: the user's row in every cached users
 * list (any search), the counts, the admin's own profile if they changed
 * their own role, and the user's bio in cached events where its public
 * face may have changed (admins' bios are never public). As
 * `applyEventChanges`: in place, fetch times kept, and a fetch in flight
 * (sent before the role changed, so its answer may hold the old one) is
 * redone: a users list from its first page.
 */
export function applyRoleChange(
    queryClient: QueryClient,
    adminId: string,
    assigned: AssignedRole,
) {
    const before = cachedType(queryClient, adminId, assigned.userId)
    const cache = queryClient.getQueryCache()
    for (const query of cache.findAll({
        queryKey: [ADMIN_USERS_KIND, adminId],
    })) {
        const pages = query.state.data as UserPages | undefined
        const next = pages && withRole(pages, assigned)
        if (next !== pages) {
            queryClient.setQueryData(query.queryKey, next, {
                updatedAt: query.state.dataUpdatedAt,
            })
        }
        if (query.state.fetchStatus === "fetching") {
            void refreshFirstPage(queryClient, query.queryKey)
        }
    }
    const stats = cache.find<UserStats>({
        queryKey: adminUserStatsKey(adminId),
        exact: true,
    })
    if (stats && before === undefined) {
        // Which count the user left isn't known: count again.
        void queryClient.invalidateQueries({ queryKey: stats.queryKey })
    } else if (stats) {
        if (stats.state.data) {
            queryClient.setQueryData(
                stats.queryKey,
                movedBetween(stats.state.data, before!, assigned.userType),
                { updatedAt: stats.state.dataUpdatedAt },
            )
        }
        if (stats.state.fetchStatus === "fetching") {
            stats.fetch(undefined, { cancelRefetch: true }).catch(() => {
                // Its observers show the failure.
            })
        }
    }
    if (assigned.userId === adminId) {
        void queryClient.invalidateQueries({
            queryKey: [PROFILE_KIND, adminId],
        })
    }
    if (assigned.userType === "admin") {
        if (before !== "admin")
            applyBioChange(queryClient, assigned.userId, null)
    } else if (
        before === undefined ||
        before === "admin" ||
        !ROLES.includes(before)
    ) {
        // Their bio may be public now; events embed it only once refetched.
        refreshEventQueries(queryClient)
    }
}

/**
 * Changes a user's role as the signed-in admin (`adminId`): waits for
 * their session, calls `assign_user_role` once and applies the answer. A
 * failure is reported (`assign-role`); the caller shows it (`isError`).
 */
export function useAssignRole(adminId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            userId,
            userType,
        }: {
            userId: string
            userType: SignedInRole
        }) => {
            await sessionOf(services, adminId)
            return assignUserRole(services.data, userId, userType)
        },
        onSuccess: (assigned) =>
            applyRoleChange(queryClient, adminId, assigned),
        onError: (error) =>
            services.telemetry.captureError(error, { source: "assign-role" }),
    })
}
