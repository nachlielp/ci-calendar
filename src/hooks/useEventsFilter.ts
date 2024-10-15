import { useSearchParams } from "react-router-dom"
import { CIEvent } from "../util/interfaces"
// import { CIEvent, WeekendDistrict, WeekendEventType } from "../util/interfaces"
import dayjs from "dayjs"
import { useMemo } from "react"

interface IUseEventsFilterProps {
    events: CIEvent[]
    showFuture?: boolean
    uids?: string[]
    isWeekendPage?: boolean
}

export const useEventsFilter = ({
    events,
    showFuture,
    uids,
}: // isWeekendPage,
IUseEventsFilterProps) => {
    const [searchParams] = useSearchParams()

    const filteredEvents = useMemo(() => {
        const eventTypes = searchParams.getAll("eventType")
        const districts = searchParams.getAll("district")

        let filtered = events

        if (showFuture !== undefined) {
            const now = dayjs()
            const startOfToday = dayjs().startOf("day")
            if (showFuture) {
                filtered = filtered.filter(
                    (event) => dayjs(event.end_date) >= startOfToday
                )
            } else {
                filtered = filtered.filter(
                    (event) => dayjs(event.start_date) < now
                )
            }
        }

        filtered = filtered.filter((event) => {
            const eventTypeList =
                event.start_date === event.end_date
                    ? event.segments.map((segment) => segment.type)
                    : [event.type]
            if (event.type !== "") {
                eventTypeList.push(event.type)
            }
            if (eventTypes.length === 0 && districts.length === 0) {
                return true
            }
            if (eventTypes.length === 0) {
                return hasOverlap(districts, [event.district])
            }
            if (districts.length === 0) {
                return hasOverlap(eventTypes, eventTypeList)
            }

            return (
                hasOverlap(districts, [event.district]) &&
                hasOverlap(eventTypes, eventTypeList)
            )
        })

        return filtered
    }, [events, showFuture, searchParams, uids])

    return filteredEvents
}

function hasOverlap(arr1: any[], arr2: any[]): boolean {
    return arr1.some((element) => arr2.includes(element))
}
