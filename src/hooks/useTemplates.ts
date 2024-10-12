import { useState, useEffect } from "react"
import { useTemplatesContext } from "../context/TempatesContext"
import { CITemplate } from "../util/interfaces"

export default function useTemplates({
    isMultiDay,
}: {
    isMultiDay: boolean | null
}) {
    const templatesContext = useTemplatesContext()
    const [templates, setTemplates] = useState<CITemplate[]>(
        templatesContext.templates
    )
    useEffect(() => {
        if (isMultiDay === true) {
            setTemplates(
                templatesContext.templates.filter(
                    (template) => template.is_multi_day
                )
            )
        } else if (isMultiDay === false) {
            setTemplates(
                templatesContext.templates.filter(
                    (template) => !template.is_multi_day
                )
            )
        } else {
            setTemplates(templatesContext.templates)
        }
    }, [templatesContext, isMultiDay])

    return templates
}
