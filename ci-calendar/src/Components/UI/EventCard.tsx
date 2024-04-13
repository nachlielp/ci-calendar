import { Card, Tag, Button } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { DbSimpleEvent, EventType } from "../../../drizzle/schema";
import { FaMapMarkedAlt } from "react-icons/fa";
import { CiCalendarDate } from "react-icons/ci";
import { MdOutlineDescription } from "react-icons/md";
import { limitations, eventTypes } from "../../util/options";
import dayjs from "dayjs";
import React from "react";

interface IEventCard {
  event: DbSimpleEvent;
  cardWidth: number;
  screenWidth: number;
}
export const EventCard = React.forwardRef<HTMLDivElement, IEventCard>(
  ({ event, cardWidth, screenWidth }, ref) => {
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
              {getTypes(event.types, event.p2_types).map((type, index) => (
                <Tag color="blue" key={`type-${index}`}>
                  {type}
                </Tag>
              ))}
              {getLimitation(event)?.length > 0
                ? getLimitation(event).map((limitation, index) => (
                    <Tag key={`limitation-${index}`} color="green">
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
          {dayjs(event.startTime).format("HH:mm")}-
          {event.p2_endTime
            ? dayjs(event.p2_endTime).format("HH:mm")
            : dayjs(event.endTime).format("HH:mm")}{" "}
          {dayjs(event.startTime).format("DD-MM")}
        </p>
        {event.p2_endTime && (
          <>
            <span className="block mr-6">
              {getTypes(event.types)}&nbsp;&nbsp;
              {dayjs(event.endTime).format("HH:mm")}&nbsp;-&nbsp;
              {dayjs(event.startTime).format("HH:mm")}
            </span>
            <span className="block mr-6">
              {getTypes(event.p2_types)}&nbsp;&nbsp;
              {dayjs(event.p2_endTime).format("HH:mm")}-{" "}
              {dayjs(event.p2_startTime).format("HH:mm")}
            </span>
          </>
        )}
        <p className="flex items-center">
          <FaMapMarkedAlt className="ml-2" />
          {event.address}
        </p>
        <p className="flex items-center">
          <UserOutlined className="ml-2" /> {event.teachers}
        </p>
        {!isWhiteSpace(event.description) && (
          <p className="flex items-center">
            <MdOutlineDescription className="ml-2" />
            {event.description}
          </p>
        )}
        <div style={{ marginTop: 16 }}>
          {event.linkToEvent && (
            <Button type="default" href={event.linkToEvent} className="ml-2">
              פרטים נוספים
            </Button>
          )}
          {event.linkToRegistration && (
            <Button
              type="default"
              href={event.linkToRegistration}
              className="ml-2"
            >
              להרשמה
            </Button>
          )}
          {event.linkToPayment && (
            <Button type="default" href={event.linkToPayment} className="ml-2">
              לתשלום
            </Button>
          )}
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
const getLimitation = (event: DbSimpleEvent) => {
  return (
    event.limitations
      .filter((limitation) => !!limitation)
      .map((type) => limitations.find((lt) => lt.value === type)?.label) || []
  );
};

const isWhiteSpace = (str: string) => {
  return str.trim().length === 0;
};
