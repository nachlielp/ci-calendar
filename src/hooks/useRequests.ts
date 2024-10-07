import { useState, useEffect } from "react"
import { requestsService } from "../supabase/requestsService"
import { CIRequest } from "../util/interfaces"

export default function useRequests(user_id: string) {
    const [requests, setRequests] = useState<CIRequest[]>([])

    useEffect(() => {
        const fetchRequests = async () => {
            const { data, error } = await requestsService.getUserRequests(
                user_id
            )
            if (error) {
                console.error("useRequests.fetchRequests.error: ", error)
            }

            setRequests(data || [])
        }

        fetchRequests()
    }, [user_id])

    return { requests }
}
