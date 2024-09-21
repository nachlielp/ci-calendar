import { useEffect, useState } from "react"
import { CIEvent } from "../util/interfaces"
import dayjs from "dayjs"
import { cieventsService, FilterOptions } from "../supabase/cieventsService"
import { supabase } from "../supabase/client"

export const useEvents = (filterBy: FilterOptions = {}) => {
    const [events, setEvents] = useState<CIEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await cieventsService.getCIEvents(
                    filterBy
                )
                sortAndSetEvents(fetchedEvents)
            } catch (error) {
                console.error("Error fetching events:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()

        // Set up real-time subscription
        const subscription = supabase
            .channel("cievents-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "ci-events" },
                handleChange
            )
            .subscribe()

        // Cleanup function
        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const handleChange = async (_: any) => {
        // Fetch all events again when there's a change
        const fetchedEvents = await cieventsService.getCIEvents(filterBy)
        sortAndSetEvents(fetchedEvents)
    }

    const sortAndSetEvents = (fetchedEvents: CIEvent[]) => {
        const sortedEvents = fetchedEvents.sort((a, b) =>
            dayjs(a.startDate).diff(dayjs(b.startDate))
        )
        setEvents(sortedEvents)
    }

    return { events, loading }
}
