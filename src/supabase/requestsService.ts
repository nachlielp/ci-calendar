import { UseRequestsProps } from "../hooks/useRequests"
import { CIRequest, RequestType } from "../util/interfaces"
import { supabase } from "./client"

export type CreateRequest = Partial<CIRequest> & {
    type: RequestType
    message: string
}

export type UpdateRequest = Partial<CIRequest> & {
    request_id: string
    status?: string
    response?: string
}

export type DeleteRequest = {
    request_id: string
}

export const requestsService = {
    getUserRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    getOpenRequestsByType,
    markAsViewedRequestByAdmin,
    markAsViewedResponseByUser,
    subscribeToResponses,
    getAllRequests,
    subscribeToAllRequests,
}

async function getUserRequests(userId: string) {
    const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false })

    return { data, error }
}

function subscribeToResponses(
    userId: string,
    callback: (hasNewResponse: boolean) => void
) {
    const channel = supabase
        .channel(`public:requests:created_by=eq.${userId}`)
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "requests" },
            (payload) => {
                if (
                    payload.eventType === "INSERT" ||
                    (payload.eventType === "UPDATE" &&
                        payload.new.status === "closed")
                ) {
                    callback(true)
                } else {
                    callback(false)
                }
            }
        )
        .subscribe()

    return channel
}

async function getAllRequests({
    status,
    type,
}: // user_name,
// email,
// page,
// pageSize,
UseRequestsProps) {
    // console.log("user_name", user_name)
    // console.log("email", email)
    // console.log("page", page)
    // console.log("pageSize", pageSize)
    let query = supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false })

    if (status) {
        query = query.in("status", status)
    }
    if (type) {
        query = query.eq("type", type)
    }
    // if (user_name) {
    //     query = query.eq("name", user_name)
    // }
    // if (email) {
    //     query = query.eq("email", email)
    // }
    // if (page && pageSize) {
    //     query = query.range((page - 1) * pageSize, page * pageSize)
    // }

    const { data, error } = await query
    return { data, error }
}

async function subscribeToAllRequests(callback: (data: CIRequest[]) => void) {
    const channel = supabase
        .channel("public:requests")
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "requests" },
            (payload) => {
                callback([payload.new as CIRequest])
            }
        )
        .subscribe()

    return channel
}

async function getOpenRequestsByType(type: RequestType) {
    const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("type", type)
        .eq("status", "open")
    return { data, error }
}

async function createRequest(request: CreateRequest) {
    const { data, error } = await supabase
        .from("requests")
        .insert(request)
        .select()
        .single()

    return { data, error }
}

async function updateRequest(request: UpdateRequest) {
    const { data, error } = await supabase
        .from("requests")
        .update(request)
        .eq("request_id", request.request_id)

    return { data, error }
}

async function deleteRequest(requestId: string) {
    const { data, error } = await supabase
        .from("requests")
        .delete()
        .eq("request_id", requestId)

    return { data, error }
}

async function markAsViewedRequestByAdmin(requestId: string, userId: string) {
    const { data, error } = await supabase
        .from("requests")
        .update({ viewed_by: { _fn: "array_append", args: [userId] } })
        .eq("request_id", requestId)
        .select()
        .single()

    return { data, error }
}

async function markAsViewedResponseByUser(requestId: string) {
    const { data, error } = await supabase
        .from("requests")
        .update({ viewed_response: true })
        .eq("request_id", requestId)
        .select()
        .single()

    return { data, error }
}
