import { useEffect, useState } from "react"
import { CITemplate } from "../util/interfaces"
import { useUser } from "../context/UserContext"
import { templateService } from "../supabase/templateService"

interface UseTemplatesProps {
    isMultiDay: boolean | null
}
export default function useTemplates({ isMultiDay }: UseTemplatesProps) {
    const [templates, setTemplates] = useState<CITemplate[]>([])

    useEffect(() => {
        console.log("templates: ", templates)
    }, [templates])

    const { user } = useUser()
    useEffect(() => {
        if (!user) return
        const fetchTemplates = async () => {
            const templates = await templateService.getUserTemplates(
                user.user_id,
                isMultiDay
            )
            setTemplates(templates)
        }

        const subscribeToNewTemplates = () => {
            const channel = templateService.subscribeToNewTemplates(
                user.user_id,
                (payload) => {
                    console.log("payload: ", payload)
                    switch (payload.event) {
                        case "UPDATE":
                            setTemplates((prev) =>
                                prev.map((template) =>
                                    template.template_id ===
                                    payload.new.template_id
                                        ? payload.new
                                        : template
                                )
                            )
                            console.log("templates after update: ", templates)
                            break
                        case "DELETE":
                            setTemplates((prev) =>
                                prev.filter(
                                    (template) =>
                                        template.template_id !==
                                        payload.old.template_id
                                )
                            )
                            console.log("templates after delete: ", templates)
                            break
                        case "INSERT":
                            setTemplates((prev) => [payload.new, ...prev])
                            console.log("templates after insert: ", templates)
                            break
                    }
                }
            )
            return channel
        }

        fetchTemplates()
        subscribeToNewTemplates()
    }, [user])

    return { templates }
}
