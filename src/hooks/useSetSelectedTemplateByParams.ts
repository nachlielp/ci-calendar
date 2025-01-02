//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { CITemplate } from "../util/interfaces"
import { store } from "../Store/store"

//TODO undefined to null
export const useSetSelectedTemplateByParams = () => {
    const { templateId } = useParams<{ templateId: string }>()
    const [selectedTemplate, setSelectedTemplate] = useState<
        CITemplate | undefined
    >(undefined)

    useEffect(() => {
        if (templateId) {
            const template = store.getTemplates.find(
                (template) => template.id === templateId
            )
            if (template) {
                setSelectedTemplate(undefined)
                setSelectedTemplate(template)
            }
        } else {
            setSelectedTemplate(undefined)
        }
    }, [templateId])

    return { selectedTemplate }
}
