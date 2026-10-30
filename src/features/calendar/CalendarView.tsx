import { useMemo, useState } from "react"
import { useServices } from "../../app/services"
import { addDays, jerusalemToday } from "../../lib/jerusalemDate"
import { plural } from "../../lib/plural"
import {
    addMonths,
    monthNumber,
    monthOf,
    monthWeeks,
} from "../../lib/monthGrid"
import { ChevronRightIcon } from "../../ui/icons"
import { cardsByDay, type EventCard } from "./eventCards"
import { EventList } from "./EventList"
import { HEBREW, dayLabel, type EventLocale } from "./eventFormat"
import { WINDOW_DAYS } from "./publicWindow"
import "./CalendarView.scss"

const hebrewPlurals = new Intl.PluralRules("he")

const COPY = {
    calendar: "לוח שנה",
    nextMonth: "החודש הבא",
    previousMonth: "החודש הקודם",
    noEvents: "אין אירועים ביום הזה",
    events: (count: number) =>
        count === 0
            ? ""
            : `, ${plural(hebrewPlurals, count, { one: "אירוע אחד", other: "# אירועים" })}`,
}

/** Most dots a day shows, however many events it has. */
const MAX_DOTS = 4

/**
 * The month calendar (legacy CalendarView): the months of the public window,
 * days with events marked by dots, and the picked day's events below. It
 * opens on today; the parent remounts it to start over.
 */
export function CalendarView({
    cards,
    locale = HEBREW,
}: {
    /** The filtered list's cards, in list order. */
    cards: readonly EventCard[]
    locale?: EventLocale
}) {
    const { now } = useServices()
    const today = jerusalemToday(now())
    const firstMonth = monthOf(today)
    const lastDay = addDays(today, WINDOW_DAYS)
    const lastMonth = monthOf(lastDay)

    const [month, setMonth] = useState(firstMonth)
    const [selectedDay, setSelectedDay] = useState(today)
    const byDay = useMemo(() => cardsByDay(cards, lastDay), [cards, lastDay])
    const weeks = useMemo(() => monthWeeks(month), [month])
    const dayCards = byDay.get(selectedDay) ?? []

    return (
        <>
            <section className="calendar-view" aria-label={COPY.calendar}>
                {/* Next month on the right, as legacy had it in Hebrew. */}
                <header className="calendar-controller">
                    <button
                        type="button"
                        className="month-button next"
                        aria-label={COPY.nextMonth}
                        disabled={month >= lastMonth}
                        onClick={() => setMonth(addMonths(month, 1))}
                    >
                        <ChevronRightIcon />
                    </button>
                    <h2 className="month-label" aria-live="polite">
                        {locale.months[monthNumber(month) - 1]}
                    </h2>
                    <button
                        type="button"
                        className="month-button previous"
                        aria-label={COPY.previousMonth}
                        disabled={month <= firstMonth}
                        onClick={() => setMonth(addMonths(month, -1))}
                    >
                        <ChevronRightIcon />
                    </button>
                </header>
                <div className="calendar-view-card card">
                    <table className="month-grid">
                        <thead>
                            <tr>
                                {locale.weekdaysShort.map((name) => (
                                    <th key={name} scope="col">
                                        {name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {weeks.map((week) => (
                                <tr key={week.find(Boolean)}>
                                    {week.map((day, i) => (
                                        <td key={day ?? i}>
                                            {day && (
                                                <DayButton
                                                    day={day}
                                                    count={
                                                        byDay.get(day)
                                                            ?.length ?? 0
                                                    }
                                                    isToday={day === today}
                                                    isSelected={
                                                        day === selectedDay
                                                    }
                                                    onSelect={setSelectedDay}
                                                    locale={locale}
                                                />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
            {dayCards.length > 0 ? (
                <EventList
                    cards={dayCards}
                    label={dayLabel(selectedDay, locale)}
                />
            ) : (
                <p className="calendar-view-empty">{COPY.noEvents}</p>
            )}
        </>
    )
}

function DayButton({
    day,
    count,
    isToday,
    isSelected,
    onSelect,
    locale,
}: {
    day: string
    count: number
    isToday: boolean
    isSelected: boolean
    onSelect: (day: string) => void
    locale: EventLocale
}) {
    return (
        <button
            type="button"
            aria-pressed={isSelected}
            aria-current={isToday ? "date" : undefined}
            aria-label={`${dayLabel(day, locale)}${COPY.events(count)}`}
            className={`day-cell ${count === 0 ? "no-events" : ""}`}
            onClick={() => onSelect(day)}
        >
            <span>{Number(day.slice(8))}</span>
            <span className="event-dots">
                {Array.from({ length: Math.min(count, MAX_DOTS) }, (_, i) => (
                    <span key={i} className="event-dot" />
                ))}
            </span>
        </button>
    )
}
