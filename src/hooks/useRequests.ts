import { useState, useEffect } from "react"
import { requestsService } from "../supabase/requestsService"
import { CIRequest, RequestStatus, RequestType } from "../util/interfaces"
import { RealtimeChannel } from "@supabase/supabase-js"

export interface UseRequestsProps {
    status?: RequestStatus[] | null
    type?: RequestType | null
    name?: string[]
    email?: string
    page?: number
    pageSize?: number
}

export default function useUserRequests({
    status,
    type,
    name,
}: // email,
// page,
// pageSize,
UseRequestsProps) {
    const [requests, setRequests] = useState<CIRequest[]>([])

    useEffect(() => {
        const fetchRequests = async () => {
            const { data, error } = await requestsService.getAllRequests({
                status,
                type,
                name,
                // email,
                // page,
                // pageSize,
            })
            if (error) {
                console.error("useRequests.fetchRequests.error: ", error)
            }

            setRequests(data || [])
        }

        const subscribeToRequests = async () => {
            const channel = await requestsService.subscribeToAllRequests(
                async (hasNewResponse) => {
                    if (hasNewResponse) {
                        await fetchRequests()
                    }
                }
            )
            return channel
        }

        let subscription: RealtimeChannel | null = null

        subscribeToRequests().then((channel) => {
            subscription = channel
        })

        fetchRequests()

        return () => {
            if (subscription) {
                subscription.unsubscribe()
            }
        }
    }, [status])

    return { requests }
}
