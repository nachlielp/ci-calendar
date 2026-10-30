import {
    infiniteQueryOptions,
    queryOptions,
    type InfiniteData,
} from "@tanstack/react-query"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { AppServices } from "../../app/services"
import { jerusalemToday } from "../../lib/jerusalemDate"
import {
    type EventPage,
    mergeIntoList,
    mergeIntoPages,
    registerEventList,
    removesFrom,
} from "../events/eventCache"
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

/** First element of the user's events query keys. */
export const MY_EVENTS_KIND = "my-events"

/** Past events per page ("load more"). */
export const PAST_PAGE_SIZE = 20

export const myUpcomingEventsKey = (userId: string) =>
    [MY_EVENTS_KIND, userId, "upcoming"] as const

export const myPastEventsKey = (userId: string) =>
    [MY_EVENTS_KIND, userId, "past"] as const

/**
 * Where the next page of past events starts: after this event in the past
 * list's order (newest day first, then id descending), so a page boundary
 * never skips or repeats an event of the same day (keyset pagination).
 */
export interface PastCursor {
    startDate: string
    id: string
}

export interface PastPage extends EventPage<ManagedEvent> {
    next: PastCursor | null
}

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

/** The upcoming list's order: by day, then id (as the query orders). */
export function compareUpcoming(a: ManagedEvent, b: ManagedEvent): number {
    if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** The past list's order: newest day first, then id descending. */
export const comparePast = (a: ManagedEvent, b: ManagedEvent) =>
    compareUpcoming(b, a)

/**
 * The user's events from today on (Jerusalem), hidden ones included, in
 * date order. Events whose day has passed since the fetch are dropped on
 * read (they belong to the past list): pass the day from `useToday()` and
 * memoise the options on it.
 */
export function myUpcomingEventsQuery(
    services: AppServices,
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

/** PostgREST's filter for "after `cursor`" in the past list's order. */
export const afterCursor = ({ startDate, id }: PastCursor) =>
    `start_date.lt.${startDate},and(start_date.eq.${startDate},id.lt.${id})`

/**
 * The user's events before today, newest first, a page at a time
 * (`PAST_PAGE_SIZE`; one row more is asked for, to tell whether another
 * page follows). Fetched once the user asks for past events, then kept as
 * is while the page stays open (past events rarely change, and the user's
 * own writes update it): no refetch on focus, reconnect or remount, which
 * would fetch every loaded page again in turn. The page removes it when
 * it closes, so the next visit starts again from the first page.
 */
export function myPastEventsQuery(services: AppServices, userId: string) {
    return infiniteQueryOptions({
        queryKey: myPastEventsKey(userId),
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        initialPageParam: null as PastCursor | null,
        getNextPageParam: (page: PastPage) => page.next,
        queryFn: async ({ pageParam }): Promise<PastPage> => {
            await sessionOf(services, userId)
            const today = jerusalemToday(services.now())
            let query = selectManagedEvents(services.data)
                .eq("user_id", userId)
                .lt("start_date", today)
            if (pageParam) query = query.or(afterCursor(pageParam))
            const { data, error } = await query
                .order("start_date", { ascending: false })
                .order("id", { ascending: false })
                .limit(PAST_PAGE_SIZE + 1)
            if (error) throw new Error(error.message)
            const rows = data.slice(0, PAST_PAGE_SIZE)
            const last = rows.at(-1)
            return {
                events: toManagedEvents(rows),
                next:
                    data.length > PAST_PAGE_SIZE && last?.start_date
                        ? { startDate: last.start_date, id: last.id }
                        : null,
            }
        },
    })
}

/**
 * The later events of `event`'s recurring series among `events` (legacy
 * `getFutureRecurringEventsByRefKey`: same `recurring_ref_key`, a later
 * day), in date order: what "this one or the following ones too" offers.
 */
export function laterInSeries(
    events: readonly ManagedEvent[],
    event: ManagedEvent,
): ManagedEvent[] {
    if (!event.recurringRefKey) return []
    return events
        .filter(
            (other) =>
                other.recurringRefKey === event.recurringRefKey &&
                other.startDate > event.startDate,
        )
        .sort(compareUpcoming)
}
