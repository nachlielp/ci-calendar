//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { CIEvent } from "../util/interfaces"

export const useSetSelectedEvent = (events: CIEvent[]) => {
    const { eventId } = useParams<{ eventId: string }>()
    const [selectedEvent, setSelectedEvent] = useState<CIEvent | null>(null)
    useEffect(() => {
        if (eventId) {
            const event = events.find((event) => event.id === eventId)
            if (event) {
                setSelectedEvent(event)
                console.log("selectedEvent", selectedEvent)
            }
        }
    }, [eventId])

    return { selectedEvent }
}
