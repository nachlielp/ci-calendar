import React from "react";
import VirtualList from "rc-virtual-list";
import { DbSimpleEvent } from "../../../drizzle/schema";
import { EventCard } from "./EventCard";
import { useWindowResize } from "../../hooks/useWindowResize";

interface IEventsList {
  events: DbSimpleEvent[];
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
      {(event: DbSimpleEvent) => (
        <EventCard
          key={event.id}
          event={event}
          cardWidth={adjustedItemWidth}
          screenWidth={width}
        />
      )}
    </VirtualList>
  );
};

export default EventsList;
