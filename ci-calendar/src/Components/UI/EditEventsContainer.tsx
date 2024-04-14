import { useEvents } from "../../hooks/useEvent";
import { EventsProvider } from "../EventsProvider";
import EditEventsList from "./EditEventsList";

function EditEventsContainer() {
  const events = useEvents();
  return (
    <EventsProvider initialEvents={events}>
      <EditEventsList />
    </EventsProvider>
  );
}

export default EditEventsContainer;
