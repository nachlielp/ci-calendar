import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { utilService } from "../util/utilService"

export const useDefaultFilter = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        if (searchParams?.get("f")) {
            const filters = searchParams.get("f")?.split(",")
            const eventTypes = filters?.filter(
                (filter) =>
                    utilService.getFilterItemType(filter) === "eventType"
            )
            const districts = filters?.filter(
                (filter) => utilService.getFilterItemType(filter) === "district"
            )
            localStorage.setItem("eventType", JSON.stringify(eventTypes))
            localStorage.setItem("district", JSON.stringify(districts))
        } else {
            const eventTypes = localStorage.getItem("eventType") || "[]"
            const districts = localStorage.getItem("district") || "[]"
            const defaultFilter = [
                ...utilService.removeDuplicates(JSON.parse(eventTypes)),
                ...utilService.removeDuplicates(JSON.parse(districts)),
            ]

            navigate(
                `/?${defaultFilter
                    .map((filterItem: any) => `f=${filterItem}`)
                    .join("&")}`
            )
        }
    }, [])
}
