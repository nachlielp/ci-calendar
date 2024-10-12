import { Button, Tag } from "antd"
import { EventlyType, CIEvent, UserBio } from "../../../util/interfaces"
import { Icon } from "../Other/Icon"
import { getTag, getType, getTypes } from "./EventPreview"
import dayjs from "dayjs"
import BioModal from "../DisplayUsers/BioModal"
import React from "react"
import { utilService } from "../../../util/utilService"
export default function FullEventCard({
    event,
    viewableTeachers,
}: {
    event: CIEvent
    viewableTeachers: UserBio[]
}) {
    const segmentLen = event.segments.length
    const multiDayTeachersLen = event.multi_day_teachers || []
    return (
        <section className="full-event-card" dir="rtl">
            <article className="event-header">
                <div className="event-title">{event.title}&nbsp;</div>
            </article>
            <article className="event-dates">
                {event.segments.length > 0 ? (
                    <>
                        <Icon icon="calendar" className="event-icon" />
                        <label className="event-label">
                            {utilService.formatHebrewDate(event.start_date)}
                        </label>
                        <Icon icon="schedule" className="event-icon" />
                        <label className="event-label">
                            {dayjs(event.segments[0].startTime).format("HH:mm")}
                            &nbsp;-&nbsp;
                            {dayjs(
                                event.segments[segmentLen - 1].endTime
                            ).format("HH:mm")}
                        </label>
                    </>
                ) : (
                    <>
                        <Icon icon="calendar" className="event-icon" />
                        <label className="event-label">
                            {utilService.formatHebrewDate(event.start_date)} -{" "}
                            {utilService.formatHebrewDate(event.end_date)}
                        </label>
                    </>
                )}
            </article>
            <article className="event-location">
                <Icon icon="pinDrop" className="event-icon" />
                <label className="event-label">{event.address.label}</label>
            </article>

            {multiDayTeachersLen.length > 0 && (
                <article className="event-multi-day-teachers">
                    <Icon icon="person" className="event-icon" />
                    <label className="event-labels">
                        {multiDayTeachersLen.map((teacher, index, array) => {
                            const isTeacher = viewableTeachers?.find(
                                (t) => t.user_id === teacher.value
                            )
                            return (
                                <React.Fragment key={teacher.value}>
                                    {isTeacher ? (
                                        <BioModal teacher={isTeacher} />
                                    ) : (
                                        teacher.label
                                    )}
                                    {index < array.length - 1 ? ", " : ""}
                                </React.Fragment>
                            )
                        })}
                    </label>
                </article>
            )}

            {segmentLen > 0 &&
                event.segments.map((segment, index) => (
                    <div className="sub-event" key={index}>
                        <span>
                            {dayjs(segment.endTime).format("HH:mm")}
                            &nbsp;-&nbsp;
                            {dayjs(segment.startTime).format("HH:mm")}&nbsp;
                            {getType(segment.type as EventlyType)}
                            {segment.teachers.length > 0 && (
                                <span>
                                    &nbsp;עם{" "}
                                    {segment.teachers.map(
                                        (teacher, index, array) => {
                                            const isTeacher =
                                                viewableTeachers?.find(
                                                    (t) =>
                                                        t.user_id ===
                                                        teacher.value
                                                )
                                            return (
                                                <React.Fragment
                                                    key={teacher.value}
                                                >
                                                    {isTeacher ? (
                                                        <BioModal
                                                            teacher={isTeacher}
                                                        />
                                                    ) : (
                                                        teacher.label
                                                    )}
                                                    {index < array.length - 1
                                                        ? ", "
                                                        : ""}
                                                </React.Fragment>
                                            )
                                        }
                                    )}
                                </span>
                            )}
                            {segment.tags && (
                                <span>
                                    &nbsp;
                                    {segment.tags.map((tag) => (
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
                    event.segments
                        .flatMap((segment) => segment.type as EventlyType)
                        .concat(event.type as EventlyType)
                ).map((type, index) => (
                    <Tag
                        color="blue"
                        key={`${type}-${index}`}
                        className="event-tag"
                    >
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
                        <label className="event-label">
                            {event.description}
                        </label>
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
        </section>
    )
}
