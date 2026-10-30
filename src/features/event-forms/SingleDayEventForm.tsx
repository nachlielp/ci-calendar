import { useCallback, useMemo } from "react"
import { useCopy } from "../../app/language"
import { useForm } from "../../app/useForm"
import { useToday } from "../../app/useToday"
import { defineCopy } from "../../lib/copy"
import { TextField } from "../../ui/form/fields"
import { TagPicker } from "../../ui/form/TagPicker"
import type { ManagedEvent } from "../events/managedEvent"
import { SINGLE_DAY_DRAFT_KEY, SINGLE_DAY_EDIT_DRAFT_KEY } from "./draftKeys"
import { useFormDraft } from "./eventDraft"
import { EVENT_FORM_COPY } from "./eventFormCopy"
import {
    BaseHeadFields,
    ClearFormButton,
    EventFormFooter,
    MoreSegments,
    SegmentFields,
} from "./EventFormParts"
import { useErrorText } from "./useErrorText"
import {
    emptySingleDay,
    isSingleDayValues,
    singleDayColumns,
    singleDayPatch,
    singleDayValuesOf,
    validateSingleDay,
    type SingleDayValues,
} from "./eventFormValues"
import { HIDE_NEW_EVENTS } from "./eventSave"
import { useTaggable } from "./taggableBios"
import { useEventSubmit } from "./useEventSubmit"

const COPY = defineCopy({
    he: {
        createTitle: "הוספת אירוע חד יומי",
        editTitle: "עדכון אירוע - חד יומי",
        create: "יצירת אירוע",
        update: "עדכון אירוע",
    },
    en: {
        createTitle: "Add a single-day event",
        editTitle: "Update event - single day",
        create: "Create event",
        update: "Update event",
    },
    ru: {
        createTitle: "Новое однодневное событие",
        editTitle: "Изменение события - один день",
        create: "Создать событие",
        update: "Обновить событие",
    },
})

/** Fields holding tagged users (teachers on segments, organisations). */
const TAG_FIELDS = ["segments", "organisations"] as const

/**
 * Legacy SingleDayEventForm (`event` unset: a new event) and
 * EditSingleDayEventForm (`event`): the event's head (title, description,
 * district, address, date, organisations), its segments, links and prices,
 * and whether it is hidden. Unsaved values are kept on the device and
 * restored when the form opens again. A save translates the title and
 * looks up the English address (never blocking), stores the event and
 * puts it in every cached list; then `onDone`.
 */
export function SingleDayEventForm({
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
    const today = useToday()

    const saved = useMemo(
        () =>
            event
                ? singleDayValuesOf(event)
                : emptySingleDay("", HIDE_NEW_EVENTS),
        [event],
    )
    const savedDate = event?.startDate
    const validate = useCallback(
        (values: SingleDayValues) =>
            validateSingleDay(values, today, savedDate),
        [today, savedDate],
    )
    const form = useForm({ saved, validate })
    const discardDraft = useFormDraft({
        key: event ? SINGLE_DAY_EDIT_DRAFT_KEY : SINGLE_DAY_DRAFT_KEY,
        userId,
        eventId: event?.id ?? null,
        saved,
        form,
        isValues: isSingleDayValues,
    })
    const taggable = useTaggable(userId)
    const submit = useEventSubmit({
        userId,
        event,
        columns: singleDayColumns,
        patch: singleDayPatch,
        tagFields: TAG_FIELDS,
        discardDraft,
        onDone,
    })
    const onSubmit = form.handleSubmit(submit.save)

    const { values, errors, set, update: change, touch } = form
    const errorAt = useErrorText(errors)
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
                <section className="event-card card">
                    <BaseHeadFields
                        form={form}
                        heading={event ? own.editTitle : own.createTitle}
                    />
                    <TextField
                        label={copy.date}
                        type="date"
                        min={today}
                        value={values.date}
                        onChange={(date) => set("date", date)}
                        onBlur={() => touch("date")}
                        error={errorAt("date")}
                    />
                    <TagPicker
                        label={copy.organisations}
                        options={taggable.organisations}
                        selected={values.organisations}
                        onChange={(chosen) => set("organisations", chosen)}
                        removeLabel={copy.remove}
                    />
                </section>
                <section className="event-card card">
                    <SegmentFields
                        segment={values.segments[0]}
                        index={0}
                        errors={errors}
                        teachers={taggable.teachers}
                        onChange={(segmentChange, path) =>
                            change(
                                "segments",
                                (segments) =>
                                    segments.map((segment, index) =>
                                        index === 0
                                            ? segmentChange(segment)
                                            : segment,
                                    ),
                                path,
                            )
                        }
                        onTouch={touch}
                    />
                </section>
                <MoreSegments
                    segments={values.segments}
                    errors={errors}
                    teachers={taggable.teachers}
                    onChange={(listChange, path) =>
                        change("segments", listChange, path)
                    }
                    onTouch={touch}
                />
                <EventFormFooter
                    form={form}
                    submitLabel={event ? own.update : own.create}
                    saving={form.submitting}
                    failed={submit.failed}
                    gone={submit.gone}
                />
            </form>
        </div>
    )
}
