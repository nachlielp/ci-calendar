//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { CIEvent } from "../util/interfaces"
import { store } from "../Store/store"

export const useSetSelectedEventByParams = () => {
    const { eventId } = useParams<{ eventId: string }>()
    const [selectedEvent, setSelectedEvent] = useState<CIEvent | null>(null)

    useEffect(() => {
        if (eventId) {
            const event = store.getEvents.find((event) => event.id === eventId)
            if (event) {
                setSelectedEvent(null)
                setSelectedEvent(event)
            }
        } else {
            setSelectedEvent(null)
        }
    }, [eventId])

    return { selectedEvent }
}
