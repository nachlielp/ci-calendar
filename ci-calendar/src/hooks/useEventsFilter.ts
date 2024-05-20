import { useSearchParams } from "react-router-dom";
import { IEvently } from "../util/interfaces";
import dayjs from "dayjs";

interface IUseEventsFilterProps {
  events: IEvently[];
  showFuture?: boolean;
  uid?: string;
}

export const useEventsFilter = ({ events, showFuture, uid }: IUseEventsFilterProps) => {
  console.log("uid", uid);
  const [searchParams] = useSearchParams();
  const eventTypes = searchParams.getAll("eventType");
  const districts = searchParams.getAll("district");

  let filteredEvents = events;

  if (uid && uid !== "") {
    filteredEvents = events.filter((event) => event.owners.find((owner) => owner.value === uid));
  }

  if (showFuture !== undefined) {
    const now = dayjs();
    const startOfToday = dayjs().startOf('day');
    if (showFuture) {
      filteredEvents = filteredEvents.filter((event) => dayjs(event.dates['endDate']) >= startOfToday);
    } else {
      filteredEvents = filteredEvents.filter((event) => dayjs(event.dates['startDate']) < now);
    }
  }

  filteredEvents = filteredEvents.filter((event) => {
    const eventTypeList = event.subEvents.map((subEvent) => subEvent.type);
    if (event.type !== "") {
      eventTypeList.push(event.type);
    }
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
