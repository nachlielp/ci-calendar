import { useSearchParams } from "react-router-dom";
import { IEvently } from "../util/interfaces";

export const useFilter = (events: IEvently[], uid?: string) => {
  const [searchParams] = useSearchParams();
  const eventTypes = searchParams.getAll("eventType");
  const districts = searchParams.getAll("district");
  let filteredEvents = events;
  if (uid) {
    filteredEvents = events.filter((event) => event.owners.includes(uid));
  }
  filteredEvents = filteredEvents.filter((event) => {
    const eventTypeList = event.subEvents.map((subEvent) => subEvent.type);
    if (eventTypes.length === 0 && districts.length === 0) {
      return true;
    }
    if (eventTypes.length === 0) {
      return hasOverlap(districts, [event.district]);
    }
    if (districts.length === 0) {
      return hasOverlap(eventTypes, eventTypeList);
    }
    return (
      hasOverlap(districts, [event.district]) &&
      hasOverlap(eventTypes, eventTypeList)
    );
  });
  return filteredEvents;
};

function hasOverlap(arr1: any[], arr2: any[]): boolean {
  return arr1.some((element) => arr2.includes(element));
}
