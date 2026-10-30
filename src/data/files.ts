import type { Auth } from "./auth"

/**
 * Supabase Storage (`services.files`; `services.storage` is device
 * storage): the bio photos' bucket, legacy's `VITE_SUPABASE_STORAGE_BUCKET`
 * (`ci_bio_profiles`). Uploads go with the token at hand, as data requests
 * do (callers await `sessionOf` first), so the bucket's policies decide
 * who may write where. Tests pass the fake's (`createFakeDataClient().files`).
 */
export interface Files {
    /**
     * Stores `file` at `path` as `contentType` (never over an existing
     * object). Never throws: a failure comes back as `error`.
     */
    upload(
        path: string,
        file: Blob,
        contentType: string,
    ): Promise<{ error: FileError | null }>
    /** Deletes the objects at `paths`; never throws. */
    remove(paths: string[]): Promise<{ error: FileError | null }>
    /** The public URL an object is served from (no request). */
    publicUrl(path: string): string
}

export interface FileError {
    message: string
    /** The bucket's policies refused the user (not a network failure). */
    denied?: boolean
}

/** The public URL of `path` in `bucket`, as storage-js's `getPublicUrl`. */
export const publicFileUrl = (url: string, bucket: string, path: string) =>
    `${url}/storage/v1/object/public/${bucket}/${path}`

/**
 * `@supabase/storage-js` (./filesClient.ts), imported on the first upload
 * or removal, so only a photo save carries it.
 */
export function createFiles(
    url: string,
    anonKey: string,
    bucket: string | undefined,
    auth: Pick<Auth, "accessToken">,
): Files {
    let client: Promise<Omit<Files, "publicUrl">> | undefined
    const connect = () =>
        (client ??= (async () => {
            if (!bucket)
                throw new Error("VITE_SUPABASE_STORAGE_BUCKET is unset")
            const { connectFiles } = await import("./filesClient")
            return connectFiles(url, anonKey, bucket, auth)
        })().catch((error: unknown) => {
            // Try again next time (offline, a deploy, no bucket).
            client = undefined
            throw error
        }))
    const failed = (error: unknown) => ({
        error: { message: String(error) },
    })
    return {
        upload: (path, file, contentType) =>
            connect().then(
                (files) => files.upload(path, file, contentType),
                failed,
            ),
        remove: (paths) =>
            connect().then((files) => files.remove(paths), failed),
        publicUrl: (path) => publicFileUrl(url, bucket ?? "", path),
    }
}
