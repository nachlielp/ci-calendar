import { useEffect, useState } from "react"
import { UserBio, CIEvent, CIEventSegments } from "../util/interfaces"
import { cieventsService, FilterOptions } from "../supabase/cieventsService"
import { usersService } from "../supabase/usersService"

export const useCIPastEvents = (filterBy: FilterOptions = {}) => {
    const [ci_past_events, setCIPastEvents] = useState<CIEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [viewableTeachers, setViewableTeachers] = useState<UserBio[]>([])
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await cieventsService.getCIEvents(
                    filterBy
                )
                setCIPastEvents(fetchedEvents)

                const eventsTeacherIds: string[] = []
                fetchedEvents.forEach((event) => {
                    const teacherIds = event.segments
                        .flatMap((segment: CIEventSegments) => segment.teachers)
                        .map((teacher: { value: string }) => teacher.value)
                        .filter((teacher: string) => teacher !== "NON_EXISTENT")

                    eventsTeacherIds.push(...teacherIds)
                })

                const viewableTeachers = await usersService.getViewableTeachers(
                    eventsTeacherIds
                )
                setViewableTeachers(viewableTeachers)
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

    return { ci_past_events, loading, viewableTeachers }
}
