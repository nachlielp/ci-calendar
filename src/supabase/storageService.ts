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
        if (error) {
            throw new Error(
                `Failed to upload file for userId: ${
                    store.getUserId
                } ERROR: ${JSON.stringify(error)}`
            )
        } else {
            return data
        }
    } catch (error) {
        throw new Error(
            `Failed to upload file for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}
