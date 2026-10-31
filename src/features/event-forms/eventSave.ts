import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sessionOf } from "../../app/auth/personal"
import { useServices, type AppServices } from "../../app/services"
import type { Database } from "../../data/database.types"
import { englishAddressOf } from "../../data/placeLookups"
import { translateTitle } from "../../data/translate"
import { EVENT_BIO_COLUMNS } from "../calendar/publicEvent"
import { applyEventChanges, refreshEventQueries } from "../events/eventCache"
import {
    MANAGED_EVENT_COLUMNS,
    toManagedEvent,
    type ManagedEvent,
    type ManagedEventRow,
} from "../events/managedEvent"
import type { AddressColumn } from "./eventFormValues"

// Saving an event from a form (legacy store `createCIEvent`/`updateCIEvent`
// and cieventsService): the title's translations and (if the address field
// didn't get it at pick time) the English address first, in parallel, each
// falling back to the source text within `LOOKUP_TIMEOUT_MS`, so neither
// can block the save; then one insert or one owner-scoped
// update returning the event as management reads it; then the tagged
// teachers' junction rows. The stored event goes into every cached event
// list (`applyEventChanges`): no list is refetched. A recurring series is
// the same with one row per day: looked up once, inserted in one request,
// and edited on the later events the user chose too.

/**
 * New events start hidden where the deployment says so (legacy's
 * `VITE_HIDE_EVENTS_FLAG`); the forms' hide switch starts from it.
 */
export const HIDE_NEW_EVENTS = import.meta.env.VITE_HIDE_EVENTS_FLAG === "true"

type EventInsert = Database["public"]["Tables"]["ci_events"]["Insert"]
type EventUpdate = Database["public"]["Tables"]["ci_events"]["Update"]

/** The columns a form sends (address as the form has it). */
export type EventColumns = Omit<
    EventInsert,
    "address" | "id" | "user_id" | "owners"
> & {
    address: AddressColumn | null
    /**
     * Legacy's `owners` (read by nothing): the multi-day form names its
     * creator there, as legacy's did; empty by default, as legacy's
     * single-day form left it.
     */
    owners?: EventInsert["owners"]
}

export interface NewEvents {
    /**
     * One event, or a series' (sharing `recurring_ref_key`, title and
     * address), each with an id made once per form
     * (`crypto.randomUUID()`), so a resend can't store them twice.
     */
    events: { id: string; columns: EventColumns }[]
    /** User ids tagged on each (`taggedUserIds`). */
    tagged: string[]
}

/** The columns an edit sends: only the changed ones. */
export type EventPatch = Omit<EventUpdate, "address"> & {
    address?: AddressColumn
}

export interface EventEdit {
    /** The event as the form opened it. */
    event: ManagedEvent
    /** Only the changed columns. */
    patch: EventPatch
    /** User ids tagged on it now; `undefined` if no tag changed. */
    tagged?: string[]
    /**
     * Later events of its recurring series to change too, each with its
     * own patch (its date stays its own).
     */
    later?: {
        events: readonly ManagedEvent[]
        patch: (event: ManagedEvent) => EventPatch
    }
}

/** The event is no longer the user's to edit (deleted, or not theirs). */
export class EventGoneError extends Error {
    constructor() {
        super("The event is gone")
    }
}

/** Postgres' unique violation: an event with this id is stored already. */
const DUPLICATE = "23505"

/** Postgres' foreign key violation. */
const MISSING_REFERENCE = "23503"

/** The event's `source_template_id` names no template (any more). */
const isMissingTemplate = (
    error: { code?: string; message: string; details?: string } | null,
) =>
    error?.code === MISSING_REFERENCE &&
    `${error.message} ${error.details ?? ""}`.includes("source_template_id")

/** The junction rows' bios, as the managed columns embed them. */
const TAGGED_COLUMNS = `ci_event_id, public_bio(${EVENT_BIO_COLUMNS}, show_profile, user_type)`

type Junction = ManagedEventRow["ci_events_users_junction"]

/**
 * The translated title (`lng_titles`) for a new or changed title, and the
 * English address (`en_label`) for a new address the field couldn't label
 * when it was picked, looked up in parallel: the columns to add to the
 * write. Each falls back to the source text within `LOOKUP_TIMEOUT_MS`: a
 * language that failed is left out of `lng_titles` (readers show the
 * Hebrew title), a failed address has no `en_label` (readers show the
 * Hebrew label).
 */
async function lookups(
    services: AppServices,
    columns: { title?: string; address?: AddressColumn | null },
    changed: { title: boolean; address: boolean },
): Promise<{ lng_titles?: Record<string, string>; address?: AddressColumn }> {
    const address = changed.address ? columns.address : null
    const [titles, english] = await Promise.all([
        changed.title && columns.title !== undefined
            ? translateTitle(services.functions, columns.title)
            : undefined,
        address && !address.en_label
            ? englishAddressOf(services.places, address.place_id)
            : undefined,
    ])
    return {
        ...(titles ? { lng_titles: titles } : {}),
        ...(address && english
            ? { address: { ...address, en_label: english } }
            : {}),
    }
}

/**
 * Inserts the junction rows of the tagged users not yet tagged on each
 * event, in one request, returning their bios by event; a failure is
 * reported and leaves the events without them (they are saved: their
 * teachers show as names, without their bios).
 */
async function tagUsers(
    services: AppServices,
    eventIds: readonly string[],
    userIds: readonly string[],
    alreadyTagged: ReadonlyMap<string, ReadonlySet<string>>,
): Promise<Map<string, Junction>> {
    const missing = eventIds.flatMap((ci_event_id) =>
        userIds
            .filter((id) => !alreadyTagged.get(ci_event_id)?.has(id))
            .map((user_id) => ({ ci_event_id, user_id })),
    )
    const byEvent = new Map<string, Junction>()
    if (missing.length === 0) return byEvent
    const { data, error } = await services.data
        .from("ci_events_users_junction")
        .insert(missing)
        .select(TAGGED_COLUMNS)
    if (error) {
        services.telemetry.captureError(new Error(error.message), {
            source: "event-tagging",
        })
        return byEvent
    }
    for (const { ci_event_id, public_bio } of data) {
        byEvent.set(ci_event_id, [
            ...(byEvent.get(ci_event_id) ?? []),
            { public_bio },
        ])
    }
    return byEvent
}

/** Who is tagged on each event already (legacy checked each in turn). */
async function taggedOn(services: AppServices, eventIds: readonly string[]) {
    const { data, error } = await services.data
        .from("ci_events_users_junction")
        .select("ci_event_id, user_id")
        .in("ci_event_id", eventIds)
    if (error) throw new Error(error.message)
    const tagged = new Map<string, Set<string>>()
    for (const { ci_event_id, user_id } of data) {
        const users = tagged.get(ci_event_id) ?? new Set<string>()
        users.add(user_id)
        tagged.set(ci_event_id, users)
    }
    return tagged
}

/** The stored row with the bios of the users just tagged, mapped. */
function managed(row: ManagedEventRow, tagged: Junction = []): ManagedEvent {
    const event = toManagedEvent({
        ...row,
        ci_events_users_junction: [...row.ci_events_users_junction, ...tagged],
    })
    // Every form writes a date; a row without one isn't an event.
    if (!event) throw new Error("Saved event has no date")
    return event
}

/**
 * Creates an event of the user's, or a recurring series of them in one
 * insert (the title and address looked up once for all). Sent again (a
 * retry after a lost answer), the same ids find the stored events instead
 * of a second copy, and a series' days added since are inserted then.
 */
export function useCreateEvent(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ events, tagged }: NewEvents) => {
            await sessionOf(services, userId)
            const now = services.now().toISOString()
            const ids = events.map(({ id }) => id)
            const found = await lookups(services, events[0].columns, {
                title: true,
                address: true,
            })
            let rows = events.map(({ id, columns }) => ({
                ...columns,
                ...found,
                address: found.address ?? columns.address ?? {},
                id,
                user_id: userId,
                owners: columns.owners ?? [],
                cancelled: false,
                created_at: now,
                updated_at: now,
            }))
            const insert = () =>
                services.data
                    .from("ci_events")
                    .insert(rows.length === 1 ? rows[0] : rows)
                    .select(MANAGED_EVENT_COLUMNS)
            let inserted = await insert()
            if (isMissingTemplate(inserted.error)) {
                // The template it started from was deleted meanwhile (e.g.
                // a draft from before): the event is saved without it.
                rows = rows.map((row) => ({ ...row, source_template_id: null }))
                inserted = await insert()
            }
            const duplicate = inserted.error?.code === DUPLICATE
            const { data, error } = duplicate
                ? await storedAndMissing(services, userId, rows)
                : inserted
            if (error) throw new Error(error.message)
            if (data.length === 0) throw new Error("No event was stored")
            const already = duplicate
                ? await taggedOn(services, ids)
                : new Map<string, Set<string>>()
            const added = await tagUsers(
                services,
                data.map(({ id }) => id),
                tagged,
                already,
            )
            return data.map((row) => managed(row, added.get(row.id)))
        },
        onSuccess: (saved) =>
            applyEventChanges(queryClient, services.now(), { saved }),
        onError: (error) =>
            services.telemetry.captureError(error, { source: "event-save" }),
    })
}

/**
 * After a resend's insert found some of its ids stored (the first send's
 * answer was lost): the stored rows, plus the others inserted now (days
 * the series didn't have then).
 */
async function storedAndMissing(
    services: AppServices,
    userId: string,
    rows: readonly (EventInsert & { id: string })[],
): Promise<
    | { data: ManagedEventRow[]; error: null }
    | { data: null; error: { message: string } }
> {
    const stored = await services.data
        .from("ci_events")
        .select(MANAGED_EVENT_COLUMNS)
        .in(
            "id",
            rows.map(({ id }) => id),
        )
        .eq("user_id", userId)
    if (stored.error) return { data: null, error: stored.error }
    const have = new Set(stored.data.map(({ id }) => id))
    const missing = rows.filter(({ id }) => !have.has(id))
    if (missing.length === 0) return { data: stored.data, error: null }
    const inserted = await services.data
        .from("ci_events")
        .insert(missing)
        .select(MANAGED_EVENT_COLUMNS)
    if (inserted.error) return { data: null, error: inserted.error }
    return { data: [...stored.data, ...inserted.data], error: null }
}

/**
 * Updates an event with the changed columns, only while it still belongs
 * to the owner the form opened it with (`user_id` = `event.ownerId`: the
 * user's own, as `eventToEditQuery` reads them, or for an admin anyone's);
 * gone (deleted meanwhile), it fails with `EventGoneError` and every event
 * list is refetched. Translations are looked up only for a changed title
 * or a newly picked address (legacy), once, and used for the later events
 * of its series the user chose too:
 * those get their own patches (`later`), still only while theirs and in
 * the series, in one request per distinct patch (one for all, unless the
 * segments changed: each event's carry its own day), written only once
 * the edited event is. What was stored goes into the cache even if a later
 * write failed.
 */
export function useUpdateEvent(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ event, patch, tagged, later }: EventEdit) => {
            await sessionOf(services, userId)
            const laterEvents = later?.events ?? []
            const [found, already] = await Promise.all([
                lookups(services, patch, {
                    title: patch.title !== undefined,
                    address:
                        !!patch.address &&
                        patch.address.place_id !== event.address.placeId,
                }),
                tagged?.length
                    ? taggedOn(services, [
                          event.id,
                          ...laterEvents.map(({ id }) => id),
                      ])
                    : undefined,
            ])
            const writes = seriesWrites(laterEvents, later?.patch)
            const updatedAt = services.now().toISOString()
            const withLookups = (columns: EventPatch) => ({
                ...columns,
                ...(columns.title !== undefined && found.lng_titles
                    ? { lng_titles: found.lng_titles }
                    : {}),
                ...(columns.address && found.address
                    ? { address: found.address }
                    : {}),
                updated_at: updatedAt,
            })
            const update = (columns: EventPatch) =>
                services.data.from("ci_events").update(withLookups(columns))
            // The edited event first: the later ones change only once it
            // has (gone, nothing else is written).
            const edited = await update(patch)
                .eq("id", event.id)
                .eq("user_id", event.ownerId)
                .select(MANAGED_EVENT_COLUMNS)
                .maybeSingle()
            if (edited.error) throw new Error(edited.error.message)
            if (!edited.data) {
                refreshEventQueries(queryClient)
                throw new EventGoneError()
            }
            const results = await Promise.allSettled(
                writes.map(({ ids, columns }) =>
                    update(columns)
                        .in("id", ids)
                        .eq("user_id", event.ownerId)
                        .eq("recurring_ref_key", event.recurringRefKey ?? "")
                        .select(MANAGED_EVENT_COLUMNS),
                ),
            )
            const rows = [
                edited.data,
                ...results.flatMap((result) =>
                    result.status === "fulfilled"
                        ? (result.value.data ?? [])
                        : [],
                ),
            ]
            const added =
                tagged && already
                    ? await tagUsers(
                          services,
                          rows.map(({ id }) => id),
                          tagged,
                          already,
                      )
                    : new Map<string, Junction>()
            const saved = rows.map((row) => managed(row, added.get(row.id)))
            applyEventChanges(queryClient, services.now(), { saved })
            const failure = results
                .map((result) =>
                    result.status === "rejected"
                        ? result.reason instanceof Error
                            ? result.reason
                            : new Error(String(result.reason))
                        : result.value.error
                          ? new Error(result.value.error.message)
                          : null,
                )
                .find(Boolean)
            const asked = writes.reduce((sum, { ids }) => sum + ids.length, 0)
            // A later write failed, or a later event was deleted (or left
            // the series) meanwhile: the lists show what is stored.
            if (failure || saved.length < asked + 1) {
                refreshEventQueries(queryClient)
            }
            if (failure) throw failure
            return saved[0]
        },
        onError: (error) => {
            if (!(error instanceof EventGoneError)) {
                services.telemetry.captureError(error, { source: "event-save" })
            }
        },
    })
}

/**
 * The later events' writes: one per distinct patch, each naming its
 * events; events with nothing to change get none.
 */
function seriesWrites(
    events: readonly ManagedEvent[],
    patchOf?: (event: ManagedEvent) => EventPatch,
): { ids: string[]; columns: EventPatch }[] {
    if (!patchOf) return []
    const writes = new Map<string, { ids: string[]; columns: EventPatch }>()
    for (const event of events) {
        const columns = patchOf(event)
        if (Object.keys(columns).length === 0) continue
        const key = JSON.stringify(columns)
        const write = writes.get(key) ?? { ids: [], columns }
        write.ids.push(event.id)
        writes.set(key, write)
    }
    return [...writes.values()]
}
