import type { AuthSession } from "../../data/auth"
import { STALE_MS } from "@ci-calendar/core/lib/freshness"
import type { AppServices } from "../services"
import { useSession } from "../viewer"

/**
 * Freshness for a page's personal (or admin) query: fetched when its page
 * mounts, even if cached, and again when the app comes back after
 * `STALE_MS`. Never persisted (it isn't in `PERSISTED_SHAPES`), and
 * forgotten on sign-out (it isn't in `PUBLIC_QUERY_KINDS`).
 */
export const PERSONAL_FRESHNESS = {
    staleTime: STALE_MS,
    refetchOnMount: "always",
} as const

/**
 * The session to send a personal request with: waits for a token that is
 * good (refreshed if it had to be), and fails if the user signed out or
 * another signed in meanwhile. Every personal query and save starts with it.
 */
export async function sessionOf(
    { auth }: AppServices,
    userId: string,
): Promise<AuthSession> {
    const session = await auth.ready()
    if (!session || session.user.id !== userId) throw new Error("Signed out")
    return session
}

/**
 * The signed-in user's id, for pages inside `requireRole` (`""` in the
 * moment a sign-out takes them away). Key personal queries on it and
 * enable them only when it is set.
 */
export function useUserId(): string {
    return useSession()?.user.id ?? ""
}
