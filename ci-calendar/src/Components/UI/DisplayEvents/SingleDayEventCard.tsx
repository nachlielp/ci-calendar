import { Card, Tag, Button } from "antd";
import { FaMapMarkedAlt } from "react-icons/fa";
import { CiCalendarDate } from "react-icons/ci";
import { MdOutlineDescription } from "react-icons/md";
import { tagOptions, eventTypes } from "../../../util/options";
import dayjs from "dayjs";
import React from "react";
import DeleteEvent from "../Other/DeleteEvent";
import EditEvent from "../Other/EditEvent";
import { EventlyType, IEvently } from "../../../util/interfaces";
import { VscDebugBreakpointLog } from "react-icons/vsc";
import { useTeacherBio } from "../../../hooks/useTeacherBio";
import BioModal from "../DisplayUsers/BioModal";
import RecycleEvent from "../Other/RecycleEvent";
import HideEvent from "../Other/HideEvent";

interface ISingleDayEventCardProps {
  event: IEvently;
  cardWidth: number;
  screenWidth: number;
  isEdit: boolean;
}
export const SingleDayEventCard = React.forwardRef<
  HTMLDivElement,
  ISingleDayEventCardProps
>(({ event, cardWidth, screenWidth, isEdit }, ref) => {

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
  const subEventLen = Object.values(event.subEvents).length;
  const teachersIds = getEventTeachersIds(event);
  const { teachers } = useTeacherBio({ ids: teachersIds });

  const footer = isEdit
    ? [
      <DeleteEvent eventId={event.id} />,
      <EditEvent eventId={event.id} isMultiDay={false} />,
      <RecycleEvent eventId={event.id} isMultiDay={false} />,
      <HideEvent eventId={event.id} hide={event.hide} />
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
            {getTypes(
              Object.values(event.subEvents).flatMap(
                (subEvent) => subEvent.type as EventlyType
              )
            ).map((type, index) => (
              <Tag color="blue" key={`${type}-${index}`}>
                {type}
              </Tag>
            ))}
          </span>
        </span>
      }
      style={{ width: cardWidth }}
      actions={footer}
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
      {subEventLen > 0 &&
        Object.values(event.subEvents).map((subEvent, index) => (
          <span className="block mr-6" key={index}>
            <VscDebugBreakpointLog className="inline-block mb-1" />
            {dayjs(subEvent.endTime).format("HH:mm")}&nbsp;-&nbsp;
            {dayjs(subEvent.startTime).format("HH:mm")}&nbsp;
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
        ))}
      <p className="flex items-center">
        <FaMapMarkedAlt className="ml-2" />
        {/* <a href={`https://www.google.com/maps/place/?q=place_id:${event.address.place_id}`} target="_blank" rel="noopener noreferrer">{event.address.label}</a> */}
        {/* <a href={getMapsLink(event.address.place_id)} target="_blank" rel="noopener noreferrer">
          {event.address.label}
        </a> */}
        <button onClick={() => openGoogleMaps(event.address.place_id, event.address.label)}>{event.address.label}</button>
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

const getTypes = (t1: EventlyType[], t2?: EventlyType[]) => {
  let types = Array.from(new Set([...t1, ...(t2 || [])]));
  t2?.forEach((element) => {
    if (!types.includes(element)) {
      types.push(element);
    }
  });
  return (
    types
      .filter((type) => !!type)
      .map((type) => eventTypes.find((et) => et.value === type)?.label) || []
  );
};
const getType = (type: EventlyType) => {
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

export const getEventTeachersIds = (event: IEvently) => {
  return event.subEvents.flatMap((subEvent) => subEvent.teachers).map((teacher) => teacher.value).filter((teacher) => teacher !== "NON_EXISTENT");
};

