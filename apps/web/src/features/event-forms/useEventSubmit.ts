import { useRef, useState } from "react"
import type { Submission } from "../../app/useForm"
import type { ManagedEvent } from "../events/managedEvent"
import { taggedUserIds, type EventBaseValues } from "./eventFormValues"
import {
    EventGoneError,
    useCreateEvent,
    useUpdateEvent,
    type EventColumns,
    type EventPatch,
} from "./eventSave"

// Every event form's save (legacy's forms' `handleSubmit`): a new event is
// inserted with its columns and an id made once per form (a recurring
// series: a row per day, ids and a `recurring_ref_key` made once per
// form); an edit sends only the changed columns (nothing at all when
// nothing changed) and re-tags the event only when a field holding tags
// changed (an edit switching the event's kind: the kind's columns whole,
// and always re-tagged). An event with later events in its recurring series first asks
// which of them change too (legacy EditRecurringEventDialog). Then the
// draft goes and the form is done. The forms differ only in their columns,
// patch and tag fields.

/** Form values `taggedUserIds` can read the tags of. */
type TaggableValues = EventBaseValues & Parameters<typeof taggedUserIds>[0]

export interface EventSubmitOptions<V extends TaggableValues> {
    userId: string
    /** The event being edited; unset for a new one. */
    event?: ManagedEvent
    /**
     * The edited event is saved as the other kind (single-day or
     * multi-day) than it was: it saves even with no field changed, and
     * re-tags it.
     */
    kindChanged?: boolean
    /** A new event's columns; a list for a recurring series, one per day. */
    columns: (values: V) => EventColumns | EventColumns[]
    /** An edit's changed columns. */
    patch: (values: V, changes: Partial<V>) => EventPatch
    /**
     * The later events of the edited event's recurring series (offered to
     * change too), and what changes on each of them.
     */
    series?: {
        /**
         * The later events are known (loaded); until then an edit doesn't
         * save, rather than skip the question.
         */
        ready: boolean
        later: readonly ManagedEvent[]
        patch: (
            values: V,
            changes: Partial<V>,
            event: ManagedEvent,
        ) => EventPatch
    }
    /** The fields holding tagged users: a change to one re-tags the event. */
    tagFields: readonly (keyof V)[]
    /** Removes the form's draft (`useFormDraft`), once saved. */
    discardDraft: () => void
    /** After a save. */
    onDone: () => void
}

/** The user closed the series question: nothing is saved. */
class SaveCancelled extends Error {
    constructor() {
        super("Save cancelled")
    }
}

/** The question an edit of a recurring event asks before saving. */
export interface SeriesQuestion {
    /** The later events of the series it may change too. */
    later: readonly ManagedEvent[]
    /** Saves, changing the events with these ids too. */
    choose: (ids: readonly string[]) => void
    /** Saves nothing. */
    cancel: () => void
}

/**
 * The save for `form.handleSubmit(save)`, and what the form says about it:
 * `failed` (the form keeps the edits; the error is reported), `gone` (the
 * edited event is no longer the user's) and `question` (while asking which
 * later events of the series change too; the form shows it, and the save
 * waits for the answer).
 */
export function useEventSubmit<V extends TaggableValues>({
    userId,
    event,
    kindChanged = false,
    columns,
    patch,
    series,
    tagFields,
    discardDraft,
    onDone,
}: EventSubmitOptions<V>) {
    const [id] = useState(() => crypto.randomUUID())
    const [seriesKey] = useState(() => crypto.randomUUID())
    // A series' ids, one per day, made as needed and kept: a resend reuses
    // them for the days it still has, and new days get new ones.
    const seriesIds = useRef(new Map<string, string>())
    const idOn = (day: string) => {
        const known = seriesIds.current.get(day)
        if (known) return known
        const made = crypto.randomUUID()
        seriesIds.current.set(day, made)
        return made
    }
    const create = useCreateEvent(userId)
    const update = useUpdateEvent(userId)
    const [question, setQuestion] = useState<SeriesQuestion | null>(null)

    /** The later events to change too: the user's choice, if asked. */
    const chooseLater = async (): Promise<readonly ManagedEvent[]> => {
        const offered = series?.later ?? []
        if (offered.length === 0) return []
        const chosen = await new Promise<readonly string[] | null>((resolve) =>
            setQuestion({
                later: offered,
                choose: resolve,
                cancel: () => resolve(null),
            }),
        )
        setQuestion(null)
        if (!chosen) throw new SaveCancelled()
        return offered.filter((other) => chosen.includes(other.id))
    }

    const save = async ({ values, changes, isDirty }: Submission<V>) => {
        if (event) {
            if (isDirty || kindChanged) {
                if (series && !series.ready) throw new SaveCancelled()
                const later = await chooseLater()
                await update.mutateAsync({
                    event,
                    patch: patch(values, changes),
                    tagged:
                        kindChanged ||
                        tagFields.some((field) => field in changes)
                            ? taggedUserIds(values)
                            : undefined,
                    ...(series && later.length > 0
                        ? {
                              later: {
                                  events: later,
                                  patch: (other) =>
                                      series.patch(values, changes, other),
                              },
                          }
                        : {}),
                })
            }
        } else {
            const all = columns(values)
            await create.mutateAsync({
                events: Array.isArray(all)
                    ? all.map((row) => ({
                          id: idOn(String(row.start_date)),
                          columns: { ...row, recurring_ref_key: seriesKey },
                      }))
                    : [{ id, columns: all }],
                tagged: taggedUserIds(values),
            })
        }
        discardDraft()
        onDone()
    }

    const gone = update.error instanceof EventGoneError
    return {
        save,
        gone,
        failed: (create.isError || update.isError) && !gone,
        question,
    }
}
