import dayjs, { Dayjs } from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
dayjs.extend(isBetween)
import CalendarView from "../Events/Display/CalendarView"
import EventsList from "../Events/Display/EventsList"
import { useState } from "react"
import { useEventsFilter } from "../../hooks/useEventsFilter"
import FilterModel from "../Filteres/FilterModel"
import Tag from "antd/es/tag"
import { useParamsFilterHandler } from "../../hooks/useParamsFilterHandler"
import FilterDrawer from "../Filteres/FilterDrawer"

import { useDefaultFilter } from "../../hooks/useDefaultFilter"
import { useIsMobile } from "../../hooks/useIsMobile"
import { useSetSelectedEventByParams } from "../../hooks/useSetSelectedEventByParams"
import { useSelectedDayEvents } from "../../hooks/useSelectedDayEvents"
import FullEventCardContainer from "../Events/Display/FullEventCardContainer"
import { utilService } from "../../util/utilService"

import AlertsAnchor from "../Alerts/AlertsAnchor"
import { Icon } from "../Common/Icon"
import MenuButtons from "../Common/MenuButtons"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"

const DEFAULT_TITLE = "קונטקט אימפרוביזציה ישראל"
const DEFAULT_DESCRIPTION = "כל האירועים במקום אחד"

const EventsPage = () => {
    const events = store.getSortedEvents
    const { selectedEvent } = useSetSelectedEventByParams(events)

    const isMobile = useIsMobile()

    useDefaultFilter()

    const [isListView, setIsListView] = useState<boolean>(true)
    const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs())

    const { currentValues: currentFilterValues, removeOption: onRemoveFilter } =
        useParamsFilterHandler()

    const filteredEvents = useEventsFilter({ events })

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
        <div className="events-page">
            <header className="header">
                <AlertsAnchor />
                <h1 className="title">
                    {store.getConfig.app_title || DEFAULT_TITLE}
                </h1>
                <p className="subtitle">
                    {store.getConfig.app_description || DEFAULT_DESCRIPTION}
                </p>
                <main className="menu-container">
                    <MenuButtons
                        onSelectKey={onSelectKey}
                        options={[
                            {
                                key: "list",
                                icon: "viewDay",
                                ariaLabel: "צפייה ברשימת אירועים",
                            },
                            {
                                key: "calendar",
                                icon: "calendar",
                                ariaLabel: "צפייה באירועים לפי לוח שנה",
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
                        <EventsList events={selectedDayEvents} />
                    </>
                )}
                {isListView && <EventsList events={filteredEvents} />}
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

export default observer(EventsPage)
