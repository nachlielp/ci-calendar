import {
    queryOptions,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"
import { PERSONAL_FRESHNESS, sessionOf } from "../../app/auth/personal"
import { personalKey } from "../../app/auth/personalStorage"
import { useServices, type AppServices } from "../../app/services"
import type { Database } from "../../data/database.types"
import { deepEqual } from "../../lib/form"
import { PHOTO_CONTENT_TYPE, photoPath } from "../../lib/photo"
import { toPublicBio } from "../calendar/publicEvent"
import { cacheOwnBio } from "../event-forms/taggableBios"
import { applyBioChange } from "../events/eventCache"
import { isPublicBio } from "../events/managedEvent"

// The user's own `public_bio` row (legacy store `bio`, which came with the
// boot-time user join): read only when the bio page opens. Personal: never
// persisted, forgotten on sign-out. A save's response updates it and every
// cached copy of the bio: the events embedding it (the persisted calendar
// window included) and the tagging list.

export const MY_BIO_KIND = "my-bio"

/** The columns the bio page shows and edits. */
export const MY_BIO_COLUMNS =
    "user_id, bio_name, about, img, page_url, page_title, page_url_2, page_title_2, show_profile, allow_tagging, user_type"

/** The profile form's unsaved text (never the photo). */
export const BIO_DRAFT_KEY = personalKey("bio-draft")

export interface MyBio {
    user_id: string
    bio_name: string
    about: string | null
    img: string | null
    page_url: string | null
    page_title: string | null
    page_url_2: string | null
    page_title_2: string | null
    show_profile: boolean | null
    allow_tagging: boolean | null
    user_type: string | null
}

export const myBioKey = (userId: string) => [MY_BIO_KIND, userId] as const

/** The user's bio, or `null` when they have none yet. */
export function myBioQuery(services: AppServices, userId: string) {
    return queryOptions({
        queryKey: myBioKey(userId),
        ...PERSONAL_FRESHNESS,
        queryFn: async (): Promise<MyBio | null> => {
            await sessionOf(services, userId)
            const { data, error } = await services.data
                .from("public_bio")
                .select(MY_BIO_COLUMNS)
                .eq("user_id", userId)
                .maybeSingle()
            if (error) throw new Error(error.message)
            return data
        },
    })
}

type BioColumns = Database["public"]["Tables"]["public_bio"]["Update"]

export interface BioSave {
    /** The changed columns (the form's, or a switch). */
    patch: BioColumns
    /**
     * The columns to create the row with if the user has none (the form
     * sends them; a switch doesn't, and needs a row).
     */
    create?: BioColumns
    /** A cropped photo to upload; its URL becomes `img`. */
    photo?: Blob | null
}

/** The photo couldn't be stored: nothing was written. */
export class PhotoUploadError extends Error {
    constructor(
        message: string,
        /**
         * The bucket's policies refused the user: until the
         * profile-role migration is applied, a `profile` user's case
         * (supabase/migrations/20261030120000_bio_photos_for_profiles.sql).
         */
        readonly denied: boolean,
    ) {
        super(message)
    }
}

/** A switch was saved for a bio that doesn't exist (any more). */
export class BioMissingError extends Error {}

/**
 * The bio write failed. `answered`: the server replied with an error (an
 * HTTP status), so nothing was written; otherwise no answer came (network)
 * and the write may have committed.
 */
export class BioWriteError extends Error {
    constructor(
        message: string,
        readonly answered: boolean,
    ) {
        super(message)
    }
}

/** Postgres' unique violation (`public_bio.user_id`): another tab made it. */
const DUPLICATE = "23505"

/**
 * Saves the user's bio: the photo first, if any (legacy's bucket,
 * `<user id>/<time>` path and `image/jpg` type), then one write of the
 * changed columns to the user's own row (`user_id`; an admin's RLS would
 * allow any). The row is created when the user has none, as legacy's
 * upsert did; the update goes only to an existing row and the insert only
 * where none exists (unique `user_id`), so the two never clobber each
 * other across tabs. The old photo stays in the bucket, as legacy left it:
 * other devices' cached events still show its URL until they refresh.
 *
 * A new photo nothing points at is an orphan in the bucket. It is removed
 * when the server answered the row write with an error (nothing written),
 * never when no answer came: the row may point at it after all. It stays
 * an orphan, accepted as legacy's were (legacy uploaded on crop and left
 * every unsaved photo), when the tab closes between the upload and the
 * row write, or after a network failure there.
 */
export function useSaveBio(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ patch, create, photo }: BioSave) => {
            await sessionOf(services, userId)
            const before =
                queryClient.getQueryData<MyBio | null>(myBioKey(userId)) ?? null
            const columns = { ...patch }
            let uploaded: string | null = null
            if (photo) {
                const path = photoPath(userId, services.now())
                const { error } = await services.files.upload(
                    path,
                    photo,
                    PHOTO_CONTENT_TYPE,
                )
                if (error) {
                    throw new PhotoUploadError(error.message, !!error.denied)
                }
                uploaded = path
                columns.img = services.files.publicUrl(path)
            }
            try {
                const saved = await writeBio(
                    services,
                    userId,
                    columns,
                    create && { ...create, ...columns },
                    before !== null,
                )
                return { before, saved }
            } catch (error) {
                const nothingWritten =
                    error instanceof BioMissingError ||
                    (error instanceof BioWriteError && error.answered)
                if (uploaded && nothingWritten) {
                    void services.files.remove([uploaded])
                }
                throw error
            }
        },
        onSuccess: ({ before, saved }) => {
            queryClient.setQueryData<MyBio | null>(myBioKey(userId), (old) =>
                old === undefined ? old : saved,
            )
            cacheOwnBio(queryClient, userId, saved)
            const wasPublic = !!before && isPublicBio(before)
            const isPublic = isPublicBio(saved)
            if (
                wasPublic === isPublic &&
                (!isPublic ||
                    deepEqual(toPublicBio(before!), toPublicBio(saved)))
            ) {
                return
            }
            applyBioChange(
                queryClient,
                userId,
                isPublic ? toPublicBio(saved) : null,
                { refresh: isPublic && !wasPublic },
            )
        },
        onError: (error) => {
            if (error instanceof BioMissingError) {
                void queryClient.invalidateQueries({
                    queryKey: myBioKey(userId),
                })
            }
            services.telemetry.captureError(error, { source: "bio-save" })
        },
    })
}

/**
 * A failed request's error. postgrest-js reports a request that got no
 * answer (network, aborted) with status 0, and may give it a code from
 * the fetch error's cause, so only the HTTP status tells an answer.
 */
function writeError(result: {
    error: { message: string } | null
    status?: number
}) {
    return new BioWriteError(
        result.error?.message ?? "Bio write failed",
        (result.status ?? 0) > 0,
    )
}

async function writeBio(
    services: AppServices,
    userId: string,
    columns: BioColumns,
    create: BioColumns | undefined,
    exists: boolean,
): Promise<MyBio> {
    const update = async () => {
        const result = await services.data
            .from("public_bio")
            .update(columns)
            .eq("user_id", userId)
            .select(MY_BIO_COLUMNS)
            .maybeSingle()
        if (result.error) throw writeError(result)
        return result.data
    }
    if (exists || !create) {
        const data = await update()
        if (data) return data
        if (!create) throw new BioMissingError("No bio to update")
    }
    const inserted = await services.data
        .from("public_bio")
        .insert({ ...create, user_id: userId })
        .select(MY_BIO_COLUMNS)
        .single()
    if (inserted.error?.code === DUPLICATE) {
        const data = await update()
        if (data) return data
        throw new BioMissingError("No bio to update")
    }
    if (inserted.error) throw writeError(inserted)
    return inserted.data
}
