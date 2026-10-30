import { UserRole } from "../util/interfaces"
import { supabase } from "./client"
import { wrapServiceError } from "./serviceError"

export const userRoleService = {
    updateUserRole,
}

// Role assignment is one atomic, admin-gated operation performed by the
// `assign_user_role` Postgres function (see
// supabase/migrations/20260808000000_assign_user_role.sql and docs/rls.md). It
// replaces the previous three sequential client writes (user_roles, users,
// public_bio) that had no transaction and leaned on unverified table policies.
async function updateUserRole({
    user_id,
    user_type,
    role_id,
}: UserRole): Promise<UserRole> {
    try {
        const { data, error } = await supabase.rpc("assign_user_role", {
            p_user_id: user_id,
            p_role_id: role_id,
            p_user_type: user_type,
        })

        if (error) throw error

        return data as UserRole
    } catch (error) {
        wrapServiceError("Failed to update user role", error)
    }
}
