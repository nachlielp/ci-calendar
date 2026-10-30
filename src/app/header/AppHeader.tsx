import { lazy, Suspense, useState } from "react"
import { Link, useLocation, useMatches } from "react-router"
import { StaleDataNotice } from "../../features/calendar/StaleDataNotice"
import { defineCopy } from "../../lib/copy"
import { AccountIcon } from "../../ui/icons/AccountIcon"
import { HomeIcon } from "../../ui/icons/HomeIcon"
import { MenuIcon } from "../../ui/icons/MenuIcon"
import { useCopy } from "../language"
import { LanguageSwitcher } from "../LanguageSwitcher"
import { routeFlag } from "../routeHandle"
import { useIsOnline } from "../useIsOnline"
import { useViewer } from "../viewer"
import { WhatsAppButton } from "./WhatsAppButton"
import "./AppHeader.scss"

const loadMenu = () => import("./MenuDrawer")
const MenuDrawer = lazy(loadMenu)

const COPY = defineCopy({
    he: { home: "כל הארועים", openMenu: "פתח תפריט", login: "התחבר/י" },
    en: { home: "Home", openMenu: "Open menu", login: "Login" },
    ru: { home: "Главная", openMenu: "Открыть меню", login: "Войти" },
})

/**
 * The bar at the top of every page (legacy AppHeader): login or home (where
 * legacy had them) and the language menu at the start; the WhatsApp chat,
 * the out-of-date sign, the signed-in user's name and the menu button at the
 * end.
 *
 * Login shows only to signed-out visitors (never while the viewer is
 * unknown, so a signed-in user never sees it flash), online, on routes
 * without the `homeButton` flag (the auth and text pages, which get home
 * instead).
 */
export function AppHeader() {
    const copy = useCopy(COPY)
    const viewer = useViewer()
    const { pathname } = useLocation()
    const matches = useMatches()
    const online = useIsOnline()
    const [menuOpen, setMenuOpen] = useState(false)

    const signedIn = "signOut" in viewer
    const homeRoute = routeFlag(matches, "homeButton")
    const showHome = signedIn ? pathname !== "/" : homeRoute
    const showLogin = viewer.role === "anonymous" && online && !homeRoute

    return (
        <header className="app-header">
            {showLogin && (
                <Link to="/login" className="header-btn">
                    <AccountIcon className="header-btn-icon" />
                    {copy.login}
                </Link>
            )}
            {showHome && (
                <Link to="/" className="header-btn" aria-label={copy.home}>
                    <HomeIcon className="header-btn-icon" />
                </Link>
            )}
            <LanguageSwitcher />
            <div className="header-actions">
                <WhatsAppButton />
                <StaleDataNotice />
                {"name" in viewer && <p className="user-name">{viewer.name}</p>}
                <button
                    type="button"
                    className="menu-button"
                    aria-label={copy.openMenu}
                    aria-haspopup="dialog"
                    // Fetch the menu's code before the tap completes.
                    onPointerEnter={loadMenu}
                    onFocus={loadMenu}
                    onClick={() => setMenuOpen(true)}
                >
                    <MenuIcon className="menu-button-icon" />
                </button>
            </div>
            {menuOpen && (
                <Suspense fallback={null}>
                    <MenuDrawer
                        viewer={viewer}
                        onClose={() => setMenuOpen(false)}
                    />
                </Suspense>
            )}
        </header>
    )
}
