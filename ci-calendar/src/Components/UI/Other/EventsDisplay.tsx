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

export default function EventsDisplay({ events, isEdit }: IEventsDisplayProps) {
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
    <div className="events-display">
      <header className="header">
        <h1 className="title">קונטקט אימפרוביזציה ישראל</h1>
        <p className="subtitle">כל האירועים במקום אחד</p>
        <main className="menu-container">
          <div className="menu-btns">
            <Button
              onClick={onViewList}
              className={`btn left ${isListView ? 'active' : ''}`}
            >
              <div className="content left">
                <Icon icon="viewDay" className="events-display-icon" />
              </div>
            </Button>
            <Button
              onClick={onViewCalendar}
              className={`btn right ${!isListView ? 'active' : ''}`}
            >
              <div className="content right">
                <Icon icon="calendar" className="events-display-icon" />
              </div>
            </Button>
          </div>
          <FilterModel />
        </main>
      </header>
      <div className="events-display-list">
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
      </div>


    </div>
  );
}