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
    try {
        const { data, error } = await supabase
            .from("requests")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

        return { data, error }
    } catch (error) {
        console.error("Error fetching user requests:", error)
        throw error
    }
}

async function getAllRequests() {
    try {
        let query = supabase
            .from("requests")
            .select("*")
            .order("created_at", { ascending: false })

        const { data, error } = await query
        if (error) {
            throw error
        }
        return data
    } catch (error) {
        console.error("Error fetching all requests:", error)
        throw error
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
        console.error("Error subscribing to all requests:", error)
        throw error
    }
}

async function getOpenRequestsByType(type: RequestType) {
    try {
        const { data, error } = await supabase
            .from("requests")
            .select("*")
            .eq("type", type)
            .eq("status", "open")

        return { data, error }
    } catch (error) {
        console.error("Error fetching open requests by type:", error)
        throw error
    }
}

async function createRequest(request: CreateRequest) {
    try {
        const { data, error } = await supabase
            .from("requests")
            .insert(request)
            .select()
            .single()

        if (error) {
            throw error
        }
        return data
    } catch (error) {
        console.error("Error creating request:", error)
        throw error
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
        if (error) {
            throw error
        }
        return data
    } catch (error) {
        console.error("Error updating request:", error)
        throw error
    }
}

async function deleteRequest(requestId: string) {
    try {
        const { data, error } = await supabase
            .from("requests")
            .delete()
            .eq("id", requestId)

        return { data, error }
    } catch (error) {
        console.error("Error deleting request:", error)
        throw error
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

        return { data, error }
    } catch (error) {
        console.error("Error marking request as viewed by admin:", error)
        throw error
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

        return { data, error }
    } catch (error) {
        console.error("Error marking request as viewed by user:", error)
        throw error
    }
}
