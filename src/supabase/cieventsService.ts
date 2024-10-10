import { supabase } from "./client"
import { CIEvent } from "../util/interfaces"

export interface FilterOptions {
    start_date?: string
    end_date?: string
    creator_id?: string
    sort_by?: string
    hide?: boolean
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

        if (filterBy?.start_date) {
            query = query.gte("start_date", filterBy.start_date)
        }
        if (filterBy?.end_date) {
            query = query.lte("end_date", filterBy.end_date)
        }
        if (filterBy?.creator_id) {
            query = query.eq("creator_id", filterBy.creator_id)
        }
        if (filterBy?.sort_by) {
            query = query.order(filterBy.sort_by)
        }
        if (filterBy?.hide) {
            query = query.eq("hide", filterBy.hide)
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
