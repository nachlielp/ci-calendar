import { useEffect, useState } from "react"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import FullEventCard from "../Display/FullEventCard"
import ManageEventActions from "./ManageEventActions"
import { useIsMobile } from "../../../hooks/useIsMobile"
import DoubleBindedSelect from "../../Common/DoubleBindedSelect"
import { CIEvent } from "../../../util/interfaces"
import Input from "antd/es/input"
import { store } from "../../../Store/store"
import { observer } from "mobx-react-lite"

dayjs.extend(isSameOrAfter)

const ManageEventsList = () => {
    const isPhone = useIsMobile()
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
    const [selectedEventTitle, setSelectedEventTitle] = useState<string>("")
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

    const [filteredEvents, setFilteredEvents] = useState<CIEvent[]>([])

    useEffect(() => {
        filterEvents()
    }, [selectedTeachers, selectedEventTitle, store.app_ci_events])

    function filterEvents() {
        let events = store.getSortedEvents
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

    return (
        <section className="manage-events-list">
            <header
                className={`manage-events-header ${
                    isPhone ? "header-phone" : "header-desktop"
                }`}
            >
                <h2 className="manage-events-header-title">ניהול אירועים</h2>
                <div className="filters-container">
                    <DoubleBindedSelect
                        options={store.app_creators}
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
                        className="filter-input form-input-large"
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
                                            store.app_creators.find(
                                                (t) => t.value === event.user_id
                                            )?.label
                                        }
                                    </label>
                                    {event.hide && (
                                        <span className="event-status">
                                            <span className="separator">|</span>
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

                                <ManageEventActions event={event} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}

export default observer(ManageEventsList)

function formatDateRange(startDate: string, endDate: string) {
    const start = dayjs(startDate).format("DD/MM/YYYY")
    const end = dayjs(endDate).format("DD/MM/YYYY")
    return start === end ? start : `${start} - ${end}`
}
