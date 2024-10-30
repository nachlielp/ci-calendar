import { createContext, useContext, useRef, useEffect, useState } from "react"
import { CIEvent } from "../util/interfaces"
import dayjs from "dayjs"
import { cieventsService, DBCIEvent } from "../supabase/cieventsService"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

dayjs.extend(timezone)
dayjs.extend(utc)

const MINUTE_MS = 1000 * 60

interface CIEventsContextType {
    ci_events: CIEvent[]
    loading: boolean
    addEventState: (event: CIEvent) => void
    updateEventState: (eventId: string, event: DBCIEvent) => void
    removeEventState: (eventId: string) => void
}

export const CIEventsContext = createContext<CIEventsContextType>({
    ci_events: [],
    loading: true,
    addEventState: () => {},
    updateEventState: () => {},
    removeEventState: () => {},
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
    const subscriptionRef = useRef<any>(null)

    useEffect(() => {
        let callCount = 0

        const getInterval = () => {
            if (callCount < 5) return MINUTE_MS * 2
            if (callCount < 10) return MINUTE_MS * 5
            return MINUTE_MS * 60
        }

        const fetchEvents = async () => {
            try {
                const fetchedEvents = await cieventsService.getCIEvents({
                    start_date: dayjs()
                        .tz("Asia/Jerusalem")
                        .add(3, "hours")
                        .toISOString(),
                    sort_by: "start_date",
                    sort_direction: "asc",
                    future_events: true,
                })
                setCievents(fetchedEvents)
            } catch (error) {
                console.error("Error fetching events:", error)
            } finally {
                setLoading(false)
            }
        }

        //NOTICE inorder to avoid using realtime channels, we use polling instead
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                clearInterval(subscriptionRef.current)
                fetchEvents()

                const intervalCallback = async () => {
                    await fetchEvents()
                    callCount++
                    // Clear and set new interval with updated duration
                    clearInterval(subscriptionRef.current)
                    subscriptionRef.current = setInterval(
                        intervalCallback,
                        getInterval()
                    )
                }

                subscriptionRef.current = setInterval(
                    intervalCallback,
                    getInterval()
                )
            } else {
                clearInterval(subscriptionRef.current)
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        handleVisibilityChange() // Explicitly call it once after adding the listener

        return () => {
            clearInterval(subscriptionRef.current)
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )
        }
    }, [])

    function addEventState(event: CIEvent) {
        setCievents((prev) =>
            [event, ...prev].sort((a, b) =>
                dayjs(a.start_date).diff(dayjs(b.start_date))
            )
        )
    }

    function updateEventState(eventId: string, event: DBCIEvent) {
        setCievents((prev) =>
            prev.map((e) => (e.id === eventId ? { ...e, ...event } : e))
        )
    }

    function removeEventState(eventId: string) {
        setCievents((prev) => prev.filter((e) => e.id !== eventId))
    }

    return (
        <CIEventsContext.Provider
            value={{
                ci_events,
                loading,
                addEventState,
                updateEventState,
                removeEventState,
            }}
        >
            {children}
        </CIEventsContext.Provider>
    )
}
