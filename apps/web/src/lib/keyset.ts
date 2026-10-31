// Keyset pagination (docs/architecture.md, "Pagination"): a long list is
// ordered by a column and then `id`, both ascending or both descending, and
// read a page at a time after the last row read (the page's `next` cursor),
// never by offset (a delete would shift it). These are the pieces every
// paginated list shares: the filter for "after the cursor", the page cut
// from one row too many, and where a row moved into a loaded list goes.

/**
 * A value for PostgREST's logic tree (`or=(…)`), double-quoted so commas,
 * dots, colons and parentheses in it are text (`\` escapes `"` and `\`).
 */
export const quoted = (value: string) => `"${value.replace(/["\\]/g, "\\$&")}"`

/** Which way a keyset list runs (its column, then `id`, the same way). */
export type KeysetDirection = "ascending" | "descending"

/**
 * PostgREST's logic tree for the rows after (`value`, `id`) in a list
 * ordered by `column`, then `id`, both in `direction`: for one `or()`
 * (join it with any other tree in the same `or()`, never a second one).
 */
export function rowsAfter(
    column: string,
    direction: KeysetDirection,
    value: string,
    id: string,
): string {
    const op = direction === "ascending" ? "gt" : "lt"
    return `${column}.${op}.${quoted(value)},and(${column}.eq.${quoted(value)},id.${op}.${quoted(id)})`
}

/**
 * A page read with `limit(size + 1)`: the rows to show, and the next page's
 * cursor (`cursorOf` the last row shown) when the extra row says another
 * page follows; `null` on the last page.
 */
export function keysetPage<Row, Cursor>(
    rows: readonly Row[],
    size: number,
    cursorOf: (row: Row) => Cursor | null,
): { rows: Row[]; next: Cursor | null } {
    const shown = rows.slice(0, size)
    const last = shown.at(-1)
    return {
        rows: shown,
        next: rows.length > size && last !== undefined ? cursorOf(last) : null,
    }
}

/**
 * The loaded page whose range holds `row`, by the list's order (`compare`,
 * on the cursor's fields): the first page whose `next` cursor `row` doesn't
 * come after (up to and including it, as "load more" reads on after it),
 * or the last page when no page follows it. `-1` when `row` lies after
 * every loaded page: its own page brings it when loaded (putting it in now
 * would show it twice). By the cursor, never by the last row shown: rows
 * moved away since leave the cursor behind.
 */
export function pageHolding<Key>(
    pages: readonly { next: Key | null }[],
    row: Key,
    compare: (a: Key, b: Key) => number,
): number {
    return pages.findIndex(
        (page) => page.next === null || compare(row, page.next) <= 0,
    )
}

/** `list` with the item at `index` replaced (a new array). */
export const replacedAt = <T>(list: readonly T[], index: number, item: T) =>
    list.map((other, i) => (i === index ? item : other))

/** Puts `item` into `list` (in place) in `compare` order, after equals. */
export function insertInOrder<T>(
    list: T[],
    item: T,
    compare: (a: T, b: T) => number,
) {
    const at = list.findIndex((other) => compare(item, other) < 0)
    list.splice(at === -1 ? list.length : at, 0, item)
}
