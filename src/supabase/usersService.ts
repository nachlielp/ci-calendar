import { supabase } from "./client"
import { UserBio, DbUser, UserType } from "../util/interfaces"

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
    getTaggableTeachers,
    getViewableTeachers,
    subscribeToUser,
}

async function getUser(id: string): Promise<DbUser | null> {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", id)
            .single()

        if (error) {
            if (error.code === "PGRST116") {
                console.log("No user found with id:", id)
                return null
            }
            throw error
        }
        return data as DbUser
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

async function createUser(user: DbUser): Promise<DbUser | null> {
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

async function getTaggableTeachers(): Promise<
    { label: string; value: string }[]
> {
    try {
        const { data: currentUser, error: userError } =
            await supabase.auth.getUser()
        if (userError) throw userError

        const { data, error } = await supabase
            .from("users")
            .select("user_id, full_name, user_type, allow_tagging")
            .or(`allow_tagging.eq.true,user_id.eq.${currentUser.user.id}`)

        if (error) throw error

        return data.map((user) => ({
            label: user.full_name,
            value: user.user_id,
        }))
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
            { event: "*", schema: "public", table: "users" },
            (payload) => {
                callback(payload)
            }
        )
        .subscribe()

    return channel
}
