import { queryOptions, useQuery, type QueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import { useServices, type AppServices } from "../../app/services"
import { useSession, useViewer, type SignedInRole } from "../../app/viewer"
import type { Tag } from "../calendar/publicEvent"

// Who an event form can tag (legacy `getTaggableUsers` and the store's
// `getAppTaggableTeachers` / `getAppTaggableOrgs`): bios that allow tagging,
// with a name, plus the user's own bio, read in one request when a form or
// the create page opens. Personal (the user's own bio is in it): never at
// boot, never persisted, forgotten on sign-out.

export const TAGGABLE_KIND = "taggable-bios"

export interface BioRow {
    user_id: string
    bio_name: string
    user_type: string | null
    allow_tagging: boolean | null
}

const COLUMNS = "user_id, bio_name, user_type, allow_tagging"

export interface Taggable {
    /** Teachers to tag on segments (and multi-day events). */
    teachers: Tag[]
    /** Organisations to tag on the event. */
    organisations: Tag[]
    /** The user has a public bio with a name (legacy's "profile"). */
    hasBio: boolean
}

const byName = (a: Tag, b: Tag) => a.label.localeCompare(b.label, "he")

/**
 * Legacy's option lists: bios allowing tagging, orgs apart from teachers;
 * the user is offered among teachers by their own bio's name even if they
 * don't allow tagging (not an org), and among organisations if they are
 * one (by their bio's name, else their email).
 */
export function taggableOptions(
    rows: readonly BioRow[],
    user: { id: string; role: SignedInRole | string; email: string },
): Taggable {
    const own = rows.find((row) => row.user_id === user.id)
    const tags = (orgs: boolean) =>
        rows
            .filter(
                (row) =>
                    row.allow_tagging === true &&
                    (row.user_type === "org") === orgs,
            )
            .map((row) => ({ label: row.bio_name, value: row.user_id }))
            .sort(byName)
    const teachers = tags(false)
    const organisations = tags(true)
    const has = (list: Tag[]) => list.some((tag) => tag.value === user.id)
    if (user.role !== "org" && own?.bio_name && !has(teachers)) {
        teachers.unshift({ label: own.bio_name, value: user.id })
    }
    if (user.role === "org" && !has(organisations)) {
        organisations.unshift({
            label: own?.bio_name || user.email,
            value: user.id,
        })
    }
    return { teachers, organisations, hasBio: !!own?.bio_name }
}

export const taggableKey = (userId: string) => [TAGGABLE_KIND, userId] as const

/** The bios the user's forms can tag, and their own. */
export function taggableBiosQuery(services: AppServices, userId: string) {
    return queryOptions({
        queryKey: taggableKey(userId),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<BioRow[]> => {
            await sessionOf(services, userId)
            const { data, error } = await services.data
                .from("public_bio")
                .select(COLUMNS)
                .or(`allow_tagging.eq.true,user_id.eq.${userId}`)
                .neq("bio_name", "")
            if (error) throw new Error(error.message)
            return data
        },
    })
}

/**
 * The user saved their bio (the bio editor): their own row in the cached
 * list, if cached, takes the stored one (out once it has no name, as the
 * query's filter has it). Others' rows are untouched.
 */
export function cacheOwnBio(
    queryClient: QueryClient,
    userId: string,
    bio: BioRow,
) {
    queryClient.setQueryData<BioRow[]>(taggableKey(userId), (rows) => {
        if (!rows) return rows
        const others = rows.filter((row) => row.user_id !== userId)
        const own: BioRow = {
            user_id: bio.user_id,
            bio_name: bio.bio_name,
            user_type: bio.user_type,
            allow_tagging: bio.allow_tagging,
        }
        return bio.bio_name ? [...others, own] : others
    })
}

/** Who the user's event form can tag (empty lists until the bios load). */
export function useTaggable(userId: string): Taggable {
    const services = useServices()
    const viewer = useViewer()
    const session = useSession()
    const bios = useQuery({
        ...taggableBiosQuery(services, userId),
        enabled: !!userId,
    })
    const email = session?.user.email ?? ""
    return useMemo(
        () =>
            taggableOptions(bios.data ?? [], {
                id: userId,
                role: viewer.role,
                email,
            }),
        [bios.data, userId, viewer.role, email],
    )
}
