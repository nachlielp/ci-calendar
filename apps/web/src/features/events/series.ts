import { queryOptions } from "@tanstack/react-query"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { AppServices } from "../../app/services"
import { jerusalemToday } from "@ci-calendar/core/lib/jerusalemDate"
import { mergeIntoList, registerEventList, removesFrom } from "./eventCache"
import { compareUpcoming } from "./eventLists"
import {
    selectManagedEvents,
    toManagedEvents,
    type ManagedEvent,
} from "./managedEvent"

// One owner's events of a recurring series from today on (legacy's
// `getFutureRecurringEventsByRefKey` read the calendar's events): what an
// edit, a hide or a delete of one of them offers to change too. Read as
// `viewerId` (the key's first id, so it is forgotten on sign-out) for the
// events of `ownerId`: the viewer's own, or, on admin pages and an admin's
// edit, another's. Personal, read when the edit form of a recurring event
// (or an admin's actions on one) opens; saves keep it current.

export const SERIES_KIND = "series"

export const seriesKey = (viewerId: string, refKey: string, ownerId: string) =>
    [SERIES_KIND, viewerId, refKey, ownerId] as const

registerEventList({
    kind: SERIES_KIND,
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

/** `ownerId`'s events of the series `refKey` from today on, by day. */
export function seriesQuery(
    services: AppServices,
    viewerId: string,
    refKey: string,
    ownerId: string,
) {
    return queryOptions({
        queryKey: seriesKey(viewerId, refKey, ownerId),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<ManagedEvent[]> => {
            await sessionOf(services, viewerId)
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
