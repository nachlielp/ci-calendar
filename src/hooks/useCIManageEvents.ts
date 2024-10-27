import { useEffect, useRef, useState } from "react"
import { CIEvent } from "../util/interfaces"
import {
    cieventsService,
    DBCIEvent,
    FilterOptions,
} from "../supabase/cieventsService"
import dayjs from "dayjs"
import { SelectOption } from "../util/options"
import { useCIEvents } from "../context/CIEventsContext"

const MINUTE_MS = 1000 * 60

export const useCIManageEvents = (filterBy: FilterOptions = {}) => {
    const [ci_past_events, setCIPastEvents] = useState<CIEvent[]>([])
    const [ci_future_events, setCIFutureEvents] = useState<CIEvent[]>([])
    const [ci_events_teachers, setCIEventsTeachers] = useState<SelectOption[]>(
        []
    )
    const {
        updateEventState: updateMainPageEventState,
        removeEventState: removeMainPageEventState,
    } = useCIEvents()
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
    }, [filterBy.creator_id])

    function updateEventState(eventId: string, event: DBCIEvent) {
        setCIPastEvents((prev) =>
            prev.map((e) => (e.id === eventId ? { ...e, ...event } : e))
        )

        setCIFutureEvents((prev) =>
            prev.map((e) => (e.id === eventId ? { ...e, ...event } : e))
        )
        updateMainPageEventState(eventId, event)
    }

    function removeEventState(eventId: string) {
        setCIPastEvents((prev) => prev.filter((e) => e.id !== eventId))
        setCIFutureEvents((prev) => prev.filter((e) => e.id !== eventId))
        removeMainPageEventState(eventId)
    }

    function addEventState(event: CIEvent) {
        setCIFutureEvents((prev) =>
            [event, ...prev].sort((a, b) =>
                dayjs(a.start_date).diff(dayjs(b.start_date))
            )
        )
    }

    return {
        ci_past_events,
        ci_future_events,
        ci_events_teachers,
        loading,
        updateEventState,
        removeEventState,
        addEventState,
    }
}
