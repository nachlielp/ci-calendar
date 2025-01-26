import { store } from "../Store/store"
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
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to create notification for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}

async function updateNotification(notification: NotificationDB) {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .update(notification)
            .eq("id", notification.id)
            .select()
            .single()
        if (error) throw error
        return data
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to update notification for notificationId: ${notification.id} for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
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
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to upsert notification for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
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
        const errorMessage =
            error instanceof Error
                ? error.message
                : JSON.stringify(error, null, 2)
        throw new Error(
            `Failed to get notification for notificationId: ${id} for userId: ${store.getUserId} ERROR: ${errorMessage}`
        )
    }
}
