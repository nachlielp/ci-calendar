import {
    focusManager,
    hashKey,
    useInfiniteQuery,
    useQueryClient,
    type QueryKey,
    type UseInfiniteQueryOptions,
} from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { refreshFirstPage } from "../../app/cachedQueries"
import { STALE_MS } from "../../lib/freshness"
import { rowsAfter } from "../../lib/keyset"

// Freshness for admin pages (spec: "admin lists refresh when I come back to
// the tab and offer a manual refresh"). A plain admin query uses
// `PERSONAL_FRESHNESS` (fetched on every mount of its page, and on return
// after `STALE_MS`) and its page's refresh button calls `refetch`. A
// paginated one (an infinite query) must not let TanStack refetch it, which
// would fetch every loaded page again in turn: it uses
// `PAGED_ADMIN_FRESHNESS` and is shown with `usePagedAdminList`, which
// removes it when the page unmounts (so a visit starts from page one) and
// refreshes it from its first page only (`refreshFirstPage`), both on
// return when stale (`useRefreshWhenBack`) and from the refresh button.

/** An admin infinite query: refreshed only through `refreshFirstPage`. */
export const PAGED_ADMIN_FRESHNESS = {
    staleTime: STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
} as const

/** A server search goes out once typing pauses this long. */
export const SEARCH_DEBOUNCE_MS = 300

/**
 * Calls `refresh` when the app comes back (TanStack's focus: the page
 * becoming visible) and the query at `queryKey` is older than `STALE_MS`.
 * Pass a memoised key and callback: it resubscribes when they change.
 */
export function useRefreshWhenBack(queryKey: QueryKey, refresh: () => void) {
    const queryClient = useQueryClient()
    useEffect(
        () =>
            focusManager.subscribe((focused) => {
                if (!focused) return
                const query = queryClient
                    .getQueryCache()
                    .find({ queryKey, exact: true })
                if (query?.isStaleByTime(STALE_MS)) refresh()
            }),
        [queryClient, queryKey, refresh],
    )
}

/** An admin list's key: its kind, the admin, then its filters. */
type AdminListKey = readonly [string, string, ...unknown[]]

/**
 * A paginated admin list on its page (`PAGED_ADMIN_FRESHNESS` options,
 * keyed `[kind, adminId, …filters]`): the infinite query (enabled once the
 * admin is known), removed with every other filter's list of its kind
 * when the page unmounts, refreshed from its first page when the app
 * comes back stale, and `refresh` for the refresh button: the list shown
 * from its first page, plus `also` (the page's other queries), with
 * `refreshing` true until both settle. Other filters' lists are dropped
 * first (they load again when chosen) unless `keepOthers`. Pass options
 * whose key keeps its identity until a filter changes (memoise the
 * options factory's result).
 */
export function usePagedAdminList<
    TQueryFnData,
    TData,
    TQueryKey extends AdminListKey,
    TPageParam,
>(
    options: UseInfiniteQueryOptions<
        TQueryFnData,
        Error,
        TData,
        TQueryKey,
        TPageParam
    >,
    { keepOthers = false }: { keepOthers?: boolean } = {},
) {
    const queryClient = useQueryClient()
    const { queryKey } = options
    const [kind, adminId] = queryKey
    const list = useInfiniteQuery({ ...options, enabled: !!adminId })
    // The lists last as long as the page: the next visit starts over.
    useEffect(
        () => () => queryClient.removeQueries({ queryKey: [kind, adminId] }),
        [queryClient, kind, adminId],
    )
    const refreshShown = useCallback(
        () => void refreshFirstPage(queryClient, queryKey),
        [queryClient, queryKey],
    )
    useRefreshWhenBack(queryKey, refreshShown)

    const [refreshing, setRefreshing] = useState(false)
    function refresh(also?: () => Promise<unknown>) {
        if (!keepOthers) {
            const shown = hashKey(queryKey)
            queryClient.removeQueries({
                queryKey: [kind, adminId],
                predicate: (query) => query.queryHash !== shown,
            })
        }
        setRefreshing(true)
        void Promise.all([
            refreshFirstPage(queryClient, queryKey),
            also?.(),
        ]).finally(() => setRefreshing(false))
    }
    return { list, refreshing, refresh }
}

/**
 * The text typed as an `ilike` pattern that matches it anywhere: Postgres'
 * LIKE wildcards in it (`%`, `_`) and its escape (`\`) are escaped, and a
 * `*` (PostgREST's wildcard, which can't be escaped) becomes `_`, any one
 * character, so it still matches a `*`. Quote it (`quoted`) inside `or()`.
 */
export const containing = (text: string) =>
    `*${text.replace(/[\\%_]/g, "\\$&").replaceAll("*", "_")}*`

/** Where the next page of a newest-first admin list starts. */
export interface NewestCursor {
    createdAt: string
    id: string
}

/** The cursor of a row read from a newest-first list. */
export const newestCursorOf = (row: {
    created_at: string
    id: string
}): NewestCursor => ({ createdAt: row.created_at, id: row.id })

/**
 * Rows after `cursor` in a newest-first list (`created_at` descending,
 * then `id` descending): keyset pagination's logic tree, for one `or()`.
 */
export const afterNewest = (cursor: NewestCursor) =>
    rowsAfter("created_at", "descending", cursor.createdAt, cursor.id)

/** Newest-first order: `created_at` descending, then `id` descending. */
export function compareNewest(a: NewestCursor, b: NewestCursor): number {
    if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt ? -1 : 1
    return a.id > b.id ? -1 : a.id < b.id ? 1 : 0
}
