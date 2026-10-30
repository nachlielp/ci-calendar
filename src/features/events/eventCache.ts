import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query"
import { jerusalemToday } from "../../lib/jerusalemDate"
import { LINKED_EVENT_KIND } from "../calendar/linkedEvent"
import type { PublicEvent } from "../calendar/publicEvent"
import { PUBLIC_WINDOW_KIND, type PublicWindow } from "../calendar/publicWindow"
import { toPublicOnly, type ManagedEvent } from "./managedEvent"

// The one place that turns a saved or deleted event into updates of every
// cached query holding events, from the server's response, with no list
// refetch. The calendar window and shared-link lookups are built in; every
// other list of events registers itself (`registerEventList`) in the module
// that defines its query, so it is known before any of its queries can be
// cached. Every event write calls `applyEventChanges`: the manage-events
// actions, the create/edit forms, admin pages.

/** What a write did, as the server answered it. */
export type EventChange =
    /** Created or updated events, as `MANAGED_EVENT_COLUMNS` returned them. */
    | { saved: readonly ManagedEvent[] }
    /** The ids of deleted events. */
    | { deleted: readonly string[] }

/** A change as a list applies it. */
export interface AppliedChange {
    /** Saved events, to put where they belong now. */
    saved: readonly ManagedEvent[]
    /** Ids to take out first: deleted, and saved (they are put back). */
    gone: ReadonlySet<string>
    /** Jerusalem day of the write, `YYYY-MM-DD`. */
    today: string
}

/**
 * A kind of cached query holding events: `apply` returns its data with the
 * change in it (the same object when nothing changed). Only queries with
 * data are passed; `queryKey` is the query's whole key.
 */
export interface EventList {
    /** The first element of its query keys. */
    kind: string
    apply(data: unknown, change: AppliedChange, queryKey: QueryKey): unknown
}

const lists = new Map<string, EventList>()

/** Adds (or replaces) the list of `list.kind`. */
export function registerEventList(list: EventList) {
    lists.set(list.kind, list)
}

/**
 * Puts `change` into every cached query of every event list. Queries not
 * in the cache stay out (never created here); a query changes only if the
 * change concerns it, and keeps its fetch time, so a write doesn't postpone
 * its next revalidation. A query whose refetch is in flight is refetched
 * anew after the update (the request in flight, maybe sent before the
 * write, is dropped), so an older answer can't bring back what was just
 * deleted or hidden, nor persist it.
 */
export function applyEventChanges(
    queryClient: QueryClient,
    now: Date,
    change: EventChange,
) {
    const saved = "saved" in change ? change.saved : []
    const applied: AppliedChange = {
        saved,
        gone: new Set(
            "deleted" in change
                ? change.deleted
                : saved.map((event) => event.id),
        ),
        today: jerusalemToday(now),
    }
    for (const list of lists.values()) {
        for (const query of queryClient
            .getQueryCache()
            .findAll({ queryKey: [list.kind] })) {
            const data = query.state.data
            if (data === undefined) continue
            const next = list.apply(data, applied, query.queryKey)
            if (next === data) continue
            queryClient.setQueryData(query.queryKey, next, {
                updatedAt: query.state.dataUpdatedAt,
            })
            // Fetched directly: refetchQueries skips a query whose only
            // observers are disabled (the header's stale sign reads the
            // window with `enabled: false`).
            if (query.state.fetchStatus === "fetching") {
                query.fetch(undefined, { cancelRefetch: true }).catch(() => {
                    // Its observers show the failure; nothing to add here.
                })
            }
        }
    }
}

/**
 * Refetches every event query (all registered lists): for when a write
 * didn't come back as asked (some events were deleted or changed elsewhere
 * meanwhile), so its response can't say where they stand. Queries on
 * screen refetch now, the others when next shown.
 */
export function refreshEventQueries(queryClient: QueryClient) {
    for (const kind of lists.keys()) {
        void queryClient.invalidateQueries({ queryKey: [kind] })
    }
}

/**
 * `events` without `change.gone`, with `added` (the saved events that
 * belong in this list) put in `compare` order, after equals: a list
 * holding one page of events.
 */
export function mergeIntoList<T extends { id: string }>(
    events: readonly T[],
    change: AppliedChange,
    added: readonly T[],
    compare: (a: T, b: T) => number,
): T[] {
    const result = events.filter((event) => !change.gone.has(event.id))
    for (const event of added) {
        const at = result.findIndex((other) => compare(event, other) < 0)
        result.splice(at === -1 ? result.length : at, 0, event)
    }
    return result
}

/** A page of a keyset-paginated list (see "Pagination" in the docs). */
export interface EventPage<T> {
    events: T[]
    /** The next page's cursor; `null` on the last page. */
    next: unknown
}

/**
 * Loaded pages without `change.gone`, with each of `added` put on the page
 * it belongs to in `compare` order, if the pages loaded so far reach it.
 * One after every loaded event, while more pages follow, is left for its
 * own page to bring (putting it in now would show it twice once that page
 * loads).
 */
export function mergeIntoPages<T extends { id: string }>(
    data: InfiniteData<EventPage<T>>,
    change: AppliedChange,
    added: readonly T[],
    compare: (a: T, b: T) => number,
): InfiniteData<EventPage<T>> {
    const pages = data.pages.map((page) => ({
        ...page,
        events: page.events.filter((event) => !change.gone.has(event.id)),
    }))
    for (const event of added) {
        const index = pages.findIndex((page, i) => {
            const last = page.events.at(-1)
            return (
                (last && compare(event, last) < 0) ||
                (i === pages.length - 1 && page.next === null)
            )
        })
        if (index === -1) continue
        pages[index] = {
            ...pages[index],
            events: mergeIntoList(
                pages[index].events,
                change,
                [event],
                compare,
            ),
        }
    }
    return { ...data, pages }
}

/**
 * Whether `change` takes any of `events` out: with nothing to add either,
 * a list keeps its data object (and isn't written or refetched).
 */
export const removesFrom = (
    events: readonly { id: string }[],
    change: AppliedChange,
) => events.some((event) => change.gone.has(event.id))

const byStartDate = (a: PublicEvent, b: PublicEvent) =>
    a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0

// The calendar: visible events on the days it was fetched for (still to
// come), hidden or deleted ones out. Persisted (app/persistedCache.ts), so
// only the public part goes in.
registerEventList({
    kind: PUBLIC_WINDOW_KIND,
    apply: (data, change) => {
        const window = data as PublicWindow
        const added = change.saved
            .filter(
                (event) =>
                    !event.hidden &&
                    event.startDate >= change.today &&
                    event.startDate >= window.from &&
                    event.startDate <= window.to,
            )
            .map(toPublicOnly)
        if (added.length === 0 && !removesFrom(window.events, change)) {
            return window
        }
        return {
            ...window,
            events: mergeIntoList(window.events, change, added, byStartDate),
        }
    },
})

// Shared links: the event they name, or `null` once it is hidden or
// deleted (the page then shows the 404, as for any link to it).
registerEventList({
    kind: LINKED_EVENT_KIND,
    apply: (data, change, [, link]) => {
        const current = data as PublicEvent | null
        const named = change.saved.find(
            (event) => event.id === link || event.shortId === link,
        )
        if (named) return named.hidden ? null : toPublicOnly(named)
        if (current && change.saved.length === 0 && change.gone.has(current.id))
            return null
        return current
    },
})
