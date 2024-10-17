import { useEffect } from "react"
import { useUser } from "../context/UserContext"
import { useNavigate } from "react-router-dom"
import { utilService } from "../util/utilService"
export const useDefaultFilter = () => {
    const { user } = useUser()
    const navigate = useNavigate()
    useEffect(() => {
        if (user) {
            const eventTypes = user.default_filter?.eventTypes || []
            const districts = user.default_filter?.districts || []
            const filterURL =
                eventTypes.map((eventType) => `f=${eventType}`).join("&") +
                districts.map((district) => `&f=${district}`).join("")
            utilService.saveFiltersToLocalStorage(districts, eventTypes)
            navigate(`/?${filterURL}`)
        } else {
            const defaultFilterObj = JSON.parse(
                localStorage.getItem("defaultFilters") || "{}"
            )
            const defaultFilter = [
                ...(defaultFilterObj.eventTypes || []),
                ...(defaultFilterObj.districts || []),
            ]
            navigate(
                `/?${defaultFilter
                    .map((filterItem: any) => `f=${filterItem}`)
                    .join("&")}`
            )
        }
    }, [user])
}
