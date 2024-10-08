import { useEffect, useMemo, useState } from "react"
import { Table, Select, Breakpoint } from "antd"
import DeleteMultipleEventsButton from "../Other/DeleteMultipleEventsButton"
import HideMultipleEventsButton from "../Other/HideMultipleEventsButton"
import UnHideMultipleEventsButton from "../Other/UnHideMultipleEventsButton"
import { useWindowSize } from "../../../hooks/useWindowSize"
import { CIEvent, UserType } from "../../../util/interfaces"
import { useEventsFilter } from "../../../hooks/useEventsFilter"
import dayjs from "dayjs"
import { Icon } from "../Other/Icon"
import { ScreenSize, SelectOption } from "../../../util/options"
import FullEventCard from "./FullEventCard"
import { useUser } from "../../../context/UserContext"
import { useEvents } from "../../../hooks/useEvents"
import MenuButtons from "../Other/MenuButtons"
const { Option } = Select

export default function ManageEventsTable() {
    const { width } = useWindowSize()
    const { user } = useUser()
    const { events } = useEvents()

    const uid = useMemo(
        () => (user?.user_type === "creator" ? [user.user_id] : []),
        [user]
    )
    const [showFuture, setShowFuture] = useState(true)
    const filteredEvents = useEventsFilter({ events, showFuture, uids: uid })
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
                    (event) => event.creatorId === selectedTeacher.value
                )
            )
        }
    }, [filteredEvents, selectedTeacher?.value])

    const uniqueTeachers = getUniqueTeachers(filteredEvents)

    const isPhone = width < ScreenSize.mobile

    const tableWidth = isPhone ? width * 0.9 : width * 0.5

    function onSelectChange(newSelectedRowKeys: React.Key[]) {
        if (showFuture) {
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
                      (event) => event.creatorId === selectedTeacherId
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
                            event.creatorId === selectedTeacherId
                    )
                )
            )
            setSelectedRowKeysPast(
                selectedRowKeysPast.filter((key) =>
                    filteredEvents.some(
                        (event) =>
                            event.id === key &&
                            event.creatorId === selectedTeacherId
                    )
                )
            )
        }
    }

    function onSelectTimeframe(key: string) {
        setShowFuture(key === "future")
    }
    const rowSelection = {
        selectedRowKeys: showFuture
            ? selectedRowKeysFuture
            : selectedRowKeysPast,
        onChange: onSelectChange,
    }

    const visableEventsToHide = showFuture
        ? filteredEvents.filter(
              (event) => selectedRowKeysFuture.includes(event.id) && !event.hide
          )
        : filteredEvents.filter(
              (event) => selectedRowKeysPast.includes(event.id) && !event.hide
          )
    const hiddenEventsToShow = showFuture
        ? filteredEvents.filter(
              (event) => selectedRowKeysFuture.includes(event.id) && event.hide
          )
        : filteredEvents.filter(
              (event) => selectedRowKeysPast.includes(event.id) && event.hide
          )
    const selectedEventsToDelete = showFuture
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
            dataIndex: "creatorName",
            key: "creatorName",
            render: (creatorName: string) => creatorName,
            responsive: ["xl", "lg", "md"] as Breakpoint[],
        },
        // {
        //   title: "תאריך",
        //   dataIndex: "dates",
        //   key: "dates",
        //   render: (dates: { startDate: string; endDate: string }) => {
        //     const startDate = new Date(dates.startDate).toLocaleDateString();
        //     const endDate = new Date(dates.endDate).toLocaleDateString();
        //     return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
        //   },
        //   sorter: (a: IEvently, b: IEvently) =>
        //     dayjs(a.dates["startDate"]).diff(dayjs(b.dates["startDate"]), "day"),
        //   responsive: ["xl", "lg", "md", "sm", "xs"] as Breakpoint[],
        // },
        // {
        //   title: "כותרת",
        //   dataIndex: "title",
        //   key: "title",
        //   render: (title: string, record: IEvently) => (
        //     <span>
        //       {title}
        //       {record.hide && <Icon icon="visibilityOff" />}
        //     </span>
        //   ),
        //   responsive: ["xl", "lg", "md", "sm", "xs"] as Breakpoint[],
        // },
        {
            title: "פרטי אירוע",
            dataIndex: "title",
            key: "eventDetails",
            render: (title: string, record: CIEvent) => {
                const startDate = dayjs(record.startDate).format("DD/MM/YYYY")
                const endDate = dayjs(record.endDate).format("DD/MM/YYYY")
                const dateString =
                    startDate === endDate
                        ? startDate
                        : `${startDate} - ${endDate}`

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
                dayjs(a.startDate).diff(dayjs(b.startDate), "day"),
            responsive: ["xl", "lg", "md", "sm", "xs"] as Breakpoint[],
        },
    ]

    const filteredColumns =
        user && user.user_type === "creator"
            ? columns.filter((column) => column.key !== "creatorName")
            : columns

    function getUniqueTeachers(events: CIEvent[]): SelectOption[] {
        const teacherMap = new Map<string, SelectOption>()

        events.forEach((event) => {
            if (event.creatorId && event.creatorName) {
                teacherMap.set(event.creatorId, {
                    label: event.creatorName,
                    value: event.creatorId,
                })
            }
        })

        return Array.from(teacherMap.values())
    }

    const isActiveActions = showFuture
        ? selectedRowKeysFuture.length > 0
        : selectedRowKeysPast.length > 0

    return (
        <section className={`manage-events-table max-w-${tableWidth}px`}>
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
                            showFuture
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
                            showFuture
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
                            showFuture
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
                                isManageTable={true}
                                viewableTeachers={[]}
                            />
                            {/* <SingleDayEventCard key={event.id} event={event} isEdit={true} /> */}
                        </div>
                    ),
                    expandedRowKeys: expandedRowKeys,
                    onExpand: onExpand,
                }}
            />
        </section>
    )
}
