import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { utilService } from "../util/utilService"

export const useDefaultFilter = () => {
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        // Only run if we're at the root path AND there are no query parameters
        if (location.pathname === "/" && !location.search) {
            const eventTypes = localStorage.getItem("eventType") || "[]"
            const districts = localStorage.getItem("district") || "[]"
            const defaultFilter = [
                ...utilService.removeDuplicates(JSON.parse(eventTypes)),
                ...utilService.removeDuplicates(JSON.parse(districts)),
            ]

            // Only navigate if we have filters to apply
            if (defaultFilter.length > 0) {
                navigate(
                    `/?${defaultFilter
                        .map((filterItem: any) => `f=${filterItem}`)
                        .join("&")}`
                )
            }
        }
    }, [location.pathname])
}
