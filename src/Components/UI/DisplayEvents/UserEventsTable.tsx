import { useState } from "react"
import Table, { ColumnsType } from "antd/es/table"
import { Breakpoint } from "antd/es/_util/responsiveObserver"
import { CIEvent } from "../../../util/interfaces"
import dayjs from "dayjs"
import { Icon } from "../Other/Icon"
import FullEventCard from "./FullEventCard"
import { useUser } from "../../../context/UserContext"
import MenuButtons from "../Other/MenuButtons"
import ManageEventActions from "./ManageEventActions"
import { useIsMobile } from "../../../hooks/useIsMobile"
import { useCIManageEvents } from "../../../hooks/useCIManageEvents"
import Loading from "../Other/Loading"
import { useNavigate } from "react-router-dom"

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
                        {record.hide && (
                            <span className="visibility-off-icon-container">
                                <Icon
                                    icon="visibilityOff"
                                    className="visibility-off-icon minimise-icon"
                                />
                                אירוע מוסתר
                            </span>
                        )}
                    </span>
                </div>
            )
        },
        responsive: ["xl", "lg", "md", "sm", "xs"] as Breakpoint[],
    },
]

//TODO fix mess - change the past hook to enclude fuature and past and have its own subsciption
export default function UserEventsTable() {
    const navigate = useNavigate()
    const isPhone = useIsMobile()
    const { user } = useUser()

    const {
        ci_past_events,
        ci_future_events,
        loading,
        updateEventState,
        removeEventState,
    } = useCIManageEvents({
        user_id: user?.user_id,
    })

    const [showPast, setShowPast] = useState(false)

    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

    if (loading) {
        return <Loading />
    }

    function handleHideEventState(eventId: string, hide: boolean) {
        const event = ci_future_events.find((e) => e.id === eventId)
        if (event) {
            updateEventState(event.id, { ...event, hide })
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
                dataSource={
                    showPast
                        ? ci_past_events.map((event) => ({
                              ...event,
                              key: event.id,
                          }))
                        : ci_future_events.map((event) => ({
                              ...event,
                              key: event.id,
                          }))
                }
                pagination={false}
                expandable={{
                    expandedRowRender: (event) => (
                        <div className="event-card-container" key={event.id}>
                            <FullEventCard event={event} />
                            <ManageEventActions
                                event={event}
                                updateEventState={updateEventState}
                                updateEventHideState={handleHideEventState}
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
