import { useSearchParams } from "react-router-dom"
import { CIEvent } from "../util/interfaces"
import dayjs from "dayjs"
import { useMemo } from "react"
import { districtOptions } from "../util/options"
import { eventOptions } from "../util/options"

interface IUseEventsFilterProps {
    events: CIEvent[]
    showPast?: boolean
    uids?: string[]
}

export const useEventsFilter = ({
    events,
    showPast,
    uids,
}: IUseEventsFilterProps) => {
    const [searchParams] = useSearchParams()

    const filteredEvents = useMemo(() => {
        const filters = searchParams.getAll("f")

        const eventTypes = eventOptions
            .filter((option) => filters.includes(option.value))
            .map((option) => option.value)
        const districts = districtOptions
            .filter((option) => filters.includes(option.value))
            .map((option) => option.value)

        let filtered = events

        const now = dayjs().tz("Asia/Jerusalem").add(3, "hours")

        filtered = filtered.filter((event) => {
            const eventTypeList = event.is_multi_day
                ? [event.type]
                : event.segments.map((segment) => segment.type)

            const eventDistrict = event.district

            if (
                districts.length > 0 &&
                !districts.some((district) => district === eventDistrict)
            ) {
                return false
            }

            if (
                eventTypes.length > 0 &&
                !hasOverlap(eventTypes, eventTypeList)
            ) {
                return false
            }

            if (uids && !uids.includes(event.creator_id)) {
                return false
            }

            const now = dayjs()
                .tz("Asia/Jerusalem")
                .add(3, "hours")
                .toISOString()
            const endOfSingleDay = dayjs(
                event?.segments[event.segments.length - 1]?.endTime
            )
                .add(3, "hours")
                .toISOString()
            const endOfMultiDay = dayjs(event.end_date)
                .add(3, "hours")
                .toISOString()

            const isOngoing = now < endOfSingleDay || now < endOfMultiDay

            if (showPast === true && !isOngoing) {
                return true
            } else {
                return isOngoing
            }
        })

        if (showPast) {
            filtered = filtered.sort((a, b) =>
                dayjs(b.start_date).diff(dayjs(a.start_date))
            )
        }
        return filtered
    }, [events, showPast, searchParams, uids])

    return filteredEvents
}

function hasOverlap(arr1: any[], arr2: any[]): boolean {
    return arr1.some((element) => arr2.includes(element))
}
