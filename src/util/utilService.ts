import { v4 as uuidv4 } from "uuid"
import {
    CIEvent,
    CITemplate,
    DbUserWithoutJoin,
    RawAppConfigRecord,
    UserType,
    UserNotification,
    DBCIEvent,
    CIAlert,
    IAddress,
    UserBio,
} from "./interfaces"
import { User } from "@supabase/supabase-js"
import {
    districtOptions,
    eventOptions,
    hebrewMonths,
    SelectOption,
} from "./options"
import dayjs, { Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"
import customParseFormat from "dayjs/plugin/customParseFormat"
import weekOfYear from "dayjs/plugin/weekOfYear"
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(weekOfYear)
dayjs.tz.setDefault("Asia/Jerusalem")
import { store } from "../Store/store"
import { CACHE_VERSION } from "../App"

export const utilService = {
    createDbUserFromUser,
    deepCompare,
    formatHebrewDate,
    hebrewDay,
    multiDayTemplateToFormValues,
    singleDayTemplateToFormValues,
    CIEventToFormValues,
    reverseFormatTeachers,
    formatUsersForCIEvent,
    deepCompareArraysUnordered,
    getPWAInstallId,
    isPWA,
    isFirstNotificationPermissionRequest,
    setFirstNotificationPermissionRequest,
    getNotificationPermission,
    openGoogleMaps,
    isIos,
    handleShareEvent,
    copyToClipboard: copyURLToClipboard,
    getFilterItemType,
    getLabelByValue,
    saveFiltersToLocalStorage,
    getCIEventTeachers,
    notAUserId,
    getUniqueOwnersList,
    removeDuplicates,
    isSingleDayEventNotStarted,
    isNotificationNotStarted,
    sleep,
    formatConfig,
    isEventStarted,
    formatHebrewDateByStartTime,
    validateEventNotification,
    formatFormValuesToCreateCIEvent,
    formatFormValuesToCreateCITemplate,
    formatFormValuesToEditCIEvent,
    formatFormValuesToEditCITemplate,
    saveEventsToLocalStorage,
    getEventsFromLocalStorage,
    saveBiosToLocalStorage,
    getBiosFromLocalStorage,
    saveIsInternalToLocalStorage,
    getIsInternalFromLocalStorage,
    isUUID,
    getUserTypeByRoleId,
    formatFormValuesToDraftCIEvent,
    saveDraftEvent,
    getDraftEvent,
    clearDraftEvent,
    CIEventDraftToFormValues,
    calculateRecurringEventDates,
    duplicateEvent,
    addToGoogleCalendar,
}

function CIEventToFormValues(event: CIEvent) {
    const segments = event.segments.slice(1).map((segment) => ({
        "event-type": segment.type,
        "event-tags": segment.tags,
        teachers: reverseFormatTeachers(segment.teachers),
        "event-start-time": dayjs(segment.startTime),
        "event-end-time": dayjs(segment.endTime),
    }))
    const currentFormValues = {
        created_at: event.created_at,
        updated_at: dayjs().toISOString(),
        "event-title": event.title,
        "event-description": event.description,
        district: event.district,
        address: event.address,
        "event-dates": [dayjs(event.start_date), dayjs(event.end_date)],
        "event-start-date": dayjs(event.start_date),
        "event-end-date": dayjs(event.end_date),
        "main-event-type": event.type,
        "event-schedule": event.segments ? event.segments.length > 0 : false,
        links: event.links,
        prices: event.price,
        "event-type": event.segments[0]?.type,
        "event-tags": event.segments[0]?.tags,
        teachers: reverseFormatTeachers(event.segments[0]?.teachers),
        "first-segment-start-time": dayjs(event.segments[0]?.startTime),
        "first-segment-end-time": dayjs(event.segments[0]?.endTime),
        "multi-day-event-teachers": event.multi_day_teachers,
        segments: segments,
        "event-orgs": event.organisations?.map((org) => org.value),
    }
    return { currentFormValues, address: event.address }
}

function CIEventDraftToFormValues(
    event: Partial<CIEvent & { template_name?: string }>
) {
    // Safely handle segments
    const segments =
        event.segments?.slice(1)?.map((segment) => ({
            "event-type": segment.type || "",
            "event-tags": segment.tags || [],
            teachers: segment.teachers
                ? reverseFormatTeachers(segment.teachers)
                : [],
            "event-start-time": segment.startTime
                ? dayjs(segment.startTime)
                : null,
            "event-end-time": segment.endTime ? dayjs(segment.endTime) : null,
        })) || []

    // Create form values with null checks
    const currentFormValues = {
        "template-name": event.template_name || "",
        created_at: event.created_at || null,
        updated_at: dayjs().toISOString(),
        "event-title": event.title || "",
        "event-description": event.description || "",
        district: event.district || null,
        address: event.address || null,
        "event-dates": [
            event.start_date ? dayjs(event.start_date) : null,
            event.end_date ? dayjs(event.end_date) : null,
        ],
        "event-start-date": event.start_date ? dayjs(event.start_date) : null,
        "event-end-date": event.end_date ? dayjs(event.end_date) : null,
        "main-event-type": event.type || "",
        "event-schedule": event.segments ? event.segments.length > 0 : false,
        links: event.links || [],
        prices: event.price || [],

        // Handle first segment data safely
        "event-type": event.segments?.[0]?.type || "",
        "event-tags": event.segments?.[0]?.tags || [],
        teachers: event.segments?.[0]?.teachers
            ? reverseFormatTeachers(event.segments[0].teachers)
            : [],
        "first-segment-start-time": event.segments?.[0]?.startTime
            ? dayjs(event.segments[0].startTime)
            : null,
        "first-segment-end-time": event.segments?.[0]?.endTime
            ? dayjs(event.segments[0].endTime)
            : null,

        "multi-day-event-teachers": event.multi_day_teachers || [],
        segments: segments,
        "event-orgs": event.organisations?.map((org) => org.value) || [],
    }

    return {
        currentFormValues,
        address: event.address || null,
    }
}

function reverseFormatTeachers(teachers: { label: string; value: string }[]) {
    return teachers?.map((teacher) =>
        utilService.notAUserId(teacher.value) ? teacher.label : teacher.value
    )
}

function singleDayTemplateToFormValues(template: CITemplate) {
    const currentFormValues = {
        "template-name": template.name,
        "event-title": template.title,
        "event-description": template.description,
        address: template.address,
        district: template.district,
        "event-type": template.segments[0]?.type,
        "event-tags": template.segments[0]?.tags,
        teachers: reverseFormatTeachers(template.segments[0]?.teachers),
        "event-dates": dayjs.tz(
            dayjs(template.segments[0]?.startTime),
            "Asia/Jerusalem"
        ),
        "first-segment-start-time": dayjs(template.segments[0]?.startTime).tz(
            "Asia/Jerusalem"
        ),
        "first-segment-end-time": dayjs(template.segments[0]?.endTime).tz(
            "Asia/Jerusalem"
        ),
        segments: template.segments.slice(1).map((segment) => ({
            "event-type": segment.type,
            "event-tags": segment.tags,
            teachers: reverseFormatTeachers(segment.teachers),
            "event-start-time": dayjs(segment.startTime),
            "event-end-time": dayjs(segment.endTime),
        })),
        links: template.links.map((link) => ({
            title: link.title,
            link: link.link,
        })),
        prices: template.price.map((price) => ({
            title: price.title,
            sum: price.sum,
        })),
        "event-orgs": template.organisations?.map((org) => org.value),
    }
    return { currentFormValues, address: template.address }
}

function multiDayTemplateToFormValues(template: CITemplate) {
    const currentFormValues = {
        "event-start-date": template.segments[0]?.startTime,
        "event-end-date":
            template.segments[template.segments.length - 1]?.endTime,
        "template-name": template.name,
        "event-title": template.title,
        "event-description": template.description,
        address: template.address,
        district: template.district,
        "multi-day-event-teachers": template.multi_day_teachers?.map(
            (teacher) => teacher.value
        ),
        links: template.links.map((link) => ({
            title: link.title,
            link: link.link,
        })),
        prices: template.price.map((price) => ({
            title: price.title,
            sum: price.sum,
        })),
        "main-event-type": eventOptions.find(
            (type) => type.value === template.type
        )?.label,
    }
    return { currentFormValues, address: template.address }
}

function formatFormValuesToCreateCIEvent(
    values: any,
    address: IAddress,
    is_multi_day: boolean
): Omit<DBCIEvent, "id" | "cancelled_text" | "short_id"> {
    if (import.meta.env.VITE_HIDE_EVENTS_FLAG) {
        console.error("__HIDE EVENTS ON CREATION")
    }
    let segments: any[] = []
    if (!is_multi_day) {
        segments = [
            {
                startTime: dayjs(values["event-end-date"])
                    .hour(values["first-segment-start-time"].hour())
                    .minute(values["first-segment-start-time"].minute())
                    .toISOString(),
                endTime: dayjs(values["event-end-date"])
                    .hour(values["first-segment-end-time"].hour())
                    .minute(values["first-segment-end-time"].minute())
                    .toISOString(),
                type: values["event-type"] || "",
                tags: values["event-tags"] || [],
                teachers: formatUsersForCIEvent(values["teachers"]),
            },
        ]

        if (values["segments"]) {
            values["segments"].forEach((segment: any) => {
                const segmentDateString1 = segment["event-start-time"]
                const segmentDateString2 = segment["event-end-time"]

                segments.push({
                    type: segment["event-type"],
                    tags: segment["event-tags"] || [],
                    teachers: utilService.formatUsersForCIEvent(
                        segment.teachers
                    ),
                    startTime: dayjs(values["event-end-date"])
                        .hour(segmentDateString1.hour())
                        .minute(segmentDateString1.minute())
                        .toISOString(),
                    endTime: dayjs(values["event-end-date"])
                        .hour(segmentDateString2.hour())
                        .minute(segmentDateString2.minute())
                        .toISOString(),
                })
            })
        }
    }

    return {
        created_at: dayjs().toISOString(),
        type: values["main-event-type"] || "",
        hide: import.meta.env.VITE_HIDE_EVENTS_FLAG ? true : false,
        owners: [],
        is_multi_day: is_multi_day,
        user_id: store.user.id,
        source_template_id: values["template-description"],
        is_notified: false,
        cancelled: false,
        start_date: dayjs(values["event-start-date"])
            .tz("Asia/Jerusalem")
            .hour(13)
            .minute(0)
            .second(0)
            .format("YYYY-MM-DDTHH:mm:ss"),
        end_date: is_multi_day
            ? dayjs(values["event-end-date"])
                  .tz("Asia/Jerusalem")
                  .hour(13)
                  .minute(0)
                  .second(0)
                  .format("YYYY-MM-DDTHH:mm:ss")
            : dayjs(values["event-start-date"])
                  .tz("Asia/Jerusalem")
                  .hour(13)
                  .minute(0)
                  .second(0)
                  .format("YYYY-MM-DDTHH:mm:ss"),
        address: address as IAddress,
        updated_at: dayjs().toISOString(),
        title: values["event-title"],
        description: values["event-description"] || "",
        links: values["links"] || [],
        price: values["prices"] || [],
        district: values["district"],
        multi_day_teachers:
            formatUsersForCIEvent(values["multi-day-event-teachers"]) || [],
        organisations: formatUsersForCIEvent(values["event-orgs"]) || [],
        segments: segments,
    }
}

function formatFormValuesToEditCIEvent(
    values: any,
    address: IAddress,
    is_multi_day: boolean
): Partial<DBCIEvent> {
    let segments: any[] = []
    if (!is_multi_day) {
        segments = [
            {
                startTime: dayjs(values["event-start-date"])
                    .hour(values["first-segment-start-time"].hour())
                    .minute(values["first-segment-start-time"].minute())
                    .toISOString(),
                endTime: dayjs(values["event-start-date"])
                    .hour(values["first-segment-end-time"].hour())
                    .minute(values["first-segment-end-time"].minute())
                    .toISOString(),
                type: values["event-type"] || "",
                tags: values["event-tags"] || [],
                teachers: formatUsersForCIEvent(values["teachers"]),
            },
        ]

        if (values["segments"]) {
            values["segments"].forEach((segment: any) => {
                const segmentDateString1 = segment["event-start-time"]
                const segmentDateString2 = segment["event-end-time"]

                segments.push({
                    type: segment["event-type"],
                    tags: segment["event-tags"] || [],
                    teachers: utilService.formatUsersForCIEvent(
                        segment.teachers
                    ),
                    startTime: dayjs(values["event-start-date"])
                        .hour(segmentDateString1.hour())
                        .minute(segmentDateString1.minute())
                        .toISOString(),
                    endTime: dayjs(values["event-start-date"])
                        .hour(segmentDateString2.hour())
                        .minute(segmentDateString2.minute())
                        .toISOString(),
                })
            })
        }
    }
    return {
        start_date: dayjs(values["event-start-date"])
            .hour(13)
            .minute(0)
            .second(0)
            .format("YYYY-MM-DDTHH:mm:ss"),
        end_date: is_multi_day
            ? dayjs(values["event-end-date"])
                  .hour(13)
                  .minute(0)
                  .second(0)
                  .format("YYYY-MM-DDTHH:mm:ss")
            : dayjs(values["event-start-date"])
                  .hour(13)
                  .minute(0)
                  .second(0)
                  .format("YYYY-MM-DDTHH:mm:ss"),
        address: address as IAddress,
        updated_at: dayjs().toISOString(),
        title: values["event-title"],
        description: values["event-description"] || "",
        links: values["links"] || [],
        price: values["prices"] || [],
        district: values["district"],
        multi_day_teachers:
            formatUsersForCIEvent(values["multi-day-event-teachers"]) || [],
        organisations: formatUsersForCIEvent(values["event-orgs"]) || [],
        segments: segments,
        type: values["main-event-type"] || "",
    }
}

function formatFormValuesToDraftCIEvent(
    values: any,
    address: IAddress | undefined,
    is_multi_day: boolean
): Partial<DBCIEvent & { template_name?: string }> {
    let segments: any[] = []

    // Only process segments if we have the required date and time values
    if (
        !is_multi_day &&
        values["event-start-date"] &&
        values["first-segment-start-time"] &&
        values["first-segment-end-time"]
    ) {
        segments = [
            {
                startTime: dayjs(values["event-start-date"])
                    .hour(dayjs(values["first-segment-start-time"]).hour())
                    .minute(dayjs(values["first-segment-start-time"]).minute())
                    .toISOString(),
                endTime: dayjs(values["event-start-date"])
                    .hour(dayjs(values["first-segment-end-time"]).hour())
                    .minute(dayjs(values["first-segment-end-time"]).minute())
                    .toISOString(),
                type: values["event-type"] || "",
                tags: values["event-tags"] || [],
                teachers: values["teachers"]
                    ? formatUsersForCIEvent(values["teachers"])
                    : [],
            },
        ]

        // Only process additional segments if they exist and have required fields
        // if (values["segments"]?.length > 0) {
        //     const additionalSegments = values["segments"]
        //         .filter(
        //             (segment: any) =>
        //                 segment["event-start-time"] && segment["event-end-time"]
        //         )
        //         .map((segment: any) => ({
        //             type: segment["event-type"] || "",
        //             tags: segment["event-tags"] || [],
        //             teachers: segment.teachers
        //                 ? utilService.formatUsersForCIEvent(segment.teachers)
        //                 : [],
        //             startTime: dayjs(values["event-start-date"])
        //                 .hour(dayjs(segment["event-start-time"]).hour())
        //                 .minute(dayjs(segment["event-start-time"]).minute())
        //                 .toISOString(),
        //             endTime: dayjs(values["event-start-date"])
        //                 .hour(dayjs(segment["event-end-time"]).hour())
        //                 .minute(dayjs(segment["event-end-time"]).minute())
        //                 .toISOString(),
        //         }))

        //     segments.push(...additionalSegments)
        // }
        if (values["segments"]?.length > 0) {
            const additionalSegments = values["segments"]
                .filter((segment: any) => segment !== undefined)
                .map((segment: any) => ({
                    type: segment["event-type"],
                    tags: segment["event-tags"],
                    teachers: segment.teachers,
                    startTime: segment["event-start-time"],
                    endTime: segment["event-end-time"],
                }))

            segments.push(...additionalSegments)
        }
    } else {
        segments = [
            {
                startTime:
                    (values["event-start-date"] || dayjs().toISOString()) &&
                    values["first-segment-start-time"]
                        ? dayjs(values["event-start-date"])
                              .hour(
                                  dayjs(
                                      values["first-segment-start-time"]
                                  ).hour()
                              )
                              .minute(
                                  dayjs(
                                      values["first-segment-start-time"]
                                  ).minute()
                              )
                              .toISOString()
                        : "",
                endTime:
                    (values["event-start-date"] || dayjs().toISOString()) &&
                    values["first-segment-end-time"]
                        ? dayjs(values["event-start-date"])
                              .hour(
                                  dayjs(values["first-segment-end-time"]).hour()
                              )
                              .minute(
                                  dayjs(
                                      values["first-segment-end-time"]
                                  ).minute()
                              )
                              .toISOString()
                        : "",
                type: values["event-type"] || "",
                tags: values["event-tags"] || [],
                teachers: values["teachers"]
                    ? formatUsersForCIEvent(values["teachers"])
                    : [],
            },
        ]
    }

    // Construct the base event object with optional fields
    const draftEvent: Partial<DBCIEvent & { template_name?: string }> = {
        updated_at: dayjs().toISOString(),
    }

    // Only add fields if they have values
    if (values["event-start-date"]) {
        draftEvent.start_date = dayjs(values["event-start-date"])
            .hour(13)
            .minute(0)
            .second(0)
            .format("YYYY-MM-DDTHH:mm:ss")

        draftEvent.end_date =
            is_multi_day && values["event-end-date"]
                ? dayjs(values["event-end-date"])
                      .hour(13)
                      .minute(0)
                      .second(0)
                      .format("YYYY-MM-DDTHH:mm:ss")
                : draftEvent.start_date
    }

    if (address) draftEvent.address = address
    if (values["event-title"]) draftEvent.title = values["event-title"]
    if (values["event-description"])
        draftEvent.description = values["event-description"]
    if (values["links"]) draftEvent.links = values["links"]
    if (values["prices"]) draftEvent.price = values["prices"]
    if (values["district"]) draftEvent.district = values["district"]
    if (values["main-event-type"]) draftEvent.type = values["main-event-type"]

    if (values["multi-day-event-teachers"]) {
        draftEvent.multi_day_teachers = formatUsersForCIEvent(
            values["multi-day-event-teachers"]
        )
    }

    if (values["event-orgs"]) {
        draftEvent.organisations = formatUsersForCIEvent(values["event-orgs"])
    }

    if (segments.length > 0) {
        draftEvent.segments = segments
    }

    if (values["template-name"]) {
        draftEvent.template_name = values["template-name"]
    }
    return draftEvent
}

function formatFormValuesToCreateCITemplate(
    values: any,
    address: IAddress,
    is_multi_day: boolean
): Omit<CITemplate, "id"> {
    let segments: any[] = []
    if (!is_multi_day) {
        segments = [
            {
                startTime: dayjs(values["event-end-date"])
                    .hour(values["first-segment-start-time"].hour())
                    .minute(values["first-segment-start-time"].minute())
                    .toISOString(),
                endTime: dayjs(values["event-end-date"])
                    .hour(values["first-segment-end-time"].hour())
                    .minute(values["first-segment-end-time"].minute())
                    .toISOString(),
                type: values["event-type"] || "",
                tags: values["event-tags"] || [],
                teachers: formatUsersForCIEvent(values["teachers"]),
            },
        ]

        if (values["segments"]) {
            values["segments"].forEach((segment: any) => {
                const segmentDateString1 = segment["event-start-time"]
                const segmentDateString2 = segment["event-end-time"]

                segments.push({
                    type: segment["event-type"],
                    tags: segment["event-tags"] || [],
                    teachers: utilService.formatUsersForCIEvent(
                        segment.teachers
                    ),
                    startTime: dayjs(values["event-end-date"])
                        .hour(segmentDateString1.hour())
                        .minute(segmentDateString1.minute())
                        .toISOString(),
                    endTime: dayjs(values["event-end-date"])
                        .hour(segmentDateString2.hour())
                        .minute(segmentDateString2.minute())
                        .toISOString(),
                })
            })
        }
    }
    return {
        created_at: dayjs().toISOString(),
        type: values["main-event-type"] || "",
        owners: [],
        is_multi_day: is_multi_day,
        user_id: store.user.id,
        address: address as IAddress,
        updated_at: dayjs().toISOString(),
        title: values["event-title"],
        description: values["event-description"] || "",
        links: values["links"] || [],
        price: values["prices"] || [],
        district: values["district"],
        multi_day_teachers:
            formatUsersForCIEvent(values["multi-day-event-teachers"]) || [],
        name: values["template-name"],
        organisations: formatUsersForCIEvent(values["event-orgs"]) || [],
        segments: segments,
    }
}
function formatFormValuesToEditCITemplate(
    values: any,
    address: IAddress,
    is_multi_day: boolean
): Partial<CITemplate> {
    let segments: any[] = []
    if (!is_multi_day) {
        segments = [
            {
                startTime: dayjs(values["event-end-date"])
                    .hour(values["first-segment-start-time"].hour())
                    .minute(values["first-segment-start-time"].minute())
                    .toISOString(),
                endTime: dayjs(values["event-end-date"])
                    .hour(values["first-segment-end-time"].hour())
                    .minute(values["first-segment-end-time"].minute())
                    .toISOString(),
                type: values["event-type"] || "",
                tags: values["event-tags"] || [],
                teachers: formatUsersForCIEvent(values["teachers"]),
            },
        ]

        if (values["segments"]) {
            values["segments"].forEach((segment: any) => {
                const segmentDateString1 = segment["event-start-time"]
                const segmentDateString2 = segment["event-end-time"]

                segments.push({
                    type: segment["event-type"],
                    tags: segment["event-tags"] || [],
                    teachers: utilService.formatUsersForCIEvent(
                        segment.teachers
                    ),
                    startTime: dayjs(values["event-end-date"])
                        .hour(segmentDateString1.hour())
                        .minute(segmentDateString1.minute())
                        .toISOString(),
                    endTime: dayjs(values["event-end-date"])
                        .hour(segmentDateString2.hour())
                        .minute(segmentDateString2.minute())
                        .toISOString(),
                })
            })
        }
    }
    return {
        type: values["main-event-type"] || "",
        address: address as IAddress,
        updated_at: dayjs().toISOString(),
        title: values["event-title"],
        description: values["event-description"] || "",
        links: values["links"] || [],
        price: values["prices"] || [],
        district: values["district"],
        multi_day_teachers:
            formatUsersForCIEvent(values["multi-day-event-teachers"]) || [],
        name: values["template-name"],
        organisations: formatUsersForCIEvent(values["event-orgs"]) || [],
        segments: segments,
    }
}

function createDbUserFromUser(user: User): DbUserWithoutJoin {
    return {
        id: user.id,
        user_type: UserType.user,
        user_name: user.user_metadata.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        created_at: user.created_at,
        updated_at: new Date().toISOString(),
        subscribed_for_updates_at: new Date().toISOString(),
        provider: user.app_metadata["provider"] || "",
        push_notification_tokens: [],
        subscriptions: {
            teachers: [],
            orgs: [],
        },
        receive_notifications: true,
        version: CACHE_VERSION,
        last_signin: new Date().toISOString(),
        pwa_install_id: null,
        fcm_token: null,
    }
}

function deepCompare(obj1: any, obj2: any): boolean {
    // Check if both inputs are objects
    if (
        typeof obj1 !== "object" ||
        typeof obj2 !== "object" ||
        obj1 === null ||
        obj2 === null
    ) {
        return obj1 === obj2
    }

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    // Check if the number of keys is the same
    if (keys1.length !== keys2.length) {
        return false
    }

    // Compare each key-value pair recursively
    for (const key of keys1) {
        if (!keys2.includes(key) || !deepCompare(obj1[key], obj2[key])) {
            return false
        }
    }

    return true
}
function deepCompareArraysUnordered<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) {
        return false
    }
    const sortedArr1 = [...arr1].sort()
    const sortedArr2 = [...arr2].sort()
    return sortedArr1.every((value, index) => value === sortedArr2[index])
}

function formatHebrewDateByStartTime(date: string, startTime: string) {
    const hebrewDate = dayjs(date)
        .hour(dayjs(startTime).hour())
        .minute(dayjs(startTime).minute())
    return formatHebrewDate(hebrewDate.toISOString())
}
function formatHebrewDate(date: string) {
    if (!date) return " - "
    const hebrewDate = dayjs(date)
    const day = hebrewDate.format("D")
    const month = hebrewDate.format("MM")
    const hebrewMonth = hebrewMonths.find(
        (m: SelectOption) => m.value === month
    )?.label
    return `${hebrewDay(date)} ${day} ב${hebrewMonth}`
}

function hebrewDay(date: string) {
    switch (dayjs(date).locale("he").format("dd")) {
        case "Su":
            return "יום ראשון"
        case "Mo":
            return "יום שני"
        case "Tu":
            return "יום שלישי"
        case "We":
            return "יום רביעי"
        case "Th":
            return "יום חמישי"
        case "Fr":
            return "יום שישי"
        case "Sa":
            return "יום שבת"
        default:
            return ""
    }
}

//allows to store teachers that dont exist in the teachers list as {label: teacherName, value: "NON_EXISTENT"+uuid4()}
function formatUsersForCIEvent(
    selectedUsers: (string | { label: string; value: string })[]
): { label: string; value: string }[] {
    store.getAppPublicBios
    if (!selectedUsers) return []
    const formattedUsers = selectedUsers.map((user) => {
        if (typeof user === "string") {
            const userObj = store.getAppPublicBios.find(
                (u) => u.user_id === user
            )
            return userObj
                ? { label: userObj.bio_name, value: userObj.user_id }
                : { label: user, value: user }
        } else if (typeof user === "object") {
            const userObj = store.getAppPublicBios.find(
                (u) => u.user_id === user.value
            )
            return userObj
                ? { label: userObj.bio_name, value: userObj.user_id }
                : { label: user.label, value: user.label }
        }
        return user
    })

    const validatedUsers = formattedUsers.filter(
        (user): user is { label: string; value: string } => {
            const isValid =
                user !== null &&
                typeof user === "object" &&
                typeof user.label === "string" &&
                typeof user.value === "string"

            if (!isValid) {
                console.warn("Invalid user format detected:", user)
            }

            return isValid
        }
    )

    return validatedUsers
}

function getPWAInstallId() {
    let deviceId = localStorage.getItem("pwa_install_id")
    if (!deviceId) {
        deviceId = uuidv4()
        localStorage.setItem("pwa_install_id", deviceId)
    }
    return deviceId
}

function isPWA() {
    // if (import.meta.env.VITE_PWA_TEST) return true
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
    )
}

function isFirstNotificationPermissionRequest() {
    return !localStorage.getItem("notificationPermission")
}
function setFirstNotificationPermissionRequest(permission: string) {
    localStorage.setItem("notificationPermission", permission)
}
function getNotificationPermission() {
    return localStorage.getItem("notificationPermission")
}

function openGoogleMaps(placeId: string, address: string) {
    const iosUrl = `comgooglemaps://?q=${encodeURIComponent(address)}`
    const androidUrl = `geo:0,0?q=${encodeURIComponent(address)}`
    const fallbackUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`

    if (/(iPhone|iPad|iPod)/.test(navigator.userAgent)) {
        // setTimeout(() => {
        //     window.location.href = fallbackUrl
        // }, 25)
        window.open(iosUrl, "_blank")
    } else if (/Android/.test(navigator.userAgent)) {
        window.open(androidUrl, "_blank")
    } else {
        window.open(fallbackUrl, "_blank")
    }
}

function isIos() {
    return /(iPhone|iPad|iPod)/.test(navigator.userAgent)
}

function handleShareEvent(eventId: string, eventTitle: string) {
    const shareUrl = `${window.location.origin}/event/${eventId}` // Construct the URL

    if (navigator.share) {
        navigator
            .share({
                title: "Check out this event!",
                text: `${eventTitle}`,
                url: shareUrl, // Use the constructed URL
            })
            .then(() => console.log("Successful share"))
            .catch((error) => console.log("Error sharing", error))
    } else {
        console.log("Web Share API not supported in this browser.")
        // Fallback for browsers that do not support the Web Share API
    }
}

function copyURLToClipboard(eventId: string, info: () => void) {
    const shareUrl = `${window.location.origin}/event/${eventId}` // Construct the URL
    navigator.clipboard.writeText(shareUrl)
    info()
}

function getFilterItemType(item: string) {
    if (eventOptions.some((option) => option.value === item)) {
        return "eventType"
    } else if (districtOptions.some((option) => option.value === item)) {
        return "district"
    } else {
        console.error("Invalid item type")
        return ""
    }
}

function getLabelByValue(value: string) {
    return [...eventOptions, ...districtOptions].find(
        (option) => option.value === value
    )?.label
}
function saveFiltersToLocalStorage(districts: string[], eventTypes: string[]) {
    const filters = {
        districts,
        eventTypes,
    }
    localStorage.setItem("defaultFilters", JSON.stringify(filters))
}

function saveEventsToLocalStorage(events: CIEvent[]) {
    try {
        localStorage.removeItem("events")
        localStorage.setItem("events", JSON.stringify(events))
        return true
    } catch (error) {
        console.error("Error saving events to localStorage:", error)
    }
}

function getEventsFromLocalStorage(): CIEvent[] {
    try {
        const events = localStorage.getItem("events")
        return events ? JSON.parse(events) : []
    } catch (error) {
        console.error("Error reading events from localStorage:", error)
        return []
    }
}

function saveBiosToLocalStorage(bios: UserBio[]) {
    try {
        localStorage.removeItem("bios")
        localStorage.setItem("bios", JSON.stringify(bios))
        return true
    } catch (error) {
        console.error("Error saving bios to localStorage:", error)
        return false
    }
}

function getBiosFromLocalStorage(): UserBio[] {
    try {
        const bios = localStorage.getItem("bios")
        return bios ? JSON.parse(bios) : []
    } catch (error) {
        console.error("Error reading bios from localStorage:", error)
        return []
    }
}

function saveIsInternalToLocalStorage(isInternal: boolean) {
    try {
        localStorage.removeItem("isInternal")
        localStorage.setItem("isInternal", JSON.stringify(isInternal))
        return true
    } catch (error) {
        console.error("Error saving isInternal to localStorage:", error)
        return false
    }
}

function getIsInternalFromLocalStorage(): boolean {
    try {
        const isInternal = localStorage.getItem("isInternal")
        return isInternal ? JSON.parse(isInternal) : false
    } catch (error) {
        console.error("Error reading isInternal from localStorage:", error)
        return false
    }
}

function getCIEventTeachers(cievent: CIEvent | DBCIEvent) {
    const singleDayEventTeachers = cievent.segments
        .map((segment) => segment.teachers)
        .flat()
        .map((teacher) => teacher.value)

    const multiDayEventTeachers =
        cievent.multi_day_teachers?.map((teacher) => teacher.value) || []

    const organisations = cievent.organisations
        .map((org) => org.value)
        .filter((org) => org !== "NON_EXISTENT")

    // Combine and filter out "NON_EXISTENT" values, then remove duplicates
    const uniqueTeachers = Array.from(
        new Set([
            ...singleDayEventTeachers,
            ...multiDayEventTeachers,
            ...organisations,
        ])
    ).filter((teacher) => !utilService.notAUserId(teacher))

    return uniqueTeachers
}

function notAUserId(userId: string) {
    return userId.startsWith("NON_EXISTENT")
}

function getUniqueOwnersList(events: CIEvent[]): SelectOption[] {
    const uniqueOwners = new Set<string>()
    events.forEach((event) => {
        uniqueOwners.add(event.creator.user_id)
    })
    return Array.from(uniqueOwners).map((user_id) => ({
        value: user_id,
        label:
            events.find((event) => event.creator.user_id === user_id)?.creator
                .full_name || "",
    }))
}

function removeDuplicates(values: string[]) {
    return Array.from(new Set(values))
}

function isSingleDayEventNotStarted(event: CIEvent) {
    if (event.is_multi_day) return true
    return !isEventStartedByFirstSegment(
        event.start_date,
        event.segments[0].startTime
    )
}

function isEventStartedByFirstSegment(startDate: string, startTime: string) {
    const now = dayjs().tz("Asia/Jerusalem")
    const eventStartTime = dayjs(startDate)
        .hour(dayjs(startTime).hour())
        .minute(dayjs(startTime).minute())
        .tz("Asia/Jerusalem")
    return eventStartTime.isBefore(now)
}

function isEventStartedByDay(startDate: string) {
    const now = dayjs().tz("Asia/Jerusalem")
    const eventStartTime = dayjs(startDate)
        .hour(0)
        .minute(0)
        .tz("Asia/Jerusalem")
    return eventStartTime.isBefore(now)
}
function isEventStarted(event: CIEvent) {
    if (event.is_multi_day) return isEventStartedByDay(event.start_date)
    return isEventStartedByFirstSegment(
        event.start_date,
        event.segments[0].startTime
    )
}
function isNotificationNotStarted(notification: UserNotification) {
    if (notification.is_multi_day) {
        return !isEventStartedByDay(notification.start_date)
    } else {
        if (!notification.firstSegment) return false
        return !isEventStartedByFirstSegment(
            notification.start_date,
            notification.firstSegment.startTime
        )
    }
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatConfig(config: RawAppConfigRecord[]) {
    return {
        app_title: config.find((c) => c.title === "app_title")?.data || "",
        app_description:
            config.find((c) => c.title === "app_description")?.data || "",
    }
}

function validateEventNotification(alert: CIAlert, events: CIEvent[]) {
    const event = events.find((e) => e.id === alert.ci_event_id)
    if (!event) {
        return false
    }
    return true
}

function isUUID(uuid: string) {
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidPattern.test(uuid)
}

function getUserTypeByRoleId(roleId: string) {
    let type = UserType.user
    switch (roleId) {
        case "1":
            type = UserType.admin
            break
        case "2":
            type = UserType.creator
            break
        case "4":
            type = UserType.profile
            break
    }
    return type
}

function saveDraftEvent(draftEvent: Partial<DBCIEvent>, key: string) {
    localStorage.setItem(key, JSON.stringify(draftEvent))
}

function getDraftEvent(key: string) {
    const draftEvent = localStorage.getItem(key)
    return draftEvent ? JSON.parse(draftEvent) : null
}

function clearDraftEvent(key: string) {
    localStorage.removeItem(key)
}

function calculateRecurringEventDates(
    startDate: dayjs.Dayjs,
    recurringEndData: dayjs.Dayjs,
    recurringOption: string
) {
    const recurringDates = []

    if (recurringOption === "weekly") {
        for (let i = 0; i < 52; i++) {
            const date = startDate.add(i, "week")
            if (date.isAfter(recurringEndData)) break
            recurringDates.push(date)
        }
    } else if (recurringOption === "bi-weekly") {
        for (let i = 0; i < 52; i++) {
            const date = startDate.add(i * 2, "week")
            if (date.isAfter(recurringEndData)) break
            recurringDates.push(date)
        }
    } else if (recurringOption === "monthly") {
        for (let i = 0; i < 12; i++) {
            const date = startDate.add(i, "month")
            if (date.isAfter(recurringEndData)) break
            recurringDates.push(date)
        }
    } else if (recurringOption === "monthly-pattern") {
        const weekOfMonth = Math.ceil(startDate.date() / 7) // Get which week of the month (1-5)
        const dayOfWeek = startDate.day() // Get day of week (0-6)

        for (let i = 0; i < 12; i++) {
            let targetDate = startDate.clone().add(i, "months")

            let firstDayOfMonth = targetDate.clone().startOf("month")

            let dayOffset = (dayOfWeek - firstDayOfMonth.day() + 7) % 7
            let firstTargetDay = firstDayOfMonth.clone().add(dayOffset, "days")

            let finalDate = firstTargetDay.clone().add(weekOfMonth - 1, "weeks")

            if (finalDate.isAfter(recurringEndData)) break
            recurringDates.push(finalDate)
        }
    }
    return recurringDates
}

function duplicateEvent(
    date: Dayjs,
    event: Omit<DBCIEvent, "id" | "cancelled_text" | "short_id">,
    isMultiDayEvent: boolean
): Omit<DBCIEvent, "id" | "cancelled_text" | "short_id"> {
    const eventLength = dayjs(event.start_date).diff(
        dayjs(event.end_date),
        "day"
    )

    return {
        ...event,
        start_date: date.format("YYYY/MM/DD"),
        end_date: isMultiDayEvent
            ? date.add(eventLength, "day").format("YYYY/MM/DD")
            : date.format("YYYY/MM/DD"),
    }
}

function addToGoogleCalendar(event: CIEvent) {
    let startTime: string
    let endTime: string

    if (event.is_multi_day) {
        // For multi-day events, use full days
        startTime = dayjs(event.start_date).format("YYYYMMDD")
        // For all-day events in Google Calendar, the end date needs to be the day after
        endTime = dayjs(event.end_date).add(1, "day").format("YYYYMMDD")
    } else {
        // For single-day events, use segment times with specific format required by Google Calendar
        startTime = dayjs(event.segments[0].startTime).format("YYYYMMDDTHHmmss")
        endTime = dayjs(
            event.segments[event.segments.length - 1].endTime
        ).format("YYYYMMDDTHHmmss")
    }

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        event.title
    )}&dates=${startTime}/${endTime}&details=${encodeURIComponent(
        event.description || ""
    )}&location=${encodeURIComponent(event.address.label || "")}`

    window.open(url, "_blank")
}
