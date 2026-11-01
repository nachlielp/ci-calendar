import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sessionOf } from "@ci-calendar/core/app/auth/personal"
import { useServices } from "../../app/services"
import type { SignedInRole } from "@ci-calendar/core/app/auth/roles"
import {
    applyRoleChange,
    assignUserRole,
} from "@ci-calendar/core/features/admin-users/roles"

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
