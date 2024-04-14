import React, { createContext, useContext, useEffect, useState } from "react";
import { IEvent } from "../Components/UI/EventForm";

interface EventsContextType {
  events: IEvent[];
  setEvents: React.Dispatch<React.SetStateAction<IEvent[]>>;
  removeEvent: (id: string) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{
  initialEvents?: IEvent[];
  children: React.ReactNode;
}> = ({ children, initialEvents = [] }) => {
  const [events, setEvents] = useState<IEvent[]>(initialEvents);

  //TODO redo this
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const removeEvent = (id: string) => {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== id)
    );
    console.log(`EventsContext.removeEvent: Deleted event with id ${id}`);
  };

  return (
    <EventsContext.Provider value={{ events, setEvents, removeEvent }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEventsContext = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEventsContext must be used within an EventsProvider");
  }
  return context;
};
