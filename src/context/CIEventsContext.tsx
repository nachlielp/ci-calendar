import {
    createContext,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
import { CIEvent } from "../util/interfaces"
import dayjs from "dayjs"
import { cieventsService } from "../supabase/cieventsService"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

dayjs.extend(timezone)
dayjs.extend(utc)

const MINUTE_MS = 1000 * 60

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
    const subscriptionRef = useRef<any>(null)

    useLayoutEffect(() => {
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
                console.log("fetchedEvents", fetchedEvents)
                console.log("time: ", dayjs().format("HH:mm:ss"))
                setCievents(fetchedEvents)
            } catch (error) {
                console.error("Error fetching events:", error)
            } finally {
                setLoading(false)
            }
        }

        //NOTICE inorder to avoid using realtime channels, we use polling instead
        const handleVisibilityChange = () => {
            console.log("handleVisibilityChange")
            if (document.visibilityState === "visible") {
                console.log("Tab is in view")
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
                console.log("Tab is not in view")
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

    return (
        <CIEventsContext.Provider value={{ ci_events, loading }}>
            {children}
        </CIEventsContext.Provider>
    )
}
