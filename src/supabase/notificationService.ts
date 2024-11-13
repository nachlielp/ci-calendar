import { NotificationDB } from "../util/interfaces"
import { supabase } from "./client"

export const notificationService = {
    createNotification,
    updateNotification,
    getNotificationById,
}

async function createNotification(notification: NotificationDB) {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .insert(notification)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error(error)
    }
}

async function updateNotification(notification: NotificationDB) {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .update(notification)
            .eq("id", notification.id)
        if (error) throw error
        return data
    } catch (error) {
        console.error(error)
    }
}

async function getNotificationById(id: string) {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .select("*, ci_events!inner (title, start_date,segments)")
            .eq("id", id)
            .single()

        if (error) throw error

        const formattedData = {
            ...data,
            title: data?.ci_events?.title,
            start_date: data?.ci_events?.start_date,
            firstSegment: data?.ci_events?.segments[0],
        }
        delete formattedData.ci_events
        return formattedData
    } catch (error) {
        console.error(error)
    }
}
