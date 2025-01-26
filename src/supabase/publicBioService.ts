import { supabase } from "./client"
import { TaggableUserOptions, UserBio, UserType } from "../util/interfaces"
import { store } from "../Store/store"

export const publicBioService = {
    updateTeacherBio,
    deleteTeacherBio,
    getPublicBioList,
    getTaggableUsers,
}

async function updateTeacherBio(bio: Partial<UserBio>): Promise<UserBio> {
    try {
        const { data, error } = await supabase
            .from("public_bio")
            .upsert(bio, {
                onConflict: "user_id",
                ignoreDuplicates: false,
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to update teacher bio for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function deleteTeacherBio(userId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from("teachers_public_bio")
            .delete()
            .eq("user_id", userId)

        if (error) throw error
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to delete teacher bio for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

//For display in event cards
async function getPublicBioList(): Promise<UserBio[]> {
    try {
        const { data, error } = await supabase
            .from("public_bio")
            .select(
                "id, user_id, bio_name, img, about, page_url, page_title, page_url_2, page_title_2, show_profile, allow_tagging, user_type"
            )
            .eq("show_profile", true)
            .not("user_type", "eq", UserType.admin)
            .not("bio_name", "eq", "")

        if (error) throw error

        const filteredData = data.filter((user) => user.bio_name !== "")
        return filteredData as UserBio[]
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to get public bio list for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

//For teacher to tag each other
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
            .not("bio_name", "eq", "")

        if (error) throw error

        const teachers = data.map((teacher) => ({
            user_id: teacher.user_id,
            bio_name: teacher.bio_name,
            user_type: teacher.user_type,
        }))
        return teachers
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to get taggable teachers for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}
