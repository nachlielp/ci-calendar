import type { ComponentType } from "react"
import type { RouteObject } from "react-router"
import CalendarPage from "../features/calendar/CalendarPage"
import type { RouteHandle } from "./routeHandle"
import { CALENDAR_ROUTE_ID, RootLayout, RouteError } from "./RootLayout"

/**
 * Text and auth pages: a signed-out visitor gets the header's home button
 * (instead of login).
 */
const textPage: RouteHandle = { homeButton: true }

/** A route whose page is its own chunk, fetched on first visit. */
const lazyPage =
    (load: () => Promise<{ default: ComponentType }>) => async () => ({
        Component: (await load()).default,
    })

// The public calendar is the only eager route; every other page is a lazy
// chunk so it never weighs on the calendar's first paint.
export const routes: RouteObject[] = [
    {
        element: <RootLayout />,
        errorElement: <RouteError />,
        // While a lazy first route loads, index.html's loader is still up.
        HydrateFallback: () => null,
        children: [
            {
                // An event's link opens it over the calendar. `/:eventId` is
                // the legacy short form; a top-level path that names no
                // visible event renders the 404 page. Static top-level pages
                // outrank it.
                id: CALENDAR_ROUTE_ID,
                element: <CalendarPage />,
                children: [
                    { index: true, element: null },
                    { path: "event/:eventId", element: null },
                    { path: ":eventId", element: null },
                ],
            },
            {
                path: "about",
                handle: textPage,
                lazy: lazyPage(() => import("../pages/AboutPage")),
            },
            {
                path: "privacy-policy",
                handle: textPage,
                lazy: lazyPage(() => import("../pages/PrivacyPolicyPage")),
            },
            {
                path: "terms-and-conditions",
                handle: textPage,
                lazy: lazyPage(() => import("../pages/TermsPage")),
            },
            {
                path: "login",
                handle: textPage,
                lazy: lazyPage(() => import("../features/auth/LoginPage")),
            },
            {
                path: "signup",
                handle: textPage,
                lazy: lazyPage(() => import("../features/auth/SignupPage")),
            },
            {
                path: "reset-password-request",
                handle: textPage,
                lazy: lazyPage(
                    () => import("../features/auth/ResetPasswordRequestPage"),
                ),
            },
            {
                // Open to all, as in legacy: the emailed link's session
                // arrives in the URL. Signed out, saving says it failed.
                path: "reset-password",
                handle: textPage,
                lazy: lazyPage(
                    () => import("../features/auth/ResetPasswordPage"),
                ),
            },
            // Pages for signed-in roles go inside `requireRole(roles, [...])`
            // (app/auth/guard.ts), legacy's PrivateRoutes groups.
            {
                path: "*",
                lazy: lazyPage(() => import("../pages/NotFoundPage")),
            },
        ],
    },
]
