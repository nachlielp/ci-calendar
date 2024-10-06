import { useEventsFilter } from "../../hooks/useEventsFilter"
import { CIEvent } from "../../util/interfaces"

export function WeeklyEventsPage({ events }: { events: CIEvent[] }) {
    let filteredEvents = useEventsFilter({ events, isWeekendPage: true })

    return (
        <div style={{ direction: "rtl" }}>
            <h1>ארועי השבוע</h1>
            <div>
                {filteredEvents.map((event: CIEvent) => (
                    <div key={event.id}>
                        <h3>{event.title}</h3>
                        <p>{event.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
