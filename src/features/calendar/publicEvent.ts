import type { DataClient } from "../../data/client"
import { normaliseMultiDayType } from "../../lib/eventOptions"

// A public event: what the calendar list and the event details show, read
// from `ci_events` with the public bios of its tagged teachers embedded. Both
// the calendar window and deep links read this shape, so an event opened from
// either looks the same.

/** A tagged teacher or organisation. `value` is a user id when tagged. */
export interface Tag {
    label: string
    value: string
}

export interface Segment {
    type: string
    /** Timestamps; only their Jerusalem time of day is meaningful. */
    startTime: string
    endTime: string
    teachers: Tag[]
    /** Audience tags, e.g. `everyone`, `beginner`. */
    tags: string[]
}

export interface PublicBio {
    userId: string
    name: string
    img: string | null
    about: string
    links: { url: string; title: string | null }[]
}

export interface PublicEvent {
    id: string
    shortId: string | null
    title: string
    /** Calendar day, `YYYY-MM-DD`. */
    startDate: string
    endDate: string
    cancelled: boolean
    cancelledText: string
    /** The multi-day event type; single-day events type their segments. */
    type: string
    /** Empty for multi-day events. */
    segments: Segment[]
    multiDayTeachers: Tag[]
    organisations: Tag[]
    address: { label: string; placeId: string | null }
    /** The region the calendar filters by, e.g. `center` (see filters.ts). */
    district: string
    links: { title: string; url: string }[]
    prices: { title: string; sum: number }[]
    description: string
    /** Public bios of the tagged teachers and organisations. */
    bios: PublicBio[]
}

// Every column the list and the details render — the first-paint payload
// (~5 KB gzipped for 90 days in production, bios included). Bios come
// through the `ci_events_users_junction` → `public_bio` foreign keys.
// Language titles (`lng_titles`) arrive with the languages slice.
export const PUBLIC_EVENT_COLUMNS =
    "id, short_id, title, start_date, end_date, cancelled, cancelled_text, type, district, segments, multi_day_teachers, organisations, address, links, price, description, ci_events_users_junction(public_bio(user_id, bio_name, img, about, page_url, page_title, page_url_2, page_title_2))"

const BIO = "ci_events_users_junction.public_bio"

/**
 * Visible events with only public bios embedded. Public-ness is filtered here
 * explicitly, never left to RLS: these queries also run with a signed-in
 * user's token, and their results are persisted to the device. Hidden bios
 * (`show_profile = false`) come back as `null` and are dropped; admin and
 * nameless bios are left out as in the legacy app.
 */
export function selectPublicEvents(data: DataClient) {
    return data
        .from("ci_events")
        .select(PUBLIC_EVENT_COLUMNS)
        .eq("hide", false)
        .eq(`${BIO}.show_profile`, true)
        .neq(`${BIO}.user_type`, "admin")
        .neq(`${BIO}.bio_name`, "")
}

type Row = NonNullable<
    Awaited<ReturnType<typeof selectPublicEvents>>["data"]
>[number]

// The JSON columns are written by the event forms; read them defensively so
// one odd row can't break the calendar.
const array = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value)
        ? value.filter((item) => item && typeof item === "object")
        : []
const text = (value: unknown) => (typeof value === "string" ? value : "")

const toTags = (value: unknown): Tag[] =>
    array(value).map((tag) => ({
        label: text(tag.label),
        value: text(tag.value),
    }))

/** Rows with a start date; the queries' date filters guarantee one. */
export function toPublicEvent(row: Row & { start_date: string }): PublicEvent {
    const address = (row.address ?? {}) as Record<string, unknown>
    return {
        id: row.id,
        shortId: row.short_id,
        title: row.title,
        startDate: row.start_date,
        endDate: row.end_date ?? row.start_date,
        cancelled: row.cancelled ?? false,
        cancelledText: row.cancelled_text ?? "",
        type: normaliseMultiDayType(row.type),
        segments: array(row.segments).map((segment) => ({
            type: text(segment.type),
            startTime: text(segment.startTime),
            endTime: text(segment.endTime),
            teachers: toTags(segment.teachers),
            tags: Array.isArray(segment.tags)
                ? segment.tags.filter(
                      (tag): tag is string => typeof tag === "string",
                  )
                : [],
        })),
        multiDayTeachers: toTags(row.multi_day_teachers),
        organisations: toTags(row.organisations),
        address: {
            label: text(address.label),
            placeId: text(address.place_id) || null,
        },
        district: row.district,
        links: array(row.links).map((link) => ({
            title: text(link.title),
            url: text(link.link),
        })),
        prices: array(row.price).map((price) => ({
            title: text(price.title),
            sum: Number(price.sum),
        })),
        description: row.description,
        bios: row.ci_events_users_junction.flatMap(({ public_bio: bio }) =>
            bio
                ? [
                      {
                          userId: bio.user_id,
                          name: bio.bio_name,
                          img: bio.img,
                          about: bio.about ?? "",
                          links: [
                              { url: bio.page_url, title: bio.page_title },
                              { url: bio.page_url_2, title: bio.page_title_2 },
                          ].flatMap(({ url, title }) =>
                              url ? [{ url, title }] : [],
                          ),
                      },
                  ]
                : [],
        ),
    }
}
