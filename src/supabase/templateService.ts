import { supabase } from "./client"
import { CITemplate } from "../util/interfaces"
import { wrapServiceError } from "./serviceError"

export type CITemplateWithoutId = Omit<CITemplate, "id" | "user_id">

export const templateService = {
    createTemplate,
    deleteTemplate,
    getTemplate,
    updateTemplate,
}

async function getTemplate(templateId: string): Promise<CITemplate> {
    try {
        const { data, error } = await supabase
            .from("templates")
            .select("*")
            .eq("id", templateId)

        if (error) throw error
        return data[0]
    } catch (error) {
        wrapServiceError(
            `Failed to get CI template for templateId: ${templateId}`,
            error,
        )
    }
}

async function createTemplate(
    template: CITemplateWithoutId,
): Promise<CITemplate> {
    try {
        const { data, error } = await supabase
            .from("templates")
            .insert(template)
            .select()

        if (error) throw error
        return data[0]
    } catch (error) {
        wrapServiceError("Failed to create CI template", error)
    }
}

async function deleteTemplate(templateId: string): Promise<string> {
    try {
        const { data, error } = await supabase
            .from("templates")
            .delete()
            .eq("id", templateId)
            .select()

        if (error) throw error
        return data[0].id
    } catch (error) {
        wrapServiceError(
            `Failed to delete CI template for templateId: ${templateId}`,
            error,
        )
    }
}

async function updateTemplate(
    template: Partial<CITemplate> & { id: string },
): Promise<CITemplate> {
    try {
        const { data, error } = await supabase
            .from("templates")
            .update(template)
            .eq("id", template.id)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        wrapServiceError(
            `Failed to update CI template for templateId: ${template.id}`,
            error,
        )
    }
}
