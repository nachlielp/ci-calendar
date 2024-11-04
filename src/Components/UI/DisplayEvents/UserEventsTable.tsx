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
    const { user, updateUserState } = useUser()

    const [showPast, setShowPast] = useState(false)

    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

    if (!user) {
        return <Loading />
    }

    function removeEventState(eventId: string) {
        if (!user) return
        updateUserState({
            ci_events: user.ci_events.filter((e) => e.id !== eventId),
        })
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
                        ? user.ci_events
                              .filter((e) => dayjs(e.start_date) < dayjs())
                              .sort((a, b) =>
                                  dayjs(a.start_date).isBefore(
                                      dayjs(b.start_date)
                                  )
                                      ? 1
                                      : -1
                              )
                              .map((event) => ({
                                  ...event,
                                  key: event.id,
                              }))
                        : user.ci_events
                              .filter((e) => dayjs(e.start_date) >= dayjs())
                              .sort((a, b) =>
                                  dayjs(a.start_date).isBefore(
                                      dayjs(b.start_date)
                                  )
                                      ? -1
                                      : 1
                              )
                              .map((event) => ({
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
                                updateEventState={() => {}}
                                updateEventHideState={() => {}}
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
