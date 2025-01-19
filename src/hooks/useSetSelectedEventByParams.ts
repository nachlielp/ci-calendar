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
        if (eventId && eventId !== selectedEvent?.id) {
            setSelectedEvent(undefined)
            const event = store.getCIEventById(eventId)
            if (event) {
                setSelectedEvent(event)
            }
        }
    }, [eventId, store.isLoading])

    return { selectedEvent }
}
