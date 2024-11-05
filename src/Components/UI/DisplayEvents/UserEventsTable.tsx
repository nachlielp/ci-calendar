import { useState } from "react"
import Table, { ColumnsType } from "antd/es/table"
import { Breakpoint } from "antd/es/_util/responsiveObserver"
import { CIEvent } from "../../../util/interfaces"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"

dayjs.extend(isSameOrAfter)
import { Icon } from "../Other/Icon"
import FullEventCard from "./FullEventCard"
import { useUser } from "../../../context/UserContext"
import MenuButtons from "../Other/MenuButtons"
import ManageEventActions from "./ManageEventActions"
import { useIsMobile } from "../../../hooks/useIsMobile"
import Loading from "../Other/Loading"
import { useNavigate } from "react-router-dom"
import { useCIManageEvents } from "../../../hooks/useCIManageEvents"

const getColumns = (): ColumnsType<CIEvent> => [
    {
        title: "פרטי אירוע",
        dataIndex: "title",
        key: "eventDetails",
        render: (title: string, record: CIEvent) => {
            const start_date = dayjs(record.start_date).format("DD/MM/YYYY")
            const end_date = dayjs(record.end_date).format("DD/MM/YYYY")
            const dateString =
                start_date === end_date
                    ? start_date
                    : `${start_date} - ${end_date}`

            return (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="event-title">{title}</span>
                    <span className="event-date">
                        {dateString}
                        &nbsp;
                        {record.hide && (
                            <span className="visibility-off-icon-container">
                                |
                                <Icon
                                    icon="visibilityOff"
                                    className="visibility-off-icon minimise-icon"
                                />
                                אירוע מוסתר &nbsp;
                            </span>
                        )}
                        {record.cancelled && (
                            <span className="cancelled-icon-container">
                                | אירוע מבוטל &nbsp;
                            </span>
                        )}
                    </span>
                </div>
            )
        },
        responsive: ["xl", "lg", "md", "sm", "xs"] as Breakpoint[],
    },
]

export default function UserEventsTable() {
    const navigate = useNavigate()
    const isPhone = useIsMobile()
    const { user, updateUserState } = useUser()

    const [showPast, setShowPast] = useState(false)

    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

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

    function onExpand(expanded: boolean, record: CIEvent) {
        setExpandedRowKeys(expanded ? [record.id] : [])
    }

    function onGoToCreateEvent() {
        navigate("/create-events")
    }

    return (
        <section className={`manage-events-table `}>
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

            <Table
                columns={getColumns()}
                dataSource={pastFutureEvents(user.ci_events, showPast)}
                pagination={false}
                expandable={{
                    expandedRowRender: (event) => (
                        <div className="event-card-container" key={event.id}>
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
                    ),
                    expandedRowKeys: expandedRowKeys,
                    onExpand: onExpand,
                }}
            />
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

    const sortedEvents = filteredEvents.sort((a, b) =>
        showPast
            ? dayjs(a.start_date).isBefore(dayjs(b.start_date))
                ? 1
                : -1
            : dayjs(a.start_date).isBefore(dayjs(b.start_date))
            ? -1
            : 1
    )

    return sortedEvents.map((event) => ({
        ...event,
        key: event.id,
    }))
}
