import { isDistrict } from "../../lib/eventOptions"
import { addDays, jerusalemTimeOfDay } from "../../lib/jerusalemDate"
import type { Language } from "../../lib/language"
import type { EventLocale } from "./eventLocales"
import type { PublicBio, PublicEvent, Segment, Tag } from "./publicEvent"

// Pure formatting of public events, shared by the list card and the details.
// Everything language-specific comes from an `EventLocale` (eventLocales.ts),
// which the formatters require: the caller passes the interface language's.

/**
 * The event's title in `language`: its stored translation (`lng_titles`,
 * written by the translate function on save), else the Hebrew title.
 * Russian falls back to Hebrew, not English, as in legacy.
 */
export function pickTitle(event: PublicEvent, language: Language): string {
    return language === "he"
        ? event.title
        : event.titleTranslations[language] || event.title
}

/**
 * The address in `language`: Hebrew gets the Hebrew label; English and
 * Russian get the English label (there is no Russian one), else the Hebrew.
 */
export function pickAddress(
    address: PublicEvent["address"],
    language: Language,
): string {
    return language === "he" ? address.label : address.enLabel || address.label
}

const label = (labels: Readonly<Record<string, string>>, key: string) =>
    Object.hasOwn(labels, key) ? labels[key] : key

export const typeLabel = (type: string, locale: EventLocale) =>
    label(locale.types, type)
export const tagLabel = (tag: string, locale: EventLocale) =>
    label(locale.tags, tag)
const districtLabel = (district: string, locale: EventLocale) =>
    label(locale.districts, district)
/** The label of an event type or a district (lib/eventOptions.ts). */
export const optionLabel = (value: string, locale: EventLocale) =>
    isDistrict(value) ? districtLabel(value, locale) : typeLabel(value, locale)

/** A calendar day (`YYYY-MM-DD`) in the locale's day format. */
export const dayLabel = (day: string, locale: EventLocale) => locale.day(day)

/** The day, or the day range of a multi-day event. */
export function eventDateLabel(
    event: PublicEvent,
    locale: EventLocale,
): string {
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
export function typeLabels(event: PublicEvent, locale: EventLocale): string[] {
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
    address: Pick<PublicEvent["address"], "label" | "placeId">,
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
