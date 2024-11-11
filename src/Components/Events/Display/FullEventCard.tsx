import Tag from "antd/es/tag"
import { EventlyType, CIEvent } from "../../../util/interfaces"
import { Icon } from "../../Common/Icon"
import { getTag, getType, getTypes } from "./EventPreview"
import dayjs from "dayjs"
import React from "react"
import { utilService } from "../../../util/utilService"
import SecondaryButton from "../../Common/SecondaryButton"
import BioModal from "../../Users/BioModal"
import CIEventNotificationModal from "../../Notifications/CIEventNotificationModal"
// import CIEventNotificationModal from "../Other/CIEventNotificationModal"

export default function FullEventCard({
    event: ci_event,
    showPast,
}: {
    event: CIEvent
    showPast?: boolean
}) {
    const segmentLen = ci_event.segments.length
    const multiDayTeachersLen = ci_event.multi_day_teachers || []
    const handleCopy = async () => {
        await navigator.clipboard.writeText(
            `${window.location.origin}/${ci_event.id}`
        )
    }

    return (
        <section className="full-event-card" dir="rtl">
            <article className="event-header">
                <div className="event-title">{ci_event.title}&nbsp;</div>
            </article>
            {ci_event.organisations.length > 0 && (
                <article className="event-org">
                    <Icon icon="domain" className="event-icon" />
                    <label className="event-label">
                        {ci_event.organisations.map(
                            (orgOption, index, array) => {
                                const orgId = orgOption.value

                                const org = ci_event.users?.find(
                                    (u) => u.user_id === orgId
                                )

                                return (
                                    <React.Fragment key={orgOption.value}>
                                        {org ? (
                                            <BioModal teacher={org} />
                                        ) : (
                                            orgOption.label
                                        )}
                                        {index < array.length - 1 ? ", " : ""}
                                    </React.Fragment>
                                )
                            }
                        )}
                    </label>
                </article>
            )}
            <article className="event-dates">
                {ci_event.segments.length > 0 ? (
                    <>
                        <Icon icon="calendar" className="event-icon" />
                        <label className="event-label">
                            {utilService.formatHebrewDate(ci_event.start_date)}
                        </label>
                        <Icon icon="schedule" className="event-icon" />
                        <label className="event-label">
                            {dayjs(ci_event.segments[0].startTime).format(
                                "HH:mm"
                            )}
                            &nbsp;-&nbsp;
                            {dayjs(
                                ci_event.segments[segmentLen - 1].endTime
                            ).format("HH:mm")}
                        </label>
                    </>
                ) : (
                    <>
                        <Icon icon="calendar" className="event-icon" />
                        <label className="event-label">
                            {utilService.formatHebrewDate(ci_event.start_date)}{" "}
                            - {utilService.formatHebrewDate(ci_event.end_date)}
                        </label>
                    </>
                )}
            </article>
            <article className="event-location">
                <Icon icon="pinDrop" className="event-icon" />
                <label className="event-label">{ci_event.address.label}</label>
            </article>

            {multiDayTeachersLen.length > 0 && (
                <article className="event-multi-day-teachers">
                    <Icon icon="person" className="event-icon" />
                    <label className="event-labels">
                        {multiDayTeachersLen.map((teacher, index, array) => {
                            const isTeacher = ci_event.users?.find(
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
                ci_event.segments.map((segment, index) => (
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
                                                ci_event.users?.find(
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
                                        <Tag
                                            key={tag}
                                            color="green"
                                            className="f-18"
                                        >
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
                    ci_event.segments
                        .flatMap((segment) => segment.type as EventlyType)
                        .concat(ci_event.type as EventlyType)
                ).map((type, index) => (
                    <Tag
                        color="blue"
                        key={`${type}-${index}`}
                        className="event-tag "
                    >
                        {type}
                    </Tag>
                ))}
            </article>

            <article className="event-links">
                {ci_event.links.length > 0 &&
                    ci_event.links.map((link) => (
                        <a
                            key={link.title}
                            href={link.link}
                            target="_blank"
                            className="link-button"
                        >
                            <label className="link-label">{link.title}</label>
                            <Icon icon="openInNew" className="link-icon" />
                        </a>
                    ))}
            </article>

            {ci_event.description.length > 0 && (
                <>
                    <hr className="hr" />
                    <h3 className="section-title">פרטים נוספים</h3>
                    <article className="event-description">
                        <label className="event-label">
                            {ci_event.description}
                        </label>
                    </article>
                </>
            )}

            {ci_event.price.length > 0 && (
                <>
                    <hr className="hr" />
                    <h3 className="section-title">מחיר</h3>
                    <article className="event-price f-18">
                        {ci_event.price.map((price, index) => (
                            <React.Fragment key={`${price.sum}-${index}`}>
                                <label className="price-label">
                                    <span className="price-title">
                                        {price.title}
                                    </span>
                                    :&nbsp;
                                    <span className="price-sum">
                                        {price.sum}
                                    </span>
                                    ₪
                                </label>
                                {index < ci_event.price.length - 1 && ", "}
                            </React.Fragment>
                        ))}
                    </article>
                </>
            )}

            {!showPast && (
                <article className="event-card-footer">
                    {utilService.isPWA() && (
                        <CIEventNotificationModal eventId={ci_event.id} />
                    )}
                    {utilService.isPWA() && (
                        <SecondaryButton
                            label=""
                            successLabel=""
                            icon={"map"}
                            successIcon={"map"}
                            callback={() =>
                                utilService.openGoogleMaps(
                                    ci_event.address.place_id,
                                    ci_event.address.label
                                )
                            }
                        />
                    )}
                    {utilService.isPWA() && (
                        <SecondaryButton
                            label=""
                            successLabel=""
                            icon={utilService.isIos() ? "ios_share" : "share"}
                            successIcon={
                                utilService.isIos() ? "ios_share" : "share"
                            }
                            callback={() =>
                                utilService.handleShareEvent(
                                    ci_event.id,
                                    ci_event.title
                                )
                            }
                        />
                    )}
                    {!utilService.isPWA() && (
                        <SecondaryButton
                            label="העתקת קישור"
                            successLabel="קישור הועתק"
                            icon="contentCopy"
                            successIcon="check"
                            callback={handleCopy}
                        />
                    )}
                </article>
            )}
        </section>
    )
}
