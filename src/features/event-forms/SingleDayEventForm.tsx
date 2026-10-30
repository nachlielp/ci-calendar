import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useForm } from "../../app/useForm"
import { useToday } from "../../app/useToday"
import { useSession, useViewer } from "../../app/viewer"
import { COMMON_COPY } from "../../lib/commonCopy"
import { defineCopy } from "../../lib/copy"
import { DISTRICTS } from "../../lib/eventOptions"
import {
    FormAlert,
    SelectField,
    Switch,
    TextAreaField,
    TextField,
} from "../../ui/form/fields"
import { TagPicker } from "../../ui/form/TagPicker"
import { optionLabel } from "../calendar/eventFormat"
import { EVENT_LOCALES } from "../calendar/eventLocales"
import type { ManagedEvent } from "../events/managedEvent"
import { AddressField } from "./AddressField"
import { SINGLE_DAY_DRAFT_KEY, SINGLE_DAY_EDIT_DRAFT_KEY } from "./draftKeys"
import { useFormDraft } from "./eventDraft"
import { EVENT_FORM_COPY } from "./eventFormCopy"
import {
    LinksFields,
    MoreSegments,
    PricesFields,
    SegmentFields,
} from "./EventFormParts"
import { useErrorText } from "./useErrorText"
import {
    emptySingleDay,
    isSingleDayValues,
    singleDayColumns,
    singleDayPatch,
    singleDayValuesOf,
    taggedUserIds,
    validateSingleDay,
    type SingleDayValues,
} from "./eventFormValues"
import { EventGoneError, useCreateEvent, useUpdateEvent } from "./eventSave"
import { taggableBiosQuery, taggableOptions } from "./taggableBios"

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

/** New events start hidden where the deployment says so (legacy's flag). */
const HIDE_NEW_EVENTS = import.meta.env.VITE_HIDE_EVENTS_FLAG === "true"

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
    const services = useServices()
    const copy = useCopy(EVENT_FORM_COPY)
    const own = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const locale = useCopy(EVENT_LOCALES)
    const viewer = useViewer()
    const session = useSession()
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
    const [id] = useState(() => crypto.randomUUID())
    const create = useCreateEvent(userId)
    const update = useUpdateEvent(userId)

    const bios = useQuery({
        ...taggableBiosQuery(services, userId),
        enabled: !!userId,
    })
    const taggable = useMemo(
        () =>
            taggableOptions(bios.data ?? [], {
                id: userId,
                role: viewer.role,
                email: session?.user.email ?? "",
            }),
        [bios.data, userId, viewer, session],
    )

    const onSubmit = form.handleSubmit(async ({ values, changes, isDirty }) => {
        if (event) {
            if (isDirty) {
                await update.mutateAsync({
                    event,
                    patch: singleDayPatch(values, changes),
                    tagged:
                        "segments" in changes || "organisations" in changes
                            ? taggedUserIds(values)
                            : undefined,
                })
            }
        } else {
            await create.mutateAsync({
                id,
                columns: singleDayColumns(values),
                tagged: taggedUserIds(values),
            })
        }
        discardDraft()
        onDone()
    })

    const { values, errors, set, update: change, touch } = form
    const errorAt = useErrorText(errors)
    const invalid = Object.values(errors).some(Boolean)
    const gone = update.error instanceof EventGoneError
    const failed = (create.isError || update.isError) && !gone
    const saving = form.submitting
    return (
        <div className="event-form">
            <form onSubmit={onSubmit} noValidate>
                {onClear && (
                    <div className="clear-row">
                        <button
                            type="button"
                            className="clear-button"
                            onClick={() => {
                                discardDraft()
                                onClear()
                            }}
                        >
                            {copy.clear}
                        </button>
                    </div>
                )}
                <section className="event-card card">
                    <h2 className="segment-title">
                        {event ? own.editTitle : own.createTitle}
                    </h2>
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
                <LinksFields
                    links={values.links}
                    errors={errors}
                    onChange={(listChange, path) =>
                        change("links", listChange, path)
                    }
                    onTouch={touch}
                />
                <PricesFields
                    prices={values.prices}
                    errors={errors}
                    onChange={(listChange, path) =>
                        change("prices", listChange, path)
                    }
                    onTouch={touch}
                />
                <Switch
                    label={copy.hidden}
                    checked={values.hidden}
                    onChange={(hidden) => set("hidden", hidden)}
                    onText={copy.hiddenOn}
                    offText={copy.hiddenOff}
                />
                {invalid && <FormAlert kind="error">{copy.invalid}</FormAlert>}
                {failed && (
                    <FormAlert kind="error">{copy.saveFailed}</FormAlert>
                )}
                {gone && <FormAlert kind="error">{copy.gone}</FormAlert>}
                <div className="submit-button-container">
                    <button
                        type="submit"
                        className="action-button"
                        disabled={saving}
                        aria-busy={saving || undefined}
                    >
                        {saving
                            ? common.loading
                            : event
                              ? own.update
                              : own.create}
                    </button>
                </div>
            </form>
        </div>
    )
}
