import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { useNavigate } from "react-router"
import { profileQuery } from "./auth/profile"
import { useServices } from "./services"

/** The `users.user_type` values legacy used. */
export type SignedInRole = "user" | "profile" | "creator" | "org" | "admin"

/** Who sees a menu item: signed out (`anonymous`) or a signed-in role. */
export type Role = "anonymous" | SignedInRole

/**
 * Who is looking at the app, as far as the header, menu and guards care.
 * `unknown` while that can't be told yet: a stored session whose profile
 * row is still loading, or an auth redirect being read. Nothing that
 * depends on the account (login, account pages) shows then, so a signed-in
 * user never sees login flash. `unavailable`: signed in, but the profile
 * row failed to load (or waits for a connection); they can still sign out
 * or try again.
 */
export type Viewer =
    | { role: "unknown" }
    | { role: "anonymous" }
    | {
          role: "unavailable"
          signOut: () => Promise<void>
          /** Asks for the profile row again. */
          retry: () => void
      }
    | {
          role: SignedInRole
          /** The `users.user_name`, shown in the header. */
          name: string
          /** Signed in with email and password (legacy `provider === "email"`). */
          signsInWithEmail: boolean
          /** Ends the session and returns to the calendar (the logout item). */
          signOut: () => Promise<void>
      }

export const ANONYMOUS: Viewer = { role: "anonymous" }
export const UNKNOWN: Viewer = { role: "unknown" }

/** The session at hand (`services.auth`), re-rendering when it changes. */
export function useSession() {
    const { auth } = useServices()
    return useSyncExternalStore(auth.subscribe, auth.session)
}

/**
 * The current viewer: decided from the stored session at first paint
 * (signed out: `anonymous` at once), then the signed-in user's role from
 * their profile row (`profileQuery`, requested at boot).
 */
export function useViewer(): Viewer {
    const services = useServices()
    const navigate = useNavigate()
    const session = useSession()
    const userId = session?.user.id
    const {
        data: profile,
        isError,
        fetchStatus,
        refetch,
    } = useQuery({
        ...profileQuery(services, userId ?? ""),
        enabled: !!userId,
    })

    const { auth } = services
    // Legacy signed out, then went home. Leaving first means a guarded page
    // never sees itself signed out and sends the visitor to the login page.
    const signOut = useCallback(async () => {
        await navigate("/")
        await auth.signOut()
    }, [auth, navigate])

    return useMemo((): Viewer => {
        if (session === undefined) return UNKNOWN
        if (session === null) return ANONYMOUS
        if (!profile || profile.id !== session.user.id) {
            return isError || fetchStatus === "paused"
                ? {
                      role: "unavailable",
                      signOut,
                      retry: () => void refetch(),
                  }
                : UNKNOWN
        }
        return {
            role: profile.role,
            name: profile.name,
            signsInWithEmail: profile.signsInWithEmail,
            signOut,
        }
    }, [session, profile, isError, fetchStatus, refetch, signOut])
}
