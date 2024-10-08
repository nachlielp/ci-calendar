import { useState, useEffect } from "react"
import { requestsService } from "../supabase/requestsService"
import { CIRequest } from "../util/interfaces"

export default function useRequests(user_id: string) {
    const [requests, setRequests] = useState<CIRequest[]>([])

    useEffect(() => {
        const fetchRequests = async () => {
            if (!user_id) {
                return
            }
            const { data, error } = await requestsService.getUserRequests(
                user_id
            )
            if (error) {
                console.error("useRequests.fetchRequests.error: ", error)
            }

            setRequests(data || [])
        }

        const subscription = requestsService.subscribeToResponses(
            user_id,
            async (hasNewResponse) => {
                if (hasNewResponse) {
                    await fetchRequests()
                }
            }
        )

        fetchRequests()

        return () => {
            subscription.unsubscribe()
        }
    }, [user_id])

    return { requests }
}
