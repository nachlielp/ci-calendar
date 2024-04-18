import dayjs, { Dayjs } from "dayjs";
import { IEvently } from "../../util/interfaces";
import CalendarView from "./CalendarView";
import EventsList from "./EventsList";
import { useState } from "react";

interface IEventsDisplayProps {
  events: IEvently[];
  isEdit: boolean;
}

function EventsDisplay({ events, isEdit }: IEventsDisplayProps) {
  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs());
  const onSelect = (value: Dayjs) => {
    setSelectedDay(value);
  };
  const todaysEvents = events.filter((event) =>
    dayjs(event.subEvents[0].startTime).isSame(selectedDay, "day")
  );

  const flag = true;

  return (
    <>
      {flag ? (
        <>
          <CalendarView
            events={events}
            selectedDay={selectedDay}
            onSelect={onSelect}
          />
          <EventsList events={todaysEvents} isEdit={isEdit} />
        </>
      ) : (
        <EventsList events={events} isEdit={isEdit} />
      )}
    </>
  );
}

export default EventsDisplay;
