import { useCallback, useMemo, type ReactNode } from "react"
import { useCopy } from "../../app/language"
import { useForm } from "../../app/useForm"
import { useToday } from "../../app/useToday"
import { useViewer } from "../../app/viewer"
import { defineCopy } from "../../lib/copy"
import type { FormErrors } from "../../lib/form"
import { MULTI_DAY_TYPES } from "../../lib/eventOptions"
import { SelectField, TextField } from "../../ui/form/fields"
import { TagPicker } from "../../ui/form/TagPicker"
import { optionLabel } from "../calendar/eventFormat"
import { EVENT_LOCALES } from "../calendar/eventLocales"
import type { Tag } from "../calendar/publicEvent"
import type { ManagedEvent } from "../events/managedEvent"
import { MULTI_DAY_DRAFT_KEY, MULTI_DAY_EDIT_DRAFT_KEY } from "./draftKeys"
import { useFormDraft } from "../../app/useFormDraft"
import { EVENT_FORM_COPY } from "./eventFormCopy"
import {
    BaseHeadFields,
    ClearFormButton,
    EventFormFooter,
    MultiDaySwitch,
    type FormControls,
} from "./EventFormParts"
import {
    emptyMultiDay,
    isMultiDayValues,
    latestEventDay,
    type EventBaseValues,
    type EventFormError,
    multiDayColumns,
    multiDayPatch,
    multiDayValuesOf,
    multiToSingleDay,
    validateMultiDay,
    type MultiDayValues,
    type SingleDayValues,
} from "./eventFormValues"
import { HIDE_NEW_EVENTS } from "./eventSave"
import { useTaggable, type Taggable } from "./taggableBios"
import { TemplatePicker } from "./TemplatePicker"
import { withMultiDayTemplate, withSingleDayTemplate } from "./templateValues"
import { useCarried } from "./useCarried"
import { useEventSubmit } from "./useEventSubmit"
import { useErrorText } from "./useErrorText"

const COPY = defineCopy({
    he: {
        createTitle: "יצירת אירוע - רב יומי",
        editTitle: "עדכון אירוע - רב יומי",
        create: "יצירת אירוע",
        update: "עדכון אירוע",
    },
    en: {
        createTitle: "Create event - multi-day",
        editTitle: "Update event - multi-day",
        create: "Create event",
        update: "Update event",
    },
    ru: {
        createTitle: "Новое событие - несколько дней",
        editTitle: "Изменение события - несколько дней",
        create: "Создать событие",
        update: "Обновить событие",
    },
})

/** Fields holding tagged users. */
const TAG_FIELDS = ["teachers", "organisations"] as const

/**
 * The span errors legacy showed in the form's alert instead of the generic
 * one; only once the rest of the form was valid (it checked the span
 * after the fields).
 */
const SPAN_ERRORS = new Set(["endBeforeStart", "sameDay", "tooLong"])

/** The span error to name in the alert: the form's only error. */
function spanError(errors: FormErrors<EventFormError>) {
    const shown = Object.entries(errors).filter(([, error]) => error)
    if (shown.length !== 1) return undefined
    const [[path, error]] = shown
    return path === "endDate" && error && SPAN_ERRORS.has(error)
        ? error
        : undefined
}

/**
 * Legacy MultiDayEventForm (`event` unset: a new event) and
 * EditMultiDayEventForm (`event`), with legacy's MultiDayFormHead: title,
 * description, district, address, first and last day, type, teachers and
 * organisations (both tagged or typed); then links, prices and whether it
 * is hidden. A new event can start from one of the user's templates, and
 * can be switched back to a single-day event (`onSwitchKind`, given the
 * values to carry over; so does picking a single-day template). Saved as
 * the single-day form is (translations, drafts,
 * junction rows, every cached list); then `onDone`.
 */
export function MultiDayEventForm({
    userId,
    event,
    onDone,
    onClear,
    carried,
    onSwitchKind,
}: {
    userId: string
    event?: ManagedEvent
    onDone: () => void
    /** Clears a new event's form (it remounts empty). */
    onClear?: () => void
    /** What a new event's form had before the user switched it to this. */
    carried?: MultiDayValues
    /** Switches a new event's form to a single-day one with these values. */
    onSwitchKind?: (values: SingleDayValues) => void
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    const own = useCopy(COPY)
    const viewer = useViewer()
    const today = useToday()

    const saved = useMemo(
        () =>
            event ? multiDayValuesOf(event) : emptyMultiDay(HIDE_NEW_EVENTS),
        [event],
    )
    const validate = useCallback(
        (values: MultiDayValues) =>
            validateMultiDay(values, today, event ? saved : undefined),
        [today, event, saved],
    )
    const form = useForm({ saved, validate })
    const discardDraft = useFormDraft({
        key: event ? MULTI_DAY_EDIT_DRAFT_KEY : MULTI_DAY_DRAFT_KEY,
        userId,
        eventId: event?.id ?? null,
        saved,
        form,
        isValues: isMultiDayValues,
    })
    useCarried(form.restore, carried)
    const taggable = useTaggable(userId)
    const creatorName = "name" in viewer ? viewer.name : ""
    const columns = useCallback(
        (values: MultiDayValues) => ({
            ...multiDayColumns(values),
            // Legacy's multi-day form named its creator here.
            owners: [{ value: userId, label: creatorName }],
        }),
        [userId, creatorName],
    )
    const submit = useEventSubmit({
        userId,
        event,
        columns,
        patch: multiDayPatch,
        tagFields: TAG_FIELDS,
        discardDraft,
        onDone,
    })
    const onSubmit = form.handleSubmit(submit.save)

    const { values, errors, set, touch } = form
    const errorAt = useErrorText(errors)
    const span = spanError(errors)
    const switchTo = (singleDay: SingleDayValues) => {
        discardDraft()
        onSwitchKind?.(singleDay)
    }
    return (
        <div className="event-form">
            <form onSubmit={onSubmit} noValidate>
                {onClear && (
                    <ClearFormButton
                        onClear={() => {
                            discardDraft()
                            onClear()
                        }}
                    >
                        <TemplatePicker
                            userId={userId}
                            multiDay={onSwitchKind ? undefined : true}
                            value={values.sourceTemplateId}
                            onPick={(template) =>
                                template.multiDay
                                    ? form.restore(
                                          withMultiDayTemplate(
                                              values,
                                              template,
                                          ),
                                      )
                                    : switchTo(
                                          withSingleDayTemplate(
                                              multiToSingleDay(values),
                                              template,
                                          ),
                                      )
                            }
                            onClear={() => set("sourceTemplateId", "")}
                        />
                    </ClearFormButton>
                )}
                {onSwitchKind && (
                    <MultiDaySwitch
                        checked
                        onSwitch={() => switchTo(multiToSingleDay(values))}
                    />
                )}
                <MultiDayHeadFields
                    form={form}
                    heading={event ? own.editTitle : own.createTitle}
                    taggable={taggable}
                    dates={
                        <div className="date-fields">
                            <TextField
                                label={copy.startDate}
                                type="date"
                                min={today}
                                max={latestEventDay(today)}
                                value={values.startDate}
                                onChange={(day) => set("startDate", day)}
                                onBlur={() => touch("startDate")}
                                error={errorAt("startDate")}
                            />
                            <TextField
                                label={copy.endDate}
                                type="date"
                                min={values.startDate || today}
                                max={latestEventDay(today)}
                                value={values.endDate}
                                onChange={(day) => set("endDate", day)}
                                onBlur={() => touch("endDate")}
                                error={errorAt("endDate")}
                            />
                        </div>
                    }
                />
                <EventFormFooter
                    form={form}
                    submitLabel={event ? own.update : own.create}
                    saving={form.submitting}
                    failed={submit.failed}
                    gone={submit.gone}
                    invalid={span && copy[span]}
                />
            </form>
        </div>
    )
}

/** What the multi-day forms (events and templates) share. */
type MultiDayFieldValues = EventBaseValues & { type: string; teachers: Tag[] }

/**
 * Legacy MultiDayFormHead, for events and templates: title, description,
 * district, address, the event's `dates` if it has them, type, teachers
 * and organisations (both tagged or typed).
 */
export function MultiDayHeadFields({
    form,
    heading,
    taggable,
    dates,
}: {
    form: FormControls<MultiDayFieldValues>
    heading: string
    taggable: Taggable
    /** The first and last day (events only: templates have no days). */
    dates?: ReactNode
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    const locale = useCopy(EVENT_LOCALES)
    const { values, errors, set, touch } = form
    const errorAt = useErrorText(errors)
    return (
        <section className="event-card card multi-day-form-head-card">
            <BaseHeadFields form={form} heading={heading} />
            {dates}
            <SelectField
                label={copy.eventType}
                labelAsPlaceholder
                hint={copy.multiDayType}
                options={MULTI_DAY_TYPES.map((type) => ({
                    value: type,
                    label: optionLabel(type, locale),
                }))}
                value={values.type}
                onChange={(type) => set("type", type)}
                onBlur={() => touch("type")}
                error={errorAt("type")}
            />
            <TagPicker
                label={copy.teachers}
                options={taggable.teachers}
                selected={values.teachers}
                onChange={(chosen) => set("teachers", chosen)}
                allowTyped
                typedOption={copy.addTyped}
                removeLabel={copy.remove}
            />
            <TagPicker
                label={copy.organisations}
                options={taggable.organisations}
                selected={values.organisations}
                onChange={(chosen) => set("organisations", chosen)}
                allowTyped
                typedOption={copy.addTyped}
                removeLabel={copy.remove}
            />
        </section>
    )
}
