import {
    useInfiniteQuery,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { useUserId } from "../../app/auth/personal"
import { useCopy, useLanguage } from "../../app/language"
import { useServices } from "../../app/services"
import { useToday } from "../../app/useToday"
import catButtGif from "../../assets/img/cat-butt.gif?no-inline"
import { COMMON_COPY } from "../../lib/commonCopy"
import { defineCopy } from "../../lib/copy"
import { dayRangeLabel } from "../../lib/jerusalemDate"
import { ToggleButtons } from "../../ui/ToggleButtons"
import { EventDetails } from "../calendar/details/EventDetails"
import { pickTitle } from "../calendar/eventFormat"
import type { ManagedEvent } from "../events/managedEvent"
import { EventActions } from "./EventActions"
import {
    myPastEventsKey,
    myPastEventsQuery,
    myUpcomingEventsQuery,
} from "./myEvents"
import "./ManageEventsPage.scss"

// Legacy ManageUserEventsPage (Hebrew only there).
const COPY = defineCopy({
    he: {
        title: "האירועים שלי",
        createEvent: "יצירת אירוע",
        timeframe: "אירועים להצגה",
        past: "עבר",
        future: "עתיד",
        hidden: "אירוע מוסתר",
        cancelled: "אירוע מבוטל",
        noEvents: "נראה שעדיין אין לכם אירועים",
        loadMore: "טעינת אירועים נוספים",
        loadFailed: "לא הצלחנו לטעון את האירועים שלך",
    },
    en: {
        title: "My Events",
        createEvent: "Create Event",
        timeframe: "Events to show",
        past: "Past",
        future: "Future",
        hidden: "Hidden event",
        cancelled: "Cancelled event",
        noEvents: "Looks like you don't have any events yet",
        loadMore: "Load more events",
        loadFailed: "We couldn't load your events",
    },
    ru: {
        title: "Мои события",
        createEvent: "Создать событие",
        timeframe: "Какие события показать",
        past: "Прошедшие",
        future: "Будущие",
        hidden: "Скрытое событие",
        cancelled: "Отменённое событие",
        noEvents: "Похоже, у вас ещё нет событий",
        loadMore: "Загрузить ещё события",
        loadFailed: "Не удалось загрузить ваши события",
    },
})

type Timeframe = "past" | "future"

/**
 * `/manage-events` (creators, orgs and admins): the user's own events,
 * hidden ones included. Upcoming events load when the page opens; past
 * ones only once asked for, a page at a time. A row opens the event's
 * details and, for upcoming events, its actions.
 */
export default function ManageEventsPage() {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const services = useServices()
    const userId = useUserId()
    const navigate = useNavigate()
    const [timeframe, setTimeframe] = useState<Timeframe>("future")
    // Past events are fetched from the first time they are asked for.
    const [pastAsked, setPastAsked] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    // A deleted event's row (where focus was) is gone: focus moves to the
    // page's heading once the list has re-rendered without it.
    const heading = useRef<HTMLHeadingElement>(null)
    const [deleted, setDeleted] = useState(false)

    // Memoised on the day too, so events whose day passes drop out.
    const today = useToday()
    const upcomingOptions = useMemo(
        () => myUpcomingEventsQuery(services, userId, today),
        [services, userId, today],
    )
    const upcoming = useQuery({ ...upcomingOptions, enabled: !!userId })
    const past = useInfiniteQuery({
        ...myPastEventsQuery(services, userId),
        enabled: !!userId && pastAsked,
    })
    // Past pages last as long as the page: the next visit starts over.
    const queryClient = useQueryClient()
    useEffect(
        () => () =>
            queryClient.removeQueries({ queryKey: myPastEventsKey(userId) }),
        [queryClient, userId],
    )
    const pastEvents = useMemo(
        () => past.data?.pages.flatMap((page) => page.events),
        [past.data],
    )

    const showPast = timeframe === "past"
    const shown = showPast ? past : upcoming
    const events = showPast ? pastEvents : upcoming.data

    useEffect(() => {
        if (!deleted) return
        heading.current?.focus()
        setDeleted(false)
    }, [deleted])

    function selectTimeframe(next: Timeframe) {
        setTimeframe(next)
        if (next === "past") setPastAsked(true)
    }

    return (
        <main className="user-events-list-page">
            <h1 ref={heading} tabIndex={-1} className="visually-hidden">
                {copy.title}
            </h1>
            <header className="manage-events-header">
                <div className="header-buttons-container">
                    <button
                        type="button"
                        className="general-action-btn"
                        onClick={() => void navigate("/create-events")}
                    >
                        {copy.createEvent}
                    </button>
                    <ToggleButtons
                        label={copy.timeframe}
                        options={[
                            { key: "past", label: copy.past },
                            { key: "future", label: copy.future },
                        ]}
                        selected={timeframe}
                        onSelect={selectTimeframe}
                    />
                </div>
            </header>
            {events ? (
                events.length > 0 ? (
                    <ul
                        className="events-container"
                        aria-label={showPast ? copy.past : copy.future}
                    >
                        {events.map((event) => (
                            <EventRow
                                key={event.id}
                                event={event}
                                expanded={expandedId === event.id}
                                onToggle={() =>
                                    setExpandedId(
                                        expandedId === event.id
                                            ? null
                                            : event.id,
                                    )
                                }
                            >
                                {!showPast && (
                                    <EventActions
                                        event={event}
                                        upcoming={upcoming.data ?? []}
                                        userId={userId}
                                        onDeleted={() => setDeleted(true)}
                                    />
                                )}
                            </EventRow>
                        ))}
                    </ul>
                ) : (
                    <div className="no-events-message">
                        <img
                            className="no-events-message-gif"
                            src={catButtGif}
                            alt=""
                            width={300}
                            height={300}
                            loading="lazy"
                        />
                        <p className="no-events-message-label">
                            {copy.noEvents}
                        </p>
                    </div>
                )
            ) : shown.isError ? (
                <div className="card manage-events-status" role="alert">
                    <p>{copy.loadFailed}</p>
                    <button
                        type="button"
                        className="text-button"
                        onClick={() => void shown.refetch()}
                    >
                        {common.retry}
                    </button>
                </div>
            ) : (
                <p className="manage-events-status" role="status">
                    {common.loading}
                </p>
            )}
            {showPast && past.hasNextPage && (
                <div className="load-more">
                    {past.isFetchNextPageError && (
                        <p role="alert">{copy.loadFailed}</p>
                    )}
                    <button
                        type="button"
                        className="text-button"
                        disabled={past.isFetchingNextPage}
                        onClick={() => void past.fetchNextPage()}
                    >
                        {past.isFetchingNextPage
                            ? common.loading
                            : copy.loadMore}
                    </button>
                </div>
            )}
        </main>
    )
}

/** A row: title, days and state; open, the details and `children`. */
function EventRow({
    event,
    expanded,
    onToggle,
    children,
}: {
    event: ManagedEvent
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
