import type { RouteObject } from "react-router"
import CalendarPage from "../features/calendar/CalendarPage"
import { RootLayout, RouteError } from "./RootLayout"

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
                // (later slices) outrank it.
                element: <CalendarPage />,
                children: [
                    { index: true, element: null },
                    { path: "event/:eventId", element: null },
                    { path: ":eventId", element: null },
                ],
            },
            {
                path: "*",
                lazy: async () => ({
                    Component: (await import("../pages/NotFoundPage")).default,
                }),
            },
        ],
    },
]
