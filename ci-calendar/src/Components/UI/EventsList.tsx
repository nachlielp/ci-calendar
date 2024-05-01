import React from "react";
import VirtualList from "rc-virtual-list";
import { EventCard } from "./EventCard";
import { useWindowSize } from "../../hooks/useWindowSize";
import ErrorBoundary from "./ErrorBoundary";
import { useEventsFilter } from "../../hooks/useEventsFilter";
import { IEvently } from "../../util/interfaces";
import { useAuthContext } from "../Auth/AuthContext";
import Loading from "./Loading";
import EmptyList from "./Empty";
import dayjs from "dayjs";

interface IEventsListProps {
  events: IEvently[];
  isEdit: boolean;
}
const EventsList: React.FC<IEventsListProps> = ({ events, isEdit }) => {
  const { height, width } = useWindowSize();
  const { currentUser } = useAuthContext();
  const isAdmin = currentUser?.userType === "admin";
  let filteredEvents = useEventsFilter({ events });
  if (isEdit && !isAdmin) {
    filteredEvents = useEventsFilter({ events, uid: currentUser?.id });
  } else {
    filteredEvents = useEventsFilter({ events });
  }
  filteredEvents.sort((a, b) => {
    if (dayjs(a.subEvents[0].startTime).isBefore(b.subEvents[0].startTime)) {
      return -1;
    }
    if (dayjs(a.subEvents[0].startTime).isAfter(b.subEvents[0].startTime)) {
      return 1;
    }
    return 0;
  });
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
