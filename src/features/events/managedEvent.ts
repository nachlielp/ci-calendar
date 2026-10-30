import type { DataClient } from "../../data/client"
import {
    EVENT_BIO_COLUMNS,
    EVENT_COLUMNS,
    toPublicEvent,
    type PublicEvent,
} from "../calendar/publicEvent"

// An event as its owner (or an admin) manages it: the public event, plus
// what only management shows (hidden, the owner, the series). Every read
// and write of an event for management selects these columns, so its
// response can update every cached query that holds the event
// (`applyEventChanges`, ./eventCache.ts).

export interface ManagedEvent extends PublicEvent {
    /** Legacy `hide`: a draft, shown only in management. */
    hidden: boolean
    /** `user_id`: ownership, as RLS has it. */
    ownerId: string
    /** Legacy `is_multi_day`: which edit form opens it. */
    multiDay: boolean
    /** The recurring series it belongs to (`recurring_ref_key`), if any. */
    recurringRefKey: string | null
}

/**
 * `PUBLIC_EVENT_COLUMNS` plus the management columns, and the bios' own
 * public flags: no embedded filters here (writes return these columns too),
 * so `toManagedEvent` drops the bios that aren't public, as
 * `selectPublicEvents` does in its query.
 */
export const MANAGED_EVENT_COLUMNS =
    `${EVENT_COLUMNS}, hide, user_id, is_multi_day, recurring_ref_key, ci_events_users_junction(public_bio(${EVENT_BIO_COLUMNS}, show_profile, user_type))` as const

/** Events with every management column; filter by owner yourself. */
export function selectManagedEvents(data: DataClient) {
    return data.from("ci_events").select(MANAGED_EVENT_COLUMNS)
}

export type ManagedEventRow = NonNullable<
    Awaited<ReturnType<typeof selectManagedEvents>>["data"]
>[number]

type BioRow = ManagedEventRow["ci_events_users_junction"][number]["public_bio"]

/**
 * Shown publicly, as `selectPublicEvents` filters bios (SQL's
 * `user_type <> 'admin'` is not true for a null type either).
 */
export const isPublicBio = (
    bio: Pick<NonNullable<BioRow>, "show_profile" | "user_type" | "bio_name">,
) =>
    bio.show_profile === true &&
    bio.user_type != null &&
    bio.user_type !== "admin" &&
    !!bio.bio_name

/**
 * The managed event a row holds; `null` for a row without a start date (not
 * a calendar event; the queries' date filters never return one).
 */
export function toManagedEvent(row: ManagedEventRow): ManagedEvent | null {
    if (!row.start_date) return null
    return {
        ...toPublicEvent({
            ...row,
            start_date: row.start_date,
            ci_events_users_junction: row.ci_events_users_junction.flatMap(
                ({ public_bio }) =>
                    public_bio && isPublicBio(public_bio)
                        ? [{ public_bio }]
                        : [],
            ),
        }),
        hidden: row.hide,
        ownerId: row.user_id ?? "",
        multiDay: row.is_multi_day ?? false,
        recurringRefKey: row.recurring_ref_key || null,
    }
}

/** Rows to managed events, leaving out any without a start date. */
export const toManagedEvents = (rows: readonly ManagedEventRow[]) =>
    rows.flatMap((row) => toManagedEvent(row) ?? [])

/** The public part of a managed event, as the calendar caches it. */
export function toPublicOnly(event: ManagedEvent): PublicEvent {
    const { hidden, ownerId, multiDay, recurringRefKey, ...rest } = event
    return rest
}

/** The edit form's route for `event` (legacy's; slices 13 and 14). */
export const editPath = (event: ManagedEvent) =>
    event.multiDay
        ? `/manage-events/edit-multi-day/${event.id}`
        : `/manage-events/edit-single-day/${event.id}`
