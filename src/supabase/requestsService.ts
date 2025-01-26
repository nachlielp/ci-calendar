import { CIRequest, RequestType } from "../util/interfaces"
import { supabase } from "./client"
import { store } from "../Store/store"

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
    try {
        const { data, error } = await supabase
            .from("requests")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to get user requests for userId: ${userId} ERROR: ${errorMessage}`
        )
    }
}

async function getAllRequests() {
    try {
        const { data, error } = await supabase
            .from("requests")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to get all requests for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function subscribeToAllRequests(
    callback: (data: { data: CIRequest; eventType: string }) => void
) {
    try {
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
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to subscribe to all requests for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function getOpenRequestsByType(type: RequestType) {
    try {
        const { data, error } = await supabase
            .from("requests")
            .select("*")
            .eq("type", type)
            .eq("status", "open")

        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to get open requests by type ${type} for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function createRequest(request: CreateRequest) {
    try {
        const { data, error } = await supabase
            .from("requests")
            .insert(request)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to create request for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function updateRequest(request: UpdateRequest) {
    try {
        const { data, error } = await supabase
            .from("requests")
            .update(request)
            .eq("id", request.id)
            .select()
            .single()
        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to update request for requestId: ${request.id} for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function deleteRequest(requestId: string) {
    try {
        const { data, error } = await supabase
            .from("requests")
            .delete()
            .eq("id", requestId)

        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to delete request for requestId: ${requestId} for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function markAsViewedRequestByAdmin(requestId: string, userId: string) {
    try {
        const { data, error } = await supabase
            .from("requests")
            .update({ viewed_by: { _fn: "array_append", args: [userId] } })
            .eq("id", requestId)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to mark request as viewed by admin for requestId: ${requestId} for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function markAsViewedResponseByUser(requestId: string) {
    try {
        const { data, error } = await supabase
            .from("requests")
            .update({ viewed_response: true })
            .eq("id", requestId)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to mark request as viewed by user for requestId: ${requestId} for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}
