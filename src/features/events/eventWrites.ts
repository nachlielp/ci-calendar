import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sessionOf } from "../../app/auth/personal"
import { useServices } from "../../app/services"
import { applyEventChanges, refreshEventQueries } from "./eventCache"
import {
    MANAGED_EVENT_COLUMNS,
    toManagedEvents,
    type ManagedEvent,
} from "./managedEvent"

// Hide, cancel and delete (legacy HideEventButton, CancelledEventButton,
// DeleteEventButton), for the user's own events (manage-events) and, with
// `ownOnly: false`, an admin's moderation. Each is one conditional write:
// hide and cancel go only to events still in the state the user saw, so a
// change made elsewhere meanwhile isn't flipped back; with `ownOnly` (the
// default) only to the user's own (`user_id`, as RLS checks too). The rows
// the server returns update every cached event query (`applyEventChanges`);
// if some asked-for event didn't come back (deleted or changed elsewhere),
// every event query is refetched (`refreshEventQueries`).

export interface EventWriteOptions {
    /**
     * Only the signed-in user's own events (`.eq("user_id", userId)`).
     * True by default; admin pages pass false (RLS lets admins write any).
     */
    ownOnly?: boolean
}

export interface HideChange {
    /** The event and the later ones of its series the user chose. */
    events: readonly ManagedEvent[]
    hide: boolean
}

export interface CancelChange {
    event: ManagedEvent
    cancel: boolean
    /** The cancellation note (legacy's, up to 80 characters); "" to un-cancel. */
    text: string
}

/** Most a cancellation note may hold (legacy's input). */
export const CANCELLED_TEXT_MAX = 80

const ids = (events: readonly ManagedEvent[]) => events.map(({ id }) => id)

/**
 * The shared part of the writes: waits for the session, scopes the write
 * to the user's events (`ownOnly`), applies the response to the cache, and
 * refreshes every event query if fewer events came back than were asked.
 */
function useEventWrite<Variables, Result>(
    userId: string,
    { ownOnly = true }: EventWriteOptions,
    source: string,
    write: (
        own: <Q extends { eq(column: "user_id", value: string): Q }>(
            query: Q,
        ) => Q,
        variables: Variables,
    ) => PromiseLike<{
        data: Result[] | null
        error: { message: string } | null
    }>,
    toChange: (
        rows: Result[],
    ) => { saved: ManagedEvent[] } | { deleted: string[] },
    asked: (variables: Variables) => number,
) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (variables: Variables) => {
            await sessionOf(services, userId)
            const own = <Q extends { eq(column: "user_id", value: string): Q }>(
                query: Q,
            ) => (ownOnly ? query.eq("user_id", userId) : query)
            const { data, error } = await write(own, variables)
            if (error) throw new Error(error.message)
            return toChange(data ?? [])
        },
        onSuccess: (change, variables) => {
            applyEventChanges(queryClient, services.now(), change)
            const got =
                "saved" in change ? change.saved.length : change.deleted.length
            if (got < asked(variables)) refreshEventQueries(queryClient)
        },
        onError: (error) => services.telemetry.captureError(error, { source }),
    })
}

/** Hides or shows events (legacy's series choice included). */
export function useSetHidden(userId: string, options: EventWriteOptions = {}) {
    const { data } = useServices()
    return useEventWrite(
        userId,
        options,
        "event-hide",
        (own, { events, hide }: HideChange) =>
            own(data.from("ci_events").update({ hide }).in("id", ids(events)))
                .eq("hide", !hide)
                .select(MANAGED_EVENT_COLUMNS),
        (rows) => ({ saved: toManagedEvents(rows) }),
        ({ events }) => events.length,
    )
}

/**
 * Cancels an event with a note, or un-cancels it (and clears the note), as
 * legacy did. Only the one event: legacy offered no series choice here.
 */
export function useSetCancelled(
    userId: string,
    options: EventWriteOptions = {},
) {
    const { data } = useServices()
    return useEventWrite(
        userId,
        options,
        "event-cancel",
        (own, { event, cancel, text }: CancelChange) => {
            const write = own(
                data
                    .from("ci_events")
                    .update({
                        cancelled: cancel,
                        cancelled_text: cancel
                            ? text.trim().slice(0, CANCELLED_TEXT_MAX)
                            : "",
                    })
                    .eq("id", event.id),
            )
            // `cancelled` may be null on old rows: null counts as not.
            return (
                cancel
                    ? write.not("cancelled", "is", true)
                    : write.eq("cancelled", true)
            ).select(MANAGED_EVENT_COLUMNS)
        },
        (rows) => ({ saved: toManagedEvents(rows) }),
        () => 1,
    )
}

/** Deletes events (legacy's series choice included). */
export function useDeleteEvents(
    userId: string,
    options: EventWriteOptions = {},
) {
    const { data } = useServices()
    return useEventWrite(
        userId,
        options,
        "event-delete",
        (own, events: readonly ManagedEvent[]) =>
            own(data.from("ci_events").delete().in("id", ids(events))).select(
                "id",
            ),
        (rows: { id: string }[]) => ({ deleted: rows.map(({ id }) => id) }),
        (events) => events.length,
    )
}
