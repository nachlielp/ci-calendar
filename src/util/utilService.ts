import dayjs from "dayjs"
import { v4 as uuidv4 } from "uuid"
import { CIEvent, CITemplate, DbUser, UserType } from "./interfaces"
import { User } from "@supabase/supabase-js"
import {
    districtOptions,
    eventOptions,
    hebrewMonths,
    SelectOption,
} from "./options"
import { DBCIEvent } from "../supabase/cieventsService"
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
    getDeviceId,
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
    getUniqueTeachersList: getUniqueOwnersList,
}

function CIEventToFormValues(event: CIEvent) {
    const segments = event.segments.slice(1).map((segment) => ({
        "event-type": segment.type,
        "event-tags": segment.tags,
        teachers: reverseFormatTeachers(segment.teachers),
        "event-time": [dayjs(segment.startTime), dayjs(segment.endTime)],
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
        "main-event-type": event.type,
        "event-schedule": event.segments.length > 0,
        links: event.links,
        prices: event.price,
        "event-type": event.segments[0]?.type,
        "event-tags": event.segments[0]?.tags,
        teachers: reverseFormatTeachers(event.segments[0]?.teachers),
        "event-time": [
            dayjs(event.segments[0]?.startTime),
            dayjs(event.segments[0]?.endTime),
        ],
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
        "event-time": [
            dayjs(template.segments[0]?.startTime).tz("Asia/Jerusalem"),
            dayjs(template.segments[0]?.endTime).tz("Asia/Jerusalem"),
        ],
        segments: template.segments.slice(1).map((segment) => ({
            "event-type": segment.type,
            "event-tags": segment.tags,
            teachers: reverseFormatTeachers(segment.teachers),
            "event-time": [dayjs(segment.startTime), dayjs(segment.endTime)],
        })),
        links: template.links.map((link) => ({
            title: link.title,
            link: link.link,
        })),
        prices: template.price.map((price) => ({
            title: price.title,
            sum: price.sum,
        })),
    }
    return { currentFormValues, address: template.address }
}

function multiDayTemplateToFormValues(template: CITemplate) {
    const currentFormValues = {
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

function createDbUserFromUser(user: User): DbUser {
    return {
        user_id: user.id,
        user_type: UserType.user,
        full_name: user.user_metadata.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        created_at: user.created_at,
        updated_at: new Date().toISOString(),
        subscribed_for_updates_at: new Date().toISOString(),
        newsletter: {
            createdAt: "",
            updatedAt: "",
            subscribedForUpdatesAt: "",
            active: false,
            districts: [],
            eventTypes: [],
        },
        page_url: "",
        page_title: "",
        show_profile: false,
        allow_tagging: false,
        img: "", // Add this line
        bio: "",
        provider: user.app_metadata["provider"] || "",
        default_filter: {
            districts: [],
            eventTypes: [],
        },
        push_notification_tokens: [],
        notifications: [],
        subscriptions: {
            teachers: [],
            orgs: [],
        },
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
function formatHebrewDate(date: string) {
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
    selectedUsers: string[],
    users: { label: string; value: string }[]
) {
    console.log("selectedUsers: ", selectedUsers)
    console.log("users: ", users)
    if (!selectedUsers) return []
    const formattedUsers: { label: string; value: string }[] =
        selectedUsers.map((user) => {
            const userObj = users.find((t) => t.value === user)
            if (userObj) {
                return userObj
            } else {
                return { label: user, value: "NON_EXISTENT" + uuidv4() }
            }
        })
    console.log("formattedUsers: ", formattedUsers)
    return formattedUsers
}

function getDeviceId() {
    let deviceId = localStorage.getItem("device_id")
    if (!deviceId) {
        deviceId = uuidv4()
        localStorage.setItem("device_id", deviceId)
    }
    return deviceId
}

function isPWA() {
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
