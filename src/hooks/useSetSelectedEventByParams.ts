//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useState } from "react"
import { useParams, useLocation } from "react-router"
import { CIEvent } from "../util/interfaces"
import { store } from "../Store/store"
//TODO undefined to null
export const useSetSelectedEventByParams = () => {
    const { eventId } = useParams<{ eventId: string }>()
    const location = useLocation()

    const [selectedEvent, setSelectedEvent] = useState<CIEvent | undefined>(
        undefined
    )

    useEffect(() => {
        setSelectedEvent(undefined)

        if (eventId) {
            const event = store.getCIEventById(eventId)
            if (event) {
                setTimeout(() => {
                    setSelectedEvent(event)
                }, 100)
            }
        }
    }, [eventId, location.pathname])

    return { selectedEvent }
}
