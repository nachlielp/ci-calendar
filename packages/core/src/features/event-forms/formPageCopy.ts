import { defineCopy } from "@ci-calendar/core/lib/copy"

/** The form pages' headers (legacy SingleDayFormPage, MultiDayFormPage and their edit pages). */
export const FORM_PAGE_COPY = defineCopy({
    he: {
        singleDay: "אירוע חד יומי",
        editSingleDay: "עריכת אירוע חד יומי",
        multiDay: "אירוע רב יומי",
        editMultiDay: "עריכת אירוע רב יומי",
        multiDayNotice: "אירוע רב יומי הוא אירוע רציף שנמשך מספר ימים",
        backToCreate: "חזרה ליצירת אירועים",
        backToMine: "חזרה לאירועים שלי",
        backToAll: "חזרה לניהול אירועים",
        notFound: "האירוע לא נמצא",
        loadFailed: "לא הצלחנו לטעון את האירוע",
    },
    en: {
        singleDay: "Single-day event",
        editSingleDay: "Edit single-day event",
        multiDay: "Multi-day event",
        editMultiDay: "Edit multi-day event",
        multiDayNotice:
            "A multi-day event is one continuous event lasting several days",
        backToCreate: "Back to creating events",
        backToMine: "Back to my events",
        backToAll: "Back to managing events",
        notFound: "The event wasn't found",
        loadFailed: "We couldn't load the event",
    },
    ru: {
        singleDay: "Однодневное событие",
        editSingleDay: "Изменить однодневное событие",
        multiDay: "Многодневное событие",
        editMultiDay: "Изменить многодневное событие",
        multiDayNotice:
            "Многодневное событие — это одно непрерывное событие на несколько дней",
        backToCreate: "Назад к созданию событий",
        backToMine: "Назад к моим событиям",
        backToAll: "Назад к управлению событиями",
        notFound: "Событие не найдено",
        loadFailed: "Не удалось загрузить событие",
    },
})
