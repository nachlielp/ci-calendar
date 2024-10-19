import dayjs, { Dayjs } from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
dayjs.extend(isBetween)
import { CIEvent } from "../../util/interfaces"
import CalendarView from "../UI/Other/CalendarView"
import EventsList from "../UI/DisplayEvents/EventsList"
import { useState } from "react"
import { useEventsFilter } from "../../hooks/useEventsFilter"
import FilterModel from "../UI/Other/FilterModel"
import Tag from "antd/es/tag"
import { useParamsFilterHandler } from "../../hooks/useParamsFilterHandler"
import FilterDrawer from "../UI/Other/FilterDrawer"
import MenuButtons from "../UI/Other/MenuButtons"
import { Icon } from "../UI/Other/Icon"
import { useDefaultFilter } from "../../hooks/useDefaultFilter"
import { useIsMobile } from "../../hooks/useIsMobile"
import { useSetSelectedEventByParams } from "../../hooks/useSetSelectedEventByParams"
import { useSelectedDayEvents } from "../../hooks/useSelectedDayEvents"
import FullEventCardContainer from "../UI/DisplayEvents/FullEventCardContainer"
import { utilService } from "../../util/utilService"

interface IEventsPageProps {
    events: CIEvent[]
}

export default function EventsPage({ events }: IEventsPageProps) {
    const { selectedEvent } = useSetSelectedEventByParams(events)
    const isMobile = useIsMobile()
    useDefaultFilter()

    const [isListView, setIsListView] = useState<boolean>(true)
    const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs())

    const { currentValues: currentFilterValues, removeOption: onRemoveFilter } =
        useParamsFilterHandler()

    const filteredEvents = useEventsFilter({ events, showPast: false })

    const selectedDayEvents = useSelectedDayEvents(filteredEvents, selectedDay)

    const onSelectDate = (value: Dayjs) => {
        setSelectedDay(value)
    }

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
                    {isMobile ? <FilterDrawer /> : <FilterModel />}
                </main>
                <article className="selected-filters">
                    {currentFilterValues?.map((eventType: any) => (
                        <Tag
                            className="filter-tag"
                            color="#913e2f"
                            key={eventType}
                            onClick={() => onRemoveFilter(eventType)}
                        >
                            {utilService.getLabelByValue(eventType)}
                            <Icon icon="close" />
                        </Tag>
                    ))}
                </article>
            </header>
            <section className="events-display-list">
                {!isListView && (
                    <>
                        <CalendarView
                            events={filteredEvents}
                            onSelect={onSelectDate}
                        />
                        <EventsList
                            events={selectedDayEvents}
                            isEvents={!!selectedDayEvents.length}
                        />
                    </>
                )}
                {isListView && (
                    <EventsList
                        events={filteredEvents}
                        isEvents={!!filteredEvents.length}
                    />
                )}
                {selectedEvent && (
                    <FullEventCardContainer
                        isSelectedEvent={true}
                        event={selectedEvent}
                        anchorEl={<></>}
                    />
                )}
            </section>
        </div>
    )
}
