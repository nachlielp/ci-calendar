// import VirtualList from "rc-virtual-list";
import { SingleDayEventCard } from "./SingleDayEventCard";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { useEventsFilter } from "../../../hooks/useEventsFilter";
import { IEvently } from "../../../util/interfaces";
import { useAuthContext } from "../../Auth/AuthContext";
import Loading from "../Other/Loading";
import EmptyList from "../Other/Empty";
import { MultiDayEventCard } from "./MultiDayEventCard";

interface IEventsListProps {
  events: IEvently[];
  isEdit: boolean;
}
export default function EventsList({ events, isEdit }: IEventsListProps) {
  const { width } = useWindowSize();
  const { currentUser } = useAuthContext();
  const isAdmin = currentUser?.userType === "admin";
  let filteredEvents = useEventsFilter({ events });
  if (isEdit && !isAdmin) {
    filteredEvents = useEventsFilter({ events, uid: currentUser?.id });
  } else if (isEdit && isAdmin) {
    filteredEvents = events
  } else {
    const visibleEvents = events.filter((event) => !event.hide);
    filteredEvents = useEventsFilter({ events: visibleEvents });
  }

  // const adjustedHeight = Math.max(height - 100, 300);
  const adjustedItemWidth = Math.min(width / 1.5, 500);
  if (!filteredEvents.length && isEdit && !isAdmin) return <EmptyList />;
  if (!filteredEvents) return <Loading />;
  console.log("EventsList.filteredEvents: ", filteredEvents)
  return (
    <div className="flex flex-col items-center w-full">
      {filteredEvents.map((event) => (
        <div key={event.id} style={{ width: adjustedItemWidth }}>
          {event.dates["startDate"] === event.dates["endDate"] ? (
            <SingleDayEventCard
              key={event.id}
              event={event}
              cardWidth={adjustedItemWidth}
              screenWidth={width}
              isEdit={isEdit}
            />
          ) : (
            <MultiDayEventCard
              key={event.id}
              event={event}
              cardWidth={adjustedItemWidth}
              screenWidth={width}
              isEdit={isEdit}
            />
          )}
        </div>
      ))}
      {/* <VirtualList
        className="flex justify-center items-center w-full"
        data={filteredEvents}
        height={adjustedHeight}
        onScroll={() => {
          console.log("onScroll")
        }}
        itemHeight={47}
        itemKey="id"
      >
        {(event: IEvently) => (
          <div key={event.id} style={{ width: adjustedItemWidth }}>
            {event.dates["startDate"] === event.dates["endDate"] ? (
              <SingleDayEventCard
                key={event.id}
                event={event}
                cardWidth={adjustedItemWidth}
                screenWidth={width}
                isEdit={isEdit}
              />
            ) : (
              <MultiDayEventCard
                key={event.id}
                event={event}
                cardWidth={adjustedItemWidth}
                screenWidth={width}
                isEdit={isEdit}
              />
            )}
          </div>
        )}
      </VirtualList> */}
    </div>
  );
}

// const emptyEventsList = () => {
//   return (
//     <Empty
//       image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
//       imageStyle={{ height: 60 }}
//       description={<span>אופס, נראה שיש לנו בעיה</span>}
//     ></Empty>
//   );
// };
