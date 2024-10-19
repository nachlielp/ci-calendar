import { createContext, useContext, useEffect, useState } from "react"
import { CIEvent } from "../util/interfaces"
import dayjs from "dayjs"
import { cieventsService } from "../supabase/cieventsService"
import { supabase } from "../supabase/client"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

dayjs.extend(timezone)
dayjs.extend(utc)

interface CIEventsContextType {
    ci_events: CIEvent[]
    loading: boolean
}

export const CIEventsContext = createContext<CIEventsContextType>({
    ci_events: [],
    loading: true,
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

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await cieventsService.getCIEvents({
                    start_date: dayjs()
                        .tz("Asia/Jerusalem")
                        .add(3, "hours")
                        .toISOString(),
                })
                sortAndSetEvents(fetchedEvents)
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
        <CIEventsContext.Provider value={{ ci_events, loading }}>
            {children}
        </CIEventsContext.Provider>
    )
}
