import type { InfiniteData, QueryClient } from "@tanstack/query-core"
import { infiniteQueryOptions } from "../../app/queryOptions"
import { sessionOf } from "../../app/auth/personal"
import {
    refetchCachedQueries,
    updateCachedQueries,
} from "../../app/cachedQueries"
import type { CoreServices } from "../../app/services"
import type { SignedInRole } from "../../app/auth/roles"
import type { Json } from "../../data/database.types"
import {
    insertInOrder,
    keysetPage,
    pageHolding,
    replacedAt,
} from "../../lib/keyset"
import {
    afterNewest,
    compareNewest,
    newestCursorOf,
    PAGED_ADMIN_FRESHNESS,
    type NewestCursor,
} from "../admin/adminLists"
import {
    appendToResponses,
    CLOSED_TREE,
    conditionalUpdate,
    isClosed,
    OPEN_STATUS_TREE,
    REQUEST_COLUMNS,
    REQUEST_NOTES,
    responsesOf,
    whereClosed,
    whereOpen,
    type RequestResponse,
    type RequestUpdate,
} from "../requests/requestRows"

// The support and role requests for `/manage-support` (legacy
// ManageSupportPage, requestsService.getAllRequests and the store's
// `app_requests`): admin data, read only when the page opens, open and
// closed apart (legacy's switch), a page at a time, filtered by type on the
// server (legacy fetched every request at boot, listened to all of them
// over realtime, and filtered in the browser). Never at boot, never
// persisted, forgotten on sign-out (its kind isn't in `PUBLIC_QUERY_KINDS`).
// The user's own requests are `my-requests` (features/requests), a kind of
// their own: these keys never collide with them, and a user sees an admin's
// answer on their page's next fetch. What "closed" means, the columns and
// the conditional writes are shared with them (`requests/requestRows.ts`).

/** First element of the admin request lists' query keys. */
export const ADMIN_REQUESTS_KIND = "admin-requests"

/** Requests per page ("load more"). */
export const REQUESTS_PAGE_SIZE = 20

/**
 * What the page shows of a request: the user's page's columns, plus who
 * sent it (legacy's summary and details).
 */
export const ADMIN_REQUEST_COLUMNS =
    `${REQUEST_COLUMNS}, user_id, email, name` as const

/** The types legacy's filter offered, in its order (not `support`). */
export const FILTER_TYPES = ["profile", "creator", "org"] as const

/** Open requests, or closed ones (legacy's switch). */
export type RequestStatus = "open" | "closed"

export interface AdminRequest {
    id: string
    number: number
    createdAt: string
    /** The requester (`requests.user_id`); null on rows without one. */
    userId: string | null
    type: string
    /** `isClosed`: as the user's page tells it. */
    closed: boolean
    message: string
    phone: string
    email: string
    name: string
    responses: RequestResponse[]
}

interface AdminRequestRow {
    id: string
    number: number
    created_at: string
    user_id: string | null
    type: string | null
    status: string | null
    closed: boolean | null
    message: string | null
    phone: string | null
    email: string | null
    name: string | null
    responses: Json[] | null
}

export function toAdminRequest(row: AdminRequestRow): AdminRequest {
    return {
        id: row.id,
        number: row.number,
        createdAt: row.created_at,
        userId: row.user_id,
        type: row.type ?? "",
        closed: isClosed(row),
        message: row.message ?? "",
        phone: row.phone ?? "",
        email: row.email ?? "",
        name: row.name ?? "",
        responses: responsesOf(row.responses),
    }
}

export interface RequestPage {
    requests: AdminRequest[]
    next: NewestCursor | null
}

export type RequestPages = InfiniteData<RequestPage, NewestCursor | null>

/** The types filtered by, in one order, so a choice is one query. */
export const typesKey = (types: readonly string[]) =>
    FILTER_TYPES.filter((type) => types.includes(type))

export const adminRequestsKey = (
    adminId: string,
    status: RequestStatus,
    types: readonly string[],
) => [ADMIN_REQUESTS_KIND, adminId, status, typesKey(types)] as const

/**
 * The one `or()` filter a page sends: the status's tree (`isClosed`, or
 * an open `status`, beside a plain `closed IS NOT TRUE`), joined with the
 * cursor's after the first page.
 */
export function requestsFilter(
    status: RequestStatus,
    cursor: NewestCursor | null,
): string {
    const tree = status === "closed" ? CLOSED_TREE : OPEN_STATUS_TREE
    return cursor ? `and(or(${tree}),or(${afterNewest(cursor)}))` : tree
}

/**
 * A page of the open or closed requests of `types` (all types when none),
 * newest first (by `created_at`, then `id`: keyset pagination, one row
 * more asked for to tell whether another page follows). Refreshed from its
 * first page only (`PAGED_ADMIN_FRESHNESS`); the page removes these queries
 * when it closes.
 */
export function adminRequestsQuery(
    services: CoreServices,
    adminId: string,
    status: RequestStatus,
    types: readonly string[],
) {
    const chosen = typesKey(types)
    return infiniteQueryOptions({
        queryKey: adminRequestsKey(adminId, status, chosen),
        ...PAGED_ADMIN_FRESHNESS,
        initialPageParam: null as NewestCursor | null,
        getNextPageParam: (page: RequestPage) => page.next,
        queryFn: async ({ pageParam }): Promise<RequestPage> => {
            await sessionOf(services, adminId)
            let query = services.data
                .from("requests")
                .select(ADMIN_REQUEST_COLUMNS)
            if (status === "open") query = query.not("closed", "is", true)
            if (chosen.length > 0) query = query.in("type", chosen)
            const { data, error } = await query
                .or(requestsFilter(status, pageParam))
                .order("created_at", { ascending: false })
                .order("id", { ascending: false })
                .limit(REQUESTS_PAGE_SIZE + 1)
            if (error) throw new Error(error.message)
            const { rows, next } = keysetPage(
                data,
                REQUESTS_PAGE_SIZE,
                newestCursorOf,
            )
            return { requests: rows.map(toAdminRequest), next }
        },
    })
}

/**
 * `pages` with `request` as stored: replaced where it is listed, removed if
 * it no longer `belongs`, or put in order on the page whose range holds it
 * (`pageHolding`: up to and including the page's `next` cursor; the last
 * page, with no cursor, holds the rest). One past every loaded page's
 * cursor is left for its own page to bring. The same object when nothing
 * changes.
 */
export function withRequest(
    pages: RequestPages,
    request: AdminRequest,
    belongs: boolean,
): RequestPages {
    const listed = pages.pages.findIndex((page) =>
        page.requests.some((other) => other.id === request.id),
    )
    if (listed !== -1) {
        const page = pages.pages[listed]
        const requests = belongs
            ? page.requests.map((other) =>
                  other.id === request.id ? request : other,
              )
            : page.requests.filter((other) => other.id !== request.id)
        return {
            ...pages,
            pages: replacedAt(pages.pages, listed, { ...page, requests }),
        }
    }
    if (!belongs) return pages
    const index = pageHolding(pages.pages, request, compareNewest)
    if (index === -1) return pages
    const page = pages.pages[index]
    const requests = [...page.requests]
    insertInOrder(requests, request, compareNewest)
    return {
        ...pages,
        pages: replacedAt(pages.pages, index, { ...page, requests }),
    }
}

/** Whether `request` belongs in the list keyed `key`. */
function belongsIn(key: readonly unknown[], request: AdminRequest) {
    const [, , status, types] = key as ReturnType<typeof adminRequestsKey>
    return (
        request.closed === (status === "closed") &&
        (types.length === 0 ||
            (types as readonly string[]).includes(request.type))
    )
}

/**
 * Puts a request as the server returned it into every cached list (each
 * status and type filter): replaced, moved between open and closed, or
 * left out where it doesn't belong (`updateCachedQueries`: no refetch,
 * fetch times kept, a fetch in flight redone from its first page).
 */
export function applyRequestChange(
    queryClient: QueryClient,
    adminId: string,
    request: AdminRequest,
) {
    updateCachedQueries<RequestPages>(
        queryClient,
        [ADMIN_REQUESTS_KIND, adminId],
        (pages, key) => withRequest(pages, request, belongsIn(key, request)),
    )
}

/**
 * Reads the lists again after a write found the request changed
 * (`refetchCachedQueries`): those on screen from their first page, the
 * others dropped (they load when shown).
 */
export function refreshAdminRequests(
    queryClient: QueryClient,
    adminId: string,
) {
    refetchCachedQueries(queryClient, [ADMIN_REQUESTS_KIND, adminId])
}

/** What an admin does to a request. */
export type RequestAction =
    | { kind: "reply"; text: string }
    | { kind: "close" }
    | { kind: "approve" }
    | { kind: "reopen" }

/** The notes an approval and a close add (`REQUEST_NOTES`). */
export const APPROVED_NOTE = REQUEST_NOTES.approved
export const CLOSED_NOTE = REQUEST_NOTES.closed

/**
 * The columns `action` writes, given the responses as just read
 * (`current`): legacy's shapes. A reply, a close and an approval append a
 * response (`{ response, created_at, responder_name }`) and mark it for
 * the user's notification (`viewed: false, sent: false, to_send: true`, as
 * legacy did); closing and approving set `closed`. Reopening (new: legacy
 * couldn't) clears `closed` and sets `status` back to "open", so neither
 * says closed (`isClosed`).
 */
export function actionPatch(
    action: RequestAction,
    current: readonly Json[],
    responder: string,
    now: Date,
): RequestUpdate {
    if (action.kind === "reopen") return { closed: false, status: "open" }
    const response: RequestResponse = {
        response:
            action.kind === "reply"
                ? action.text
                : action.kind === "approve"
                  ? APPROVED_NOTE
                  : CLOSED_NOTE,
        created_at: now.toISOString(),
        responder_name: responder,
    }
    return {
        responses: [...current, response],
        viewed: false,
        sent: false,
        to_send: true,
        ...(action.kind === "reply" ? {} : { closed: true }),
    }
}

/**
 * The request isn't as the admin saw it any more (the user cancelled it,
 * or another admin closed or reopened it): nothing was written, and the
 * lists are read again.
 */
export class RequestChangedError extends Error {
    constructor() {
        super("The request changed meanwhile")
    }
}

/**
 * Reopening would give the user a second open request: legacy allowed one
 * at a time (the user's form refuses another while one is open).
 */
export class OtherOpenRequestError extends Error {
    constructor() {
        super("The user has another open request")
    }
}

/** The role change of an approval failed: nothing else was written. */
export class ApprovalRoleError extends Error {
    constructor(cause: unknown) {
        super("The role change failed", { cause })
    }
}

/** The role was given, but closing the request then failed. */
export class ApprovalCloseError extends Error {
    constructor(cause: unknown) {
        super("The request wasn't closed after its role was given", {
            cause,
        })
    }
}

/**
 * The role was given, but the request had changed (cancelled, closed) by
 * the time it was to be closed: it was left as it is.
 */
export class RoleGivenRequestChangedError extends Error {
    constructor() {
        super("The role was given, but the request changed meanwhile")
    }
}

/** The role a role request asks for (legacy's approval mapping). */
export function requestedRole(type: string): SignedInRole | null {
    const roles: Readonly<Record<string, SignedInRole>> = {
        profile: "profile",
        creator: "creator",
        org: "org",
    }
    return Object.hasOwn(roles, type) ? roles[type] : null
}

/**
 * Writes `action` to `request`, only while it is open or closed as the
 * admin saw it (`whereOpen` / `whereClosed`): a user's cancel (which
 * closes it) or another admin's close or reopen since is never overwritten
 * (`RequestChangedError`). An appending action reads the responses fresh
 * under the same condition first (`appendToResponses`, as the user's
 * cancel does). Reopening is refused while the user has another open
 * request (`OtherOpenRequestError`).
 */
export async function writeAction(
    services: CoreServices,
    request: AdminRequest,
    action: RequestAction,
    responder: string,
): Promise<AdminRequest> {
    const condition = request.closed ? whereClosed : whereOpen
    let row
    if (action.kind === "reopen") {
        if (request.userId) {
            const { data, error } = await whereOpen(
                services.data
                    .from("requests")
                    .select("id")
                    .eq("user_id", request.userId)
                    .neq("id", request.id),
            ).limit(1)
            if (error) throw new Error(error.message)
            if (data.length > 0) throw new OtherOpenRequestError()
        }
        row = await conditionalUpdate(
            services.data,
            request.id,
            condition,
            actionPatch(action, [], responder, services.now()),
            ADMIN_REQUEST_COLUMNS,
        )
    } else {
        row = await appendToResponses(
            services.data,
            request.id,
            condition,
            (current) =>
                actionPatch(action, current, responder, services.now()),
            ADMIN_REQUEST_COLUMNS,
        )
    }
    if (!row) throw new RequestChangedError()
    return toAdminRequest(row)
}

export interface ActionInput {
    request: AdminRequest
    action: RequestAction
    /** The admin's name (`users.user_name`), as legacy signed responses. */
    responder: string
}

/** Errors a page explains by itself: not reported. */
export const expected = (error: Error) =>
    error instanceof RequestChangedError ||
    error instanceof OtherOpenRequestError
