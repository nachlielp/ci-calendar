import { useEffect, useState } from "react"
import { CIEvent } from "../util/interfaces"
import { cieventsService, FilterOptions } from "../supabase/cieventsService"
import dayjs from "dayjs"
import { SelectOption } from "../util/options"

export const useCIManageEvents = (filterBy: FilterOptions = {}) => {
    const [ci_past_events, setCIPastEvents] = useState<CIEvent[]>([])
    const [ci_future_events, setCIFutureEvents] = useState<CIEvent[]>([])
    const [ci_events_teachers, setCIEventsTeachers] = useState<SelectOption[]>(
        []
    )
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await cieventsService.getCIEvents(
                    filterBy
                )
                const fetchedCreators =
                    await cieventsService.getCIEventsCreators()

                setCIPastEvents(
                    fetchedEvents
                        .filter(
                            (e) => e.start_date < dayjs().format("YYYY-MM-DD")
                        )
                        .sort((a, b) =>
                            dayjs(b.start_date).diff(dayjs(a.start_date))
                        )
                )
                setCIFutureEvents(
                    fetchedEvents
                        .filter(
                            (e) => e.start_date >= dayjs().format("YYYY-MM-DD")
                        )
                        .sort((a, b) =>
                            dayjs(a.start_date).diff(dayjs(b.start_date))
                        )
                )
                setCIEventsTeachers(fetchedCreators)
            } catch (error) {
                console.error("Error fetching events:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()

        // const subscription = supabase
        //     .channel("ci_events")
        //     .on(
        //         "postgres_changes",
        //         { event: "*", schema: "public", table: "ci_events" },
        //         (_) => {
        //             fetchEvents()
        //         }
        //     )
        //     .subscribe()

        // return () => {
        //     supabase.removeChannel(subscription)
        // }
    }, [filterBy.creator_id])

    // const sortAndSetEvents = (fetchedEvents: CIEvent[]) => {
    //     const sortedEvents = fetchedEvents.sort((a, b) =>
    //         dayjs(a.start_date).diff(dayjs(b.start_date))
    //     )
    //     setCIPastEvents(sortedEvents)
    // }

    return { ci_past_events, ci_future_events, ci_events_teachers, loading }
}
