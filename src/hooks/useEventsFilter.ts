import { useSearchParams } from "react-router-dom"
import { CIEvent } from "../util/interfaces"
import { useMemo } from "react"
import { districtOptions } from "../util/options"
import { eventOptions } from "../util/options"

interface IUseEventsFilterProps {
    events: CIEvent[]
}

export const useEventsFilter = ({ events }: IUseEventsFilterProps) => {
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

            return true
        })

        return filtered
    }, [events, searchParams])

    return filteredEvents
}

function hasOverlap(arr1: any[], arr2: any[]): boolean {
    return arr1.some((element) => arr2.includes(element))
}
