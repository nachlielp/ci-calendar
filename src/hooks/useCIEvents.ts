import { useEffect, useRef, useState } from "react"
import { AppConfig, CIEvent } from "../util/interfaces"
import { configService } from "../supabase/configService"
import { utilService } from "../util/utilService"
import { cieventsService } from "../supabase/cieventsService"
import dayjs from "dayjs"
import { store } from "../Store/store"
const MINUTE_MS = 1000 * 60

export const useCIEvents = () => {
    const [ci_events, setCievents] = useState<CIEvent[]>([])
    const [config, setConfig] = useState<AppConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const subscriptionRef = useRef<any>(null)

    useEffect(() => {
        if (store.ci_events.length > 0) {
            clearInterval(subscriptionRef.current)
            return
        }

        const fetchConfig = async () => {
            const config = await configService.getConfig()

            const formattedConfig = utilService.formatConfig(config)

            setConfig(formattedConfig)
        }

        fetchConfig()

        let callCount = 0

        const getInterval = () => {
            if (callCount < 5) return MINUTE_MS * 2
            if (callCount < 10) return MINUTE_MS * 5
            return MINUTE_MS * 60
        }

        const fetchEvents = async () => {
            console.log("fetchEvents")
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

        //NOTICE in order to avoid using realtime channels, we use polling instead
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
    }, [store.user.user_id])

    return {
        ci_events: store.ci_events.length > 0 ? store.ci_events : ci_events,
        config,
        loading,
    }
}
