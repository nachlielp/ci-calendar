import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { RouterProvider, type createBrowserRouter } from "react-router"
import { LanguageProvider } from "./LanguageProvider"
import { ServicesContext, type AppServices } from "./services"

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
    return (
        <ServicesContext.Provider value={services}>
            <LanguageProvider>
                <QueryClientProvider client={queryClient}>
                    <RouterProvider router={router} />
                </QueryClientProvider>
            </LanguageProvider>
        </ServicesContext.Provider>
    )
}
