import { supabase } from "./client"
import {
    UserBio,
    DbUser,
    UserType,
    DbUserWithoutJoin,
    CIUser,
    CIUserData,
    TaggableUserOptions,
    ManageUserOption,
} from "../util/interfaces"
import dayjs from "dayjs"

export const usersService = {
    getUsers,
    getUserData,
    updateUser,
    createUser,
    getTaggableUsers,
    getPublicBioList,
    subscribeToUser,
}

interface UserWithRole {
    id: string
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

async function getUserData(id: string): Promise<CIUserData | null> {
    try {
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select(
                `
            *,
            notifications!left (
                id,
                ci_event_id,
                remind_in_hours,
                sent,
                ci_events!inner (
                    title,
                    start_date,
                    segments,
                    is_multi_day
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
            ),
            alerts:alerts!left (
                id,
                ci_event_id,
                request_id,
                user_id,
                viewed
            )
        `
            )
            .eq("id", id)
            .eq("notifications.user_id", id)
            .eq("notifications.sent", false)
            .eq("requests.user_id", id)
            .eq("templates.user_id", id)
            .eq("public_bio.user_id", id)
            .eq("ci_events.user_id", id)
            .lte("ci_events.start_date", dayjs().endOf("day").toISOString())
            .eq("alerts.user_id", id)
            .eq("alerts.viewed", false)
            .single()

        console.log("userData", userData)

        const { data: eventsData, error: eventsError } = await supabase
            .from("ci_events")
            .select("*")
            .gte("start_date", dayjs().startOf("day").toISOString())

        if (userError) throw userError
        if (eventsError) throw eventsError

        const notifications = userData?.notifications
            .map((notification: any) => {
                const title = notification.ci_events.title
                const start_date = notification.ci_events.start_date

                const formattedNotification = {
                    ...notification,
                    title,
                    start_date,
                    firstSegment: notification.ci_events.segments[0],
                    is_multi_day: notification.ci_events.is_multi_day,
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

        const alerts = userData.alerts.map((alert: any) => {
            const event = eventsData.find(
                (event) => event.id === alert.ci_event_id
            )
            const request = userData.requests.find(
                (request: any) => request.id === alert.request_id
            )
            let formattedAlert = {
                ...alert,
                title: event?.title || "",
                start_date: event?.start_date || "",
                firstSegment: event?.segments[0] || "",
                address: event?.address.label || "",
                type: request?.type || "",
            }
            delete formattedAlert.ci_events
            return formattedAlert
        })

        const templates = userData.templates
        const requests = userData.requests
        const past_ci_events = userData.ci_events
        const userBio = userData.bio

        const user = { ...userData }

        delete user.notifications
        delete user.alerts
        delete user.templates
        delete user.requests
        delete user.ci_events
        delete user.bio

        return {
            user,
            notifications,
            alerts,
            templates,
            requests,
            ci_events: eventsData,
            past_ci_events,
            userBio,
        } as unknown as CIUserData
    } catch (error) {
        console.error("Error in getUser:", error)
        return null
    }
}

async function updateUser(
    id: string,
    user: Partial<DbUser>
): Promise<CIUser | null> {
    try {
        const { data, error } = await supabase
            .from("users")
            .update(user)
            .eq("id", id)
            .select()
            .single()
        if (error) {
            throw error
        }
        return data as CIUser
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
            console.error("Error in createUser:", error)
            throw error
        }
        return data as DbUser
    } catch (error) {
        console.error("Error in createUser:", error)
        return null
    }
}

//TODO: remove this once all users are on the right version - 1.2.0
async function getUsers(): Promise<ManageUserOption[]> {
    try {
        const { data } = (await supabase.from("users").select(`
            id,
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

async function getTaggableUsers(): Promise<TaggableUserOptions[]> {
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
    userType: UserType,
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
                filter: `start_date=gte.${dayjs()
                    .startOf("day")
                    .toISOString()}`,
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
                event: "*",
                schema: "public",
                table: "requests",
                filter:
                    userType === "admin" ? undefined : `user_id=eq.${userId}`,
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
                table: "public_bio",
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                callback({ table: "public_bio", payload })
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
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "alerts",
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                callback({ table: "alerts", payload })
            }
        )
        .subscribe((status) => {
            if (status === "SUBSCRIBED") {
                console.log("Successfully subscribed to changes")
            }
            if (status === "CLOSED") {
                console.log("Subscription closed")
            }
            if (status === "CHANNEL_ERROR") {
                console.log("There was an error subscribing to changes")
            }
        })

    return channel
}
