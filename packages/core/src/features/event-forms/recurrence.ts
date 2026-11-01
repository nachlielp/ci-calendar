import { addDays, weekday } from "@ci-calendar/core/lib/jerusalemDate"

// Recurring events (legacy RecurringEventSection and utilService's
// `calculateRecurringEventDates`): the days a series falls on, from its
// first day to an end day, as pure calendar maths on Jerusalem
// `YYYY-MM-DD` days (no clock, so no daylight-saving shifts: each day's
// segment times become instants on that day, `jerusalemInstant`).

/** Legacy's frequencies (`recurringOptions`), in its order. */
export const RECURRENCES = [
    "weekly",
    "bi-weekly",
    "monthly",
    "monthly-pattern",
] as const

export type Recurrence = (typeof RECURRENCES)[number]

export const isRecurrence = (value: unknown): value is Recurrence =>
    (RECURRENCES as readonly unknown[]).includes(value)

/**
 * Legacy's most steps per frequency: 52 weeks (or fortnights), 12 months.
 * A step is a week or a month, not an event: monthly-pattern's months
 * without the weekday still count, so it never looks past the 12 months
 * legacy looked at (legacy's loop also ran 12 months, stopping early at
 * the end day). With the end day at most `RECURRENCE_MONTHS` ahead, only
 * weekly can reach its cap (a year of weeks).
 */
export const MAX_STEPS: Readonly<Record<Recurrence, number>> = {
    weekly: 52,
    "bi-weekly": 52,
    monthly: 12,
    "monthly-pattern": 12,
}

/** Legacy's end-day picker went at most a year ahead. */
export const RECURRENCE_MONTHS = 12

const pad = (n: number) => String(n).padStart(2, "0")

const daysInMonth = (year: number, month: number) =>
    new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

/** `month` (0-based, may overflow) of `year` as a year and 0-based month. */
function monthOf(year: number, month: number) {
    return {
        year: year + Math.floor(month / 12),
        month: ((month % 12) + 12) % 12,
    }
}

/**
 * `months` after `day`, on the same date, or the month's last day when it
 * is shorter (dayjs's `add(n, "month")`, as legacy: 31 Jan → 28 Feb).
 */
export function addMonths(day: string, months: number): string {
    const [y, m, d] = day.split("-").map(Number)
    const { year, month } = monthOf(y, m - 1 + months)
    return `${year}-${pad(month + 1)}-${pad(Math.min(d, daysInMonth(year, month)))}`
}

/**
 * The same weekday in the same week of the month as `day` (its 1st–5th
 * such weekday), `months` later; `null` in a month without a fifth one.
 * Legacy carried a missing fifth weekday over into the next month (a day
 * of the wrong month, sometimes days from the next one); it is skipped.
 */
function sameWeekdayOfMonth(day: string, months: number): string | null {
    const [y, m, d] = day.split("-").map(Number)
    const week = Math.ceil(d / 7)
    const { year, month } = monthOf(y, m - 1 + months)
    const first = `${year}-${pad(month + 1)}-01`
    const offset = (weekday(day) - weekday(first) + 7) % 7
    const date = 1 + offset + (week - 1) * 7
    if (date > daysInMonth(year, month)) return null
    return `${year}-${pad(month + 1)}-${pad(date)}`
}

/**
 * The days of a series that starts on `start` and recurs `recurrence` up
 * to `end` (inclusive), in order: legacy's frequencies and caps. Weekly
 * and bi-weekly step 7 or 14 days; monthly keeps the date (or the month's
 * last day); monthly-pattern keeps the weekday and its week of the month
 * (e.g. the first Saturday). Empty if `end` is before `start`.
 */
export function recurringDates(
    start: string,
    end: string,
    recurrence: Recurrence,
): string[] {
    const dates: string[] = []
    for (let step = 0; step < MAX_STEPS[recurrence]; step++) {
        let day: string | null
        switch (recurrence) {
            case "weekly":
                day = addDays(start, step * 7)
                break
            case "bi-weekly":
                day = addDays(start, step * 14)
                break
            case "monthly":
                day = addMonths(start, step)
                break
            case "monthly-pattern":
                day = sameWeekdayOfMonth(start, step)
                break
        }
        if (day === null) continue
        if (day > end) break
        dates.push(day)
    }
    return dates
}
