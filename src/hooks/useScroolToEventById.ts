import { useEffect } from "react"

export const useScrollToEventById = (
    eventId: string,
    eventRefs: React.RefObject<{ [key: string]: HTMLDivElement | null }>
) => {
    useEffect(() => {
        if (eventId && eventRefs.current) {
            if (eventRefs.current[eventId]) {
                eventRefs.current[eventId]?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                })
            }
        }
    }, [eventId])
}
