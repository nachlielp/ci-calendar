import { type InfiniteData } from "@tanstack/query-core"
import { infiniteQueryOptions, queryOptions } from "../../app/queryOptions"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { CoreServices } from "../../app/services"
import { jerusalemToday } from "../../lib/jerusalemDate"
import { keysetPage } from "../../lib/keyset"
import {
    type EventPage,
    mergeIntoList,
    mergeIntoPages,
    registerEventList,
    removesFrom,
} from "../events/eventCache"
import {
    compareUpcoming,
    comparePast,
    eventCursorOf,
    eventsAfter,
    MY_EVENTS_KIND,
    myPastEventsKey,
    myUpcomingEventsKey,
    type EventCursor,
} from "../events/eventLists"
import {
    selectManagedEvents,
    toManagedEvents,
    type ManagedEvent,
} from "../events/managedEvent"

// The user's own events for `/manage-events` (legacy ManageUserEventsPage):
// personal queries, read only when the page opens (upcoming) or when the
// user asks (past), never at boot, never persisted, forgotten on sign-out.
// Owned means `user_id` is the user, as RLS has it (`owners` only ever held
// the creator; docs/rls.md). Hidden events are included: management is
// where they show.

/** Past events per page ("load more"). */
export const PAST_PAGE_SIZE = 20

export type PastPage = EventPage<ManagedEvent>

// Writes put each event in its owner's lists: upcoming from today on,
// else the loaded past pages where they reach (applyEventChanges).
registerEventList({
    kind: MY_EVENTS_KIND,
    apply: (data, change, [, userId, list]) => {
        const own = change.saved.filter((event) => event.ownerId === userId)
        if (list === "upcoming") {
            const events = data as ManagedEvent[]
            const added = own.filter((event) => event.startDate >= change.today)
            return added.length === 0 && !removesFrom(events, change)
                ? events
                : mergeIntoList(events, change, added, compareUpcoming)
        }
        const pages = data as InfiniteData<PastPage>
        const added = own.filter((event) => event.startDate < change.today)
        return added.length === 0 &&
            !pages.pages.some((page) => removesFrom(page.events, change))
            ? pages
            : mergeIntoPages(pages, change, added, comparePast)
    },
})

/**
 * The user's events from today on (Jerusalem), hidden ones included, in
 * date order. Events whose day has passed since the fetch are dropped on
 * read (they belong to the past list): pass the day from `useToday()` and
 * memoise the options on it.
 */
export function myUpcomingEventsQuery(
    services: CoreServices,
    userId: string,
    today: string = jerusalemToday(services.now()),
) {
    return queryOptions({
        queryKey: myUpcomingEventsKey(userId),
        ...PERSONAL_FRESHNESS,
        select: (events: ManagedEvent[]) =>
            events.filter((event) => event.startDate >= today),
        queryFn: async (): Promise<ManagedEvent[]> => {
            await sessionOf(services, userId)
            const today = jerusalemToday(services.now())
            const { data, error } = await selectManagedEvents(services.data)
                .eq("user_id", userId)
                .gte("start_date", today)
                .order("start_date", { ascending: true })
                .order("id", { ascending: true })
            if (error) throw new Error(error.message)
            return toManagedEvents(data)
        },
    })
}

/**
 * The user's events before today, newest first, a page at a time
 * (`PAST_PAGE_SIZE`; one row more is asked for, to tell whether another
 * page follows). Fetched once the user asks for past events, then kept as
 * is while the page stays open (past events rarely change, and the user's
 * own writes update it): no refetch on focus, reconnect or remount, which
 * would fetch every loaded page again in turn. The page removes it when
 * it closes, so the next visit starts again from the first page.
 */
export function myPastEventsQuery(services: CoreServices, userId: string) {
    return infiniteQueryOptions({
        queryKey: myPastEventsKey(userId),
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        initialPageParam: null as EventCursor | null,
        getNextPageParam: (page: PastPage) => page.next,
        queryFn: async ({ pageParam }): Promise<PastPage> => {
            await sessionOf(services, userId)
            const today = jerusalemToday(services.now())
            let query = selectManagedEvents(services.data)
                .eq("user_id", userId)
                .lt("start_date", today)
            if (pageParam) {
                query = query.or(eventsAfter(pageParam, "descending"))
            }
            const { data, error } = await query
                .order("start_date", { ascending: false })
                .order("id", { ascending: false })
                .limit(PAST_PAGE_SIZE + 1)
            if (error) throw new Error(error.message)
            const { rows, next } = keysetPage(
                data,
                PAST_PAGE_SIZE,
                eventCursorOf,
            )
            return { events: toManagedEvents(rows), next }
        },
    })
}
