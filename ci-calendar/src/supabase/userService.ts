import { supabase } from "./client"
import { UserBio, DbUser, UserType } from "../util/interfaces"

export type ManageUserOption = {
    user_id: string
    fullName: string
    user_type: UserType
    email: string
}
export const userService = {
    getUsers,
    getUser,
    updateUser,
    createUser,
    getTaggableTeachers,
    getViewableTeachers,
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
    console.log("updateUser: ", user)
    console.log("id: ", id)
    try {
        const { data, error } = await supabase
            .from("users")
            .update(user)
            .eq("user_id", id)
            .select()

        if (error) {
            throw error
        }
        console.log("Updated user data: ", data)
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
            .select("user_id,fullName,user_type,email")
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
            .select("user_id, fullName, user_type, allowTagging")
            .or(`allowTagging.eq.true,user_id.eq.${currentUser.user.id}`)

        if (error) throw error

        return data.map((user) => ({
            label: user.fullName,
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
                "user_id, fullName, img, bio, pageUrl, pageTitle, showProfile, allowTagging"
            )
            .in("user_id", teacherIds)
            .eq("showProfile", true)
        if (error) throw error
        console.log("viewable teachers", data)
        return data as UserBio[]
    } catch (error) {
        console.error("Error fetching viewable teachers:", error)
        throw error
    }
}
