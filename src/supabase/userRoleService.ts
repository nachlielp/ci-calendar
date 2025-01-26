import { UserRole, UserType } from "../util/interfaces"
import { store } from "../Store/store"
import { supabase } from "./client"

export const userRoleService = {
    updateUserRole,
}

async function updateUserRole({
    user_id,
    user_type,
    role_id,
}: UserRole): Promise<UserRole> {
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

        if (roleError) {
            const errorMessage =
                roleError instanceof Error
                    ? roleError.message
                    : JSON.stringify(roleError, null, 2)
            throw new Error(
                `Failed to update user role for userId: ${store.getUserId} ERROR: ${errorMessage}`
            )
        }

        // Update users table
        const { error: userError } = await supabase
            .from("users")
            .update({ user_type: user_type })
            .eq("id", user_id)

        if (userError) {
            const errorMessage =
                userError instanceof Error
                    ? userError.message
                    : JSON.stringify(userError, null, 2)
            throw new Error(
                `Failed to update user for userId: ${store.getUserId} ERROR: ${errorMessage}`
            )
        }

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
            const errorMessage =
                updateError instanceof Error
                    ? updateError.message
                    : JSON.stringify(updateError, null, 2)
            throw new Error(
                `Failed to update public bio for userId: ${store.getUserId} ERROR: ${errorMessage}`
            )
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
    } catch (error: any) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to update user role for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}
