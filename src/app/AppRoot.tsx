import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { RouterProvider, type createBrowserRouter } from "react-router"
import { LanguageProvider } from "./LanguageProvider"
import { ServicesContext, type AppServices } from "./services"
import { createReloadGuard, ReloadGuardContext } from "./updates/reloadGuard"
import { useSafeUpdates } from "./updates/safeUpdates"

type Router = ReturnType<typeof createBrowserRouter>

export function AppRoot({
    services,
    queryClient,
    router,
}: {
    services: AppServices
    queryClient: QueryClient
    router: Router
}) {
    const [reloadGuard] = useState(createReloadGuard)
    useSafeUpdates(services, reloadGuard)
    // Page views per location, analytics after the first paint, and the
    // router for Sentry's tracing (Sentry itself loads from main.tsx).
    useEffect(() => services.telemetry.start(router), [services, router])

    return (
        <ServicesContext.Provider value={services}>
            <ReloadGuardContext.Provider value={reloadGuard}>
                <LanguageProvider>
                    <QueryClientProvider client={queryClient}>
                        <RouterProvider router={router} />
                    </QueryClientProvider>
                </LanguageProvider>
            </ReloadGuardContext.Provider>
        </ServicesContext.Provider>
    )
}
