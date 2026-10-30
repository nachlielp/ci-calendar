import { isDistrict } from "../../lib/eventOptions"
import { addDays, jerusalemTimeOfDay, weekday } from "../../lib/jerusalemDate"
import type { PublicBio, PublicEvent, Segment, Tag } from "./publicEvent"

// Pure formatting of public events, shared by the list card and the details.
//
// Everything language-specific sits in an `EventLocale`; the formatters take
// one (Hebrew by default). The languages slice adds English and Russian
// locales (legacy util/translations.ts and translate.ts `getMonthName`) and
// passes the UI language's locale through.

/** The words and formats events are shown with in one language. */
export interface EventLocale {
    /** Copy shared by the list card and the details. */
    copy: { cancelled: string; with: string }
    /** Event and segment types (`class`, `jam`, …). */
    types: Readonly<Record<string, string>>
    /** Segment audience tags (`everyone`, `beginner`, …). */
    tags: Readonly<Record<string, string>>
    /** Event districts (`center`, `jerusalem`, …). */
    districts: Readonly<Record<string, string>>
    /** Month names, January first. */
    months: readonly string[]
    /** Weekday headings of the month calendar, Sunday first. */
    weekdaysShort: readonly string[]
    /** A calendar day; `weekday` 0 = Sunday, `month` 1 = January. */
    day(parts: { weekday: number; date: number; month: number }): string
}

const HEBREW_WEEKDAYS = [
    "ראשון",
    "שני",
    "שלישי",
    "רביעי",
    "חמישי",
    "שישי",
    "שבת",
]

const HEBREW_MONTHS = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
]

export const HEBREW: EventLocale = {
    copy: { cancelled: "האירוע בוטל", with: "עם" },
    types: {
        class: "שיעור",
        jam: "ג'אם",
        underscore: "אנדרסקור",
        workshop: "סדנה",
        retreat: "ריטריט",
        warmup: "חימום",
        course: "קורס",
        score: "סקור",
    },
    tags: {
        everyone: "פתוח לכולם",
        beginner: "מתחילים",
        advanced: "מתקדמים",
        male: "גברים",
        female: "נשים",
        preRegistration: "הרשמה מראש",
    },
    districts: {
        center: "מרכז",
        jerusalem: "ירושלים",
        galilee: "גליל",
        haifa: "חיפה",
        carmel: "חוף הכרמל",
        pardesHanna: "פרדס חנה",
        south: "דרום",
    },
    months: HEBREW_MONTHS,
    weekdaysShort: ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"],
    // `שבת, יום שבת 7 בנובמבר`, the legacy app's day format.
    day: ({ weekday, date, month }) => {
        const name = HEBREW_WEEKDAYS[weekday]
        return `${name}, יום ${name} ${date} ב${HEBREW_MONTHS[month - 1]}`
    },
}

const label = (labels: Readonly<Record<string, string>>, key: string) =>
    Object.hasOwn(labels, key) ? labels[key] : key

export const typeLabel = (type: string, locale = HEBREW) =>
    label(locale.types, type)
export const tagLabel = (tag: string, locale = HEBREW) =>
    label(locale.tags, tag)
const districtLabel = (district: string, locale = HEBREW) =>
    label(locale.districts, district)
/** The label of an event type or a district (lib/eventOptions.ts). */
export const optionLabel = (value: string, locale = HEBREW) =>
    isDistrict(value) ? districtLabel(value, locale) : typeLabel(value, locale)

/** A calendar day (`YYYY-MM-DD`) in the locale's day format. */
export function dayLabel(day: string, locale = HEBREW): string {
    const [, month, date] = day.split("-").map(Number)
    return locale.day({ weekday: weekday(day), date, month })
}

/** The day, or the day range of a multi-day event. */
export function eventDateLabel(event: PublicEvent, locale = HEBREW): string {
    return isMultiDay(event)
        ? `${dayLabel(event.startDate, locale)} - ${dayLabel(event.endDate, locale)}`
        : dayLabel(event.startDate, locale)
}

/** Multi-day events (workshops, retreats) have no segments. */
export const isMultiDay = (event: PublicEvent) => event.segments.length === 0

const timeRange = (start: string, end: string) =>
    `${jerusalemTimeOfDay(start)} - ${jerusalemTimeOfDay(end)}`

export const segmentTimeRange = (segment: Segment) =>
    timeRange(segment.startTime, segment.endTime)

/** From the first segment's start to the last one's end; null if multi-day. */
export function eventTimeRange(event: PublicEvent): string | null {
    const { segments } = event
    if (segments.length === 0) return null
    return timeRange(segments[0].startTime, segments.at(-1)!.endTime)
}

export const priceLabel = (price: PublicEvent["prices"][number]) =>
    `${price.title}: ${price.sum}₪`

/** The event's types (its own and its segments'), each once, as labels. */
export function typeLabels(event: PublicEvent, locale = HEBREW): string[] {
    const types = [...event.segments.map((s) => s.type), event.type]
    return [...new Set(types.filter(Boolean))].map((type) =>
        typeLabel(type, locale),
    )
}

/** The public bio of a tagged teacher or organisation, if it has one. */
export const bioOf = (event: PublicEvent, tag: Tag): PublicBio | undefined =>
    event.bios.find((bio) => bio.userId === tag.value)

const nameOf = (event: PublicEvent, tag: Tag) =>
    bioOf(event, tag)?.name || tag.label

/** Everyone teaching, each once: multi-day teachers, then segment teachers. */
export function teacherNames(event: PublicEvent): string[] {
    const tags = [
        ...event.multiDayTeachers,
        ...event.segments.flatMap((segment) => segment.teachers),
    ]
    return [...new Set(tags.map((tag) => nameOf(event, tag)))]
}

export const organisationNames = (event: PublicEvent) =>
    event.organisations.map((tag) => nameOf(event, tag))

/** The event's own page: `/event/<short id>`, the form the app shares. */
export const eventPath = (event: PublicEvent) =>
    `/event/${event.shortId ?? event.id}`

const compactDay = (day: string) => day.replaceAll("-", "")
const compactTime = (time: string) => `${time.replace(":", "")}00`

/**
 * A Google Calendar "add event" link. Single-day events run from the first
 * segment's start to the last one's end in Jerusalem time, on the event's
 * day (an end before the start is after midnight); multi-day events are
 * all-day, with the exclusive end date Google expects.
 */
export function googleCalendarUrl(event: PublicEvent): string {
    let dates: string
    if (isMultiDay(event)) {
        dates = `${compactDay(event.startDate)}/${compactDay(addDays(event.endDate, 1))}`
    } else {
        const start = jerusalemTimeOfDay(event.segments[0].startTime)
        const end = jerusalemTimeOfDay(event.segments.at(-1)!.endTime)
        const endDay =
            end < start ? addDays(event.startDate, 1) : event.startDate
        dates = `${compactDay(event.startDate)}T${compactTime(start)}/${compactDay(endDay)}T${compactTime(end)}`
    }
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.title,
        dates,
        ctz: "Asia/Jerusalem",
        details: `www.ci-events.org/${event.shortId ?? event.id}\n\n${event.description}`,
        location: event.address.label,
    })
    return `https://calendar.google.com/calendar/render?${params}`
}

/**
 * Navigation to the event's address, as the legacy app did it: the Google
 * Maps app on iOS, the default maps app on Android, Google Maps on the web
 * (by place id when the address has one).
 */
export function mapsUrl(
    address: PublicEvent["address"],
    userAgent: string,
): string {
    const query = encodeURIComponent(address.label)
    if (/iPhone|iPad|iPod/.test(userAgent)) {
        return `comgooglemaps://?q=${query}`
    }
    if (/Android/.test(userAgent)) return `geo:0,0?q=${query}`
    return address.placeId
        ? `https://www.google.com/maps/place/?q=place_id:${address.placeId}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`
}
