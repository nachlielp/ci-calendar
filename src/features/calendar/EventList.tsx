import { Link, useLocation } from "react-router"
import {
    CalendarIcon,
    DomainIcon,
    PersonIcon,
    PinDropIcon,
    ScheduleIcon,
} from "../../ui/icons"
import type { EventCard } from "./eventCards"
import { HEBREW, eventPath } from "./eventFormat"
import "./EventList.scss"

const COPY = { label: "אירועים קרובים" }

/** Navigation state marking a details page opened from the list. */
export interface FromListState {
    fromList: true
}

/** The calendar's event cards (legacy EventsList and EventPreview). */
export function EventList({
    cards,
    label = COPY.label,
}: {
    cards: readonly EventCard[]
    /** The list's accessible name. */
    label?: string
}) {
    // Keep the filters (`f`) when opening an event.
    const { search } = useLocation()
    return (
        <ul aria-label={label} className="events-list">
            {cards.map((card) => (
                <li key={card.event.id} className="events-list-item">
                    <EventPreview card={card} search={search} />
                </li>
            ))}
        </ul>
    )
}

function EventPreview({ card, search }: { card: EventCard; search: string }) {
    const { event } = card
    const state: FromListState = { fromList: true }
    return (
        <article className="event-preview card">
            {event.cancelled && (
                <div className="cancelled-event-cover">
                    <p className="cancelled-event-title">
                        {HEBREW.copy.cancelled}
                    </p>
                    {event.cancelledText && (
                        <p className="cancelled-event-text">
                            {event.cancelledText}
                        </p>
                    )}
                </div>
            )}
            <div
                className={`event-preview-content ${event.cancelled ? "cancelled" : ""}`}
            >
                <h2 className="event-title">
                    {/* Cancelled events don't open, as in the legacy app. */}
                    {event.cancelled ? (
                        event.title
                    ) : (
                        <Link
                            className="event-preview-link"
                            to={`${eventPath(event)}${search}`}
                            state={state}
                        >
                            {event.title}
                        </Link>
                    )}
                </h2>
                {card.organisations.length > 0 && (
                    <p className="event-row">
                        <DomainIcon className="event-icon" />
                        <span className="event-label">
                            {card.organisations.join(", ")}
                        </span>
                    </p>
                )}
                <p className="event-row">
                    <CalendarIcon className="event-icon" />
                    <span className="event-label">{card.dateLabel}</span>
                    {card.timeRange && (
                        <>
                            <ScheduleIcon className="event-icon" />
                            <span className="event-label event-time">
                                {card.timeRange}
                            </span>
                        </>
                    )}
                </p>
                <p className="event-row">
                    <PinDropIcon className="event-icon" />
                    <span className="event-label">{event.address.label}</span>
                </p>
                {card.teachers.length > 0 && (
                    <p className="event-row">
                        <PersonIcon className="event-icon" />
                        <span className="event-label">
                            {HEBREW.copy.with} {card.teachers.join(", ")}
                        </span>
                    </p>
                )}
                <p className="event-tags">
                    {card.types.map((type) => (
                        <span key={type} className="event-tag">
                            {type}
                        </span>
                    ))}
                </p>
            </div>
        </article>
    )
}
