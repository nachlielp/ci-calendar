import { createRoot } from "react-dom/client"
import { createBrowserRouter } from "react-router"
import { AppRoot } from "./app/AppRoot"
import { createQueryClient, prefetchAtBoot } from "./app/boot"
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
}
const queryClient = createQueryClient()
prefetchAtBoot(queryClient, services)

const container = document.getElementById("root")
if (!container) throw new Error("Root element not found")

createRoot(container).render(
    <AppRoot
        services={services}
        queryClient={queryClient}
        router={createBrowserRouter(routes)}
    />,
)
