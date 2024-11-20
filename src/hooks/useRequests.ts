import { useState, useEffect, useRef } from "react"
import { requestsService } from "../supabase/requestsService"
import { CIRequest, RequestStatus } from "../util/interfaces"
import { RealtimeChannel } from "@supabase/supabase-js"

// TODO debounce name
export interface UseRequestsProps {
    status?: RequestStatus | null
    // types?: RequestType[]
    name?: string
    email?: string
    page?: number
    pageSize?: number
}

export default function useRequests({
    status,
    name,
}: // email,
// page,
// pageSize,
UseRequestsProps) {
    const [requests, setRequests] = useState<CIRequest[]>([])
    const subscriptionRef = useRef<RealtimeChannel | null>(null)

    useEffect(() => {
        const fetchRequests = async () => {
            console.log("useRequests.fetchRequests.status: ", status)
            const { data, error } = await requestsService.getAllRequests({
                status,
                name,
            })
            if (error) {
                console.error("useRequests.fetchRequests.error: ", error)
            }

            setRequests(data || [])
        }

        fetchRequests()
    }, [status])

    useEffect(() => {
        const fetchRequests = async () => {
            const { data, error } = await requestsService.getAllRequests({
                status,
            })
            if (error) {
                console.error("useRequests.fetchRequests.error: ", error)
            }

            setRequests(data || [])
        }

        const subscribeToRequests = async () => {
            console.log("subscribeToRequests on status change")
            const channel = await requestsService.subscribeToAllRequests(
                async (hasNewResponse) => {
                    if (hasNewResponse) {
                        await fetchRequests()
                    }
                }
            )
            return channel
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                subscribeToRequests().then((channel) => {
                    subscriptionRef.current = channel
                })
            } else {
                if (subscriptionRef.current) {
                    subscriptionRef.current.unsubscribe()
                }
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        subscribeToRequests().then((channel) => {
            subscriptionRef.current = channel
        })

        fetchRequests()

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe()
            }
        }
    }, [])

    return { requests }
}
