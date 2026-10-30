import { useQuery } from "@tanstack/react-query"
import { lazy, Suspense, useEffect, useMemo } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useServices } from "../../app/services"
import { useIsOnline } from "../../app/useIsOnline"
import { toEventCards } from "./eventCards"
import { EventList, type FromListState } from "./EventList"
import { useLinkedEvent } from "./linkedEvent"
import { publicWindowQuery } from "./publicWindow"
import { StaleDataNotice } from "./StaleDataNotice"

const loadEventDetails = () => import("./details/EventDetailsDialog")
const EventDetailsDialog = lazy(loadEventDetails)
const NotFoundPage = lazy(() => import("../../pages/NotFoundPage"))

const COPY = {
    title: "לוח אירועי קונטקט אימפרוביזציה",
    noEvents: "אין אירועים קרובים",
    offline: "אין חיבור לאינטרנט – לא ניתן לטעון את האירועים",
    loadFailed: "לא הצלחנו לטעון את האירועים",
    retry: "נסו שוב",
    loading: "טוען אירועים…",
}

/**
 * The public calendar at `/`, and with an event open over it at
 * `/event/:eventId` or the short `/:eventId` (see `useLinkedEvent`).
 */
export default function CalendarPage() {
    const services = useServices()
    const isOnline = useIsOnline()
    const { eventId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()

    // Stable options keep `select`'s result, and the cards below, stable
    // across renders.
    const windowQuery = useMemo(() => publicWindowQuery(services), [services])
    const { data: events, isError, refetch } = useQuery(windowQuery)
    const cards = useMemo(() => events && toEventCards(events), [events])
    const linked = useLinkedEvent(eventId, events)

    // Fetch the details' code alongside the linked event's data.
    useEffect(() => {
        if (eventId) void loadEventDetails()
    }, [eventId])

    if (linked?.status === "notFound") {
        return (
            <Suspense fallback={null}>
                <NotFoundPage />
            </Suspense>
        )
    }

    const closeEvent = () => {
        // Opened from the list: going back closes it and keeps the history
        // tidy. Opened from a shared link: replace it with the calendar.
        if ((location.state as FromListState | null)?.fromList) {
            void navigate(-1)
        } else {
            const calendar = { pathname: "/", search: location.search }
            void navigate(calendar, { replace: true })
        }
    }

    // Events, once there (fetched or restored from storage), stay on screen;
    // being offline or a failed refresh only adds a notice that they may be
    // out of date.
    const staleReason = !events
        ? null
        : !isOnline
          ? "offline"
          : isError
            ? "refreshFailed"
            : null

    return (
        <main className="calendar-page">
            <header>
                <h1>{COPY.title}</h1>
            </header>
            {staleReason && <StaleDataNotice reason={staleReason} />}
            {cards ? (
                cards.length === 0 ? (
                    <p>{COPY.noEvents}</p>
                ) : (
                    <EventList cards={cards} />
                )
            ) : !isOnline ? (
                // The request waits for the connection and is sent once back
                // online.
                <p role="alert">{COPY.offline}</p>
            ) : isError ? (
                <div role="alert">
                    <p>{COPY.loadFailed}</p>
                    <button type="button" onClick={() => refetch()}>
                        {COPY.retry}
                    </button>
                </div>
            ) : (
                <p role="status">{COPY.loading}</p>
            )}
            {linked && (
                <Suspense fallback={null}>
                    <EventDetailsDialog
                        key={eventId}
                        linked={linked}
                        onClose={closeEvent}
                    />
                </Suspense>
            )}
        </main>
    )
}
