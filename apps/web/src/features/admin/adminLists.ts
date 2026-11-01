import {
    focusManager,
    hashKey,
    useInfiniteQuery,
    useQueryClient,
    type QueryKey,
    type UseInfiniteQueryOptions,
} from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { refreshFirstPage } from "@ci-calendar/core/app/cachedQueries"
import { STALE_MS } from "@ci-calendar/core/lib/freshness"

// The admin lists' hooks; their freshness and keyset rules are in the core
// (features/admin/adminLists.ts there).

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
