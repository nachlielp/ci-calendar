import { NotificationDB } from "../util/interfaces"
import { supabase } from "./client"

export const notificationService = {
    createNotification,
}

async function createNotification(notification: NotificationDB) {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .insert(notification)
        if (error) throw error
        return data
    } catch (error) {
        console.error(error)
    }
}
