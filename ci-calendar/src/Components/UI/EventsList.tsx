import React from "react";
import VirtualList from "rc-virtual-list";
import { EventCard } from "./EventCard";
import { useWindowResize } from "../../hooks/useWindowResize";
import ErrorBoundary from "../ErrorBoudary";
import { IEvent } from "./EventForm";

interface IEventsList {
  events: IEvent[];
}
const EventsList: React.FC<IEventsList> = ({ events }) => {
  const { height, width } = useWindowResize();
  const adjustedHeight = Math.max(height - 100, 300);
  const adjustedItemWidth = Math.min(width / 1.5, 500);
  return (
    <VirtualList
      className="flex justify-center items-center w-full"
      data={events}
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
          />
        </ErrorBoundary>
      )}
    </VirtualList>
  );
};

export default EventsList;
