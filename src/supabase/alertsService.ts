import { store } from "../Store/store"
import { CIAlert } from "../util/interfaces"
import { supabase } from "./client"

export const alertsService = {
    setAlertViewed,
    updateAlert,
}

async function setAlertViewed(alertId: string) {
    try {
        const { error } = await supabase
            .from("alerts")
            .update({ viewed: true })
            .eq("id", alertId)
        if (error) throw error
        throw new Error(
            `Failed to set alert viewed for alertId: ${alertId} for userId: ${store.getUserId}`
        )
    } catch (error) {
        console.error(error)
        throw new Error(
            `Failed to set alert viewed for alertId: ${alertId} for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}

async function updateAlert(alert: Partial<CIAlert>): Promise<CIAlert> {
    try {
        const { data, error } = await supabase
            .from("alerts")
            .update(alert)
            .eq("id", alert.id)
            .select()
            .single()
        if (error)
            throw new Error(
                `Failed to update alert for alertId: ${alert.id} for userId: ${store.getUserId} ERROR: ${error}`
            )
        return data
    } catch (error) {
        console.error(error)
        throw new Error(
            `Failed to update alert for alertId: ${alert.id} for userId: ${store.getUserId} ERROR: ${error}`
        )
    }
}
