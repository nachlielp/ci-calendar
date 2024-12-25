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
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"
import customParseFormat from "dayjs/plugin/customParseFormat"
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
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
        "event-schedule": event.segments.length > 0,
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
): Omit<DBCIEvent, "id"> {
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
        hide: false,
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
function formatUsersForCIEvent(selectedUsers: string[]) {
    store.getAppPublicBios
    if (!selectedUsers) return []
    const formattedUsers: { label: string; value: string }[] =
        selectedUsers.map((user) => {
            const userObj = store.getAppPublicBios.find(
                (u) => u.user_id === user
            )
            if (userObj) {
                return { label: userObj.bio_name, value: userObj.user_id }
            } else {
                return { label: user, value: user }
            }
        })
    return formattedUsers
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
    const shareUrl = `${window.location.origin}/${eventId}` // Construct the URL

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
    const shareUrl = `${window.location.origin}/${eventId}` // Construct the URL
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
