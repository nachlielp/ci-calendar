import { useMemo, useState } from "react"
import { useCopy } from "../../app/language"
import { addDays } from "../../lib/jerusalemDate"
import { counted, defineCopy } from "../../lib/copy"
import {
    addMonths,
    monthNumber,
    monthOf,
    monthWeeks,
} from "../../lib/monthGrid"
import { ChevronRightIcon } from "../../ui/icons/ChevronRightIcon"
import { cardsByDay, type EventCard } from "./eventCards"
import { EventList } from "./EventList"
import { dayLabel } from "./eventFormat"
import { EVENT_LOCALES } from "./eventLocales"
import { WINDOW_DAYS } from "./publicWindowSelect"
import "./CalendarView.scss"

const COPY = defineCopy({
    he: {
        calendar: "לוח שנה",
        nextMonth: "החודש הבא",
        previousMonth: "החודש הקודם",
        noEvents: "אין אירועים ביום הזה",
        events: counted({ one: "אירוע אחד", other: "# אירועים" }),
    },
    en: {
        calendar: "Calendar",
        nextMonth: "Next month",
        previousMonth: "Previous month",
        noEvents: "No events on this day",
        events: counted({ one: "one event", other: "# events" }),
    },
    ru: {
        calendar: "Календарь",
        nextMonth: "Следующий месяц",
        previousMonth: "Предыдущий месяц",
        noEvents: "В этот день нет событий",
        events: counted({
            one: "# событие",
            few: "# события",
            many: "# событий",
            other: "# события",
        }),
    },
})

/** Most dots a day shows, however many events it has. */
const MAX_DOTS = 4

/**
 * The month calendar (legacy CalendarView): the months of the public window,
 * days with events marked by dots, and the picked day's events below. It
 * opens on today; the parent remounts it to start over.
 */
export function CalendarView({
    cards,
    today,
}: {
    /** The filtered list's cards, in list order. */
    cards: readonly EventCard[]
    /** The page's day (`useToday()`), `YYYY-MM-DD`. */
    today: string
}) {
    const copy = useCopy(COPY)
    const locale = useCopy(EVENT_LOCALES)
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
            <section className="calendar-view" aria-label={copy.calendar}>
                {/* Previous, month, next in reading order: next month on
                    the left in Hebrew, on the right in English and Russian,
                    each chevron pointing outwards (CalendarView.scss). */}
                <header className="calendar-controller">
                    <button
                        type="button"
                        className="month-button previous"
                        aria-label={copy.previousMonth}
                        disabled={month <= firstMonth}
                        onClick={() => setMonth(addMonths(month, -1))}
                    >
                        <ChevronRightIcon />
                    </button>
                    <h2 className="month-label" aria-live="polite">
                        {locale.months[monthNumber(month) - 1]}
                    </h2>
                    <button
                        type="button"
                        className="month-button next"
                        aria-label={copy.nextMonth}
                        disabled={month >= lastMonth}
                        onClick={() => setMonth(addMonths(month, 1))}
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
                <p className="calendar-view-empty">{copy.noEvents}</p>
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
}: {
    day: string
    count: number
    isToday: boolean
    isSelected: boolean
    onSelect: (day: string) => void
}) {
    const copy = useCopy(COPY)
    const locale = useCopy(EVENT_LOCALES)
    const events = count > 0 ? `, ${copy.events(count)}` : ""
    return (
        <button
            type="button"
            aria-pressed={isSelected}
            aria-current={isToday ? "date" : undefined}
            aria-label={`${dayLabel(day, locale)}${events}`}
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
