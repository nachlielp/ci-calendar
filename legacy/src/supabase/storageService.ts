import { supabase } from "./client"
import { wrapServiceError } from "./serviceError"

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
        wrapServiceError(`Failed to upload file to path: ${filePath}`, error)
    }
}
