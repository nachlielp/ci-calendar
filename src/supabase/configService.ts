import { supabase } from "./client"

export const configService = {
    getConfig,
}

async function getConfig() {
    try {
        const { data, error } = await supabase.from("config").select("*")
        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching config:", error)
        throw error
    }
}
