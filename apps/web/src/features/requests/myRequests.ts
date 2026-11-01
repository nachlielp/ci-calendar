import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServices } from "../../app/services"
import {
    cacheRequest,
    cancelRequest,
    createRequest,
    editRequest,
    onWriteError,
    savePhoneIfMissing,
    type NewRequest,
    type RequestEdit,
} from "@ci-calendar/core/features/requests/myRequests"

// The request writes' hooks; the writes are the core's
// features/requests/myRequests.ts.

/** Sends a new role request (`createRequest`). */
export function useCreateRequest(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (request: NewRequest) =>
            createRequest(services, queryClient, userId, request),
        onSuccess: (request, { phone }) => {
            cacheRequest(queryClient, services, userId, request)
            savePhoneIfMissing(services, userId, phone)
        },
        onError: (error) => onWriteError(queryClient, services, userId, error),
    })
}

/** Edits the user's open request (`editRequest`). */
export function useEditRequest(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (edit: { id: string; patch: RequestEdit }) =>
            editRequest(services, userId, edit),
        onSuccess: (request) =>
            cacheRequest(queryClient, services, userId, request),
        onError: (error) => onWriteError(queryClient, services, userId, error),
    })
}

/** Cancels the user's open request (`cancelRequest`). */
export function useCancelRequest(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (cancel: { id: string; name: string }) =>
            cancelRequest(services, userId, cancel),
        onSuccess: (request) =>
            cacheRequest(queryClient, services, userId, request),
        onError: (error) => onWriteError(queryClient, services, userId, error),
    })
}
