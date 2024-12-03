import { CIRequest, RequestType } from "../util/interfaces"
import { supabase } from "./client"

export type CreateRequest = Partial<CIRequest> & {
    type: RequestType
    message: string
}

export type UpdateRequest = Partial<CIRequest> & {
    id: string
    type?: RequestType
    phone?: string
    message?: string
    closed?: boolean
    response?: string
}

export type DeleteRequest = {
    id: string
}

export const requestsService = {
    getUserRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    getOpenRequestsByType,
    markAsViewedRequestByAdmin,
    markAsViewedResponseByUser,
    getAllRequests,
    subscribeToAllRequests,
}

async function getUserRequests(userId: string) {
    const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    return { data, error }
}

async function getAllRequests() {
    let query = supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false })

    // if (status) {
    //     query = query.eq("status", status)
    // }
    // if (name) {
    //     query = query.ilike("name", `%${name}%`)
    // }

    const { data, error } = await query
    if (error) {
        throw error
    }
    return data
}

async function subscribeToAllRequests(
    callback: (data: { data: CIRequest; eventType: string }) => void
) {
    const channel = supabase
        .channel("public:requests")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "requests" },
            (payload) => {
                callback({
                    data: payload.new as CIRequest,
                    eventType: payload.eventType,
                })
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

    if (error) {
        throw error
    }
    return data
}

async function updateRequest(request: UpdateRequest) {
    const { data, error } = await supabase
        .from("requests")
        .update(request)
        .eq("id", request.id)
        .select()
        .single()
    if (error) {
        throw error
    }
    return data
}

async function deleteRequest(requestId: string) {
    const { data, error } = await supabase
        .from("requests")
        .delete()
        .eq("id", requestId)

    return { data, error }
}

async function markAsViewedRequestByAdmin(requestId: string, userId: string) {
    const { data, error } = await supabase
        .from("requests")
        .update({ viewed_by: { _fn: "array_append", args: [userId] } })
        .eq("id", requestId)
        .select()
        .single()

    return { data, error }
}

async function markAsViewedResponseByUser(requestId: string) {
    const { data, error } = await supabase
        .from("requests")
        .update({ viewed_response: true })
        .eq("id", requestId)
        .select()
        .single()

    return { data, error }
}
