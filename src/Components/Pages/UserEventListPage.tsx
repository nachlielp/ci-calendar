"use client"

import { useState } from "react"
import { CIEvent } from "../../util/interfaces"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import { useNavigate } from "react-router-dom"
import { useUser } from "../../Context/UserContext"
import { useCIManageEvents } from "../../hooks/useCIManageEvents"
import { useIsMobile } from "../../hooks/useIsMobile"
import { Icon } from "../Common/Icon"
import Loading from "../Common/Loading"
import MenuButtons from "../Common/MenuButtons"
import FullEventCard from "../Events/Display/FullEventCard"
import ManageEventActions from "../Events/Management/ManageEventActions"

dayjs.extend(isSameOrAfter)

export default function UserEventsListPage() {
    const navigate = useNavigate()
    const isPhone = useIsMobile()
    const { user, updateUserState } = useUser()

    const [showPast, setShowPast] = useState(false)
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

    const { updateEventState, removeEventState: removeEventFromMainStage } =
        useCIManageEvents({
            user_id: user?.user_id,
        })

    if (!user) {
        return <Loading />
    }

    function removeEventState(eventId: string) {
        if (!user) return
        updateUserState({
            ci_events: user.ci_events.filter((e) => e.id !== eventId),
        })
        removeEventFromMainStage(eventId)
    }

    function handleHideEventState(eventId: string, hide: boolean) {
        const event = user?.ci_events.find((e) => e.id === eventId)
        if (event) {
            updateEventState(event.id, { ...event, hide })
        }
    }

    function handleCancelledEventState(eventId: string, cancelled: boolean) {
        const event = user?.ci_events.find((e) => e.id === eventId)
        if (event) {
            updateEventState(event.id, { ...event, cancelled })
        }
    }

    function onSelectTimeframe(key: string) {
        setShowPast(key === "past")
    }

    function onGoToCreateEvent() {
        console.log("onGoToCreateEvent")
        navigate("/create-events")
    }

    const filteredEvents = pastFutureEvents(user.ci_events, showPast)

    return (
        <section className="user-events-list">
            <header
                className={`manage-events-header ${
                    isPhone ? "header-phone" : "header-desktop"
                }`}
            >
                <div className="header-buttons-container">
                    <button
                        className="general-action-btn"
                        onClick={onGoToCreateEvent}
                    >
                        <label className="create-event-label">
                            יצירת אירוע
                        </label>
                    </button>
                    <MenuButtons
                        onSelectKey={onSelectTimeframe}
                        options={[
                            {
                                key: "past",
                                title: "עבר",
                            },
                            {
                                key: "future",
                                title: "עתיד",
                            },
                        ]}
                        defaultKey="future"
                    />
                </div>
            </header>
            <div className="events-container" role="list">
                {filteredEvents.map((event) => (
                    <div key={event.id} className="event-item" role="listitem">
                        <div
                            className={`event-summary ${
                                expandedEventId === event.id ? "active" : ""
                            }`}
                            onClick={() =>
                                setExpandedEventId(
                                    expandedEventId === event.id
                                        ? null
                                        : event.id
                                )
                            }
                        >
                            <div className="event-details">
                                <h3 className="event-title">{event.title}</h3>
                                <div className="event-meta">
                                    <time dateTime={event.start_date}>
                                        {formatDateRange(
                                            event.start_date,
                                            event.end_date
                                        )}
                                    </time>
                                    {event.hide && (
                                        <span className="event-status">
                                            <span className="separator">|</span>
                                            <Icon
                                                icon="visibilityOff"
                                                className="status-icon"
                                            />
                                            <span>אירוע מוסתר</span>
                                        </span>
                                    )}
                                    {event.cancelled && (
                                        <span className="event-status">
                                            <span className="separator">|</span>
                                            <span>אירוע מבוטל</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span
                                className={`chevron-icon ${
                                    expandedEventId === event.id ? "active" : ""
                                }`}
                            >
                                &#x2039;
                            </span>
                        </div>
                        {expandedEventId === event.id && (
                            <div className="event-expanded">
                                <FullEventCard
                                    event={event}
                                    showPast={showPast}
                                />
                                {!showPast && (
                                    <ManageEventActions
                                        event={event}
                                        updateEventState={updateEventState}
                                        updateEventHideState={
                                            handleHideEventState
                                        }
                                        updateEventCancelledState={
                                            handleCancelledEventState
                                        }
                                        removeEventState={removeEventState}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {!showPast && filteredEvents.length === 0 && (
                <div className="no-events-message">
                    <Icon icon="crazy_monster_1" />
                    <label className="no-events-message-label">
                        נראה שעדיין אין לכם אירועים
                    </label>
                </div>
            )}
        </section>
    )
}

function pastFutureEvents(events: CIEvent[], showPast: boolean) {
    const filteredEvents = events.filter((e) =>
        showPast
            ? dayjs(e.start_date)
                  .startOf("day")
                  .isBefore(dayjs().startOf("day"))
            : dayjs(e.start_date)
                  .startOf("day")
                  .isSameOrAfter(dayjs().startOf("day"))
    )

    return filteredEvents.sort((a, b) =>
        showPast
            ? dayjs(a.start_date).isBefore(dayjs(b.start_date))
                ? 1
                : -1
            : dayjs(a.start_date).isBefore(dayjs(b.start_date))
            ? -1
            : 1
    )
}

function formatDateRange(startDate: string, endDate: string) {
    const start = dayjs(startDate).format("DD/MM/YYYY")
    const end = dayjs(endDate).format("DD/MM/YYYY")
    return start === end ? start : `${start} - ${end}`
}
