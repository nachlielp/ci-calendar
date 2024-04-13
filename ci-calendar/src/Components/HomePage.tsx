import EventsList from "./UI/EventsList";
import { useEvents } from "../hooks/useEvent";
import { useFilter } from "../hooks/useFilter";

const HomePage: React.FC = () => {
  const events = useEvents();
  const filteredEvents = useFilter(events);
  return <EventsList events={filteredEvents} />;
};

export default HomePage;
