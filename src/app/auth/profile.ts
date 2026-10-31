import { queryOptions } from "@tanstack/react-query"
import type { AuthUser } from "../../data/auth"
import { STALE_MS } from "../../lib/freshness"
import type { AppServices } from "../services"
import type { SignedInRole } from "../viewer"

/** First element of the profile query's key: personal, never persisted. */
export const PROFILE_KIND = "profile"

/**
 * The signed-in user's `users` row, as little of it as the shell needs: the
 * role for the menu and guards, the name for the header, the sign-in
 * provider (the password reset item) and the internal-device flag. Pages
 * that need more (phone, weekly schedule) query it themselves.
 */
export const PROFILE_COLUMNS = "id, user_type, user_name, provider, is_internal"

export interface Profile {
    id: string
    role: SignedInRole
    name: string
    /** Signed up with email and password (legacy `provider === "email"`). */
    signsInWithEmail: boolean
    isInternal: boolean
}

const ROLES: readonly string[] = ["user", "profile", "creator", "org", "admin"]

interface ProfileRow {
    id: string
    user_type: string
    user_name: string
    provider: string | null
    is_internal: boolean | null
}

function toProfile(row: ProfileRow): Profile {
    return {
        id: row.id,
        // An unknown type gets what a new account gets.
        role: ROLES.includes(row.user_type)
            ? (row.user_type as SignedInRole)
            : "user",
        name: row.user_name,
        signsInWithEmail: row.provider === "email",
        isInternal: row.is_internal === true,
    }
}

/**
 * A new account's `users` row, as legacy made it (`createDbUserFromUser`):
 * a plain user, named from sign-up's `full_name`. The database has no
 * trigger for this; the client inserts it the first time the account is
 * seen without one (RLS lets a user insert their own row).
 */
function newUserRow(user: AuthUser, buildVersion: string, nowIso: string) {
    return {
        id: user.id,
        user_type: "user",
        user_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        created_at: user.created_at,
        updated_at: nowIso,
        subscribed_for_updates_at: nowIso,
        provider: user.app_metadata?.provider || "",
        subscriptions: { teachers: [], orgs: [] },
        version: buildVersion,
        last_signin: nowIso,
        pwa_install_id: null,
    }
}

/** Postgres' unique violation: another tab created the row first. */
const DUPLICATE = "23505"

/**
 * The signed-in user's profile row: the one personal read at boot, sent at
 * once with the stored token (or after its refresh) in parallel with the
 * public window. Refetched when the app comes back after 5 minutes, so a
 * role an admin changed shows up. Creates the row for a new account. Marks
 * the device internal (or not) from it, as legacy did at sign-in.
 */
export function profileQuery(services: AppServices, userId: string) {
    const { data, auth, telemetry, now, buildVersion } = services
    return queryOptions({
        queryKey: [PROFILE_KIND, userId],
        staleTime: STALE_MS,
        queryFn: async (): Promise<Profile> => {
            const session = await auth.ready()
            if (session?.user.id !== userId) throw new Error("Signed out")

            const select = () =>
                data
                    .from("users")
                    .select(PROFILE_COLUMNS)
                    .eq("id", userId)
                    .maybeSingle()
            let { data: row, error } = await select()
            if (error) throw new Error(error.message)
            if (!row) {
                const created = await data
                    .from("users")
                    .insert(
                        newUserRow(
                            session.user,
                            buildVersion,
                            now().toISOString(),
                        ),
                    )
                    .select(PROFILE_COLUMNS)
                    .single()
                ;({ data: row, error } =
                    created.error?.code === DUPLICATE
                        ? await select()
                        : created)
                if (error) throw new Error(error.message)
                if (!row) throw new Error("No profile row")
            }

            const profile = toProfile(row)
            telemetry.setInternal(profile.isInternal)
            return profile
        },
    })
}

/**
 * Records on the user's row that they signed in, and with which build
 * (legacy's `updateUserAppVersion`): how the maintainer sees who is still on
 * an old version. Fire and forget: nothing waits for it or minds if it
 * fails.
 */
export function recordSignIn(
    { data, now, buildVersion }: AppServices,
    userId: string,
) {
    void data
        .from("users")
        .update({ version: buildVersion, last_signin: now().toISOString() })
        .eq("id", userId)
        .then(
            () => {},
            () => {},
        )
}
