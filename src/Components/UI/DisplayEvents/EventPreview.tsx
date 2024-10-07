import React from "react"
import { Card, Tag, Button } from "antd"
import dayjs from "dayjs"
import DeleteEventButton from "../Other/DeleteEventButton"
import EditEvent from "../Other/EditEventButton"
import RecycleEvent from "../Other/RecycleEventButton"
import HideEventButton from "../Other/HideEventButton"
import BioModal from "../DisplayUsers/BioModal"
import { EventlyType, CIEvent, UserBio } from "../../../util/interfaces"
import { tagOptions, eventTypes } from "../../../util/options"
import { Icon } from "../Other/Icon"
import { utilService } from "../../../util/utilService"
interface EventPreviewProps {
    event: CIEvent
    isEdit: boolean
    viewableTeachers: UserBio[]
}

export const EventPreview = React.forwardRef<HTMLDivElement, EventPreviewProps>(
    ({ event, isEdit }, ref) => {
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

        const segmentsLength = Object.values(event.segments).length

        const nonRegestoredTeacherNames = Array.from(
            new Set(
                Object.values(event.segments)
                    .flatMap((segment) => segment.teachers)
                    .filter((teacher) => teacher.value === "NON_EXISTENT")
                    .map((teacher) => teacher.label)
            )
        )

        const regestoredTeacherOptions = Array.from(
            new Map(
                Object.values(event.segments)
                    .flatMap((segment) => segment.teachers)
                    .filter((teacher) => teacher.value !== "NON_EXISTENT")
                    .map((teacher) => [teacher.value, teacher]) // Use teacher.value as the key
            ).values()
        )

        const teachersBioOrName = regestoredTeacherOptions.map((teacher) => {
            return teacher.label
            // const isTeacher = viewableTeachers.find(
            //     (t) => t.user_id === teacher.value
            // )
            // return isTeacher ? (
            //     <BioModal key={teacher.value} teacher={isTeacher} />
            // ) : (
            //     teacher.label
            // )
        })

        const isMultiDay = event.startDate !== event.endDate

        const footer = isEdit
            ? [
                  <div className="event-card-footer">
                      <EditEvent eventId={event.id} isMultiDay={isMultiDay} />
                      <RecycleEvent
                          eventId={event.id}
                          isMultiDay={isMultiDay}
                      />
                      <DeleteEventButton eventId={event.id} />
                      <HideEventButton eventId={event.id} hide={event.hide} />
                  </div>,
              ]
            : []

        return (
            <Card
                ref={ref}
                className="single-day-event-card"
                style={{ width: "100%" }}
                actions={footer}
            >
                <article className="event-header">
                    <h2 className="event-title">{event.title}&nbsp;</h2>
                </article>
                <article className="event-dates">
                    {event.segments.length > 0 ? (
                        <>
                            <Icon icon="calendar" className="event-icon" />
                            <label className="event-label">
                                {utilService.formatHebrewDate(event.startDate)}
                            </label>
                            <Icon icon="schedule" className="event-icon" />
                            <label className="event-label">
                                {dayjs(event.segments[0].startTime).format(
                                    "HH:mm"
                                )}
                                &nbsp;-&nbsp;
                                {dayjs(
                                    event.segments[segmentsLength - 1].endTime
                                ).format("HH:mm")}
                            </label>
                        </>
                    ) : (
                        <>
                            <Icon icon="calendar" className="event-icon" />
                            <label className="event-label">
                                {utilService.formatHebrewDate(event.startDate)}{" "}
                                - {utilService.formatHebrewDate(event.endDate)}
                            </label>
                        </>
                    )}
                </article>
                {isEdit &&
                    segmentsLength > 0 &&
                    Object.values(event.segments).map((segment, index) => (
                        <div className="sub-event" key={index}>
                            {/* <Icon icon="hov" className="sub-event-icon" /> */}
                            <span>
                                {dayjs(segment.endTime).format("HH:mm")}
                                &nbsp;-&nbsp;
                                {dayjs(segment.startTime).format("HH:mm")}
                                &nbsp;
                                {getType(segment.type as EventlyType)}
                                {segment.teachers.length > 0 && (
                                    <span>
                                        &nbsp;עם
                                        {segment.teachers.map(
                                            (teacher, index, array) => {
                                                // const isTeacher = teachers.find(
                                                //     (t) => t.id === teacher.value
                                                // )
                                                const isTeacher = false
                                                return (
                                                    <React.Fragment
                                                        key={teacher.value}
                                                    >
                                                        {isTeacher ? (
                                                            <BioModal
                                                                teacher={
                                                                    isTeacher
                                                                }
                                                            />
                                                        ) : (
                                                            teacher.label
                                                        )}
                                                        {index <
                                                        array.length - 1
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

                {!isEdit &&
                    (teachersBioOrName.length > 0 ||
                        nonRegestoredTeacherNames.length > 0) && (
                        <article className="event-teachers">
                            <Icon icon="person" className="event-icon" />
                            <label className="event-label">
                                עם{" "}
                                {[
                                    ...teachersBioOrName,
                                    ...nonRegestoredTeacherNames,
                                ].map((item, index, array) => (
                                    <React.Fragment key={index}>
                                        {item}
                                        {index < array.length - 1 && ", "}
                                    </React.Fragment>
                                ))}
                            </label>
                        </article>
                    )}

                {isEdit && !isWhiteSpace(event.description) && (
                    <div className="event-description">
                        <Icon
                            icon="description"
                            className="event-description-icon"
                        />
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
                        Object.values(event.segments).flatMap(
                            (segment) => segment.type as EventlyType
                        )
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
            .map((type) => eventTypes.find((et) => et.value === type)?.label) ||
        []
    )
}
export const getType = (type: EventlyType) => {
    return eventTypes.find((et) => et.value === type)?.label
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
        .filter((teacher) => teacher !== "NON_EXISTENT")
}
