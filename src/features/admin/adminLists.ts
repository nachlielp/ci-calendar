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

/** A server search goes out once typing pauses this long. */
export const SEARCH_DEBOUNCE_MS = 300

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
 * Applies a write's answer to every cached paginated admin list under
 * `queryKey` (a prefix, e.g. `[kind, adminId]`): `update(data, key)`
 * returns the list's new data, or the same object when the write doesn't
 * concern it. No refetch; fetch times are kept (a write doesn't delay a
 * revalidation); a list whose fetch is in flight (sent before the write,
 * so its answer may not have it) is fetched again from its first page.
 */
export function updatePagedLists<T>(
    queryClient: QueryClient,
    queryKey: QueryKey,
    update: (data: T, queryKey: QueryKey) => T,
) {
    for (const query of queryClient.getQueryCache().findAll({ queryKey })) {
        const data = query.state.data as T | undefined
        const next = data === undefined ? data : update(data, query.queryKey)
        if (next !== data) {
            queryClient.setQueryData(query.queryKey, next, {
                updatedAt: query.state.dataUpdatedAt,
            })
        }
        if (query.state.fetchStatus === "fetching") {
            void refreshFirstPage(queryClient, query.queryKey)
        }
    }
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

/**
 * A value for PostgREST's logic tree (`or=(…)`), double-quoted so commas,
 * dots, colons and parentheses in it are text (`\` escapes `"` and `\`).
 */
export const quoted = (value: string) => `"${value.replace(/["\\]/g, "\\$&")}"`

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

/**
 * Rows after `cursor` in a newest-first list (`created_at` descending,
 * then `id` descending): keyset pagination's logic tree, for one `or()`.
 */
export const afterNewest = ({ createdAt, id }: NewestCursor) =>
    `created_at.lt.${quoted(createdAt)},and(created_at.eq.${quoted(createdAt)},id.lt.${quoted(id)})`
