import { defineCopy } from "../../lib/copy"
import type { Language } from "../../lib/language"
import { weekday } from "../../lib/jerusalemDate"

// The event vocabulary in each language (legacy util/translations.ts): the
// words the formatters (eventFormat.ts) and the calendar components show
// events with. Components read the interface language's locale with
// `useCopy(EVENT_LOCALES)`.

/** The words and formats events are shown with in one language. */
export interface EventLocale {
    language: Language
    /** Copy shared by the list card and the details. */
    copy: { cancelled: string; with: string }
    /** Event and segment types (`class`, `jam`, …). */
    types: Readonly<Record<string, string>>
    /** Segment audience tags (`everyone`, `beginner`, …). */
    tags: Readonly<Record<string, string>>
    /** Event districts (`center`, `jerusalem`, …). */
    districts: Readonly<Record<string, string>>
    /** Month names, January first. */
    months: readonly string[]
    /** Weekday headings of the month calendar, Sunday first. */
    weekdaysShort: readonly string[]
    /** A calendar day (`YYYY-MM-DD`), e.g. `Saturday, November 7th`. */
    day(day: string): string
}

const HEBREW_WEEKDAYS = [
    "ראשון",
    "שני",
    "שלישי",
    "רביעי",
    "חמישי",
    "שישי",
    "שבת",
]

const HEBREW_MONTHS = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
]

export const HEBREW: EventLocale = {
    language: "he",
    copy: { cancelled: "האירוע בוטל", with: "עם" },
    types: {
        class: "שיעור",
        jam: "ג'אם",
        underscore: "אנדרסקור",
        workshop: "סדנה",
        retreat: "ריטריט",
        warmup: "חימום",
        course: "קורס",
        score: "סקור",
    },
    tags: {
        everyone: "פתוח לכולם",
        beginner: "מתחילים",
        advanced: "מתקדמים",
        male: "גברים",
        female: "נשים",
        preRegistration: "הרשמה מראש",
    },
    districts: {
        center: "מרכז",
        jerusalem: "ירושלים",
        galilee: "גליל",
        haifa: "חיפה",
        carmel: "חוף הכרמל",
        pardesHanna: "פרדס חנה",
        south: "דרום",
    },
    months: HEBREW_MONTHS,
    weekdaysShort: ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"],
    // `שבת, יום שבת 7 בנובמבר`, the legacy app's day format.
    day: (day) => {
        const [, month, date] = day.split("-").map(Number)
        const name = HEBREW_WEEKDAYS[weekday(day)]
        return `${name}, יום ${name} ${date} ב${HEBREW_MONTHS[month - 1]}`
    },
}

// Days are already Jerusalem days; formatting their UTC midnight in UTC keeps
// the date as it is.
const utcDay = (day: string) => new Date(`${day}T00:00:00Z`)

const englishDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
})
const englishOrdinals = new Intl.PluralRules("en-US", { type: "ordinal" })
const ORDINAL_SUFFIXES: Partial<Record<Intl.LDMLPluralRule, string>> = {
    one: "st",
    two: "nd",
    few: "rd",
}

export const ENGLISH: EventLocale = {
    language: "en",
    copy: { cancelled: "Event Cancelled", with: "With" },
    types: {
        class: "Class",
        jam: "Jam",
        underscore: "Underscore",
        workshop: "Workshop",
        retreat: "Retreat",
        warmup: "Warmup",
        course: "Course",
        score: "Score",
    },
    tags: {
        everyone: "Open to everyone",
        beginner: "Beginners",
        advanced: "Advanced",
        male: "Men",
        female: "Women",
        preRegistration: "Pre-Registration",
    },
    districts: {
        center: "Center",
        jerusalem: "Jerusalem",
        galilee: "Galilee",
        haifa: "Haifa",
        carmel: "Hof Hacarmel",
        pardesHanna: "Pardes Hanna",
        south: "South",
    },
    months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ],
    weekdaysShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    // `Saturday, November 7th`, as legacy showed it.
    day: (day) =>
        englishDay
            .formatToParts(utcDay(day))
            .map(({ type, value }) =>
                type === "day"
                    ? `${value}${ORDINAL_SUFFIXES[englishOrdinals.select(Number(value))] ?? "th"}`
                    : value,
            )
            .join(""),
}

const russianDay = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
})

const capitalise = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1)

export const RUSSIAN: EventLocale = {
    language: "ru",
    copy: { cancelled: "Событие отменено", with: "С" },
    types: {
        class: "Занятие",
        jam: "Джем",
        underscore: "Андерскор",
        workshop: "Воркшоп",
        retreat: "Ретрит",
        warmup: "Разминка",
        course: "Курс",
        score: "Фокус-Джем",
    },
    tags: {
        everyone: "Открыто для всех",
        beginner: "Начинающие",
        advanced: "Продвинутые",
        male: "Мужчины",
        female: "Женщины",
        preRegistration: "Предварительная регистрация",
    },
    districts: {
        center: "Центр",
        jerusalem: "Иерусалим",
        galilee: "Галилея",
        haifa: "Хайфа",
        carmel: "Хоф ха-Кармэль",
        pardesHanna: "Пардэс Ханна",
        south: "Юг",
    },
    months: [
        "Январь",
        "Февраль",
        "Март",
        "Апрель",
        "Май",
        "Июнь",
        "Июль",
        "Август",
        "Сентябрь",
        "Октябрь",
        "Ноябрь",
        "Декабрь",
    ],
    weekdaysShort: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
    // `Суббота, 7 ноября`.
    day: (day) => capitalise(russianDay.format(utcDay(day))),
}

export const EVENT_LOCALES = defineCopy({
    he: HEBREW,
    en: ENGLISH,
    ru: RUSSIAN,
})
