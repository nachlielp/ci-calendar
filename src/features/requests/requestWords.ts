import { defineCopy } from "../../lib/copy"
import { REQUEST_NOTES } from "./requestRows"

// The app's shared vocabulary of roles, request types and request
// statuses (legacy interfaces.ts `UserTypeHebrew`, `RequestTypeHebrew`,
// `RequestStatusHebrew`): the requests page, the bio page and the admin
// pages all read them from here, never a map of their own. `role` names a
// role in a sentence or a details line; `roleButton` is the short name on
// legacy's admin role buttons. `note` shows the notes the app stores in
// Hebrew (`REQUEST_NOTES`) in the reader's language; any other response is
// a person's words and comes back as given. Unknown values show as stored.
// It imports no feature, so any page can use it.

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
        roleButton: words({
            admin: "מנהל",
            org: "ארגון",
            creator: "יוצר",
            profile: "פרופיל",
            user: "משתמש",
        }),
        type: words({
            profile: "הרשמה כמורה",
            creator: "הרשמה כמורה ויוצר ארועים",
            org: "הרשמה כארגון",
            support: "תמיכה",
        }),
        open: "פתוח",
        closed: "סגור",
        note: words({
            [REQUEST_NOTES.approved]: "הבקשה אושרה",
            [REQUEST_NOTES.closed]: "הבקשה נסגרה",
            [REQUEST_NOTES.cancelled]: "בקשה בטולה על ידי המשתמש",
        }),
    },
    en: {
        role: words({
            admin: "Admin",
            creator: "Teacher and event creator",
            profile: "Teacher",
            org: "Organisation",
            user: "Regular user",
        }),
        roleButton: words({
            admin: "Admin",
            org: "Organisation",
            creator: "Creator",
            profile: "Profile",
            user: "User",
        }),
        type: words({
            profile: "Register as a teacher",
            creator: "Register as a teacher and event creator",
            org: "Register as an organisation",
            support: "Support",
        }),
        open: "Open",
        closed: "Closed",
        note: words({
            [REQUEST_NOTES.approved]: "Request approved",
            [REQUEST_NOTES.closed]: "Request closed",
            [REQUEST_NOTES.cancelled]: "Request cancelled by the user",
        }),
    },
    ru: {
        role: words({
            admin: "Администратор",
            creator: "Учитель и организатор событий",
            profile: "Учитель",
            org: "Организация",
            user: "Обычный пользователь",
        }),
        roleButton: words({
            admin: "Администратор",
            org: "Организация",
            creator: "Организатор",
            profile: "Профиль",
            user: "Пользователь",
        }),
        type: words({
            profile: "Регистрация как учитель",
            creator: "Регистрация как учитель и организатор событий",
            org: "Регистрация как организация",
            support: "Поддержка",
        }),
        open: "Открыта",
        closed: "Закрыта",
        note: words({
            [REQUEST_NOTES.approved]: "Заявка одобрена",
            [REQUEST_NOTES.closed]: "Заявка закрыта",
            [REQUEST_NOTES.cancelled]: "Заявка отменена пользователем",
        }),
    },
})
