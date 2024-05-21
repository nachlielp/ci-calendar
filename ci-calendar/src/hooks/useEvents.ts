import { useEffect, useState } from "react";
import { firebaseService } from "../firebase.service";
import { IEvently } from "../util/interfaces";
import dayjs from "dayjs";

export const useEvents = () => {
  const [events, setEvents] = useState<IEvently[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initTFirebase = async () => {
      firebaseService.initFirebaseJS();
      firebaseService.subscribeToCollection("events", (events: IEvently[]) => {
        const sortedEvents = events.sort((a, b) => dayjs(a.dates["startDate"]).diff(dayjs(b.dates["startDate"])));
        setEvents(sortedEvents);
        setLoading(false);
      });
    };
    initTFirebase();
  }, []);
  return { events, loading };
};
