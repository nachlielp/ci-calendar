import { createContext, useContext, useEffect, useState } from "react"
import { CITemplate } from "../util/interfaces"
import { useUser } from "./UserContext"
import { templateService } from "../supabase/templateService"

interface ITemplatesContextType {
    templates: CITemplate[]
}

const TemplatesContext = createContext<ITemplatesContextType>({
    templates: [],
})

export const useTemplatesContext = () => {
    return useContext(TemplatesContext)
}

export const TemplatesProvider = ({
    children,
}: {
    children: React.ReactNode
}) => {
    const { user } = useUser()

    const [templates, setTemplates] = useState<CITemplate[]>([])

    useEffect(() => {
        if (!user) return
        const fetchTemplates = async () => {
            const templates = await templateService.getUserTemplates(
                user.user_id
            )
            setTemplates(templates)
        }

        const subscribeToNewTemplates = () => {
            const channel = templateService.subscribeToNewTemplates(
                user.user_id,
                (payload) => {
                    switch (payload.eventType) {
                        case "UPDATE":
                            setTemplates((prev) =>
                                prev.map((template) =>
                                    template.template_id ===
                                    payload.new.template_id
                                        ? payload.new
                                        : template
                                )
                            )
                            break
                        case "DELETE":
                            setTemplates((prev) =>
                                prev.filter(
                                    (template) =>
                                        template.template_id !==
                                        payload.old.template_id
                                )
                            )
                            break
                        case "INSERT":
                            setTemplates((prev) => [payload.new, ...prev])
                            break
                        default:
                            console.log(
                                "Unhandled event type: ",
                                payload.eventType
                            ) // Log unhandled events
                    }
                }
            )
            return channel
        }

        fetchTemplates()
        subscribeToNewTemplates()
    }, [user])

    return (
        <TemplatesContext.Provider value={{ templates }}>
            {children}
        </TemplatesContext.Provider>
    )
}
