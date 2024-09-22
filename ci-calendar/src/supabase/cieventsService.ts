import { supabase } from "./client"
import { CIEvent } from "../util/interfaces"

export interface FilterOptions {
    startDate?: string
    endDate?: string
    creatorId?: string
    sortBy?: string
    hideClosed?: boolean
}

export type CIEventWithoutId = Omit<CIEvent, "id">

export const cieventsService = {
    getCIEvent,
    getCIEvents,
    createCIEvent,
    updateCIEvent,
    deleteCIEvent,
    deleteMultipleCIEvents,
    updateMultipleCIEvents,
}

async function getCIEvent(id: string): Promise<CIEvent> {
    try {
        const { data, error } = await supabase
            .from("ci-events")
            .select("*")
            .eq("id", id)
            .single()
        if (error) throw error
        return data as CIEvent
    } catch (error) {
        console.error("Error fetching CI event:", error)
        throw error
    }
}

async function getCIEvents(filterBy: FilterOptions = {}): Promise<CIEvent[]> {
    try {
        let query = supabase.from("ci-events").select("*")

        if (filterBy?.startDate) {
            query = query.gte("startDate", filterBy.startDate)
        }
        if (filterBy?.endDate) {
            query = query.lte("endDate", filterBy.endDate)
        }
        if (filterBy?.creatorId) {
            query = query.eq("creatorId", filterBy.creatorId)
        }
        if (filterBy?.sortBy) {
            query = query.order(filterBy.sortBy)
        }
        if (filterBy?.hideClosed) {
            query = query.eq("hide", false)
        }
        const { data, error } = await query

        if (error) throw error
        return data as CIEvent[]
    } catch (error) {
        console.error("Error fetching CI events:", error)
        throw error
    }
}

async function createCIEvent(event: CIEventWithoutId): Promise<CIEvent> {
    try {
        const { data, error } = await supabase
            .from("ci-events")
            .insert(event)
            .select("*")
            .single()

        if (error) throw error
        return data as CIEvent
    } catch (error) {
        console.error("Error creating CI event:", error)
        throw error
    }
}

async function updateCIEvent(
    id: string,
    eventUpdate: Partial<CIEvent>
): Promise<CIEvent> {
    try {
        const { data, error } = await supabase
            .from("ci-events")
            .update(eventUpdate)
            .eq("id", id)
            .select("*")
            .single()

        if (error) throw error
        return data as CIEvent
    } catch (error) {
        console.error("Error updating CI event:", error)
        throw error
    }
}

async function updateMultipleCIEvents(
    ids: string[],
    eventUpdate: Partial<CIEvent>
): Promise<CIEvent[]> {
    try {
        const { data, error } = await supabase
            .from("ci-events")
            .update(eventUpdate)
            .in("id", ids)
            .select("*")

        if (error) throw error
        return data as CIEvent[]
    } catch (error) {
        console.error("Error updating multiple CI events:", error)
        throw error
    }
}

async function deleteCIEvent(id: string): Promise<void> {
    try {
        const { error } = await supabase
            .from("ci-events")
            .delete()
            .eq("id", id)
            .single()

        if (error) throw error
    } catch (error) {
        console.error("Error deleting CI event:", error)
        throw error
    }
}

async function deleteMultipleCIEvents(ids: string[]): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from("ci-events")
            .delete()
            .in("id", ids)
            .select("id")

        if (error) throw error
        return data ? data.map((event) => event.id) : []
    } catch (error) {
        console.error("Error deleting multiple CI events:", error)
        throw error
    }
}
