import { useQuery } from "@tanstack/react-query"
import { useServices } from "../../app/services"
import { useIsOnline } from "../../app/useIsOnline"
import { publicWindowQuery, type PublicEvent } from "./publicWindow"
import { StaleDataNotice } from "./StaleDataNotice"

// `start_date` is a calendar day, so format it as one (UTC midnight → no
// timezone shift).
const dayFormatter = new Intl.DateTimeFormat("he-IL", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
})

function formatDay(day: string) {
    return dayFormatter.format(new Date(`${day}T00:00:00Z`))
}

export default function CalendarPage() {
    const services = useServices()
    const isOnline = useIsOnline()
    const {
        data: events,
        isError,
        refetch,
    } = useQuery(publicWindowQuery(services))
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
                <h1>לוח אירועי קונטקט אימפרוביזציה</h1>
            </header>
            {staleReason && <StaleDataNotice reason={staleReason} />}
            {events ? (
                events.length === 0 ? (
                    <p>אין אירועים קרובים</p>
                ) : (
                    <ul aria-label="אירועים קרובים" className="event-list">
                        {events.map((event) => (
                            <EventItem key={event.id} event={event} />
                        ))}
                    </ul>
                )
            ) : !isOnline ? (
                // The request waits for the connection and is sent once back
                // online.
                <p role="alert">
                    אין חיבור לאינטרנט – לא ניתן לטעון את האירועים
                </p>
            ) : isError ? (
                <div role="alert">
                    <p>לא הצלחנו לטעון את האירועים</p>
                    <button type="button" onClick={() => refetch()}>
                        נסו שוב
                    </button>
                </div>
            ) : (
                <p role="status">טוען אירועים…</p>
            )}
        </main>
    )
}

function EventItem({ event }: { event: PublicEvent }) {
    return (
        <li className="event-item">
            <time dateTime={event.startDate}>{formatDay(event.startDate)}</time>
            <h2>{event.title}</h2>
            {event.cancelled && <span className="cancelled">בוטל</span>}
        </li>
    )
}
