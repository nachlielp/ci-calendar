import { supabase } from "./client"
import { CIEvent } from "../util/interfaces"
import { utilService } from "../util/utilService"
import dayjs from "dayjs"
import { SelectOption } from "../util/options"

export interface FilterOptions {
    start_date?: string
    end_date?: string
    creator_id?: string
    sort_by?: string
    sort_direction?: "asc" | "desc"
    hide?: boolean
    future_events?: boolean
    creator_name?: string
}

export type DBCIEvent = Omit<CIEvent, "id" | "users" | "creator">

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
        if (error) throw error
        return data as CIEvent
    } catch (error) {
        console.error("Error fetching CI event:", error)
        throw error
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
            creator:users (
                    full_name,
                    user_id
                ),
            ci_events_users_junction (
                user_id,
                users (
                    user_id,
                    full_name,
                    img,
                    bio,
                    page_url,
                    page_title,
                    show_profile,
                    allow_tagging
                )
            )
        `
            )
            .eq("ci_events_users_junction.users.show_profile", true)
        // .eq("creator.user_id", "creator_id") // Ensure the join condition is correct

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
        if (filterBy?.creator_id && filterBy.creator_id.length) {
            query = query.eq("creator_id", filterBy.creator_id)
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

        if (error) throw error

        const eventsWithUsers = data.map((event) => {
            const { creator, ci_events_users_junction } = event
            const users = ci_events_users_junction
                .map((user: any) => user.users)
                .filter((user: any) => user)
            delete event.ci_events_users_junction
            return { ...event, creator_name: creator.full_name, users }
        })
        return eventsWithUsers as CIEvent[]
    } catch (error) {
        console.error("Error fetching CI events:", error)
        throw error
    }
}

async function getCIEventsCreators(): Promise<SelectOption[]> {
    try {
        const { data, error } = await supabase.from("ci_events")
            .select(`creator:users (
            full_name,
            user_id
        )`)

        if (error) throw error

        const creators = new Map<string, string>()

        data.forEach((event) => {
            const { creator } = event
            if (creator) {
                const { user_id, full_name } = creator as unknown as {
                    user_id: string
                    full_name: string
                }
                creators.set(user_id, full_name)
            }
        })
        return Array.from(creators.entries()).map(([value, label]) => ({
            value,
            label,
        })) as SelectOption[]
    } catch (error) {
        console.error("Error fetching CI events creators:", error)
        throw error
    }
}

async function createCIEvent(event: DBCIEvent): Promise<CIEvent> {
    try {
        const { data, error } = await supabase
            .from("ci_events")
            .insert(event)
            .select("*")
            .single()

        if (error) throw error

        const cieventId = data.id
        const teacherIds = utilService.getCIEventTeachers(event)
        const junctionData = teacherIds.map((teacherId) => {
            return {
                ci_event_id: cieventId,
                user_id: teacherId,
            }
        })

        const { error: junctionError } = await supabase
            .from("ci_events_users_junction")
            .insert(junctionData)

        if (junctionError) throw junctionError

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
            .from("ci_events")
            .update(eventUpdate)
            .eq("id", id)
            .select("*")
            .single()

        if (error) throw error

        const cieventId = data.id
        const teacherIds = utilService.getCIEventTeachers(data as CIEvent)

        for (const teacherId of teacherIds) {
            console.log("teacherId: ", teacherId)
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
        throw error
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
            .from("ci_events")
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
            .from("ci_events")
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
