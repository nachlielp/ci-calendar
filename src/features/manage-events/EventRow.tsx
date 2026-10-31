import type { ReactNode } from "react"
import { useCopy, useLanguage } from "../../app/language"
import { defineCopy } from "../../lib/copy"
import { dayRangeLabel } from "../../lib/jerusalemDate"
import { EventDetails } from "../calendar/details/EventDetails"
import { pickTitle } from "../calendar/eventFormat"
import type { ManagedEvent } from "../events/managedEvent"

// A row of legacy's management lists (ManageUserEventsPage and
// ManageEventsList, the same rows), for my events and the admins' list.
// Styled by `@include event-rows` (./_event-rows.scss) in the page's
// stylesheet.
const COPY = defineCopy({
    he: { hidden: "אירוע מוסתר", cancelled: "אירוע מבוטל" },
    en: { hidden: "Hidden event", cancelled: "Cancelled event" },
    ru: { hidden: "Скрытое событие", cancelled: "Отменённое событие" },
})

/**
 * A row: title, days, the creator (admins' list) and state; open, the
 * event's details and `children` (its actions).
 */
export function EventRow({
    event,
    creator,
    expanded,
    onToggle,
    children,
}: {
    event: ManagedEvent
    /** The creator's name, after the days (legacy's admin list). */
    creator?: string
    expanded: boolean
    onToggle: () => void
    children: ReactNode
}) {
    const copy = useCopy(COPY)
    const { language } = useLanguage()
    const detailsId = `event-${event.id}`
    return (
        <li className="event-item">
            <button
                type="button"
                className={`event-summary ${expanded ? "active" : ""}`}
                aria-expanded={expanded}
                aria-controls={expanded ? detailsId : undefined}
                onClick={onToggle}
            >
                <span className="event-details">
                    <span className="event-summary-title">
                        {pickTitle(event, language)}
                    </span>
                    <span className="event-meta">
                        <time dateTime={event.startDate}>
                            {dayRangeLabel(event.startDate, event.endDate)}
                        </time>
                        {creator && (
                            <span className="event-creator">
                                <span className="separator">|</span>
                                {creator}
                            </span>
                        )}
                        {event.hidden && (
                            <span className="event-status">
                                <span className="separator">|</span>
                                <span>{copy.hidden}</span>
                            </span>
                        )}
                        {event.cancelled && (
                            <span className="event-status">
                                <span className="separator">|</span>
                                <span>{copy.cancelled}</span>
                            </span>
                        )}
                    </span>
                </span>
                <span
                    className={`chevron-icon ${expanded ? "active" : ""}`}
                    aria-hidden="true"
                >
                    &#x2039;
                </span>
            </button>
            {expanded && (
                <div className="event-expanded" id={detailsId}>
                    <EventDetails event={event} />
                    {children}
                </div>
            )}
        </li>
    )
}
