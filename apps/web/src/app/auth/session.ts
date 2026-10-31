import { onlineManager, type QueryClient } from "@tanstack/react-query"
import { LINKED_EVENT_KIND } from "../../features/calendar/linkedEvent"
import { PUBLIC_WINDOW_KIND } from "../../features/calendar/publicWindow"
import { afterLoadAndIdle } from "../afterLoadAndIdle"
import type { AppServices } from "../services"
import { forgetPersonalKeys } from "./personalStorage"
import { PROFILE_KIND, profileQuery, recordSignIn } from "./profile"

/**
 * The query kinds holding only public data. Every other query is personal
 * (or admin) and is removed from the cache when the user signs out or
 * changes, so a new kind is personal unless it is added here.
 */
export const PUBLIC_QUERY_KINDS: readonly string[] = [
    PUBLIC_WINDOW_KIND,
    LINKED_EVENT_KIND,
]

/**
 * Forgets the user who was signed in: their queries (personal and admin)
 * leave the cache, their keys leave device storage, this tab's
 * sessionStorage is cleared (as legacy did), and telemetry starts a new
 * anonymous visitor so the next person on the phone isn't joined to them.
 * The public window stays: it is the same for everyone.
 */
export function forgetUser(
    queryClient: QueryClient,
    { storage, session, telemetry }: AppServices,
) {
    queryClient.removeQueries({
        predicate: (query) =>
            !PUBLIC_QUERY_KINDS.includes(query.queryKey[0] as string),
    })
    // Keys named with `personalKey` (./personalStorage.ts); the auth
    // session's own keys are removed by `auth.signOut()`.
    forgetPersonalKeys(storage)
    try {
        session.clear()
    } catch {
        // As above.
    }
    telemetry.reset()
}

/**
 * Boot's part for auth, alongside the public window and never in its way:
 *
 * - A signed-in user (a session in storage) gets their profile row
 *   requested at once, in parallel with the window, and identified to
 *   telemetry; auth-js loads at the first idle moment to keep the token
 *   refreshed. Nothing waits for it.
 * - Whenever the user changes — signed out, or another signed in (this tab,
 *   another tab, or an auth redirect opening the app over a stored
 *   session) — the previous user is forgotten (`forgetUser`) and the new
 *   one identified.
 * - Once per boot and user, after their profile loads, their `users` row
 *   records the build and the sign-in (`recordSignIn`), as legacy did.
 *
 * A signed-out visitor costs nothing: no auth-js, no auth request.
 */
export function bootSession(queryClient: QueryClient, services: AppServices) {
    const { auth, telemetry } = services

    const initial = auth.session()
    if (initial) {
        void queryClient.prefetchQuery(profileQuery(services, initial.user.id))
        afterLoadAndIdle(auth.start)
    }

    // Whose data may be on the device: the stored session's user, even
    // while an auth redirect is being read.
    let userId = auth.bootUserId ?? undefined
    let identified: string | undefined
    const follow = () => {
        const session = auth.session()
        if (session === undefined) return
        const next = session?.user.id
        if (next !== userId) {
            if (userId) forgetUser(queryClient, services)
            userId = next
        }
        if (session && identified !== next) {
            telemetry.identify({
                id: session.user.id,
                email: session.user.email,
            })
        }
        identified = next
    }
    follow()

    const recorded = new Set<string>()
    const stopRecording = queryClient.getQueryCache().subscribe((event) => {
        if (event.type !== "updated" || event.action.type !== "success") return
        const [kind, id] = event.query.queryKey
        if (kind !== PROFILE_KIND || typeof id !== "string") return
        if (recorded.has(id) || !onlineManager.isOnline()) return
        recorded.add(id)
        recordSignIn(services, id)
    })

    const stopFollowing = auth.subscribe(follow)
    return () => {
        stopFollowing()
        stopRecording()
    }
}
