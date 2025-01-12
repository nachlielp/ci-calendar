//get eventId from url, handle edge cases where event is filtered out

import { useEffect, useState } from "react"
import { useParams, useLocation } from "react-router"
import { CIEvent } from "../util/interfaces"
import { store } from "../Store/store"
import posthog from "posthog-js"

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
                posthog.capture("event_viewed", {
                    event_id: event.id,
                    event_short_id: event.short_id,
                    event_title: event.title,
                    source_page: window.location.pathname,
                    creator_id: event.user_id,
                })
                setTimeout(() => {
                    setSelectedEvent(event)
                }, 100)
            }
        }
    }, [eventId, location.pathname])

    return { selectedEvent }
}
