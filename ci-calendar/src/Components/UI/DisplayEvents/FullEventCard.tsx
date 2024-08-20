import { Button, Tag } from "antd";
import { EventlyType, IEvently } from "../../../util/interfaces";
import { Icon } from "../Other/Icon";
import {
  formatHebrewDate,
  getEventTeachersIds,
  getTag,
  getType,
  getTypes,
} from "./SingleDayEventCard";
import dayjs from "dayjs";
import React from "react";
import { useGetTeachers } from "../../../hooks/useGetTeachers";
import BioModal from "../DisplayUsers/BioModal";
import EditEvent from "../Other/EditEvent";
import RecycleEvent from "../Other/RecycleEvent";
import DeleteEvent from "../Other/DeleteEvent";
import HideEvent from "../Other/HideEvent";

export default function FullEventCard({
  event,
  isManageTable,
}: {
  event: IEvently;
  isManageTable?: boolean;
}) {
  const subEventLen = Object.values(event.subEvents).length;
  const teachersIds = getEventTeachersIds(event);
  const { teachers } = useGetTeachers({ ids: teachersIds });
  // const nonRegestoredTeacherNames = Array.from(
  //   new Set(
  //     Object.values(event.subEvents)
  //       .flatMap((subEvent) => subEvent.teachers)
  //       .filter((teacher) => teacher.value === "NON_EXISTENT")
  //       .map((teacher) => teacher.label)
  //   )
  // );
  // const regestoredTeacherOptions = Array.from(
  //   new Map(
  //     Object.values(event.subEvents)
  //       .flatMap((subEvent) => subEvent.teachers)
  //       .filter((teacher) => teacher.value !== "NON_EXISTENT")
  //       .map((teacher) => [teacher.value, teacher]) // Use teacher.value as the key
  //   ).values()
  // );

  // const teachersBioOrName = regestoredTeacherOptions.map((teacher) => {
  //   const isTeacher = teachers.find((t) => t.id === teacher.value);
  //   return isTeacher ? (
  //     <BioModal key={teacher.value} teacher={isTeacher} />
  //   ) : (
  //     teacher.label
  //   );
  // });

  const isMultiDay = event.dates["startDate"] !== event.dates["endDate"];

  return (
    <section className="full-single-day-event-card" dir="rtl">
      <article className="event-header">
        <div className="event-title">{event.title}&nbsp;</div>
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
      <article className="event-location">
        <Icon icon="pinDrop" className="event-icon" />
        <label className="event-label">{event.address.label}</label>
      </article>

      {/* {subEventLen > 0 &&
                <article className="event-teachers">
                    <Icon icon="person" className="event-icon" />
                    <label className="event-label">
                        עם {subEventLen > 1 && [...teachersBioOrName, ...nonRegestoredTeacherNames].map((item, index, array) => (
                            <React.Fragment key={index}>
                                {item}
                                {index < array.length - 1 && ', '}
                            </React.Fragment>
                        ))}
                    </label>
                </article>
            } */}

      {subEventLen > 0 &&
        Object.values(event.subEvents).map((subEvent, index) => (
          <div className="sub-event" key={index}>
            {/* <Icon icon="hov" className="sub-event-icon" /> */}
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

      <article className="event-links">
        {event.links.length > 0 &&
          event.links.map((link) => (
            <Button
              key={link.title}
              type="default"
              href={link.link}
              target="_blank"
              className="link-button"
            >
              <label className="link-label">{link.title}</label>
              <Icon icon="openInNew" className="link-icon" />
            </Button>
          ))}
      </article>

      {event.description.length > 0 && (
        <>
          <hr className="hr" />
          <h3 className="section-title">פרטים נוספים</h3>
          <article className="event-description">
            <label className="event-label">{event.description}</label>
          </article>
        </>
      )}

      {event.price.length > 0 && (
        <>
          <hr className="hr" />
          <h3 className="section-title">מחיר</h3>
          <article className="event-price">
            {event.price.map((price, index) => (
              <label key={`${price.title}-${index}`}>
                {price.title} - {price.sum}&#8362;
              </label>
            ))}
          </article>
        </>
      )}
      {isManageTable && (
        <div className="event-card-footer">
          <EditEvent eventId={event.id} isMultiDay={isMultiDay} />
          <RecycleEvent eventId={event.id} isMultiDay={isMultiDay} />
          <DeleteEvent eventId={event.id} />
          <HideEvent eventId={event.id} hide={event.hide} />
        </div>
      )}
    </section>
  );
}
