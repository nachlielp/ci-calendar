import { useSearchParams } from "react-router-dom";
import { DbSimpleEvent } from "../../drizzle/schema";

export const useFilter = (events: DbSimpleEvent[]) => {
  const [searchParams] = useSearchParams();
  const eventTypes = searchParams.getAll("eventType");
  const districts = searchParams.getAll("district");

  const filteredEvents = events.filter((event) => {
    if (eventTypes.length === 0 && districts.length === 0) {
      return true;
    }
    if (eventTypes.length === 0) {
      return hasOverlap(districts, [event.district]);
    }
    if (districts.length === 0) {
      return hasOverlap(eventTypes, [...event.types, ...event.p2_types]);
    }
    return (
      hasOverlap(districts, [event.district]) &&
      hasOverlap(eventTypes, [...event.types, ...event.p2_types])
    );
  });
  return filteredEvents;
};

function hasOverlap(arr1: any[], arr2: any[]): boolean {
  return arr1.some((element) => arr2.includes(element));
}
