import { useMemo } from "react"
import { useCopy, useLanguage } from "../../app/language"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import type { FormErrors } from "@ci-calendar/core/lib/form"
import { numericDayLabel } from "@ci-calendar/core/lib/jerusalemDate"
import { INTL_LOCALES, type Language } from "@ci-calendar/core/lib/language"
import { FormAlert, SelectField, TextField } from "../../ui/form/fields"
import type {
    EventFormError,
    RecurrenceValues,
} from "@ci-calendar/core/features/event-forms/eventFormValues"
import {
    addMonths,
    RECURRENCE_MONTHS,
    RECURRENCES,
    recurringDates,
} from "@ci-calendar/core/features/event-forms/recurrence"
import { useErrorText } from "./useErrorText"
import "./RecurringEventSection.scss"

// Legacy RecurringEventSection (Hebrew only there): a new single-day
// event made a series, how often and until when, with the days it will
// fall on listed as they change.

const COPY = defineCopy({
    he: {
        title: "אירוע חוזר",
        note: "(יצירת מספר ארועים חוזרים)",
        info: "חודשי: חוזר באותו יום בחודש - לדוגמה ב22 לכל חודש\nחודשי - יום בשבוע: חוזר באותו יום באותו מספר שבוע, לדוגמה השבת הראשונה של כל חודש",
        frequency: "תדירות",
        until: "תאריך סיום",
        dates: "תאריכי האירועים",
        weekly: "שבועי",
        "bi-weekly": "דו שבועי",
        monthly: "חודשי",
        "monthly-pattern": "חודשי - יום בשבוע",
    },
    en: {
        title: "Recurring event",
        note: "(creates several repeating events)",
        info: "Monthly: repeats on the same date each month - e.g. on the 22nd of every month\nMonthly - weekday: repeats on the same weekday of the same week, e.g. the first Saturday of every month",
        frequency: "Frequency",
        until: "End date",
        dates: "Event dates",
        weekly: "Weekly",
        "bi-weekly": "Every two weeks",
        monthly: "Monthly",
        "monthly-pattern": "Monthly - weekday",
    },
    ru: {
        title: "Повторяющееся событие",
        note: "(создаёт несколько повторяющихся событий)",
        info: "Ежемесячно: в то же число каждого месяца - например, 22-го\nЕжемесячно - день недели: в тот же день недели той же недели месяца, например, в первую субботу каждого месяца",
        frequency: "Частота",
        until: "Дата окончания",
        dates: "Даты событий",
        weekly: "Еженедельно",
        "bi-weekly": "Раз в две недели",
        monthly: "Ежемесячно",
        "monthly-pattern": "Ежемесячно - день недели",
    },
})

const weekdayFormats = new Map<Language, Intl.DateTimeFormat>()

/**
 * Legacy's line for a day of the series: `יום שני - 03/11/2026` (the
 * weekday in the interface language).
 */
function seriesDayLabel(day: string, language: Language): string {
    let format = weekdayFormats.get(language)
    if (!format) {
        format = new Intl.DateTimeFormat(INTL_LOCALES[language], {
            weekday: "long",
            timeZone: "UTC",
        })
        weekdayFormats.set(language, format)
    }
    return `${format.format(new Date(`${day}T00:00:00Z`))} - ${numericDayLabel(day)}`
}

export function RecurringEventSection({
    recurrence,
    date,
    today,
    errors,
    onChange,
    onTouch,
}: {
    recurrence: RecurrenceValues
    /** The event's (first) day. */
    date: string
    today: string
    errors: FormErrors<EventFormError>
    onChange: (
        change: (recurrence: RecurrenceValues) => RecurrenceValues,
        path: string,
    ) => void
    onTouch: (path: string) => void
}) {
    const copy = useCopy(COPY)
    const { language } = useLanguage()
    const errorAt = useErrorText(errors)
    const { on, frequency, until } = recurrence
    const dates = useMemo(
        () =>
            on && frequency && date && until
                ? recurringDates(date, until, frequency)
                : [],
        [on, frequency, date, until],
    )
    const set = <K extends keyof RecurrenceValues>(
        field: K,
        value: RecurrenceValues[K],
    ) =>
        onChange(
            (current) => ({ ...current, [field]: value }),
            `recurrence.${field}`,
        )
    return (
        <section className="recurring-event-section">
            <hr className="divider" />
            <label className="recurring-toggle">
                <span className="segment-title">
                    {copy.title}{" "}
                    <span className="segment-description">{copy.note}</span>
                </span>
                <input
                    type="checkbox"
                    checked={on}
                    onChange={(event) => set("on", event.target.checked)}
                />
            </label>
            {on && (
                <div className="recurring-container card boardered-card">
                    <div className="recurring-info">
                        <FormAlert kind="info">{copy.info}</FormAlert>
                    </div>
                    <div className="recurring-fields">
                        <SelectField
                            label={copy.frequency}
                            labelAsPlaceholder
                            options={RECURRENCES.map((value) => ({
                                value,
                                label: copy[value],
                            }))}
                            value={frequency}
                            onChange={(value) => set("frequency", value)}
                            onBlur={() => onTouch("recurrence.frequency")}
                            error={errorAt("recurrence.frequency")}
                        />
                        <TextField
                            label={copy.until}
                            type="date"
                            min={date || today}
                            max={addMonths(today, RECURRENCE_MONTHS)}
                            value={until}
                            onChange={(value) => set("until", value)}
                            onBlur={() => onTouch("recurrence.until")}
                            error={errorAt("recurrence.until")}
                        />
                    </div>
                    {dates.length > 0 && (
                        <ul
                            className="recurring-event-date-list"
                            aria-label={copy.dates}
                        >
                            {dates.map((day) => (
                                <li key={day} className="recurring-event-date">
                                    {seriesDayLabel(day, language)}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    )
}
