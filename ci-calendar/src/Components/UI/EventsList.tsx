import React from "react";
import VirtualList from "rc-virtual-list";
import { EventCard } from "./EventCard";
import { useWindowResize } from "../../hooks/useWindowResize";
import { FbEvent } from "../../Firebase";
import ErrorBoundary from "../ErrorBoudary";

interface IEventsList {
  events: FbEvent[];
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
      {(event: FbEvent) => (
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
