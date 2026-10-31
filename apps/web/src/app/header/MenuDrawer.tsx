import { NavLink } from "react-router"
import { defineCopy } from "../../lib/copy"
import { Dialog } from "../../ui/Dialog"
import { useCopy } from "../language"
import type { Viewer } from "../viewer"
import { menuFor, type MenuItemKey } from "./menu"
import "./MenuDrawer.scss"

// Legacy translations.ts (home, myEvents, …, logout).
const COPY = defineCopy<Record<MenuItemKey | "menu", string>>({
    he: {
        menu: "תפריט",
        home: "כל הארועים",
        myEvents: "האירועים שלי",
        createEvents: "יצירת אירוע",
        manageAllEvents: "ניהול אירועים",
        manageUsers: "ניהול משתמשים",
        profile: "פרופיל",
        requestRole: "הרשם כמורה או ארגון",
        manageSupport: "ניהול תמיכה",
        resetPassword: "איפוס סיסמה",
        about: "אודות",
        logout: "התנתק/י",
    },
    en: {
        menu: "Menu",
        home: "Home",
        myEvents: "My Events",
        createEvents: "Create Events",
        manageAllEvents: "Manage All Events",
        manageUsers: "Manage Users",
        profile: "Profile",
        requestRole: "Register As Teacher/Org",
        manageSupport: "Manage Support",
        resetPassword: "Reset Password",
        about: "About",
        logout: "Logout",
    },
    ru: {
        menu: "Меню",
        home: "Главная",
        myEvents: "Мои события",
        createEvents: "Создать событие",
        manageAllEvents: "Управление всеми событиями",
        manageUsers: "Управление пользователями",
        profile: "Профиль",
        requestRole: "Зарегистрироваться как учитель/организация",
        manageSupport: "Управление поддержкой",
        resetPassword: "Сбросить пароль",
        about: "О нас",
        logout: "Выйти",
    },
})

/**
 * The menu (legacy MenuDrawer): from the top on phones, from the side on
 * wider screens. It lists the items the viewer's role sees; the current
 * page's item is marked. Choosing an item closes it.
 */
export default function MenuDrawer({
    viewer,
    onClose,
}: {
    viewer: Viewer
    onClose: () => void
}) {
    const copy = useCopy(COPY)

    return (
        <Dialog label={copy.menu} onClose={onClose} className="menu-drawer">
            <nav aria-label={copy.menu}>
                <ul className="menu-drawer-items">
                    {menuFor(viewer).map((item) => (
                        <li key={item.key}>
                            {"to" in item ? (
                                <NavLink
                                    to={item.to}
                                    end={item.to === "/"}
                                    className="menu-item"
                                    onClick={onClose}
                                >
                                    <item.Icon className="menu-item-icon" />
                                    {copy[item.key]}
                                </NavLink>
                            ) : (
                                <button
                                    type="button"
                                    className="menu-item"
                                    onClick={() => {
                                        // Only signed-in viewers, who can
                                        // sign out, see action items.
                                        if ("signOut" in viewer) {
                                            void viewer.signOut()
                                        }
                                        onClose()
                                    }}
                                >
                                    <item.Icon className="menu-item-icon" />
                                    {copy[item.key]}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </Dialog>
    )
}
