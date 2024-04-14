import { useSearchParams } from "react-router-dom";
import { FbEvent } from "../Firebase";

export const useFilter = (events: FbEvent[]) => {
  const [searchParams] = useSearchParams();
  const eventTypes = searchParams.getAll("eventType");
  const districts = searchParams.getAll("district");

  const filteredEvents = events.filter((event) => {
    const eventTypeList = Array.from(
      new Set(
        Object.values(event.subEvents).flatMap(
          (subEvent: { types: string[] }) => subEvent.types
        )
      )
    );
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
