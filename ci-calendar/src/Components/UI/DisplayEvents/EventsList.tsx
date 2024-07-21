// import VirtualList from "rc-virtual-list";
import { SingleDayEventCard } from "./SingleDayEventCard";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { useEventsFilter } from "../../../hooks/useEventsFilter";
import { IEvently } from "../../../util/interfaces";
import { useAuthContext } from "../../Auth/AuthContext";
import Loading from "../Other/Loading";
import EmptyList from "../Other/Empty";
import { MultiDayEventCard } from "./MultiDayEventCard";
import { Empty } from "antd";
import SingleDayModalCard from "./SingleDayModalCard";

interface IEventsListProps {
  events: IEvently[];
  isEdit: boolean;
  isEvents: boolean;
}
export default function EventsList({ events, isEdit, isEvents }: IEventsListProps) {
  const { width } = useWindowSize();
  const { currentUser } = useAuthContext();
  const isAdmin = currentUser?.userType === "admin";
  let filteredEvents = useEventsFilter({ events });
  if (isEdit && !isAdmin) {
    filteredEvents = useEventsFilter({ events, uids: currentUser ? [currentUser.id] : [] });
  } else if (isEdit && isAdmin) {
    filteredEvents = events
  } else {
    const visibleEvents = events.filter((event) => !event.hide);
    filteredEvents = useEventsFilter({ events: visibleEvents });
  }

  const adjustedItemWidth = Math.min(width / 1.2, 500);
  if (!filteredEvents.length && isEdit && !isAdmin) return <EmptyList />;
  if (!filteredEvents) return <Loading />;

  return (
    <div className="events-list-container">
      {!isEvents && emptyEventsList()}
      {filteredEvents.map((event) => (
        <div key={event.id} style={{ width: adjustedItemWidth }}>
          {event.dates["startDate"] === event.dates["endDate"] ? (
            <SingleDayModalCard event={event}
              anchorEl={
                <SingleDayEventCard
                  key={event.id}
                  event={event}
                  cardWidth={adjustedItemWidth}
                  isEdit={isEdit}
                />
              }
            />

          ) : (
            <MultiDayEventCard
              key={event.id}
              event={event}
              cardWidth={adjustedItemWidth}
              isEdit={isEdit}
            />
          )}
        </div>
      ))}
      <div className="events-list-footer">
      </div>
    </div>
  );
}

const emptyEventsList = () => {
  return (
    <Empty
      imageStyle={{ height: 60, marginTop: "10rem" }}
      description={<span></ span>}
    >
      <span style={{ fontSize: "1.5rem" }}>אופס, נראה שיש לנו בעיה</span>
    </Empty>
  );
};
