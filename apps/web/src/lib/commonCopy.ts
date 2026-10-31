import { defineCopy } from "./copy"

/**
 * Words many components share (legacy translations.ts where it had them),
 * so each is translated once. Read with `useCopy(COMMON_COPY)`; a component's
 * own `defineCopy` holds only what is particular to it.
 */
export const COMMON_COPY = defineCopy({
    he: {
        save: "שמירה",
        cancel: "ביטול",
        confirm: "אישור",
        delete: "מחק",
        close: "סגירה",
        retry: "נסו שוב",
        loading: "טוען…",
        backToCalendar: "חזרה ללוח האירועים",
    },
    en: {
        save: "Save",
        cancel: "Cancel",
        confirm: "Confirm",
        delete: "Delete",
        close: "Close",
        retry: "Try again",
        loading: "Loading…",
        backToCalendar: "Back to the calendar",
    },
    ru: {
        save: "Сохранить",
        cancel: "Отмена",
        confirm: "Подтвердить",
        delete: "Удалить",
        close: "Закрыть",
        retry: "Попробовать снова",
        loading: "Загрузка…",
        backToCalendar: "Вернуться к календарю",
    },
})
