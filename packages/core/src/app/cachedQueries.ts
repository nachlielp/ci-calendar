import type {
    InfiniteData,
    Query,
    QueryClient,
    QueryKey,
} from "@tanstack/query-core"

// The one engine for writes' cache updates (docs/architecture.md, "Server
// state" and "Pagination"): a write puts the server's answer into every
// cached query it concerns, never refetching lists; the event lists
// (features/events/eventCache.ts), the admin lists and the role counts all
// go through it. A paginated (infinite) query is never refetched page by
// page, which TanStack would do for every loaded page in turn: it is
// refreshed from its first page only (`refreshFirstPage`).

/** An infinite query's data. */
const isPaged = (data: unknown): data is InfiniteData<unknown> =>
    typeof data === "object" &&
    data !== null &&
    "pages" in data &&
    "pageParams" in data

/** Drops every page of the infinite query at `queryKey` but the first. */
function keepFirstPage(queryClient: QueryClient, queryKey: QueryKey) {
    const data = queryClient.getQueryData<InfiniteData<unknown>>(queryKey)
    if (data && data.pages.length > 1) {
        queryClient.setQueryData<InfiniteData<unknown>>(queryKey, {
            pages: data.pages.slice(0, 1),
            pageParams: data.pageParams.slice(0, 1),
        })
    }
}

/**
 * Refetches the infinite query at `queryKey` from its first page only: the
 * pages after it are dropped first (they come back through "load more"),
 * as TanStack refetches as many pages as the query holds. A failure leaves
 * the data on screen and the query in error (`isRefetchError`).
 */
export async function refreshFirstPage(
    queryClient: QueryClient,
    queryKey: QueryKey,
): Promise<void> {
    keepFirstPage(queryClient, queryKey)
    await queryClient.refetchQueries({ queryKey, exact: true })
}

/**
 * Fetches anew a query whose fetch is in flight (sent before a write, so
 * its answer may not have it): the request in flight is dropped. A
 * paginated one starts again from its first page. Fetched directly:
 * `refetchQueries` skips a query whose only observers are disabled (the
 * header's stale sign reads the window with `enabled: false`).
 */
function fetchAnew(queryClient: QueryClient, query: Query) {
    if (isPaged(query.state.data)) keepFirstPage(queryClient, query.queryKey)
    query.fetch(undefined, { cancelRefetch: true }).catch(() => {
        // Its observers show the failure; nothing to add here.
    })
}

/**
 * Sets each cached query under `queryKey` (a prefix, e.g. `[kind]` or
 * `[kind, adminId]`) to what `update` returns for its data. Queries without
 * data are left to their fetch (never created here); `update` returns the
 * same object when the write doesn't concern a query, which then stays as
 * it is. Fetch times are kept, so a write doesn't postpone a revalidation.
 * A query whose fetch is in flight is fetched anew (`fetchAnew`), so an
 * answer sent before the write can't bring back what it changed.
 */
export function updateCachedQueries<T>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    update: (data: T, queryKey: QueryKey) => T,
) {
    for (const query of queryClient.getQueryCache().findAll({ queryKey })) {
        const data = query.state.data as T | undefined
        if (data !== undefined) {
            const next = update(data, query.queryKey)
            if (next !== data) {
                queryClient.setQueryData(query.queryKey, next, {
                    updatedAt: query.state.dataUpdatedAt,
                })
            }
        }
        if (query.state.fetchStatus === "fetching") {
            fetchAnew(queryClient, query)
        }
    }
}

/**
 * Reads every cached query under `queryKey` again, for when a write's
 * answer can't say where things stand (rows changed elsewhere meanwhile).
 * A plain query is invalidated: refetched now if on screen, else when next
 * shown. A paginated one is refreshed from its first page if on screen,
 * and dropped otherwise (it loads when shown): never page by page.
 */
export function refetchCachedQueries(
    queryClient: QueryClient,
    queryKey: QueryKey,
) {
    for (const query of queryClient.getQueryCache().findAll({ queryKey })) {
        if (!isPaged(query.state.data)) {
            void queryClient.invalidateQueries({
                queryKey: query.queryKey,
                exact: true,
            })
        } else if (query.getObserversCount() > 0) {
            void refreshFirstPage(queryClient, query.queryKey)
        } else {
            queryClient.removeQueries({ queryKey: query.queryKey, exact: true })
        }
    }
}
