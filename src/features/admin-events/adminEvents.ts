import {
    infiniteQueryOptions,
    queryOptions,
    type InfiniteData,
} from "@tanstack/react-query"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { AppServices } from "../../app/services"
import { jerusalemToday } from "../../lib/jerusalemDate"
import { keysetPage } from "../../lib/keyset"
import { containing, PAGED_ADMIN_FRESHNESS } from "../admin/adminLists"
import {
    mergeIntoPages,
    registerEventList,
    removesFrom,
    type EventPage,
} from "../events/eventCache"
import {
    compareUpcoming,
    eventCursorOf,
    eventsAfter,
    type EventCursor,
} from "../events/eventLists"
import {
    selectManagedEvents,
    toManagedEvents,
    type ManagedEvent,
} from "../events/managedEvent"

// Every event, for `/manage-all-events` (legacy ManageAllEventsPage,
// ManageEventsList and the store's `app_ci_events`/`app_creators`): admin
// data, read only when the page opens, never at boot, never persisted,
// forgotten on sign-out (its kinds aren't in `PUBLIC_QUERY_KINDS`). Legacy
// listed the calendar's upcoming events (and the admin's own), filtered by
// creator and title in the browser; here they are every creator's events
// from today on, hidden ones included (legacy's list dropped them, though
// its rows had a "hidden" mark), a page at a time, filtered on the server.

/** First element of the events list's query keys. */
export const ADMIN_EVENTS_KIND = "admin-events"

/** First element of the creators list's query key. */
export const ADMIN_EVENT_CREATORS_KIND = "admin-event-creators"

/** Events per page ("load more"). */
export const ADMIN_EVENTS_PAGE_SIZE = 30

export type AdminEventPage = EventPage<ManagedEvent>

export type AdminEventPages = InfiniteData<AdminEventPage, EventCursor | null>

/**
 * The list's key: the creators chosen (sorted, so a choice is one query
 * whatever the order of picking) and the title search, trimmed.
 */
export const adminEventsKey = (
    adminId: string,
    creators: readonly string[],
    search: string,
) => [ADMIN_EVENTS_KIND, adminId, [...creators].sort(), search.trim()] as const

/**
 * Whether `event` belongs in the list of `creators` (none: everyone's) and
 * `search` (the title contains it, ignoring case, as `ilike` does) on
 * `today`: what a write's answer is checked against.
 */
export function belongsInList(
    event: ManagedEvent,
    creators: readonly string[],
    search: string,
    today: string,
): boolean {
    const text = search.trim().toLocaleLowerCase()
    return (
        event.startDate >= today &&
        (creators.length === 0 || creators.includes(event.ownerId)) &&
        (!text || event.title.toLocaleLowerCase().includes(text))
    )
}

/** `data` without events whose day has passed (the same object if none). */
export function withoutPassed(
    data: AdminEventPages,
    today: string,
): AdminEventPages {
    const passed = (event: ManagedEvent) => event.startDate < today
    if (!data.pages.some((page) => page.events.some(passed))) return data
    return {
        ...data,
        pages: data.pages.map((page) => ({
            ...page,
            events: page.events.filter((event) => !passed(event)),
        })),
    }
}

// Every event write (here, my events, the forms) puts the saved events in
// each cached list whose filters they match, in order, on the loaded page
// whose range holds them (`mergeIntoPages`, by the pages' cursors), and
// takes out deleted ones and those that no longer match.
registerEventList({
    kind: ADMIN_EVENTS_KIND,
    apply: (data, change, [, , creators, search]) => {
        const pages = data as AdminEventPages
        const added = change.saved.filter((event) =>
            belongsInList(
                event,
                creators as string[],
                search as string,
                change.today,
            ),
        )
        return added.length === 0 &&
            !pages.pages.some((page) => removesFrom(page.events, change))
            ? pages
            : mergeIntoPages(pages, change, added, compareUpcoming)
    },
})

/**
 * Events from today on (Jerusalem), hidden ones included, of the chosen
 * `creators` (none: everyone's) whose title contains `search`, in date
 * order, a page at a time (keyset on `start_date`, `id`; one row more is
 * asked for to tell whether another page follows). Each filter is its own
 * query. Refreshed from its first page only (`PAGED_ADMIN_FRESHNESS`);
 * the page removes these queries when it closes. Events whose day passes
 * while it is open drop out on read: pass the day from `useToday()` and
 * memoise the options on it.
 */
export function adminEventsQuery(
    services: AppServices,
    adminId: string,
    creators: readonly string[],
    search: string,
    today: string = jerusalemToday(services.now()),
) {
    const key = adminEventsKey(adminId, creators, search)
    const [, , chosen, text] = key
    return infiniteQueryOptions({
        queryKey: key,
        ...PAGED_ADMIN_FRESHNESS,
        initialPageParam: null as EventCursor | null,
        getNextPageParam: (page: AdminEventPage) => page.next,
        select: (data: AdminEventPages) => withoutPassed(data, today),
        queryFn: async ({ pageParam }): Promise<AdminEventPage> => {
            await sessionOf(services, adminId)
            let query = selectManagedEvents(services.data).gte(
                "start_date",
                jerusalemToday(services.now()),
            )
            if (chosen.length > 0) query = query.in("user_id", chosen)
            if (text) query = query.ilike("title", containing(text))
            if (pageParam) {
                query = query.or(eventsAfter(pageParam, "ascending"))
            }
            const { data, error } = await query
                .order("start_date", { ascending: true })
                .order("id", { ascending: true })
                .limit(ADMIN_EVENTS_PAGE_SIZE + 1)
            if (error) throw new Error(error.message)
            const { rows, next } = keysetPage(
                data,
                ADMIN_EVENTS_PAGE_SIZE,
                eventCursorOf,
            )
            return { events: toManagedEvents(rows), next }
        },
    })
}

/** Someone with events from today on: the creator filter's options. */
export interface Creator {
    id: string
    name: string
}

/** What the creators list reads: each upcoming event's owner and name. */
export const CREATOR_COLUMNS = "user_id, users(user_name)"

interface CreatorRow {
    user_id: string | null
    users: { user_name: string | null } | null
}

/**
 * Each owner once, by name (legacy `getCIEventsCreators`, which also left
 * out events without a `users` row); a nameless one by id.
 */
export function toCreators(rows: readonly CreatorRow[]): Creator[] {
    const names = new Map<string, string>()
    for (const { user_id, users } of rows) {
        if (!user_id || !users || names.has(user_id)) continue
        names.set(user_id, users.user_name || user_id)
    }
    return [...names]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, "he"))
}

export const adminEventCreatorsKey = (adminId: string) =>
    [ADMIN_EVENT_CREATORS_KIND, adminId] as const

/**
 * The creators of events from today on, hidden ones included (legacy's
 * list, read at boot then; here when the page opens): only the owner and
 * their name of each such event, deduplicated here, as legacy did.
 */
export function adminEventCreatorsQuery(
    services: AppServices,
    adminId: string,
) {
    return queryOptions({
        queryKey: adminEventCreatorsKey(adminId),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<Creator[]> => {
            await sessionOf(services, adminId)
            const { data, error } = await services.data
                .from("ci_events")
                .select(CREATOR_COLUMNS)
                .gte("start_date", jerusalemToday(services.now()))
            if (error) throw new Error(error.message)
            return toCreators(data)
        },
    })
}
