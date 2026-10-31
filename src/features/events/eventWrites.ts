import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sessionOf } from "../../app/auth/personal"
import { useServices } from "../../app/services"
import type { DataClient } from "../../data/client"
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
// change made elsewhere meanwhile isn't flipped back; every write goes only
// to events still owned as they were loaded (`user_id`: the user with
// `ownOnly`, the default; else the events' own `ownerId`, as the edit form
// does). The rows the server returns update every cached event query
// (`applyEventChanges`); if fewer events come back than were asked for
// (changed or deleted elsewhere, or a write RLS refused: admins' writes on
// others' events aren't proven against the live policies), every event
// query is refetched and the write fails with `EventsChangedError`, which
// the dialog shows: never a silent success.

export interface EventWriteOptions {
    /**
     * Only the signed-in user's own events (`.eq("user_id", userId)`).
     * True by default; admin pages pass false (RLS lets admins write any),
     * and the write is then scoped to the events' loaded owner.
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

/**
 * Some of the events asked for weren't written: changed or deleted
 * meanwhile, or not allowed. What was written is applied, and every event
 * list is read again.
 */
export class EventsChangedError extends Error {
    constructor() {
        super("Fewer events written than asked for")
    }
}

const ids = (events: readonly ManagedEvent[]) => events.map(({ id }) => id)

type Owned = <Q extends { eq(column: "user_id", value: string): Q }>(
    query: Q,
) => Q

/**
 * The shared part of the writes: waits for the session, scopes the write
 * to the events' owner (`ownOnly`: the user; else the events' own, which
 * are one series' or one event, so one owner), applies the response to the
 * cache, and fails with `EventsChangedError` (after refreshing every event
 * query) if fewer events came back than were asked.
 */
function useEventWrite<Variables, Result>(
    userId: string,
    { ownOnly = true }: EventWriteOptions,
    source: string,
    events: (variables: Variables) => readonly ManagedEvent[],
    write: (
        owned: Owned,
        variables: Variables,
    ) => PromiseLike<{
        data: Result[] | null
        error: { message: string } | null
    }>,
    toChange: (
        rows: Result[],
    ) => { saved: ManagedEvent[] } | { deleted: string[] },
) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (variables: Variables) => {
            await sessionOf(services, userId)
            const asked = events(variables)
            const owner = ownOnly ? userId : (asked[0]?.ownerId ?? "")
            const owned: Owned = (query) => query.eq("user_id", owner)
            const { data, error } = await write(owned, variables)
            if (error) throw new Error(error.message)
            const change = toChange(data ?? [])
            applyEventChanges(queryClient, services.now(), change)
            const got =
                "saved" in change ? change.saved.length : change.deleted.length
            if (got < asked.length) {
                refreshEventQueries(queryClient)
                throw new EventsChangedError()
            }
            return change
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
        ({ events }: HideChange) => events,
        (owned, { events, hide }) =>
            owned(data.from("ci_events").update({ hide }).in("id", ids(events)))
                .eq("hide", !hide)
                .select(MANAGED_EVENT_COLUMNS),
        (rows) => ({ saved: toManagedEvents(rows) }),
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
        ({ event }: CancelChange) => [event],
        (owned, { event, cancel, text }) => {
            const write = owned(
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
    )
}

/**
 * Deletes events (legacy's series choice included). Legacy deleted the
 * event alone, relying on the junction's foreign key
 * (`ci_events_users_junction_ci_event_id_fkey`) to cascade; its delete rule
 * isn't known from the repo (docs/database-schema.md shows none, i.e. no
 * action), so a delete the key refuses (`23503`) removes the events'
 * junction rows (their teacher tags) and is sent once more.
 */
export function useDeleteEvents(
    userId: string,
    options: EventWriteOptions = {},
) {
    const { data } = useServices()
    return useEventWrite(
        userId,
        options,
        "event-delete",
        (events: readonly ManagedEvent[]) => events,
        async (owned, events) => {
            const remove = () =>
                owned(
                    data.from("ci_events").delete().in("id", ids(events)),
                ).select("id")
            const first = await remove()
            if (first.error?.code !== "23503") return first
            const untagged = await untag(data, ids(events))
            return untagged.error ? untagged : remove()
        },
        (rows: { id: string }[]) => ({ deleted: rows.map(({ id }) => id) }),
    )
}

/** Removes the teacher tags (junction rows) of the events `eventIds`. */
const untag = (data: DataClient, eventIds: string[]) =>
    data
        .from("ci_events_users_junction")
        .delete()
        .in("ci_event_id", eventIds)
        .then(({ error }) => ({ data: null, error }))
