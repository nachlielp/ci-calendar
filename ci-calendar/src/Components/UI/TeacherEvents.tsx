import { useEvents } from "../../hooks/useEvent";
import { useFilter } from "../../hooks/useFilter";
import EventsList from "./EventsList";

function TeacherEvents() {
  const events = useEvents();
  const filteredEvents = useFilter(events);
  return <EventsList events={filteredEvents} />;
}

export default TeacherEvents;
