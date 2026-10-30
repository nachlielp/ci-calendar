import { useState } from "react"
import type { Submission } from "../../app/useForm"
import type { ManagedEvent } from "../events/managedEvent"
import { taggedUserIds, type EventBaseValues } from "./eventFormValues"
import {
    EventGoneError,
    useCreateEvent,
    useUpdateEvent,
    type EventColumns,
    type EventEdit,
} from "./eventSave"

// Every event form's save (legacy's forms' `handleSubmit`): a new event is
// inserted with its columns and an id made once per form; an edit sends
// only the changed columns (nothing at all when nothing changed) and
// re-tags the event only when a field holding tags changed. Then the draft
// goes and the form is done. The forms differ only in their columns,
// patch and tag fields.

/** Form values `taggedUserIds` can read the tags of. */
type TaggableValues = EventBaseValues & Parameters<typeof taggedUserIds>[0]

export interface EventSubmitOptions<V extends TaggableValues> {
    userId: string
    /** The event being edited; unset for a new one. */
    event?: ManagedEvent
    /** A new event's columns. */
    columns: (values: V) => EventColumns
    /** An edit's changed columns. */
    patch: (values: V, changes: Partial<V>) => EventEdit["patch"]
    /** The fields holding tagged users: a change to one re-tags the event. */
    tagFields: readonly (keyof V)[]
    /** Removes the form's draft (`useFormDraft`), once saved. */
    discardDraft: () => void
    /** After a save. */
    onDone: () => void
}

/**
 * The save for `form.handleSubmit(save)`, and what the form says about it:
 * `failed` (the form keeps the edits; the error is reported) or `gone`
 * (the edited event is no longer the user's).
 */
export function useEventSubmit<V extends TaggableValues>({
    userId,
    event,
    columns,
    patch,
    tagFields,
    discardDraft,
    onDone,
}: EventSubmitOptions<V>) {
    const [id] = useState(() => crypto.randomUUID())
    const create = useCreateEvent(userId)
    const update = useUpdateEvent(userId)

    const save = async ({ values, changes, isDirty }: Submission<V>) => {
        if (event) {
            if (isDirty) {
                await update.mutateAsync({
                    event,
                    patch: patch(values, changes),
                    tagged: tagFields.some((field) => field in changes)
                        ? taggedUserIds(values)
                        : undefined,
                })
            }
        } else {
            await create.mutateAsync({
                id,
                columns: columns(values),
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
    }
}
