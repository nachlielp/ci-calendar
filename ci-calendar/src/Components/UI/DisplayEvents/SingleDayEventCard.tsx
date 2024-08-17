import React from "react";
import { Card, Tag, Button } from "antd";
import dayjs from "dayjs";
import DeleteEvent from "../Other/DeleteEvent";
import EditEvent from "../Other/EditEvent";
import RecycleEvent from "../Other/RecycleEvent";
import HideEvent from "../Other/HideEvent";
import BioModal from "../DisplayUsers/BioModal";
import { useGetTeachers } from "../../../hooks/useGetTeachers";
import { EventlyType, IEvently } from "../../../util/interfaces";
import {
  tagOptions,
  eventTypes,
  hebrewMonths,
  SelectOption,
} from "../../../util/options";
import { Icon } from "../Other/Icon";
// import expand from "../../../assets/expand.svg";
interface ISingleDayEventCardProps {
  event: IEvently;
  isEdit: boolean;
}

export const SingleDayEventCard = React.forwardRef<
  HTMLDivElement,
  ISingleDayEventCardProps
>(({ event, isEdit }, ref) => {
  // const openGoogleMaps = (placeId: string, address: string) => {
  //   const iosUrl = `comgooglemaps://?q=${encodeURIComponent(address)}`;
  //   const androidUrl = `geo:0,0?q=${encodeURIComponent(address)}`;
  //   const fallbackUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;

  //   if (/(iPhone|iPad|iPod)/.test(navigator.userAgent)) {
  //     setTimeout(() => {
  //       window.location.href = fallbackUrl;
  //     }, 25);
  //     window.open(iosUrl, '_blank');
  //   } else if (/Android/.test(navigator.userAgent)) {
  //     setTimeout(() => {
  //       window.location.href = fallbackUrl;
  //     }, 25);
  //     window.open(androidUrl, '_blank');
  //   } else {
  //     window.open(fallbackUrl, '_blank');
  //   }
  // };

  const subEventLen = Object.values(event.subEvents).length;
  const teachersIds = getEventTeachersIds(event);
  const { teachers } = useGetTeachers({ ids: teachersIds });
  const nonRegestoredTeacherNames = Array.from(
    new Set(
      Object.values(event.subEvents)
        .flatMap((subEvent) => subEvent.teachers)
        .filter((teacher) => teacher.value === "NON_EXISTENT")
        .map((teacher) => teacher.label)
    )
  );

  const regestoredTeacherOptions = Array.from(
    new Map(
      Object.values(event.subEvents)
        .flatMap((subEvent) => subEvent.teachers)
        .filter((teacher) => teacher.value !== "NON_EXISTENT")
        .map((teacher) => [teacher.value, teacher]) // Use teacher.value as the key
    ).values()
  );

  const teachersBioOrName = regestoredTeacherOptions.map((teacher) => {
    const isTeacher = teachers.find((t) => t.id === teacher.value);
    return isTeacher ? (
      <BioModal key={teacher.value} teacher={isTeacher} />
    ) : (
      teacher.label
    );
  });

  const isMultiDay = event.dates["startDate"] !== event.dates["endDate"];

  const footer = isEdit
    ? [
        <DeleteEvent eventId={event.id} />,
        <EditEvent eventId={event.id} isMultiDay={isMultiDay} />,
        <RecycleEvent eventId={event.id} isMultiDay={isMultiDay} />,
        <HideEvent eventId={event.id} hide={event.hide} />,
      ]
    : [];

  return (
    <Card
      ref={ref}
      className="single-day-event-card"
      style={{ width: "100%" }}
      actions={footer}
    >
      <article className="event-header">
        {isEdit ? (
          <div className="event-title">{event.title}&nbsp;</div>
        ) : (
          <h2 className="event-title">{event.title}&nbsp;</h2>
        )}
      </article>
      <article className="event-dates">
        {event.subEvents.length > 0 ? (
          <>
            <Icon icon="calendar" className="event-icon" />
            <label className="event-label">
              {formatHebrewDate(event.subEvents[0]?.startTime)}
            </label>
            <Icon icon="schedule" className="event-icon" />
            <label className="event-label">
              {dayjs(event.subEvents[0].startTime).format("HH:mm")}&nbsp;-&nbsp;
              {dayjs(event.subEvents[subEventLen - 1].endTime).format("HH:mm")}
            </label>
          </>
        ) : (
          <>
            <Icon icon="calendar" className="event-icon" />
            <label className="event-label">
              {formatHebrewDate(event.dates["startDate"])} -{" "}
              {formatHebrewDate(event.dates["endDate"])}
            </label>
          </>
        )}
      </article>
      {isEdit &&
        subEventLen > 0 &&
        Object.values(event.subEvents).map((subEvent, index) => (
          <div className="sub-event" key={index}>
            <Icon icon="hov" className="sub-event-icon" />
            <span>
              {dayjs(subEvent.endTime).format("HH:mm")}&nbsp;-&nbsp;
              {dayjs(subEvent.startTime).format("HH:mm")}&nbsp;
              {getType(subEvent.type as EventlyType)}
              {subEvent.teachers.length > 0 && (
                <span>
                  &nbsp;עם{" "}
                  {subEvent.teachers.map((teacher, index, array) => {
                    const isTeacher = teachers.find(
                      (t) => t.id === teacher.value
                    );
                    return (
                      <React.Fragment key={teacher.value}>
                        {isTeacher ? (
                          <BioModal teacher={isTeacher} />
                        ) : (
                          teacher.label
                        )}
                        {index < array.length - 1 ? ", " : ""}
                      </React.Fragment>
                    );
                  })}
                </span>
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

      <article className="event-location">
        <Icon icon="pinDrop" className="event-icon" />
        <label className="event-label">{event.address.label}</label>
        {/* <button
          onClick={() => openGoogleMaps(event.address.place_id, event.address.label)}
          className="event-location-button"
        >
          {event.address.label}
        </button> */}
      </article>

      {!isEdit && subEventLen > 0 && (
        <article className="event-teachers">
          <Icon icon="person" className="event-icon" />
          <label className="event-label">
            עם{" "}
            {subEventLen > 1 &&
              [...teachersBioOrName, ...nonRegestoredTeacherNames].map(
                (item, index, array) => (
                  <React.Fragment key={index}>
                    {item}
                    {index < array.length - 1 && ", "}
                  </React.Fragment>
                )
              )}
          </label>
        </article>
      )}

      {isEdit && !isWhiteSpace(event.description) && (
        <div className="event-description">
          <Icon icon="description" className="event-description-icon" />
          <p>{event.description}</p>
        </div>
      )}

      {/* {event.price.length > 0 && (
        <div className="event-price">
          <span className="event-price-currency">&#8362;</span>
          <ul>
            {event.price.map((price, index) => (
              <li key={`${price.title}-${index}`}>
                {price.title} - {price.sum}
              </li>
            ))}
          </ul>
        </div>
      )} */}

      <article className="event-tags">
        {getTypes(
          Object.values(event.subEvents).flatMap(
            (subEvent) => subEvent.type as EventlyType
          )
        ).map((type, index) => (
          <Tag color="blue" key={`${type}-${index}`} className="event-tag">
            {type}
          </Tag>
        ))}
      </article>

      {isEdit && (
        <div style={{ marginTop: 16 }}>
          {event.links.length > 0 &&
            event.links.map((link) => (
              <Button
                key={link.title}
                type="default"
                href={link.link}
                target="_blank"
                className="event-link-button"
              >
                <Icon
                  icon="openInNew"
                  className="event-link-icon"
                  title={link.title}
                />
              </Button>
            ))}
        </div>
      )}
    </Card>
  );
});

export const getTypes = (t1: EventlyType[], t2?: EventlyType[]) => {
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
export const getType = (type: EventlyType) => {
  return eventTypes.find((et) => et.value === type)?.label;
};
export const getTag = (tag: string) => {
  return tagOptions.find((t) => t.value === tag)?.label;
};
export const isWhiteSpace = (str: string) => {
  return str.trim().length === 0;
};
export const getEventTeachersIds = (event: IEvently) => {
  return event.subEvents
    .flatMap((subEvent) => subEvent.teachers)
    .map((teacher) => teacher.value)
    .filter((teacher) => teacher !== "NON_EXISTENT");
};

export const formatHebrewDate = (date: string) => {
  const day = dayjs(date).locale("he").format("D");
  const month = dayjs(date).locale("he").format("MM");
  const hebrewMonth = hebrewMonths.find(
    (m: SelectOption) => m.value === month
  )?.label;
  return `${hebrewDay(date)} ${day} ב${hebrewMonth}`;
};

export const hebrewDay = (date: string) => {
  switch (dayjs(date).locale("he").format("dd")) {
    case "Su":
      return "יום ראשון";
    case "Mo":
      return "יום שני";
    case "Tu":
      return "יום שלישי";
    case "We":
      return "יום רביעי";
    case "Th":
      return "יום חמישי";
    case "Fr":
      return "יום שישי";
    case "Sa":
      return "יום שבת";
    default:
      return "";
  }
};
