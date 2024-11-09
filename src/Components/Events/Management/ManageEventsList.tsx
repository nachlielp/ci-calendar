"use client"

import { useEffect, useState } from "react"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import { Icon } from "../../Common/Icon"
import FullEventCard from "../Display/FullEventCard"
import { useUser } from "../../../context/UserContext"
import ManageEventActions from "./ManageEventActions"
import { useIsMobile } from "../../../hooks/useIsMobile"
import Loading from "../../Common/Loading"
import { useCIManageEvents } from "../../../hooks/useCIManageEvents"
import DoubleBindedSelect from "../../Common/DoubleBindedSelect"
import { CIEvent } from "../../../util/interfaces"
import Input from "antd/es/input"

dayjs.extend(isSameOrAfter)

export default function ManageEventsList() {
    const isPhone = useIsMobile()
    const { user } = useUser()
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
    const [selectedEventTitle, setSelectedEventTitle] = useState<string>("")
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

    if (!user) {
        return <Loading />
    }

    const {
        ci_future_events,
        ci_events_teachers,
        loading,
        updateEventState,
        removeEventState,
    } = useCIManageEvents({})

    const [filteredEvents, setFilteredEvents] = useState<CIEvent[]>([])

    useEffect(() => {
        filterEvents()
    }, [selectedTeachers, selectedEventTitle, ci_future_events])

    function filterEvents() {
        let events = ci_future_events
        if (selectedTeachers.length > 0) {
            events = events.filter((e) => selectedTeachers.includes(e.user_id))
        }
        if (selectedEventTitle.length > 0) {
            events = events.filter((e) =>
                e.title.toLowerCase().includes(selectedEventTitle.toLowerCase())
            )
        }
        setFilteredEvents(events)
    }
    function handleHideEventState(eventId: string, hide: boolean) {
        const event = ci_future_events.find((e) => e.id === eventId)
        if (event) {
            updateEventState(event.id, { ...event, hide })
        }
    }

    function handleCancelledEventState(eventId: string, cancelled: boolean) {
        const event = ci_future_events.find((e) => e.id === eventId)
        if (event) {
            updateEventState(event.id, { ...event, cancelled })
        }
    }

    if (loading) {
        return <Loading />
    }
    return (
        <section className="manage-events-list">
            <header
                className={`manage-events-header ${
                    isPhone ? "header-phone" : "header-desktop"
                }`}
            >
                <h2 className="manage-events-header-title">ניהול אירועים</h2>
                <div className="filters-container">
                    {/* TODO - save in local storage for better UX */}
                    <DoubleBindedSelect
                        options={ci_events_teachers}
                        selectedValues={selectedTeachers}
                        onChange={setSelectedTeachers}
                        placeholder="סינון לפי יוצרים"
                        className="filter-select"
                    />
                    <Input
                        value={selectedEventTitle}
                        onChange={(e) => setSelectedEventTitle(e.target.value)}
                        placeholder="סינון לפי שם האירוע"
                        allowClear
                        className="filter-input"
                    />
                </div>
                <datalist id="event-titles">
                    {filteredEvents.map((event) => (
                        <option key={event.id} value={event.title} />
                    ))}
                </datalist>
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
                                    <label>
                                        <span className="separator">|</span>
                                        {
                                            ci_events_teachers.find(
                                                (t) => t.value === event.user_id
                                            )?.label
                                        }
                                    </label>
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
                                <FullEventCard event={event} />

                                <ManageEventActions
                                    event={event}
                                    updateEventState={updateEventState}
                                    updateEventHideState={handleHideEventState}
                                    updateEventCancelledState={
                                        handleCancelledEventState
                                    }
                                    removeEventState={removeEventState}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}

function formatDateRange(startDate: string, endDate: string) {
    const start = dayjs(startDate).format("DD/MM/YYYY")
    const end = dayjs(endDate).format("DD/MM/YYYY")
    return start === end ? start : `${start} - ${end}`
}
