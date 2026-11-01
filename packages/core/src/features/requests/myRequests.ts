import type { QueryClient } from "@tanstack/query-core"
import { queryOptions } from "../../app/queryOptions"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import type { CoreServices } from "../../app/services"
import type { SignedInRole } from "../../app/auth/roles"
import type { Database, Json } from "../../data/database.types"
import {
    appendToResponses,
    conditionalUpdate,
    isClosed,
    REQUEST_COLUMNS,
    REQUEST_NOTES,
    responsesOf,
    whereOpen,
    type RequestCondition,
    type RequestResponse,
} from "./requestRows"

/** First element of the user's requests query key: personal, never persisted. */
export const MY_REQUESTS_KIND = "my-requests"

/**
 * What a request asks for (legacy `RequestType`). Only the role requests
 * are offered (legacy's `requestOptions`; `profile` and `support` were
 * commented out there, support goes by email), but older rows may hold any.
 */
export type RequestType = "profile" | "creator" | "org" | "support"

/** The role requests the form offers, in legacy's order. */
export const ROLE_REQUEST_TYPES = ["creator", "org"] as const
export type RoleRequestType = (typeof ROLE_REQUEST_TYPES)[number]

/**
 * The role requests a user may make: legacy offered both but the role they
 * already have.
 */
export const offeredRequestTypes = (role: SignedInRole): RoleRequestType[] =>
    ROLE_REQUEST_TYPES.filter((type) => type !== role)

export interface UserRequest {
    id: string
    number: number
    createdAt: string
    type: string
    /** Closed by an admin (answered) or cancelled by the user. */
    closed: boolean
    message: string
    phone: string
    responses: RequestResponse[]
}

interface RequestRow {
    id: string
    number: number
    created_at: string
    type: string | null
    status: string | null
    closed: boolean | null
    message: string | null
    phone: string | null
    responses: Json[]
}

export function toUserRequest(row: RequestRow): UserRequest {
    return {
        id: row.id,
        number: row.number,
        createdAt: row.created_at,
        type: row.type ?? "",
        closed: isClosed(row),
        message: row.message ?? "",
        phone: row.phone ?? "",
        responses: responsesOf(row.responses),
    }
}

/**
 * The open request a user has (legacy `getOpenPositionRequest`): their
 * latest one not closed. Legacy let a user have one at a time.
 */
export const openRequestOf = (requests: readonly UserRequest[]) =>
    requests.find((request) => !request.closed)

/**
 * The signed-in user's own requests, newest first: read when the requests
 * page opens, with their token and filtered to them (an admin's RLS would
 * return everyone's).
 */
export function myRequestsQuery(services: CoreServices, userId: string) {
    return queryOptions({
        queryKey: [MY_REQUESTS_KIND, userId],
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<UserRequest[]> => {
            await sessionOf(services, userId)
            const { data, error } = await services.data
                .from("requests")
                .select(REQUEST_COLUMNS)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
            if (error) throw new Error(error.message)
            return data.map(toUserRequest)
        },
    })
}

/** The columns the user may change on their open request. */
export type RequestEdit = Pick<
    Database["public"]["Tables"]["requests"]["Update"],
    "type" | "phone" | "message"
>

export interface NewRequest {
    /** Made once per form, so sending it again can't store it twice. */
    id: string
    type: RoleRequestType
    phone: string
    message: string
    /** The user's name (`users.user_name`), stored on the request. */
    name: string
}

/**
 * The request is closed (an admin answered it, or another tab cancelled
 * it) since the page loaded: the write matched no open request.
 */
export class RequestClosedError extends Error {
    constructor() {
        super("The request is closed")
    }
}

/** The user has an open request already (legacy allowed one at a time). */
export class OpenRequestExistsError extends Error {
    constructor() {
        super("An open request exists")
    }
}

/** Postgres' unique violation: a request with this id is stored already. */
const DUPLICATE = "23505"

const listKey = (services: CoreServices, userId: string) =>
    myRequestsQuery(services, userId).queryKey

/**
 * Puts a request the server returned into the cached list, if the list is
 * cached (never re-creating it, e.g. after a sign-out removed it).
 */
export function cacheRequest(
    queryClient: QueryClient,
    services: CoreServices,
    userId: string,
    request: UserRequest,
) {
    queryClient.setQueryData(listKey(services, userId), (requests) =>
        requests?.some((other) => other.id === request.id)
            ? requests.map((other) =>
                  other.id === request.id ? request : other,
              )
            : requests && [request, ...requests],
    )
}

/** Fails the way a write to a closed request does, and refetches the list. */
export function onWriteError(
    queryClient: QueryClient,
    services: CoreServices,
    userId: string,
    error: Error,
) {
    if (error instanceof RequestClosedError) {
        void queryClient.invalidateQueries({
            queryKey: listKey(services, userId),
        })
    } else if (!(error instanceof OpenRequestExistsError)) {
        services.telemetry.captureError(error, { source: "request-save" })
    }
}

/**
 * Legacy `createRequest`: also saves the phone on the user's row if it had
 * none (only then: the update is filtered on an empty phone). Fire and
 * forget; no cached query holds the phone.
 */
export function savePhoneIfMissing(
    services: CoreServices,
    userId: string,
    phone: string,
) {
    const report = (error: unknown) =>
        services.telemetry.captureError(error, { source: "request-phone" })
    void services.data
        .from("users")
        .update({ phone })
        .eq("id", userId)
        .eq("phone", "")
        .then(({ error }) => error && report(new Error(error.message)), report)
}

/**
 * The open requests' writes go only to the user's own request while it is
 * still open (`whereOpen`): one an admin closed meanwhile is left alone.
 * RLS lets the owner write any column, so keeping a user from changing
 * other columns (`status`, admins' `responses`) would need an RPC.
 */
const ownOpenRequest =
    (userId: string): RequestCondition =>
    (query) =>
        whereOpen(query.eq("user_id", userId))

/**
 * Sends a new role request (legacy `UserRequestVM.createRequest`'s row)
 * and adds the stored request to the cached list: no refetch. As legacy,
 * not while the user has an open one. Sent again (a retry after a lost
 * answer), the same id finds the stored request instead of a second one.
 */
export async function createRequest(
    services: CoreServices,
    queryClient: QueryClient,
    userId: string,
    { id, type, phone, message, name }: NewRequest,
): Promise<UserRequest> {
    const cached = queryClient.getQueryData(listKey(services, userId))
    if (cached && openRequestOf(cached)) {
        throw new OpenRequestExistsError()
    }
    const session = await sessionOf(services, userId)
    const inserted = await services.data
        .from("requests")
        .insert({
            id,
            type,
            message,
            phone,
            email: session.user.email ?? "",
            name,
            responses: [],
            user_id: userId,
            status: "open",
            viewed_response: false,
            viewed_by: [],
            created_at: services.now().toISOString(),
            sent: false,
            viewed: false,
            to_send: false,
            closed: false,
        })
        .select(REQUEST_COLUMNS)
        .single()
    const { data, error } =
        inserted.error?.code === DUPLICATE
            ? await services.data
                  .from("requests")
                  .select(REQUEST_COLUMNS)
                  .eq("id", id)
                  .eq("user_id", userId)
                  .single()
            : inserted
    if (error) throw new Error(error.message)
    return toUserRequest(data)
}

/**
 * Edits the user's open request: only the type, phone and message, and
 * only while it is open (else `RequestClosedError`, and the list is
 * refetched). The stored request goes into the cached list.
 */
export async function editRequest(
    services: CoreServices,
    userId: string,
    {
        id,
        patch,
    }: {
        id: string
        patch: RequestEdit
    },
): Promise<UserRequest> {
    await sessionOf(services, userId)
    const data = await conditionalUpdate(
        services.data,
        id,
        ownOpenRequest(userId),
        patch,
        REQUEST_COLUMNS,
    )
    if (!data) throw new RequestClosedError()
    return toUserRequest(data)
}

/**
 * Cancels the user's open request as legacy did: closes it and adds a
 * note to its responses. The responses are read fresh first, so a response
 * an admin added meanwhile is kept, and both requests go only to the open
 * request (else `RequestClosedError`). A response added between the two
 * requests would still be lost; appending atomically would need an RPC.
 */
export async function cancelRequest(
    services: CoreServices,
    userId: string,
    { id, name }: { id: string; name: string },
): Promise<UserRequest> {
    await sessionOf(services, userId)
    const data = await appendToResponses(
        services.data,
        id,
        ownOpenRequest(userId),
        (current) => ({
            closed: true,
            responses: [...current, cancellationResponse(name, services.now())],
        }),
        REQUEST_COLUMNS,
    )
    if (!data) throw new RequestClosedError()
    return toUserRequest(data)
}

/** The note legacy added when a user cancelled their request. */
function cancellationResponse(name: string, now: Date): RequestResponse {
    return {
        response: REQUEST_NOTES.cancelled,
        created_at: now.toISOString(),
        responder_name: name,
    }
}

/** The values the request form edits. */
export type RequestValues = {
    type: RequestType | ""
    phone: string
    message: string
}
