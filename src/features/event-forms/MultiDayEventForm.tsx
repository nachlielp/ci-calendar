import { useCallback, useMemo } from "react"
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
import type { ManagedEvent } from "../events/managedEvent"
import { MULTI_DAY_DRAFT_KEY, MULTI_DAY_EDIT_DRAFT_KEY } from "./draftKeys"
import { useFormDraft } from "./eventDraft"
import { EVENT_FORM_COPY } from "./eventFormCopy"
import {
    BaseHeadFields,
    ClearFormButton,
    EventFormFooter,
} from "./EventFormParts"
import {
    emptyMultiDay,
    isMultiDayValues,
    type EventFormError,
    multiDayColumns,
    multiDayPatch,
    multiDayValuesOf,
    validateMultiDay,
    type MultiDayValues,
} from "./eventFormValues"
import { HIDE_NEW_EVENTS } from "./eventSave"
import { useTaggable } from "./taggableBios"
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
 * is hidden. Saved as the single-day form is (translations, drafts,
 * junction rows, every cached list); then `onDone`.
 */
export function MultiDayEventForm({
    userId,
    event,
    onDone,
    onClear,
}: {
    userId: string
    event?: ManagedEvent
    onDone: () => void
    /** Clears a new event's form (it remounts empty). */
    onClear?: () => void
}) {
    const copy = useCopy(EVENT_FORM_COPY)
    const own = useCopy(COPY)
    const locale = useCopy(EVENT_LOCALES)
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
    return (
        <div className="event-form">
            <form onSubmit={onSubmit} noValidate>
                {onClear && (
                    <ClearFormButton
                        onClear={() => {
                            discardDraft()
                            onClear()
                        }}
                    />
                )}
                <section className="event-card card multi-day-form-head-card">
                    <BaseHeadFields
                        form={form}
                        heading={event ? own.editTitle : own.createTitle}
                    />
                    <div className="date-fields">
                        <TextField
                            label={copy.startDate}
                            type="date"
                            min={today}
                            value={values.startDate}
                            onChange={(day) => set("startDate", day)}
                            onBlur={() => touch("startDate")}
                            error={errorAt("startDate")}
                        />
                        <TextField
                            label={copy.endDate}
                            type="date"
                            min={values.startDate || today}
                            value={values.endDate}
                            onChange={(day) => set("endDate", day)}
                            onBlur={() => touch("endDate")}
                            error={errorAt("endDate")}
                        />
                    </div>
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
