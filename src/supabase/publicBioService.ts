import { supabase } from "./client"
import { UserBio } from "../util/interfaces"

export const publicBioService = {
    updateTeacherBio,
    deleteTeacherBio,
}

async function updateTeacherBio(bio: UserBio): Promise<UserBio> {
    try {
        const { data, error } = await supabase
            .from("public_bio")
            .upsert(bio, {
                onConflict: "user_id", // Specify the unique constraint
                ignoreDuplicates: false, // Update if exists
            })
            .select()
            .single()

        if (error) {
            console.error("Error updating teacher bio:", error.message)
            throw error
        }
        return data
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
            .eq("user_id", userId)

        if (error) {
            console.error("Error deleting teacher bio:", error.message)
            throw error
        }
    } catch (error) {
        console.error("Failed to delete teacher bio:", error)
        throw new Error("Failed to delete teacher bio")
    }
}
