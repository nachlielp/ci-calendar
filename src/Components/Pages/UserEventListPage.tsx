import { useState } from "react"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import { useNavigate } from "react-router-dom"
import { useIsMobile } from "../../hooks/useIsMobile"
import MenuButtons from "../Common/MenuButtons"
import FullEventCard from "../Events/Display/FullEventCard"
import ManageEventActions from "../Events/Management/ManageEventActions"
import catButtGif from "../../assets/img/cat-butt.gif"
import { store } from "../../Store/store"
import { observer } from "mobx-react-lite"

dayjs.extend(isSameOrAfter)

const UserEventsListPage = () => {
    const navigate = useNavigate()
    const isPhone = useIsMobile()

    const [showPast, setShowPast] = useState(false)
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

    function onSelectTimeframe(key: string) {
        setShowPast(key === "past")
    }

    function onGoToCreateEvent() {
        navigate("/create-events")
    }

    return (
        <section className="user-events-list-page page">
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
                {(showPast ? store.getUserPastEvents : store.getUserEvents).map(
                    (event) => (
                        <div
                            key={event.id}
                            className="event-item"
                            role="listitem"
                        >
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
                                    <h3 className="event-title">
                                        {event.title}
                                    </h3>
                                    <div className="event-meta">
                                        <time dateTime={event.start_date}>
                                            {formatDateRange(
                                                event.start_date,
                                                event.end_date
                                            )}
                                        </time>
                                        {event.hide && (
                                            <span className="event-status">
                                                <span className="separator">
                                                    |
                                                </span>
                                                <span>אירוע מוסתר</span>
                                            </span>
                                        )}
                                        {event.cancelled && (
                                            <span className="event-status">
                                                <span className="separator">
                                                    |
                                                </span>
                                                <span>אירוע מבוטל</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className={`chevron-icon ${
                                        expandedEventId === event.id
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    &#x2039;
                                </span>
                            </div>
                            {expandedEventId === event.id && (
                                <div className="event-expanded">
                                    <FullEventCard event={event} />
                                    {!showPast && (
                                        <ManageEventActions event={event} />
                                    )}
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>
            {store.getUserEvents.length === 0 && (
                <div className="no-events-message">
                    <div
                        className="no-events-message-gif"
                        style={{
                            backgroundImage: `url(${catButtGif})`,
                        }}
                    ></div>
                    <label className="no-events-message-label">
                        נראה שעדיין אין לכם אירועים
                    </label>
                </div>
            )}
        </section>
    )
}

export default observer(UserEventsListPage)

function formatDateRange(startDate: string, endDate: string) {
    const start = dayjs(startDate).format("DD/MM/YYYY")
    const end = dayjs(endDate).format("DD/MM/YYYY")
    return start === end ? start : `${start} - ${end}`
}
