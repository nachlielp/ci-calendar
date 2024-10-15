import { useEffect, useState } from "react"
import { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { CIEvent } from "../util/interfaces"

export const useSelectedDayEvents = (events: CIEvent[], selectedDay: Dayjs) => {
    const [selectedDayEvents, setSelectedDayEvents] = useState<CIEvent[]>([])

    useEffect(() => {
        const todaysEvents = events.filter((event) =>
            dayjs(selectedDay).isBetween(
                dayjs(event.start_date),
                dayjs(event.end_date),
                "day",
                "[]"
            )
        )
        setSelectedDayEvents(todaysEvents)
    }, [selectedDay])

    return selectedDayEvents
}
