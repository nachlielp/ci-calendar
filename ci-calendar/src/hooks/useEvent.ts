import { useState, useEffect } from "react";
import { useAuthContext } from "../Components/Auth/AuthContext";
import { IEvent } from "../Components/UI/EventForm";

export const useEvents = () => {
  const [events, setEvents] = useState<IEvent[]>([]);
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
