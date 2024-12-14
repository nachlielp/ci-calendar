import React from "react"
import Card from "antd/es/card"
import Tag from "antd/es/tag"
import dayjs from "dayjs"
import { EventlyType, CIEvent } from "../../../util/interfaces"
import { tagOptions, eventOptions } from "../../../util/options"
import { Icon } from "../../Common/Icon"
import { utilService } from "../../../util/utilService"
import "../../../styles/event-preview.css"
interface EventPreviewProps {
    event: CIEvent
}

export const EventPreview = React.forwardRef<HTMLDivElement, EventPreviewProps>(
    ({ event }, ref) => {
        const segmentsLength = Object.values(event.segments).length

        const singleDayTeacherNames = Array.from(
            new Set(
                Object.values(event.segments)
                    .flatMap((segment) => segment.teachers)
                    .map((teacher) => {
                        const user = event.users?.find(
                            (user) => user.user_id === teacher.value
                        )
                        return user?.bio_name || teacher.label
                    })
            )
        )

        const multiDayTeacherNames = Array.from(
            new Set(
                Object.values(event.multi_day_teachers || {}).map((teacher) => {
                    const user = event.users?.find(
                        (user) => user.user_id === teacher.value
                    )
                    return user?.bio_name || teacher.label
                })
            )
        )

        const teachers = Array.from(
            new Set([...multiDayTeacherNames, ...singleDayTeacherNames])
        )

        const orgs = event.organisations.map((org) => {
            const publicOrg = event?.users?.find(
                (user) => user.user_id === org.value
            )
            return publicOrg?.bio_name || org.label
        })

        return (
            <Card
                ref={ref}
                className={`event-preview `}
                style={{ width: "100%" }}
            >
                {event.cancelled && (
                    <article className="cancelled-event-label">
                        האירוע בוטל
                    </article>
                )}
                <section
                    className={`event-preview-content ${
                        event.cancelled && "cancelled"
                    }`}
                >
                    <article className="event-header">
                        <h2 className="event-title">{event.title}&nbsp;</h2>
                    </article>
                    {orgs.length > 0 && (
                        <article className="event-org">
                            <Icon icon="domain" className="event-icon" />
                            <label className="event-label">
                                {orgs.join(", ")}
                            </label>
                        </article>
                    )}
                    <article className="event-dates">
                        {event.segments.length > 0 ? (
                            <>
                                <Icon icon="calendar" className="event-icon" />
                                <label className="event-label">
                                    {utilService.formatHebrewDate(
                                        event.start_date
                                    )}
                                </label>
                                <Icon icon="schedule" className="event-icon" />
                                <label className="event-label">
                                    {dayjs(event.segments[0].startTime).format(
                                        "HH:mm"
                                    )}
                                    &nbsp;-&nbsp;
                                    {dayjs(
                                        event.segments[segmentsLength - 1]
                                            .endTime
                                    ).format("HH:mm")}
                                </label>
                            </>
                        ) : (
                            <>
                                <Icon icon="calendar" className="event-icon" />
                                <label className="event-label">
                                    {utilService.formatHebrewDate(
                                        event.start_date
                                    )}{" "}
                                    -{" "}
                                    {utilService.formatHebrewDate(
                                        event.end_date
                                    )}
                                </label>
                            </>
                        )}
                    </article>

                    <article className="event-location">
                        <Icon icon="pinDrop" className="event-icon" />
                        <label className="event-label">
                            {event.address.label}
                        </label>
                    </article>

                    {(teachers.length > 0 ||
                        singleDayTeacherNames.length > 0) && (
                        <article className="event-teachers">
                            <Icon icon="person" className="event-icon" />
                            <label className="event-label">
                                עם{" "}
                                {teachers.map((item, index, array) => (
                                    <React.Fragment key={index}>
                                        {item}
                                        {index < array.length - 1 && ", "}
                                    </React.Fragment>
                                ))}
                            </label>
                        </article>
                    )}

                    <article className="event-tags">
                        {getTypes(
                            Object.values(event.segments)
                                .flatMap(
                                    (segment) => segment.type as EventlyType
                                )
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
                </section>
            </Card>
        )
    }
)

export const getTypes = (t1: EventlyType[], t2?: EventlyType[]) => {
    let types = Array.from(new Set([...t1, ...(t2 || [])]))
    t2?.forEach((element) => {
        if (!types.includes(element)) {
            types.push(element)
        }
    })
    return (
        types
            .filter((type) => !!type)
            .map(
                (type) => eventOptions.find((et) => et.value === type)?.label
            ) || []
    )
}
export const getType = (type: EventlyType) => {
    return eventOptions.find((et) => et.value === type)?.label
}
export const getTag = (tag: string) => {
    return tagOptions.find((t) => t.value === tag)?.label
}
export const isWhiteSpace = (str: string) => {
    return str.trim().length === 0
}
export const getEventTeachersIds = (event: CIEvent) => {
    return event.segments
        .flatMap((segment) => segment.teachers)
        .map((teacher) => teacher.value)
        .filter((teacher) => utilService.notAUserId(teacher))
}
