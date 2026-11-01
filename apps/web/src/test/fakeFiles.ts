import { publicFileUrl, type Files } from "@ci-calendar/core/data/files"

// The fake's Supabase Storage (`createFakeDataClient().files`, passed as
// `services.files`): every upload and removal is recorded with the token
// it carried, the Blob itself and its content type, and stored objects are
// kept by path, so tests can check what was sent and that nothing else
// was. `fail()` makes the next uploads fail (offline, or with `denied` the
// bucket's policies refusing the user).

export const FAKE_SUPABASE_URL = "https://fake.supabase.co"
export const FAKE_BUCKET = "ci_bio_profiles"

export interface FakeUpload {
    path: string
    file: Blob
    contentType: string
    token: string | null
}

export interface FakeFiles extends Files {
    uploads: FakeUpload[]
    /** Each `remove` call's paths. */
    removals: string[][]
    /** The objects stored now, by path. */
    objects: Map<string, Blob>
    /** Uploads fail with `message` until `heal()`. */
    fail(message?: string, options?: { denied?: boolean }): void
    heal(): void
}

export function createFakeFiles(accessToken: () => string | null): FakeFiles {
    let failure: { message: string; denied: boolean } | null = null
    const fake: FakeFiles = {
        uploads: [],
        removals: [],
        objects: new Map(),
        fail: (message = "Failed to fetch", { denied = false } = {}) => {
            failure = { message, denied }
        },
        heal: () => {
            failure = null
        },
        async upload(path, file, contentType) {
            fake.uploads.push({ path, file, contentType, token: accessToken() })
            if (failure) return { error: { ...failure } }
            if (fake.objects.has(path)) {
                return { error: { message: "The resource already exists" } }
            }
            fake.objects.set(path, file)
            return { error: null }
        },
        async remove(paths) {
            fake.removals.push([...paths])
            for (const path of paths) fake.objects.delete(path)
            return { error: null }
        },
        publicUrl: (path) =>
            publicFileUrl(FAKE_SUPABASE_URL, FAKE_BUCKET, path),
    }
    return fake
}
