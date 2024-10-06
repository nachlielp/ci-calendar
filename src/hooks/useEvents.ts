import { useEffect, useState } from "react"
import { UserBio, CIEvent, IEventiPart } from "../util/interfaces"
import dayjs from "dayjs"
import { cieventsService, FilterOptions } from "../supabase/cieventsService"
import { supabase } from "../supabase/client"
import { userService } from "../supabase/userService"

export const useEvents = (filterBy: FilterOptions = {}) => {
    const [events, setEvents] = useState<CIEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [viewableTeachers, setViewableTeachers] = useState<UserBio[]>([])
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await cieventsService.getCIEvents(
                    filterBy
                )
                sortAndSetEvents(fetchedEvents)

                const eventsTeacherIds: string[] = []
                fetchedEvents.forEach((event) => {
                    const teacherIds = event.subEvents
                        .flatMap((subEvent: IEventiPart) => subEvent.teachers)
                        .map((teacher: { value: string }) => teacher.value)
                        .filter((teacher: string) => teacher !== "NON_EXISTENT")

                    eventsTeacherIds.push(...teacherIds)
                })

                const viewableTeachers = await userService.getViewableTeachers(
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

    return { events, loading, viewableTeachers }
}
