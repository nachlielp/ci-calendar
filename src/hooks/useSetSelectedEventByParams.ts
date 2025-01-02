//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { CIEvent } from "../util/interfaces"
import { store } from "../Store/store"
//TODO undefined to null
export const useSetSelectedEventByParams = () => {
    const { eventId } = useParams<{ eventId: string }>()
    const [selectedEvent, setSelectedEvent] = useState<CIEvent | undefined>(
        undefined
    )

    useEffect(() => {
        if (eventId) {
            const event = store.getEvents.find((event) => event.id === eventId)
            if (event) {
                setSelectedEvent(undefined)
                setSelectedEvent(event)
            }
        } else {
            setSelectedEvent(undefined)
        }
    }, [eventId])

    return { selectedEvent }
}
