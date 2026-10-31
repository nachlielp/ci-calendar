import { defineCopy } from "../../lib/copy"

// The app's shared vocabulary of roles, request types and request
// statuses (legacy interfaces.ts `UserTypeHebrew`, `RequestTypeHebrew`,
// `RequestStatusHebrew`): the requests page, the bio page and the admin
// pages all read them from here, never a map of their own. `role` names a
// role in a sentence or a details line; `roleButton` is the short name on
// legacy's admin role buttons. Unknown values show as stored. It imports
// no feature, so any page can use it.

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
    },
})
