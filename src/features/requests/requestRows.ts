import type { DataClient } from "../../data/client"
import type { Database, Json } from "../../data/database.types"

// The `requests` table as both the user's requests (features/requests) and
// the admins' (features/admin-requests) read and write it: columns, the
// responses' shape, what "closed" means, and the conditional writes. It
// imports no feature, so either may import it.

/** The `requests` columns the user's requests page shows and edits. */
export const REQUEST_COLUMNS =
    "id, number, created_at, type, status, closed, message, phone, responses"

/** An admin's (or the user's own) note on a request, as stored. */
export type RequestResponse = {
    response: string
    created_at: string
    responder_name: string
}

export type RequestUpdate = Database["public"]["Tables"]["requests"]["Update"]

function toResponse(value: Json): RequestResponse[] {
    if (!value || typeof value !== "object" || Array.isArray(value)) return []
    const text = (key: string) =>
        typeof value[key] === "string" ? (value[key] as string) : ""
    return [
        {
            response: text("response"),
            created_at: text("created_at"),
            responder_name: text("responder_name"),
        },
    ]
}

/** A row's `responses` (a `jsonb[]`), skipping anything not shaped as one. */
export const responsesOf = (responses: Json[] | null): RequestResponse[] =>
    (responses ?? []).flatMap(toResponse)

/**
 * Whether a request is closed: admins close requests with `closed`;
 * legacy's `status` stayed "open" (its status change was commented out),
 * but a row saying "closed" is honoured. `whereClosed` / `whereOpen` are the
 * same rule as filters.
 */
export const isClosed = (row: {
    closed: boolean | null
    status: string | null
}) => row.closed === true || row.status === "closed"

/** `isClosed` as a PostgREST logic tree. */
export const CLOSED_TREE = "closed.is.true,status.eq.closed"

/**
 * Not `isClosed`, as a logic tree, alongside `closed IS NOT TRUE` (a plain
 * filter): `status` null or anything but "closed".
 */
export const OPEN_STATUS_TREE = "status.is.null,status.neq.closed"

/** The filters a request write or read can be narrowed with. */
export interface RequestFilters<Q> {
    eq(column: string, value: string | boolean): Q
    neq(column: string, value: string): Q
    not(column: string, operator: string, value: boolean): Q
    or(filters: string): Q
}

/** A condition on the rows a request read or write may touch. */
export type RequestCondition = <Q extends RequestFilters<Q>>(query: Q) => Q

/** Only a request that is open (not `isClosed`). */
export const whereOpen: RequestCondition = (query) =>
    query.not("closed", "is", true).or(OPEN_STATUS_TREE)

/** Only a request that is closed (`isClosed`). */
export const whereClosed: RequestCondition = (query) => query.or(CLOSED_TREE)

/**
 * Appends to the request `id`'s responses: reads them fresh under
 * `condition`, then writes `patch(current)` under the same condition,
 * selecting `columns`. `null` when either finds no row (the request isn't
 * as the caller saw it any more), so a change made elsewhere is never
 * overwritten. A response added between the two requests would still be
 * lost: an atomic append needs an RPC.
 */
export async function appendToResponses<Columns extends string>(
    data: DataClient,
    id: string,
    condition: RequestCondition,
    patch: (current: Json[]) => RequestUpdate,
    columns: Columns,
) {
    const read = await condition(
        data.from("requests").select("responses").eq("id", id),
    ).maybeSingle()
    if (read.error) throw new Error(read.error.message)
    if (!read.data) return null
    return conditionalUpdate(
        data,
        id,
        condition,
        patch(read.data.responses ?? []),
        columns,
    )
}

/**
 * Writes `patch` to the request `id` only under `condition`, selecting
 * `columns`; `null` when no row matched.
 */
export async function conditionalUpdate<Columns extends string>(
    data: DataClient,
    id: string,
    condition: RequestCondition,
    patch: RequestUpdate,
    columns: Columns,
) {
    const { data: row, error } = await condition(
        data.from("requests").update(patch).eq("id", id),
    )
        .select(columns)
        .maybeSingle()
    if (error) throw new Error(error.message)
    return row
}
