import {
    useMutation,
    useQueryClient,
    type QueryClient,
} from "@tanstack/react-query"
import { useServices, type AppServices } from "../../app/services"
import {
    deleteEvents,
    setCancelled,
    setHidden,
    type CancelChange,
    type EventWriteOptions,
    type HideChange,
} from "@ci-calendar/core/features/events/eventWrites"
import type { ManagedEvent } from "@ci-calendar/core/features/events/managedEvent"

// The event writes' hooks (the writes themselves: the core's
// features/events/eventWrites.ts). A failure is reported under `source`.

function useEventWrite<Variables, Result>(
    source: string,
    write: (
        services: AppServices,
        queryClient: QueryClient,
        variables: Variables,
    ) => Promise<Result>,
) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (variables: Variables) =>
            write(services, queryClient, variables),
        onError: (error) => services.telemetry.captureError(error, { source }),
    })
}

/** Hides or shows events (legacy's series choice included). */
export const useSetHidden = (userId: string, options: EventWriteOptions = {}) =>
    useEventWrite("event-hide", (services, queryClient, change: HideChange) =>
        setHidden(services, queryClient, userId, change, options),
    )

/** Cancels an event with a note, or un-cancels it. */
export const useSetCancelled = (
    userId: string,
    options: EventWriteOptions = {},
) =>
    useEventWrite(
        "event-cancel",
        (services, queryClient, change: CancelChange) =>
            setCancelled(services, queryClient, userId, change, options),
    )

/** Deletes events (legacy's series choice included). */
export const useDeleteEvents = (
    userId: string,
    options: EventWriteOptions = {},
) =>
    useEventWrite(
        "event-delete",
        (services, queryClient, events: readonly ManagedEvent[]) =>
            deleteEvents(services, queryClient, userId, events, options),
    )
