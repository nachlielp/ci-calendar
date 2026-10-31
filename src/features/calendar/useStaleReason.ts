import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { useServices } from "../../app/services"
import { useIsOnline } from "../../app/useIsOnline"
import { publicWindowQuery } from "./publicWindow"

export type StaleReason = "offline" | "refreshFailed"

/**
 * Why the events on hand may be out of date: the device is offline, or the
 * last refresh failed. `null` while they are current, and while there are no
 * events at all (the calendar then says it can't load them instead).
 *
 * Reads the public window without fetching it, so the header can show the
 * sign on every page; the calendar page owns the fetching.
 */
export function useStaleReason(): StaleReason | null {
    const services = useServices()
    const isOnline = useIsOnline()
    const query = useMemo(
        () => ({ ...publicWindowQuery(services), enabled: false }),
        [services],
    )
    const { data, isError } = useQuery(query)
    if (!data) return null
    if (!isOnline) return "offline"
    return isError ? "refreshFailed" : null
}
