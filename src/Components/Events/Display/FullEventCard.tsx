import Tag from "antd/es/tag"
import { EventlyType, CIEvent } from "../../../util/interfaces"
import { getTag, getType, getTypes } from "./EventPreview"
import dayjs from "dayjs"
import { utilService } from "../../../util/utilService"
import BioModal from "../../Users/BioModal"
import CIEventNotificationModal from "../../Notifications/CIEventNotificationModal"
import { Icon } from "../../Common/Icon"
import SecondaryButton from "../../Common/SecondaryButton"
import { store } from "../../../Store/store"
import { useIsMobile } from "../../../hooks/useIsMobile"
import "../../../styles/full-event-card.css"
import InstallPWABanner from "../../Common/InstallPWABanner"
import { appHeaderVM as vm } from "../../Layout/AppHeaderVM"
import React, { Component } from "react"
import { observer } from "mobx-react-lite"
import { shortHebrewDays } from "../../../util/options"

class EventErrorBoundary extends Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can log the error to an error reporting service here
        console.error("Event rendering error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <section className="full-event-card" dir="rtl">
                    <article className="event-header">
                        <div className="event-title">שגיאה בטעינת האירוע</div>
                    </article>
                </section>
            )
        }

        return this.props.children
    }
}

const FullEventCard = ({ event: ci_event }: { event: CIEvent }) => {
    const isMobile = useIsMobile()
    const segmentLen = ci_event.segments.length
    const multiDayTeachersLen = ci_event.multi_day_teachers || []
    const handleCopy = async () => {
        await navigator.clipboard.writeText(
            `${window.location.origin}/event/${ci_event.id}`
        )
    }

    return (
        <EventErrorBoundary>
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

                                    const org = store.getAppPublicBios?.find(
                                        (u) => u.user_id === orgId
                                    )

                                    return (
                                        <React.Fragment key={orgOption.value}>
                                            {org ? (
                                                <BioModal teacher={org} />
                                            ) : (
                                                orgOption.label
                                            )}
                                            {index < array.length - 1
                                                ? ", "
                                                : ""}
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
                                {
                                    shortHebrewDays[
                                        dayjs(ci_event.start_date).day()
                                    ]
                                }
                                {", "}
                                {utilService.formatHebrewDate(
                                    ci_event.start_date
                                )}
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
                                {
                                    shortHebrewDays[
                                        dayjs(ci_event.start_date).day()
                                    ]
                                }
                                {", "}
                                {utilService.formatHebrewDate(
                                    ci_event.start_date
                                )}
                                {" - "}
                                {
                                    shortHebrewDays[
                                        dayjs(ci_event.end_date).day()
                                    ]
                                }
                                {", "}
                                {utilService.formatHebrewDate(
                                    ci_event.end_date
                                )}
                            </label>
                        </>
                    )}
                </article>
                <article className="event-location">
                    <Icon icon="pinDrop" className="event-icon" />
                    <label className="event-label">
                        {ci_event.address.label}
                    </label>
                </article>

                {multiDayTeachersLen.length > 0 && (
                    <article className="event-multi-day-teachers">
                        <Icon icon="person" className="event-icon" />
                        <label className="event-labels">
                            {multiDayTeachersLen.map(
                                (teacher, index, array) => {
                                    const isTeacher =
                                        store.getAppPublicBios?.find(
                                            (t) => t.user_id === teacher.value
                                        )
                                    return (
                                        <React.Fragment key={teacher.value}>
                                            {isTeacher ? (
                                                <BioModal teacher={isTeacher} />
                                            ) : (
                                                <label className="teacher-name-label">
                                                    {teacher.label}
                                                </label>
                                            )}
                                            {index < array.length - 1
                                                ? ", "
                                                : ""}
                                        </React.Fragment>
                                    )
                                }
                            )}
                        </label>
                    </article>
                )}

                {segmentLen > 0 &&
                    ci_event.segments.map((segment, index) => (
                        <div className="sub-event" key={index}>
                            <span>
                                {dayjs(segment.startTime).format("HH:mm")}
                                &nbsp;-&nbsp;
                                {dayjs(segment.endTime).format("HH:mm")}
                                &nbsp;
                                {getType(segment.type as EventlyType)}
                                {segment.teachers.length > 0 && (
                                    <span>
                                        &nbsp;עם{" "}
                                        {segment.teachers.map(
                                            (teacher, index, array) => {
                                                const isTeacher =
                                                    store.getAppPublicBios?.find(
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
                                                                teacher={
                                                                    isTeacher
                                                                }
                                                            />
                                                        ) : (
                                                            <label className="teacher-name-label">
                                                                {teacher.label}
                                                            </label>
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
                                <label className="link-label">
                                    {link.title}
                                </label>
                                <Icon icon="openInNew" className="link-icon" />
                            </a>
                        ))}
                </article>

                {ci_event.description.length > 0 && (
                    <>
                        <hr className="hr" />
                        <h3 className="section-title">פרטים נוספים</h3>
                        <article className="event-description">
                            <label className="event-label ">
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

                {!utilService.isEventStarted(ci_event) && (
                    <article className="event-card-footer">
                        <div>
                            <button
                                onClick={() =>
                                    utilService.addToGoogleCalendar(ci_event)
                                }
                                className={`secondary-action-btn `}
                            >
                                <Icon icon="calendar_add_on" />
                            </button>
                        </div>
                        {isMobile && !utilService.isPWA() && (
                            <InstallPWABanner
                                anchorElement={
                                    <button
                                        onClick={() =>
                                            vm.setShowInstallPWAModal(true)
                                        }
                                        className={`secondary-action-btn `}
                                    >
                                        <Icon icon="notifications" />
                                    </button>
                                }
                            />
                        )}
                        {utilService.isPWA() && (
                            <CIEventNotificationModal
                                eventId={ci_event.id}
                                isMultiDay={ci_event.is_multi_day}
                            />
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
                                icon={
                                    utilService.isIos() ? "ios_share" : "share"
                                }
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
        </EventErrorBoundary>
    )
}

export default observer(FullEventCard)
