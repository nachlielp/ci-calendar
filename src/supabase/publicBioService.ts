import { supabase } from "./client"
import { TaggableUserOptions, UserBio } from "../util/interfaces"
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
                onConflict: "user_id", // Specify the unique constraint
                ignoreDuplicates: false, // Update if exists
            })
            .select()
            .single()

        if (error)
            throw new Error(
                `Failed to update teacher bio for userId: ${store.getUserId} ERROR: ${error}`
            )

        return data
    } catch (error) {
        throw new Error(
            `Failed to update teacher bio for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

async function deleteTeacherBio(userId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from("teachers_public_bio")
            .delete()
            .eq("user_id", userId)

        if (error) {
            throw new Error(
                `Failed to delete teacher bio for userId: ${store.getUserId} ERROR: ${error}`
            )
        }
    } catch (error) {
        throw new Error(
            `Failed to delete teacher bio for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

//For display in event cards
async function getPublicBioList(): Promise<UserBio[]> {
    try {
        const { data, error } = await supabase
            .from("public_bio")
            .select(
                "id,user_id, bio_name, img, about, page_url, page_title, show_profile, allow_tagging,user_type"
            )
            .eq("show_profile", true)
            .not("bio_name", "eq", "")

        if (error)
            throw new Error(
                `Failed to get public bio list for userId: ${store.getUserId} ERROR: ${error}`
            )
        const filteredData = data.filter((user) => user.bio_name !== "")
        return filteredData as UserBio[]
    } catch (error) {
        throw new Error(
            `Failed to get public bio list for userId: ${store.getUserId} ERROR: ${error}`
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
        if (error)
            throw new Error(
                `Failed to get taggable teachers for userId: ${store.getUserId} ERROR: ${error}`
            )

        const teachers = data.map((teacher) => {
            return {
                user_id: teacher.user_id,
                bio_name: teacher.bio_name,
                user_type: teacher.user_type,
            }
        })
        return teachers
    } catch (error) {
        throw new Error(
            `Failed to get taggable teachers for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}
