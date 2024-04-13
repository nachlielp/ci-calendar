import { useState, useEffect } from "react";
import { DbSimpleEvent } from "../../drizzle/schema";
import { useAuthContext } from "../Components/Auth/AuthContext";

export const useEvents = () => {
  const [events, setEvents] = useState<DbSimpleEvent[]>([]);
  const auth = useAuthContext();
  if (!auth) {
    throw new Error("Auth context not found");
  }
  const handleGetEvents = async () => {
    const events = await auth.getAllEvents();
    setEvents(events);
  };

  useEffect(() => {
    handleGetEvents();
  }, []);

  return events;
};
