import { queryOptions } from "@tanstack/react-query"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { AppServices } from "../../app/services"
import { registerEventList } from "../events/eventCache"
import {
    selectManagedEvents,
    toManagedEvent,
    type ManagedEvent,
} from "../events/managedEvent"

// The event an edit form opens (legacy `useSetSelectedEventByParams`): one
// of the user's own events by id, hidden or not. A personal query: read
// when the form opens (at once from the cached "my events" list, if it has
// the event), forgotten on sign-out. `null`: no such event of theirs.

export const MY_EVENT_KIND = "my-event"

export const myEventKey = (userId: string, eventId: string) =>
    [MY_EVENT_KIND, userId, eventId] as const

// Saves put the event as stored in it; a delete leaves `null`.
registerEventList({
    kind: MY_EVENT_KIND,
    apply: (data, change, [, userId, eventId]) => {
        const saved = change.saved.find((event) => event.id === eventId)
        if (saved) return saved.ownerId === userId ? saved : null
        return change.gone.has(eventId as string) ? null : data
    },
})

export function myEventQuery(
    services: AppServices,
    userId: string,
    eventId: string,
) {
    return queryOptions({
        queryKey: myEventKey(userId, eventId),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<ManagedEvent | null> => {
            await sessionOf(services, userId)
            const { data, error } = await selectManagedEvents(services.data)
                .eq("id", eventId)
                .eq("user_id", userId)
                .maybeSingle()
            if (error) throw new Error(error.message)
            return data ? toManagedEvent(data) : null
        },
    })
}
