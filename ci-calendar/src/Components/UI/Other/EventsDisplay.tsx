import dayjs, { Dayjs } from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween)
import { getLabelByValue } from "../../../util/helpers";
import { IEvently } from "../../../util/interfaces";
import CalendarView from "./CalendarView";
import EventsList from "../DisplayEvents/EventsList";
import { useEffect, useState } from "react";
import { useEventsFilter } from "../../../hooks/useEventsFilter";
import FilterModel from "./FilterModel";
import { Button, Tag } from "antd";
import { useParamsHandler } from "../../../hooks/useParamsHandler";

import { Icon } from "./Icon";
import { districtOptions, eventTypes } from "../../../util/options";
import FilterDrawer from "./FilterDrawer";
import { useWindowSize } from "../../../hooks/useWindowSize";

interface IEventsDisplayProps {
  events: IEvently[];
  isEdit: boolean;
}

export default function EventsDisplay({ events, isEdit }: IEventsDisplayProps) {
  const [futureEvents, setFutureEvents] = useState<IEvently[]>([]);
  const [isListView, setIsListView] = useState<boolean>(true);

  const { width } = useWindowSize();
  const {
    currentValues: currentEventFilters,
    removeOption: onRemoveEventFilter,
  } = useParamsHandler({ title: "eventType", options: eventTypes });

  const {
    currentValues: currentDistrictValues,
    removeOption: onRemoveDistrictFilter,
  } = useParamsHandler({ title: "district", options: districtOptions });


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
              <Icon icon="viewDay" className="events-display-icon" />
            </Button>
            <Button
              onClick={onViewCalendar}
              className={`btn right ${!isListView ? 'active' : ''}`}
            >
              <Icon icon="calendar" className="events-display-icon" />
            </Button>
          </div>
          {width > 768 ? <FilterModel /> : <FilterDrawer />}
        </main>
        <article className="selected-filters">
          {currentEventFilters?.map((eventType: any) => (
            <Tag className="filter-tag" color="#913e2f" key={eventType} closable onClose={() => onRemoveEventFilter("eventType", eventType)}>{getLabelByValue(eventType, eventTypes)}</Tag>
          ))}
          {
            currentDistrictValues?.map((district: any) => (
              <Tag className="filter-tag" color="#913e2f" key={district} closable onClose={() => onRemoveDistrictFilter("district", district)}>{getLabelByValue(district, districtOptions)}</Tag>
            ))
          }
        </article>
      </header>
      <section className="events-display-list">
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
      </section>


    </div>
  );
}