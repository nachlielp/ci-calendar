//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { CIEvent } from "../util/interfaces"

export const useSetSelectedEventByParams = (events: CIEvent[]) => {
    const { eventId } = useParams<{ eventId: string }>()
    console.log("eventId", eventId)
    const [selectedEvent, setSelectedEvent] = useState<CIEvent | null>(null)

    useEffect(() => {
        if (eventId) {
            const event = events.find((event) => event.id === eventId)
            console.log("event", event)
            if (event) {
                setSelectedEvent(null)
                setSelectedEvent(event)
            }
        } else {
            console.log("eventId is null")
            setSelectedEvent(null)
        }
    }, [eventId])

    return { selectedEvent }
}
