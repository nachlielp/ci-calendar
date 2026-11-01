import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sessionOf } from "@ci-calendar/core/app/auth/personal"
import { useServices } from "../../app/services"
import { whereOpen } from "@ci-calendar/core/features/requests/requestRows"
import { useAssignRole } from "../admin-users/roles"
import {
    ApprovalCloseError,
    ApprovalRoleError,
    applyRequestChange,
    expected,
    refreshAdminRequests,
    RequestChangedError,
    requestedRole,
    RoleGivenRequestChangedError,
    writeAction,
    type ActionInput,
} from "@ci-calendar/core/features/admin-requests/adminRequests"

// The request actions' hooks (admin pages are web-only); the queries and
// writes are the core's features/admin-requests/adminRequests.ts.

/**
 * Replies to, closes or reopens a request as the signed-in admin, and puts
 * the stored request in every cached list (`applyRequestChange`): no
 * refetch. A request that changed meanwhile is left alone and the lists
 * are read again; unexpected failures are reported (`request-action`).
 */
export function useRequestAction(adminId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ request, action, responder }: ActionInput) => {
            await sessionOf(services, adminId)
            return writeAction(services, request, action, responder)
        },
        onSuccess: (request) =>
            applyRequestChange(queryClient, adminId, request),
        onError: (error) => {
            if (error instanceof RequestChangedError) {
                refreshAdminRequests(queryClient, adminId)
            }
            if (!expected(error)) {
                services.telemetry.captureError(error, {
                    source: "request-action",
                })
            }
        },
    })
}

/**
 * Approves a role request as legacy did: the role first, then the request
 * closed with legacy's note. First the request is read fresh, still open
 * (else `RequestChangedError`, and nothing is written): its `type` and
 * `user_id` as stored say which role goes to whom, not the list's copy
 * (the user may have edited the type since). The role goes only through
 * `assign_user_role` (`useAssignRole`, which updates the cached users); if
 * it fails, nothing else is written and the request stays open
 * (`ApprovalRoleError`). If closing then finds the request changed, it is
 * left alone (`RoleGivenRequestChangedError`); any other close failure is
 * `ApprovalCloseError` (approving again assigns the same role and closes
 * it).
 */
export function useApproveRequest(adminId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    const { mutateAsync: assign } = useAssignRole(adminId)
    const { mutateAsync: act } = useRequestAction(adminId)
    return useMutation({
        mutationFn: async ({
            request,
            responder,
        }: Omit<ActionInput, "action">) => {
            await sessionOf(services, adminId)
            const { data: stored, error } = await whereOpen(
                services.data
                    .from("requests")
                    .select("type, user_id")
                    .eq("id", request.id),
            ).maybeSingle()
            if (error) throw new Error(error.message)
            if (!stored) {
                refreshAdminRequests(queryClient, adminId)
                throw new RequestChangedError()
            }
            const role = requestedRole(stored.type ?? "")
            if (!role || !stored.user_id) {
                throw new Error(`Can't approve a ${stored.type} request`)
            }
            try {
                await assign({ userId: stored.user_id, userType: role })
            } catch (error) {
                throw new ApprovalRoleError(error)
            }
            try {
                return await act({
                    request,
                    action: { kind: "approve" },
                    responder,
                })
            } catch (error) {
                throw error instanceof RequestChangedError
                    ? new RoleGivenRequestChangedError()
                    : new ApprovalCloseError(error)
            }
        },
        onError: (error) => {
            // The role change and the close report their own failures.
            if (
                !(error instanceof RequestChangedError) &&
                !(error instanceof ApprovalRoleError) &&
                !(error instanceof ApprovalCloseError) &&
                !(error instanceof RoleGivenRequestChangedError)
            ) {
                services.telemetry.captureError(error, {
                    source: "request-action",
                })
            }
        },
    })
}
