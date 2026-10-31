import { StorageClient } from "@supabase/storage-js"
import type { Auth } from "./auth"
import type { FileError, Files } from "./files"

/**
 * Photos never change under a name (each upload is a new path), so
 * browsers and the CDN may keep them for a year.
 */
const PHOTO_CACHE_SECONDS = "31536000"

/** The Storage client behind `services.files` (./files.ts). */
export function connectFiles(
    url: string,
    anonKey: string,
    bucket: string,
    auth: Pick<Auth, "accessToken">,
): Omit<Files, "publicUrl"> {
    const client = new StorageClient(
        `${url}/storage/v1`,
        { apikey: anonKey },
        (input, init) => {
            const headers = new Headers(init?.headers)
            headers.set(
                "Authorization",
                `Bearer ${auth.accessToken() ?? anonKey}`,
            )
            return fetch(input, { ...init, headers })
        },
    )
    const files = client.from(bucket)
    const result = ({
        error,
    }: {
        error: (Error & { status?: number; statusCode?: string }) | null
    }): { error: FileError | null } => ({
        error: error && {
            message: String(error.message),
            // Storage answers a policy refusal with `statusCode` 403
            // ("new row violates row-level security policy").
            denied:
                error.statusCode === "403" ||
                error.status === 403 ||
                /row-level security/i.test(String(error.message)),
        },
    })
    return {
        upload: async (path, file, contentType) =>
            result(
                await files.upload(path, file, {
                    contentType,
                    cacheControl: PHOTO_CACHE_SECONDS,
                    upsert: false,
                }),
            ),
        remove: async (paths) => result(await files.remove(paths)),
    }
}
