import type { AuthSession } from "../../data/auth"
import { STALE_MS } from "../../lib/freshness"
import type { CoreServices } from "../services"

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
    { auth }: Pick<CoreServices, "auth">,
    userId: string,
): Promise<AuthSession> {
    const session = await auth.ready()
    if (!session || session.user.id !== userId) throw new Error("Signed out")
    return session
}
