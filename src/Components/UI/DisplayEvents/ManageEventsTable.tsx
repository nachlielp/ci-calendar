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
import ManageEventActions from "./ManageEventActions"
import { useIsMobile } from "../../../hooks/useIsMobile"
import { useCIManageEvents } from "../../../hooks/useCIManageEvents"
import Loading from "../Other/Loading"
import { SorterResult, TablePaginationConfig } from "antd/lib/table/interface"
import { GetProp } from "antd/es/_util/type"

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

//TODO fix mess - change the past hook to enclude fuature and past and have its own subsciption
export default function ManageEventsTable() {
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
        ci_future_events,
        ci_events_teachers,
        loading,
        updateEventState,
        removeEventState,
    } = useCIManageEvents({
        user_id: nonAdminUserId || tableParams.filters?.user_id?.[0],
    })

    const [selectedRowKeysFuture, setSelectedRowKeysFuture] = useState<
        React.Key[]
    >([])

    useEffect(() => {}, [selectedRowKeysFuture])

    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

    if (loading) {
        return <Loading />
    }

    function onSelectChange(newSelectedRowKeys: React.Key[]) {
        setSelectedRowKeysFuture(newSelectedRowKeys)
    }

    // function onClear() {}

    function onDelete() {
        setSelectedRowKeysFuture([])
        setExpandedRowKeys([])
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

    const rowSelection = {
        selectedRowKeys: selectedRowKeysFuture,
        onChange: onSelectChange,
    }

    function onExpand(expanded: boolean, record: CIEvent) {
        setExpandedRowKeys(expanded ? [record.id] : [])
    }

    const isActiveActions = selectedRowKeysFuture.length > 0

    return (
        <section className={`manage-events-table `}>
            <header
                className={`manage-events-header ${
                    isPhone ? "header-phone" : "header-desktop"
                }`}
            >
                <h2>ניהול אירועים</h2>
                <div className="actions-row">
                    <div className="selected-events-count-container">
                        <span className="selected-events-count">
                            {`נבחרו ${selectedRowKeysFuture.length} אירועים`}
                        </span>
                    </div>
                    <DeleteMultipleEventsButton
                        eventIds={selectedRowKeysFuture.map(String)}
                        className={`multiple-events-action-btn ${
                            isActiveActions ? "active" : ""
                        }`}
                        disabled={selectedRowKeysFuture.length === 0}
                        onDelete={onDelete}
                        removeEventState={removeEventState}
                    />
                    <HideMultipleEventsButton
                        eventIds={selectedRowKeysFuture.map(String)}
                        className={`multiple-events-action-btn ${
                            isActiveActions ? "active" : ""
                        }`}
                        disabled={selectedRowKeysFuture.length === 0}
                    />
                    <UnHideMultipleEventsButton
                        eventIds={selectedRowKeysFuture.map(String)}
                        className={`multiple-events-action-btn ${
                            isActiveActions ? "active" : ""
                        }`}
                        disabled={selectedRowKeysFuture.length === 0}
                    />
                </div>
            </header>

            <Table
                rowSelection={rowSelection}
                columns={getColumns(
                    tableParams,
                    ci_events_teachers,
                    !!nonAdminUserId
                )}
                dataSource={ci_future_events.map((event) => ({
                    ...event,
                    key: event.id,
                }))}
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
                onChange={handleTableChange}
            />
        </section>
    )
}
