import dayjs, { Dayjs } from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween)

import { IEvently } from "../../../util/interfaces";
import CalendarView from "./CalendarView";
import EventsList from "../DisplayEvents/EventsList";
import { useEffect, useState } from "react";
import { useEventsFilter } from "../../../hooks/useEventsFilter";
import FilterModel from "./FilterModel";
import { Button } from "antd";

import { Icon } from "./Icon";

interface IEventsDisplayProps {
  events: IEvently[];
  isEdit: boolean;
}

//TODO hide scroll base on list view
function EventsDisplay({ events, isEdit }: IEventsDisplayProps) {
  const [futureEvents, setFutureEvents] = useState<IEvently[]>([]);
  const [isListView, setIsListView] = useState<boolean>(true);
  useEffect(() => {
    const futureEvents = events.filter((event) => dayjs(event.dates["endDate"]).isAfter(dayjs().startOf('day')));
    setFutureEvents(futureEvents);
  }, [events]);

  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs());
  const [todaysEvents, setTodaysEvents] = useState<IEvently[]>([]);

  const onSelect = (value: Dayjs) => {
    setSelectedDay(value);
  };

  const visibleEvents = futureEvents.filter((event) => !event.hide);
  const filteredEvents = useEventsFilter({ events: visibleEvents });

  useEffect(() => {
    const todaysEvents = filteredEvents.filter((event) =>
      dayjs(selectedDay).isBetween(dayjs(event.dates["startDate"]), dayjs(event.dates["endDate"]), "day", "[]"));
    setTodaysEvents(todaysEvents);
  }, [selectedDay]);

  function onViewList() {
    setIsListView(true);
  }

  function onViewCalendar() {
    setIsListView(false);
    setSelectedDay(dayjs())
  }

  return (
    <>
      <header className="events-display-header">
        <h1 className="events-display-title">קונטקט ישראל</h1>
        <main className="events-display-main">
          <FilterModel />
          <div className="events-display-buttons">
            <Button
              onClick={onViewList}
              className={`events-display-button left ${isListView ? 'events-display-button-active' : ''}`}
            >
              <Icon icon="viewDay" className="events-display-icon" />
            </Button>
            <Button
              onClick={onViewCalendar}
              className={`events-display-button right ${!isListView ? 'events-display-button-active' : ''}`}
            >
              <Icon icon="calendar" className="events-display-icon" />
            </Button>
          </div>
        </main>
      </header>
      {!isListView ? (
        <>
          <CalendarView
            events={filteredEvents}
            onSelect={onSelect}
          />
          <EventsList events={todaysEvents} isEdit={isEdit} isEvents={!!events.length} />
        </>
      ) : (
        <EventsList events={futureEvents} isEdit={isEdit} isEvents={!!events.length} />
      )}
    </>
  );
}

export default EventsDisplay;
