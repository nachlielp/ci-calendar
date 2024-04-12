import { Button } from "antd";
import { useAuthContext } from "./Auth/AuthContext";
import { ButtonLink } from "./UI/LinkButton";
import { DbEvent } from "../../drizzle/schema";
import { useState } from "react";

const HomePage: React.FC = () => {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const auth = useAuthContext();
  if (!auth) {
    throw new Error("Auth context not found");
  }
  const handleGetEvents = async () => {
    const events = await auth.getAllEvents();
    setEvents(events);
  };

  return (
    <div>
      <h1>Home page</h1>
      <ButtonLink to="/event-form">Event Form</ButtonLink>
      <ButtonLink to="/test-form">Test Form</ButtonLink>
      <Button onClick={handleGetEvents}>Get Events</Button>
      {events.length ? (
        <div>
          {events.map((event) => (
            <div key={event.id}>{event.title}</div>
          ))}
        </div>
      ) : (
        <div>No events</div>
      )}
    </div>
  );
};

export default HomePage;
