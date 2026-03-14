import { supabase } from "./client"
import {
    DbUser,
    UserType,
    DbUserWithoutJoin,
    CIUser,
    CIUserData,
    ManageUserOption,
    WeeklyScheduleFilters,
} from "../util/interfaces"
import dayjs from "dayjs"
import { store } from "../Store/store"

export const usersService = {
    getUsers,
    getUserData,
    updateUser,
    createUser,
    subscribeToUser,
    updateUserWeeklyScheduleFilters,
    toggleUserReceiveWeeklySchedule,
    updateUserPhoneNumber,
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
        const [userResponse, eventsResponse] = await Promise.all([
            // First query - user data
            supabase
                .from("users")
                .select(
                    `
                    *,
                    requests!left (*),
                    templates!left (*),
                    bio:public_bio!left (*),
                    ci_events:ci_events!left (*)
                `
                )
                .eq("id", id)
                .eq("requests.user_id", id)
                .eq("templates.user_id", id)
                .eq("public_bio.user_id", id)
                .eq("ci_events.user_id", id)
                .single(),

            // Second query - events data
            supabase
                .from("ci_events")
                .select("*")
                .gte("start_date", dayjs().startOf("day").toISOString())
                .lte(
                    "start_date",
                    dayjs().endOf("day").add(30, "day").toISOString()
                ),
        ])

        const { data: userData, error: userError } = userResponse
        const { data: eventsData, error: eventsError } = eventsResponse

        if (userError) {
            // Check specifically for not found error
            if (userError.code === "PGRST116") {
                return null
            }
            throw new Error(`Database error: ${userError.message}`)
        }
        if (eventsError)
            throw new Error(
                `Failed to get events data for userId: ${id} ERROR: ${JSON.stringify(
                    eventsError,
                    null,
                    2
                )}`
            )

        const templates = userData.templates
        const requests = userData.requests
        const past_ci_events = userData.ci_events.filter((event: any) =>
            dayjs(event.start_date)
                .startOf("day")
                .isBefore(dayjs().startOf("day"))
        )
        const future_ci_events = userData.ci_events.filter((event: any) =>
            dayjs(event.start_date)
                .startOf("day")
                .isAfter(dayjs().startOf("day"))
        )
        const userBio = userData.bio

        const user = { ...userData }

        delete user.templates
        delete user.requests
        delete user.ci_events
        delete user.bio

        return {
            user,
            templates,
            requests,
            ci_events: eventsData,
            past_ci_events,
            future_ci_events,
            userBio,
        } as unknown as CIUserData
    } catch (error: any) {
        console.error("Error in getUser:", error)
        if (
            error.message === "NO_USER_ID" ||
            error.message === "USER_DOES_NOT_EXIST"
        ) {
            throw error
        }
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(`Failed to get user data: ${errorMessage}`)
    }
    //TODO hanldle errors in getUserData in a way that reports to snetry and does not break the workflow
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
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error, null, 2)
            throw new Error(
                `Failed to update user for userId: ${store.getUserId} ERROR: ${errorMessage}`
            )
        }
        return data as CIUser
    } catch (error: any) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to update user for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function createUser(user: DbUserWithoutJoin): Promise<DbUser | null> {
    console.log("__A_createUser", user)
    try {
        const { data, error } = await supabase
            .from("users")
            .insert(user)
            .select()
            .single()

        if (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error, null, 2)
            throw new Error(
                `_1_Failed to create user for userId: ${store.getUserId} ERROR: ${errorMessage}`
            )
        }
        console.log("__B_createUser", data)
        return data as DbUser
    } catch (error: any) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `_2_Failed to create user for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function getUsers(): Promise<ManageUserOption[]> {
    try {
        const { data } = (await supabase.from("users").select(`
            id,
            user_name,
            user_type,
            email,
            phone,
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
    } catch (error: any) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to get users for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function updateUserWeeklyScheduleFilters(
    id: string,
    weeklyScheduleFilters: WeeklyScheduleFilters,
    phone: string
) {
    try {
        const { data, error } = await supabase
            .from("users")
            .update({
                weekly_schedule: weeklyScheduleFilters,
                phone: phone,
            })
            .eq("id", id)
            .select()
            .single()
        if (error) {
            throw new Error(
                `Failed to update user newsletter filter for userId: ${id} ERROR: ${error.message}`
            )
        }
        return data
    } catch (error: any) {
        throw new Error(
            `Failed to update user newsletter filter for userId: ${id} ERROR: ${error.message}`
        )
    }
}

async function toggleUserReceiveWeeklySchedule(
    id: string,
    receive_weekly_schedule: boolean
) {
    try {
        const { data, error } = await supabase
            .from("users")
            .update({ receive_weekly_schedule })
            .eq("id", id)
            .select()
            .single()
        if (error) {
            throw new Error(
                `Failed to toggle user receive weekly schedule for userId: ${id} ERROR: ${error.message}`
            )
        }
        return data
    } catch (error: any) {
        throw new Error(
            `Failed to toggle user receive weekly schedule for userId: ${id} ERROR: ${error.message}`
        )
    }
}

async function updateUserPhoneNumber(id: string, phoneNumber: string) {
    try {
        const { data, error } = await supabase
            .from("users")
            .update({ phone: phoneNumber })
            .eq("id", id)
            .select()
            .single()
        if (error) {
            throw new Error(
                `Failed to update user phone number for userId: ${id} ERROR: ${error.message}`
            )
        }
        return data
    } catch (error: any) {
        throw new Error(
            `Failed to update user phone number for userId: ${id} ERROR: ${error.message}`
        )
    }
}

async function subscribeToUser(
    userType: UserType,
    userId: string,
    callback: (payload: any) => void
) {
    const channel = supabase
        .channel(`public:users:id=eq.${userId}`)

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "users",
                filter: `id=eq.${userId}`,
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
