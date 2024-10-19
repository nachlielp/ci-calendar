import { useEffect, useState } from "react"
import { CIEvent } from "../util/interfaces"
import { cieventsService, FilterOptions } from "../supabase/cieventsService"

export const useCIPastEvents = (filterBy: FilterOptions = {}) => {
    const [ci_past_events, setCIPastEvents] = useState<CIEvent[]>([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await cieventsService.getCIEvents(
                    filterBy
                )
                setCIPastEvents(fetchedEvents)
            } catch (error) {
                console.error("Error fetching events:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()
    }, [])

    // const sortAndSetEvents = (fetchedEvents: CIEvent[]) => {
    //     const sortedEvents = fetchedEvents.sort((a, b) =>
    //         dayjs(a.start_date).diff(dayjs(b.start_date))
    //     )
    //     setCIPastEvents(sortedEvents)
    // }

    return { ci_past_events, loading }
}
