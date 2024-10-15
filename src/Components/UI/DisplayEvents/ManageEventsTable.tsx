import { useEffect, useMemo, useState } from "react"
import { Table, Select, Breakpoint } from "antd"
import DeleteMultipleEventsButton from "../Other/DeleteMultipleEventsButton"
import HideMultipleEventsButton from "../Other/HideMultipleEvents"
import UnHideMultipleEventsButton from "../Other/UnHideMultipleEventsButton"
import { CIEvent, UserType } from "../../../util/interfaces"
import { useEventsFilter } from "../../../hooks/useEventsFilter"
import dayjs from "dayjs"
import { Icon } from "../Other/Icon"
import { SelectOption } from "../../../util/options"
import FullEventCard from "./FullEventCard"
import { useUser } from "../../../context/UserContext"
import { useEvents } from "../../../hooks/useEvents"
import MenuButtons from "../Other/MenuButtons"
import ManageEventActions from "./ManageEventActions"
import { useIsMobile } from "../../../hooks/useIsMobile"
const { Option } = Select

export default function ManageEventsTable() {
    const isPhone = useIsMobile()
    const { user } = useUser()
    const { events } = useEvents()

    const uid = useMemo(
        () =>
            user?.user_type === "creator" || user?.user_type === "admin"
                ? [user.user_id]
                : [],
        [user]
    )
    const [showPast, setShowPast] = useState(false)

    const filteredEvents = useEventsFilter({
        events,
        showPast,
        uids: uid,
    })
    const [teachersEvents, setTeachersEvents] = useState<CIEvent[]>([])
    const [selectedRowKeysFuture, setSelectedRowKeysFuture] = useState<
        React.Key[]
    >([])
    const [selectedRowKeysPast, setSelectedRowKeysPast] = useState<React.Key[]>(
        []
    )
    const [selectedTeacher, setSelectedTeacher] = useState<SelectOption | null>(
        null
    )
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

    useEffect(() => {
        if (selectedTeacher === null) {
            setTeachersEvents(filteredEvents)
        } else {
            setTeachersEvents(
                filteredEvents.filter(
                    (event) => event.creator_id === selectedTeacher.value
                )
            )
        }
    }, [filteredEvents, selectedTeacher?.value])

    const uniqueTeachers = getUniqueTeachers(filteredEvents)

    function onSelectChange(newSelectedRowKeys: React.Key[]) {
        if (showPast) {
            setSelectedRowKeysFuture(newSelectedRowKeys)
        } else {
            setSelectedRowKeysPast(newSelectedRowKeys)
        }
    }

    function onClear() {
        setSelectedTeacher(null)
        setTeachersEvents(filteredEvents)
    }

    function onDelete() {
        setSelectedRowKeysFuture([])
        setSelectedRowKeysPast([])
        setExpandedRowKeys([])
    }

    function onSelectTeacher(selectedTeacherId: string) {
        const teacher = uniqueTeachers.find(
            (teacher) => teacher.value === selectedTeacherId
        )
        teacher ? setSelectedTeacher(teacher) : setSelectedTeacher(null)

        teacher
            ? setTeachersEvents(
                  filteredEvents.filter(
                      (event) => event.creator_id === selectedTeacherId
                  )
              )
            : setTeachersEvents(filteredEvents)

        if (selectedTeacher !== null && selectedTeacherId !== undefined) {
            setSelectedRowKeysFuture([])
            setSelectedRowKeysPast([])
        } else if (
            selectedTeacher === null &&
            selectedTeacherId !== undefined &&
            teacher
        ) {
            setSelectedRowKeysFuture(
                selectedRowKeysFuture.filter((key) =>
                    filteredEvents.some(
                        (event) =>
                            event.id === key &&
                            event.creator_id === selectedTeacherId
                    )
                )
            )
            setSelectedRowKeysPast(
                selectedRowKeysPast.filter((key) =>
                    filteredEvents.some(
                        (event) =>
                            event.id === key &&
                            event.creator_id === selectedTeacherId
                    )
                )
            )
        }
    }

    function onSelectTimeframe(key: string) {
        console.log("key", key)
        setShowPast(key === "past")
    }

    const rowSelection = {
        selectedRowKeys: showPast ? selectedRowKeysFuture : selectedRowKeysPast,
        onChange: onSelectChange,
    }

    const visableEventsToHide = showPast
        ? filteredEvents.filter(
              (event) => selectedRowKeysFuture.includes(event.id) && !event.hide
          )
        : filteredEvents.filter(
              (event) => selectedRowKeysPast.includes(event.id) && !event.hide
          )
    const hiddenEventsToShow = showPast
        ? filteredEvents.filter(
              (event) => selectedRowKeysFuture.includes(event.id) && event.hide
          )
        : filteredEvents.filter(
              (event) => selectedRowKeysPast.includes(event.id) && event.hide
          )
    const selectedEventsToDelete = showPast
        ? filteredEvents.filter((event) =>
              selectedRowKeysFuture.includes(event.id)
          )
        : filteredEvents.filter((event) =>
              selectedRowKeysPast.includes(event.id)
          )

    function onExpand(expanded: boolean, record: CIEvent) {
        setExpandedRowKeys(expanded ? [record.id] : [])
    }

    const columns = [
        {
            title: "בעלים",
            dataIndex: "creator_name",
            key: "creator_name",
            render: (creator_name: string) => creator_name,
            responsive: ["xl", "lg", "md"] as Breakpoint[],
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
            sorter: (a: CIEvent, b: CIEvent) =>
                dayjs(a.start_date).diff(dayjs(b.start_date), "day"),
            responsive: ["xl", "lg", "md", "sm", "xs"] as Breakpoint[],
        },
    ]

    const filteredColumns =
        user && user.user_type === "creator"
            ? columns.filter((column) => column.key !== "creator_name")
            : columns

    function getUniqueTeachers(events: CIEvent[]): SelectOption[] {
        const teacherMap = new Map<string, SelectOption>()

        events.forEach((event) => {
            if (event.creator_id && event.creator_name) {
                teacherMap.set(event.creator_id, {
                    label: event.creator_name,
                    value: event.creator_id,
                })
            }
        })

        return Array.from(teacherMap.values())
    }

    const isActiveActions = showPast
        ? selectedRowKeysFuture.length > 0
        : selectedRowKeysPast.length > 0

    return (
        <section className={`manage-events-table `}>
            <header
                className={`manage-events-header ${
                    isPhone ? "header-phone" : "header-desktop"
                }`}
            >
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
                <div className="user-select-container">
                    {user && user.user_type === UserType.admin && (
                        <Select
                            id="select-teacher"
                            className="select-teacher"
                            value={selectedTeacher?.value}
                            onChange={onSelectTeacher}
                            placeholder="סינון לפי משתמש"
                            allowClear
                            onClear={onClear}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {uniqueTeachers.map((teacher) => (
                                <Option
                                    key={teacher.value}
                                    value={teacher.value}
                                >
                                    {teacher.label}
                                </Option>
                            ))}
                        </Select>
                    )}
                </div>
                <div className="actions-row">
                    <DeleteMultipleEventsButton
                        eventIds={selectedEventsToDelete.map(
                            (event) => event.id
                        )}
                        className={`multiple-events-action-btn ${
                            isActiveActions ? "active" : ""
                        }`}
                        disabled={
                            showPast
                                ? selectedRowKeysFuture.length === 0
                                : selectedRowKeysPast.length === 0
                        }
                        onDelete={onDelete}
                    />
                    <HideMultipleEventsButton
                        eventIds={visableEventsToHide.map((event) => event.id)}
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
                        eventIds={hiddenEventsToShow.map((event) => event.id)}
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
            </header>

            <Table
                rowSelection={rowSelection}
                columns={filteredColumns}
                dataSource={teachersEvents.map((event) => ({
                    ...event,
                    key: event.id,
                }))}
                pagination={false}
                expandable={{
                    expandedRowRender: (event) => (
                        <div className="event-card-container" key={event.id}>
                            <FullEventCard
                                event={event}
                                viewableTeachers={[]}
                            />
                            <ManageEventActions event={event} />
                        </div>
                    ),
                    expandedRowKeys: expandedRowKeys,
                    onExpand: onExpand,
                }}
            />
        </section>
    )
}
