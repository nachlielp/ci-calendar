import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sessionOf } from "../../app/auth/personal"
import { useServices, type AppServices } from "../../app/services"
import type { Database } from "../../data/database.types"
import { translateTitle } from "../../data/translate"
import { withTimeout } from "../../lib/timeout"
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
// list (`applyEventChanges`): no list is refetched.

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

export interface NewEvent {
    /** Made once per form (`crypto.randomUUID()`), so a resend can't store two. */
    id: string
    columns: EventColumns
    /** User ids tagged on it (`taggedUserIds`). */
    tagged: string[]
}

export interface EventEdit {
    /** The event as the form opened it. */
    event: ManagedEvent
    /** Only the changed columns. */
    patch: Omit<EventUpdate, "address"> & { address?: AddressColumn }
    /** User ids tagged on it now; `undefined` if no tag changed. */
    tagged?: string[]
}

/** The event is no longer the user's to edit (deleted, or not theirs). */
export class EventGoneError extends Error {
    constructor() {
        super("The event is gone")
    }
}

/** Postgres' unique violation: an event with this id is stored already. */
const DUPLICATE = "23505"

/** The junction rows' bios, as the managed columns embed them. */
const TAGGED_COLUMNS = `user_id, public_bio(${EVENT_BIO_COLUMNS}, show_profile, user_type)`

/**
 * `place_id`'s English address, or nothing if it can't be had within
 * `LOOKUP_TIMEOUT_MS` (loading Google's script included).
 */
function englishAddress(
    services: AppServices,
    placeId: string,
): Promise<string | undefined> {
    if (!placeId) return Promise.resolve(undefined)
    return withTimeout(
        services.places().then((places) => places.englishAddress(placeId)),
        undefined,
    )
}

/**
 * The translated title (`lng_titles`) for a new or changed title, and the
 * English address (`en_label`) for a new address the field couldn't label
 * when it was picked, looked up in parallel. Each falls back to the source
 * text within `LOOKUP_TIMEOUT_MS`: a language that failed is left out of
 * `lng_titles` (readers show the Hebrew title), a failed address has no
 * `en_label` (readers show the Hebrew label).
 */
async function withTranslations<
    T extends { title?: string; address?: AddressColumn | null },
>(
    services: AppServices,
    columns: T,
    changed: { title: boolean; address: boolean },
) {
    const address = changed.address ? columns.address : null
    const [titles, english] = await Promise.all([
        changed.title && columns.title !== undefined
            ? translateTitle(services.functions, columns.title)
            : undefined,
        address && !address.en_label
            ? englishAddress(services, address.place_id)
            : undefined,
    ])
    return {
        ...columns,
        ...(titles ? { lng_titles: titles } : {}),
        ...(address && english
            ? { address: { ...address, en_label: english } }
            : {}),
    }
}

/**
 * Inserts the junction rows of the tagged users not yet tagged, returning
 * their bios; a failure is reported and leaves the event without them (it
 * is saved: its teachers show as names, without their bios).
 */
async function tagUsers(
    services: AppServices,
    eventId: string,
    userIds: readonly string[],
    alreadyTagged: ReadonlySet<string>,
): Promise<ManagedEventRow["ci_events_users_junction"]> {
    const missing = userIds.filter((id) => !alreadyTagged.has(id))
    if (missing.length === 0) return []
    const { data, error } = await services.data
        .from("ci_events_users_junction")
        .insert(missing.map((user_id) => ({ ci_event_id: eventId, user_id })))
        .select(TAGGED_COLUMNS)
    if (error) {
        services.telemetry.captureError(new Error(error.message), {
            source: "event-tagging",
        })
        return []
    }
    return data.map(({ public_bio }) => ({ public_bio }))
}

/** Who is tagged on the event already (legacy checked each in turn). */
async function taggedOn(services: AppServices, eventId: string) {
    const { data, error } = await services.data
        .from("ci_events_users_junction")
        .select("user_id")
        .eq("ci_event_id", eventId)
    if (error) throw new Error(error.message)
    return new Set(data.map((row) => row.user_id))
}

/** The stored row with the bios of the users just tagged, mapped. */
function managed(
    row: ManagedEventRow,
    tagged: ManagedEventRow["ci_events_users_junction"],
): ManagedEvent {
    const event = toManagedEvent({
        ...row,
        ci_events_users_junction: [...row.ci_events_users_junction, ...tagged],
    })
    // Every form writes a date; a row without one isn't an event.
    if (!event) throw new Error("Saved event has no date")
    return event
}

/**
 * Creates an event of the user's. Sent again (a retry after a lost
 * answer), the same id finds the stored event instead of a second one.
 */
export function useCreateEvent(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, columns, tagged }: NewEvent) => {
            await sessionOf(services, userId)
            const now = services.now().toISOString()
            const translated = await withTranslations(services, columns, {
                title: true,
                address: true,
            })
            const inserted = await services.data
                .from("ci_events")
                .insert({
                    ...translated,
                    address: translated.address ?? {},
                    id,
                    user_id: userId,
                    owners: columns.owners ?? [],
                    cancelled: false,
                    created_at: now,
                    updated_at: now,
                })
                .select(MANAGED_EVENT_COLUMNS)
                .single()
            const duplicate = inserted.error?.code === DUPLICATE
            const { data, error } = duplicate
                ? await services.data
                      .from("ci_events")
                      .select(MANAGED_EVENT_COLUMNS)
                      .eq("id", id)
                      .eq("user_id", userId)
                      .single()
                : inserted
            if (error) throw new Error(error.message)
            const already = duplicate
                ? await taggedOn(services, id)
                : new Set<string>()
            return managed(data, await tagUsers(services, id, tagged, already))
        },
        onSuccess: (event) =>
            applyEventChanges(queryClient, services.now(), { saved: [event] }),
        onError: (error) =>
            services.telemetry.captureError(error, { source: "event-save" }),
    })
}

/**
 * Updates one of the user's events with the changed columns, only while it
 * is still theirs (`user_id`); gone (deleted meanwhile), it fails with
 * `EventGoneError` and every event list is refetched. Translations are
 * looked up only for a changed title or a newly picked address (legacy).
 */
export function useUpdateEvent(userId: string) {
    const services = useServices()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ event, patch, tagged }: EventEdit) => {
            await sessionOf(services, userId)
            const [translated, already] = await Promise.all([
                withTranslations(services, patch, {
                    title: patch.title !== undefined,
                    address:
                        !!patch.address &&
                        patch.address.place_id !== event.address.placeId,
                }),
                tagged?.length ? taggedOn(services, event.id) : undefined,
            ])
            const { data, error } = await services.data
                .from("ci_events")
                .update({
                    ...translated,
                    updated_at: services.now().toISOString(),
                })
                .eq("id", event.id)
                .eq("user_id", userId)
                .select(MANAGED_EVENT_COLUMNS)
                .maybeSingle()
            if (error) throw new Error(error.message)
            if (!data) throw new EventGoneError()
            const added =
                tagged && already
                    ? await tagUsers(services, event.id, tagged, already)
                    : []
            return managed(data, added)
        },
        onSuccess: (saved) =>
            applyEventChanges(queryClient, services.now(), { saved: [saved] }),
        onError: (error) => {
            if (error instanceof EventGoneError) {
                refreshEventQueries(queryClient)
            } else {
                services.telemetry.captureError(error, { source: "event-save" })
            }
        },
    })
}
