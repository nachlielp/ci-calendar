// Apart from jerusalemDate.ts, which `/` loads: only the event forms (lazy)
// turn a Jerusalem day and time into an instant.

/**
 * The instant (ISO, UTC) at which Jerusalem's clock reads `time` (`HH:mm`)
 * on `day` (`YYYY-MM-DD`): how the event forms store a segment's start and
 * end. In the hour skipped when the clocks go forward, the hour after.
 */
export function jerusalemInstant(day: string, time: string): string {
    const [year, month, date] = day.split("-").map(Number)
    const [hours, minutes] = time.split(":").map(Number)
    const wall = Date.UTC(year, month - 1, date, hours, minutes)
    // Jerusalem is UTC+2 or +3: guess, then correct by the offset there.
    let instant = wall - 2 * 3600_000
    for (let i = 0; i < 2; i++) {
        instant = wall - offsetAt(instant)
    }
    return new Date(instant).toISOString()
}

const jerusalemParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
})

/** Jerusalem's offset from UTC at `instant`, in milliseconds. */
function offsetAt(instant: number): number {
    const parts = Object.fromEntries(
        jerusalemParts
            .formatToParts(new Date(instant))
            .map(({ type, value }) => [type, Number(value)]),
    )
    const wall = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
    )
    return wall - (instant - (instant % 60_000))
}
