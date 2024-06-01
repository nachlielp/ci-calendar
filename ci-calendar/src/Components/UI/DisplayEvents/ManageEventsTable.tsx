import { useEffect, useMemo, useState } from "react";
import { Table, Select, Switch, Breakpoint } from "antd";
import DeleteMultipleEvents from "../Other/DeleteMultipleEvents";
import HideMultipleEvents from "../Other/HideMultipleEvents";
import ShowMultipleEvents from "../Other/ShowMultipleEvents";
import { SingleDayEventCard } from "./SingleDayEventCard";
import { MultiDayEventCard } from "./MultiDayEventCard";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { IEvently, UserType } from "../../../util/interfaces";
import { useEventsFilter } from "../../../hooks/useEventsFilter";
import { useAuthContext } from "../../Auth/AuthContext";
import dayjs from "dayjs";
import { Icon } from "../Other/Icon";
import { SelectOption } from "../../../util/options";
const { Option } = Select;

export default function ManageEventsTable({ events }: { events: IEvently[] }) {
    const { width } = useWindowSize();
    const { currentUser } = useAuthContext()
    const uid = useMemo(() => currentUser?.userType === 'teacher' ? [currentUser.id] : [], [currentUser]);
    const [showFuture, setShowFuture] = useState(true);
    const filteredEvents = useEventsFilter({ events, showFuture, uids: uid });
    const [teachersEvents, setTeachersEvents] = useState<IEvently[]>([]);
    const [selectedRowKeysFuture, setSelectedRowKeysFuture] = useState<React.Key[]>([]);
    const [selectedRowKeysPast, setSelectedRowKeysPast] = useState<React.Key[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<SelectOption | null>(null);
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

    useEffect(() => {
        if (selectedTeacher === null) {
            setTeachersEvents(filteredEvents);
        } else {
            setTeachersEvents(filteredEvents.filter(event => event.creatorId === selectedTeacher.value));
        }
    }, [filteredEvents, selectedTeacher?.value]);

    const uniqueTeachers = getUniqueTeachers(filteredEvents);

    const adjustedItemWidth = Math.min(width / 1.5, 500);

    const isPhone = width < 600;

    const tableWidth = isPhone ? width * 0.9 : width * 0.5;

    function onSelectChange(newSelectedRowKeys: React.Key[]) {
        if (showFuture) {
            setSelectedRowKeysFuture(newSelectedRowKeys);
        } else {
            setSelectedRowKeysPast(newSelectedRowKeys);
        }
    };

    function togglePastFuture() {
        setShowFuture(prev => !prev);
    };

    function onClear() {
        setSelectedTeacher(null);
        setTeachersEvents(filteredEvents);
    };


    function onDelete() {
        setSelectedRowKeysFuture([]);
        setSelectedRowKeysPast([]);
        setExpandedRowKeys([]);
    }
    function onSelectTeacher(selectedTeacherId: string) {
        const teacher = uniqueTeachers.find(teacher => teacher.value === selectedTeacherId);
        teacher ? setSelectedTeacher(teacher) : setSelectedTeacher(null);

        teacher ? setTeachersEvents(filteredEvents.filter(event => event.creatorId === selectedTeacherId)) : setTeachersEvents(filteredEvents);

        if (selectedTeacher !== null && selectedTeacherId !== undefined) {
            setSelectedRowKeysFuture([]);
            setSelectedRowKeysPast([]);
        } else if (selectedTeacher === null && selectedTeacherId !== undefined && teacher) {
            setSelectedRowKeysFuture(selectedRowKeysFuture.filter(key => filteredEvents.some(event => event.id === key && event.creatorId === selectedTeacherId)));
            setSelectedRowKeysPast(selectedRowKeysPast.filter(key => filteredEvents.some(event => event.id === key && event.creatorId === selectedTeacherId)));
        }
    };

    const rowSelection = {
        selectedRowKeys: showFuture ? selectedRowKeysFuture : selectedRowKeysPast,
        onChange: onSelectChange,
    };

    const visableEventsToHide = showFuture ?
        filteredEvents.filter(event => selectedRowKeysFuture.includes(event.id) && !event.hide) :
        filteredEvents.filter(event => selectedRowKeysPast.includes(event.id) && !event.hide);
    const hiddenEventsToShow = showFuture ?
        filteredEvents.filter(event => selectedRowKeysFuture.includes(event.id) && event.hide) :
        filteredEvents.filter(event => selectedRowKeysPast.includes(event.id) && event.hide);
    const selectedEventsToDelete = showFuture ?
        filteredEvents.filter(event => selectedRowKeysFuture.includes(event.id)) :
        filteredEvents.filter(event => selectedRowKeysPast.includes(event.id));

    function onExpand(expanded: boolean, record: IEvently) {
        setExpandedRowKeys(expanded ? [record.id] : []);
    };

    const columns = [
        {
            title: 'בעלים',
            dataIndex: 'creatorName',
            key: 'creatorName',
            render: (creatorName: string) => creatorName,
            responsive: ['xl', 'lg', 'md'] as Breakpoint[]
        },
        {
            title: 'תאריך',
            dataIndex: 'dates',
            key: 'dates',
            render: (dates: { startDate: string, endDate: string }) => {
                const startDate = new Date(dates.startDate).toLocaleDateString();
                const endDate = new Date(dates.endDate).toLocaleDateString();
                return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
            },
            sorter: (a: IEvently, b: IEvently) => dayjs(a.dates["startDate"]).diff(dayjs(b.dates["startDate"]), 'day'),
            responsive: ['xl', 'lg', 'md', 'sm', 'xs'] as Breakpoint[]
        },
        {
            title: 'כותרת',
            dataIndex: 'title',
            key: 'title',
            responsive: ['xl', 'lg', 'md', 'sm', 'xs'] as Breakpoint[]
        },
        {
            title: 'מצב',
            dataIndex: 'hide',
            key: 'hide',
            render: (hide: boolean) => hide ? <Icon icon="visibilityOff" /> : <Icon icon="visibility" />,
            responsive: ['xl', 'lg', 'md'] as Breakpoint[]
        }
    ];

    const filteredColumns = currentUser && currentUser.userType === 'teacher'
        ? columns.filter(column => column.key !== 'creatorName')
        : columns;


    function getUniqueTeachers(events: IEvently[]): SelectOption[] {
        const teacherMap = new Map<string, SelectOption>();

        events.forEach(event => {
            if (event.creatorId && event.creatorName) {
                teacherMap.set(event.creatorId, { label: event.creatorName, value: event.creatorId });
            }
        });

        return Array.from(teacherMap.values());
    };
    return (
        <section className={`max-w-[${tableWidth}px] mx-auto m-4`}>
            <header className={`flex ${isPhone ? 'flex-col items-center' : 'flex-row'} justify-center mb-4 mr-4`}>
                <div className="flex flex-row">
                    <div className="flex flex-row mb-4">
                        {currentUser && currentUser.userType === UserType.admin &&
                            <Select
                                id="select-teacher"
                                style={{ width: '200px' }}
                                value={selectedTeacher?.value}
                                onChange={onSelectTeacher}
                                placeholder="סינון לפי משתמש"
                                allowClear
                                onClear={onClear}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {uniqueTeachers.map(teacher => (
                                    <Option key={teacher.value} value={teacher.value}>
                                        {teacher.label}
                                    </Option>
                                ))}
                            </Select>
                        }
                        <div className="flex flex-row">
                            <Switch
                                id="showFuture"
                                className="mr-4 ml-4 mt-1"
                                checkedChildren={'עתידי'}
                                unCheckedChildren={'  עבר'}
                                defaultChecked={showFuture}
                                onChange={togglePastFuture}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex flex-row">
                    <DeleteMultipleEvents eventIds={selectedEventsToDelete.map(event => event.id)} className="mr-4" disabled={showFuture ? selectedRowKeysFuture.length === 0 : selectedRowKeysPast.length === 0} onDelete={onDelete} />
                    <HideMultipleEvents eventIds={visableEventsToHide.map(event => event.id)} className="mr-4" disabled={showFuture ? selectedRowKeysFuture.length === 0 : selectedRowKeysPast.length === 0} />
                    <ShowMultipleEvents eventIds={hiddenEventsToShow.map(event => event.id)} className="mr-4" disabled={showFuture ? selectedRowKeysFuture.length === 0 : selectedRowKeysPast.length === 0} />
                </div>
                <div className="mt-4 ">
                    <span id="selected-events-count" className="mr-4 ml-4 ">
                        {showFuture && selectedRowKeysFuture.length > 0 && `נבחרו ${selectedRowKeysFuture.length} אירועים`}
                        {!showFuture && selectedRowKeysPast.length > 0 && `נבחרו ${selectedRowKeysPast.length} אירועים`}
                        {selectedRowKeysFuture.length === 0 && selectedRowKeysPast.length === 0 && <span>&nbsp;</span>}
                    </span>
                </div>
            </header>

            <Table
                rowSelection={rowSelection}
                columns={filteredColumns}
                dataSource={teachersEvents.map(event => ({ ...event, key: event.id }))}
                pagination={false}
                expandable={{
                    expandedRowRender: (event) => (
                        <div className="flex flex-row justify-center" key={event.id}>
                            {event.dates["startDate"] === event.dates["endDate"] ? (
                                <SingleDayEventCard
                                    key={event.id}
                                    event={event}
                                    cardWidth={adjustedItemWidth}
                                    isEdit={true}
                                />
                            ) : (
                                <MultiDayEventCard
                                    key={event.id}
                                    event={event}
                                    cardWidth={adjustedItemWidth}
                                    isEdit={true}
                                />
                            )}
                        </div>
                    ),
                    expandedRowKeys: expandedRowKeys,
                    onExpand: onExpand,
                }}
            />
        </section>
    );
}

