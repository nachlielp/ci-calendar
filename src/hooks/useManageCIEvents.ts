import { useEffect, useState } from "react"
import { cieventsService } from "../supabase/cieventsService"
import { SelectOption } from "../util/options"

export const useManageCIEvents = () => {
    const [ci_events_teachers, setCIEventsTeachers] = useState<SelectOption[]>(
        []
    )

    useEffect(() => {
        const fetchCreatores = async () => {
            try {
                const fetchedCreators =
                    await cieventsService.getCIEventsCreators()
                setCIEventsTeachers(fetchedCreators)
            } catch (error) {
                console.error("Error fetching events:", error)
            }
        }
        fetchCreatores()
    }, [])

    return {
        ci_events_teachers,
    }
}
