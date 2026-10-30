import { useQuery } from "@tanstack/react-query"
import { useServices } from "../../app/services"
import { publicWindowQuery, type PublicEvent } from "./publicWindow"

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
    const {
        data: events,
        isPending,
        isError,
        refetch,
    } = useQuery(publicWindowQuery(services))

    return (
        <main className="calendar-page">
            <header>
                <h1>לוח אירועי קונטקט אימפרוביזציה</h1>
            </header>
            {isPending ? (
                <p role="status">טוען אירועים…</p>
            ) : isError ? (
                <div role="alert">
                    <p>לא הצלחנו לטעון את האירועים</p>
                    <button type="button" onClick={() => refetch()}>
                        נסו שוב
                    </button>
                </div>
            ) : events.length === 0 ? (
                <p>אין אירועים קרובים</p>
            ) : (
                <ul aria-label="אירועים קרובים" className="event-list">
                    {events.map((event) => (
                        <EventItem key={event.id} event={event} />
                    ))}
                </ul>
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
