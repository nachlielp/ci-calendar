import { createContext, useContext, useEffect, useState } from "react"
import { CIEvent, CIEventSegments, UserBio } from "../util/interfaces"
import dayjs from "dayjs"
import { cieventsService } from "../supabase/cieventsService"
import { usersService } from "../supabase/usersService"
import { supabase } from "../supabase/client"

interface CIEventsContextType {
    ci_events: CIEvent[]
    loading: boolean
    viewableTeachers: UserBio[]
}

export const CIEventsContext = createContext<CIEventsContextType>({
    ci_events: [],
    loading: true,
    viewableTeachers: [],
})

export const useCIEvents = () => {
    return useContext(CIEventsContext)
}

export const CIEventsProvider = ({
    children,
}: {
    children: React.ReactNode
}) => {
    const [ci_events, setCievents] = useState<CIEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [viewableTeachers, setViewableTeachers] = useState<UserBio[]>([])
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await cieventsService.getCIEvents({
                    start_date: dayjs().startOf("day").toISOString(),
                })
                sortAndSetEvents(fetchedEvents)

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

        const subscription = supabase
            .channel("cievents-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "ci_events" },
                handleChange
            )
            .subscribe()

        // Cleanup function
        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const handleChange = async (_: any) => {
        const fetchedEvents = await cieventsService.getCIEvents({
            start_date: dayjs().startOf("day").toISOString(),
        })
        sortAndSetEvents(fetchedEvents)
    }

    const sortAndSetEvents = (fetchedEvents: CIEvent[]) => {
        const sortedEvents = fetchedEvents.sort((a, b) =>
            dayjs(a.start_date).diff(dayjs(b.start_date))
        )
        setCievents(sortedEvents)
    }

    return (
        <CIEventsContext.Provider
            value={{ ci_events, loading, viewableTeachers }}
        >
            {children}
        </CIEventsContext.Provider>
    )
}
