import { CIConfig } from "../util/interfaces"
import { supabase } from "./client"
import { store } from "../Store/store"

export const configService = {
    getConfig,
}

async function getConfig(): Promise<CIConfig> {
    try {
        const { data, error } = await supabase.from("config").select("*")
        if (error) throw error

        const config = {
            app_title: data.find((c) => c.title === "app_title")?.data,
            app_description: data.find((c) => c.title === "app_description")
                ?.data,
        }
        return config
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to get config for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}
