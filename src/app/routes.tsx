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
            { index: true, element: <CalendarPage /> },
            {
                path: "*",
                lazy: async () => ({
                    Component: (await import("../pages/NotFoundPage")).default,
                }),
            },
        ],
    },
]
