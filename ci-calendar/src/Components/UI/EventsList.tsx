import React from "react";
import VirtualList from "rc-virtual-list";
import { EventCard } from "./EventCard";
import { useWindowResize } from "../../hooks/useWindowResize";
import ErrorBoundary from "./ErrorBoundary";
import { useFilter } from "../../hooks/useFilter";
import { IEvently } from "../../util/interfaces";
import { useAuthContext } from "../Auth/AuthContext";
import Loading from "./Loading";
import EmptyList from "./Empty";

interface IEventsList {
  events: IEvently[];
  isEdit: boolean;
}
const EventsList: React.FC<IEventsList> = ({ events, isEdit }) => {
  const { height, width } = useWindowResize();
  const { currentUser } = useAuthContext();
  const isAdmin = currentUser?.userType === "admin";
  let filteredEvents = useFilter(events);
  if (isEdit && !isAdmin) {
    filteredEvents = useFilter(events, currentUser?.id);
  } else {
    filteredEvents = useFilter(events);
  }
  const adjustedHeight = Math.max(height - 100, 300);
  const adjustedItemWidth = Math.min(width / 1.5, 500);
  if (!filteredEvents.length && isEdit && !isAdmin) return <EmptyList />;
  if (!filteredEvents) return <Loading />;
  return (
    <VirtualList
      className="flex justify-center items-center w-full"
      data={filteredEvents}
      height={adjustedHeight}
      itemHeight={47}
      itemKey="id"
    >
      {(event: IEvently) => (
        <ErrorBoundary>
          <EventCard
            key={event.id}
            event={event}
            cardWidth={adjustedItemWidth}
            screenWidth={width}
            isEdit={isEdit}
          />
        </ErrorBoundary>
      )}
    </VirtualList>
  );
};

export default EventsList;

// const emptyEventsList = () => {
//   return (
//     <Empty
//       image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
//       imageStyle={{ height: 60 }}
//       description={<span>אופס, נראה שיש לנו בעיה</span>}
//     ></Empty>
//   );
// };
