import { useEffect, useRef } from "react"
import { Link, useLocation } from "react-router"
import { CalendarIcon } from "../../ui/icons/CalendarIcon"
import { DomainIcon } from "../../ui/icons/DomainIcon"
import { PersonIcon } from "../../ui/icons/PersonIcon"
import { PinDropIcon } from "../../ui/icons/PinDropIcon"
import { ScheduleIcon } from "../../ui/icons/ScheduleIcon"
import { useCopy } from "../../app/language"
import { defineCopy } from "../../lib/copy"
import type { EventCard } from "./eventCards"
import { eventPath } from "./eventFormat"
import { EVENT_LOCALES } from "./eventLocales"
import "./EventList.scss"

const COPY = defineCopy({
    he: { label: "אירועים קרובים" },
    en: { label: "Upcoming events" },
    ru: { label: "Ближайшие события" },
})

/** Navigation state marking a details page opened from the list. */
export interface FromListState {
    fromList: true
}

/** The calendar's event cards (legacy EventsList and EventPreview). */
export function EventList({
    cards,
    label,
    revealId,
}: {
    cards: readonly EventCard[]
    /** The list's accessible name; "Upcoming events" by default. */
    label?: string
    /**
     * An event whose card is scrolled to the middle of the screen when the
     * list first shows with it (legacy useScroolToEventById: a shared link's
     * event, behind its details, so closing them shows it in the list). Only
     * then: a card that shows later (a filter cleared) isn't scrolled to.
     */
    revealId?: string
}) {
    const copy = useCopy(COPY)
    // Keep the filters (`f`) when opening an event.
    const { search } = useLocation()
    const revealItem = useRef<HTMLLIElement>(null)
    const revealed = useRef<string | undefined>(undefined)
    useEffect(() => {
        if (!revealId || revealed.current === revealId) return
        revealed.current = revealId
        revealItem.current?.scrollIntoView?.({ block: "center" })
    }, [revealId])
    return (
        <ul aria-label={label ?? copy.label} className="events-list">
            {cards.map((card) => (
                <li
                    key={card.event.id}
                    ref={card.event.id === revealId ? revealItem : undefined}
                    className="events-list-item"
                >
                    <EventPreview card={card} search={search} />
                </li>
            ))}
        </ul>
    )
}

function EventPreview({ card, search }: { card: EventCard; search: string }) {
    const { event } = card
    const { copy } = useCopy(EVENT_LOCALES)
    const state: FromListState = { fromList: true }
    return (
        <article className="event-preview card">
            {event.cancelled && (
                <div className="cancelled-event-cover">
                    <p className="cancelled-event-title">{copy.cancelled}</p>
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
                        card.title
                    ) : (
                        <Link
                            className="event-preview-link"
                            to={`${eventPath(event)}${search}`}
                            state={state}
                        >
                            {card.title}
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
                    <span className="event-label">{card.address}</span>
                </p>
                {card.teachers.length > 0 && (
                    <p className="event-row">
                        <PersonIcon className="event-icon" />
                        <span className="event-label">
                            {copy.with} {card.teachers.join(", ")}
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
