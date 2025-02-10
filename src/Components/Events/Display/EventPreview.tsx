import React from "react"
import Tag from "antd/es/tag"
import dayjs from "dayjs"
import { EventlyType, CIEvent, Language } from "../../../util/interfaces"
import {
    tagOptions,
    eventOptions,
    shortHebrewDays,
    shortEnglishDays,
} from "../../../util/options"
import { Icon } from "../../Common/Icon"
import { utilService } from "../../../util/utilService"
import "../../../styles/event-preview.scss"
import "../../../styles/generics/card.scss"
import Spin from "antd/es/spin"
import { store } from "../../../Store/store"
import { observer } from "mobx-react-lite"
import {
    getTranslation,
    isTranslationKey,
    translations,
} from "../../../util/translations"
import { getMonthName } from "../../../util/translate"
import domain from "../../../assets/svgs/domain.svg"
import calendar from "../../../assets/svgs/calendar.svg"
import schedule from "../../../assets/svgs/schedule.svg"
import pin_drop from "../../../assets/svgs/pin_drop.svg"
import person from "../../../assets/svgs/person.svg"
interface EventPreviewProps {
    event: CIEvent
    isClicked: boolean
}

const EventPreview = React.forwardRef<HTMLDivElement, EventPreviewProps>(
    ({ event, isClicked }, ref) => {
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

        const isRTL = store.getLanguage === Language.he

        return (
            <section
                ref={ref}
                className={`event-preview card ${isRTL ? "rtl" : ""}`}
            >
                {event.cancelled && (
                    <article className="cancelled-event-cover">
                        <h1 className="cancelled-event-title">
                            {getTranslation(
                                "eventCancelled",
                                store.getLanguage
                            )}
                        </h1>
                        <h2 className="cancelled-event-text">
                            {event.cancelled_text}
                        </h2>
                    </article>
                )}
                {isClicked && store.isLoading && (
                    <article className="loading-event-cover">
                        <Spin size="large" />
                    </article>
                )}
                <section
                    className={`event-preview-content ${
                        event.cancelled && "cancelled"
                    }`}
                >
                    <article className="event-header">
                        <h2 className="event-title">
                            {utilService.getTitleByLanguage(
                                event,
                                store.getLanguage
                            )}
                        </h2>
                    </article>
                    {orgs.length > 0 && (
                        <article className="event-org">
                            <Icon icon={domain} className="event-icon" />
                            <label
                                className="event-label  "
                                data-translation-context="name"
                            >
                                {orgs.join(", ")}
                            </label>
                        </article>
                    )}
                    <article className="event-dates">
                        {event.segments.length > 0 ? (
                            <>
                                <Icon icon={calendar} className="event-icon" />
                                <label className="event-label">
                                    {getTranslation(
                                        shortEnglishDays[
                                            dayjs(event.start_date).day()
                                        ],
                                        store.getLanguage
                                    )}
                                    {", "}
                                    {getMonthName(
                                        dayjs(event.start_date),
                                        store.getLanguage
                                    )}
                                </label>
                                <Icon icon={schedule} className="event-icon" />
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
                                <Icon icon={calendar} className="event-icon" />
                                <label className="event-label ">
                                    {
                                        shortHebrewDays[
                                            dayjs(event.start_date).day()
                                        ]
                                    }
                                    {", "}
                                    {utilService.formatHebrewDate(
                                        event.start_date
                                    )}
                                    {" - "}
                                    {
                                        shortHebrewDays[
                                            dayjs(event.end_date).day()
                                        ]
                                    }
                                    {", "}
                                    {utilService.formatHebrewDate(
                                        event.end_date
                                    )}
                                </label>
                            </>
                        )}
                    </article>

                    <article className="event-location">
                        <Icon icon={pin_drop} className="event-icon" />
                        <label className="event-label ">
                            {store.getLanguage === Language.he
                                ? event.address.label
                                : event.address.en_label || event.address.label}
                        </label>
                    </article>

                    {(teachers.length > 0 ||
                        singleDayTeacherNames.length > 0) && (
                        <article className="event-teachers">
                            <Icon icon={person} className="event-icon" />
                            <label className="event-label ">
                                {getTranslation("with", store.getLanguage)}
                                &nbsp;
                                {teachers.map((item, index, array) => (
                                    <React.Fragment key={index}>
                                        <label data-translation-context="name">
                                            {item}
                                        </label>
                                        {index < array.length - 1 && ", "}
                                    </React.Fragment>
                                ))}
                            </label>
                        </article>
                    )}

                    <article className="event-tags">
                        {Object.values(event.segments)
                            .flatMap((segment) => {
                                return segment.type as EventlyType
                            })
                            .filter((type): type is EventlyType => !!type)
                            .concat(event.type as EventlyType)
                            .map((type, index) => {
                                if (!type) {
                                    return null
                                }
                                return (
                                    <Tag
                                        color="blue"
                                        key={`${type}-${index}`}
                                        className="event-tag"
                                    >
                                        {isTranslationKey(type)
                                            ? translations[store.getLanguage][
                                                  type
                                              ]
                                            : type}
                                    </Tag>
                                )
                            })}
                    </article>
                </section>
            </section>
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

export default observer(EventPreview)
