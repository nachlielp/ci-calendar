import { useQuery } from "@tanstack/react-query"
import { useServices } from "../../app/services"
import type { PublicEvent } from "@ci-calendar/core/features/calendar/publicEvent"
import {
    isEventLink,
    isLinkedEvent,
    linkedEventQuery,
    type LinkedEvent,
} from "@ci-calendar/core/features/calendar/linkedEvent"

/**
 * The event a shared link names, for the calendar to open over the list
 * (undefined without a link; not found at once if it can't be a link). Taken from the cached window when it is there
 * (no request). Otherwise — outside the window, or the window not loaded
 * yet — one request for that event alone, in parallel with the window, never
 * waiting for it.
 */
export function useLinkedEvent(
    link: string | undefined,
    windowEvents: readonly PublicEvent[] | undefined,
): LinkedEvent | undefined {
    const services = useServices()
    const inWindow = link
        ? windowEvents?.find((event) => isLinkedEvent(event, link))
        : undefined
    const plausible = !!link && isEventLink(link)
    const query = useQuery({
        ...linkedEventQuery(services, link ?? ""),
        enabled: plausible && !inWindow,
    })
    if (!link) return undefined
    if (!plausible) return { status: "notFound" }
    if (inWindow) return { status: "found", event: inWindow }
    if (query.data) return { status: "found", event: query.data }
    if (query.data === null) return { status: "notFound" }
    if (query.isError) {
        return { status: "failed", retry: () => void query.refetch() }
    }
    return { status: "loading", offline: query.fetchStatus === "paused" }
}
