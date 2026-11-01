import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useServices } from "../../app/services"
import { applyEventChanges } from "@ci-calendar/core/features/events/eventCache"
import {
    createEvents,
    EventGoneError,
    updateEvent,
    type EventEdit,
    type NewEvents,
} from "@ci-calendar/core/features/event-forms/eventSave"

// The event saves' hooks; the saves themselves are the core's
// features/event-forms/eventSave.ts.

/**
 * New events start hidden where the deployment says so (legacy's
 * `VITE_HIDE_EVENTS_FLAG`); the forms' hide switch starts from it.
 */
export const HIDE_NEW_EVENTS = import.meta.env.VITE_HIDE_EVENTS_FLAG === "true"

/**
 * Creates an event of the user's, or a recurring series of them in one
 * insert (`createEvents`), and puts them in every cached event list.
 */
export function useCreateEvent(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (newEvents: NewEvents) =>
            createEvents(services, userId, newEvents),
        onSuccess: (saved) =>
            applyEventChanges(queryClient, services.now(), { saved }),
        onError: (error) =>
            services.telemetry.captureError(error, { source: "event-save" }),
    })
}

/** Updates an event, and the later ones of its series chosen (`updateEvent`). */
export function useUpdateEvent(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (edit: EventEdit) =>
            updateEvent(services, queryClient, userId, edit),
        onError: (error) => {
            if (!(error instanceof EventGoneError)) {
                services.telemetry.captureError(error, { source: "event-save" })
            }
        },
    })
}
