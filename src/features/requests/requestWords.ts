import { defineCopy } from "../../lib/copy"

// The words for roles, request types and statuses that the requests
// page's parts share (legacy interfaces.ts `UserTypeHebrew`,
// `RequestTypeHebrew`, `RequestStatusHebrew`). Unknown values show as
// stored.

const words =
    (names: Readonly<Record<string, string>>) =>
    (value: string): string =>
        Object.hasOwn(names, value) ? names[value] : value

export const REQUEST_WORDS = defineCopy({
    he: {
        role: words({
            admin: "מנהל",
            creator: "מורה ויוצר ארועים",
            profile: "מורה",
            org: "ארגון",
            user: "משתמש רגיל",
        }),
        type: words({
            profile: "הרשמה כמורה",
            creator: "הרשמה כמורה ויוצר ארועים",
            org: "הרשמה כארגון",
            support: "תמיכה",
        }),
        open: "פתוח",
        closed: "סגור",
    },
    en: {
        role: words({
            admin: "Admin",
            creator: "Teacher and event creator",
            profile: "Teacher",
            org: "Organisation",
            user: "Regular user",
        }),
        type: words({
            profile: "Register as a teacher",
            creator: "Register as a teacher and event creator",
            org: "Register as an organisation",
            support: "Support",
        }),
        open: "Open",
        closed: "Closed",
    },
    ru: {
        role: words({
            admin: "Администратор",
            creator: "Учитель и организатор событий",
            profile: "Учитель",
            org: "Организация",
            user: "Обычный пользователь",
        }),
        type: words({
            profile: "Регистрация как учитель",
            creator: "Регистрация как учитель и организатор событий",
            org: "Регистрация как организация",
            support: "Поддержка",
        }),
        open: "Открыта",
        closed: "Закрыта",
    },
})
