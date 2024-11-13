import { supabase } from "./client"
import {
    UserBio,
    DbUser,
    UserType,
    DbUserWithoutJoin,
} from "../util/interfaces"
import dayjs from "dayjs"

export type ManageUserOption = {
    user_id: string
    user_name: string
    user_type: UserType
    email: string
    role: {
        id: number
        role: string
    }
}
export const usersService = {
    getUsers,
    getUser,
    updateUser,
    createUser,
    getTaggableUsers,
    getViewableTeachers,
    getPublicBioList,
    subscribeToUser,
}

interface UserWithRole {
    user_id: string
    user_name: string
    user_type: UserType
    email: string
    user_role: {
        role: {
            id: number
            role: string
        }
    }
}

async function getUser(id: string): Promise<DbUser | null> {
    try {
        const { data, error } = await supabase
            .from("users")
            .select(
                `
            *,
            notifications!left (
                id,
                ci_event_id,
                remind_in_hours,
                is_sent,
                ci_events!inner (
                    title,
                    start_date,
                    segments
                )
            ),
            requests!left (
                *
            ),
            templates!left (
                *
            ),
            bio:public_bio!left (
                *
            ),
            ci_events:ci_events!left (
                *
            )
        `
            )
            .eq("user_id", id)
            .eq("notifications.user_id", id)
            .eq("notifications.is_sent", false)
            .eq("requests.user_id", id)
            .eq("templates.user_id", id)
            .eq("public_bio.user_id", id)
            .eq("ci_events.user_id", id)
            .single()

        if (error) {
            if (error.code === "PGRST116") {
                console.log("No user found with id:", id)
                return null
            }
        }

        const notifications = data?.notifications
            .map((notification: any) => {
                const title = notification.ci_events.title
                const start_date = notification.ci_events.start_date

                const formattedNotification = {
                    ...notification,
                    title,
                    start_date,
                    firstSegment: notification.ci_events.segments[0],
                }
                delete formattedNotification.ci_events
                return formattedNotification
            })
            .filter((notification: any) => {
                if (notification.start_date)
                    return dayjs(notification.start_date)
                        .endOf("day")
                        .isAfter(dayjs())
                return true
            })
        return { ...data, notifications } as unknown as DbUser
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
        const { data } = (await supabase.from("users").select(`
            user_id,
            user_name,
            user_type,
            email,
            user_role:user_roles(
                role:roles(
                id,
                    role
                )
            )
        `)) as { data: UserWithRole[] }

        if (!data) return []

        const users = data.map((user) => {
            if (!user.user_role) {
                const newUser = { ...user, role: null } as Partial<UserWithRole>
                delete newUser.user_role
                return newUser
            }

            const { role } = user.user_role

            const newUser = { ...user, role: null } as Partial<UserWithRole>
            if (newUser.user_role) delete newUser.user_role
            return {
                ...newUser,
                role: role,
            }
        })

        return users as ManageUserOption[]
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
                user_id,
                bio_name,
                user_type
            `
            )
            .eq("allow_tagging", true)

        if (error) throw error

        const teachers = data.map((teacher) => {
            return {
                user_id: teacher.user_id,
                bio_name: teacher.bio_name,
                user_type: teacher.user_type,
            }
        })

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
                "id,user_id, bio_name, img, about, page_url, page_title, show_profile, allow_tagging,user_type"
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
async function getPublicBioList(): Promise<UserBio[]> {
    try {
        const { data, error } = await supabase
            .from("public_bio")
            .select(
                "id,user_id, bio_name, img, about, page_url, page_title, show_profile, allow_tagging,user_type"
            )
            .eq("show_profile", true)

        if (error) throw error

        const filteredData = data.filter((user) => user.bio_name !== "")
        return filteredData as UserBio[]
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
                table: "ci_events",
                filter: `user_id=eq.${userId}`,
            },

            (payload) => {
                callback({ table: "ci_events", payload })
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
                filter: `user_id=eq.${userId}`,
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
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                //TODO handle delete
                callback({ table: "templates", payload })
            }
        )
        .subscribe()

    return channel
}
