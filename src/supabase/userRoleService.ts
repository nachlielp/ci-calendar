import { UserRole, UserType } from "../util/interfaces"
import { supabase } from "./client"

export const userRoleService = {
    updateUserRole,
}

async function updateUserRole({
    user_id,
    user_type,
    role_id,
}: UserRole): Promise<UserType> {
    try {
        // Update user_roles table
        const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .upsert(
                { user_id, role_id: role_id },
                {
                    onConflict: "user_id",
                    ignoreDuplicates: false,
                }
            )
            .select()
            .single()

        if (roleError) throw roleError

        // Update users table
        const { error: userError } = await supabase
            .from("users")
            .update({ user_type: user_type })
            .eq("id", user_id)

        if (userError) throw userError

        // Update public_bio table
        const { error: updateError } = await supabase
            .from("public_bio")
            .upsert(
                { user_type: user_type, user_id: user_id },
                { onConflict: "user_id" }
            )
            .select()
            .single()

        if (updateError) {
            throw updateError
        }
        if (user_type !== UserType.user) {
            // if (updateError) {
            //     const { code } = updateError as PostgrestError
            //     if (code === "PGRST116" && !updateData) {
            //         const { error: insertError } = await supabase
            //             .from("public_bio")
            //             .insert({
            //                 user_id: user_id,
            //                 user_type: user_type,
            //             })
            //     } else if (updateError) {
            //         throw updateError
            //     }
            //     // If no rows were updated, do an insert
            // }
        }

        return roleData
    } catch (error) {
        console.error("Failed to update user role:", error)
        throw new Error("Failed to update user role")
    }
}
