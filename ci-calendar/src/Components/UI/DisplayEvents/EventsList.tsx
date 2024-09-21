// import VirtualList from "rc-virtual-list";
import { SingleDayEventCard } from "./SingleDayEventCard";
import { useEventsFilter } from "../../../hooks/useEventsFilter";
import { CIEvent } from "../../../util/interfaces";
import Loading from "../Other/Loading";
import EmptyList from "../Other/Empty";
import { Empty } from "antd";
import SingleDayModalCard from "./SingleDayModalCard";
import { useUser } from "../../../context/UserContext";

interface IEventsListProps {
  onSelectEvent: (event: CIEvent) => void;
  events: CIEvent[];
  isEdit: boolean;
  isEvents: boolean;
}
export default function EventsList({
  events,
  isEdit,
  isEvents,
  onSelectEvent,
}: IEventsListProps) {
  const { user } = useUser();
  const isAdmin = user?.userType === "admin";
  let filteredEvents = useEventsFilter({ events });
  if (isEdit && !isAdmin) {
    filteredEvents = useEventsFilter({ events, uids: user ? [user.id] : [] });
  } else if (isEdit && isAdmin) {
    filteredEvents = events;
  } else {
    const visibleEvents = events.filter((event) => !event.hide);
    filteredEvents = useEventsFilter({ events: visibleEvents });
  }

  // const adjustedItemWidth = Math.min(width / 1.2, 500);
  if (!filteredEvents.length && isEdit && !isAdmin) return <EmptyList />;
  if (!filteredEvents) return <Loading />;

  return (
    <div className="events-list-container">
      {!isEvents && emptyEventsList()}
      {filteredEvents.map((event) => (
        <div key={event.id}>
          <SingleDayModalCard
            event={event}
            onSelectEvent={onSelectEvent}
            anchorEl={
              <SingleDayEventCard
                key={event.id}
                event={event}
                isEdit={isEdit}
              />
            }
          />
        </div>
      ))}
      <div className="events-list-footer"></div>
    </div>
  );
}

const emptyEventsList = () => {
  return (
    <Empty
      imageStyle={{ height: 60, marginTop: "10rem" }}
      description={<span></span>}
    >
      <span style={{ fontSize: "1.5rem" }}>אופס, נראה שיש לנו בעיה</span>
    </Empty>
  );
};
