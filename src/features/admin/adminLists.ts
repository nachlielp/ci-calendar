import {
    focusManager,
    useQueryClient,
    type InfiniteData,
    type QueryClient,
    type QueryKey,
} from "@tanstack/react-query"
import { useEffect } from "react"
import { STALE_MS } from "../calendar/publicWindow"

// Freshness for admin pages (spec: "admin lists refresh when I come back to
// the tab and offer a manual refresh"). A plain admin query uses
// `PERSONAL_FRESHNESS` (fetched on every mount of its page, and on return
// after `STALE_MS`) and its page's refresh button calls `refetch`. A
// paginated one (an infinite query) must not let TanStack refetch it, which
// would fetch every loaded page again in turn: it uses
// `PAGED_ADMIN_FRESHNESS`, the page removes it on unmount (so a visit starts
// from page one), and `refreshFirstPage` both on return when stale
// (`useRefreshWhenBack`) and from the refresh button.

/** An admin infinite query: refreshed only through `refreshFirstPage`. */
export const PAGED_ADMIN_FRESHNESS = {
    staleTime: STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
} as const

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
    const data = queryClient.getQueryData<InfiniteData<unknown>>(queryKey)
    if (data && data.pages.length > 1) {
        queryClient.setQueryData<InfiniteData<unknown>>(queryKey, {
            pages: data.pages.slice(0, 1),
            pageParams: data.pageParams.slice(0, 1),
        })
    }
    await queryClient.refetchQueries({ queryKey, exact: true })
}

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
