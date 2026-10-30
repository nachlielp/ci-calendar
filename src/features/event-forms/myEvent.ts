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

// The user's events of one recurring series from today on (legacy's
// `getFutureRecurringEventsByRefKey` read the calendar's events): what an
// edit of one of them offers to change too. Personal, read when the edit
// form of a recurring event opens; saves keep it current.

export const MY_SERIES_KIND = "my-series"

export const mySeriesKey = (userId: string, refKey: string) =>
    [MY_SERIES_KIND, userId, refKey] as const

registerEventList({
    kind: MY_SERIES_KIND,
    apply: (data, change, [, userId, refKey]) => {
        const events = data as ManagedEvent[]
        const added = change.saved.filter(
            (event) =>
                event.ownerId === userId &&
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
) {
    return queryOptions({
        queryKey: mySeriesKey(userId, refKey),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<ManagedEvent[]> => {
            await sessionOf(services, userId)
            const { data, error } = await selectManagedEvents(services.data)
                .eq("user_id", userId)
                .eq("recurring_ref_key", refKey)
                .gte("start_date", jerusalemToday(services.now()))
                .order("start_date", { ascending: true })
                .order("id", { ascending: true })
            if (error) throw new Error(error.message)
            return toManagedEvents(data)
        },
    })
}
