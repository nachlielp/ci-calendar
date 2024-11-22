import { useEffect, useState } from "react"
import { cieventsService } from "../supabase/cieventsService"
import { SelectOption } from "../util/options"

export const useEventCreatorOptions = () => {
    const [ci_events_creatores, setCIEventsCreatores] = useState<
        SelectOption[]
    >([])

    useEffect(() => {
        const fetchCreatores = async () => {
            try {
                const fetchedCreators =
                    await cieventsService.getCIEventsCreators()
                setCIEventsCreatores(fetchedCreators)
            } catch (error) {
                console.error("Error fetching events:", error)
            }
        }
        fetchCreatores()
    }, [])

    return {
        ci_events_creatores,
    }
}
