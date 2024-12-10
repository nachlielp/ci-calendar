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
    } catch (error) {
        console.error(error)
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
        if (error) throw error

        return data
    } catch (error) {
        console.error(error)
        throw error
    }
}
