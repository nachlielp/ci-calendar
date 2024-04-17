import { useEffect, useState } from "react";
import { firebaseService } from "../firebase.service";
import { IEvently } from "../util/interfaces";

export const useEvents = () => {
  const [events, setEvents] = useState<IEvently[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initTFirebase = async () => {
      firebaseService.initFirebaseJS();
      firebaseService.subscribe("events", (events: any) => {
        setEvents(events);
        setLoading(false);
      });
    };
    initTFirebase();
  }, []);
  return { events, loading };
};
