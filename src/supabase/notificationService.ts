import { NotificationDB } from "../util/interfaces"
import { supabase } from "./client"

export const notificationService = {
    createNotification,
    updateNotification,
    getNotificationById,
    upsertNotification,
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
async function upsertNotification(notification: NotificationDB) {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .upsert(notification, {
                onConflict: "ci_event_id,user_id",
            })
            .select()
            .single()
        if (error) throw error
        return data
    } catch (error) {
        console.error(error)
    }
}

//TODO from inner to left join to accommodate response notifications
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
