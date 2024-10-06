import { useState, useEffect } from "react"
import { CiRequest, requestsService } from "../supabase/requestsService"

export default function useRequests(user_id: string) {
    const [requests, setRequests] = useState<CiRequest[]>([])

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
