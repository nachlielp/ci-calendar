import { useSearchParams } from "react-router-dom"
import { CIEvent, WeekendDistrict, WeekendEventType } from "../util/interfaces"
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
    isWeekendPage,
}: IUseEventsFilterProps) => {
    const [searchParams] = useSearchParams()

    const filteredEvents = useMemo(() => {
        const eventTypes = searchParams.getAll("eventType")
        const districts = searchParams.getAll("district")

        const weekendTypes = searchParams
            .getAll("t")
            .map(
                (type) =>
                    WeekendEventType[type as keyof typeof WeekendEventType]
            )
        const weekendDistricts = searchParams
            .getAll("d")
            .map(
                (district) =>
                    WeekendDistrict[district as keyof typeof WeekendDistrict]
            )

        let filtered = events

        if (isWeekendPage) {
            console.log("weekendTypes: ", weekendTypes)
            const weekendStart = dayjs().startOf("day")
            const weekendEnd = dayjs().add(1, "week").endOf("week").endOf("day")
            filtered = filtered.filter(
                (event) =>
                    dayjs(event.startDate) >= weekendStart &&
                    dayjs(event.startDate) <= weekendEnd &&
                    (!weekendTypes.length ||
                        hasOverlap(
                            weekendTypes,
                            event.segments.map((segment) => segment.type)
                        )) &&
                    (!weekendDistricts.length ||
                        hasOverlap(weekendDistricts, [event.district]))
            )
            return filtered
        }

        if (uids && uids.length > 0) {
            filtered = filtered.filter((event) =>
                uids.includes(event.creatorId)
            )
        }

        if (showFuture !== undefined) {
            const now = dayjs()
            const startOfToday = dayjs().startOf("day")
            if (showFuture) {
                filtered = filtered.filter(
                    (event) => dayjs(event.endDate) >= startOfToday
                )
            } else {
                filtered = filtered.filter(
                    (event) => dayjs(event.startDate) < now
                )
            }
        }

        filtered = filtered.filter((event) => {
            const eventTypeList =
                event.startDate === event.endDate
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
