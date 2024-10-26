import { supabase } from "./client"
import {
    UserBio,
    DbUser,
    UserType,
    DbUserWithoutJoin,
} from "../util/interfaces"

export type ManageUserOption = {
    user_id: string
    full_name: string
    user_type: UserType
    email: string
}
export const usersService = {
    getUsers,
    getUser,
    updateUser,
    createUser,
    getTaggableUsers,
    getViewableTeachers,
    subscribeToUser,
}

async function getUser(id: string): Promise<DbUser | null> {
    try {
        const { data, error } = await supabase
            .from("users")
            .select(
                `
            *,
            notifications:notifications (
                id,
                ci_event_id,
                remind_in_hours,
                is_sent
            ),
            requests:requests (
                *
            )
        `
            )
            .eq("user_id", id)
            .eq("notifications.is_sent", false)
            .single()

        if (error) {
            if (error.code === "PGRST116") {
                console.log("No user found with id:", id)
                return null
            }
            throw error
        }
        console.log("data", data)
        return data as unknown as DbUser
    } catch (error) {
        console.error("Error in getUser:", error)
        return null
    }
}

async function updateUser(
    id: string,
    user: Partial<DbUser>
): Promise<DbUser | null> {
    try {
        const { data, error } = await supabase
            .from("users")
            .update(user)
            .eq("user_id", id)
            .select()

        if (error) {
            throw error
        }
        return data[0] as DbUser
    } catch (error) {
        console.error("Error in updateUser:", error)
        return null
    }
}

async function createUser(user: DbUserWithoutJoin): Promise<DbUser | null> {
    try {
        const { data, error } = await supabase
            .from("users")
            .insert(user)
            .select()
            .single()

        if (error) {
            throw error
        }
        return data as DbUser
    } catch (error) {
        console.error("Error in createUser:", error)
        return null
    }
}

async function getUsers(): Promise<ManageUserOption[]> {
    try {
        const { data } = await supabase
            .from("users")
            .select("user_id,full_name,user_type,email")
        return data as ManageUserOption[]
    } catch (error) {
        console.error("Error in getUsers:", error)
        return []
    }
}

async function getTaggableUsers(): Promise<
    { user_id: string; full_name: string; user_type: UserType }[]
> {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("user_id, full_name, user_type")
            .eq("show_profile", true)
            .neq("user_type", UserType.user)

        if (error) throw error

        return data || []
    } catch (error) {
        console.error("Error fetching taggable teachers:", error)
        throw error
    }
}

async function getViewableTeachers(teacherIds: string[]): Promise<UserBio[]> {
    try {
        const { data, error } = await supabase
            .from("users")
            .select(
                "user_id, full_name, img, bio, page_url, page_title, show_profile, allow_tagging"
            )
            .in("user_id", teacherIds)
            .eq("show_profile", true)

        if (error) throw error
        return data as UserBio[]
    } catch (error) {
        console.error("Error fetching viewable teachers:", error)
        throw error
    }
}

function subscribeToUser(userId: string, callback: (payload: any) => void) {
    const channel = supabase
        .channel(`public:users:user_id=eq.${userId}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "users",
                filter: `user_id=eq.${userId}`,
            },

            (payload) => {
                callback({ table: "users", payload })
            }
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${userId}`,
            },

            (payload) => {
                callback({ table: "notifications", payload })
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "requests",
                filter: `created_by=eq.${userId}`,
            },
            (payload) => {
                callback({ table: "requests", payload })
            }
        )
        .subscribe()

    return channel
}
