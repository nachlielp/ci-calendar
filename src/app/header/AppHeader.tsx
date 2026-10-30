import { lazy, Suspense, useState } from "react"
import { Link, useLocation, useMatches } from "react-router"
import { StaleDataNotice } from "../../features/calendar/StaleDataNotice"
import { defineCopy } from "../../lib/copy"
import { HomeIcon } from "../../ui/icons/HomeIcon"
import { MenuIcon } from "../../ui/icons/MenuIcon"
import { useCopy } from "../language"
import { LanguageSwitcher } from "../LanguageSwitcher"
import { routeFlag } from "../routeHandle"
import { useViewer } from "../viewer"
import { WhatsAppButton } from "./WhatsAppButton"
import "./AppHeader.scss"

const loadMenu = () => import("./MenuDrawer")
const MenuDrawer = lazy(loadMenu)

const COPY = defineCopy({
    he: { home: "כל הארועים", openMenu: "פתח תפריט" },
    en: { home: "Home", openMenu: "Open menu" },
    ru: { home: "Главная", openMenu: "Открыть меню" },
})

/**
 * The bar at the top of every page (legacy AppHeader): home (where legacy
 * had it) and the language menu at the start; the WhatsApp chat, the
 * out-of-date sign and the menu button at the end.
 *
 * Legacy's login button is left out until slice 9 adds the login page; it
 * then goes before home, shown to `anonymous` viewers (never `unknown`)
 * while online, on routes without the `homeButton` flag.
 */
export function AppHeader() {
    const copy = useCopy(COPY)
    const viewer = useViewer()
    const { pathname } = useLocation()
    const matches = useMatches()
    const [menuOpen, setMenuOpen] = useState(false)

    const signedIn = viewer.role !== "anonymous" && viewer.role !== "unknown"
    const showHome = signedIn
        ? pathname !== "/"
        : routeFlag(matches, "homeButton")

    return (
        <header className="app-header">
            {showHome && (
                <Link to="/" className="header-btn" aria-label={copy.home}>
                    <HomeIcon className="header-btn-icon" />
                </Link>
            )}
            <LanguageSwitcher />
            <div className="header-actions">
                <WhatsAppButton />
                <StaleDataNotice />
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
