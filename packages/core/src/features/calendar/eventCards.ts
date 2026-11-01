import { addDays, jerusalemTimeOfDay } from "../../lib/jerusalemDate"
import {
    eventDateLabel,
    eventTimeRange,
    organisationNames,
    pickAddress,
    pickTitle,
    teacherNames,
    typeLabels,
} from "./eventFormat"
import type { EventLocale } from "./eventLocales"
import type { PublicEvent } from "./publicEvent"

/** An event with everything its list card shows, worked out once. */
export interface EventCard {
    event: PublicEvent
    /** Title and address in the locale's language. */
    title: string
    address: string
    dateLabel: string
    timeRange: string | null
    teachers: string[]
    organisations: string[]
    types: string[]
}

/**
 * The list's cards in display order: by day, then by start time (multi-day
 * events, which have no time, first). Every key and label is computed once
 * here, so sorting compares plain strings and rendering formats nothing;
 * call it once per data or language change (memoised on both).
 */
export function toEventCards(
    events: readonly PublicEvent[],
    locale: EventLocale,
): EventCard[] {
    return events
        .map((event) => ({
            sortKey: `${event.startDate} ${
                event.segments[0]
                    ? jerusalemTimeOfDay(event.segments[0].startTime)
                    : ""
            }`,
            card: {
                event,
                title: pickTitle(event, locale.language),
                address: pickAddress(event.address, locale.language),
                dateLabel: eventDateLabel(event, locale),
                timeRange: eventTimeRange(event),
                teachers: teacherNames(event),
                organisations: organisationNames(event),
                types: typeLabels(event, locale),
            },
        }))
        .sort((a, b) =>
            a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0,
        )
        .map(({ card }) => card)
}

/**
 * The cards on each day (`YYYY-MM-DD`) up to `lastDay`, in list order, for
 * the month calendar: a multi-day event is on every day from its start to
 * its end. Build it once per data change (memoised on the cards), so
 * marking a month and picking a day are lookups.
 */
export function cardsByDay(
    cards: readonly EventCard[],
    lastDay: string,
): ReadonlyMap<string, readonly EventCard[]> {
    const byDay = new Map<string, EventCard[]>()
    for (const card of cards) {
        const { startDate, endDate } = card.event
        // Stops at the calendar's end however long the event says it runs
        // (an end date typo can be years off); an end before the start (a
        // malformed row) still shows on its start.
        const last = endDate < lastDay ? endDate : lastDay
        let day = startDate
        do {
            const dayCards = byDay.get(day)
            if (dayCards) dayCards.push(card)
            else byDay.set(day, [card])
            day = addDays(day, 1)
        } while (day <= last)
    }
    return byDay
}
