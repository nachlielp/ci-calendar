import type { ReactNode } from "react"
import { useCopy } from "../../app/language"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import {
    DISTRICTS,
    EVENT_TYPES,
    TAGS,
} from "@ci-calendar/core/lib/eventOptions"
import type { FormErrors } from "@ci-calendar/core/lib/form"
import {
    ChoiceChips,
    FormAlert,
    SelectField,
    Switch,
    TextAreaField,
    TextField,
} from "../../ui/form/fields"
import { TagPicker, type PickerOption } from "../../ui/form/TagPicker"
import { AddCircleIcon } from "../../ui/icons/AddCircleIcon"
import { DoNotDisturbIcon } from "../../ui/icons/DoNotDisturbIcon"
import { optionLabel, tagLabel } from "../calendar/eventFormat"
import { EVENT_LOCALES } from "../calendar/eventLocales"
import { AddressField } from "./AddressField"
import { EVENT_FORM_COPY } from "./eventFormCopy"
import {
    emptySegment,
    type EventBaseValues,
    type EventFormError,
    type LinkValues,
    type PriceValues,
    type SegmentValues,
} from "./eventFormValues"
import "./EventForm.scss"
import { useErrorText } from "./useErrorText"

// The event forms' parts (legacy's form heads, SingleDayEventFormHead's
// segment card, EventSegmentsForm, AddLinksForm, AddPricesForm,
// EventFromFooter), shared by the single-day and multi-day forms and,
// later, templates. Each takes its value, the form's errors (by path) and
// a change function (`form.update(field, change, path)`), so it works in
// any form on `useForm`; the head and the footer take the form itself, as
// `BaseFormControls` (any `useForm` form of `EventBaseValues` and more).

/**
 * What a form's parts use of a `useForm` form of `V`. Methods, so a form of
 * more fields is one.
 */
export interface FormControls<V> {
    values: V
    errors: FormErrors<EventFormError>
    set<K extends keyof V>(field: K, value: V[K]): void
    update<K extends keyof V>(
        field: K,
        change: (value: V[K]) => V[K],
        path?: string,
    ): void
    touch(path: string): void
}

/**
 * What the shared head and footer use of an event form (`useForm`): its
 * `EventBaseValues` fields.
 */
export type BaseFormControls = FormControls<EventBaseValues>

/** Changes a list field: `change` from its current value; `path` touched. */
export type ListChange<T> = (change: (list: T[]) => T[], path: string) => void

const replaceAt = <T,>(list: T[], index: number, item: T) =>
    list.map((other, at) => (at === index ? item : other))

/** Legacy's outlined add button (`add-button`), with its circle icon. */
export function AddButton({
    onClick,
    children,
}: {
    onClick: () => void
    children: ReactNode
}) {
    return (
        <div className="add-button-container">
            <button type="button" className="add-button" onClick={onClick}>
                <AddCircleIcon className="list-button-icon" />
                <span className="list-button-label">{children}</span>
            </button>
        </div>
    )
}

/** Legacy's outlined remove button (`remove-button`). */
export function RemoveButton({
    onClick,
    children,
}: {
    onClick: () => void
    children: ReactNode
}) {
    return (
        <div className="remove-button-container">
            <button type="button" className="remove-button" onClick={onClick}>
                <DoNotDisturbIcon className="list-button-icon" />
                <span className="list-button-label">{children}</span>
            </button>
        </div>
    )
}

/**
 * One segment: its type, start and end time, teachers (tagged or typed)
 * and audience tags. A course gets legacy's registration notice.
 */
export function SegmentFields({
    segment,
    index,
    errors,
    teachers,
    onChange,
    onTouch,
}: {
    segment: SegmentValues
    index: number
    errors: FormErrors<EventFormError>
    teachers: readonly PickerOption[]
    onChange: (
        change: (segment: SegmentValues) => SegmentValues,
        path: string,
    ) => void
    onTouch: (path: string) => void
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    const locale = useCopy(EVENT_LOCALES)
    const errorAt = useErrorText(errors)
    const path = (field: keyof SegmentValues) => `segments.${index}.${field}`
    const set = <K extends keyof SegmentValues>(
        field: K,
        value: SegmentValues[K],
    ) => onChange((current) => ({ ...current, [field]: value }), path(field))
    // A tag no longer offered (typed in legacy) stays choosable.
    const tags = [...new Set([...TAGS, ...segment.tags])]
    return (
        <>
            <SelectField
                label={copy.eventType}
                labelAsPlaceholder
                options={EVENT_TYPES.map((type) => ({
                    value: type,
                    label: optionLabel(type, locale),
                }))}
                value={segment.type}
                onChange={(type) => set("type", type)}
                onBlur={() => onTouch(path("type"))}
                error={errorAt(path("type"))}
            />
            {segment.type === "course" && (
                <FormAlert kind="info">{copy.courseNotice}</FormAlert>
            )}
            <div className="time-fields">
                <TextField
                    label={copy.startTime}
                    type="time"
                    step={300}
                    value={segment.start}
                    onChange={(start) => set("start", start)}
                    onBlur={() => onTouch(path("start"))}
                    error={errorAt(path("start"))}
                />
                <TextField
                    label={copy.endTime}
                    type="time"
                    step={300}
                    value={segment.end}
                    onChange={(end) => set("end", end)}
                    onBlur={() => onTouch(path("end"))}
                    error={errorAt(path("end"))}
                />
            </div>
            <TagPicker
                label={copy.teachers}
                options={teachers}
                selected={segment.teachers}
                onChange={(chosen) => set("teachers", chosen)}
                allowTyped
                typedOption={copy.addTyped}
                removeLabel={copy.remove}
            />
            <ChoiceChips
                label={copy.tags}
                options={tags.map((tag) => ({
                    value: tag,
                    label: tagLabel(tag, locale),
                }))}
                selected={segment.tags}
                onChange={(chosen) => set("tags", chosen)}
            />
        </>
    )
}

/** Legacy EventSegmentsForm: the segments after the first, add and remove. */
export function MoreSegments({
    segments,
    errors,
    teachers,
    onChange,
    onTouch,
}: {
    segments: SegmentValues[]
    errors: FormErrors<EventFormError>
    teachers: readonly PickerOption[]
    onChange: ListChange<SegmentValues>
    onTouch: (path: string) => void
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    return (
        <section className="event-segments-form">
            {segments.slice(1).map((segment, offset) => {
                const index = offset + 1
                return (
                    <fieldset
                        key={index}
                        className="segment-card card boardered-card"
                    >
                        <legend className="visually-hidden">
                            {copy.segment(index)}
                        </legend>
                        <SegmentFields
                            segment={segment}
                            index={index}
                            errors={errors}
                            teachers={teachers}
                            onChange={(change, path) =>
                                onChange(
                                    (list) =>
                                        replaceAt(
                                            list,
                                            index,
                                            change(list[index]),
                                        ),
                                    path,
                                )
                            }
                            onTouch={onTouch}
                        />
                        <RemoveButton
                            onClick={() =>
                                onChange(
                                    (list) =>
                                        list.filter((_, at) => at !== index),
                                    "segments",
                                )
                            }
                        >
                            {copy.removeSegment}
                        </RemoveButton>
                    </fieldset>
                )
            })}
            <AddButton
                onClick={() =>
                    onChange((list) => [...list, emptySegment()], "segments")
                }
            >
                {copy.addSegment}
            </AddButton>
        </section>
    )
}

/** Legacy AddLinksForm: titled links, shown as buttons on the event. */
export function LinksFields({
    links,
    errors,
    onChange,
    onTouch,
}: {
    links: LinkValues[]
    errors: FormErrors<EventFormError>
    onChange: ListChange<LinkValues>
    onTouch: (path: string) => void
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    const errorAt = useErrorText(errors)
    const set = (index: number, field: keyof LinkValues, value: string) =>
        onChange(
            (list) =>
                replaceAt(list, index, { ...list[index], [field]: value }),
            `links.${index}.${field}`,
        )
    return (
        <section className="add-links-form">
            <hr className="divider" />
            <h3 className="segment-title">
                {copy.links}{" "}
                <span className="segment-description">{copy.linksNote}</span>
            </h3>
            {links.map((link, index) => (
                <div key={index} className="link-card card boardered-card">
                    <TextField
                        label={copy.linkTitle}
                        labelAsPlaceholder
                        value={link.title}
                        onChange={(title) => set(index, "title", title)}
                        onBlur={() => onTouch(`links.${index}.title`)}
                        error={errorAt(`links.${index}.title`)}
                    />
                    <TextField
                        label={copy.linkUrl}
                        labelAsPlaceholder
                        type="url"
                        inputMode="url"
                        dir="ltr"
                        value={link.url}
                        onChange={(url) => set(index, "url", url)}
                        onBlur={() => onTouch(`links.${index}.url`)}
                        error={errorAt(`links.${index}.url`)}
                    />
                    <RemoveButton
                        onClick={() =>
                            onChange(
                                (list) => list.filter((_, at) => at !== index),
                                "links",
                            )
                        }
                    >
                        {copy.removeLink}
                    </RemoveButton>
                </div>
            ))}
            <AddButton
                onClick={() =>
                    onChange(
                        (list) => [...list, { title: "", url: "" }],
                        "links",
                    )
                }
            >
                {copy.addLink}
            </AddButton>
        </section>
    )
}

/** Legacy AddPricesForm: titled prices in shekels. */
export function PricesFields({
    prices,
    errors,
    onChange,
    onTouch,
}: {
    prices: PriceValues[]
    errors: FormErrors<EventFormError>
    onChange: ListChange<PriceValues>
    onTouch: (path: string) => void
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    const errorAt = useErrorText(errors)
    const set = (index: number, field: keyof PriceValues, value: string) =>
        onChange(
            (list) =>
                replaceAt(list, index, { ...list[index], [field]: value }),
            `prices.${index}.${field}`,
        )
    return (
        <section className="add-prices-form">
            <hr className="divider" />
            <h3 className="segment-title">{copy.prices}</h3>
            {prices.map((price, index) => (
                <div key={index} className="price-card card boardered-card">
                    <TextField
                        label={copy.priceTitle}
                        labelAsPlaceholder
                        value={price.title}
                        onChange={(title) => set(index, "title", title)}
                        onBlur={() => onTouch(`prices.${index}.title`)}
                        error={errorAt(`prices.${index}.title`)}
                    />
                    <TextField
                        label={copy.priceSum}
                        labelAsPlaceholder
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={price.sum}
                        onChange={(sum) => set(index, "sum", sum)}
                        onBlur={() => onTouch(`prices.${index}.sum`)}
                        error={errorAt(`prices.${index}.sum`)}
                    />
                    <RemoveButton
                        onClick={() =>
                            onChange(
                                (list) => list.filter((_, at) => at !== index),
                                "prices",
                            )
                        }
                    >
                        {copy.removePrice}
                    </RemoveButton>
                </div>
            ))}
            <AddButton
                onClick={() =>
                    onChange(
                        (list) => [...list, { title: "", sum: "" }],
                        "prices",
                    )
                }
            >
                {copy.addPrice}
            </AddButton>
        </section>
    )
}

/**
 * The top of every event form's head (legacy's form heads): the card's
 * title, then the event's title, description, district and address.
 */
export function BaseHeadFields({
    form,
    heading,
}: {
    form: BaseFormControls
    heading: string
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    const locale = useCopy(EVENT_LOCALES)
    const { values, errors, set, touch } = form
    const errorAt = useErrorText(errors)
    return (
        <>
            <h2 className="segment-title">{heading}</h2>
            <TextField
                label={copy.title}
                labelAsPlaceholder
                value={values.title}
                onChange={(title) => set("title", title)}
                onBlur={() => touch("title")}
                error={errorAt("title")}
            />
            <TextAreaField
                label={copy.description}
                labelAsPlaceholder
                rows={6}
                value={values.description}
                onChange={(text) => set("description", text)}
            />
            <SelectField
                label={copy.district}
                labelAsPlaceholder
                options={DISTRICTS.map((district) => ({
                    value: district,
                    label: optionLabel(district, locale),
                }))}
                value={values.district}
                onChange={(district) => set("district", district)}
                onBlur={() => touch("district")}
                error={errorAt("district")}
            />
            <AddressField
                value={values.address}
                onChange={(address) => set("address", address)}
                onBlur={() => touch("address")}
                error={errorAt("address")}
            />
        </>
    )
}

/**
 * Legacy's "clear form" button (a new event's or template's form only),
 * with what legacy put beside it (`children`: the template picker, or a
 * new template's name).
 */
export function ClearFormButton({
    onClear,
    children,
}: {
    onClear: () => void
    children?: ReactNode
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    return (
        <div className="clear-row">
            {children && <div className="clear-row-field">{children}</div>}
            <button type="button" className="clear-button" onClick={onClear}>
                {copy.clear}
            </button>
        </div>
    )
}

/**
 * A new event's (or template's) switch between single-day and multi-day,
 * under "clear form". The page swaps the form (`onSwitch`), carrying over
 * what the user has filled in.
 */
export function MultiDaySwitch({
    checked,
    onSwitch,
}: {
    checked: boolean
    onSwitch: () => void
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    return (
        <Switch
            label={copy.multiDay}
            checked={checked}
            onChange={onSwitch}
            onText={copy.multiDayOn}
            offText={copy.multiDayOff}
        />
    )
}

/**
 * The end of every event form (legacy EventFromFooter and the submit
 * button): links, prices, the hide (draft) switch, the form's own last
 * part (`before`: the single-day form's recurrence, as legacy put it just
 * before the button), the form's alerts and the submit button. `invalid`
 * replaces the generic invalid-form alert (legacy showed a span error
 * there). Templates have no hide switch (`canHide={false}`).
 */
export function EventFormFooter({
    form,
    submitLabel,
    saving,
    failed,
    gone,
    invalid,
    before,
    disabled = false,
    canHide = true,
    goneText,
}: {
    form: BaseFormControls
    submitLabel: string
    saving: boolean
    failed: boolean
    gone: boolean
    invalid?: string
    before?: ReactNode
    /** Not ready to save (the button is off). */
    disabled?: boolean
    /** Offers the hide (draft) switch: events do, templates don't. */
    canHide?: boolean
    /** What `gone` says, if not that the event is gone. */
    goneText?: string
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    const common = useCopy(COMMON_COPY)
    const { values, errors, set, update, touch } = form
    const hasErrors = Object.values(errors).some(Boolean)
    return (
        <>
            <LinksFields
                links={values.links}
                errors={errors}
                onChange={(listChange, path) =>
                    update("links", listChange, path)
                }
                onTouch={touch}
            />
            <PricesFields
                prices={values.prices}
                errors={errors}
                onChange={(listChange, path) =>
                    update("prices", listChange, path)
                }
                onTouch={touch}
            />
            {canHide && (
                <Switch
                    label={copy.hidden}
                    checked={values.hidden}
                    onChange={(hidden) => set("hidden", hidden)}
                    onText={copy.hiddenOn}
                    offText={copy.hiddenOff}
                />
            )}
            {before}
            {hasErrors && (
                <FormAlert kind="error">{invalid ?? copy.invalid}</FormAlert>
            )}
            {failed && <FormAlert kind="error">{copy.saveFailed}</FormAlert>}
            {gone && (
                <FormAlert kind="error">{goneText ?? copy.gone}</FormAlert>
            )}
            <div className="submit-button-container">
                <button
                    type="submit"
                    className="action-button"
                    disabled={saving || disabled}
                    aria-busy={saving || undefined}
                >
                    {saving ? common.loading : submitLabel}
                </button>
            </div>
        </>
    )
}
