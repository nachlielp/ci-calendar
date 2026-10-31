import type { Database } from "../../data/database.types"
import type { FormErrors } from "../../lib/form"
import type { Tag } from "../calendar/publicEvent"
import { toPublicEvent } from "../calendar/publicEvent"
import {
    baseColumns,
    basePatch,
    baseValuesOf,
    DEFAULT_TAGS,
    emptySegment,
    hasStrings,
    isBaseValues,
    isListOf,
    isSegment,
    isTag,
    segmentsColumn,
    singleDayValuesOf,
    validateBase,
    type EventBaseValues,
    type EventFormError,
    type MultiDayValues,
    type Patch,
    type SegmentValues,
    type SingleDayValues,
} from "./eventFormValues"

// Templates (legacy templateService, utilService's `…TemplateToFormValues`
// and `formatFormValuesToCreateCITemplate`/`…EditCITemplate`), as pure data
// and functions: a `templates` row read as a `Template`, the template forms'
// values, their rules and the columns they are saved as, and what starting
// a new event from a template fills in. A template is an event without its
// days, hide and cancellation, plus a name.

type TemplateRow = Database["public"]["Tables"]["templates"]["Row"]

/** The `templates` columns the chooser, the pickers and the forms use. */
export const TEMPLATE_COLUMNS =
    "id, name, created_at, is_multi_day, title, description, district, address, organisations, links, price, segments, type, multi_day_teachers"

export type TemplateListRow = Pick<
    TemplateRow,
    | "id"
    | "name"
    | "created_at"
    | "is_multi_day"
    | "title"
    | "description"
    | "district"
    | "address"
    | "organisations"
    | "links"
    | "price"
    | "segments"
    | "type"
    | "multi_day_teachers"
>

/** What a template fills in: an event's fields but its days and hide. */
export interface TemplateContent extends Omit<EventBaseValues, "hidden"> {
    /** A single-day template's segments (times as `HH:mm`). */
    segments: SegmentValues[]
    /** A multi-day template's type. */
    type: string
    /** A multi-day template's teachers (`multi_day_teachers`). */
    teachers: Tag[]
}

export interface Template {
    id: string
    name: string
    /** Legacy `is_multi_day`: which form it fills, and which form edits it. */
    multiDay: boolean
    createdAt: string
    content: TemplateContent
}

/**
 * A `templates` row as a `Template`. Its JSON columns are read as an
 * event's are (`toPublicEvent`, defensively), so a template fills a form
 * just as a saved event does.
 */
export function toTemplate(row: TemplateListRow): Template {
    const event = toPublicEvent({
        ...row,
        short_id: null,
        title: row.title ?? "",
        lng_titles: null,
        start_date: "",
        end_date: null,
        cancelled: false,
        cancelled_text: null,
        type: row.type ?? "",
        district: row.district ?? "",
        description: row.description ?? "",
        segments: row.segments ?? [],
        multi_day_teachers: row.multi_day_teachers ?? [],
        links: row.links ?? [],
        price: row.price ?? [],
        address: row.address ?? {},
        ci_events_users_junction: [],
    })
    const managed = {
        ...event,
        hidden: false,
        ownerId: "",
        multiDay: row.is_multi_day ?? false,
        recurringRefKey: null,
    }
    const { hidden, ...base } = baseValuesOf(managed)
    return {
        id: row.id,
        name: row.name ?? "",
        multiDay: row.is_multi_day ?? false,
        createdAt: row.created_at,
        content: {
            ...base,
            segments: singleDayValuesOf(managed).segments,
            type: event.type,
            teachers: event.multiDayTeachers,
        },
    }
}

/** Newest first, as legacy listed them (`getTemplates`). */
export const byNewest = (a: Template, b: Template) =>
    Date.parse(b.createdAt) - Date.parse(a.createdAt)

// --- The template forms ---------------------------------------------------

/**
 * What the template forms edit. `hidden` is there for the shared form
 * parts only: a template has no hide, so it stays `false` and is never
 * written.
 */
interface TemplateBaseValues extends EventBaseValues {
    /** The template's name (legacy "שם התבנית"). */
    name: string
}

/** Legacy SingleDayEventForm with `isTemplate`: no day, no recurrence. */
export interface SingleDayTemplateValues extends TemplateBaseValues {
    segments: SegmentValues[]
}

/** Legacy MultiDayEventForm with `isTemplate`: no days. */
export interface MultiDayTemplateValues extends TemplateBaseValues {
    type: string
    teachers: Tag[]
}

const emptyBase = (): TemplateBaseValues => ({
    name: "",
    title: "",
    description: "",
    district: "",
    address: null,
    organisations: [],
    links: [],
    prices: [],
    hidden: false,
})

/** A new single-day template, its first segment "open to everyone". */
export const emptySingleDayTemplate = (): SingleDayTemplateValues => ({
    ...emptyBase(),
    segments: [emptySegment(DEFAULT_TAGS)],
})

export const emptyMultiDayTemplate = (): MultiDayTemplateValues => ({
    ...emptyBase(),
    type: "",
    teachers: [],
})

const baseOf = (template: Template): TemplateBaseValues => {
    const { segments, type, teachers, ...base } = template.content
    return { ...base, name: template.name, hidden: false }
}

/** A saved single-day template as its edit form's values. */
export const singleDayTemplateValuesOf = (
    template: Template,
): SingleDayTemplateValues => ({
    ...baseOf(template),
    segments: template.content.segments.length
        ? template.content.segments
        : [emptySegment(DEFAULT_TAGS)],
})

/** A saved multi-day template as its edit form's values. */
export const multiDayTemplateValuesOf = (
    template: Template,
): MultiDayTemplateValues => ({
    ...baseOf(template),
    type: template.content.type,
    teachers: template.content.teachers,
})

/** The template forms' shared rules: the event's, and a name. */
function validateTemplateBase(values: TemplateBaseValues) {
    const errors = validateBase(values)
    if (!values.name.trim()) errors.name = "required"
    return errors
}

/**
 * A single-day template's rules: the event's (title, district, address,
 * each segment's type, start and end, links and prices) without the day,
 * plus a name (legacy required it).
 */
export function validateSingleDayTemplate(
    values: SingleDayTemplateValues,
): FormErrors<EventFormError> {
    const errors = validateTemplateBase(values)
    values.segments.forEach((segment, index) => {
        if (!segment.type) errors[`segments.${index}.type`] = "required"
        if (!segment.start) errors[`segments.${index}.start`] = "required"
        if (!segment.end) errors[`segments.${index}.end`] = "required"
    })
    return errors
}

/** A multi-day template's rules: the event's without its days, and a name. */
export function validateMultiDayTemplate(
    values: MultiDayTemplateValues,
): FormErrors<EventFormError> {
    const errors = validateTemplateBase(values)
    if (!values.type) errors.type = "required"
    return errors
}

type TemplateInsert = Database["public"]["Tables"]["templates"]["Insert"]

/** The shared columns, as an event's but without `hide`. */
function templateBaseColumns(values: TemplateBaseValues) {
    const { hide, ...columns } = baseColumns(values)
    return { name: values.name.trim(), ...columns }
}

/**
 * A new single-day template's columns (legacy
 * `formatFormValuesToCreateCITemplate`), but its id, owner and timestamps.
 * Its segments' times are instants on `today` (legacy's were on the day it
 * was saved too); readers use only their time of day.
 */
export function singleDayTemplateColumns(
    values: SingleDayTemplateValues,
    today: string,
) {
    return {
        ...templateBaseColumns(values),
        segments: segmentsColumn({ date: today, segments: values.segments }),
        type: "",
        is_multi_day: false,
        multi_day_teachers: [],
    } satisfies Partial<TemplateInsert>
}

/** A new multi-day template's columns (legacy MultiDayEventForm's). */
export function multiDayTemplateColumns(values: MultiDayTemplateValues) {
    return {
        ...templateBaseColumns(values),
        segments: [],
        type: values.type,
        is_multi_day: true,
        multi_day_teachers: values.teachers.map(({ label, value }) => ({
            label,
            value,
        })),
    } satisfies Partial<TemplateInsert>
}

export type TemplateColumns =
    | ReturnType<typeof singleDayTemplateColumns>
    | ReturnType<typeof multiDayTemplateColumns>

/** An edit's changed columns. */
export type TemplatePatch = Patch<TemplateColumns>

/** The shared fields' changed columns, and the name. */
function templateBasePatch(
    values: TemplateBaseValues,
    changes: Partial<TemplateBaseValues>,
): TemplatePatch {
    const { hide, ...patch } = basePatch(values, changes)
    return "name" in changes ? { name: values.name.trim(), ...patch } : patch
}

/** The columns a single-day template's edit changes. */
export function singleDayTemplatePatch(
    values: SingleDayTemplateValues,
    changes: Partial<SingleDayTemplateValues>,
    today: string,
): TemplatePatch {
    const patch = templateBasePatch(values, changes)
    return "segments" in changes
        ? {
              ...patch,
              segments: segmentsColumn({
                  date: today,
                  segments: values.segments,
              }),
          }
        : patch
}

/** The columns a multi-day template's edit changes. */
export function multiDayTemplatePatch(
    values: MultiDayTemplateValues,
    changes: Partial<MultiDayTemplateValues>,
): TemplatePatch {
    const all = multiDayTemplateColumns(values)
    const patch = templateBasePatch(values, changes)
    if ("type" in changes) patch.type = all.type
    if ("teachers" in changes) {
        patch.multi_day_teachers = all.multi_day_teachers
    }
    return patch
}

const hasName = (value: unknown) => hasStrings(value, ["name"])

export const isSingleDayTemplateValues = (
    value: unknown,
): value is SingleDayTemplateValues =>
    isBaseValues(value) &&
    hasName(value) &&
    isListOf((value as unknown as Record<string, unknown>).segments, isSegment)

export const isMultiDayTemplateValues = (
    value: unknown,
): value is MultiDayTemplateValues =>
    isBaseValues(value) &&
    hasStrings(value, ["name", "type"]) &&
    isListOf((value as unknown as Record<string, unknown>).teachers, isTag)

// --- Starting an event from a template ------------------------------------

/** The shared fields a template fills in. */
const filledBase = ({
    title,
    description,
    district,
    address,
    organisations,
    links,
    prices,
}: TemplateContent) => ({
    title,
    description,
    district,
    address,
    organisations,
    links,
    prices,
})

/**
 * A new single-day event started from `template` (legacy
 * `singleDayTemplateToFormValues`, chosen in the form's "בחירת תבנית"):
 * its fields and segments replace the form's; the day, the recurrence and
 * the hide switch stay as they are (legacy's mapping set an `event-dates`
 * value the form's day field never read). The event remembers the
 * template (`source_template_id`).
 */
export function withSingleDayTemplate(
    values: SingleDayValues,
    template: Template,
): SingleDayValues {
    return {
        ...values,
        ...filledBase(template.content),
        segments: template.content.segments.length
            ? template.content.segments
            : [emptySegment(DEFAULT_TAGS)],
        sourceTemplateId: template.id,
    }
}

/**
 * A new multi-day event started from `template` (legacy
 * `multiDayTemplateToFormValues`): its fields, type and teachers replace
 * the form's; the days and the hide switch stay.
 */
export function withMultiDayTemplate(
    values: MultiDayValues,
    template: Template,
): MultiDayValues {
    return {
        ...values,
        ...filledBase(template.content),
        type: template.content.type,
        teachers: template.content.teachers,
        sourceTemplateId: template.id,
    }
}
