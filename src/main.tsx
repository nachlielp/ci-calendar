import { createRoot } from "react-dom/client"
import { createBrowserRouter } from "react-router"
import { AppRoot } from "./app/AppRoot"
import { bootQueryClient, createQueryClient } from "./app/boot"
import { BUILD_VERSION } from "./app/buildVersion"
import { browserStorage } from "./app/deviceStorage"
import { applyLanguageToDocument, storedLanguage } from "./app/language"
import { routes } from "./app/routes"
import type { AppServices } from "./app/services"
import { createDataClient } from "./data/client"
import "./index.css"

const services: AppServices = {
    data: createDataClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
    ),
    now: () => new Date(),
    storage: browserStorage(),
    buildVersion: BUILD_VERSION,
}
// Direction and language before anything renders; the provider keeps them
// in step from here on.
applyLanguageToDocument(storedLanguage(services.storage))
const queryClient = createQueryClient()
bootQueryClient(queryClient, services)

const container = document.getElementById("root")
if (!container) throw new Error("Root element not found")

createRoot(container).render(
    <AppRoot
        services={services}
        queryClient={queryClient}
        router={createBrowserRouter(routes)}
    />,
)
