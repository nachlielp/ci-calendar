import { useCallback, useEffect, useRef } from "react"
import { useServices } from "../../app/services"
import type { Form } from "../../app/useForm"
import type { FormValues } from "../../lib/form"

// Unsaved event forms kept on the device (legacy `saveDraftEvent`, which
// kept the create forms' values in localStorage on every change): restored
// as unsaved changes when the form opens again, e.g. after a reload, and
// removed once the event is saved or the form is clean again. Only the
// changed fields are kept, and restored over the saved values as they are
// then: a field the user didn't touch takes the server's newer value. The
// keys are personal (./draftKeys.ts), so sign-out removes them.

/** What a draft key holds. */
interface StoredDraft {
    userId: string
    /** The event an edit form was editing; `null` for a new event. */
    eventId: string | null
    /** The fields that differed from the saved values. */
    changes: Record<string, unknown>
}

/**
 * Keeps `form`'s changes under `key` while it has any (and removes them
 * when it is clean again), and restores them over `saved` when it mounts,
 * if the draft is the same user's for the same event and `isValues`
 * accepts the result. Returns `discard`, which removes the draft (after a
 * save, or when the user clears the form).
 */
export function useFormDraft<V extends FormValues>({
    key,
    userId,
    eventId = null,
    saved,
    form,
    isValues,
}: {
    key: string
    userId: string
    eventId?: string | null
    /** The form's saved values, which the changes go over. */
    saved: V
    form: Pick<Form<V, string>, "changes" | "isDirty" | "restore">
    isValues: (value: unknown) => value is V
}) {
    const { storage } = useServices()
    const { changes, isDirty, restore } = form
    const restored = useRef(false)
    const kept = useRef(false)

    useEffect(() => {
        if (restored.current) return
        restored.current = true
        const draft = read(storage.getItem(key))
        if (!draft || draft.userId !== userId || draft.eventId !== eventId) {
            return
        }
        const fields = Object.keys(draft.changes).filter((field) =>
            Object.hasOwn(saved, field),
        )
        const values = {
            ...saved,
            ...Object.fromEntries(
                fields.map((field) => [field, draft.changes[field]]),
            ),
        }
        if (isValues(values)) restore(values)
    }, [storage, key, userId, eventId, saved, isValues, restore])

    const discard = useCallback(() => {
        kept.current = false
        try {
            storage.removeItem(key)
        } catch {
            // Blocked storage holds nothing.
        }
    }, [storage, key])

    useEffect(() => {
        if (!userId) return
        if (!isDirty) {
            // Clean again (the edits undone, or saved): no draft. Not at
            // mount, before a draft for another event could be restored.
            if (kept.current) discard()
            return
        }
        const draft: StoredDraft = { userId, eventId, changes }
        try {
            storage.setItem(key, JSON.stringify(draft))
            kept.current = true
        } catch {
            // Full or blocked storage: the form still works, unsaved.
        }
    }, [storage, key, userId, eventId, changes, isDirty, discard])

    return discard
}

function read(stored: string | null): StoredDraft | null {
    if (!stored) return null
    try {
        const draft: unknown = JSON.parse(stored)
        if (
            typeof draft === "object" &&
            draft !== null &&
            "userId" in draft &&
            "eventId" in draft &&
            "changes" in draft &&
            typeof draft.changes === "object" &&
            draft.changes !== null
        ) {
            return draft as StoredDraft
        }
    } catch {
        // Not ours.
    }
    return null
}
