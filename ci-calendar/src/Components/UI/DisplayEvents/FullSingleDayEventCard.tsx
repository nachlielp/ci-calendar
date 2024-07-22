import { Button, Tag } from "antd";
import { EventlyType, IEvently } from "../../../util/interfaces";
import { Icon } from "../Other/Icon";
import { formatHebrewDate, getEventTeachersIds, getTypes } from "./SingleDayEventCard";
import dayjs from "dayjs";
import React from "react";
import { useGetTeachers } from "../../../hooks/useGetTeachers";
import BioModal from "../DisplayUsers/BioModal";

export default function FullSingleDayEventCard({ event }: { event: IEvently }) {
    const subEventLen = Object.values(event.subEvents).length;
    const teachersIds = getEventTeachersIds(event);
    const { teachers } = useGetTeachers({ ids: teachersIds });
    const nonRegestoredTeacherNames = Array.from(
        new Set(
            Object.values(event.subEvents)
                .flatMap(subEvent => subEvent.teachers)
                .filter(teacher => teacher.value === "NON_EXISTENT")
                .map(teacher => teacher.label)
        )
    );
    const regestoredTeacherOptions = Array.from(
        new Map(
            Object.values(event.subEvents)
                .flatMap(subEvent => subEvent.teachers)
                .filter(teacher => teacher.value !== "NON_EXISTENT")
                .map(teacher => [teacher.value, teacher]) // Use teacher.value as the key
        ).values()
    );

    const teachersBioOrName = regestoredTeacherOptions.map(teacher => {
        const isTeacher = teachers.find(t => t.id === teacher.value);
        return isTeacher ? <BioModal key={teacher.value} teacher={isTeacher} /> : teacher.label;
    });
    return (
        <section className="full-single-day-event-card" dir="rtl">
            <article className="event-header">
                <div className="event-title">{event.title}&nbsp;</div>
            </article>
            <article className="event-dates">
                <Icon icon="calendar" className="event-icon" />
                <label className="event-label">{formatHebrewDate(event.subEvents[0]?.startTime)}</label>
                <Icon icon="schedule" className="event-icon" />
                <label className="event-label">
                    {dayjs(event.subEvents[0].startTime).format("HH:mm")}&nbsp;-&nbsp;
                    {dayjs(event.subEvents[subEventLen - 1].endTime).format("HH:mm")}
                </label>
            </article>
            <article className="event-location">
                <Icon icon="pinDrop" className="event-icon" />
                <label className="event-label">
                    {event.address.label}
                </label>
            </article>

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

            <article className="event-tags">
                {getTypes(
                    Object.values(event.subEvents).flatMap((subEvent) => subEvent.type as EventlyType)
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

            <hr className="hr" />

            {event.description &&
                <>
                    <h3 className="section-title">פרטים נוספים</h3>
                    <article className="event-description">
                        <label className="event-label">{event.description}</label>
                    </article>
                </>
            }

            <hr className="hr" />

            {event.price &&
                <>
                    <h3 className="section-title">מחיר</h3>
                    <article className="event-price">
                        {event.price.map((price, index) => (
                            <label key={`${price.title}-${index}`}>
                                {price.title} - {price.sum}&#8362;
                            </label>
                        ))}
                    </article>
                </>
            }

        </section>
    )
}