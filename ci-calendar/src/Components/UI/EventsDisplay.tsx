import { IEvently } from "../../util/interfaces";
import CalendarView from "./CalendarView";
import EventsList from "./EventsList";

interface IEventsDisplayProps {
  events: IEvently[];
  isEdit: boolean;
}

function EventsDisplay({ events, isEdit }: IEventsDisplayProps) {
  const flag = true;
  return (
    <>
      {flag ? <CalendarView /> : <EventsList events={events} isEdit={isEdit} />}
    </>
  );
}

export default EventsDisplay;
