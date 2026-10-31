import { useContext, useEffect } from "react"
import {
    isRouteErrorResponse,
    Link,
    Outlet,
    ScrollRestoration,
    useNavigation,
    useRouteError,
    type Location,
    type UIMatch,
} from "react-router"
import { COMMON_COPY } from "../lib/commonCopy"
import { defineCopy } from "../lib/copy"
import { AppDisabled } from "./AppDisabled"
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

    // Legacy's kill switch: a maintenance build (`VITE_DISABLE_APP`).
    if (import.meta.env.VITE_DISABLE_APP === "true") {
        return (
            <div className="app">
                <Background />
                <AppDisabled />
            </div>
        )
    }

    return (
        <div className="app">
            <Background />
            <div className="app-content">
                <InstallBanner />
                <AppHeader />
                <PageLoading />
                <Outlet />
            </div>
            <ScrollRestoration getKey={scrollKey} />
        </div>
    )
}

/**
 * While the next page's code (a lazy route) downloads, the current page
 * stays and a bar along the top says the next one is coming (after a short
 * delay, in CSS, so fast loads don't flash it).
 */
function PageLoading() {
    const common = useCopy(COMMON_COPY)
    if (useNavigation().state !== "loading") return null
    return (
        <div className="page-loading-bar" role="status">
            <span className="visually-hidden">{common.loading}</span>
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
    const error = useRouteError()
    const staleChunk = isStaleChunkError(error)

    // A lazy file of an old version is gone: reload onto the current one
    // (once, and not over unsaved work), else offer the button below. Any
    // other error, or a stale file the reload can't fix, is reported.
    useEffect(() => {
        if (staleChunk && guard && reloadForStaleChunks(services, guard)) return
        if (isRouteErrorResponse(error) && error.status === 404) return
        services.telemetry.captureError(error, {
            source: staleChunk ? "stale-chunk" : "route",
        })
    }, [error, staleChunk, services, guard])

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
