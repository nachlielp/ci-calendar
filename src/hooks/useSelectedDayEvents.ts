import { useEffect, useState } from "react"
import { Dayjs } from "dayjs"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault("Asia/Jerusalem")
import { CIEvent } from "../util/interfaces"

export const useSelectedDayEvents = (events: CIEvent[], selectedDay: Dayjs) => {
    const [selectedDayEvents, setSelectedDayEvents] = useState<CIEvent[]>([])
    useEffect(() => {
        const todaysEvents = events.filter((event) => {
            if (event.is_multi_day) {
                return dayjs(selectedDay).isBetween(
                    dayjs(event.start_date),
                    dayjs(event.end_date),
                    "day",
                    "[]"
                )
            }
            return dayjs(selectedDay).isSame(dayjs(event.start_date), "day")
        })
        setSelectedDayEvents(todaysEvents)
    }, [selectedDay])

    return selectedDayEvents
}
