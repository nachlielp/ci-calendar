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
import MenuButtons from "../UI/Other/MenuButtons"
import { Icon } from "../UI/Other/Icon"
import { useNavigate } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { utilService } from "../../util/utilService"

interface IEventsPageProps {
    events: CIEvent[]
    viewableTeachers: UserBio[]
}

export default function EventsPage({
    events,
    viewableTeachers,
}: IEventsPageProps) {
    const navigate = useNavigate()
    const { user } = useUser()
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

    useEffect(() => {
        if (user) {
            const eventTypes = user.default_filter?.eventTypes || []
            const districts = user.default_filter?.districts || []
            const filterURL =
                eventTypes
                    .map((eventType) => `eventType=${eventType}`)
                    .join("&") +
                districts.map((district) => `&district=${district}`).join("")
            navigate(`/?${filterURL}`)
        }
    }, [user])

    const onSelectDate = (value: Dayjs) => {
        setSelectedDay(value)
    }

    const visibleEvents = events.filter((event) => !event.hide)
    const filteredEvents = useEventsFilter({ events: visibleEvents })

    useEffect(() => {
        const todaysEvents = filteredEvents.filter((event) =>
            dayjs(selectedDay).isBetween(
                dayjs(event.start_date),
                dayjs(event.end_date),
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
                <p>isPWA: {utilService.isPWA() ? "true" : "false"}</p>
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
                            onClick={() =>
                                onRemoveEventFilter("eventType", eventType)
                            }
                        >
                            {getLabelByValue(eventType, eventTypes)}
                            <Icon icon="close" />
                        </Tag>
                    ))}
                    {currentDistrictValues?.map((district: any) => (
                        <Tag
                            className="filter-tag"
                            color="#913e2f"
                            key={district}
                            onClick={() =>
                                onRemoveDistrictFilter("district", district)
                            }
                        >
                            {getLabelByValue(district, districtOptions)}
                            <Icon icon="close" />
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
                            isEvents={!!events.length}
                            viewableTeachers={viewableTeachers}
                        />
                    </>
                ) : (
                    <EventsList
                        events={events}
                        isEvents={!!events.length}
                        viewableTeachers={viewableTeachers}
                    />
                )}
            </section>
        </div>
    )
}
