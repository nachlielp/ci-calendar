//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import { CIEvent } from "../util/interfaces"
import { store } from "../Store/store"
//TODO undefined to null
export const useSetSelectedEventByParams = () => {
    const { eventId } = useParams<{ eventId: string }>()

    const [selectedEvent, setSelectedEvent] = useState<CIEvent | undefined>(
        undefined
    )
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const getEvent = () => {
            if (!store.getLoadedAllEvents) {
                timerRef.current = setTimeout(() => {
                    getEvent()
                }, 300)
                return
            }
            if (eventId && eventId !== selectedEvent?.id) {
                const event = store.getCIEventById(eventId)
                if (event) {
                    setSelectedEvent(event)
                }
            }
        }

        setSelectedEvent(undefined)
        getEvent()

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [eventId, store.isLoading])

    return { selectedEvent }
}
