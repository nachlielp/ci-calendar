import { supabase } from "./client"
import { CITemplate } from "../util/interfaces"

export type CITemplateWithoutId = Omit<CITemplate, "template_id" | "created_by">

export const templateService = {
    getUserTemplates,
    createTemplate,
    deleteTemplate,
    subscribeToNewTemplates,
    getTemplate,
    updateTemplate,
}

async function getUserTemplates(userId: string): Promise<CITemplate[]> {
    try {
        const query = supabase
            .from("templates")
            .select("*")
            .eq("created_by", userId)

        // if (isMultiDay === true) {
        //     query.eq("is_multi_day", true)
        // } else if (isMultiDay === false) {
        //     query.or("is_multi_day.eq.false,is_multi_day.is.null")
        // }

        const { data, error } = await query
        if (error) throw error
        return data || []
    } catch (error) {
        console.error("Error fetching CI templates:", error)
        throw error
    }
}

async function getTemplate(templateId: string): Promise<CITemplate> {
    try {
        const { data, error } = await supabase
            .from("templates")
            .select("*")
            .eq("template_id", templateId)
        if (error) throw error
        return data[0]
    } catch (error) {
        console.error("Error fetching CI template:", error)
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

async function deleteTemplate(templateId: string): Promise<string> {
    try {
        const { data, error } = await supabase
            .from("templates")
            .delete()
            .eq("template_id", templateId)
            .select()
        if (error) throw error
        return data[0].template_id
    } catch (error) {
        console.error("Error deleting CI template:", error)
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

async function updateTemplate(template: CITemplate): Promise<CITemplate> {
    try {
        const { data, error } = await supabase
            .from("templates")
            .update(template)
            .eq("template_id", template.template_id)
            .select()
            .single()
        if (error) throw error
        return data
    } catch (error) {
        console.error("Error updating CI template:", error)
        throw error
    }
}
