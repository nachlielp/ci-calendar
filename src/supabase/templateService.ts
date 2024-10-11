import { supabase } from "./client"
import { CITemplate } from "../util/interfaces"

export type CITemplateWithoutId = Omit<CITemplate, "template_id">

export const templateService = {
    getUserTemplates,
    createTemplate,
    subscribeToNewTemplates,
}

async function getUserTemplates(
    userId: string,
    isMultiDay?: boolean
): Promise<CITemplate[]> {
    try {
        const query = supabase
            .from("templates")
            .select("*")
            .eq("created_by", userId)

        if (isMultiDay === true) {
            query.eq("is_multi_day", true)
        } else if (isMultiDay === false) {
            query.or("is_multi_day.eq.false,is_multi_day.is.null")
        }

        const { data, error } = await query
        if (error) throw error
        return data || []
    } catch (error) {
        console.error("Error fetching CI templates:", error)
        throw error
    }
}

async function createTemplate(
    template: CITemplateWithoutId
): Promise<CITemplate> {
    try {
        const { data, error } = await supabase
            .from("templates")
            .insert(template)
            .select()
        if (error) throw error
        return data[0]
    } catch (error) {
        console.error("Error creating CI template:", error)
        throw error
    }
}

function subscribeToNewTemplates(
    userId: string,
    callback: (payload: any) => void
) {
    const channel = supabase
        .channel(`public:templates:created_by=eq.${userId}`)
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "templates" },
            (payload) => {
                callback(payload)
            }
        )
        .subscribe()

    return channel
}
