import { jerusalemTimeOfDay } from "../../lib/jerusalemDate"
import {
    HEBREW,
    eventDateLabel,
    eventTimeRange,
    organisationNames,
    teacherNames,
    typeLabels,
} from "./eventFormat"
import type { PublicEvent } from "./publicEvent"

/** An event with everything its list card shows, worked out once. */
export interface EventCard {
    event: PublicEvent
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
 * call it once per data change (memoised on the events).
 */
export function toEventCards(
    events: readonly PublicEvent[],
    locale = HEBREW,
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
