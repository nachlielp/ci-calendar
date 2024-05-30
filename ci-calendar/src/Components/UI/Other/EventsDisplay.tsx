import dayjs, { Dayjs } from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween)

import { IEvently } from "../../../util/interfaces";
import CalendarView from "./CalendarView";
import EventsList from "../DisplayEvents/EventsList";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useEventsFilter } from "../../../hooks/useEventsFilter";
import FilterModel from "./FilterModel";
import { Button } from "antd";
import { viewOptions } from "../../../util/options";
import { useParamsHandler } from "../../../hooks/useParamsHandler";
import { Icon } from "./Icon";

interface IEventsDisplayProps {
  events: IEvently[];
  isEdit: boolean;
}

//TODO hide scroll base on list view
function EventsDisplay({ events, isEdit }: IEventsDisplayProps) {
  const [futureEvents, setFutureEvents] = useState<IEvently[]>([]);
  const {
    currentValues: viewCurrentValues,
    onOptionsChange,
    clearSearchParams,
  } = useParamsHandler({ title: "view", options: viewOptions });
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

  const handleViewChange = () => {
    if (viewCurrentValues.length === 0) {
      setSelectedDay(dayjs())
      onOptionsChange("view")(["calendar"]);
    } else {
      clearSearchParams(["view"]);
    }
  };
  return (
    <>
      <header className="flex flex-col justify-center items-center mt-5">
        <h1 className="text-2xl mb-3">קונטקט ישראל</h1>
        <main className="flex flex-row items-center">
          <FilterModel />
          <div className="flex flex-row">
            <Button
              onClick={handleViewChange}
              className={`flex items-center justify-center  rounded-r-none  ${!viewCurrentValues.length ? 'bg-gray-300' : ''}`}
            >
              <Icon icon="viewDay" className="w-6 h-6 " />
            </Button>
            <Button
              onClick={handleViewChange}
              className={`flex items-center justify-center  rounded-l-none  ${viewCurrentValues.length ? 'bg-gray-300' : ''}`}
            >
              <Icon icon="calendar" className="w-6 h-6 " />
            </Button>
          </div>
        </main>
      </header>
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
