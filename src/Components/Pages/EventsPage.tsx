import dayjs, { Dayjs } from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
dayjs.extend(isBetween)
import { getLabelByValue } from "../../util/helpers"
import { CIEvent, UserBio } from "../../util/interfaces"
import CalendarView from "../UI/Other/CalendarView"
import EventsList from "../UI/DisplayEvents/EventsList"
import { useEffect, useState } from "react"
import { useEventsFilter } from "../../hooks/useEventsFilter"
import FilterModel from "../UI/Other/FilterModel"
import { Tag } from "antd"
import { useParamsHandler } from "../../hooks/useParamsHandler"
import { districtOptions, eventTypes } from "../../util/options"
import FilterDrawer from "../UI/Other/FilterDrawer"
import { useWindowSize } from "../../hooks/useWindowSize"
import EventDrawer from "../UI/DisplayEvents/EventDrawer"
import MenuButtons from "../UI/Other/MenuButtons"

interface IEventsPageProps {
    events: CIEvent[]
    viewableTeachers: UserBio[]
    isEdit: boolean
}

export default function EventsPage({
    events,
    viewableTeachers,
    isEdit,
}: IEventsPageProps) {
    const [selectedEvent, setSelectedEvent] = useState<CIEvent | null>(null)
    const [isListView, setIsListView] = useState<boolean>(true)

    const { width } = useWindowSize()
    const {
        currentValues: currentEventFilters,
        removeOption: onRemoveEventFilter,
    } = useParamsHandler({ title: "eventType", options: eventTypes })

    const {
        currentValues: currentDistrictValues,
        removeOption: onRemoveDistrictFilter,
    } = useParamsHandler({ title: "district", options: districtOptions })

    const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs())
    const [todaysEvents, setTodaysEvents] = useState<CIEvent[]>([])

    const onSelectDate = (value: Dayjs) => {
        setSelectedDay(value)
    }

    const onSelectEvent = (event: CIEvent) => {
        setSelectedEvent(event)
    }

    const onCloseEvent = () => {
        setSelectedEvent(null)
    }

    const visibleEvents = events.filter((event) => !event.hide)
    const filteredEvents = useEventsFilter({ events: visibleEvents })

    useEffect(() => {
        const todaysEvents = filteredEvents.filter((event) =>
            dayjs(selectedDay).isBetween(
                dayjs(event.startDate),
                dayjs(event.endDate),
                "day",
                "[]"
            )
        )
        setTodaysEvents(todaysEvents)
    }, [selectedDay])

    function onSelectKey(key: string) {
        if (key === "list") {
            setIsListView(true)
        }
        if (key === "calendar") {
            setIsListView(false)
            setSelectedDay(dayjs())
        }
    }

    return (
        <div className="events-display">
            <header className="header">
                <h1 className="title">קונטקט אימפרוביזציה ישראל</h1>
                <p className="subtitle">כל האירועים במקום אחד</p>
                <main className="menu-container">
                    <MenuButtons
                        onSelectKey={onSelectKey}
                        options={[
                            {
                                key: "list",
                                icon: "viewDay",
                            },
                            {
                                key: "calendar",
                                icon: "calendar",
                            },
                        ]}
                        defaultKey="list"
                    />
                    {width > 768 ? <FilterModel /> : <FilterDrawer />}
                </main>
                <article className="selected-filters">
                    {currentEventFilters?.map((eventType: any) => (
                        <Tag
                            className="filter-tag"
                            color="#913e2f"
                            key={eventType}
                            closable
                            onClick={() =>
                                onRemoveEventFilter("eventType", eventType)
                            }
                        >
                            {getLabelByValue(eventType, eventTypes)}
                        </Tag>
                    ))}
                    {currentDistrictValues?.map((district: any) => (
                        <Tag
                            className="filter-tag"
                            color="#913e2f"
                            key={district}
                            closable
                            onClick={() =>
                                onRemoveDistrictFilter("district", district)
                            }
                        >
                            {getLabelByValue(district, districtOptions)}
                        </Tag>
                    ))}
                </article>
            </header>
            <section className="events-display-list">
                {!isListView ? (
                    <>
                        <CalendarView
                            events={filteredEvents}
                            onSelect={onSelectDate}
                        />
                        <EventsList
                            events={todaysEvents}
                            isEdit={isEdit}
                            isEvents={!!events.length}
                            onSelectEvent={onSelectEvent}
                            viewableTeachers={viewableTeachers}
                        />
                    </>
                ) : (
                    <EventsList
                        events={events}
                        isEdit={isEdit}
                        isEvents={!!events.length}
                        onSelectEvent={onSelectEvent}
                        viewableTeachers={viewableTeachers}
                    />
                )}
            </section>
            <EventDrawer
                event={selectedEvent}
                onClose={onCloseEvent}
                viewableTeachers={viewableTeachers}
            />
        </div>
    )
}