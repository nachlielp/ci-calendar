import { CIConfig } from "../util/interfaces"
import { supabase } from "./client"

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
        console.error("Error fetching config:", error)
        throw error
    }
}
