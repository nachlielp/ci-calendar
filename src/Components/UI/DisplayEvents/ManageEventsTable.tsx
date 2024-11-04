import { useEffect, useState } from "react"
import Table, { ColumnsType, TableProps } from "antd/es/table"
import { Breakpoint } from "antd/es/_util/responsiveObserver"
import DeleteMultipleEventsButton from "../Other/DeleteMultipleEventsButton"
import HideMultipleEventsButton from "../Other/HideMultipleEvents"
import UnHideMultipleEventsButton from "../Other/UnHideMultipleEventsButton"
import { CIEvent, UserType } from "../../../util/interfaces"
import dayjs from "dayjs"
import { Icon } from "../Other/Icon"
import { SelectOption } from "../../../util/options"
import FullEventCard from "./FullEventCard"
import { useUser } from "../../../context/UserContext"
import MenuButtons from "../Other/MenuButtons"
import ManageEventActions from "./ManageEventActions"
import { useIsMobile } from "../../../hooks/useIsMobile"
import { useCIManageEvents } from "../../../hooks/useCIManageEvents"
import Loading from "../Other/Loading"
import { SorterResult, TablePaginationConfig } from "antd/lib/table/interface"
import { GetProp } from "antd/es/_util/type"
import { LinkButton } from "../Other/LinkButton"
import { useNavigate } from "react-router-dom"

interface TableParams {
    pagination?: TablePaginationConfig
    sortField?: SorterResult<any>["field"]
    sortOrder?: SorterResult<any>["order"]
    filters?: Parameters<GetProp<TableProps, "onChange">>[1] & {
        user_id?: string[]
    }
}

const getColumns = (
    tableParams: TableParams,
    teacherOptions: SelectOption[],
    hideOwners: boolean
): ColumnsType<CIEvent> => [
    {
        title: "בעלים",
        dataIndex: "user_id",
        key: "user_id",
        render: (user_id: string) => {
            const user = teacherOptions.find((t) => t.value === user_id)
            return <span>{user?.label}</span>
        },
        filters: teacherOptions.map((teacher) => ({
            text: teacher.label,
            value: teacher.value,
        })),
        filteredValue: tableParams.filters?.user_id || null,
        filterMultiple: false,
        hidden: hideOwners,
    },
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
export default function ManageEventsTable() {
    const navigate = useNavigate()
    const isPhone = useIsMobile()
    const { user } = useUser()
    const isAdmin = user?.user_type === UserType.admin
    const [tableParams, setTableParams] = useState<TableParams>({
        pagination: {
            current: 1,
            pageSize: 10,
        },
        filters: {
            user_id: [],
        },
    })

    const nonAdminUserId = !isAdmin ? user?.user_id : undefined

    const {
        ci_past_events,
        ci_future_events,
        ci_events_teachers,
        loading,
        updateEventState,
        removeEventState,
    } = useCIManageEvents({
        user_id: nonAdminUserId || tableParams.filters?.user_id?.[0],
    })

    const [showPast, setShowPast] = useState(false)

    const [selectedRowKeysFuture, setSelectedRowKeysFuture] = useState<
        React.Key[]
    >([])

    useEffect(() => {}, [selectedRowKeysFuture])
    const [selectedRowKeysPast, setSelectedRowKeysPast] = useState<React.Key[]>(
        []
    )

    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

    if (loading) {
        return <Loading />
    }

    function onSelectChange(newSelectedRowKeys: React.Key[]) {
        if (showPast) {
            setSelectedRowKeysFuture(newSelectedRowKeys)
        } else {
            setSelectedRowKeysPast(newSelectedRowKeys)
        }
    }

    // function onClear() {}

    function onDelete() {
        setSelectedRowKeysFuture([])
        setSelectedRowKeysPast([])
        setExpandedRowKeys([])
    }

    function handleHideEventState(eventId: string, hide: boolean) {
        const event = ci_future_events.find((e) => e.id === eventId)
        if (event) {
            updateEventState(event.id, { ...event, hide })
        } else {
            const event = ci_past_events.find((e) => e.id === eventId)
            if (event) {
                updateEventState(event.id, { ...event, hide })
            }
        }
    }

    const handleTableChange: TableProps<CIEvent>["onChange"] = (
        pagination,
        filters
    ) => {
        const { user_id } = filters
        if (user_id) {
            setTableParams((prev) => ({
                ...prev,
                pagination,
                filters: { user_id: user_id as string[] },
            }))
        } else {
            setTableParams((prev) => ({
                ...prev,
                pagination,
                filters: {},
            }))
        }
    }

    function onSelectTimeframe(key: string) {
        setShowPast(key === "past")
    }

    const rowSelection = {
        selectedRowKeys: showPast ? selectedRowKeysFuture : selectedRowKeysPast,
        onChange: onSelectChange,
    }

    function onExpand(expanded: boolean, record: CIEvent) {
        setExpandedRowKeys(expanded ? [record.id] : [])
    }

    const isActiveActions = showPast
        ? selectedRowKeysFuture.length > 0
        : selectedRowKeysPast.length > 0

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
                {isAdmin && (
                    <>
                        <div className="actions-row">
                            <DeleteMultipleEventsButton
                                eventIds={
                                    showPast
                                        ? selectedRowKeysFuture.map(String)
                                        : selectedRowKeysPast.map(String)
                                }
                                className={`multiple-events-action-btn ${
                                    isActiveActions ? "active" : ""
                                }`}
                                disabled={
                                    showPast
                                        ? selectedRowKeysFuture.length === 0
                                        : selectedRowKeysPast.length === 0
                                }
                                onDelete={onDelete}
                                removeEventState={removeEventState}
                            />
                            <HideMultipleEventsButton
                                eventIds={
                                    showPast
                                        ? selectedRowKeysFuture.map(String)
                                        : selectedRowKeysPast.map(String)
                                }
                                className={`multiple-events-action-btn ${
                                    isActiveActions ? "active" : ""
                                }`}
                                disabled={
                                    showPast
                                        ? selectedRowKeysFuture.length === 0
                                        : selectedRowKeysPast.length === 0
                                }
                            />
                            <UnHideMultipleEventsButton
                                eventIds={
                                    showPast
                                        ? selectedRowKeysFuture.map(String)
                                        : selectedRowKeysPast.map(String)
                                }
                                className={`multiple-events-action-btn ${
                                    isActiveActions ? "active" : ""
                                }`}
                                disabled={
                                    showPast
                                        ? selectedRowKeysFuture.length === 0
                                        : selectedRowKeysPast.length === 0
                                }
                            />
                        </div>

                        <div className="selected-events-count-container">
                            <span
                                id="selected-events-count"
                                className="selected-events-count"
                            >
                                {isActiveActions
                                    ? `נבחרו ${selectedRowKeysFuture.length} אירועים`
                                    : `נבחרו ${selectedRowKeysPast.length} אירועים`}
                            </span>
                        </div>
                    </>
                )}
            </header>

            <Table
                rowSelection={isAdmin ? rowSelection : undefined}
                columns={getColumns(
                    tableParams,
                    ci_events_teachers,
                    !!nonAdminUserId
                )}
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
                onChange={handleTableChange}
            />
        </section>
    )
}
