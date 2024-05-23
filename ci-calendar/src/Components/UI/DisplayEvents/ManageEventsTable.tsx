import { useEffect, useMemo, useState } from "react";
import { Table, Select, Switch } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
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
const { Option } = Select;

export default function ManageEventsTable({ events }: { events: IEvently[] }) {
    console.log('TEST')

    const { width } = useWindowSize();
    const { currentUser } = useAuthContext()
    const uid = useMemo(() => currentUser?.userType === 'teacher' ? [currentUser.id] : [], [currentUser]);
    const [showFuture, setShowFuture] = useState(true);
    const filteredEvents = useEventsFilter({ events, showFuture, uids: uid });
    const [teachersEvents, setTeachersEvents] = useState<IEvently[]>([]);
    const [selectedRowKeysFuture, setSelectedRowKeysFuture] = useState<React.Key[]>([]);
    const [selectedRowKeysPast, setSelectedRowKeysPast] = useState<React.Key[]>([]);
    const [teacherName, setTeacherName] = useState('');
    const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

    useEffect(() => {
        if (teacherName === '') {
            setTeachersEvents(filteredEvents);
        } else {
            setTeachersEvents(filteredEvents.filter(event => event.owners.find(owner => owner.label === teacherName)));
        }
    }, [filteredEvents, teacherName]);

    //TODuse reducer 
    const teachers = filteredEvents
        .map(event => event.owners)
        .flat()
        .reduce((acc, teacher) => {
            acc.set(teacher.value, teacher);
            return acc;
        }, new Map())
        .values();


    const uniqueTeachers = Array.from(teachers);

    const adjustedItemWidth = Math.min(width / 1.5, 500);


    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        if (showFuture) {
            setSelectedRowKeysFuture(newSelectedRowKeys);
        } else {
            setSelectedRowKeysPast(newSelectedRowKeys);
        }
    };

    const togglePastFuture = () => {
        setShowFuture(prev => !prev);
    };

    const handleClear = () => {
        setTeacherName('');
        setTeachersEvents(filteredEvents);
    };


    const handleDelete = () => {
        setSelectedRowKeysFuture([]);
        setSelectedRowKeysPast([]);
        setExpandedRowKeys([]);
    }
    const onSelectTeacher = (value: string) => {
        const teacher = uniqueTeachers.find(teacher => teacher.value === value);
        teacher ? setTeacherName(teacher.label) : setTeacherName('');
        teacher ? setTeachersEvents(filteredEvents.filter(event => event.owners.find(owner => owner.value === value))) : setTeachersEvents(filteredEvents);

        if (teacherName !== "" && value !== undefined) {
            setSelectedRowKeysFuture([]);
            setSelectedRowKeysPast([]);
        } else if (teacherName === "" && value !== undefined && teacher) {
            setSelectedRowKeysFuture(selectedRowKeysFuture.filter(key => filteredEvents.some(event => event.id === key && event.owners.some(owner => owner.value === value))));
            setSelectedRowKeysPast(selectedRowKeysPast.filter(key => filteredEvents.some(event => event.id === key && event.owners.some(owner => owner.value === value))));
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

    const handleExpand = (expanded: boolean, record: IEvently) => {
        setExpandedRowKeys(expanded ? [record.id] : []);
    };

    const columns = [
        {
            title: 'בעלים',
            dataIndex: 'owners',
            key: 'owners',
            render: (owners: { label: string }[]) => {
                return owners.map(owner => owner.label).join(', ');
            },
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
        },
        {
            title: 'כותרת',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'מצב',
            dataIndex: 'hide',
            key: 'hide',
            render: (hide: boolean) => hide ? <EyeInvisibleOutlined /> : <EyeOutlined />,
        }
    ];

    const filteredColumns = currentUser && currentUser.userType === 'teacher'
        ? columns.filter(column => column.key !== 'owners')
        : columns;


    return (
        <div className=" m-4">
            <div className="flex flex-row justify-end mb-4 mr-4">
                {currentUser && currentUser.userType === UserType.admin &&
                    <Select
                        style={{ width: "20%" }}
                        value={teacherName}
                        onChange={onSelectTeacher}
                        placeholder="שם משתמשים או כתובת מייל"
                        allowClear
                        onClear={handleClear}
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
                <span id="selected-events-count" className="mr-4 ml-4 ">
                    {showFuture && selectedRowKeysFuture.length > 0 && `נבחרו ${selectedRowKeysFuture.length} אירועים`}
                    {!showFuture && selectedRowKeysPast.length > 0 && `נבחרו ${selectedRowKeysPast.length} אירועים`}
                </span>
                <Switch
                    className="mr-4"
                    checkedChildren={'עתידי'}
                    unCheckedChildren={'עבר'}
                    defaultChecked={showFuture}
                    onChange={togglePastFuture}
                />
                <DeleteMultipleEvents eventIds={selectedRowKeysFuture.map(String)} className="mr-4" disabled={showFuture ? selectedRowKeysFuture.length === 0 : selectedRowKeysPast.length === 0} onDelete={handleDelete} />
                <HideMultipleEvents eventIds={visableEventsToHide.map(event => event.id)} className="mr-4" disabled={showFuture ? selectedRowKeysFuture.length === 0 : selectedRowKeysPast.length === 0} />
                <ShowMultipleEvents eventIds={hiddenEventsToShow.map(event => event.id)} className="mr-4" disabled={showFuture ? selectedRowKeysFuture.length === 0 : selectedRowKeysPast.length === 0} />
            </div>

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
                    onExpand: handleExpand,
                }}
            />
        </div>
    );
}

