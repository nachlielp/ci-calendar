import { defineCopy } from "../../lib/copy"

/** The form pages' headers (legacy SingleDayFormPage, EditSingleDayFormPage). */
export const FORM_PAGE_COPY = defineCopy({
    he: {
        singleDay: "אירוע חד יומי",
        editSingleDay: "עריכת אירוע חד יומי",
        backToCreate: "חזרה ליצירת אירועים",
        backToMine: "חזרה לאירועים שלי",
        notFound: "האירוע לא נמצא",
        loadFailed: "לא הצלחנו לטעון את האירוע",
    },
    en: {
        singleDay: "Single-day event",
        editSingleDay: "Edit single-day event",
        backToCreate: "Back to creating events",
        backToMine: "Back to my events",
        notFound: "The event wasn't found",
        loadFailed: "We couldn't load the event",
    },
    ru: {
        singleDay: "Однодневное событие",
        editSingleDay: "Изменить однодневное событие",
        backToCreate: "Назад к созданию событий",
        backToMine: "Назад к моим событиям",
        notFound: "Событие не найдено",
        loadFailed: "Не удалось загрузить событие",
    },
})
