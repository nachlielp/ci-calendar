import dayjs, { Dayjs } from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween)

import { IEvently } from "../../../util/interfaces";
import CalendarView from "./CalendarView";
import EventsList from "../DisplayEvents/EventsList";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEventsFilter } from "../../../hooks/useEventsFilter";

interface IEventsDisplayProps {
  events: IEvently[];
  isEdit: boolean;
}

function EventsDisplay({ events, isEdit }: IEventsDisplayProps) {
  const [futureEvents, setFutureEvents] = useState<IEvently[]>([]);

  useEffect(() => {
    const futureEvents = events.filter((event) => dayjs(event.dates["endDate"]).isAfter(dayjs().startOf('day')));
    setFutureEvents(futureEvents);
  }, [events]);

  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs());

  const [todaysEvents, setTodaysEvents] = useState<IEvently[]>([]);
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
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
  return (
    <>
      {view === "calendar" ? (
        <>
          <CalendarView
            events={filteredEvents}
            onSelect={onSelect}
          />
          <EventsList events={todaysEvents} isEdit={isEdit} />
        </>
      ) : (
        <EventsList events={futureEvents} isEdit={isEdit} />
      )}
    </>
  );
}

export default EventsDisplay;
