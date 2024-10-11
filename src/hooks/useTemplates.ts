import { useEffect, useState } from "react"
import { CITemplate } from "../util/interfaces"
import { useUser } from "../context/UserContext"
import { templateService } from "../supabase/templateService"

export default function useTemplates() {
    const [templates, setTemplates] = useState<CITemplate[]>([])
    const { user } = useUser()
    useEffect(() => {
        if (!user) return
        const fetchTemplates = async () => {
            const templates = await templateService.getUserTemplates(
                user.user_id
            )
            setTemplates(templates)
        }
        fetchTemplates()
    }, [user])

    return { templates }
}
