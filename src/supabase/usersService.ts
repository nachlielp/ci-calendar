import { supabase } from "./client"
import {
    UserBio,
    DbUser,
    UserType,
    DbUserWithoutJoin,
} from "../util/interfaces"

export type ManageUserOption = {
    user_id: string
    user_name: string
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
            ,templates:templates (
                *
            ),
            bio:public_bio (
                *
            )
        `
            )
            .eq("user_id", id)
            .eq("notifications.is_sent", false)
            .single()
        console.log("data", data)
        if (error) {
            if (error.code === "PGRST116") {
                console.log("No user found with id:", id)
                return null
            }
            throw error
        }

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
            .select("user_id,user_name,user_type,email")
        return data as ManageUserOption[]
    } catch (error) {
        console.error("Error in getUsers:", error)
        return []
    }
}

async function getTaggableUsers(): Promise<
    { user_id: string; bio_name: string; user_type: UserType }[]
> {
    try {
        const { data, error } = await supabase
            .from("public_bio")
            .select(
                `
            created_by,
            bio_name,
            users!inner (
                user_type
            )
        `
            )
            .eq("allow_tagging", true)

        if (error) throw error

        const teachers = data.map((teacher) => {
            const { users } = teacher
            const { user_type } = users as unknown as { user_type: UserType }

            return {
                user_id: teacher.created_by,
                bio_name: teacher.bio_name,
                user_type: user_type,
            }
        })
        console.log("teachers", teachers)
        // return data || []
        return teachers
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
                "user_id, bio_name, img, bio, page_url, page_title, show_profile, allow_tagging"
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

async function subscribeToUser(
    userId: string,
    callback: (payload: any) => void
) {
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
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "templates",
                filter: `created_by=eq.${userId}`,
            },
            (payload) => {
                //TODO handle delete
                console.log("templates payload", payload)
                callback({ table: "templates", payload })
            }
        )
        .subscribe()

    return channel
}
