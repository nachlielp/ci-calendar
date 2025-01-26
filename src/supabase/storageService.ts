import { store } from "../Store/store"
import { supabase } from "./client"

export const storageService = {
    uploadFile,
}

async function uploadFile(filePath: string, file: Blob) {
    const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file)

        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to upload file to path: ${filePath} for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}
