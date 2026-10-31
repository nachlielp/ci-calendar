import { addDays, weekday } from "./jerusalemDate"

// Months of the calendar view as `YYYY-MM` strings, built from the same
// `YYYY-MM-DD` days as everything else (see jerusalemDate.ts): which month
// is "this month" follows Jerusalem's today, the grid is plain calendar
// arithmetic.

/** The month (`YYYY-MM`) a day falls in. */
export const monthOf = (day: string) => day.slice(0, 7)

/** The month `months` after (or before, when negative) `month`. */
export function addMonths(month: string, months: number): string {
    const [year, monthNumber] = month.split("-").map(Number)
    const index = year * 12 + monthNumber - 1 + months
    const newMonth = String((index % 12) + 1).padStart(2, "0")
    return `${Math.floor(index / 12)}-${newMonth}`
}

/** Calendar month number, 1 = January. */
export const monthNumber = (month: string) => Number(month.slice(5, 7))

/**
 * The month's days as weeks, Sunday to Saturday (as in Israel), with `null`
 * for the cells before the 1st and after the last day.
 */
export function monthWeeks(month: string): (string | null)[][] {
    const first = `${month}-01`
    const cells: (string | null)[] = Array(weekday(first)).fill(null)
    for (let day = first; monthOf(day) === month; day = addDays(day, 1)) {
        cells.push(day)
    }
    while (cells.length % 7 !== 0) cells.push(null)

    const weeks: (string | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
    return weeks
}
