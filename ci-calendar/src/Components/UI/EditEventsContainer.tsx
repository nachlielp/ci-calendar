import { useEvents } from "../../hooks/useEvent";
import { EventsProvider } from "../EventsProvider";
import EditEventsList from "./EditEventsList";
import { IEvent } from "./EventForm";

interface IEditEventsContainer {
  events: IEvent[];
}

function EditEventsContainer({ events }: IEditEventsContainer) {
  return (
    <EventsProvider initialEvents={events}>
      <EditEventsList />
    </EventsProvider>
  );
}

export default EditEventsContainer;
