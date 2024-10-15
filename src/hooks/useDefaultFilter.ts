import { useEffect } from "react"
import { useUser } from "../context/UserContext"
import { useNavigate } from "react-router-dom"
export const useDefaultFilter = () => {
    const { user } = useUser()
    const navigate = useNavigate()
    useEffect(() => {
        if (user) {
            const eventTypes = user.default_filter?.eventTypes || []
            const districts = user.default_filter?.districts || []
            const filterURL =
                eventTypes
                    .map((eventType) => `eventType=${eventType}`)
                    .join("&") +
                districts.map((district) => `&district=${district}`).join("")
            navigate(`/?${filterURL}`)
        }
    }, [user])
}
