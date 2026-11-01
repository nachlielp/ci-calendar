import type { ReactNode } from "react"
import { useCopy } from "../app/language"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"

// The shell of a list read by a query (my events, the admin pages): the
// items once loaded, else loading or failed with a retry; empty; dimmed
// (`pending`, `aria-busy`) while an earlier filter's items stand in; and a
// paginated list's "load more". Each page styles it through `classes`.

/** The query behind the list, as TanStack's results have it. */
export interface ListQuery {
    isError: boolean
    refetch: () => unknown
}

/** A paginated list's "load more", as an infinite query's result has it. */
export interface Paging {
    hasNextPage: boolean
    isFetchingNextPage: boolean
    isFetchNextPageError: boolean
    fetchNextPage: () => unknown
}

/** The class names of the list's parts. */
export interface ListClasses {
    /** The `<ul>` (plus `pending` while `busy`). */
    list: string
    /** The loading line and the failure (unless `failed`). */
    status: string
    /** The failure, with its retry. */
    failed?: string
    /** "Load more" and its failure. */
    more: string
}

export function QueryList<T>({
    label,
    items,
    query,
    paging,
    busy = false,
    empty,
    loadFailed,
    loadMore,
    classes,
    children,
}: {
    /** The list's accessible name. */
    label: string
    /** `undefined` until loaded. */
    items: readonly T[] | undefined
    query: ListQuery
    paging?: Paging
    /** Showing an earlier filter's items until the new ones arrive. */
    busy?: boolean
    /** What shows when there are none. */
    empty: ReactNode
    loadFailed: string
    loadMore: string
    classes: ListClasses
    /** An item's row: a keyed `<li>`. */
    children: (item: T) => ReactNode
}) {
    const common = useCopy(COMMON_COPY)
    return (
        <>
            {items ? (
                items.length > 0 ? (
                    <ul
                        className={`${classes.list} ${busy ? "pending" : ""}`}
                        aria-busy={busy}
                        aria-label={label}
                    >
                        {items.map(children)}
                    </ul>
                ) : (
                    empty
                )
            ) : query.isError ? (
                <div className={classes.failed ?? classes.status} role="alert">
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
                <p className={classes.status} role="status">
                    {common.loading}
                </p>
            )}
            {paging?.hasNextPage && (
                <div className={classes.more}>
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
