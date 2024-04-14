import { Card, Tag, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { EventType } from "../../../drizzle/schema";
import { FaMapMarkedAlt } from "react-icons/fa";
import { CiCalendarDate } from "react-icons/ci";
import { MdOutlineDescription } from "react-icons/md";
import { limitations, eventTypes } from "../../util/options";
import dayjs from "dayjs";
import React from "react";
import { IEvent } from "./EventForm";

interface IEventCard {
  event: IEvent;
  cardWidth: number;
  screenWidth: number;
}
export const EventCard = React.forwardRef<HTMLDivElement, IEventCard>(
  ({ event, cardWidth, screenWidth }, ref) => {
    const subEventLen = Object.values(event.subEvents).length;
    return (
      <Card
        ref={ref}
        className="mt-4"
        title={
          <span
            className={`${
              screenWidth < 768 ? "flex flex-col" : "flex flex-row items-center"
            }`}
          >
            <span className="block">{event.title}&nbsp;</span>
            <span className="block">
              {getTypes(
                Object.values(event.subEvents).flatMap(
                  (subEvent) => subEvent.type as EventType
                )
              ).map((type, index) => (
                <Tag color="blue" key={`${type}-${index}`}>
                  {type}
                </Tag>
              ))}
              {getLimitation(event).length > 0
                ? getLimitation(event).map((limitation, index) => (
                    <Tag key={`${limitation}-${index}`} color="green">
                      {limitation}
                    </Tag>
                  ))
                : ""}
            </span>
          </span>
        }
        style={{ width: cardWidth }}
      >
        <p className="flex items-center">
          <CiCalendarDate className="ml-2" />
          {subEventLen > 0 ? (
            <>
              {dayjs(event.subEvents[0].startTime).format("HH:mm")}-
              {dayjs(event.subEvents[subEventLen - 1].endTime).format("HH:mm")}{" "}
              {dayjs(event.subEvents[0].startTime).format("DD-MM")}
            </>
          ) : (
            <span>No event times available</span>
          )}
        </p>
        {subEventLen > 1 &&
          Object.values(event.subEvents).map((subEvent, index) => (
            <span className="block mr-6" key={index}>
              {/* {subEvent.subTitle}&nbsp;&nbsp; עם
                {subEvent.teachers.map((teacher, index) => (
                  <p key={index}>{teacher} |</p>
                ))} */}
              {dayjs(subEvent.endTime).format("HH:mm")}&nbsp;-&nbsp;
              {dayjs(subEvent.startTime).format("HH:mm")}
            </span>
          ))}
        <p className="flex items-center">
          <FaMapMarkedAlt className="ml-2" />
          {event.address}
        </p>
        <p className="flex items-center">
          <UserOutlined className="ml-2" />{" "}
          {Object.values(event.subEvents).flatMap(
            (subEvent) => subEvent.teacher
          )}
        </p>
        {!isWhiteSpace(event.description) && (
          <p className="flex items-center">
            <MdOutlineDescription className="ml-2" />
            {event.description}
          </p>
        )}
        <div style={{ marginTop: 16 }}>
          {event.links &&
            Object.entries(event.links).map(([key, value]) => (
              <Button
                key={`${key}-${value}`}
                type="default"
                href={value}
                className="ml-2"
              >
                {key}
              </Button>
            ))}
        </div>
      </Card>
    );
  }
);

const getTypes = (t1: EventType[], t2?: EventType[]) => {
  return (
    [...t1, ...(t2 || [])]
      .filter((type) => !!type)
      .map((type) => eventTypes.find((et) => et.value === type)?.label) || []
  );
};
const getLimitation = (event: IEvent) => {
  return (
    event.subEvents
      .reduce((acc, curr) => [...acc, ...curr.limitations], [] as string[])
      .filter((limitation) => !!limitation)
      .map((type) => limitations.find((lt) => lt.value === type)?.label) || []
  );
};

const isWhiteSpace = (str: string) => {
  return str.trim().length === 0;
};
