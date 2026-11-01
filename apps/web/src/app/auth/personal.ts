import { useSession } from "../viewer"

/**
 * The signed-in user's id, for pages inside `requireRole` (`""` in the
 * moment a sign-out takes them away). Key personal queries on it and
 * enable them only when it is set.
 */
export function useUserId(): string {
    return useSession()?.user.id ?? ""
}
