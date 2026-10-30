import { useState, type ReactNode } from "react"
import { useCopy } from "../../app/language"
import { COMMON_COPY } from "../../lib/commonCopy"
import type { ManagedEvent } from "../events/managedEvent"
import { EventRow } from "./EventRow"

// The list part of the management pages (my events, the admins' list):
// rows that open one at a time, loading, empty, failed (with a retry) and
// "load more". Styled by `@include event-rows` (./_event-rows.scss). Its
// pages move focus after a delete with `useFocusAfterDelete`.

/** The query behind the list, as TanStack's results have it. */
interface ListQuery {
    isError: boolean
    refetch: () => unknown
}

/** A paginated list's "load more", as an infinite query's result has it. */
interface Paging {
    hasNextPage: boolean
    isFetchingNextPage: boolean
    isFetchNextPageError: boolean
    fetchNextPage: () => unknown
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
    const common = useCopy(COMMON_COPY)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    return (
        <>
            {events ? (
                events.length > 0 ? (
                    <ul
                        className={`events-container ${busy ? "pending" : ""}`}
                        aria-busy={busy}
                        aria-label={label}
                    >
                        {events.map((event) => (
                            <EventRow
                                key={event.id}
                                event={event}
                                creator={creatorOf?.(event)}
                                expanded={expandedId === event.id}
                                onToggle={() =>
                                    setExpandedId(
                                        expandedId === event.id
                                            ? null
                                            : event.id,
                                    )
                                }
                            >
                                {actions?.(event)}
                            </EventRow>
                        ))}
                    </ul>
                ) : (
                    empty
                )
            ) : query.isError ? (
                <div className="card manage-events-status" role="alert">
                    <p>{loadFailed}</p>
                    <button
                        type="button"
                        className="text-button"
                        onClick={() => void query.refetch()}
                    >
                        {common.retry}
                    </button>
                </div>
            ) : (
                <p className="manage-events-status" role="status">
                    {common.loading}
                </p>
            )}
            {paging?.hasNextPage && (
                <div className="load-more">
                    {paging.isFetchNextPageError && (
                        <p role="alert">{loadFailed}</p>
                    )}
                    <button
                        type="button"
                        className="text-button"
                        disabled={paging.isFetchingNextPage}
                        onClick={() => void paging.fetchNextPage()}
                    >
                        {paging.isFetchingNextPage ? common.loading : loadMore}
                    </button>
                </div>
            )}
        </>
    )
}
