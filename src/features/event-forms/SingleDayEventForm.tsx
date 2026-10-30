import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useForm } from "../../app/useForm"
import { useToday } from "../../app/useToday"
import { defineCopy } from "../../lib/copy"
import { COMMON_COPY } from "../../lib/commonCopy"
import { FormAlert, TextField } from "../../ui/form/fields"
import { TagPicker } from "../../ui/form/TagPicker"
import type { ManagedEvent } from "../events/managedEvent"
import { laterInSeries } from "../manage-events/myEvents"
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
    newSingleDayColumns,
    seriesPatch,
    singleDayPatch,
    singleDayValuesOf,
    validateSingleDay,
    type SingleDayValues,
} from "./eventFormValues"
import { HIDE_NEW_EVENTS } from "./eventSave"
import { mySeriesQuery } from "./myEvent"
import { RecurringEventSection } from "./RecurringEventSection"
import { SeriesEditDialog } from "./SeriesEditDialog"
import { useTaggable } from "./taggableBios"
import { useEventSubmit } from "./useEventSubmit"

const COPY = defineCopy({
    he: {
        createTitle: "הוספת אירוע חד יומי",
        editTitle: "עדכון אירוע - חד יומי",
        create: "יצירת אירוע",
        update: "עדכון אירוע",
        seriesLoading: "טוען את שאר ארועי הסדרה…",
        seriesFailed: "לא ניתן לטעון את שאר ארועי הסדרה",
    },
    en: {
        createTitle: "Add a single-day event",
        editTitle: "Update event - single day",
        create: "Create event",
        update: "Update event",
        seriesLoading: "Loading the rest of the series…",
        seriesFailed: "Couldn't load the rest of the series",
    },
    ru: {
        createTitle: "Новое однодневное событие",
        editTitle: "Изменение события - один день",
        create: "Создать событие",
        update: "Обновить событие",
        seriesLoading: "Загружаем остальные события серии…",
        seriesFailed: "Не удалось загрузить остальные события серии",
    },
})

/** Fields holding tagged users (teachers on segments, organisations). */
const TAG_FIELDS = ["segments", "organisations"] as const

/**
 * Legacy SingleDayEventForm (`event` unset: a new event) and
 * EditSingleDayEventForm (`event`): the event's head (title, description,
 * district, address, date, organisations), its segments, links and prices,
 * and whether it is hidden; a new event may recur (a row per day of the
 * series), and an edit of a recurring event asks which later events of
 * its series change too. Unsaved values are kept on the device and
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
    const services = useServices()
    const refKey = event?.recurringRefKey ?? ""
    const seriesQuery = useQuery({
        ...mySeriesQuery(services, userId, refKey),
        enabled: !!userId && !!refKey,
    })
    // A recurring event's edit waits for the rest of its series, so the
    // question of which later events change too is never skipped.
    const seriesReady = !refKey || seriesQuery.data !== undefined
    const later = useMemo(
        () => (event ? laterInSeries(seriesQuery.data ?? [], event) : []),
        [event, seriesQuery.data],
    )
    const submit = useEventSubmit({
        userId,
        event,
        columns: newSingleDayColumns,
        patch: singleDayPatch,
        series: { ready: seriesReady, later, patch: seriesPatch },
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
                    disabled={!seriesReady}
                    before={
                        event ? (
                            !seriesReady && (
                                <SeriesStatus
                                    failed={seriesQuery.isError}
                                    onRetry={() => void seriesQuery.refetch()}
                                />
                            )
                        ) : (
                            <RecurringEventSection
                                recurrence={values.recurrence}
                                date={values.date}
                                today={today}
                                errors={errors}
                                onChange={(recurrenceChange, path) =>
                                    change("recurrence", recurrenceChange, path)
                                }
                                onTouch={touch}
                            />
                        )
                    }
                />
            </form>
            {event && submit.question && (
                <SeriesEditDialog event={event} question={submit.question} />
            )}
        </div>
    )
}

/** While a recurring event's series loads, or after it failed to. */
function SeriesStatus({
    failed,
    onRetry,
}: {
    failed: boolean
    onRetry: () => void
}) {
    const own = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    if (!failed) {
        return (
            <p role="status" className="series-status">
                {own.seriesLoading}
            </p>
        )
    }
    return (
        <div className="series-status">
            <FormAlert kind="error">{own.seriesFailed}</FormAlert>
            <button type="button" className="text-button" onClick={onRetry}>
                {common.retry}
            </button>
        </div>
    )
}
