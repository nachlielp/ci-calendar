//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { CITemplate } from "../util/interfaces"
import { store } from "../Store/store"

export const useSetSelectedTemplateByParams = () => {
    const { templateId } = useParams<{ templateId: string }>()
    const [selectedTemplate, setSelectedTemplate] = useState<CITemplate | null>(
        null
    )

    useEffect(() => {
        if (templateId) {
            const template = store.getTemplates.find(
                (template) => template.id === templateId
            )
            if (template) {
                setSelectedTemplate(null)
                setSelectedTemplate(template)
            }
        } else {
            setSelectedTemplate(null)
        }
    }, [templateId])

    return { selectedTemplate }
}
