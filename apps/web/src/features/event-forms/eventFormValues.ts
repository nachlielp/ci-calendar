import type { Database } from "../../data/database.types"
import { MULTI_DAY_TYPES } from "../../lib/eventOptions"
import type { FormErrors } from "../../lib/form"
import { addDays, jerusalemTimeOfDay } from "../../lib/jerusalemDate"
import { jerusalemInstant } from "../../lib/jerusalemInstant"
import { isWebUrl, normaliseWebUrl } from "../../lib/webUrl"
import type { Tag } from "../calendar/publicEvent"
import type { ManagedEvent } from "../events/managedEvent"
import {
    addMonths,
    isRecurrence,
    RECURRENCE_MONTHS,
    recurringDates,
    type Recurrence,
} from "./recurrence"

// The event forms' values, as pure data and functions (legacy utilService's
// `CIEventToFormValues`, `formatFormValuesToCreateCIEvent`/`…EditCIEvent`
// and the forms' antd rules): what the form edits, how it is checked, and
// the `ci_events` columns it is saved as. The base part (title, address,
// links, prices, …) is shared with the multi-day form (slice 14) and
// templates (slice 16).

/** An address picked from Google Places (`ci_events.address`). */
export interface AddressValue {
    /** Google's Hebrew description. */
    label: string
    placeId: string
    /** The English address, once a save has looked it up. */
    enLabel?: string
}

/** One part of a single-day event (legacy's "first segment" is the first). */
export interface SegmentValues {
    type: string
    /** `HH:mm`, Jerusalem time on the event's day. */
    start: string
    end: string
    /** Tagged teachers (`value` = their user id) and typed names. */
    teachers: Tag[]
    /** Audience tags (`everyone`, `beginner`, …). */
    tags: string[]
}

export interface LinkValues {
    title: string
    url: string
}

export interface PriceValues {
    title: string
    /** As typed; saved as a number. */
    sum: string
}

/** What every event form edits. */
export interface EventBaseValues {
    title: string
    description: string
    district: string
    address: AddressValue | null
    organisations: Tag[]
    links: LinkValues[]
    prices: PriceValues[]
    /** `hide`: a draft, shown only in management. */
    hidden: boolean
}

/**
 * A new single-day event repeated (legacy RecurringEventSection): how
 * often, and the last day a repetition may fall on.
 */
export interface RecurrenceValues {
    on: boolean
    frequency: Recurrence | ""
    /** `YYYY-MM-DD` (Jerusalem). */
    until: string
}

export interface SingleDayValues extends EventBaseValues {
    /** `YYYY-MM-DD` (Jerusalem). */
    date: string
    segments: SegmentValues[]
    /** New events only; an edit's is always off. */
    recurrence: RecurrenceValues
    /** The template a new event started from (`""`: none). */
    sourceTemplateId: string
}

/** Not recurring (every saved event, as the form opens it). */
export const NO_RECURRENCE: RecurrenceValues = {
    on: false,
    frequency: "",
    until: "",
}

/**
 * A multi-day event (legacy MultiDayFormHead): one span of days, no
 * segments.
 */
export interface MultiDayValues extends EventBaseValues {
    /** `YYYY-MM-DD` (Jerusalem), first and last day. */
    startDate: string
    endDate: string
    /** One of `MULTI_DAY_TYPES` (`ci_events.type`). */
    type: string
    /** `multi_day_teachers`: tagged (`value` = user id) or typed names. */
    teachers: Tag[]
    /** The template a new event started from (`""`: none). */
    sourceTemplateId: string
}

/** The audience tag a new segment starts with (legacy's initial value). */
export const DEFAULT_TAGS = ["everyone"]

export const emptySegment = (tags: string[] = []): SegmentValues => ({
    type: "",
    start: "",
    end: "",
    teachers: [],
    tags,
})

/**
 * A new single-day event: the first segment tagged "open to everyone", as
 * legacy started it, and hidden only where the deployment hides new events
 * (`VITE_HIDE_EVENTS_FLAG`).
 */
export function emptySingleDay(date: string, hidden = false): SingleDayValues {
    return {
        title: "",
        description: "",
        district: "",
        address: null,
        organisations: [],
        links: [],
        prices: [],
        hidden,
        date,
        segments: [emptySegment(DEFAULT_TAGS)],
        recurrence: NO_RECURRENCE,
        sourceTemplateId: "",
    }
}

/**
 * A new multi-day event, empty as legacy started it; `hidden` is the
 * deployment's flag (`HIDE_NEW_EVENTS`).
 */
export function emptyMultiDay(hidden = false): MultiDayValues {
    return {
        title: "",
        description: "",
        district: "",
        address: null,
        organisations: [],
        links: [],
        prices: [],
        hidden,
        startDate: "",
        endDate: "",
        type: "",
        teachers: [],
        sourceTemplateId: "",
    }
}

/** What only a multi-day event (or template) has. */
export interface MultiDayPart {
    type: string
    teachers: Tag[]
}

/**
 * A single-day form's segments as a multi-day one's type and teachers,
 * when the user turns a new event (or template) into a multi-day one: the
 * first segment's type if a multi-day event can have it, and every
 * segment's teachers, each once.
 */
export function multiDayPartOf(segments: SegmentValues[]): MultiDayPart {
    const type = segments[0]?.type ?? ""
    const teachers = new Map<string, Tag>()
    for (const segment of segments) {
        for (const teacher of segment.teachers) {
            teachers.set(teacher.value || teacher.label, teacher)
        }
    }
    return {
        type: (MULTI_DAY_TYPES as readonly string[]).includes(type) ? type : "",
        teachers: [...teachers.values()],
    }
}

/**
 * A multi-day form's type and teachers as a single-day one's segments:
 * one segment open to everyone, of that type, with those teachers.
 */
export const segmentsOf = ({ type, teachers }: MultiDayPart) => [
    { ...emptySegment(DEFAULT_TAGS), type, teachers },
]

/**
 * A single-day event's values as a multi-day one's, when the user
 * switches the form (a new event's, or a saved one's that doesn't repeat): the shared fields stay, the day becomes the first
 * day, and the segments become a type and teachers (`multiDayPartOf`).
 * The recurrence is dropped (multi-day events don't repeat), and so is
 * the template, which was a single-day one.
 */
export function singleToMultiDay(values: SingleDayValues): MultiDayValues {
    const { date, segments, recurrence, sourceTemplateId, ...base } = values
    return {
        ...base,
        ...multiDayPartOf(segments),
        startDate: date,
        endDate: "",
        sourceTemplateId: "",
    }
}

/** The other way (`singleToMultiDay`): the first day becomes the day. */
export function multiToSingleDay(values: MultiDayValues): SingleDayValues {
    const { startDate, endDate, type, teachers, sourceTemplateId, ...base } =
        values
    return {
        ...base,
        date: startDate,
        segments: segmentsOf({ type, teachers }),
        recurrence: NO_RECURRENCE,
        sourceTemplateId: "",
    }
}

/** The form's error messages (keys of its copy). */
export type EventFormError =
    | "required"
    | "datePast"
    | "notANumber"
    | "invalidUrl"
    | "endBeforeStart"
    | "sameDay"
    | "tooLong"
    | "tooFar"

/**
 * The last day the forms' date pickers offer: a year from today, where
 * legacy's pickers stopped (its `DATE_LIMIT`). Only the picker; legacy
 * validated no upper bound for an event's own days.
 */
export const latestEventDay = (today: string) =>
    addMonths(today, RECURRENCE_MONTHS)

/** Legacy's longest multi-day event: its last day at most 14 days on. */
export const MAX_MULTI_DAY_SPAN = 14

const isBlank = (text: string) => !text.trim()

/** Legacy's rules for the shared fields: title, district, address, lists. */
export function validateBase(
    values: EventBaseValues,
): Record<string, EventFormError> {
    const errors: Record<string, EventFormError> = {}
    if (isBlank(values.title)) errors.title = "required"
    if (!values.district) errors.district = "required"
    if (!values.address) errors.address = "required"
    values.links.forEach((link, index) => {
        if (isBlank(link.title)) errors[`links.${index}.title`] = "required"
        if (isBlank(link.url)) errors[`links.${index}.url`] = "required"
        else if (!isWebUrl(normaliseWebUrl(link.url))) {
            errors[`links.${index}.url`] = "invalidUrl"
        }
    })
    values.prices.forEach((price, index) => {
        if (isBlank(price.title)) errors[`prices.${index}.title`] = "required"
        if (isBlank(price.sum)) errors[`prices.${index}.sum`] = "required"
        else if (!Number.isFinite(Number(price.sum))) {
            errors[`prices.${index}.sum`] = "notANumber"
        }
    })
    return errors
}

/**
 * The single-day form's rules: the shared ones, a date not before today
 * (legacy's picker offered none; an event already dated in the past may
 * keep its day), and every segment's type, start and end.
 */
export function validateSingleDay(
    values: SingleDayValues,
    today: string,
    savedDate?: string,
): FormErrors<EventFormError> {
    const errors = validateBase(values)
    if (!values.date) errors.date = "required"
    else if (values.date < today && values.date !== savedDate) {
        errors.date = "datePast"
    }
    values.segments.forEach((segment, index) => {
        if (!segment.type) errors[`segments.${index}.type`] = "required"
        if (!segment.start) errors[`segments.${index}.start`] = "required"
        if (!segment.end) errors[`segments.${index}.end`] = "required"
    })
    Object.assign(errors, validateRecurrence(values, today))
    return errors
}

/**
 * A recurring event's frequency and end day, both required (legacy's
 * section required the end day, and with no frequency saved nothing at
 * all); the end not before the first day (no repetitions) nor more than
 * `RECURRENCE_MONTHS` from today (legacy's picker stopped there).
 */
function validateRecurrence(
    { recurrence, date }: SingleDayValues,
    today: string,
): Record<string, EventFormError> {
    if (!recurrence.on) return {}
    const errors: Record<string, EventFormError> = {}
    if (!recurrence.frequency) errors["recurrence.frequency"] = "required"
    if (!recurrence.until) errors["recurrence.until"] = "required"
    else if (date && recurrence.until < date) {
        errors["recurrence.until"] = "endBeforeStart"
    } else if (recurrence.until > addMonths(today, RECURRENCE_MONTHS)) {
        errors["recurrence.until"] = "tooFar"
    }
    return errors
}

/**
 * The multi-day form's rules: the shared ones and a type; both days, the
 * first not before today (an event already started may keep its day), and
 * legacy's span: the last day after the first (legacy's message for the
 * same day: that's a single-day event), at most `MAX_MULTI_DAY_SPAN` days
 * on. Legacy didn't check an edit's days; an event whose days are as saved
 * keeps them, whatever its span.
 */
export function validateMultiDay(
    values: MultiDayValues,
    today: string,
    saved?: Pick<MultiDayValues, "startDate" | "endDate">,
): FormErrors<EventFormError> {
    const errors = validateBase(values)
    if (!values.type) errors.type = "required"
    const { startDate, endDate } = values
    if (!startDate) errors.startDate = "required"
    else if (startDate < today && startDate !== saved?.startDate) {
        errors.startDate = "datePast"
    }
    if (!endDate) errors.endDate = "required"
    const asSaved = startDate === saved?.startDate && endDate === saved?.endDate
    if (startDate && endDate && !asSaved) {
        if (endDate < startDate) errors.endDate = "endBeforeStart"
        else if (endDate === startDate) errors.endDate = "sameDay"
        else if (endDate > addDays(startDate, MAX_MULTI_DAY_SPAN)) {
            errors.endDate = "tooLong"
        }
    }
    return errors
}

type EventInsert = Database["public"]["Tables"]["ci_events"]["Insert"]

/** `ci_events.address` as the forms write it. */
export type AddressColumn = {
    label: string
    place_id: string
    en_label?: string
}

export const addressColumn = (address: AddressValue): AddressColumn => ({
    label: address.label,
    place_id: address.placeId,
    ...(address.enLabel ? { en_label: address.enLabel } : {}),
})

const tagColumn = (tags: Tag[]) =>
    tags.map(({ label, value }) => ({ label, value }))

/** The columns of the shared fields (legacy's names and JSON shapes). */
export function baseColumns(values: EventBaseValues) {
    return {
        title: values.title,
        description: values.description,
        district: values.district,
        address: values.address ? addressColumn(values.address) : null,
        organisations: tagColumn(values.organisations),
        links: values.links.map(({ title, url }) => ({
            title,
            link: normaliseWebUrl(url),
        })),
        price: values.prices.map(({ title, sum }) => ({
            title,
            sum: Number(sum),
        })),
        hide: values.hidden,
    }
}

/** A single-day event's segments as stored: instants on its day. */
export function segmentsColumn(
    values: Pick<SingleDayValues, "date" | "segments">,
) {
    return values.segments.map((segment) => ({
        startTime: jerusalemInstant(values.date, segment.start),
        endTime: jerusalemInstant(values.date, segment.end),
        type: segment.type,
        tags: [...segment.tags],
        teachers: tagColumn(segment.teachers),
    }))
}

/**
 * A new single-day event's columns (legacy
 * `formatFormValuesToCreateCIEvent`), but its id, owner and timestamps.
 */
export function singleDayColumns(values: SingleDayValues) {
    return {
        ...baseColumns(values),
        start_date: values.date,
        end_date: values.date,
        segments: segmentsColumn(values),
        type: "",
        is_multi_day: false,
        multi_day_teachers: [],
        source_template_id: values.sourceTemplateId || null,
    } satisfies Partial<EventInsert>
}

/**
 * The days a new event's series falls on, or `null` if it doesn't recur.
 */
export function seriesDates(values: SingleDayValues): string[] | null {
    const { on, frequency, until } = values.recurrence
    if (!on || !frequency || !values.date || !until) return null
    return recurringDates(values.date, until, frequency)
}

/**
 * A new single-day event's rows: one, or one per day of its series (legacy
 * `duplicateEvent`), each with its segments' instants on its own day, so a
 * 19:00 class is 19:00 on both sides of a clock change. The series' shared
 * `recurring_ref_key` and each row's id are the save's to add.
 */
export function newSingleDayColumns(
    values: SingleDayValues,
): ReturnType<typeof singleDayColumns> | ReturnType<typeof singleDayColumns>[] {
    const dates = seriesDates(values)
    if (!dates) return singleDayColumns(values)
    return dates.map((date) => singleDayColumns({ ...values, date }))
}

/** A patch: only the changed columns, the address only if there is one. */
export type Patch<C> = Partial<
    Omit<C, "address"> & {
        address: AddressColumn
    }
>

/**
 * The shared fields' changed columns (a JSON column whole if any part of
 * it changed).
 */
export function basePatch(
    values: EventBaseValues,
    changes: Partial<EventBaseValues>,
): Patch<ReturnType<typeof baseColumns>> {
    const all = baseColumns(values)
    const patch: Patch<typeof all> = {}
    if ("title" in changes) patch.title = all.title
    if ("description" in changes) patch.description = all.description
    if ("district" in changes) patch.district = all.district
    if ("address" in changes && all.address) patch.address = all.address
    if ("organisations" in changes) patch.organisations = all.organisations
    if ("links" in changes) patch.links = all.links
    if ("prices" in changes) patch.price = all.price
    if ("hidden" in changes) patch.hide = all.hide
    return patch
}

/**
 * The columns an edit changes (a JSON column whole if any part of it
 * changed). The day is in every segment's times, so a new date rewrites
 * the segments too.
 */
export function singleDayPatch(
    values: SingleDayValues,
    changes: Partial<SingleDayValues>,
) {
    const all = singleDayColumns(values)
    const patch: Patch<typeof all> = basePatch(values, changes)
    if ("date" in changes) {
        patch.start_date = all.start_date
        patch.end_date = all.end_date
    }
    if ("date" in changes || "segments" in changes) {
        patch.segments = all.segments
    }
    return patch
}

/**
 * What an edit changes on a later event of the same series (legacy
 * EditSingleDayEventForm's batch update, which kept each event's date,
 * cancellation and hide): the changed shared columns, and changed segments
 * with their instants on that event's own day. A new date or hide applies
 * to the edited event only.
 */
export function seriesPatch(
    values: SingleDayValues,
    changes: Partial<SingleDayValues>,
    occurrence: Pick<ManagedEvent, "startDate">,
) {
    const { hide, ...shared } = basePatch(values, changes)
    const patch: Patch<ReturnType<typeof singleDayColumns>> = shared
    if ("segments" in changes) {
        patch.segments = segmentsColumn({
            date: occurrence.startDate,
            segments: values.segments,
        })
    }
    return patch
}

/**
 * A new multi-day event's columns (legacy MultiDayEventForm's insert), but
 * its id, owner and timestamps: no segments, the type on the event, and
 * the teachers in `multi_day_teachers`. Days are stored as days, as the
 * `date` columns hold legacy's (it sent 13:00 on each day).
 */
export function multiDayColumns(values: MultiDayValues) {
    return {
        ...baseColumns(values),
        start_date: values.startDate,
        end_date: values.endDate,
        segments: [],
        type: values.type,
        is_multi_day: true,
        multi_day_teachers: tagColumn(values.teachers),
        source_template_id: values.sourceTemplateId || null,
    } satisfies Partial<EventInsert>
}

/** The columns a multi-day edit changes. */
export function multiDayPatch(
    values: MultiDayValues,
    changes: Partial<MultiDayValues>,
) {
    const all = multiDayColumns(values)
    const patch: Patch<typeof all> = basePatch(values, changes)
    if ("startDate" in changes) patch.start_date = all.start_date
    if ("endDate" in changes) patch.end_date = all.end_date
    if ("type" in changes) patch.type = all.type
    if ("teachers" in changes) {
        patch.multi_day_teachers = all.multi_day_teachers
    }
    return patch
}

/**
 * A saved multi-day event switched to a single-day one in its edit form:
 * the changed shared columns (as `singleDayPatch`), and every column that
 * says what kind of event it is, whole: its day, segments, no type, no
 * multi-day teachers. Its template link stays.
 */
export function toSingleDayPatch(
    values: SingleDayValues,
    changes: Partial<SingleDayValues>,
) {
    const all = singleDayColumns(values)
    return {
        ...basePatch(values, changes),
        start_date: all.start_date,
        end_date: all.end_date,
        segments: all.segments,
        type: all.type,
        is_multi_day: all.is_multi_day,
        multi_day_teachers: all.multi_day_teachers,
    }
}

/** The other way (`toSingleDayPatch`): a single-day event made multi-day. */
export function toMultiDayPatch(
    values: MultiDayValues,
    changes: Partial<MultiDayValues>,
) {
    const all = multiDayColumns(values)
    return {
        ...basePatch(values, changes),
        start_date: all.start_date,
        end_date: all.end_date,
        segments: all.segments,
        type: all.type,
        is_multi_day: all.is_multi_day,
        multi_day_teachers: all.multi_day_teachers,
    }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The user ids tagged on an event (legacy `getCIEventTeachers`: teachers
 * and organisations; typed names aren't ids), each once: its
 * `ci_events_users_junction` rows.
 */
export function taggedUserIds(
    values: Pick<EventBaseValues, "organisations"> & {
        segments?: SegmentValues[]
        teachers?: Tag[]
    },
): string[] {
    const tags = [
        ...(values.segments ?? []).flatMap((segment) => segment.teachers),
        ...(values.teachers ?? []),
        ...values.organisations,
    ]
    return [
        ...new Set(
            tags.map((tag) => tag.value).filter((value) => UUID.test(value)),
        ),
    ]
}

/** A saved event's shared fields as form values. */
export function baseValuesOf(event: ManagedEvent): EventBaseValues {
    return {
        title: event.title,
        description: event.description,
        district: event.district,
        address: event.address.label
            ? {
                  label: event.address.label,
                  placeId: event.address.placeId ?? "",
                  ...(event.address.enLabel
                      ? { enLabel: event.address.enLabel }
                      : {}),
              }
            : null,
        organisations: event.organisations,
        links: event.links.map(({ title, url }) => ({ title, url })),
        prices: event.prices.map(({ title, sum }) => ({
            title,
            sum: Number.isFinite(sum) ? String(sum) : "",
        })),
        hidden: event.hidden,
    }
}

const timeOf = (instant: string) => {
    if (!instant || Number.isNaN(Date.parse(instant))) return ""
    return jerusalemTimeOfDay(instant)
}

/**
 * A saved multi-day event as form values (legacy `CIEventToFormValues`);
 * a legacy Hebrew type label reads as its value (`toPublicEvent`).
 */
export function multiDayValuesOf(event: ManagedEvent): MultiDayValues {
    return {
        ...baseValuesOf(event),
        startDate: event.startDate,
        endDate: event.endDate,
        type: event.type,
        teachers: event.multiDayTeachers,
        sourceTemplateId: "",
    }
}

/** A saved single-day event as form values (legacy `CIEventToFormValues`). */
export function singleDayValuesOf(event: ManagedEvent): SingleDayValues {
    return {
        ...baseValuesOf(event),
        date: event.startDate,
        segments: event.segments.map((segment) => ({
            type: segment.type,
            start: timeOf(segment.startTime),
            end: timeOf(segment.endTime),
            teachers: segment.teachers,
            tags: segment.tags,
        })),
        recurrence: NO_RECURRENCE,
        sourceTemplateId: "",
    }
}

/**
 * A saved event's values in the form of the other kind, as its edit form
 * opens when the user switched it (and as a reload reopens it): the values
 * the switch's changes and draft go over.
 */
export const multiDayValuesOfSingleDay = (event: ManagedEvent) =>
    singleToMultiDay(singleDayValuesOf(event))

/** The other way (`multiDayValuesOfSingleDay`). */
export const singleDayValuesOfMultiDay = (event: ManagedEvent) =>
    multiToSingleDay(multiDayValuesOf(event))

// Drafts come back from device storage: check their shape before use, so
// a draft from another version can't break the form.

const isString = (value: unknown): value is string => typeof value === "string"
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)
export const isListOf = <T>(
    value: unknown,
    item: (value: unknown) => value is T,
) => Array.isArray(value) && value.every(item)
export const isTag = (value: unknown): value is Tag =>
    isRecord(value) && isString(value.label) && isString(value.value)
const isAddress = (value: unknown): value is AddressValue =>
    isRecord(value) &&
    isString(value.label) &&
    isString(value.placeId) &&
    (value.enLabel === undefined || isString(value.enLabel))
export const isSegment = (value: unknown): value is SegmentValues =>
    isRecord(value) &&
    isString(value.type) &&
    isString(value.start) &&
    isString(value.end) &&
    isListOf(value.teachers, isTag) &&
    isListOf(value.tags, isString)
export const hasStrings = (value: unknown, keys: string[]) =>
    isRecord(value) && keys.every((key) => isString(value[key]))

export function isBaseValues(value: unknown): value is EventBaseValues {
    return (
        isRecord(value) &&
        hasStrings(value, ["title", "description", "district"]) &&
        (value.address === null || isAddress(value.address)) &&
        isListOf(value.organisations, isTag) &&
        isListOf(value.links, (link): link is LinkValues =>
            hasStrings(link, ["title", "url"]),
        ) &&
        isListOf(value.prices, (price): price is PriceValues =>
            hasStrings(price, ["title", "sum"]),
        ) &&
        typeof value.hidden === "boolean"
    )
}

const isRecurrenceValues = (value: unknown): value is RecurrenceValues =>
    isRecord(value) &&
    typeof value.on === "boolean" &&
    (value.frequency === "" || isRecurrence(value.frequency)) &&
    isString(value.until)

export const isSingleDayValues = (value: unknown): value is SingleDayValues =>
    isBaseValues(value) &&
    hasStrings(value, ["date", "sourceTemplateId"]) &&
    isListOf(
        (value as unknown as Record<string, unknown>).segments,
        isSegment,
    ) &&
    isRecurrenceValues((value as unknown as Record<string, unknown>).recurrence)

export const isMultiDayValues = (value: unknown): value is MultiDayValues =>
    isBaseValues(value) &&
    hasStrings(value, ["startDate", "endDate", "type", "sourceTemplateId"]) &&
    isListOf((value as unknown as Record<string, unknown>).teachers, isTag)
