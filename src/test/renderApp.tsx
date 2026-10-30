import { render } from "@testing-library/react"
import { createMemoryRouter } from "react-router"
import { AppRoot } from "../app/AppRoot"
import { createQueryClient, prefetchAtBoot } from "../app/boot"
import { routes } from "../app/routes"
import type { AppServices } from "../app/services"
import { createFakeDataClient, type FakeDataClient } from "./fakeDataClient"

interface RenderAppOptions {
    path?: string
    fake?: FakeDataClient
    now?: Date
}

/**
 * Boots and renders the real app (real routes, real queries, the same boot
 * prefetch as production) against the fake data client — the one seam tests
 * drive the app through.
 */
export function renderApp({
    path = "/",
    fake = createFakeDataClient(),
    now = new Date("2026-10-30T09:00:00Z"),
}: RenderAppOptions = {}) {
    const services: AppServices = { data: fake.client, now: () => now }
    const queryClient = createQueryClient()
    queryClient.setDefaultOptions({ queries: { retry: false } })
    prefetchAtBoot(queryClient, services)
    const router = createMemoryRouter(routes, { initialEntries: [path] })

    const view = render(
        <AppRoot
            services={services}
            queryClient={queryClient}
            router={router}
        />,
    )
    return { ...view, fake }
}
