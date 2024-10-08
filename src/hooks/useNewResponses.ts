import { useEffect, useState } from "react"
import { requestsService } from "../supabase/requestsService"

export default function useNewResponses(user_id?: string) {
    if (!user_id) {
        return { isNewResponse: false }
    }
    const [isNewResponse, setIsNewResponse] = useState<boolean>(false)

    useEffect(() => {
        const fetchNewResponses = async () => {
            const response = await requestsService.doesUserHaveNewClosedRequest(
                user_id
            )

            setIsNewResponse(response)
        }

        fetchNewResponses()
    }, [user_id])

    return { isNewResponse }
}
