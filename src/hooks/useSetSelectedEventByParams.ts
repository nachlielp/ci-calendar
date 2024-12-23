//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { CIEvent } from "../util/interfaces"

export const useSetSelectedEventByParams = (events: CIEvent[]) => {
    const { eventId } = useParams<{ eventId: string }>()
    const [selectedEvent, setSelectedEvent] = useState<CIEvent | null>(null)

    useEffect(() => {
        if (eventId) {
            const event = events.find((event) => event.id === eventId)
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
