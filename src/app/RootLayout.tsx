import { useContext, useEffect } from "react"
import {
    Link,
    Outlet,
    ScrollRestoration,
    useRouteError,
    type Location,
    type UIMatch,
} from "react-router"
import { COMMON_COPY } from "../lib/commonCopy"
import { defineCopy } from "../lib/copy"
import { AppHeader } from "./header/AppHeader"
import { InstallBanner } from "./install/InstallBanner"
import { useCopy } from "./language"
import { useServices } from "./services"
import { ReloadGuardContext } from "./updates/reloadGuard"
import { isStaleChunkError, reloadForStaleChunks } from "./updates/staleChunks"
import { useRemoveInitialLoader } from "./useRemoveInitialLoader"
import "./RootLayout.scss"

const ERROR_COPY = defineCopy({
    he: {
        title: "משהו השתבש",
        newVersion: "יש גרסה חדשה של האפליקציה",
        reloadToContinue: "טענו מחדש את הדף כדי להמשיך.",
        reload: "טעינה מחדש",
    },
    en: {
        title: "Something went wrong",
        newVersion: "A new version of the app is available",
        reloadToContinue: "Reload the page to continue.",
        reload: "Reload",
    },
    ru: {
        title: "Что-то пошло не так",
        newVersion: "Доступна новая версия приложения",
        reloadToContinue: "Перезагрузите страницу, чтобы продолжить.",
        reload: "Перезагрузить",
    },
})

/** The route id of the calendar and the events opened over it. */
export const CALENDAR_ROUTE_ID = "calendar"

/**
 * Where the window's scroll position is kept. The calendar and an event
 * opened over it share one, so opening and closing an event never moves the
 * list; every other page starts at the top and, on Back, returns to where
 * it was left.
 */
function scrollKey(location: Location, matches: UIMatch[]) {
    return matches.some((match) => match.id === CALENDAR_ROUTE_ID)
        ? CALENDAR_ROUTE_ID
        : location.key
}

/**
 * The shell around every page (legacy App): the background, the install
 * banner and the header over a column at most 500px wide.
 */
export function RootLayout() {
    useRemoveInitialLoader()

    return (
        <div className="app">
            <Background />
            <div className="app-content">
                <InstallBanner />
                <AppHeader />
                <Outlet />
            </div>
            <ScrollRestoration getKey={scrollKey} />
        </div>
    )
}

/**
 * Legacy BackgroundTiles: square gradient tiles down the screen, every other
 * one flipped. Enough tiles for a screen three times taller than wide; the
 * container clips the rest.
 */
function Background() {
    return (
        <div className="app-background" aria-hidden="true">
            <div className="background-tile" />
            <div className="background-tile" />
            <div className="background-tile" />
            <div className="background-tile" />
        </div>
    )
}

export function RouteError() {
    useRemoveInitialLoader()
    const copy = useCopy(ERROR_COPY)
    const common = useCopy(COMMON_COPY)
    const services = useServices()
    const guard = useContext(ReloadGuardContext)
    const staleChunk = isStaleChunkError(useRouteError())

    // A lazy file of an old version is gone: reload onto the current one
    // (once, and not over unsaved work), else offer the button below.
    useEffect(() => {
        if (staleChunk && guard) reloadForStaleChunks(services, guard)
    }, [staleChunk, services, guard])

    if (staleChunk) {
        return (
            <main className="app route-error" role="alert">
                <h1>{copy.newVersion}</h1>
                <p>{copy.reloadToContinue}</p>
                <button
                    type="button"
                    className="route-error-reload"
                    onClick={services.reload}
                >
                    {copy.reload}
                </button>
            </main>
        )
    }

    return (
        <main className="app route-error" role="alert">
            <h1>{copy.title}</h1>
            <Link to="/">{common.backToCalendar}</Link>
        </main>
    )
}
