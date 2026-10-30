import { queryOptions } from "@tanstack/react-query"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { AppServices } from "../../app/services"
import { jerusalemToday } from "../../lib/jerusalemDate"
import {
    mergeIntoList,
    registerEventList,
    removesFrom,
} from "../events/eventCache"
import {
    selectManagedEvents,
    toManagedEvent,
    toManagedEvents,
    type ManagedEvent,
} from "../events/managedEvent"
import { compareUpcoming } from "../manage-events/myEvents"

// The event an edit form opens (legacy `useSetSelectedEventByParams`): one
// of the user's own events by id, hidden or not; for an admin, anyone's
// (scope "any": legacy's admins edited any event from manage-all-events). A
// personal query: read when the form opens (at once from the cached "my
// events" list, if it has the event), forgotten on sign-out. `null`: no
// such event (of theirs).

export const MY_EVENT_KIND = "my-event"

/** Whose events the edit form may open. */
export type EventScope = "own" | "any"

export const myEventKey = (
    userId: string,
    eventId: string,
    scope: EventScope,
) => [MY_EVENT_KIND, userId, eventId, scope] as const

// Saves put the event as stored in it; a delete leaves `null`.
registerEventList({
    kind: MY_EVENT_KIND,
    apply: (data, change, [, userId, eventId, scope]) => {
        const saved = change.saved.find((event) => event.id === eventId)
        if (saved) {
            return scope === "any" || saved.ownerId === userId ? saved : null
        }
        return change.gone.has(eventId as string) ? null : data
    },
})

/**
 * The event to edit: the user's own (`scope` "own"), or anyone's ("any",
 * admins only: RLS lets them read every event; say so explicitly).
 */
export function myEventQuery(
    services: AppServices,
    userId: string,
    eventId: string,
    scope: EventScope = "own",
) {
    return queryOptions({
        queryKey: myEventKey(userId, eventId, scope),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<ManagedEvent | null> => {
            await sessionOf(services, userId)
            let query = selectManagedEvents(services.data).eq("id", eventId)
            if (scope === "own") query = query.eq("user_id", userId)
            const { data, error } = await query.maybeSingle()
            if (error) throw new Error(error.message)
            return data ? toManagedEvent(data) : null
        },
    })
}

// The owner's events of one recurring series from today on (legacy's
// `getFutureRecurringEventsByRefKey` read the calendar's events): what an
// edit, a hide or a delete of one of them offers to change too. Read by
// `userId` (the key's owner, forgotten on sign-out), for the events of
// `ownerId`: the user's own, or, on admin pages and an admin's edit,
// another's. Personal, read when the edit form of a recurring event (or
// an admin's actions on one) opens; saves keep it current.

export const MY_SERIES_KIND = "my-series"

export const mySeriesKey = (userId: string, refKey: string, ownerId: string) =>
    [MY_SERIES_KIND, userId, refKey, ownerId] as const

registerEventList({
    kind: MY_SERIES_KIND,
    apply: (data, change, [, , refKey, ownerId]) => {
        const events = data as ManagedEvent[]
        const added = change.saved.filter(
            (event) =>
                event.ownerId === ownerId &&
                event.recurringRefKey === refKey &&
                event.startDate >= change.today,
        )
        return added.length === 0 && !removesFrom(events, change)
            ? events
            : mergeIntoList(events, change, added, compareUpcoming)
    },
})

export function mySeriesQuery(
    services: AppServices,
    userId: string,
    refKey: string,
    ownerId: string = userId,
) {
    return queryOptions({
        queryKey: mySeriesKey(userId, refKey, ownerId),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<ManagedEvent[]> => {
            await sessionOf(services, userId)
            const { data, error } = await selectManagedEvents(services.data)
                .eq("user_id", ownerId)
                .eq("recurring_ref_key", refKey)
                .gte("start_date", jerusalemToday(services.now()))
                .order("start_date", { ascending: true })
                .order("id", { ascending: true })
            if (error) throw new Error(error.message)
            return toManagedEvents(data)
        },
    })
}
