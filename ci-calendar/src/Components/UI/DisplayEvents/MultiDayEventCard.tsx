import React from "react";
import { Card, Tag, Button } from "antd";
import { tagOptions, eventTypes } from "../../../util/options";
import dayjs from "dayjs";
import DeleteEvent from "../Other/DeleteEvent";
import EditEvent from "../Other/EditEvent";
import { EventlyType, IEventiPart, IEvently } from "../../../util/interfaces";
import RecycleEvent from "../Other/RecycleEvent";
import BioModal from "../DisplayUsers/BioModal";
import { formatHebrewDate, getEventTeachersIds } from "./SingleDayEventCard";
import { useTeacherBio } from "../../../hooks/useTeacherBio";
import HideEvent from "../Other/HideEvent";
import { Icon } from "../Other/Icon";
import MultiDayModalCard from "./MultiDayModalCard";

interface IMultiDayEventCardProps {
  event: IEvently;
  cardWidth: number;
  isEdit: boolean;
}

export const MultiDayEventCard = React.forwardRef<
  HTMLDivElement,
  IMultiDayEventCardProps
>(({ event, cardWidth, isEdit }, ref) => {
  const groupedSubEvents = groupAndSortSubEvents(event.subEvents);

  const teachersIds = getEventTeachersIds(event);
  const { teachers } = useTeacherBio({ ids: teachersIds });

  function openGoogleMaps(placeId: string, address: string) {
    const iosUrl = `comgooglemaps://?q=${encodeURIComponent(address)}`;
    const androidUrl = `geo:0,0?q=${encodeURIComponent(address)}`;
    const fallbackUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;

    if (/(iPhone|iPad|iPod)/.test(navigator.userAgent)) {
      setTimeout(function () {
        window.location.href = fallbackUrl;
      }, 25);
      window.open(iosUrl, '_blank');
    } else if (/Android/.test(navigator.userAgent)) {
      setTimeout(function () {
        window.location.href = fallbackUrl;
      }, 25);
      window.open(androidUrl, '_blank');
    } else {
      window.open(fallbackUrl, '_blank');
    }
  }

  const footer = isEdit
    ? [
      <DeleteEvent eventId={event.id} />,
      <EditEvent eventId={event.id} isMultiDay={true} />,
      <RecycleEvent eventId={event.id} isMultiDay={true} />,
      <HideEvent eventId={event.id} hide={event.hide} />,
    ]
    : [];

  return (
    <Card
      ref={ref}
      className="mt-4"

      style={{ width: cardWidth }}
      actions={footer}
    >
      <div className="flex flex-col sm:flex-col sm:items-right">
        {isEdit ?
          <div className="block font-bold text-lg  w-full sm:w-auto">{event.title}&nbsp;</div>
          : <MultiDayModalCard event={event} />
        }
      </div>

      <br />
      <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
        <Icon icon="event" className="w-5 h-5 mt-1 align-middle" />
        <p>
          <b>{formatHebrewDate(event.subEvents[0].startTime)}</b>&nbsp;עד ה-
          <b>{formatHebrewDate(event.subEvents[event.subEvents.length - 1].endTime)}</b>
        </p>
      </div>

      {isEdit && Object.entries(groupedSubEvents).map(([date, subEvents]) => (
        <div key={date}>
          <p className="mr-6">{formatHebrewDate(date)}</p>
          {subEvents.map((subEvent, index) => (
            <div className="grid grid-cols-[auto,1fr] gap-2 mb-2 pr-6" key={index}>
              <Icon icon="hov" className="w-3 h-3 mt-1 mr-1 align-middle" />
              <span>
                {dayjs(subEvent.startTime).format("HH:mm")}&nbsp;-&nbsp;
                {dayjs(subEvent.endTime).format("HH:mm")}&nbsp;
                {getType(subEvent.type as EventlyType)}
                {subEvent.teachers.length > 0 && (
                  <span>&nbsp;עם {
                    subEvent.teachers.map((teacher, index, array) => {
                      const isTeacher = teachers.find((t) => t.id === teacher.value);
                      return (
                        <React.Fragment key={teacher.value}>
                          {isTeacher ? <BioModal user={isTeacher} /> : teacher.label}
                          {index < array.length - 1 ? ', ' : ''}
                        </React.Fragment>
                      );
                    })
                  }</span>
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
            </div>
          ))}
        </div>
      ))}

      {!isEdit && <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
        <Icon icon="map" className="w-5 h-5 mt-1 align-middle" />
        <button
          onClick={() => openGoogleMaps(event.address.place_id, event.address.label)}
          className="text-blue-500 underline text-right"
        >
          {event.address.label}
        </button>
      </div>
      }
      {isEdit &&
        !isWhiteSpace(event.description) && (
          <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
            <Icon icon="description" className="w-5 h-5 mt-1align-middle" />
            <p>{event.description}</p>
          </div>
        )}

      {event.price.length > 0 && (
        <div className="grid grid-cols-[auto,1fr] gap-2 mb-2">
          <span className="text-lg align-middle">&#8362;</span>
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
              className="mb-2"
            >
              {link.title}
            </Button>
          ))}
      </div>
    </Card>
  );
});

const getType = (type: string) => {
  return eventTypes.find((et) => et.value === type)?.label;
};
const getTag = (tag: string) => {
  return tagOptions.find((t) => t.value === tag)?.label;
};
const isWhiteSpace = (str: string) => {
  return str.trim().length === 0;
};
export const groupAndSortSubEvents = (subEvents: IEventiPart[]) => {
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
