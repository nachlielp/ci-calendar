import { UserRole } from "../util/interfaces"
import { supabase } from "./client"
import { wrapServiceError } from "./serviceError"

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
                },
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
                { onConflict: "user_id" },
            )
            .select()
            .single()

        if (updateError) throw updateError

        return roleData
    } catch (error) {
        wrapServiceError("Failed to update user role", error)
    }
}
