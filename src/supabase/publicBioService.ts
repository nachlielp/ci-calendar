import { supabase } from "./client"
import { UserBio } from "../util/interfaces"

export const publicBioService = {
    getTeacherBio,
    updateTeacherBio,
    deleteTeacherBio,
}

async function getTeacherBio(userId: string): Promise<UserBio | null> {
    try {
        const { data, error } = await supabase
            .from("teachers_public_bio")
            .select("*")
            .eq("created_by", userId)

        if (error) {
            console.error("Error fetching teacher bio:", error.message)
            throw error
        }

        return data?.[0] || null
    } catch (error) {
        console.error("Failed to fetch teacher bio:", error)
        throw new Error("Failed to fetch teacher bio")
    }
}

async function updateTeacherBio(bio: UserBio): Promise<void> {
    try {
        const { error } = await supabase
            .from("teachers_public_bio")
            .upsert(bio, {
                onConflict: "created_by", // Specify the unique constraint
                ignoreDuplicates: false, // Update if exists
            })

        if (error) {
            console.error("Error updating teacher bio:", error.message)
            throw error
        }
    } catch (error) {
        console.error("Failed to update teacher bio:", error)
        throw new Error("Failed to update teacher bio")
    }
}

async function deleteTeacherBio(userId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from("teachers_public_bio")
            .delete()
            .eq("created_by", userId)

        if (error) {
            console.error("Error deleting teacher bio:", error.message)
            throw error
        }
    } catch (error) {
        console.error("Failed to delete teacher bio:", error)
        throw new Error("Failed to delete teacher bio")
    }
}
