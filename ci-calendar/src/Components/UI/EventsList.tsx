import React from "react";
import VirtualList from "rc-virtual-list";
import { EventCard } from "./EventCard";
import { useWindowResize } from "../../hooks/useWindowResize";
import ErrorBoundary from "./ErrorBoundary";
import { IEvent } from "./EventForm";
import { useFilter } from "../../hooks/useFilter";
import { useEvents } from "../../hooks/useEvent";

const EventsList: React.FC = () => {
  const { height, width } = useWindowResize();
  const events = useEvents();
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
            isEdit={false}
          />
        </ErrorBoundary>
      )}
    </VirtualList>
  );
};

export default EventsList;
