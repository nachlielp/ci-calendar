// Calendar days are Israeli days: "today" flips at midnight Asia/Jerusalem,
// whatever the device's timezone. Days are plain `YYYY-MM-DD` strings, which is
// also how `ci_events.start_date` is stored.

const jerusalemDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

export function jerusalemToday(now: Date): string {
    return jerusalemDay.format(now)
}

export function addDays(day: string, days: number): string {
    const date = new Date(`${day}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

const jerusalemClock = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
})

/**
 * The Jerusalem wall-clock time (`HH:mm`) of an instant. Segment times are
 * stored as full timestamps, but only their time of day is meaningful: the
 * date part may be that of the template the event was made from.
 */
export function jerusalemTimeOfDay(instant: string): string {
    return jerusalemClock.format(new Date(instant))
}

/** Day of the week of a calendar day, 0 = Sunday … 6 = Saturday. */
export function weekday(day: string): number {
    return new Date(`${day}T00:00:00Z`).getUTCDay()
}

/**
 * An instant's Jerusalem date as legacy printed record dates
 * (`DD/MM/YYYY`, in every language), e.g. a request's.
 */
export function jerusalemDateLabel(instant: string): string {
    const [year, month, day] = jerusalemToday(new Date(instant)).split("-")
    return `${day}/${month}/${year}`
}

/** The same with the Jerusalem time after it (`DD/MM/YYYY HH:mm`). */
export const jerusalemDateTimeLabel = (instant: string) =>
    `${jerusalemDateLabel(instant)} ${jerusalemTimeOfDay(instant)}`
