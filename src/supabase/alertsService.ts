import { CIAlert } from "../util/interfaces"
import { supabase } from "./client"

export const alertsService = {
    setAlertViewed,
    getAlertById,
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

async function getAlertById(alertId: string) {
    try {
        const { data, error } = await supabase
            .from("alerts")
            .select("*, ci_events!inner (title, start_date,segments)")
            .eq("id", alertId)
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

async function updateAlert(alert: Partial<CIAlert>): Promise<CIAlert> {
    const { data, error } = await supabase
        .from("alerts")
        .update(alert)
        .eq("id", alert.id)
        .select()
        .single()
    if (error) throw error
    return data
}
