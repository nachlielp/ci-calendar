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
