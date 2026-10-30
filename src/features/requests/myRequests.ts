import {
    queryOptions,
    useMutation,
    useQueryClient,
    type QueryClient,
} from "@tanstack/react-query"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import { useServices, type AppServices } from "../../app/services"
import type { SignedInRole } from "../../app/viewer"
import type { Database, Json } from "../../data/database.types"

/** First element of the user's requests query key: personal, never persisted. */
export const MY_REQUESTS_KIND = "my-requests"

/** The `requests` columns the requests page shows and edits. */
export const REQUEST_COLUMNS =
    "id, number, created_at, type, status, closed, message, phone, responses"

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

/** An admin's (or the user's own) note on a request, as stored. */
export type RequestResponse = {
    response: string
    created_at: string
    responder_name: string
}

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

export function toUserRequest(row: RequestRow): UserRequest {
    return {
        id: row.id,
        number: row.number,
        createdAt: row.created_at,
        type: row.type ?? "",
        // Admins close requests with `closed`; legacy's `status` stayed
        // "open" (its status change was commented out), but honour it.
        closed: row.closed === true || row.status === "closed",
        message: row.message ?? "",
        phone: row.phone ?? "",
        responses: (row.responses ?? []).flatMap(toResponse),
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
export function myRequestsQuery(services: AppServices, userId: string) {
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
type RequestEdit = Pick<
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

const listKey = (services: AppServices, userId: string) =>
    myRequestsQuery(services, userId).queryKey

/**
 * Puts a request the server returned into the cached list, if the list is
 * cached (never re-creating it, e.g. after a sign-out removed it).
 */
function cacheRequest(
    queryClient: QueryClient,
    services: AppServices,
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
function onWriteError(
    queryClient: QueryClient,
    services: AppServices,
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
function savePhoneIfMissing(
    services: AppServices,
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
 * still open (`closed IS NOT TRUE`): one an admin closed meanwhile is left
 * alone. RLS lets the owner write any column, so keeping a user from
 * changing other columns (`status`, admins' `responses`) would need an RPC.
 */
function openRequestWrite(
    services: AppServices,
    userId: string,
    id: string,
    patch: Database["public"]["Tables"]["requests"]["Update"],
) {
    return services.data
        .from("requests")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .not("closed", "is", true)
        .select(REQUEST_COLUMNS)
        .maybeSingle()
}

/**
 * Sends a new role request (legacy `UserRequestVM.createRequest`'s row)
 * and adds the stored request to the cached list: no refetch. As legacy,
 * not while the user has an open one. Sent again (a retry after a lost
 * answer), the same id finds the stored request instead of a second one.
 */
export function useCreateRequest(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, type, phone, message, name }: NewRequest) => {
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
        },
        onSuccess: (request, { phone }) => {
            cacheRequest(queryClient, services, userId, request)
            savePhoneIfMissing(services, userId, phone)
        },
        onError: (error) => onWriteError(queryClient, services, userId, error),
    })
}

/**
 * Edits the user's open request: only the type, phone and message, and
 * only while it is open (else `RequestClosedError`, and the list is
 * refetched). The stored request goes into the cached list.
 */
export function useEditRequest(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            patch,
        }: {
            id: string
            patch: RequestEdit
        }) => {
            await sessionOf(services, userId)
            const { data, error } = await openRequestWrite(
                services,
                userId,
                id,
                patch,
            )
            if (error) throw new Error(error.message)
            if (!data) throw new RequestClosedError()
            return toUserRequest(data)
        },
        onSuccess: (request) =>
            cacheRequest(queryClient, services, userId, request),
        onError: (error) => onWriteError(queryClient, services, userId, error),
    })
}

/**
 * Cancels the user's open request as legacy did: closes it and adds a
 * note to its responses. The responses are read fresh first, so a response
 * an admin added meanwhile is kept, and both requests go only to the open
 * request (else `RequestClosedError`). A response added between the two
 * requests would still be lost; appending atomically would need an RPC.
 */
export function useCancelRequest(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) => {
            await sessionOf(services, userId)
            const current = await services.data
                .from("requests")
                .select("responses")
                .eq("id", id)
                .eq("user_id", userId)
                .not("closed", "is", true)
                .maybeSingle()
            if (current.error) throw new Error(current.error.message)
            if (!current.data) throw new RequestClosedError()
            const { data, error } = await openRequestWrite(
                services,
                userId,
                id,
                {
                    closed: true,
                    responses: [
                        ...(current.data.responses ?? []),
                        cancellationResponse(name, services.now()),
                    ],
                },
            )
            if (error) throw new Error(error.message)
            if (!data) throw new RequestClosedError()
            return toUserRequest(data)
        },
        onSuccess: (request) =>
            cacheRequest(queryClient, services, userId, request),
        onError: (error) => onWriteError(queryClient, services, userId, error),
    })
}

/**
 * The note legacy added when a user cancelled their request (stored as
 * data in Hebrew, for the admins, whatever the user's language).
 */
function cancellationResponse(name: string, now: Date): RequestResponse {
    return {
        response: "בקשה בטולה על ידי המשתמש",
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
