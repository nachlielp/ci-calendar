import VirtualList from "rc-virtual-list";
import { useWindowResize } from "../../hooks/useWindowResize";
import ErrorBoundary from "./ErrorBoundary";
import { IEvent } from "./EventForm";
import { EventCard } from "./EventCard";
import { useFilter } from "../../hooks/useFilter";
import { useEventsContext } from "../EventsProvider";

const EditEventsList = () => {
  const { height, width } = useWindowResize();
  const { events } = useEventsContext();
  const filteredEvents = useFilter(events);
  const adjustedHeight = Math.max(height - 100, 300);
  const adjustedItemWidth = Math.min(width / 1.5, 500);
  return (
    <VirtualList
      className="flex justify-center items-center w-full"
      data={filteredEvents}
      height={adjustedHeight}
      itemHeight={47}
      itemKey="id"
    >
      {(event: IEvent) => (
        <ErrorBoundary>
          <EventCard
            key={event.id}
            event={event}
            cardWidth={adjustedItemWidth}
            screenWidth={width}
            isEdit={true}
          />
        </ErrorBoundary>
      )}
    </VirtualList>
  );
};
export default EditEventsList;
