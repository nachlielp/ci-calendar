import { supabase } from "./client"
import { CIEvent, DBCIEvent } from "../util/interfaces"
import { utilService } from "../util/utilService"
import dayjs from "dayjs"
import { SelectOption } from "../util/options"
import { store } from "../Store/store"
export interface FilterOptions {
    start_date?: string
    end_date?: string
    user_id?: string
    sort_by?: string
    sort_direction?: "asc" | "desc"
    hide?: boolean
    future_events?: boolean
    creator_name?: string
}

export const cieventsService = {
    getCIEvent,
    getCIEvents,
    createCIEvent,
    updateCIEvent,
    deleteCIEvent,
    deleteMultipleCIEvents,
    updateMultipleCIEvents,
    getCIEventsCreators,
}

async function getCIEvent(id: string): Promise<CIEvent> {
    try {
        const { data, error } = await supabase
            .from("ci_events")
            .select("*")
            .eq("id", id)
            .single()
        if (error)
            throw new Error(
                `Failed to get CI event for id: ${id} for userId: ${store.getUserId} ERROR: ${error}`
            )
        return data as CIEvent
    } catch (error) {
        console.error("Error fetching CI event:", error)
        throw new Error(
            `Failed to get CI event for id: ${id} for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

//TODO get users/ orgs with left join
async function getCIEvents(filterBy: FilterOptions = {}): Promise<CIEvent[]> {
    try {
        let query = supabase
            .from("ci_events")
            .select(
                `
            *,
            ci_events_users_junction (
                ci_event_id,
                public_bio (
                    bio_name,
                    img,
                    page_url,
                    page_title,
                    show_profile,
                    allow_tagging,
                    about,
                    user_id
                )
            )
        `
            )
            .eq("ci_events_users_junction.public_bio.show_profile", true) // Updated filter path

        // Apply filters
        if (filterBy?.start_date) {
            query = filterBy.future_events
                ? query.gte(
                      "start_date",
                      dayjs(filterBy.start_date).format("YYYY-MM-DD")
                  )
                : query.lte(
                      "start_date",
                      dayjs(filterBy.start_date).format("YYYY-MM-DD")
                  )
        }
        if (filterBy?.end_date) {
            query = filterBy.future_events
                ? query.gt("end_date", filterBy.end_date)
                : query.lt("end_date", filterBy.end_date)
        }
        if (filterBy?.user_id && filterBy.user_id.length) {
            query = query.eq("user_id", filterBy.user_id)
        }

        if (filterBy?.sort_by) {
            query.order(filterBy.sort_by, {
                ascending: filterBy.sort_direction === "asc",
            })
        }

        if (filterBy?.hide) {
            query = query.eq("hide", filterBy.hide)
        }

        const { data, error } = await query
        if (error)
            throw new Error(
                `Failed to get CI events for userId: ${store.getUserId} ERROR: ${error}`
            )

        const eventsWithUsers = data.map((event) => {
            const { ci_events_users_junction } = event
            const users = ci_events_users_junction
                .map((junction: any) => junction.public_bio) // Changed from user.users to junction.public_bio
                .filter((bio: any) => bio && bio.bio_name) // Add null check

            delete event.ci_events_users_junction

            return { ...event, users }
        })
        return eventsWithUsers as CIEvent[]
    } catch (error) {
        console.error("Error fetching CI events:", error)
        throw new Error(
            `Failed to get CI events for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

async function getCIEventsCreators(): Promise<SelectOption[]> {
    try {
        const { data, error } = await supabase
            .from("ci_events")
            .select(
                `creator:users (
            user_name,
            id
        )`
            )
            .gte("start_date", dayjs().startOf("day").toISOString())

        if (error)
            throw new Error(
                `Failed to get CI events creators for userId: ${store.getUserId} ERROR: ${error}`
            )

        const creators = new Map<string, string>()

        data.forEach((event) => {
            const { creator } = event
            if (creator) {
                const { id, user_name } = creator as unknown as {
                    id: string
                    user_name: string
                }
                creators.set(id, user_name)
            }
        })
        return Array.from(creators.entries()).map(([value, label]) => ({
            value,
            label,
        })) as SelectOption[]
    } catch (error) {
        console.error("Error fetching CI events creators:", error)
        throw new Error(
            `Failed to get CI events creators for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

async function createCIEvent(
    event: Omit<DBCIEvent, "id" | "cancelled_text">
): Promise<CIEvent> {
    try {
        const { data, error } = await supabase
            .from("ci_events")
            .insert(event)
            .select("*")
            .single()

        if (error)
            throw new Error(
                `Failed to create CI event for userId: ${store.getUserId} ERROR: ${error}`
            )

        const cieventId = data.id
        const teacherIds = utilService.getCIEventTeachers(data)
        const junctionData = teacherIds
            .filter((teacherId) => {
                return utilService.isUUID(teacherId)
            })
            .map((teacherId) => {
                return {
                    ci_event_id: cieventId,
                    user_id: teacherId,
                }
            })

        const { error: junctionError } = await supabase
            .from("ci_events_users_junction")
            .insert(junctionData)

        if (junctionError)
            throw new Error(
                `Create new junctionError.message for userId: ${store.getUserId} ERROR: ${junctionError.message}`
            )

        return data as CIEvent
    } catch (error) {
        console.error("Error creating CI event:", error)
        throw new Error(
            `Failed to create CI event for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

async function updateCIEvent(
    id: string,
    eventUpdate: Partial<CIEvent>
): Promise<CIEvent> {
    try {
        const { data, error } = await supabase
            .from("ci_events")
            .update(eventUpdate)
            .eq("id", id)
            .select("*")
            .single()

        if (error)
            throw new Error(
                `Failed to update CI event for id: ${id} for userId: ${store.getUserId} ERROR: ${error}`
            )

        const cieventId = data.id
        const teacherIds = utilService.getCIEventTeachers(data as CIEvent)

        for (const teacherId of teacherIds) {
            if (!utilService.isUUID(teacherId)) {
                continue
            }
            // Check if the junction already exists
            const { data: existingJunction, error: fetchError } = await supabase
                .from("ci_events_users_junction")
                .select("id")
                .eq("ci_event_id", cieventId)
                .eq("user_id", teacherId)

            if (fetchError) {
                console.error("Error checking existing junction:", fetchError)
                throw fetchError
            }

            // If the junction does not exist, insert it
            if (!existingJunction.length) {
                const { error: insertError } = await supabase
                    .from("ci_events_users_junction")
                    .insert({ ci_event_id: cieventId, user_id: teacherId })

                if (insertError) {
                    console.error("Error inserting junction:", insertError)
                    throw insertError
                }
            }
        }
        //TODO remove - removed teachers
        return data as CIEvent
    } catch (error) {
        console.error("Error updating CI event:", error)
        throw new Error(
            `Failed to update CI event for id: ${id} for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

async function updateMultipleCIEvents(
    ids: string[],
    eventUpdate: Partial<CIEvent>
): Promise<CIEvent[]> {
    try {
        const { data, error } = await supabase
            .from("ci_events")
            .update(eventUpdate)
            .in("id", ids)
            .select("*")

        if (error)
            throw new Error(
                `Failed to update multiple CI events for userId: ${store.getUserId} ERROR: ${error}`
            )
        return data as CIEvent[]
    } catch (error) {
        console.error("Error updating multiple CI events:", error)
        throw new Error(
            `Failed to update multiple CI events for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

async function deleteCIEvent(id: string): Promise<string> {
    try {
        const { data, error } = await supabase
            .from("ci_events")
            .delete()
            .eq("id", id)
            .select("id")
            .single()

        if (error)
            throw new Error(
                `Failed to delete CI event for id: ${id} for userId: ${store.getUserId} ERROR: ${error}`
            )

        return data.id
    } catch (error) {
        console.error("Error deleting CI event:", error)
        throw new Error(
            `Failed to delete CI event for id: ${id} for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

async function deleteMultipleCIEvents(ids: string[]): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from("ci_events")
            .delete()
            .in("id", ids)
            .select("id")

        if (error)
            throw new Error(
                `Failed to delete multiple CI events for userId: ${store.getUserId} ERROR: ${error}`
            )
        return data ? data.map((event) => event.id) : []
    } catch (error) {
        console.error("Error deleting multiple CI events:", error)
        throw new Error(
            `Failed to delete multiple CI events for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}
