import { supabase } from "./client"
import { CITemplate } from "../util/interfaces"

export type CITemplateWithoutId = Omit<CITemplate, "template_id">

export const templateService = {
    getUserTemplates,
    createTemplate,
}

async function getUserTemplates(userId: string): Promise<CITemplate[]> {
    try {
        const { data, error } = await supabase
            .from("templates")
            .select("*")
            .eq("created_by", userId)
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
