import { Card, Tag, Button } from "antd";
import { FaMapMarkedAlt } from "react-icons/fa";
import { CiCalendarDate } from "react-icons/ci";
import { MdOutlineDescription } from "react-icons/md";
import { tagOptions, eventTypes } from "../../../util/options";
import dayjs from "dayjs";
import React from "react";
import DeleteEvent from "../Other/DeleteEvent";
import EditEvent from "../Other/EditEvent";
import { IEventi, IEventiPart, IEvently } from "../../../util/interfaces";
import { VscDebugBreakpointLog } from "react-icons/vsc";

interface IMultiDayEventCardProps {
  event: IEvently;
  cardWidth: number;
  screenWidth: number;
  isEdit: boolean;
}
export const MultiDayEventCard = React.forwardRef<
  HTMLDivElement,
  IMultiDayEventCardProps
>(({ event, cardWidth, screenWidth, isEdit }, ref) => {
  const groupedSubEvents = groupAndSortSubEvents(event.subEvents);

  const footer = isEdit
    ? [
      <DeleteEvent eventId={event.id} />,
      <EditEvent eventId={event.id} isMultiDay={true} />,
    ]
    : [];

  return (
    <Card
      ref={ref}
      className="mt-4"
      title={
        <span
          className={`${screenWidth < 768 ? "flex flex-col" : "flex flex-row items-center"
            }`}
        >
          <span className="block">{event.title}&nbsp;</span>
          <span className="block">
            <Tag color="blue">{getType(event.type)}</Tag>
          </span>
        </span>
      }
      style={{ width: cardWidth }}
      actions={footer}
    >
      <p className="flex items-center">
        <CiCalendarDate className="ml-2" />
        {dayjs(event.dates["startDate"]).format("DD-MM")} &nbsp;עד&nbsp;
        {dayjs(event.dates["endDate"]).format("DD-MM")}
      </p>

      {Object.entries(groupedSubEvents).map(([date, subEvents]) => (
        <div key={date}>
          <p className="mr-6">{dayjs(date).format("DD-MM")}</p>
          {subEvents.map((subEvent, index) => (
            <span className="block mr-6" key={index}>
              <VscDebugBreakpointLog className="inline-block mb-1" />
              {dayjs(subEvent.startTime).format("HH:mm")}&nbsp;-&nbsp;
              {dayjs(subEvent.endTime).format("HH:mm")}&nbsp;
              {getType(subEvent.type as IEventi)}
              {subEvent.teachers.length > 0 && (
                <span>&nbsp;עם {subEvent.teachers.map((teacher) => teacher.label).join(", ")}</span>
              )}
              {subEvent.tags && (
                <span>
                  &nbsp;
                  {subEvent.tags.map((tag) => (
                    <Tag key={tag} color="green">
                      {getTag(tag)}
                    </Tag>
                  ))}
                </span>
              )}
            </span>
          ))}
        </div>
      ))}

      <p className="flex items-center">
        <FaMapMarkedAlt className="ml-2" />
        {event.address.label}
      </p>

      {!isWhiteSpace(event.description) && (
        <p className="flex items-center">
          <MdOutlineDescription className="ml-2" />
          {event.description}
        </p>
      )}
      {event.price.length > 0 && (
        <div className="flex items-center">
          <span className="text-2xl align-top relative top-[-14px]">
            &#8362;
          </span>
          &nbsp;&nbsp;
          <ul>
            {event.price.map((price, index) => (
              <li key={`${price.title}-${index}`}>
                {price.title} - {price.sum}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        {event.links.length > 0 &&
          event.links.map((link) => (
            <Button
              key={link.title}
              type="default"
              href={link.link}
              target="_blank"
            >
              {link.title}
            </Button>
          ))}
      </div>
    </Card>
  );
});

// const getTypes = (t1: IEventi[], t2?: IEventi[]) => {
//   let types = Array.from(new Set([...t1, ...(t2 || [])]));
//   t2?.forEach((element) => {
//     if (!types.includes(element)) {
//       types.push(element);
//     }
//   });
//   return (
//     types
//       .filter((type) => !!type)
//       .map((type) => eventTypes.find((et) => et.value === type)?.label) || []
//   );
// };
const getType = (type: string) => {
  return eventTypes.find((et) => et.value === type)?.label;
};
const getTag = (tag: string) => {
  return tagOptions.find((t) => t.value === tag)?.label;
};
// const getTags = (event: IEvently) => {
//   return (
//     event.subEvents
//       .reduce((acc, curr) => [...acc, ...curr.tags], [] as string[])
//       .filter((tags) => !!tags)
//       .map((type) => tagOptions.find((tag) => tag.value === type)?.label) || []
//   );
// };
const isWhiteSpace = (str: string) => {
  return str.trim().length === 0;
};
const groupAndSortSubEvents = (subEvents: IEventiPart[]) => {
  const eventsArray = Object.values(subEvents);

  const groupedByDate = eventsArray.reduce(
    (acc: Record<string, IEventiPart[]>, event: IEventiPart) => {
      const dateKey = dayjs(event.startTime).format("YYYY-MM-DD");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    },
    {}
  );

  Object.keys(groupedByDate).forEach((date) => {
    groupedByDate[date].sort(
      (a: IEventiPart, b: IEventiPart) =>
        dayjs(a.startTime).hour() - dayjs(b.startTime).hour()
    );
  });

  return groupedByDate;
};
