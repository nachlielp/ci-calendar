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
}

async function getUserRequests(userId: string) {
    const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false })

    return { data, error }
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
