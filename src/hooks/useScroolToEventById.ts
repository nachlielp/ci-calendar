import { useEffect, useRef } from "react"

export const useScrollToEventById = (
    eventId: string,
    eventRefs: React.RefObject<{ [key: string]: HTMLDivElement | null }>
) => {
    const isFirstRender = useRef(true)

    useEffect(() => {
        if (eventId && eventRefs.current && isFirstRender.current) {
            if (eventRefs.current[eventId]) {
                eventRefs.current[eventId]?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                })
            }
        }
        isFirstRender.current = false
    }, [eventId])
}
