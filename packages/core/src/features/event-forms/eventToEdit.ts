import { queryOptions } from "../../app/queryOptions"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { CoreServices } from "../../app/services"
import { registerEventList } from "../events/eventCache"
import {
    selectManagedEvents,
    toManagedEvent,
    type ManagedEvent,
} from "../events/managedEvent"

// The event an edit form opens (legacy `useSetSelectedEventByParams`): one
// of the viewer's own events by id, hidden or not; for an admin, anyone's
// (scope "any": legacy's admins edited any event from manage-all-events). A
// personal query, keyed on the viewer: read when the form opens (at once
// from the cached "my events" list, if it has the event), forgotten on
// sign-out. `null`: no such event (of theirs).

export const EVENT_TO_EDIT_KIND = "event-to-edit"

/** Whose events the edit form may open. */
export type EventScope = "own" | "any"

export const eventToEditKey = (
    viewerId: string,
    eventId: string,
    scope: EventScope,
) => [EVENT_TO_EDIT_KIND, viewerId, eventId, scope] as const

// Saves put the event as stored in it; a delete leaves `null`.
registerEventList({
    kind: EVENT_TO_EDIT_KIND,
    apply: (data, change, [, viewerId, eventId, scope]) => {
        const saved = change.saved.find((event) => event.id === eventId)
        if (saved) {
            return scope === "any" || saved.ownerId === viewerId ? saved : null
        }
        return change.gone.has(eventId as string) ? null : data
    },
})

/**
 * The event to edit, read as `viewerId`: their own (`scope` "own"), or
 * anyone's ("any", admins only: RLS lets them read every event; say so
 * explicitly).
 */
export function eventToEditQuery(
    services: CoreServices,
    viewerId: string,
    eventId: string,
    scope: EventScope,
) {
    return queryOptions({
        queryKey: eventToEditKey(viewerId, eventId, scope),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<ManagedEvent | null> => {
            await sessionOf(services, viewerId)
            let query = selectManagedEvents(services.data).eq("id", eventId)
            if (scope === "own") query = query.eq("user_id", viewerId)
            const { data, error } = await query.maybeSingle()
            if (error) throw new Error(error.message)
            return data ? toManagedEvent(data) : null
        },
    })
}
