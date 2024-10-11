import { useEffect, useState } from "react"
import { CITemplate } from "../util/interfaces"
import { useUser } from "../context/UserContext"
import { templateService } from "../supabase/templateService"

export default function useTemplates({ isMultiDay }: { isMultiDay?: boolean }) {
    const [templates, setTemplates] = useState<CITemplate[]>([])

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
                    //TODO handle updates
                    setTemplates((prev) => [payload.new, ...prev])
                }
            )
            return channel
        }

        fetchTemplates()
        subscribeToNewTemplates()
    }, [user])

    return { templates }
}
