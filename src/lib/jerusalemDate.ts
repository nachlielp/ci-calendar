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
