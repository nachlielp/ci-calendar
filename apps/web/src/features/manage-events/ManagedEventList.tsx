import { useState, type ReactNode } from "react"
import { QueryList, type ListQuery, type Paging } from "../../ui/QueryList"
import type { ManagedEvent } from "@ci-calendar/core/features/events/managedEvent"
import { EventRow } from "./EventRow"

// The list part of the management pages (my events, the admins' list):
// rows that open one at a time, in the `QueryList` shell (loading, empty,
// failed with a retry, "load more"). Styled by `@include event-rows`
// (./_event-rows.scss). Its pages move focus after a delete with
// `useFocusAfterDelete`.

const CLASSES = {
    list: "events-container",
    status: "manage-events-status",
    failed: "card manage-events-status",
    more: "load-more",
}

export function ManagedEventList({
    label,
    events,
    query,
    paging,
    busy = false,
    empty,
    loadFailed,
    loadMore,
    creatorOf,
    actions,
}: {
    /** The list's accessible name. */
    label: string
    /** `undefined` until loaded. */
    events: readonly ManagedEvent[] | undefined
    query: ListQuery
    paging?: Paging
    /** Showing an earlier filter's events until the new ones arrive. */
    busy?: boolean
    /** What shows when there are none. */
    empty: ReactNode
    loadFailed: string
    loadMore: string
    /** The creator's name shown on a row (the admins' list). */
    creatorOf?: (event: ManagedEvent) => string | undefined
    /** An open row's actions; none for rows without. */
    actions?: (event: ManagedEvent) => ReactNode
}) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    return (
        <QueryList
            label={label}
            items={events}
            query={query}
            paging={paging}
            busy={busy}
            empty={empty}
            loadFailed={loadFailed}
            loadMore={loadMore}
            classes={CLASSES}
        >
            {(event) => (
                <EventRow
                    key={event.id}
                    event={event}
                    creator={creatorOf?.(event)}
                    expanded={expandedId === event.id}
                    onToggle={() =>
                        setExpandedId(expandedId === event.id ? null : event.id)
                    }
                >
                    {actions?.(event)}
                </EventRow>
            )}
        </QueryList>
    )
}
