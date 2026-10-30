import {
    addIntegration,
    reactRouterV7BrowserTracingIntegration,
    wrapCreateBrowserRouterV7,
} from "@sentry/react"
import { useEffect } from "react"
import {
    matchRoutes,
    NavigationType,
    useLocation,
    type DataRouter,
} from "react-router"

/**
 * Sentry's data-router path only checks that these are given: they serve
 * its `<Routes>`/`useRoutes` instrumentation, which this app doesn't use.
 * React Router's own would add them to `/`'s initial JS for nothing.
 */
const useNavigationType = () => NavigationType.Pop
const createRoutesFromChildren = () => []

/**
 * Browser tracing with the data router: the page load (named by its route
 * once this attaches) and every navigation after it. The router exists
 * before Sentry loads, so it is handed to Sentry's wrapper as already made.
 */
export function startTracing(router: DataRouter) {
    addIntegration(
        reactRouterV7BrowserTracingIntegration({
            useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes,
        }),
    )
    wrapCreateBrowserRouterV7(() => router)(router.routes)
}
