// First, so errors are captured before any other module runs.
import { appTelemetry } from "./app/telemetry/appTelemetry"
import { createRoot } from "react-dom/client"
import { createBrowserRouter } from "react-router"
import { AppRoot } from "./app/AppRoot"
import { bootQueryClient, createQueryClient } from "./app/boot"
import { BUILD_VERSION } from "./app/buildVersion"
import { browserStorage } from "./app/deviceStorage"
import { captureInstallPrompt } from "./app/install/installPrompt"
import { applyLanguageToDocument, storedLanguage } from "./app/language"
import { routes } from "./app/routes"
import type { AppServices } from "./app/services"
import { NO_UPDATES, serviceWorkerUpdates } from "./app/updates/updates"
import { createAuth } from "./data/auth"
import { createDataClient } from "./data/client"
import { createFunctions } from "./data/functions"
import { googlePlacesLoader } from "./data/places"
import "./index.css"

const storage = browserStorage()
// The session comes from storage, synchronously; auth-js loads on demand.
const auth = createAuth({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    storage,
})
const services: AppServices = {
    data: createDataClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        auth,
    ),
    auth,
    functions: createFunctions(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        auth,
    ),
    places: googlePlacesLoader(import.meta.env.VITE_GOOGLE_PLACES_API_KEY),
    now: () => new Date(),
    storage,
    session: browserStorage("sessionStorage"),
    buildVersion: BUILD_VERSION,
    reload: () => window.location.reload(),
    // The service worker exists in production builds only (vite.config.ts).
    updates: import.meta.env.PROD ? serviceWorkerUpdates() : NO_UPDATES,
    telemetry: appTelemetry,
}
// Direction and language before anything renders; the provider keeps them
// in step from here on.
applyLanguageToDocument(storedLanguage(services.storage))
const queryClient = createQueryClient()
bootQueryClient(queryClient, services)
captureInstallPrompt()

const container = document.getElementById("root")
if (!container) throw new Error("Root element not found")

createRoot(container).render(
    <AppRoot
        services={services}
        queryClient={queryClient}
        router={createBrowserRouter(routes)}
    />,
)
